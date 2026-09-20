// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';
import {
  createSearchController,
  type PagefindSearchResponse,
  type SearchController,
} from '../../src/modules/discovery/search';
let controller: SearchController | undefined;
afterEach(() => {
  controller?.destroy();
  document.body.replaceChildren();
  history.replaceState({}, '', '/');
});
function root(): HTMLElement {
  document.body.innerHTML =
    '<section data-locale="en"><form data-search-form><input data-search-input><select data-search-section><option value=""></option><option value="brasil">Brazil</option></select></form><p data-search-status></p><ol data-search-results></ol></section>';
  return document.querySelector('section')!;
}
function deferred() {
  let resolve!: (value: PagefindSearchResponse) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<PagefindSearchResponse>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const result = (title: string): PagefindSearchResponse => ({
  results: [
    {
      data: async () => ({
        url: '/en/artigos/test/',
        meta: { title, summary: '<script>unsafe</script>' },
      }),
    },
  ],
});
it('ignores an older response after a newer query completes', async () => {
  const older = deferred();
  const newer = deferred();
  const element = root();
  controller = await createSearchController({
    root: element,
    pagefind: {
      search: (query) => (query === 'old' ? older.promise : newer.promise),
    },
  });
  const first = controller.run('old');
  await Promise.resolve();
  const second = controller.run('new');
  newer.resolve(result('New headline'));
  await second;
  older.resolve(result('Old headline'));
  await first;
  expect(element.textContent).toContain('New headline');
  expect(element.textContent).not.toContain('Old headline');
  expect(element.querySelector('script')).toBeNull();
});
it('ignores errors after clearing and renders a current missing-index error', async () => {
  const pending = deferred();
  const element = root();
  controller = await createSearchController({
    root: element,
    pagefind: { search: () => pending.promise },
  });
  const first = controller.run('query', '', false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  controller.clear();
  pending.reject(new Error('Unavailable'));
  await first;
  expect(element.dataset.searchState).toBe('idle');
  controller.destroy();
  controller = await createSearchController({
    root: element,
    loadPagefind: async () => {
      throw new Error('Missing index');
    },
  });
  await controller.run('query', '', false);
  expect(element.dataset.searchState).toBe('error');
});
