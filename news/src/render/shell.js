import {
  sectionLabel,
  sections,
  sectionStyle,
} from '../modules/content/sections.ts';
import {
  articleDate,
  assetUrl,
  formatDate,
  localUrl,
} from '../modules/content/urls.ts';
import { escapeHtml as escaped } from './html.js';

const DEFAULT_DESCRIPTION = {
  'pt-BR': 'Notícias verificadas. Fontes, contexto e clareza.',
  en: 'Verified news. Sources, context and clarity.',
};

/** @param {string} site @param {string} path @param {import('./types.ts').RenderContext['locale']} locale */
function absoluteUrl(site, path, locale) {
  const href = path.startsWith('/') ? path : localUrl(path, locale);
  return new URL(href, site).href;
}

/** @param {import('./types.ts').RenderContext} context */
function canonicalUrl(context) {
  return absoluteUrl(context.site, context.path, context.locale);
}

/** @param {import('./types.ts').RenderContext} context */
function renderThemeButton(context) {
  const en = context.locale === 'en';
  return `<button class="theme-toggle" type="button" data-theme-toggle
    data-light-label="${escaped(en ? 'Switch to light mode' : 'Ativar modo claro')}"
    data-dark-label="${escaped(en ? 'Switch to dark mode' : 'Ativar modo escuro')}"
    aria-label="${escaped(en ? 'Switch theme' : 'Alternar tema')}">
    <svg class="sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
    <svg class="moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.5 14A8.6 8.6 0 0 1 10 3.5 8.7 8.7 0 1 0 20.5 14Z"/></svg>
  </button>`;
}

/** @param {string} path */
function sectionForPath(path) {
  if (!path.startsWith('secao/')) return undefined;
  const id = path.slice('secao/'.length).replace(/\/$/, '');
  return sections.find((section) => section.id === id);
}

/** @param {import('./types.ts').RenderContext} context */
function latestEdition(context) {
  if (context.edition) return context.edition;
  return [...(context.editions || [])].sort((left, right) =>
    right.cutoff.localeCompare(left.cutoff),
  )[0];
}

/** @param {import('./types.ts').RenderContext} context @param {import('../modules/content/sections.ts').Section} section */
function renderSectionIdentity(context, section) {
  const edition = latestEdition(context);
  const date = edition
    ? `<time class="section-masthead__date" datetime="${escaped(edition.cutoff)}">${escaped(formatDate(edition.cutoff, context.locale))}</time>`
    : '';
  return `<div class="section-masthead">
      <span class="section-masthead__divider" aria-hidden="true">/</span>
      <div class="section-masthead__identity">
        <h1 id="section-page-title">${escaped(sectionLabel(section.id, context.locale))}</h1>
        ${date}
      </div>
    </div>`;
}

/** @param {import('./types.ts').RenderContext} context */
function renderNavigationLinks(context) {
  const { locale, path } = context;
  return sections
    .map((section) => {
      const current =
        path === `secao/${section.id}` ? ' aria-current="page"' : '';
      return `<a style="${escaped(sectionStyle(section.id))}" href="${escaped(localUrl(`secao/${section.id}`, locale))}"${current}>${escaped(section.label[locale])}</a>`;
    })
    .join('');
}

/** @param {import('./types.ts').RenderContext} context @param {import('../modules/content/sections.ts').Section | undefined} section */
function renderMastheadBrand(context, section) {
  const { locale } = context;
  const en = locale === 'en';
  const brand = `<a class="brand" href="${escaped(localUrl('', locale))}">Notícias<span>${en ? 'Sources. Context. Clarity.' : 'Fontes. Contexto. Clareza.'}</span></a>`;
  const sectionIdentity = section
    ? renderSectionIdentity(context, section)
    : '';
  const mastheadBrand = section
    ? `<div class="masthead-lockup">${brand}${sectionIdentity}</div>`
    : brand;
  return mastheadBrand;
}

/** @param {import('./types.ts').RenderContext} context @param {import('../modules/content/sections.ts').Section | undefined} section */
function renderMasthead(context, section) {
  const { locale } = context;
  const en = locale === 'en';
  return `<div class="masthead${section ? ' masthead--section' : ''}">
      ${renderMastheadBrand(context, section)}
      <div class="utilities">
        <a class="search-link" href="${escaped(localUrl('busca', locale))}">${en ? 'Search' : 'Buscar'} <span aria-hidden="true">↗</span></a>
        <a class="language-link" href="${escaped(localUrl(context.path, en ? 'pt-BR' : 'en'))}" lang="${en ? 'pt-BR' : 'en'}" hreflang="${en ? 'pt-BR' : 'en'}" aria-label="${escaped(en ? 'Ler em português' : 'Read in English')}">${en ? 'PT-BR' : 'EN'}</a>
        ${renderThemeButton(context)}
      </div>
    </div>`;
}

/** @param {import('./types.ts').RenderContext} context */
function renderNavigation(context) {
  const { locale, path } = context;
  const en = locale === 'en';
  const section = sectionForPath(path);
  const searchUrl = localUrl('busca', locale);
  const links = renderNavigationLinks(context);
  const sectionClass = section ? ' site-header--section' : '';
  const sectionStyleAttribute = section
    ? ` style="${escaped(sectionStyle(section.id))}"`
    : '';
  return `<header class="site-header container${sectionClass}"${sectionStyleAttribute} data-pagefind-ignore>
    ${renderMasthead(context, section)}
    <nav class="desktop-nav" aria-label="${escaped(en ? 'Sections' : 'Editorias')}">${links}</nav>
    <details class="mobile-nav">
      <summary>${en ? 'Browse sections' : 'Explorar editorias'}</summary>
      <nav aria-label="${escaped(en ? 'Mobile sections' : 'Editorias no celular')}">${links}<a href="${escaped(searchUrl)}">${en ? 'Search' : 'Buscar'}</a></nav>
    </details>
  </header>`;
}

