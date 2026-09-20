import type { Edition, SectionId } from '../content/types';
import { sections } from '../content/sections';
export interface ArchiveRoute {
  path: string;
  editions: Edition[];
  page: number;
  pageCount: number;
  sectionFilter?: SectionId;
}
function pages(editions: Edition[], section?: SectionId): ArchiveRoute[] {
  const filtered = section
    ? editions.filter(
        (edition) => edition.sections[section].articleIds.length > 0,
      )
    : editions;
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const base = section ? `arquivo/secao/${section}` : 'arquivo';
  return Array.from({ length: pageCount }, (_, index) => ({
    path: index === 0 ? base : `${base}/pagina/${index + 1}`,
    editions: filtered,
    page: index + 1,
    pageCount,
    ...(section ? { sectionFilter: section } : {}),
  }));
}
export function archiveRoutes(editions: Edition[]): ArchiveRoute[] {
  return [
    ...pages(editions),
    ...sections.flatMap(({ id }) => pages(editions, id)),
  ];
}
