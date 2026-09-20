import { assetUrl } from '../content/urls';

export type SearchLocale = 'pt-BR' | 'en';

export interface SearchFilters {
  section?: string;
}

export interface PagefindResultData {
  url?: string;
  excerpt?: string;
  plain_excerpt?: string;
  meta?: Record<string, unknown>;
  sub_results?: Array<{
    title?: string;
    excerpt?: string;
    plain_excerpt?: string;
  }>;
}

export interface PagefindResult {
  data: () => Promise<PagefindResultData> | PagefindResultData;
}

export interface PagefindSearchResponse {
  results?: PagefindResult[];
  unfilteredResultCount?: number;
}

export interface PagefindSearchInterface {
  options?: (options: { baseUrl: string }) => Promise<unknown> | unknown;
  init?: () => Promise<unknown> | unknown;
  search: (
    query: string | null,
    options?: { filters?: Record<string, string> },
  ) => Promise<PagefindSearchResponse>;
}

export type PagefindLoader = () => Promise<PagefindSearchInterface>;

export interface SearchCopy {
  fallbackTitle: string;
  idle: string;
  loading: string;
  error: string;
  empty: string;
  resultSingular: (count: number) => string;
  resultPlural: (count: number) => string;
}

export interface SearchControllerOptions {
  root: HTMLElement;
  pagefind?: PagefindSearchInterface;
  searchInterface?: PagefindSearchInterface;
  loadPagefind?: PagefindLoader;
  locale?: SearchLocale;
  copy?: Partial<SearchCopy>;
  history?: Pick<History, 'pushState'>;
  location?: Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'origin'>;
  window?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export interface SearchController {
  run(query?: string, section?: string, pushHistory?: boolean): Promise<void>;
  syncFromUrl(): Promise<void>;
  clear(): void;
  destroy(): void;
}

const copyByLocale: Record<SearchLocale, SearchCopy> = {
  'pt-BR': {
    fallbackTitle: 'Notícias',
    idle: 'Digite um termo para buscar.',
    loading: 'Buscando…',
    error: 'Não foi possível carregar a busca agora.',
    empty: 'Nenhum resultado encontrado.',
    resultSingular: (count) => `${count} resultado encontrado`,
    resultPlural: (count) => `${count} resultados encontrados`,
  },
  en: {
    fallbackTitle: 'Notícias',
    idle: 'Enter a term to search.',
    loading: 'Searching…',
    error: 'Search is unavailable right now.',
    empty: 'No results found.',
    resultSingular: (count) => `${count} result found`,
    resultPlural: (count) => `${count} results found`,
  },
};

const defaultPagefindLoader: PagefindLoader = async () => {
  // The static build generates the index after rendering the approved pages.
  const modulePath = assetUrl('pagefind/pagefind.js');
  const pagefindModule = await import(modulePath);
  return (pagefindModule.default ?? pagefindModule) as PagefindSearchInterface;
};

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function resultTitle(data: PagefindResultData, fallbackTitle: string): string {
  return (
    textValue(data.meta?.title) || textValue(data.meta?.name) || fallbackTitle
  );
}

function resultSummary(data: PagefindResultData): string {
  const metadata = data.meta ?? {};
  return (
    textValue(metadata.summary) ||
    textValue(metadata.description) ||
    textValue(metadata.dek) ||
    textValue(data.plain_excerpt) ||
    textValue(data.excerpt).replace(/<[^>]*>/g, '')
  );
}

function resultUrl(data: PagefindResultData): string {
  const value = textValue(data.url);
  if (!value || /^(?:javascript|data|vbscript):/i.test(value)) return '#';
  return value;
}

function copyWithDefaults(
  locale: SearchLocale,
  copy?: Partial<SearchCopy>,
): SearchCopy {
  return { ...copyByLocale[locale], ...copy };
}

function resolveLocale(root: HTMLElement, locale?: SearchLocale): SearchLocale {
  if (locale) return locale;
  return root.dataset.locale === 'en' ? 'en' : 'pt-BR';
}

function resolveHistory(
  history: Pick<History, 'pushState'> | undefined,
): Pick<History, 'pushState'> | undefined {
  return (
    history ?? (typeof window !== 'undefined' ? window.history : undefined)
  );
}

function resolveLocation(
  location:
    | Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'origin'>
    | undefined,
):
  | Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'origin'>
  | undefined {
  return (
    location ?? (typeof window !== 'undefined' ? window.location : undefined)
  );
}

function resolveWindow(
  browserWindow:
    Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined,
): Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined {
  return browserWindow ?? (typeof window !== 'undefined' ? window : undefined);
}

function resolveLoader(loader: PagefindLoader | undefined): PagefindLoader {
  return loader ?? defaultPagefindLoader;
}

function resolvePagefind(
  pagefind: PagefindSearchInterface | undefined,
  searchInterface: PagefindSearchInterface | undefined,
): PagefindSearchInterface | undefined {
  return pagefind ?? searchInterface;
}

function getElement<T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
): T | null {
  const element = root.querySelector(selector);
  return element instanceof HTMLElement ? (element as T) : null;
}

