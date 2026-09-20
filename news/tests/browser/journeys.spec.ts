import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, readdir } from 'node:fs/promises';
import type { Article } from '../../src/modules/content/types';

async function firstArticle(): Promise<Article | undefined> {
  const files = (await readdir('content/articles')).filter((file) =>
    file.endsWith('.json'),
  );
  const file = files[0];
  return file
    ? (JSON.parse(
        await readFile(`content/articles/${file}`, 'utf8'),
      ) as Article)
    : undefined;
}
test('navigation, language identity, keyboard and theme persist', async ({
  page,
}) => {
  await page.goto('/news/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.locator('[data-theme-toggle]').click();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.locator('.desktop-nav a[href="/news/secao/brasil/"]').click();
  await page
    .getByRole('link', { name: 'Read in English', exact: true })
    .click();
  await expect(page).toHaveURL('/news/en/secao/brasil/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
});
test('mobile navigation and localized missing pages work', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/news/');
  await page.locator('.mobile-nav summary').click();
  await page.locator('.mobile-nav a[href="/news/secao/mundo/"]').click();
  await expect(page.locator('h1')).toHaveText('Mundo');
  const response = await page.goto('/news/en/not-a-real-page/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
test('article font limits and bilingual identity', async ({ page }) => {
  const article = await firstArticle();
  test.skip(!article, 'No researched draft available');
  await page.goto(`/news/artigos/${article!.slug}/`);
  for (let index = 0; index < 3; index++)
    await page.locator('[data-font-increase]').click();
  await expect(page.locator('[data-font-increase]')).toBeDisabled();
  await expect(page.locator('[data-article-body]')).toHaveCSS(
    'font-size',
    '24px',
  );
  await page
    .getByRole('link', { name: 'Read in English', exact: true })
    .click();
  await expect(page).toHaveURL(`/news/en/artigos/${article!.slug}/`);
  await expect(page.locator('[data-article-body]')).toHaveCSS(
    'font-size',
    '24px',
  );
  for (let index = 0; index < 4; index++)
    await page.locator('[data-font-decrease]').click();
  await expect(page.locator('[data-font-decrease]')).toBeDisabled();
});
test('essential reading survives disabled storage', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('Blocked');
      },
    }),
  );
  await page.goto('/news/');
  await expect(page.locator('h1')).toBeVisible();
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    /light|dark/,
  );
});
test('representative pages meet accessibility requirements', async ({
  page,
}) => {
  test.setTimeout(120000);
  const article = await firstArticle();
  const routes = [
    '/',
    '/en/',
    '/secao/brasil/',
    '/en/secao/ciencia/',
    '/busca/',
    '/en/arquivo/',
    '/editorial/',
    '/en/404/',
  ];
  if (article)
    routes.push(`/artigos/${article.slug}/`, `/en/artigos/${article.slug}/`);
  for (const route of routes) {
    await page.goto('/news' + route);
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.filter((item) =>
          ['serious', 'critical'].includes(item.impact || ''),
        ),
        `${route} ${theme}`,
      ).toEqual([]);
    }
  }
});
