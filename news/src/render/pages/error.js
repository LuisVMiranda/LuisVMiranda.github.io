import { localUrl } from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';

/** @type {Record<import('../../modules/content/types.ts').Locale, Record<string, string>>} */
const copy = {
  'pt-BR': {
    eyebrow: 'Erro 404',
    title: 'Esta página não foi encontrada.',
    description:
      'O endereço pode estar desatualizado, ou a página pode ter mudado. Volte à edição mais recente ou pesquise em nosso acervo.',
    home: 'Voltar para a capa',
    search: 'Buscar nas Notícias',
    portfolio: 'Portfólio',
    language: 'English',
    actions: 'Navegação da página',
    languageLabel: 'Ler em inglês',
  },
  en: {
    eyebrow: 'Error 404',
    title: 'This page could not be found.',
    description:
      'The address may be out of date, or the page may have moved. Start again from the latest edition or search our reporting.',
    home: 'Back to the front page',
    search: 'Search Notícias',
    portfolio: 'Portfolio',
    language: 'Português',
    actions: 'Page navigation',
    languageLabel: 'Read in Portuguese',
  },
};

/**
 * Render the localized recovery page for an unknown route.
 * @param {import('../types.ts').RenderContext} context
 * @returns {string}
 */
export default function renderError(context) {
  const { locale } = context;
  const labels = copy[locale];
  const alternateLocale = locale === 'en' ? 'pt-BR' : 'en';
  const homeHref = localUrl('', locale);
  const searchHref = localUrl('busca', locale);
  const languageHref = localUrl('404', alternateLocale);

  return `<section class="error-page" aria-labelledby="error-page-title">
  <div class="error-page__content">
    <p class="error-page__eyebrow">${escapeHtml(labels.eyebrow)}</p>
    <h1 id="error-page-title">${escapeHtml(labels.title)}</h1>
    <p class="error-page__description">${escapeHtml(labels.description)}</p>

    <nav class="error-page__actions" aria-label="${escapeHtml(labels.actions)}">
      <a class="error-page__action error-page__action--primary" href="${escapeHtml(homeHref)}">
        ${escapeHtml(labels.home)} <span aria-hidden="true">↗</span>
      </a>
      <a class="error-page__action" href="${escapeHtml(searchHref)}">
        ${escapeHtml(labels.search)} <span aria-hidden="true">↗</span>
      </a>
      <a class="error-page__action" href="/">
        ${escapeHtml(labels.portfolio)} <span aria-hidden="true">↗</span>
      </a>
      <a class="error-page__action error-page__action--language" href="${escapeHtml(languageHref)}" lang="${escapeHtml(alternateLocale)}" hreflang="${escapeHtml(alternateLocale)}" aria-label="${escapeHtml(labels.languageLabel)}">
        ${escapeHtml(labels.language)}
      </a>
    </nav>
  </div>
</section>`;
}
