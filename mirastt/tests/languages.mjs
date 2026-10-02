import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import en from '../scripts/locales/en.js';

const codes = ['en', 'pt', 'es', 'fr', 'it', 'de'];

export async function testLanguages(page, check, artifacts) {
  await check('Six complete catalogs preserve placeholders and readable copy', async () => {
    for (const code of codes) {
      const { default: messages } = await import(`../scripts/locales/${code}.js`);
      assert.deepEqual(Object.keys(messages).sort(), Object.keys(en).sort());
      for (const [key, source] of Object.entries(en)) {
        assert.ok(messages[key].trim(), `${code}: ${key} is empty`);
        assert.deepEqual(messages[key].match(/\{\w+\}/g), source.match(/\{\w+\}/g));
      }
    }
  });
  for (const code of codes) {
    await check(
      `${code}: full page, metadata, dynamic demo, mobile layout and persistence`,
      async () => {
        const { default: messages } = await import(`../scripts/locales/${code}.js`);
        await page.selectOption('#site-language', code);
        assert.equal(
          await page.locator('html').getAttribute('lang'),
          code === 'pt' ? 'pt-BR' : code,
        );
        assert.equal(await page.title(), messages.mira_stt_a_little_space_for_your_voice);
        assert.equal(
          await page.locator('#site-language').getAttribute('aria-label'),
          messages.website_language,
        );
        const untranslated = await page.evaluate(
          ({ sources, messages }) => {
            const bySource = new Map(Object.entries(sources).map(([key, source]) => [source, key]));
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT),
              missing = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              if (
                node.parentElement.closest(
                  '[data-no-translate],kbd,.wordmark,[data-demo-language],script,#live-preview',
                )
              )
                continue;
              const text = node.textContent.replace(/\s+/g, ' ').trim(),
                key = bySource.get(text);
              if (key && messages[key] !== text) missing.push(key);
            }
            return missing;
          },
          { sources: en, messages },
        );
        assert.deepEqual(untranslated, []);
      for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 950 });
          await page.evaluate(() => window.scrollTo(0, 0));
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          assert.ok(await page.locator('#site-language').isVisible());
          await page.screenshot({
            path: resolve(artifacts, `language-${code}-${width}.png`),
            fullPage: true,
          });
        }
        await page.locator('[data-engine="cloud"]').click();
        assert.equal(
          await page.locator('#engine-detail').textContent(),
          messages.connect_openai_gemini_live_or_a_compatible_api_a,
        );
        await page.locator('#reset-demo').click();
        await page.locator('#record-button').focus();
        await page.keyboard.down('Space');
        assert.equal(await page.locator('#record-label').textContent(), messages.release_to_finish);
        await page.keyboard.up('Space');
        await page.waitForFunction(
          () => document.querySelector('#record-button').dataset.state === 'done',
        );
        assert.equal(
          await page.locator('#editor-status').textContent(),
          messages.delivered_edit_it_or_copy_it,
        );
        await page.locator('#demo-output').fill('User text: Olá. Bonjour. Hallo.');
        await page.selectOption('#site-language', code === 'de' ? 'fr' : 'de');
        assert.equal(
          await page.locator('#demo-output').inputValue(),
          'User text: Olá. Bonjour. Hallo.',
        );
        await page.selectOption('#site-language', code);
        await page.reload();
        await page.waitForFunction(() => document.querySelector('#hero-art').dataset.renderer);
        assert.equal(await page.locator('#site-language').inputValue(), code);
      },
    );
  }
  await page.selectOption('#site-language', 'en');
}

export async function testLanguageBoundaries(browser, base, check) {
  await check('Regional browser locale and disabled storage keep the selector usable', async () => {
    const page = await browser.newPage({ locale: 'pt-BR' });
    try {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          get() {
            throw new DOMException('denied');
          },
        });
      });
      await page.goto(base);
      await page.waitForFunction(() => document.documentElement.lang === 'pt-BR');
      await page.selectOption('#site-language', 'fr');
      assert.equal(await page.locator('html').getAttribute('lang'), 'fr');
      await page.locator('#record-button').click();
      await page.selectOption('#site-language', 'de');
      await page.waitForFunction(
        () => document.querySelector('#record-button').dataset.state === 'done',
      );
      assert.equal(
        await page.locator('#editor-status').textContent(),
        'Eingefügt · bearbeiten oder kopieren',
      );
    } finally {
      await page.close();
    }
  });
}
