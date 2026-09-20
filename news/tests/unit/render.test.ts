import { expect, it } from 'vitest';
import { escapeHtml } from '../../src/render/html.js';
import { createRoutes } from '../../src/render/routes.js';
import { article, edition } from './fixtures';

it('escapes source values in both text and quoted HTML attributes', () => {
  expect(escapeHtml('<img src=x onerror="alert(1)"> & \'')).toBe(
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;',
  );
});

it('generates matching bilingual routes without modifying the input catalog', () => {
  const catalog = { articles: [article], editions: [edition] };
  const original = JSON.stringify(catalog);
  const routes = createRoutes(catalog);
  const portuguese = routes
    .filter((route) => route.locale === 'pt-BR')
    .map((route) => route.path);
  const english = routes
    .filter((route) => route.locale === 'en')
    .map((route) => route.path);
  expect(portuguese).toEqual(english);
  expect(new Set(portuguese).size).toBe(portuguese.length);
  expect(portuguese).toContain(`artigos/${article.slug}`);
  expect(portuguese).toContain('');
  expect(JSON.stringify(catalog)).toBe(original);
});
