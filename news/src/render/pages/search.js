import { sections, sectionStyle } from '../../modules/content/sections.ts';
import { localUrl } from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';

const copy = {
  'pt-BR': {
    eyebrow: 'Notícias · Pesquisa',
    title: 'Pesquisar',
    description:
      'Encontre reportagens, análises e contexto no arquivo das Notícias.',
    inputLabel: 'Termo de busca',
    placeholder: 'Pesquise notícias, temas ou palavras-chave',
    sectionLabel: 'Seção',
    allSections: 'Todas as seções',
    submit: 'Pesquisar',
    results: 'Resultados',
    hint: 'Use uma palavra ou frase curta para começar.',
    noScript: 'A busca precisa de JavaScript e do índice publicado.',
  },
  en: {
    eyebrow: 'Notícias · Search',
    title: 'Search',
    description:
      'Find reporting, analysis, and context in the Notícias archive.',
    inputLabel: 'Search term',
    placeholder: 'Search news, topics, or keywords',
    sectionLabel: 'Section',
    allSections: 'All sections',
    submit: 'Search',
    results: 'Results',
    hint: 'Start with a word or a short phrase.',
    noScript: 'Search requires JavaScript and the published search index.',
  },
};

/** @param {import('../../modules/content/types.ts').Locale} locale */
function sectionOptions(locale) {
  return sections
    .map(
      (section) =>
        `<option value="${escapeHtml(section.id)}" data-section-id="${escapeHtml(section.id)}" style="${escapeHtml(sectionStyle(section.id))}">${escapeHtml(section.label[locale])}</option>`,
    )
    .join('');
}

/** @param {import('../types.ts').RenderContext} context @returns {string} */
export default function renderSearch(context) {
  const { locale } = context;
  const labels = copy[locale];
  const titleId = `search-title-${locale}`;
  const inputId = `search-query-${locale}`;
  const sectionId = `search-section-${locale}`;
  const hintId = `search-hint-${locale}`;
  const statusId = `search-status-${locale}`;
  const resultsId = `search-results-title-${locale}`;
  const searchPath = localUrl('busca', locale);

  return `<section class="search-page mx-auto w-full" data-search data-search-root data-pagefind-ignore data-locale="${escapeHtml(locale)}" data-search-state="idle" aria-labelledby="${escapeHtml(titleId)}">
    <header class="search-page__header">
      <div class="search-page__heading">
        <p class="search-page__eyebrow eyebrow">${escapeHtml(labels.eyebrow)}</p>
        <h1 id="${escapeHtml(titleId)}" class="search-page__title text-balance font-semibold">${escapeHtml(labels.title)}</h1>
      </div>
      <p class="search-page__description">${escapeHtml(labels.description)}</p>
    </header>

    <div class="search-page__workspace">
      <form class="search-page__form grid gap-4" data-search-form role="search" method="get" action="${escapeHtml(searchPath)}">
        <div class="search-page__field search-page__field--query min-w-0">
          <label for="${escapeHtml(inputId)}">${escapeHtml(labels.inputLabel)}</label>
          <input id="${escapeHtml(inputId)}" data-search-input type="search" name="q" placeholder="${escapeHtml(labels.placeholder)}" autocomplete="off" spellcheck="false" aria-describedby="${escapeHtml(hintId)}">
        </div>
        <div class="search-page__field search-page__field--section min-w-0">
          <label for="${escapeHtml(sectionId)}">${escapeHtml(labels.sectionLabel)}</label>
          <select id="${escapeHtml(sectionId)}" data-search-section name="section">
            <option value="">${escapeHtml(labels.allSections)}</option>
            ${sectionOptions(locale)}
          </select>
        </div>
        <button class="search-page__submit inline-flex items-center justify-center gap-2 font-semibold" type="submit">
          <span>${escapeHtml(labels.submit)}</span>
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p id="${escapeHtml(hintId)}" class="search-page__hint muted">${escapeHtml(labels.hint)}</p>
    </div>

    <section class="search-page__results-panel" aria-labelledby="${escapeHtml(resultsId)}">
      <div class="search-page__results-header">
        <h2 id="${escapeHtml(resultsId)}" class="search-page__results-title">${escapeHtml(labels.results)}</h2>
        <p id="${escapeHtml(statusId)}" class="search-page__status" data-search-status role="status" aria-live="polite">${escapeHtml(locale === 'en' ? 'Enter a term to search.' : 'Digite um termo para buscar.')}</p>
      </div>
      <ol class="search-page__results" data-search-results aria-live="polite"></ol>
    </section>

    <noscript><p class="search-page__noscript muted">${escapeHtml(labels.noScript)}</p></noscript>
  </section>`;
}
