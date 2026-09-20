import type {
  Article,
  Edition,
  Locale,
  SectionId,
} from '../modules/content/types';

export interface Catalog {
  articles: Article[];
  editions: Edition[];
}

export interface RouteContext extends Catalog {
  locale: Locale;
  path: string;
  page?: number;
  pageCount?: number;
  sectionFilter?: SectionId;
}

export interface RenderContext extends RouteContext {
  preview: boolean;
  site: string;
  title?: string;
  description?: string;
  article?: Article;
  edition?: Edition;
  selectedEdition?: Edition;
  related?: Article[];
  assets: {
    styles: string;
    client: string;
    search: string;
    themeInit: string;
  };
}