/** @param {import('./types.ts').RenderContext} context */
function renderFooter(context) {
  const { locale } = context;
  const en = locale === 'en';
  return `<footer class="site-footer container" data-pagefind-ignore>
    <div class="footer-brand">Notícias<span>${en ? 'A little context. A clearer day.' : 'Mais contexto. Um dia mais claro.'}</span></div>
    <nav aria-label="${escaped(en ? 'Footer' : 'Rodapé')}">
      <a href="${escaped(localUrl('arquivo', locale))}">${en ? 'Archive' : 'Arquivo'}</a>
      <a href="${escaped(localUrl('editorial', locale))}">${en ? 'Editorial policy' : 'Política editorial'}</a>
      <a href="${escaped(assetUrl(en ? 'en/rss.xml' : 'rss.xml'))}">RSS</a>
    </nav>
  </footer>`;
}

/** @param {import('./types.ts').RenderContext} context @param {string} canonical */
function renderStructuredData(context, canonical) {
  if (!context.article) return '';
  const translation = context.article.translations[context.locale];
  const data = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: translation.title,
    description: translation.summary,
    datePublished: articleDate(context.article),
    dateModified:
      context.article.updatedAt === context.article.publishedAt
        ? articleDate(context.article)
        : context.article.updatedAt,
    inLanguage: context.locale,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Notícias' },
    citation: context.article.sources.map((source) => source.url),
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>`;
}

/** @param {import('./types.ts').RenderContext} context */
function pageMeta(context) {
  const { locale, path, assets } = context;
  const en = locale === 'en';
  const title = context.title || 'Notícias';
  const description = context.description || DEFAULT_DESCRIPTION[locale];
  const canonical = canonicalUrl(context);
  const feed = absoluteUrl(
    context.site,
    assetUrl(en ? 'en/rss.xml' : 'rss.xml'),
    locale,
  );
  const favicon = absoluteUrl(context.site, assetUrl('favicon.svg'), locale);
  return {
    locale,
    title,
    description,
    canonical,
    feed,
    favicon,
    structured: renderStructuredData(context, canonical),
    robots:
      context.preview || path === '404' || path === 'busca'
        ? '<meta name="robots" content="noindex,nofollow">'
        : '',
    themeInit: assets.themeInit,
  };
}

/** @param {import('./types.ts').RenderContext} context */
function renderHead(context) {
  const meta = pageMeta(context);
  const en = meta.locale === 'en';
  return `<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escaped(meta.title)} — Notícias</title>
    <meta name="description" content="${escaped(meta.description)}">
    <meta name="color-scheme" content="light dark">
    ${meta.robots}
    <link rel="canonical" href="${escaped(meta.canonical)}">
    <link rel="alternate" hreflang="pt-BR" href="${escaped(absoluteUrl(context.site, context.path, 'pt-BR'))}">
    <link rel="alternate" hreflang="en" href="${escaped(absoluteUrl(context.site, context.path, 'en'))}">
    <link rel="alternate" hreflang="x-default" href="${escaped(absoluteUrl(context.site, context.path, 'pt-BR'))}">
    <link rel="alternate" type="application/rss+xml" title="Notícias RSS" href="${escaped(meta.feed)}">
    <link rel="icon" href="${escaped(meta.favicon)}" type="image/svg+xml">
    <meta property="og:title" content="${escaped(meta.title)}">
    <meta property="og:description" content="${escaped(meta.description)}">
    <meta property="og:url" content="${escaped(meta.canonical)}">
    <meta property="og:type" content="${context.article ? 'article' : 'website'}">
    <meta property="og:locale" content="${en ? 'en_US' : 'pt_BR'}">
    ${meta.structured}
    <script>${meta.themeInit}</script>
    <link rel="stylesheet" href="${escaped(context.assets.styles)}">
  </head>`;
}

/** @param {import('./types.ts').RenderContext} context */
function renderClientScripts(context) {
  const client = `<script type="module" src="${escaped(context.assets.client)}"></script>`;
  const search =
    context.path === 'busca'
      ? `<script type="module" src="${escaped(context.assets.search)}"></script>`
      : '';
  return `${client}${search}`;
}

/** @param {import('./types.ts').RenderContext} context */
function renderPreview(context) {
  if (!context.preview) return '';
  const label =
    context.locale === 'en'
      ? 'Editorial preview · Content awaiting approval'
      : 'Prévia editorial · Conteúdo aguardando aprovação';
  return `<aside class="preview-banner" role="status">${label}</aside>`;
}

/** @param {import('./types.ts').RenderContext} context @param {string} body */
export function renderShell(context, body) {
  const skipLabel =
    context.locale === 'en' ? 'Skip to content' : 'Ir para o conteúdo';
  const mainLabel = context.path.startsWith('secao/')
    ? ' aria-labelledby="section-page-title"'
    : '';
  const mainClass = context.path.startsWith('secao/')
    ? 'container shell-main shell-main--section'
    : 'container shell-main';
  return `<!doctype html>
<html lang="${escaped(context.locale)}">
  ${renderHead(context)}
  <body>
    <a href="#main" class="skip-link" tabindex="0">${skipLabel}</a>
    ${renderNavigation(context)}
    ${renderPreview(context)}
    <main id="main" class="${mainClass}"${mainLabel} tabindex="-1">${body}</main>
    ${renderFooter(context)}
    ${renderClientScripts(context)}
  </body>
</html>`;
}
