import { sectionLabel, sectionStyle } from '../../modules/content/sections.ts';
import {
  articleDate,
  articleUrl,
  formatArticleDate,
} from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';

/**
 * Render the small editorial story unit shared by section, archive, home and
 * article pages.
 * @param {{article: import('../../modules/content/types.ts').Article, locale: import('../../modules/content/types.ts').Locale, rank?: number, compact?: boolean}} input
 * @returns {string}
 */
export function renderStoryCard({ article, locale, rank, compact = false }) {
  const translation = article.translations[locale];
  const safeRank = rank ?? 0;
  const rankMarkup =
    Number.isFinite(safeRank) && safeRank > 0
      ? `<span class="story-card__rank" aria-label="${escapeHtml(locale === 'en' ? `Rank ${safeRank}` : `Posição ${safeRank}`)}">${String(safeRank).padStart(2, '0')} / </span>`
      : '';
  const dateLabel = locale === 'en' ? 'Published' : 'Publicado';
  const modifier = compact ? ' story-card--compact' : '';
  return `<article class="story-card story${modifier}" style="${escapeHtml(sectionStyle(article.section))}">
    <p class="story-card__eyebrow eyebrow">${rankMarkup}${escapeHtml(sectionLabel(article.section, locale))}</p>
    <h3 class="story-card__title"><a href="${escapeHtml(articleUrl(article, locale))}">${escapeHtml(translation.title)}</a></h3>
    <p class="story-card__summary">${escapeHtml(translation.summary)}</p>
    <time class="story-card__date" datetime="${escapeHtml(articleDate(article))}"><span class="story-card__date-label">${escapeHtml(dateLabel)}</span> <span class="story-card__date-value">${escapeHtml(formatArticleDate(article, locale))}</span></time>
  </article>`;
}
