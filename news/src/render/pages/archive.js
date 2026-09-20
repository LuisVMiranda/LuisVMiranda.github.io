import {
  sectionLabel,
  sections,
  sectionStyle,
} from '../../modules/content/sections.ts';
import { formatDate, localUrl } from '../../modules/content/urls.ts';
import { renderStoryCard } from '../components/story-card.js';
import { escapeHtml } from '../html.js';

const PAGE_SIZE = 10;
const SECTION_LIMIT = 10;

const copy = {
  'pt-BR': {
    eyebrow: 'Arquivo editorial',
    title: 'Arquivo de edições',
    description:
      'Consulte as seleções verificadas por data e abra qualquer edição para ler suas editorias ranqueadas.',
    editions: 'Edições',
    edition: 'Edição',
    openEdition: 'Abrir edição',
    filter: 'Filtrar por editoria',
    allDesks: 'Todas as editorias',
    stories: 'notícias',
    previous: 'Página anterior',
    next: 'Próxima página',
    page: 'Página',
    of: 'de',
    back: 'Voltar ao arquivo',
    selection: 'A seleção verificada',
    coverage: 'Cobertura por editoria',
    coverageHint:
      'Cada lista mantém a ordem editorial publicada na edição. Quando há menos de dez notícias, o motivo fica registrado abaixo.',
    noStories: 'Não há notícias verificadas nesta editoria para esta edição.',
    noEditions: 'Ainda não há edições verificadas para consultar.',
    shortfall: 'Esta editoria publicou menos de dez notícias:',
    genericShortfall:
      'Esta editoria tem menos de dez notícias verificadas nesta edição.',
    filtered: 'Exibindo edições que incluem',
    allShown: 'Exibindo todas as editorias.',
    archivePages: 'Páginas do arquivo',
    editionStories: 'notícias distintas',
  },
  en: {
    eyebrow: 'Editorial archive',
    title: 'Edition archive',
    description:
      'Browse verified selections by date, then open any edition to read its ranked desks.',
    editions: 'Editions',
    edition: 'Edition',
    openEdition: 'Open edition',
    filter: 'Filter by desk',
    allDesks: 'All desks',
    stories: 'stories',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    of: 'of',
    back: 'Back to archive',
    selection: 'The verified selection',
    coverage: 'Coverage by desk',
    coverageHint:
      'Each list keeps the editorial order published in the edition. When fewer than ten stories are available, the reason is recorded below.',
    noStories:
      'No verified stories are available in this desk for this edition.',
    noEditions: 'There are no verified editions to browse yet.',
    shortfall: 'This desk published fewer than ten stories:',
    genericShortfall:
      'This desk has fewer than ten verified stories in this edition.',
    filtered: 'Showing editions that include',
    allShown: 'Showing all desks.',
    archivePages: 'Archive pages',
    editionStories: 'distinct stories',
  },
};

/**
 * Build an archive URL using the same paths emitted by the edition router.
 * @param {import('../../modules/content/types.ts').Locale} locale
 * @param {import('../../modules/content/types.ts').SectionId | undefined} section
 * @param {number} page
 * @returns {string}
 */
function archiveUrl(locale, section, page = 1) {
  const base = section ? `arquivo/secao/${section}` : 'arquivo';
  return localUrl(`${base}${page > 1 ? `/pagina/${page}` : ''}`, locale);
}

/** @param {import('../../modules/content/types.ts').Edition} edition @returns {string[]} */
function editionArticleIds(edition) {
  return sections.flatMap(({ id }) => edition.sections?.[id]?.articleIds ?? []);
}

/** @param {import('../../modules/content/types.ts').Edition} edition @returns {number} */
function distinctStoryCount(edition) {
  return new Set(editionArticleIds(edition)).size;
}

/**
 * @param {import('../../modules/content/types.ts').Edition} edition
 * @param {import('../../modules/content/types.ts').SectionId} sectionId
 * @param {Map<string, import('../../modules/content/types.ts').Article>} byId
 * @returns {import('../../modules/content/types.ts').Article[]}
 */
function sectionArticles(edition, sectionId, byId) {
  /** @type {import('../../modules/content/types.ts').Article[]} */
  const result = [];
  const ids = edition.sections?.[sectionId]?.articleIds ?? [];
  ids.forEach((id) => {
    const article = byId.get(id);
    if (article) result.push(article);
  });
  return result;
}

/**
 * @param {import('../../modules/content/types.ts').Edition} edition
 * @param {import('../../modules/content/types.ts').SectionId} sectionId
 * @param {import('../../modules/content/types.ts').Locale} locale
 * @param {typeof copy.en} labels
 * @returns {string}
 */
