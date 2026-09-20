import { expect, it, vi, afterEach } from 'vitest';
import { canonicalUrl, selectTopTen } from '../../src/modules/research/rank';
import {
  FixtureAdapter,
  SearxAdapter,
} from '../../src/modules/research/adapters';
import type { VerifiedCandidate } from '../../src/modules/research/types';
const cutoff = '2026-09-20T00:00:00Z';
afterEach(() => vi.unstubAllGlobals());
const candidate: VerifiedCandidate = {
  url: 'https://example.org/news',
  title: 'Test',
  snippet: 'Evidence',
  source: 'example.org',
  section: 'brasil',
  query: 'test',
  publishedAt: '2026-09-19T10:00:00Z',
  eventId: 'event',
  verified: true,
  evidence: 'Source opened and date checked',
  scores: { relevance: 3, impact: 3, quality: 3 },
};
it('canonicalizes tracking URLs without removing meaningful query parameters', () => {
  expect(
    canonicalUrl('https://example.org/news/?id=1&utm_source=test#top'),
  ).toBe('https://example.org/news?id=1');
  expect(() => canonicalUrl('javascript:alert(1)')).toThrow();
});
it('prefers 24-hour stories, expands to seven days, deduplicates events', () => {
  const older = {
    ...candidate,
    url: 'https://example.org/old',
    eventId: 'old',
    publishedAt: '2026-09-15T10:00:00Z',
  };
  const duplicate = { ...candidate, url: 'https://elsewhere.org/same' };
  const stale = {
    ...candidate,
    eventId: 'stale',
    publishedAt: '2026-09-01T10:00:00Z',
  };
  const result = selectTopTen([older, candidate, duplicate, stale], cutoff);
  expect(result).toHaveLength(2);
  expect(result[0]?.eventId).toBe('event');
  expect(result[1]?.eventId).toBe('old');
});
it('never fills shortages with unverified, undated, or future candidates', () => {
  const result = selectTopTen(
    [
      { ...candidate, verified: false },
      { ...candidate, publishedAt: null },
      { ...candidate, publishedAt: '2026-09-21T00:00:00Z' },
    ],
    cutoff,
  );
  expect(result).toEqual([]);
});
it('uses a recorded adapter without a running search instance', async () => {
  expect(
    await new FixtureAdapter([candidate]).search('test', 'brasil'),
  ).toEqual([candidate]);
  expect(() => new SearxAdapter('https://example.org')).toThrow('local');
});
it('skips malformed source URLs and reports search outages', async () => {
  vi.stubGlobal(
    'fetch',
    async () =>
      new Response(
        JSON.stringify({
          results: [
            { url: 'not-a-url', title: 'Bad' },
            { url: 'https://example.org/story', title: 'Valid' },
          ],
        }),
      ),
  );
  expect(await new SearxAdapter().search('query', 'brasil')).toHaveLength(1);
  vi.stubGlobal(
    'fetch',
    async () => new Response('Unavailable', { status: 503 }),
  );
  await expect(new SearxAdapter().search('query', 'brasil')).rejects.toThrow(
    '503',
  );
});
