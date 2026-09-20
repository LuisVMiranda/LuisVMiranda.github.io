import type { Article, Locale } from './types';
import { articleUrl, localUrl } from './urls';

export function xml(value: string): string {
  return value.replace(
    /[<>&"']/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[char]!,
  );
}
export function feed(articles: Article[], locale: Locale, site: URL): string {
  const items = [...articles]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((article) => {
      const copy = article.translations[locale];
      const url = new URL(articleUrl(article, locale), site).href;
      const date = article.publishedDate
        ? ''
        : `<pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>`;
      return `<item><title>${xml(copy.title)}</title><link>${xml(url)}</link><guid>${xml(url)}</guid><description>${xml(copy.summary)}</description>${date}</item>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Notícias</title><link>${xml(new URL(localUrl('', locale), site).href)}</link><description>${locale === 'en' ? 'Sources, context and clarity' : 'Fontes, contexto e clareza'}</description><language>${locale}</language>${items}</channel></rss>`;
}
