import assert from 'node:assert/strict';
import { resolve } from 'node:path';

export async function testScene(page, check) {
  const frames = () => page.locator('#hero-art').getAttribute('data-frames').then(Number);
  await check('Real WebGL scene animates and respects pause / reduced motion', async () => {
    await page.waitForFunction(
      () => document.querySelector('#hero-art').dataset.renderer === 'webgl',
    );
    const before = await frames();
    await page.waitForFunction(
      (previous) => Number(document.querySelector('#hero-art').dataset.frames) > previous,
      before,
      { timeout: 10000 },
    );
    await page.locator('#motion-toggle').click();
    await page.waitForTimeout(100);
    const paused = await frames();
    await page.waitForTimeout(200);
    assert.equal(await frames(), paused);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
  });
  await check('3D rotate, reset, and pointer drag visibly change geometry', async () => {
    const canvas = page.locator('#voice-scene');
    const original = await canvas.screenshot();
    await page.locator('#rotate-scene').click();
    await page.waitForTimeout(80);
    const rotated = await canvas.screenshot();
    assert.ok(!original.equals(rotated));
    await page.locator('#reset-scene').click();
    await page.waitForTimeout(80);
    const reset = await canvas.screenshot();
    assert.ok(!reset.equals(rotated));
    const bounds = await canvas.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 70, bounds.y + bounds.height / 2 + 30);
    await page.mouse.up();
    await page.waitForTimeout(80);
    assert.ok(!(await canvas.screenshot()).equals(reset));
    await page.locator('#reset-scene').click();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
  await check('Animation suspends when the hero leaves the viewport', async () => {
    await page.locator('#questions').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const before = await frames();
    await page.waitForTimeout(200);
    assert.equal(await frames(), before);
  });
}

export async function testLayouts(page, check, artifacts) {
  for (const width of [320, 390, 768, 1440]) {
    await check(`Responsive layout at ${width}px has no horizontal overflow`, async () => {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(150);
      const size = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: innerWidth,
      }));
      assert.ok(size.scroll <= size.inner, JSON.stringify(size));
      await page.screenshot({ path: resolve(artifacts, `layout-${width}.png`), fullPage: true });
    });
  }
}

export async function testFeatures(page, check) {
  await check('All six language previews and both engine explanations work', async () => {
    const labels = {
      en: 'Preferences',
      pt: 'Preferências',
      es: 'Preferencias',
      fr: 'Préférences',
      it: 'Preferenze',
      de: 'Einstellungen',
    };
    for (const [code, label] of Object.entries(labels)) {
      await page.locator(`[data-ui-language="${code}"]`).click();
      assert.equal(await page.locator('#preview-preferences').textContent(), label);
      assert.equal(await page.locator('.language-preview').getAttribute('lang'), code);
    }
    await page.locator('[data-engine="cloud"]').click();
    assert.match(await page.locator('#engine-detail').textContent(), /Gemini Live/);
    await page.locator('[data-engine="local"]').click();
    assert.match(await page.locator('#engine-detail').textContent(), /processed locally/);
  });
  await check('FAQ works with keyboard and skip link targets main content', async () => {
    const summary = page.locator('summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    assert.equal(
      await page
        .locator('details')
        .first()
        .evaluate((element) => element.open),
      true,
    );
    await page.keyboard.press('Enter');
    assert.equal(
      await page
        .locator('details')
        .first()
        .evaluate((element) => element.open),
      false,
    );
    assert.equal(await page.locator('.skip-link').getAttribute('href'), '#main');
    assert.equal(await page.locator('main#main').count(), 1);
  });
}

export async function testFallbacks(browser, base, check, artifacts) {
  await check('WebGL-disabled fallback retains an operable demo', async () => {
    const page = await browser.newPage();
    try {
      await page.addInitScript(() => {
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, options) {
          return type.includes('webgl') ? null : getContext.call(this, type, options);
        };
      });
      await page.goto(base);
      await page.waitForFunction(
        () => document.querySelector('#hero-art').dataset.renderer === 'fallback',
      );
      assert.equal(await page.locator('.scene-fallback').isVisible(), true);
      await page.screenshot({ path: resolve(artifacts, 'fallback.png') });
      await page.locator('#record-button').click();
      await page.waitForFunction(
        () => document.querySelector('#record-button').dataset.state === 'done',
      );
    } finally {
      await page.close();
    }
  });
  await check('No-JavaScript mode keeps content and downloads available', async () => {
    const page = await browser.newPage({ javaScriptEnabled: false });
    try {
      const response = await page.goto(base);
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('.noscript-note').isVisible(), true);
      assert.equal(await page.locator('.download-card').count(), 2);
      await page.locator('summary').first().click();
      assert.equal(await page.locator('details[open]').count(), 1);
    } finally {
      await page.close();
    }
  });
  await check('Touch input supports hold/release on mobile', async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    try {
      await page.goto(base);
      await page.locator('#record-button').tap();
      await page.waitForFunction(
        () => document.querySelector('#record-button').dataset.state === 'done',
      );
      assert.ok((await page.locator('#demo-output').inputValue()).length > 30);
    } finally {
      await page.close();
    }
  });
}
