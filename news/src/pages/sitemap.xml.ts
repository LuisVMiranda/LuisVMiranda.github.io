import type { APIContext } from 'astro';
import { loadCatalog, previewMode } from '../modules/content/catalog';
import { sections } from '../modules/content/sections';
import { localUrl } from '../modules/content/urls';
import { xml } from '../modules/content/feed';
import type { Locale } from '../modules/content/types';
import { archiveRoutes } from '../modules/editions/routes';
export async function GET({ site }: APIContext): Promise<Response> {
  const { articles, editions } = await loadCatalog();
  const paths = [
    '',
    ...archiveRoutes(editions).map((route) => route.path),
    'editorial',
    ...sections.map((section) => `secao/${section.id}`),
    ...articles.map((article) => `artigos/${article.slug}`),
    ...editions.map((edition) => `edicao/${edition.id}`),
  ];
  const locales: Locale[] = ['pt-BR', 'en'];
  const urls = previewMode
    ? ''
    : locales
        .flatMap((locale) =>
          paths.map(
            (path) =>
              `<url><loc>${xml(new URL(localUrl(path, locale), site).href)}</loc></url>`,
          ),
        )
        .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
