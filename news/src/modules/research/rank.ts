import type { VerifiedCandidate } from './types';

export function canonicalUrl(input: string): string {
  const url = new URL(input);
  if (url.protocol !== 'https:' && url.protocol !== 'http:')
    throw new Error('Invalid source protocol');
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_|^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, '') || '/';
  return url.href;
}

export function score(candidate: VerifiedCandidate, cutoff: string): number {
  const age = Date.parse(cutoff) - Date.parse(candidate.publishedAt || '');
  const fresh = age <= 86400000 ? 3 : 1;
  return (
    candidate.scores.relevance * 3 +
    candidate.scores.impact * 2 +
    candidate.scores.quality * 2 +
    fresh
  );
}

export function selectTopTen(
  candidates: VerifiedCandidate[],
  cutoff: string,
): VerifiedCandidate[] {
  const end = Date.parse(cutoff);
  if (!Number.isFinite(end)) throw new Error('Invalid research cutoff');
  const eligible = candidates.filter((candidate) => {
    const date = Date.parse(candidate.publishedAt || '');
    return (
      candidate.verified &&
      candidate.evidence.trim() &&
      date <= end &&
      date >= end - 7 * 86400000
    );
  });
  const recent = (candidate: VerifiedCandidate) =>
    Number(end - Date.parse(candidate.publishedAt!) <= 86400000);
  eligible.sort(
    (a, b) =>
      recent(b) - recent(a) ||
      score(b, cutoff) - score(a, cutoff) ||
      a.url.localeCompare(b.url),
  );
  const urls = new Set<string>();
  const events = new Set<string>();
  return eligible
    .filter((candidate) => {
      const url = canonicalUrl(candidate.url);
      if (urls.has(url) || events.has(candidate.eventId)) return false;
      urls.add(url);
      events.add(candidate.eventId);
      return true;
    })
    .slice(0, 10);
}
