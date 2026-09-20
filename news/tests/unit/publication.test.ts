import { expect, it } from 'vitest';
import { validateDeployment } from '../../src/modules/editions/publication';
import {
  assetUrl,
  localUrl,
  routePath,
  formatArticleDate,
} from '../../src/modules/content/urls';
import { article } from './fixtures';

const state = {
  candidateCommit: 'new',
  currentCommit: 'new',
  contentRevision: 'content-2',
  approvedRevision: 'content-2',
  preview: false,
};
it('refuses previews, competing obsolete deployments and unapproved content', () => {
  expect(() => validateDeployment(state)).not.toThrow();
  expect(() =>
    validateDeployment({ ...state, candidateCommit: 'old' }),
  ).toThrow('Obsolete');
  expect(() => validateDeployment({ ...state, preview: true })).toThrow(
    'preview',
  );
  expect(() =>
    validateDeployment({ ...state, approvedRevision: 'content-1' }),
  ).toThrow('approval');
});
it('permits rollback only as a current reviewed revision', () => {
  expect(() =>
    validateDeployment({
      ...state,
      candidateCommit: 'revert',
      currentCommit: 'revert',
      contentRevision: 'content-1',
      approvedRevision: 'content-1',
    }),
  ).not.toThrow();
});
it('keeps static routes separate from public Pages URLs', () => {
  expect(routePath('secao/brasil', 'en')).toBe('/en/secao/brasil/');
  expect(localUrl('secao/brasil', 'en')).toBe('/news/en/secao/brasil/');
  expect(assetUrl('/pagefind/pagefind.js')).toBe('/news/pagefind/pagefind.js');
});

it('retains a source calendar date when no publication time was supplied', () => {
  expect(
    formatArticleDate(
      {
        ...article,
        publishedAt: '2026-09-18T00:00:00Z',
        publishedDate: '2026-09-18',
      },
      'en',
    ),
  ).toBe('September 18, 2026');
});
