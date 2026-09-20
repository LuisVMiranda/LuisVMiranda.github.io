import { createSearchController } from '../modules/discovery/search.ts';

const root = document.querySelector('[data-search-root]');
if (root instanceof HTMLElement) void createSearchController({ root });
