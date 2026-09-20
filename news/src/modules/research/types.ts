import type { SectionId } from '../content/types';

export interface Candidate {
  url: string;
  title: string;
  snippet: string;
  publishedAt: string | null;
  source: string;
  section: SectionId;
  query: string;
}
export interface SearchAdapter {
  search(query: string, section: SectionId): Promise<Candidate[]>;
}
export interface VerifiedCandidate extends Candidate {
  eventId: string;
  verified: boolean;
  evidence: string;
  scores: { relevance: number; impact: number; quality: number };
}
