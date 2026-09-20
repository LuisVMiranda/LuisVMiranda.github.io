import type { Article, Locale, SectionId } from './types';

export const portalBase = '/news/';

export function assetUrl(path: string): string {
  return `${portalBase}${path.replace(/^\/+/, '')}`;
}

export function routePath(path: string, locale: Locale): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const prefix = locale === 'en' ? '/en/' : '/';
  return clean ? `${prefix}${clean}/` : prefix;
}

export function localUrl(path: string, locale: Locale): string {
  return assetUrl(routePath(path, locale));
}

export function articleUrl(article: Article, locale: Locale): string {
  return localUrl(`artigos/${article.slug}`, locale);
}

export function sectionUrl(id: SectionId, locale: Locale): string {
  return localUrl(`secao/${id}`, locale);
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'long',
  }).format(new Date(iso));
}

export function articleDate(article: Article): string {
  return article.publishedDate || article.publishedAt;
}

export function formatArticleDate(article: Article, locale: Locale): string {
  if (!article.publishedDate) return formatDate(article.publishedAt, locale);
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    dateStyle: 'long',
  }).format(new Date(article.publishedDate));
}
