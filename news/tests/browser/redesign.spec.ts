import { test, expect } from '@playwright/test';
import { readContent } from '../../scripts/content-files';
import { sections } from '../../src/modules/content/sections';

test('the main headline opens its article by keyboard in the selected language', async ({
  page,
}) => {
  for (const language of ['', 'en/']) {
    await page.goto(`/news/${language}`);
    const headline = page.locator('main h1 a');
    const title = await headline.textContent();
    await expect(headline).toHaveAttribute(
      'href',
      new RegExp(`^/news/${language}artigos/`),
    );
    await headline.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-article-body]')).toBeVisible();
    await expect(page.locator('main h1')).toHaveText(title!);
  }
});

test('long article headlines use the available desktop reading space', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const language of ['', 'en/']) {
    await page.goto(
      `/news/${language}artigos/politica-flavio-bolsonaro-plano/`,
    );
    const header = page.locator('.article-header');
    const title = page.locator('h1');
    const body = page.locator('[data-article-body]');
    expect((await header.boundingBox())!.width).toBeGreaterThanOrEqual(940);
    expect((await body.boundingBox())!.width).toBeGreaterThanOrEqual(700);
    const lines = await title.evaluate((element) => {
      const lineHeight = Number.parseFloat(
        getComputedStyle(element).lineHeight,
      );
      return element.getBoundingClientRect().height / lineHeight;
    });
    expect(lines).toBeLessThanOrEqual(3.1);
    const increase = page.locator('[data-font-increase]');
    while (await increase.isEnabled()) await increase.click();
    await expect(body).toHaveCSS('font-size', '24px');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('arrow-only scroll-to-top supports keyboard, both locales and reduced motion', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 600 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const language of ['', 'en/']) {
    await page.goto(`/news/${language}`);
    const button = page.locator('[data-scroll-top]');
    await expect(button).toBeHidden();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName(
      language ? 'Back to top' : 'Voltar ao topo',
    );
    await expect(button.locator('svg')).toHaveCount(1);
    await expect(button).toHaveCSS('border-radius', '0px');
    const size = (await button.boundingBox())!;
    expect(size.width).toBeCloseTo(43.2, 1);
    expect(size.height).toBeCloseTo(43.2, 1);
    expect((await button.textContent())!.trim()).toBe('');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect(button).toBeHidden();
    await expect(page.locator('#main')).toBeFocused();
  }
});

test('published article and navigation remain readable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(
    'http://127.0.0.1:4321/news/artigos/politica-flavio-bolsonaro-plano/',
  );
  await expect(page.locator('h1')).toContainText('Flávio Bolsonaro');
  await expect(page.locator('[data-article-body] p').first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Read in English', exact: true }),
  ).toBeVisible();
  await context.close();
});

test('every section preserves the approved edition order in both languages', async ({
  page,
}) => {
  const { articles, editions } = await readContent();
  const edition = [...editions].sort((a, b) =>
    b.cutoff.localeCompare(a.cutoff),
  )[0]!;
  const slugs = new Map(articles.map((article) => [article.id, article.slug]));
  for (const locale of ['pt-BR', 'en'] as const) {
    const prefix = locale === 'en' ? '/news/en/' : '/news/';
    for (const section of sections) {
      await page.goto(`${prefix}secao/${section.id}/`);
      await expect(page.locator('h1')).toHaveText(section.label[locale]);
      const links = page.locator('.ranked-stories h3 a');
      expect(
        await links.evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('href')),
        ),
      ).toEqual(
        edition.sections[section.id].articleIds.map(
          (id) => `${prefix}artigos/${slugs.get(id)}/`,
        ),
      );
    }
  }
});
