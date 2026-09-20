import { createHash } from 'node:crypto';
import type { Article, Edition, Approval } from '../content/types';
import { sections } from '../content/sections';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contentRevision(
  articles: Article[],
  editions: Edition[],
): string {
  const byId = <T extends { id: string }>(a: T, b: T) =>
    a.id.localeCompare(b.id);
  return createHash('sha256')
    .update(
      canonical({
        articles: [...articles].sort(byId),
        editions: [...editions].sort(byId),
      }),
    )
    .digest('hex');
}

export function isApproved(
  articles: Article[],
  editions: Edition[],
  approval: Approval | null,
): boolean {
  return approval?.revision === contentRevision(articles, editions);
}

function assertUnique(values: string[], description: string): void {
  if (new Set(values).size !== values.length)
    throw new Error(`Duplicate ${description}`);
}

function validateSection(
  edition: Edition,
  id: string,
  articles: Article[],
): void {
  const section = edition.sections[id as keyof Edition['sections']];
  assertUnique(section.articleIds, `ranks in ${edition.id}/${id}`);
  if (section.articleIds.length < 10 && !section.shortfall.trim()) {
    throw new Error(`Missing shortfall in ${edition.id}/${id}`);
  }
  for (const articleId of section.articleIds) {
    const article = articles.find((entry) => entry.id === articleId);
    if (!article) throw new Error(`Broken article reference: ${articleId}`);
    if (
      article.section !== id &&
      !article.secondarySections.includes(id as Article['section'])
    ) {
      throw new Error(`Section mismatch: ${articleId}/${id}`);
    }
    if (Date.parse(article.publishedAt) > Date.parse(edition.cutoff)) {
      throw new Error(`Article after edition cutoff: ${articleId}`);
    }
  }
}

export function validateCatalog(
  articles: Article[],
  editions: Edition[],
): void {
  assertUnique(
    articles.map((article) => article.id),
    'article identities',
  );
  assertUnique(
    articles.map((article) => article.slug),
    'article slugs',
  );
  assertUnique(
    editions.map((edition) => edition.id),
    'edition identities',
  );
  for (const edition of editions) {
    for (const section of sections)
      validateSection(edition, section.id, articles);
    if (
      edition.leadArticleId &&
      !articles.some((article) => article.id === edition.leadArticleId)
    ) {
      throw new Error(`Missing lead: ${edition.leadArticleId}`);
    }
  }
}
