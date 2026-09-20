import { expect, it } from 'vitest';
import { Window } from 'happy-dom';
import renderArticle from '../../src/render/pages/article.js';
import { renderShell } from '../../src/render/shell.js';
import type { RenderContext } from '../../src/render/types';
import { article, edition } from './fixtures';

it('renders source text safely and retains bilingual metadata without a framework', () => {
  const headline =
    'An escaped </script><img src=x onerror="alert(1)"> headline';
  const story = {
    ...article,
    translations: {
      ...article.translations,
      en: { ...article.translations.en, title: headline },
    },
  };
  const context: RenderContext = {
    locale: 'en',
    path: `artigos/${story.slug}`,
    title: headline,
    article: story,
    articles: [story],
    editions: [edition],
    related: [],
    preview: false,
    site: 'https://example.com',
    assets: {
      styles: '/news/assets/main.hash.css',
      client: '/news/assets/main.hash.js',
      search: '/news/assets/search.hash.js',
      themeInit: '',
    },
  };
  const window = new Window();
  window.document.write(renderShell(context, renderArticle(context)));
  const document = window.document;
  expect(document.querySelector('h1')?.textContent).toBe(headline);
  expect(document.querySelector('[onerror]')).toBeNull();
  expect(
    document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
  ).toBe(`https://example.com/news/en/artigos/${story.slug}/`);
  expect(document.querySelector('[data-pagefind-body]')).not.toBeNull();
  const structured = JSON.parse(
    document.querySelector('script[type="application/ld+json"]')!.textContent!,
  );
  expect(structured.headline).toBe(headline);
  expect(structured.inLanguage).toBe('en');
  window.happyDOM.abort();
});
