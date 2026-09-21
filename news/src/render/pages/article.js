import { sectionLabel, sections } from '../../modules/content/sections.ts';
import {
  articleDate,
  articleUrl,
  formatArticleDate,
  formatDate,
  localUrl,
  sectionUrl,
} from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';
import { renderStoryCard } from '../components/story-card.js';

/** @type {Record<import('../../modules/content/types.ts').Locale, Record<string, string>>} */
const copy = {
  'pt-BR': {
    article: 'Artigo',
    byline: 'Fonte',
    published: 'Publicado',
    updated: 'Atualizado',
    minute: 'min de leitura',
    textSize: 'Tamanho do texto',
    increase: 'Aumentar tamanho do texto',
    decrease: 'Diminuir tamanho do texto',
    correction: 'Correção',
    aiSummary: 'Resumo por IA',
    sources: 'Fontes',
    related: 'Leia também',
    backToSection: 'Mais notícias de',
    permalink: 'Link permanente',
    home: 'Notícias',
    emptyTitle: 'Artigo não encontrado',
    emptyText: 'O artigo solicitado não está disponível nesta edição.',
    returnHome: 'Voltar às notícias',
  },
  en: {
    article: 'Article',
    byline: 'Source',
    published: 'Published',
    updated: 'Updated',
    minute: 'min read',
    textSize: 'Text size',
    increase: 'Increase text size',
    decrease: 'Decrease text size',
    correction: 'Correction',
    aiSummary: 'AI summary',
    sources: 'Sources',
    related: 'More stories',
    backToSection: 'More news from',
    permalink: 'Permalink',
    home: 'News',
    emptyTitle: 'Article not found',
    emptyText: 'The requested article is not available in this edition.',
    returnHome: 'Return to the news',
  },
};

/** @param {string[]} paragraphs @returns {number} */
function readingMinutes(paragraphs) {
  const words = paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** @param {import('../../modules/content/types.ts').Locale} locale @returns {string} */
function emptyArticle(locale) {
  const labels = copy[locale];
  return `<section class="article-empty mx-auto w-full max-w-3xl py-16" data-pagefind-body>
    <p class="article-eyebrow text-xs font-semibold uppercase tracking-widest">${escapeHtml(labels.article)}</p>
    <h1 class="mt-4 text-4xl font-semibold tracking-tight">${escapeHtml(labels.emptyTitle)}</h1>
    <p class="article-empty-text mt-4 max-w-prose text-base leading-7">${escapeHtml(labels.emptyText)}</p>
    <a class="article-empty-link mt-8 inline-flex items-center gap-2 font-semibold" href="${escapeHtml(localUrl('', locale))}">${escapeHtml(labels.returnHome)} <span aria-hidden="true">→</span></a>
  </section>`;
}

/** @param {import('../../modules/content/types.ts').Article} article @returns {string} */
function sourceLinks(article) {
  return article.sources
    .map(
      (source) =>
        `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a>`,
    )
    .map((link, index) => (index ? `, ${link}` : link))
    .join('');
}

/** @param {import('../../modules/content/types.ts').Article} article @param {import('../../modules/content/types.ts').Locale} locale @returns {string} */
function sourcesList(article, locale) {
  const labels = copy[locale];
  return `<section class="article-sources border-t pt-6" aria-labelledby="article-sources-title">
    <h2 id="article-sources-title" class="text-xs font-semibold uppercase tracking-widest">${escapeHtml(labels.sources)}</h2>
    <ul class="mt-3 space-y-2 pl-5">
      ${article.sources
        .map(
          (source) =>
            `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.name)}</a></li>`,
        )
        .join('')}
    </ul>
  </section>`;
}

/** @param {import('../../modules/content/types.ts').Translation} translation @returns {string[]} */
function aiSummaryBullets(translation) {
  if (!translation.aiSummary) return [];
  return Array.isArray(translation.aiSummary)
    ? translation.aiSummary
    : [translation.aiSummary];
}

/** @param {Record<string, string>} labels @param {import('../../modules/content/types.ts').Translation} translation @returns {string} */
function renderAiSummary(labels, translation) {
  const bullets = aiSummaryBullets(translation);
  if (!bullets.length) return '';
  return `<aside class="article-ai-summary" aria-label="${escapeHtml(labels.aiSummary)}">
    <p class="article-ai-summary__label text-xs font-semibold uppercase tracking-widest">${escapeHtml(labels.aiSummary)}</p>
    <ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
  </aside>`;
}

