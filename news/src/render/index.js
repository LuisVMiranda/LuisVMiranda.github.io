import { renderShell } from './shell.js';
import { sectionLabel } from '../modules/content/sections.ts';
import home from './pages/home.js';
import article from './pages/article.js';
import search from './pages/search.js';
import archive from './pages/archive.js';
import editorial from './pages/editorial.js';
import error from './pages/error.js';
import brasil from './pages/sections/brasil.js';
import mundo from './pages/sections/mundo.js';
import politica from './pages/sections/politica.js';
import economia from './pages/sections/economia.js';
import tecnologia from './pages/sections/tecnologia.js';
import ciencia from './pages/sections/ciencia.js';
import cultura from './pages/sections/cultura.js';
import esportes from './pages/sections/esportes.js';

/** @type {Record<string, (context: import('./types.ts').RenderContext) => string>} */
const views = {
  '': home,
  artigos: article,
  busca: search,
  arquivo: archive,
  edicao: archive,
  editorial,
  404: error,
  'secao/brasil': brasil,
  'secao/mundo': mundo,
  'secao/politica': politica,
  'secao/economia': economia,
  'secao/tecnologia': tecnologia,
  'secao/ciencia': ciencia,
  'secao/cultura': cultura,
  'secao/esportes': esportes,
};

/** @type {Record<string, Record<string, string>>} */
const titles = {
  'pt-BR': {
    '': 'O que importa hoje',
    busca: 'Buscar',
    arquivo: 'Arquivo de edições',
    edicao: 'Edição',
    editorial: 'Política editorial',
    404: 'Página não encontrada',
  },
  en: {
    '': 'The stories that matter',
    busca: 'Search',
    arquivo: 'Edition archive',
    edicao: 'Edition',
    editorial: 'Editorial policy',
    404: 'Page not found',
  },
};

/** @param {import('./types.ts').RenderContext} context */
function enrich(context) {
  const story = context.articles.find(
    (item) => context.path === `artigos/${item.slug}`,
  );
  const edition = context.path.startsWith('edicao/')
    ? context.editions.find((item) => context.path === `edicao/${item.id}`)
    : context.editions[0];
  const related = story
    ? context.articles
        .filter(
          (item) => item.id !== story.id && item.section === story.section,
        )
        .slice(0, 3)
    : [];
  return {
    ...context,
    related,
    ...(story
      ? {
          article: story,
          description: story.translations[context.locale].summary,
        }
      : {}),
    ...(edition ? { edition } : {}),
    ...(context.path.startsWith('edicao/') && edition
      ? { selectedEdition: edition }
      : {}),
  };
}

/** @param {import('./types.ts').RenderContext} context */
function pageTitle(context) {
  if (context.article)
    return context.article.translations[context.locale].title;
  if (context.path.startsWith('secao/')) {
    const id = /** @type {import('../modules/content/types.ts').SectionId} */ (
      context.path.split('/')[1]
    );
    return sectionLabel(id, context.locale);
  }
  return (
    titles[context.locale]?.[context.path.split('/')[0] ?? ''] ?? 'Notícias'
  );
}

/** @param {import('./types.ts').RenderContext} input
 * @returns {string}
 */
export function renderPage(input) {
  const context = enrich(input);
  const key = context.path.startsWith('secao/')
    ? context.path
    : (context.path.split('/')[0] ?? '');
  const view = views[key];
  if (!view) throw new Error(`Missing static page renderer: ${context.path}`);
  return renderShell({ ...context, title: pageTitle(context) }, view(context));
}
