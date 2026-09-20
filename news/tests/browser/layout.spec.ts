import { test, expect } from '@playwright/test';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

async function routes(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isDirectory() && !['_astro', 'pagefind'].includes(entry.name),
      )
      .map((entry) => routes(path.join(directory, entry.name))),
  );
  const own = entries.some((entry) => entry.name === 'index.html')
    ? [
        `/${path.relative('dist', directory).replaceAll('\\', '/')}/`.replace(
          '//',
          '/',
        ),
      ]
    : [];
  return [...own, ...nested.flat()];
}
test('all generated URLs are complete and internal links resolve', async ({
  page,
  request,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Full crawl on Chromium; critical journeys cover all engines',
  );
  test.setTimeout(300000);
  const checked = new Set<string>();
  for (const route of await routes('dist')) {
    await page.goto('/news' + route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1);
    const links = await page
      .locator('a[href^="/"], link[href^="/"], [src^="/"]')
      .evaluateAll((nodes) =>
        nodes.map(
          (node) => node.getAttribute('href') || node.getAttribute('src')!,
        ),
      );
    for (const link of links.filter((href) => !checked.has(href))) {
      checked.add(link);
      expect((await request.get(link)).ok(), `${route} → ${link}`).toBe(true);
    }
  }
});
test('layouts reflow at all target sizes in both themes and languages', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Visual matrix captured with Chromium');
  test.setTimeout(180000);
  const all = await routes('dist');
  const representatives = all.filter((route) => !route.includes('/artigos/'));
  const article = all.find((route) => route.startsWith('/artigos/'));
  if (article) representatives.push(article, `/en${article}`);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of representatives) {
      await page.goto('/news' + route);
      for (const theme of ['light', 'dark']) {
        await page.evaluate((value) => {
          document.documentElement.dataset.theme = value;
          document.documentElement.style.setProperty('--article-size', '24px');
        }, theme);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        expect(overflow, `${route}/${width}/${theme}`).toBe(false);
        await page.screenshot({
          path: `artifacts/screens/${route.replaceAll('/', '-') || 'home'}-${width}-${theme}.png`,
          fullPage: true,
        });
      }
    }
  }
  await page.goto('/news/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});
