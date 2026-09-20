import { expect, test, type Page } from '@playwright/test';

const searchPath = '/news/busca/';
const englishSearchPath = '/news/en/busca/';

function searchParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

async function expectNewsLinks(page: Page, prefix: string): Promise<void> {
  const links = page.locator('[data-search-results] a');
  await expect(links).not.toHaveCount(0);
  const hrefs = await links.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAnchorElement).getAttribute('href') ?? ''),
  );
  expect(hrefs.every((href: string) => href.startsWith(prefix))).toBe(true);
  if (prefix === '/news/') {
    expect(hrefs.every((href: string) => !href.startsWith('/news/en/'))).toBe(
      true,
    );
  }
}

test('Portuguese search filters, preserves history, and keeps result URLs under /news/', async ({
  page,
}) => {
  await page.goto(searchPath);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

  await page.locator('[data-search-input]').fill('Brasil');
  await page
    .locator('[data-search-form]')
    .getByRole('button', { name: 'Pesquisar' })
    .click();
  await expect.poll(() => searchParams(page.url()).get('q')).toBe('Brasil');
  await expectNewsLinks(page, '/news/');

  await page.locator('[data-search-section]').selectOption('brasil');
  await expect
    .poll(() => searchParams(page.url()).get('section'))
    .toBe('brasil');
  await expectNewsLinks(page, '/news/');

  await page.goBack();
  await expect.poll(() => searchParams(page.url()).get('section')).toBeNull();
  await expect(page.locator('[data-search-input]')).toHaveValue('Brasil');
  await expect(page.locator('[data-search-section]')).toHaveValue('');

  await page.goBack();
  await expect.poll(() => searchParams(page.url()).toString()).toBe('');
  await expect(page.locator('[data-search-input]')).toHaveValue('');
});

test('English search uses the English Pagefind index and section filter', async ({
  page,
}) => {
  await page.goto(englishSearchPath);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.locator('[data-search-input]').fill('Brazil');
  await page.locator('[data-search-section]').selectOption('brasil');
  await expect.poll(() => searchParams(page.url()).get('q')).toBe('Brazil');
  await expect
    .poll(() => searchParams(page.url()).get('section'))
    .toBe('brasil');
  await expectNewsLinks(page, '/news/en/');
});

test('search reports an empty state', async ({ page }) => {
  await page.goto(`${searchPath}?q=qzxvnotfoundterm`);
  await expect(page.locator('[data-search-status]')).toHaveText(
    'Nenhum resultado encontrado.',
  );
});

test('search reports an unavailable state when Pagefind cannot load', async ({
  page,
}) => {
  await page.route('**/news/pagefind/pagefind.js', (route) => route.abort());
  await page.goto(searchPath);
  await page.locator('[data-search-input]').fill('Brasil');
  await page
    .locator('[data-search-form]')
    .getByRole('button', { name: 'Pesquisar' })
    .click();
  await expect(page.locator('[data-search-status]')).toHaveText(
    'Não foi possível carregar a busca agora.',
  );
  await expect(page.locator('[data-search]')).toHaveAttribute(
    'data-search-state',
    'error',
  );
});