/** @param {import('../types.ts').RenderContext} context @returns {string} */
export default function renderArticle(context) {
  const { locale, article } = context;
  if (!article) return emptyArticle(locale);

  const labels = copy[locale];
  const translation = article.translations[locale];
  const section = sections.find((item) => item.id === article.section);
  const sectionName = sectionLabel(article.section, locale);
  const sectionHref = sectionUrl(article.section, locale);
  const articleHref = articleUrl(article, locale);
  const homeHref = localUrl('', locale);
  const published = articleDate(article);
  const updated = article.updatedAt || article.publishedAt;
  const hasUpdate = Boolean(
    article.updatedAt && article.updatedAt !== article.publishedAt,
  );
  const style = section
    ? `--section-light:${section.light};--section-dark:${section.dark};`
    : '';
  const secondarySections = article.secondarySections
    .map(
      (secondary) =>
        `<span class="sr-only" data-pagefind-filter="section:${escapeHtml(secondary)}">${escapeHtml(sectionLabel(secondary, locale))}</span>`,
    )
    .join('');
  const paragraphs = translation.paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const aiSummary = renderAiSummary(labels, translation);
  const correction = translation.correction
    ? `<aside class="correction" aria-label="${escapeHtml(labels.correction)}">
        <p class="correction-label text-xs font-semibold uppercase tracking-widest">${escapeHtml(labels.correction)}</p>
        <p>${escapeHtml(translation.correction)}</p>
      </aside>`
    : '';
  const related =
    context.related ??
    context.articles
      .filter(
        (item) => item.id !== article.id && item.section === article.section,
      )
      .slice(0, 3);
  const relatedMarkup = related.length
    ? `<section class="related-stories border-t" data-pagefind-ignore aria-labelledby="related-stories-title">
        <div class="related-heading mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-4">
          <p class="article-eyebrow text-xs font-semibold uppercase tracking-widest">${escapeHtml(sectionName)}</p>
          <h2 id="related-stories-title" class="text-3xl font-semibold tracking-tight">${escapeHtml(labels.related)}</h2>
        </div>
        <div class="related-grid mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-8 md:grid-cols-3">
          ${related
            .map((item, index) =>
              renderStoryCard({
                article: item,
                locale,
                rank: index + 1,
                compact: true,
              }),
            )
            .join('')}
        </div>
      </section>`
    : '';

  return `<article class="article-page" data-pagefind-body style="${escapeHtml(style)}">
    <header class="article-header mx-auto w-full max-w-6xl">
      <p class="article-eyebrow flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
        <a class="section-link" href="${escapeHtml(sectionHref)}" data-pagefind-filter="section:${escapeHtml(article.section)}">${escapeHtml(sectionName)}</a>
        <span aria-hidden="true">·</span>
        <span>${escapeHtml(labels.article)}</span>
        ${secondarySections}
      </p>
      <h1 class="article-title w-full text-balance font-semibold" data-pagefind-meta="title">${escapeHtml(translation.title)}</h1>
      <p class="article-summary max-w-prose" data-pagefind-meta="summary">${escapeHtml(translation.summary)}</p>

      <div class="article-meta-row flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div class="article-meta text-sm leading-6">
          <p class="source-line flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span class="meta-label font-semibold">${escapeHtml(labels.byline)}:</span>
            <span>${sourceLinks(article)}</span>
          </p>
          <p class="date-line text-sm">
            <time datetime="${escapeHtml(published)}">${escapeHtml(labels.published)} ${escapeHtml(formatArticleDate(article, locale))}</time>
            ${hasUpdate ? `<span aria-hidden="true"> · </span><time datetime="${escapeHtml(updated)}">${escapeHtml(labels.updated)} ${escapeHtml(formatDate(updated, locale))}</time>` : ''}
            <span aria-hidden="true"> · </span>
            <span>${readingMinutes(translation.paragraphs)} ${escapeHtml(labels.minute)}</span>
          </p>
        </div>
        <div class="reading-controls inline-flex items-center gap-1 rounded-full border p-1 text-sm" data-pagefind-ignore aria-label="${escapeHtml(labels.textSize)}">
          <button type="button" data-font-decrease aria-label="${escapeHtml(labels.decrease)}">A−</button>
          <output data-font-value aria-live="polite">18px</output>
          <button type="button" data-font-increase aria-label="${escapeHtml(labels.increase)}">A+</button>
        </div>
      </div>
    </header>

    <div class="article-content mx-auto w-full max-w-3xl" data-article-body style="font-size:var(--article-size, 18px)">
      ${aiSummary}
      ${paragraphs}
      ${correction}
      ${sourcesList(article, locale)}
    </div>

    <footer class="article-footer mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 border-t pt-5">
      <a class="back-link font-semibold" href="${escapeHtml(sectionHref)}">${escapeHtml(labels.backToSection)} ${escapeHtml(sectionName)} <span aria-hidden="true">→</span></a>
      <span class="footer-links flex flex-wrap gap-4 text-sm">
        <a class="home-link font-semibold" href="${escapeHtml(homeHref)}">${escapeHtml(labels.home)}</a>
        <a class="canonical-link" href="${escapeHtml(articleHref)}">${escapeHtml(labels.permalink)}</a>
      </span>
    </footer>
  </article>
  ${relatedMarkup}`;
}