function shortfallMarkup(edition, sectionId, locale, labels) {
  const entry = edition.sections?.[sectionId];
  if (!entry || entry.articleIds.length >= SECTION_LIMIT) return '';
  const reason =
    locale === 'en'
      ? entry.shortfallEn?.trim() || labels.genericShortfall
      : entry.shortfall.trim() || labels.genericShortfall;
  return `<p class="shortfall"><strong>${escapeHtml(labels.shortfall)}</strong> ${escapeHtml(reason)}</p>`;
}

/**
 * @param {import('../../modules/content/types.ts').Locale} locale
 * @param {import('../../modules/content/types.ts').SectionId | undefined} selected
 * @param {typeof copy.en} labels
 * @returns {string}
 */
function filterNav(locale, selected, labels) {
  const allCurrent = selected ? '' : ' aria-current="page"';
  const sectionLinks = sections
    .map((section) => {
      const current = selected === section.id ? ' aria-current="page"' : '';
      return `<a class="desk-nav__link" href="${escapeHtml(archiveUrl(locale, section.id))}" style="${escapeHtml(sectionStyle(section.id))}"${current}>${escapeHtml(section.label[locale])}</a>`;
    })
    .join('');
  return `<nav class="desk-nav archive-filters" aria-label="${escapeHtml(labels.filter)}">
    <a class="desk-nav__link desk-nav__link--all" href="${escapeHtml(archiveUrl(locale, undefined))}"${allCurrent}>${escapeHtml(labels.allDesks)}</a>
    ${sectionLinks}
  </nav>`;
}

/**
 * @param {import('../../modules/content/types.ts').Locale} locale
 * @param {import('../../modules/content/types.ts').SectionId | undefined} section
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {typeof copy.en} labels
 * @returns {string}
 */
function pagination(locale, section, currentPage, totalPages, labels) {
  if (totalPages <= 1) return '';
  const previous =
    currentPage > 1
      ? `<a href="${escapeHtml(archiveUrl(locale, section, currentPage - 1))}">${escapeHtml(labels.previous)}</a>`
      : `<span aria-hidden="true">${escapeHtml(labels.previous)}</span>`;
  const next =
    currentPage < totalPages
      ? `<a href="${escapeHtml(archiveUrl(locale, section, currentPage + 1))}">${escapeHtml(labels.next)}</a>`
      : `<span aria-hidden="true">${escapeHtml(labels.next)}</span>`;
  return `<nav class="pagination" aria-label="${escapeHtml(labels.archivePages)}">
    ${previous}
    <span aria-current="page">${escapeHtml(labels.page)} ${currentPage} ${escapeHtml(labels.of)} ${totalPages}</span>
    ${next}
  </nav>`;
}

/**
 * Render one verified edition with every desk's ranked coverage.
 * @param {import('../types.ts').RenderContext} context
 * @param {import('../../modules/content/types.ts').Edition} edition
 * @param {Map<string, import('../../modules/content/types.ts').Article>} byId
 * @returns {string}
 */
