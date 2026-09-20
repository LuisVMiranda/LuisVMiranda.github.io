import { sectionLabel, sectionStyle } from '../../modules/content/sections.ts';
import { formatDate, localUrl } from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';
import { renderStoryCard } from './story-card.js';

/** @param {number} count */
function englishShortfall(count) {
  return `${count} verified stories available. We publish fewer than ten when the available evidence does not support a complete selection.`;
}

/** @param {number} count */
function portugueseShortfall(count) {
  return `${count} notícias verificadas disponíveis. Publicamos menos de dez quando as evidências disponíveis não sustentam uma seleção completa.`;
}

const COPY = {
  en: {
    edition: 'The essential selection',
    top: 'Top 10 stories',
    empty: 'This desk is awaiting its first reviewed edition.',
    shortfall: englishShortfall,
    commitment: 'Our commitment',
    commitmentTitle: 'Context before noise.',
    commitmentBody:
      'Sources are checked individually. Recent reporting comes first, with a seven-day window when needed.',
    editorial: 'How we select stories',
    archive: 'Earlier editions',
  },
  'pt-BR': {
    edition: 'A seleção essencial',
    top: 'Top 10 notícias',
    empty: 'Esta editoria aguarda sua primeira edição revisada.',
    shortfall: portugueseShortfall,
    commitment: 'Nosso compromisso',
    commitmentTitle: 'Contexto antes do ruído.',
    commitmentBody:
      'As fontes são verificadas individualmente. Priorizamos as últimas 24 horas, com uma janela de sete dias quando necessário.',
    editorial: 'Como selecionamos as notícias',
    archive: 'Edições anteriores',
  },
};

/** @param {import('../../modules/content/types.ts').Article | undefined} article @returns {article is import('../../modules/content/types.ts').Article} */
function isArticle(article) {
  return Boolean(article);
}

/** @param {import('../types.ts').RenderContext} context */
function latestEdition(context) {
  if (context.edition) return context.edition;
  return [...context.editions].sort((left, right) =>
    right.cutoff.localeCompare(left.cutoff),
  )[0];
}

/** @param {import('../types.ts').RenderContext} context @param {import('../../modules/content/types.ts').SectionId} sectionId */
function orderedStories(context, sectionId) {
  const edition = latestEdition(context);
  const refs = edition?.sections[sectionId]?.articleIds || [];
  const byId = new Map(
    context.articles.map((article) => [article.id, article]),
  );
  return refs.map((id) => byId.get(id)).filter(isArticle);
}

/** @param {import('../types.ts').RenderContext['locale']} locale */
function copyFor(locale) {
  return COPY[locale];
}

/** @param {{shortfall?: string, shortfallEn?: string}} section @param {import('../types.ts').RenderContext['locale']} locale @param {number} count */
function sectionShortfall(section, locale, count) {
  if (locale === 'en') return section.shortfallEn || COPY.en.shortfall(count);
  return section.shortfall || COPY['pt-BR'].shortfall(count);
}

/** @param {import('../types.ts').RenderContext} context @param {import('../../modules/content/types.ts').Article[]} stories */
function renderStoryList(context, stories) {
  if (stories.length === 0)
    return `<p class="empty">${copyFor(context.locale).empty}</p>`;
  const cards = stories
    .map((article, index) =>
      renderStoryCard({
        article,
        locale: context.locale,
        rank: index + 1,
      }),
    )
    .join('');
  return `<div class="ranked-stories">${cards}</div>`;
}

/** @param {import('../types.ts').RenderContext} context @param {import('../../modules/content/types.ts').Article[]} stories @param {{shortfall?: string, shortfallEn?: string}} section */
function renderShortfall(context, stories, section) {
  if (stories.length >= 10) return '';
  return `<p class="shortfall">${escapeHtml(sectionShortfall(section, context.locale, stories.length))}</p>`;
}

/** @param {import('../types.ts').RenderContext} context @param {import('../../modules/content/types.ts').SectionId} sectionId */
function renderSectionAside(context, sectionId) {
  const copy = copyFor(context.locale);
  return `<aside>
    <p class="eyebrow">${copy.commitment}</p>
    <h2>${copy.commitmentTitle}</h2>
    <p>${copy.commitmentBody}</p>
    <a href="${escapeHtml(localUrl('editorial', context.locale))}">${copy.editorial} <span aria-hidden="true">↗</span></a>
    <a href="${escapeHtml(localUrl(`arquivo/secao/${sectionId}`, context.locale))}">${copy.archive} <span aria-hidden="true">→</span></a>
  </aside>`;
}

/** @param {import('../types.ts').RenderContext} context @param {{sectionId: import('../../modules/content/types.ts').SectionId, kicker: string, intro: string}} input */
export function renderSectionPage(context, { sectionId, kicker, intro }) {
  const copy = copyFor(context.locale);
  const edition = latestEdition(context);
  const stories = orderedStories(context, sectionId);
  const section = edition?.sections[sectionId];
  return `<div class="section-page" style="${escapeHtml(sectionStyle(sectionId))}">
    <header class="section-header">
      <p class="eyebrow">${escapeHtml(kicker)}</p>
      <h1>${escapeHtml(sectionLabel(sectionId, context.locale))}</h1>
      <p class="intro">${escapeHtml(intro)}</p>
      <div class="edition-line"><span>${copy.edition}</span>${edition ? `<time datetime="${escapeHtml(edition.cutoff)}">${escapeHtml(formatDate(edition.cutoff, context.locale))}</time>` : ''}</div>
    </header>
    <div class="section-content">
      <section aria-labelledby="top-ten-title">
        <h2 id="top-ten-title">${copy.top}</h2>
        ${renderStoryList(context, stories)}
        ${section ? renderShortfall(context, stories, section) : ''}
      </section>
      ${renderSectionAside(context, sectionId)}
    </div>
  </div>`;
}
