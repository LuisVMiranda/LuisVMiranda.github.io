import { loadCatalog, previewMode } from '../../modules/content/catalog';
import { feed } from '../../modules/content/feed';
import type { APIContext } from 'astro';
export async function GET({ site }: APIContext): Promise<Response> {
  const { articles } = await loadCatalog();
  return new Response(feed(previewMode ? [] : articles, 'en', site!), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