function getSectionIds(sectionSelect: HTMLSelectElement | null): Set<string> {
  if (!sectionSelect) return new Set();
  return new Set(
    Array.from(sectionSelect.options)
      .map((option) => option.value)
      .filter(Boolean),
  );
}

function setText(element: HTMLElement | null, value: string): void {
  if (element) element.textContent = value;
}

function setUrlState(
  location:
    | Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'origin'>
    | undefined,
  history: Pick<History, 'pushState'> | undefined,
  query: string,
  section: string,
): void {
  if (!location || !history) return;
  const url = new URL(location.href, location.origin || 'http://localhost');
  if (query) url.searchParams.set('q', query);
  else url.searchParams.delete('q');
  if (section) url.searchParams.set('section', section);
  else url.searchParams.delete('section');

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  if (nextUrl !== currentUrl) history.pushState({}, '', nextUrl);
}

function readUrlState(
  location: Pick<Location, 'search'> | undefined,
  sectionIds: Set<string>,
): { query: string; section: string } {
  const params = new URLSearchParams(location?.search ?? '');
  const section = params.get('section') ?? '';
  return {
    query: params.get('q') ?? '',
    section: sectionIds.size === 0 || sectionIds.has(section) ? section : '',
  };
}

function renderResult(
  container: HTMLElement,
  data: PagefindResultData,
  fallbackTitle: string,
): void {
  const document = container.ownerDocument;
  const item = document.createElement('li');
  item.className = 'search-result';

  const link = document.createElement('a');
  link.className = 'search-result__title';
  link.href = resultUrl(data);
  link.textContent = resultTitle(data, fallbackTitle);
  item.append(link);

  const summary = resultSummary(data);
  if (summary) {
    const excerpt = document.createElement('p');
    excerpt.className = 'search-result__summary';
    // textContent intentionally treats Pagefind excerpts as plain text.
    excerpt.textContent = summary;
    item.append(excerpt);
  }

  container.append(item);
}

class SearchControllerImpl implements SearchController {
  private readonly root: HTMLElement;
  private readonly form: HTMLFormElement | null;
  private readonly input: HTMLInputElement | null;
  private readonly sectionSelect: HTMLSelectElement | null;
  private readonly status: HTMLElement | null;
  private readonly results: HTMLElement | null;
  private readonly pagefindProvided: PagefindSearchInterface | undefined;
  private readonly loadPagefind: PagefindLoader;
  private readonly copy: SearchCopy;
  private readonly history: Pick<History, 'pushState'> | undefined;
  private readonly location:
    | Pick<Location, 'href' | 'pathname' | 'search' | 'hash' | 'origin'>
    | undefined;
  private readonly browserWindow:
    Pick<Window, 'addEventListener' | 'removeEventListener'> | undefined;
  private readonly sectionIds: Set<string>;
  private pagefind: PagefindSearchInterface | undefined;
  private pagefindPromise: Promise<PagefindSearchInterface> | undefined;
  private generation = 0;
  private destroyed = false;

  constructor(options: SearchControllerOptions) {
    this.root = options.root;
    this.form = getElement<HTMLFormElement>(this.root, '[data-search-form]');
    this.input = getElement<HTMLInputElement>(this.root, '[data-search-input]');
    this.sectionSelect = getElement<HTMLSelectElement>(
      this.root,
      '[data-search-section]',
    );
    this.status = getElement<HTMLElement>(this.root, '[data-search-status]');
    this.results = getElement<HTMLElement>(this.root, '[data-search-results]');
    this.pagefindProvided = resolvePagefind(
      options.pagefind,
      options.searchInterface,
    );
    this.loadPagefind = resolveLoader(options.loadPagefind);
    const locale = resolveLocale(this.root, options.locale);
    this.copy = copyWithDefaults(locale, options.copy);
    this.history = resolveHistory(options.history);
    this.location = resolveLocation(options.location);
    this.browserWindow = resolveWindow(options.window);
    this.sectionIds = getSectionIds(this.sectionSelect);
  }

  bind(): void {
    this.form?.addEventListener('submit', this.handleSubmit);
    this.sectionSelect?.addEventListener('change', this.handleSectionChange);
    this.browserWindow?.addEventListener('popstate', this.handlePopState);
  }

