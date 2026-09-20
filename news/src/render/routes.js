import { sections } from '../modules/content/sections.ts';
import { archiveRoutes } from '../modules/editions/routes.ts';

/** @param {import('./types.ts').Catalog} catalog
 * @returns {import('./types.ts').RouteContext[]}
 */
export function createRoutes(catalog) {
  /** @type {import('../modules/content/types.ts').Locale[]} */
  const locales = ['pt-BR', 'en'];
  const editions = [...catalog.editions].sort((a, b) =>
    b.cutoff.localeCompare(a.cutoff),
  );
  const paths = [
    '',
    'busca',
    'editorial',
    '404',
    ...sections.map(({ id }) => `secao/${id}`),
    ...catalog.articles.map(({ slug }) => `artigos/${slug}`),
    ...editions.map(({ id }) => `edicao/${id}`),
  ];
  return locales.flatMap((locale) => [
    ...paths.map((path) => ({ ...catalog, editions, locale, path })),
    ...archiveRoutes(editions).map((route) => ({
      ...catalog,
      locale,
      ...route,
    })),
  ]);
}
