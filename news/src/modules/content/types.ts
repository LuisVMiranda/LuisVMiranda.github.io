export type Locale = 'pt-BR' | 'en';
export type SectionId =
  | 'brasil'
  | 'mundo'
  | 'politica'
  | 'economia'
  | 'tecnologia'
  | 'ciencia'
  | 'cultura'
  | 'esportes';

export interface Translation {
  title: string;
  summary: string;
  aiSummary?: string | undefined;
  paragraphs: string[];
  correction?: string | undefined;
}

export interface Article {
  id: string;
  slug: string;
  section: SectionId;
  secondarySections: SectionId[];
  publishedAt: string;
  publishedDate?: string | undefined;
  updatedAt: string;
  sources: { name: string; url: string }[];
  translations: Record<Locale, Translation>;
}

export interface Edition {
  id: string;
  cutoff: string;
  sections: Record<
    SectionId,
    {
      articleIds: string[];
      shortfall: string;
      shortfallEn?: string | undefined;
    }
  >;
  leadArticleId?: string | undefined;
}

export interface Approval {
  revision: string;
  approvedBy: string;
  approvedAt: string;
}
