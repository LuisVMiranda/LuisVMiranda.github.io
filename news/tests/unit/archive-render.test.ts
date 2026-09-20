import { expect, it } from 'vitest';
import { Window } from 'happy-dom';
import archive from '../../src/render/pages/archive.js';
import { readContent } from '../../scripts/content-files';
import type { RenderContext } from '../../src/render/types';

it('archive pagination keeps descending dates, unique counts and bilingual links', async () => {
  const catalog = await readContent();
  const distinctCount = new Set(
    Object.values(catalog.editions[0]!.sections).flatMap(
      (section) => section.articleIds,
    ),
  ).size;
  const editions = Array.from({ length: 12 }, (_, index) => ({
    ...catalog.editions[0]!,
    id: `edition-${index + 1}`,
    cutoff: `2026-09-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
  }));
  for (const locale of ['pt-BR', 'en'] as const) {
    const context: RenderContext = {
      articles: catalog.articles,
      editions,
      locale,
      path: 'arquivo/pagina/2',
      page: 2,
      pageCount: 2,
      preview: false,
      site: 'https://luisvmiranda.github.io',
      assets: { styles: '', client: '', search: '', themeInit: '' },
    };
    const window = new Window();
    window.document.body.innerHTML = archive(context);
    const rows = window.document.querySelectorAll('.edition-row');
    expect(rows).toHaveLength(2);
    const prefix = locale === 'en' ? '/news/en/' : '/news/';
    expect(rows[0]!.querySelector('a')!.getAttribute('href')).toBe(
      `${prefix}edicao/edition-2/`,
    );
    expect(rows[1]!.querySelector('a')!.getAttribute('href')).toBe(
      `${prefix}edicao/edition-1/`,
    );
    expect(rows[0]!.querySelector('.edition-count')!.textContent).toMatch(
      new RegExp(`^${distinctCount} `),
    );
    expect(
      window.document.querySelector('.pagination a')!.getAttribute('href'),
    ).toBe(`${prefix}arquivo/`);
    await window.close();
  }
});
