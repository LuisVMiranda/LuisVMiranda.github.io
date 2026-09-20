import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { sections } from '../../src/modules/content/sections';
import { readContent } from '../../scripts/content-files';
import { formatDate } from '../../src/modules/content/urls';

async function checkSectionLayout(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  const heading = page.locator('.site-header h1');
  await expect(heading).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.section-header')).toHaveCount(0);
  const header = (await page.locator('.site-header').boundingBox())!;
  const firstStory = (await page
    .locator('.ranked-stories h3')
    .first()
    .boundingBox())!;
  expect(header.height).toBeLessThan(width === 320 ? 240 : 175);
  expect(firstStory.y - header.y - header.height).toBeLessThan(180);
  expect(
    await page.locator('.language-link').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return (
        range.getBoundingClientRect().height /
        Number.parseFloat(getComputedStyle(element).lineHeight)
      );
    }),
  ).toBeLessThan(1.2);
  expect(
    await page
      .locator('.site-header time')
      .evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize),
      ),
  ).toBeGreaterThanOrEqual(10.5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

test('all section mastheads show their translated title and edition date without a second hero', async ({
  page,
}) => {
  test.setTimeout(120000);
  const { editions } = await readContent();
  const edition = [...editions].sort((a, b) =>
    b.cutoff.localeCompare(a.cutoff),
  )[0]!;
  for (const locale of ['pt-BR', 'en'] as const) {
    const prefix = locale === 'en' ? '/news/en/' : '/news/';
    for (const section of sections) {
      await page.goto(`${prefix}secao/${section.id}/`);
      await expect(page.locator('.site-header h1')).toHaveText(
        section.label[locale],
      );
      await expect(page.locator('.site-header time')).toHaveText(
        formatDate(edition.cutoff, locale),
      );
      await expect(page.locator('.site-header time')).toHaveAttribute(
        'datetime',
        edition.cutoff,
      );
      for (const width of [320, 768, 1440])
        await checkSectionLayout(page, width);
    }
  }
});

test('compact section navigation remains accessible in both themes and languages', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 320, height: 900 });
  for (const prefix of ['/news/', '/news/en/']) {
    await page.goto(`${prefix}secao/economia/`);
    await page.locator('.skip-link').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      const report = await new AxeBuilder({ page }).analyze();
      expect(
        report.violations.filter((item) =>
          ['serious', 'critical'].includes(item.impact || ''),
        ),
      ).toEqual([]);
    }
  }
});

test('story dates are visually separated from summaries in both homepage languages', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const prefix of ['/news/', '/news/en/']) {
    await page.goto(prefix);
    const card = page.locator('.home-section .story-card').first();
    const summary = (await card.locator('.story-card__summary').boundingBox())!;
    const date = card.locator('.story-card__date');
    const dateBox = (await date.boundingBox())!;
    expect(dateBox.y - summary.y - summary.height).toBeGreaterThanOrEqual(12);
    await expect(date).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}/);
  }
});