function renderEdition(context, edition, byId) {
  const { locale } = context;
  const labels = copy[locale];
  const storyCount = distinctStoryCount(edition);
  const deskSections = sections
    .map((section) => {
      const ranked = sectionArticles(edition, section.id, byId);
      const sectionName = sectionLabel(section.id, locale);
      const cards = ranked.length
        ? `<div class="ranked-stories">${ranked
            .map((article, index) =>
              renderStoryCard({ article, locale, rank: index + 1 }),
            )
            .join('')}</div>`
        : `<p class="empty-state">${escapeHtml(labels.noStories)}</p>`;
      return `<section id="section-${escapeHtml(section.id)}" class="desk-section" data-section-panel="${escapeHtml(section.id)}" style="${escapeHtml(sectionStyle(section.id))}" aria-labelledby="desk-title-${escapeHtml(section.id)}">
        <header class="desk-heading">
          <div>
            <p class="desk-kicker">${escapeHtml(sectionName)}</p>
            <h2 id="desk-title-${escapeHtml(section.id)}">${escapeHtml(sectionName)}</h2>
          </div>
          <span class="desk-count">${ranked.length}/${SECTION_LIMIT}</span>
        </header>
        ${cards}
        ${shortfallMarkup(edition, section.id, locale, labels)}
      </section>`;
    })
    .join('');
  const deskLinks = sections
    .map(
      (section) =>
        `<a href="#section-${escapeHtml(section.id)}" style="${escapeHtml(sectionStyle(section.id))}">${escapeHtml(section.label[locale])}</a>`,
    )
    .join('');

  return `<div class="archive-page edition-page mx-auto w-full">
    <header class="archive-header edition-header">
      <a class="back-link inline-flex items-center gap-2" href="${escapeHtml(localUrl('arquivo', locale))}"><span aria-hidden="true">←</span> ${escapeHtml(labels.back)}</a>
      <div class="edition-header__top flex flex-wrap items-end justify-between gap-6">
        <div>
          <p class="eyebrow">${escapeHtml(labels.edition)}</p>
          <h1 class="text-balance">${escapeHtml(formatDate(edition.cutoff, locale))}</h1>
        </div>
        <p class="edition-header__count"><strong>${storyCount}</strong> ${escapeHtml(labels.editionStories)}</p>
      </div>
      <p class="archive-description">${escapeHtml(labels.selection)}</p>
      <nav class="desk-nav edition-jump-nav" aria-label="${escapeHtml(labels.coverage)}">
        <a href="${escapeHtml(localUrl(`edicao/${edition.id}`, locale))}" aria-current="page">${escapeHtml(labels.allDesks)}</a>
        ${deskLinks}
      </nav>
    </header>

    <section class="edition-sections" aria-labelledby="edition-sections-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow" id="edition-sections-title">${escapeHtml(labels.coverage)}</p>
          <p class="section-heading__hint">${escapeHtml(labels.coverageHint)}</p>
        </div>
        <time datetime="${escapeHtml(edition.cutoff)}">${escapeHtml(formatDate(edition.cutoff, locale))}</time>
      </div>
      <div class="section-list">${deskSections}</div>
    </section>
  </div>`;
}

/** @param {import('../types.ts').RenderContext} context @returns {string} */
export default function renderArchive(context) {
  const {
    locale,
    articles = [],
    editions = [],
    page = 1,
    pageCount,
    sectionFilter,
    selectedEdition,
  } = context;
  const labels = copy[locale];
  const byId = new Map(articles.map((article) => [article.id, article]));

  if (selectedEdition) return renderEdition(context, selectedEdition, byId);

  const ordered = [...editions].sort(
    (left, right) =>
      right.cutoff.localeCompare(left.cutoff) ||
      left.id.localeCompare(right.id),
  );
  const scoped = sectionFilter
    ? ordered.filter(
        (edition) =>
          (edition.sections?.[sectionFilter]?.articleIds.length ?? 0) > 0,
      )
    : ordered;
  const totalPages = Math.max(
    1,
    pageCount ?? Math.ceil(scoped.length / PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const visible = scoped.slice(offset, offset + PAGE_SIZE);
  const status = sectionFilter
    ? `${labels.filtered} ${sectionLabel(sectionFilter, locale)}.`
    : labels.allShown;
  const rows = visible
    .map((edition, index) => {
      const number = scoped.length - (offset + index);
      return `<li class="edition-row">
        <time class="edition-date" datetime="${escapeHtml(edition.cutoff)}">${escapeHtml(formatDate(edition.cutoff, locale))}</time>
        <div class="edition-summary">
          <p class="edition-number">${escapeHtml(labels.edition)} ${number}</p>
          <p class="edition-count">${distinctStoryCount(edition)} ${escapeHtml(labels.stories)}</p>
        </div>
        <a class="edition-link inline-flex items-center gap-2" href="${escapeHtml(localUrl(`edicao/${edition.id}`, locale))}">${escapeHtml(labels.openEdition)} <span aria-hidden="true">↗</span></a>
      </li>`;
    })
    .join('');
  const list = scoped.length
    ? `<ol class="edition-list" id="archive-editions">${rows}</ol>`
    : `<p class="empty-state archive-empty">${escapeHtml(sectionFilter ? labels.noStories : labels.noEditions)}</p>`;

  return `<div class="archive-page mx-auto w-full">
    <header class="archive-header">
      <p class="eyebrow">${escapeHtml(labels.eyebrow)}</p>
      <h1 class="text-balance">${escapeHtml(labels.title)}</h1>
      <p class="archive-description">${escapeHtml(labels.description)}</p>
    </header>

    <section class="archive-browser" aria-labelledby="archive-list-title">
      <div class="browser-heading">
        <div>
          <p class="eyebrow" id="archive-list-title">${escapeHtml(labels.editions)}</p>
          <p class="filter-status">${escapeHtml(status)}</p>
        </div>
        ${filterNav(locale, sectionFilter, labels)}
      </div>
      ${list}
      ${pagination(locale, sectionFilter, currentPage, totalPages, labels)}
    </section>
  </div>`;
}