  async run(query = '', section = '', pushHistory = true): Promise<void> {
    if (this.destroyed) return;
    const normalizedQuery = query.trim();
    const normalizedSection = this.normalizeSection(section);
    if (pushHistory)
      setUrlState(
        this.location,
        this.history,
        normalizedQuery,
        normalizedSection,
      );
    this.updateControls(normalizedQuery, normalizedSection);
    const generation = ++this.generation;

    if (!normalizedQuery && !normalizedSection) {
      this.clearResults(generation);
      return;
    }

    setText(this.status, this.copy.loading);
    await this.searchAndRender(normalizedQuery, normalizedSection, generation);
  }

  private async searchAndRender(
    query: string,
    section: string,
    generation: number,
  ): Promise<void> {
    try {
      const pagefind = await this.getPagefind();
      if (!this.isCurrent(generation)) return;
      const response = await pagefind.search(
        query || null,
        this.searchOptions(section),
      );
      if (!this.isCurrent(generation)) return;
      const resultData = await Promise.all(
        (response.results ?? []).map((result) =>
          Promise.resolve(result.data()),
        ),
      );
      if (!this.isCurrent(generation)) return;
      this.renderResults(
        resultData,
        section ? undefined : response.unfilteredResultCount,
      );
    } catch {
      if (!this.isCurrent(generation)) return;
      this.clearResultList();
      setText(this.status, this.copy.error);
      this.root.dataset.searchState = 'error';
    }
  }

  async syncFromUrl(): Promise<void> {
    if (this.destroyed) return;
    const state = readUrlState(this.location, this.sectionIds);
    await this.run(state.query, state.section, false);
  }

  clear(): void {
    this.generation += 1;
    this.updateControls('', '');
    this.clearResultList();
    setText(this.status, this.copy.idle);
    this.root.dataset.searchState = 'idle';
  }

  destroy(): void {
    this.destroyed = true;
    this.form?.removeEventListener('submit', this.handleSubmit);
    this.sectionSelect?.removeEventListener('change', this.handleSectionChange);
    this.browserWindow?.removeEventListener('popstate', this.handlePopState);
  }

  private readonly handleSubmit = (event: Event): void => {
    event.preventDefault();
    void this.run(
      this.input?.value ?? '',
      this.sectionSelect?.value ?? '',
      true,
    );
  };

  private readonly handleSectionChange = (): void => {
    void this.run(
      this.input?.value ?? '',
      this.sectionSelect?.value ?? '',
      true,
    );
  };

  private readonly handlePopState = (): void => {
    void this.syncFromUrl();
  };

  private async getPagefind(): Promise<PagefindSearchInterface> {
    if (this.pagefind) return this.pagefind;
    if (!this.pagefindPromise) {
      this.pagefindPromise = (
        this.pagefindProvided
          ? Promise.resolve(this.pagefindProvided)
          : this.loadPagefind()
      )
        .then(async (pagefind) => {
          if (typeof pagefind.options === 'function') {
            await pagefind.options({ baseUrl: '/news/' });
          }
          if (typeof pagefind.init === 'function') await pagefind.init();
          this.pagefind = pagefind;
          return pagefind;
        })
        .catch((error: unknown) => {
          this.pagefindPromise = undefined;
          throw error;
        });
    }
    return this.pagefindPromise;
  }

  private updateControls(query: string, section: string): void {
    if (this.input && this.input.value !== query) this.input.value = query;
    if (this.sectionSelect && this.sectionSelect.value !== section)
      this.sectionSelect.value = section;
  }

  private normalizeSection(section: string): string {
    if (this.sectionIds.size === 0 || this.sectionIds.has(section))
      return section;
    return '';
  }

  private searchOptions(
    section: string,
  ): { filters: { section: string } } | undefined {
    return section ? { filters: { section } } : undefined;
  }

  private clearResultList(): void {
    if (this.results) this.results.replaceChildren();
  }

  private clearResults(generation: number): void {
    if (!this.isCurrent(generation)) return;
    this.clearResultList();
    setText(this.status, this.copy.idle);
    this.root.dataset.searchState = 'idle';
  }

  private renderResults(
    data: PagefindResultData[],
    unfilteredCount?: number,
  ): void {
    this.clearResultList();
    if (!data.length) {
      setText(this.status, this.copy.empty);
      this.root.dataset.searchState = 'empty';
      return;
    }

    const count =
      typeof unfilteredCount === 'number' ? unfilteredCount : data.length;
    const resultCopy =
      count === 1 ? this.copy.resultSingular : this.copy.resultPlural;
    setText(this.status, resultCopy(count));
    this.root.dataset.searchState = 'results';
    if (this.results)
      data.forEach((result) =>
        renderResult(this.results!, result, this.copy.fallbackTitle),
      );
  }

  private isCurrent(generation: number): boolean {
    return !this.destroyed && generation === this.generation;
  }
}

export async function createSearchController(
  options: SearchControllerOptions,
): Promise<SearchController> {
  const controller = new SearchControllerImpl(options);
  controller.bind();
  await controller.syncFromUrl();
  return controller;
}

export const searchController = createSearchController;
export default createSearchController;
