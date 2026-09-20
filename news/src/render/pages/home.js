import {
  sectionLabel,
  sections,
  sectionStyle,
} from '../../modules/content/sections.ts';
import {
  articleDate,
  articleUrl,
  formatDate,
  formatArticleDate,
  sectionUrl,
} from '../../modules/content/urls.ts';
import { renderStoryCard } from '../components/story-card.js';
import { escapeHtml } from '../html.js';

const copy = {
  'pt-BR': {
    kicker: 'O que importa hoje',
    latest: 'Últimas notícias',
    sections: 'Por editoria',
    readStory: 'Ler a reportagem',
    viewSection: 'Ver editoria',
    published: 'Publicado',
    noStories: 'Ainda não há notícias aprovadas para esta edição.',
    noStoriesHint:
      'As editorias abaixo serão preenchidas quando houver uma seleção aprovada.',
    noLatest: 'Ainda não há outras notícias aprovadas.',
    sectionEmpty: 'Nenhuma notícia aprovada nesta editoria.',
  },
  en: {
    kicker: 'The stories that matter',
    latest: 'Latest news',
    sections: 'Across the desks',
    readStory: 'Read the story',
    viewSection: 'View section',
    published: 'Published',
    noStories: 'No approved stories are available for this edition yet.',
    noStoriesHint: 'These desks will fill when an approved selection is ready.',
    noLatest: 'There are no other approved stories yet.',
    sectionEmpty: 'No approved story in this section yet.',
  },
};

