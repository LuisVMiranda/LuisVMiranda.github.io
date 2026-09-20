import type { Candidate, SearchAdapter } from './types';
import type { SectionId } from '../content/types';

interface SearxResult {
  url?: string;
  title?: string;
  content?: string;
  publishedDate?: string;
  engine?: string;
}
function toCandidate(
  result: SearxResult,
  section: SectionId,
  query: string,
): Candidate | undefined {
  if (!result.url || !result.title) return undefined;
  try {
    const url = new URL(result.url);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return {
      url: url.href,
      title: result.title,
      snippet: result.content || '',
      publishedAt: result.publishedDate || null,
      source: url.hostname,
      section,
      query,
    };
  } catch {
    return undefined;
  }
}
export class SearxAdapter implements SearchAdapter {
  constructor(private endpoint = 'http://localhost:8080') {
    const url = new URL(endpoint);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      throw new Error('Research endpoint must be local');
  }
  async search(query: string, section: SectionId): Promise<Candidate[]> {
    const url = new URL('/search', this.endpoint);
    url.search = new URLSearchParams({
      q: query,
      categories: 'news',
      time_range: 'week',
      format: 'json',
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`SearXNG returned ${response.status}`);
    const data = (await response.json()) as { results?: SearxResult[] };
    if (!Array.isArray(data.results))
      throw new Error('Malformed search response');
    return data.results
      .map((result) => toCandidate(result, section, query))
      .filter((result): result is Candidate => Boolean(result));
  }
}

export class FixtureAdapter implements SearchAdapter {
  constructor(private candidates: Candidate[]) {}
  async search(_query: string, section: SectionId): Promise<Candidate[]> {
    return this.candidates.filter((candidate) => candidate.section === section);
  }
}
