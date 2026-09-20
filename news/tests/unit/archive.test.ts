import { expect, it } from 'vitest';
import { archiveRoutes } from '../../src/modules/editions/routes';
import { edition } from './fixtures';
it('builds ordinary pagination with section filters applied before pagination', () => {
  const editions = Array.from({ length: 21 }, (_, index) => ({
    ...edition,
    id: `edition-${index}`,
  }));
  const routes = archiveRoutes(editions);
  expect(routes.find((route) => route.path === 'arquivo/pagina/3')?.page).toBe(
    3,
  );
  expect(
    routes.find((route) => route.path === 'arquivo/secao/brasil/pagina/3')
      ?.pageCount,
  ).toBe(3);
  expect(
    routes.find((route) => route.path === 'arquivo/secao/mundo')?.editions,
  ).toEqual([]);
  expect(
    routes.some((route) => route.path === 'arquivo/secao/mundo/pagina/2'),
  ).toBe(false);
});
