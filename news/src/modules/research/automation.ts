import type { Article, Edition, Locale, SectionId } from '../content/types';
import { sections } from '../content/sections';

const locales: Locale[] = ['pt-BR', 'en'];
const embeddedContentPattern =
  /(?:https?:\/\/|www\.)|!\[[^\]]*\]\([^)]*\)|\[[^\]]+\]\([^)]*\)|<\s*(?:a|img|picture|iframe|video|figure|script|source)\b/i;

function hasEmbeddedContent(value: string): boolean {
  return embeddedContentPattern.test(value);
}

function selectedIds(edition: Edition, section: SectionId): string[] {
  return edition.sections[section]?.articleIds ?? [];
}

function translationIssues(
  id: string,
  locale: Locale,
  translation: Article['translations'][Locale],
): string[] {
  const issues: string[] = [];
  const aiSummary = translation.aiSummary;
  if (!Array.isArray(aiSummary) || aiSummary.length === 0)
    issues.push(`${id}/${locale} must contain a bullet-list AI summary`);
  else {
    const maxBullets = Math.min(
      5,
      Math.max(1, Math.ceil(translation.paragraphs.length / 2)),
    );
    if (aiSummary.length > maxBullets)
      issues.push(
        `${id}/${locale} has more than ${maxBullets} relevant AI-summary bullets`,
      );
  }
  if (translation.paragraphs.length < 5)
    issues.push(`${id}/${locale} must contain at least 5 paragraphs`);
  const textFields = [
    ['summary', translation.summary],
    ...(Array.isArray(aiSummary)
      ? aiSummary.map(
          (bullet, index) =>
            [`AI summary bullet ${index + 1}`, bullet] as const,
        )
      : [['AI summary', aiSummary ?? ''] as const]),
    ...translation.paragraphs.map((paragraph, index) => [
      `paragraph ${index + 1}`,
      paragraph,
    ]),
  ] as const;
  for (const [field, value] of textFields) {
    if (hasEmbeddedContent(value))
      issues.push(`${id}/${locale} contains inline links or media in ${field}`);
  }
  return issues;
}

function articleIssues(
  article: Article,
  requireRichArticle: boolean,
): string[] {
  if (!requireRichArticle) return [];
  const rightsIssues = article.rights
    ? []
    : [`${article.id} is missing rights metadata`];
  return [
    ...rightsIssues,
    ...locales.flatMap((locale) =>
      translationIssues(article.id, locale, article.translations[locale]),
    ),
  ];
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
