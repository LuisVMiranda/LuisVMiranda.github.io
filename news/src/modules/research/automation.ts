import type { Article, Edition, Locale, SectionId } from '../content/types';
import { sections } from '../content/sections';

const locales: Locale[] = ['pt-BR', 'en'];

function selectedIds(edition: Edition, section: SectionId): string[] {
  return edition.sections[section]?.articleIds ?? [];
}

function translationIssues(
  id: string,
  locale: Locale,
  translation: Article['translations'][Locale],
): string[] {
  const issues: string[] = [];
  if (!translation.aiSummary)
    issues.push(`${id}/${locale} is missing an AI summary`);
  if (translation.paragraphs.length < 3)
    issues.push(`${id}/${locale} must contain at least 3 paragraphs`);
  return issues;
}

function articleIssues(
  article: Article,
  requireRichArticle: boolean,
): string[] {
  if (!requireRichArticle) return [];
  return locales.flatMap((locale) =>
    translationIssues(article.id, locale, article.translations[locale]),
  );
}

function sectionIssues(
  edition: Edition,
  section: SectionId,
  byId: Map<string, Article>,
  requiredCount: number,
  requireRichArticle: boolean,
): string[] {
  const ids = selectedIds(edition, section);
  const countIssues =
    ids.length === requiredCount
      ? []
      : [`${section} must contain exactly ${requiredCount} articles`];
  const duplicateIssues =
    new Set(ids).size === ids.length
      ? []
      : [`${section} contains duplicate article references`];
  const articleIssuesById = ids.flatMap((id) => {
    const article = byId.get(id);
    return article
      ? articleIssues(article, requireRichArticle)
      : [`${section} references missing article ${id}`];
  });
  return [...countIssues, ...duplicateIssues, ...articleIssuesById];
}

/**
 * Return blocking issues for an automated edition before it can be staged.
 * The default contract is ten verified stories with full reading bodies.
 */
export function automationIssues(
  edition: Edition,
  articles: Article[],
  requiredCount = 10,
  requireRichArticle = true,
): string[] {
  const byId = new Map(articles.map((article) => [article.id, article]));
  return sections.flatMap(({ id: section }) =>
    sectionIssues(edition, section, byId, requiredCount, requireRichArticle),
  );
}

export function assertAutomationReady(
  edition: Edition,
  articles: Article[],
  requiredCount = 10,
  requireRichArticle = true,
): void {
  const issues = automationIssues(
    edition,
    articles,
    requiredCount,
    requireRichArticle,
  );
  if (issues.length)
    throw new Error(
      `News automation verification failed:\n- ${issues.join('\n- ')}`,
    );
}
