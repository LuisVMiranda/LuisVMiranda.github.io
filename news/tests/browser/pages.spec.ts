import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';

test('directory and explicit index URLs serve the built bilingual homepage', async ({
  page,
  request,
}) => {
  for (const [path, locale] of [
    ['/news/', 'pt-BR'],
    ['/news/en/', 'en'],
  ] as const) {
    const directory = await request.get(path);
    const index = await request.get(`${path}index.html`);
    expect(directory.status()).toBe(200);
    expect(index.status()).toBe(200);
    expect(await index.text()).toBe(await directory.text());
    await page.goto(`${path}index.html`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('link[rel="stylesheet"]')).toHaveAttribute(
      'href',
      /^\/news\/_astro\/.+\.css$/,
    );
    await expect(
      page.getByText('Local development', { exact: true }),
    ).toHaveCount(0);
  }
});

test('the combined artifact preserves the portfolio and keeps project sources private', async ({
  request,
}) => {
  const root = await request.get('/');
  expect(await root.text()).toBe(await readFile('../index.html', 'utf8'));
  for (const path of [
    'content/approval.json',
    'research/editorial/brasil.json',
    'src/pages/index.astro',
    'package.json',
    'reviews/pages.json',
    'README.md',
    'news-report.md',
  ]) {
    expect((await request.get(`/news/${path}`)).status()).toBe(404);
  }
});

test('GitHub Pages root 404 localizes without changing the missing address', async ({
  page,
}) => {
  for (const locale of ['pt-BR', 'en']) {
    const path =
      locale === 'en' ? '/news/en/missing-address/' : '/news/missing-address/';
    expect((await page.goto(path))?.status()).toBe(404);
    await expect(page).toHaveURL(path);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('h1:visible')).toHaveCount(1);
    const result = await new AxeBuilder({ page }).analyze();
    expect(
      result.violations.filter((item) =>
        ['serious', 'critical'].includes(item.impact || ''),
      ),
    ).toEqual([]);
  }
});

test('two-times zoom viewport keeps reading and controls available', async ({
  browser,
}) => {
  // A 1440 physical-pixel window at 200% zoom exposes a 720 CSS-pixel viewport.
  const context = await browser.newContext({
    viewport: { width: 720, height: 500 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  for (const route of [
    '/news/',
    '/news/en/artigos/brasil-petrobras-subsidio-diesel/',
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    await expect(page.locator('h1')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  }
  await context.close();
});