/** @param {import('../../modules/content/types.ts').Article} article */
function publishedTimestamp(article) {
  const timestamp = Date.parse(article.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/** @param {import('../../modules/content/types.ts').Article[]} articles */
function newestFirst(articles) {
  return articles
    .map((article, index) => ({ article, index }))
    .sort(
      (left, right) =>
        publishedTimestamp(right.article) - publishedTimestamp(left.article) ||
        left.article.id.localeCompare(right.article.id) ||
        left.index - right.index,
    )
    .map(({ article }) => article);
}

/**
 * @param {import('../../modules/content/types.ts').Edition[]} editions
 * @returns {import('../../modules/content/types.ts').Edition | undefined}
 */
function latestEdition(editions) {
  /** @type {import('../../modules/content/types.ts').Edition | undefined} */
  let latest;
  editions.forEach((edition) => {
    if (!latest || Date.parse(edition.cutoff) > Date.parse(latest.cutoff))
      latest = edition;
  });
  return latest;
}

/** @param {import('../../modules/content/types.ts').Edition | undefined} edition @param {Map<string, import('../../modules/content/types.ts').Article>} byId */
function editionArticles(edition, byId) {
  if (!edition) return [];
  const references = sections.flatMap(
    ({ id }) => edition.sections?.[id]?.articleIds ?? [],
  );
  const referenceIds = new Set(references);
  /** @type {import('../../modules/content/types.ts').Article[]} */
  const ordered = [];
  const seen = new Set();
  /** @param {string} id */
  const add = (id) => {
    const article = byId.get(id);
    if (!article || seen.has(article.id)) return;
    seen.add(article.id);
    ordered.push(article);
  };

  if (edition.leadArticleId && referenceIds.has(edition.leadArticleId))
    add(edition.leadArticleId);
  references.forEach(add);
  return ordered;
}

/** @param {import('../../modules/content/types.ts').Article} article @param {import('../../modules/content/types.ts').SectionId} sectionId */
function belongsToSection(article, sectionId) {
  return (
    article.section === sectionId ||
    (Array.isArray(article.secondarySections) &&
      article.secondarySections.includes(sectionId))
  );
}

/**
 * @param {import('../../modules/content/types.ts').Article[]} articles
 * @param {import('../../modules/content/types.ts').Edition | undefined} edition
 * @param {Map<string, import('../../modules/content/types.ts').Article>} byId
 * @param {import('../../modules/content/types.ts').Article | undefined} lead
 * @returns {Array<Array<{article: import('../../modules/content/types.ts').Article, rank: number}>>}
 */
function sectionStories(articles, edition, byId, lead) {
  return sections.map((section) => {
    if (edition) {
      const references = edition.sections?.[section.id]?.articleIds ?? [];
      return references
        .flatMap((id, index) => {
          const article = byId.get(id);
          return article && article.id !== lead?.id
            ? [{ article, rank: index + 1 }]
            : [];
        })
        .slice(0, 2);
    }
    return articles
      .filter(
        (article) =>
          article.id !== lead?.id && belongsToSection(article, section.id),
      )
      .slice(0, 2)
      .map((article, index) => ({ article, rank: index + 1 }));
  });
}

/** @param {import('../../modules/content/types.ts').Locale} locale @param {import('../../modules/content/types.ts').Article | undefined} lead @param {Record<string, string>} labels */
function leadMarkup(locale, lead, labels) {
  if (!lead) {
    return `<div class="home-lead home-lead--empty">
      <h1 id="home-lead-title" class="home-lead__title text-balance font-semibold">${escapeHtml(labels.noStories)}</h1>
      <p class="home-lead__summary">${escapeHtml(labels.noStoriesHint)}</p>
    </div>`;
  }

  const translation = lead.translations[locale];
  const style = sectionStyle(lead.section);
  const href = articleUrl(lead, locale);
  return `<article class="home-lead" style="${escapeHtml(style)}">
    <p class="home-lead__eyebrow eyebrow">${escapeHtml(sectionLabel(lead.section, locale))}</p>
    <h1 id="home-lead-title" class="home-lead__title text-balance font-semibold"><a href="${escapeHtml(href)}">${escapeHtml(translation.title)}</a></h1>
    <p class="home-lead__summary">${escapeHtml(translation.summary)}</p>
    <div class="home-lead__footer">
      <p class="home-lead__meta"><span>${escapeHtml(labels.published)}</span> <time datetime="${escapeHtml(articleDate(lead))}">${escapeHtml(formatArticleDate(lead, locale))}</time></p>
      <a class="home-lead__link inline-flex items-center gap-2 font-semibold" href="${escapeHtml(articleUrl(lead, locale))}">${escapeHtml(labels.readStory)} <span aria-hidden="true">↗</span></a>
    </div>
  </article>`;
}

/** @param {import('../types.ts').RenderContext} context @returns {string} */
export default function renderHome(context) {
  const { locale, articles = [], edition, editions = [], preview } = context;
  const labels = copy[locale];
  const byId = new Map(articles.map((article) => [article.id, article]));
  const currentEdition = latestEdition(
    edition ? [...editions, edition] : editions,
  );
  const selectedArticles = currentEdition
    ? editionArticles(currentEdition, byId)
    : [...articles];
  const fallbackArticles = currentEdition
    ? selectedArticles
    : newestFirst(selectedArticles);
  const lead = fallbackArticles[0];
  const latest = newestFirst(
    fallbackArticles.filter((article) => article.id !== lead?.id),
  ).slice(0, 3);
  const previews = sectionStories(selectedArticles, currentEdition, byId, lead);
  const editionDate = currentEdition
    ? formatDate(currentEdition.cutoff, locale)
    : '';

  const latestMarkup = latest.length
    ? latest
        .map((article, index) =>
          renderStoryCard({
            article,
            locale,
            rank: index + 1,
            compact: true,
          }),
        )
        .join('')
    : `<p class="home-latest__empty muted">${escapeHtml(labels.noLatest)}</p>`;

  const sectionsMarkup = sections
    .map((section, index) => {
      const stories = previews[index] ?? [];
      const sectionName = sectionLabel(section.id, locale);
      const cards = stories.length
        ? stories
            .map(({ article, rank }) =>
              renderStoryCard({ article, locale, rank }),
            )
            .join('')
        : `<p class="home-section__empty muted">${escapeHtml(labels.sectionEmpty)}</p>`;
      return `<article class="home-section" style="${escapeHtml(sectionStyle(section.id))}">
        <header class="home-section__header">
          <h2 class="home-section__name">${escapeHtml(sectionName)}</h2>
          <a class="home-section__link" href="${escapeHtml(sectionUrl(section.id, locale))}" aria-label="${escapeHtml(`${labels.viewSection}: ${sectionName}`)}">${escapeHtml(labels.viewSection)} <span aria-hidden="true">↗</span></a>
        </header>
        <div class="home-section__stories">${cards}</div>
      </article>`;
    })
    .join('');

  return `<div class="home-page mx-auto w-full${preview ? ' home-page--preview' : ''}">
    <section class="home-hero" aria-labelledby="home-lead-title">
      <div class="home-hero__kicker flex items-center justify-between gap-4">
        <p class="home-kicker eyebrow">${escapeHtml(labels.kicker)}</p>
        <span class="home-hero__edition muted">${currentEdition ? `<time datetime="${escapeHtml(currentEdition.cutoff)}">${escapeHtml(editionDate)}</time>` : ''}</span>
      </div>
      <div class="home-hero__grid grid gap-12">
        ${leadMarkup(locale, lead, labels)}
        <aside class="home-latest" aria-labelledby="home-latest-title">
          <div class="home-latest__heading">
            <p id="home-latest-title" class="home-latest__title eyebrow">${escapeHtml(labels.latest)}</p>
          </div>
          <div class="home-latest__list">${latestMarkup}</div>
        </aside>
      </div>
    </section>
    <section class="home-sections" aria-labelledby="home-sections-title">
      <div class="home-sections__heading">
        <p id="home-sections-title" class="home-sections__title eyebrow">${escapeHtml(labels.sections)}</p>
      </div>
      <div class="home-sections__grid grid">${sectionsMarkup}</div>
    </section>
  </div>`;
}
