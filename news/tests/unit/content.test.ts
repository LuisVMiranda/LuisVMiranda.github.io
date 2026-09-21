import { describe, expect, it } from 'vitest';
import { articleSchema } from '../../src/modules/content/schema';
import {
  contentRevision,
  isApproved,
  validateCatalog,
} from '../../src/modules/editions/integrity';
import { article, edition } from './fixtures';
import { articleUrl, localUrl } from '../../src/modules/content/urls';

describe('publication invariants', () => {
  it('rejects missing translations and invalid update dates', () => {
    expect(
      articleSchema.safeParse({
        ...article,
        translations: { en: article.translations.en },
      }).success,
    ).toBe(false);
    expect(
      articleSchema.safeParse({ ...article, updatedAt: '2020-01-01T00:00:00Z' })
        .success,
    ).toBe(false);
  });
  it('rejects a one-sided AI summary', () => {
    const result = articleSchema.safeParse({
      ...article,
      translations: {
        ...article.translations,
        en: {
          ...article.translations.en,
          aiSummary: ['An English-only summary should not be publishable.'],
        },
      },
    });
    expect(result.success).toBe(false);
  });
  it('requires permission evidence for licensed reproductions', () => {
    const result = articleSchema.safeParse({
      ...article,
      rights: { mode: 'licensed-reproduction' },
    });
    expect(result.success).toBe(false);
  });
  it('rejects duplicate identities and broken edition references', () => {
    expect(() => validateCatalog([article, article], [edition])).toThrow(
      'Duplicate',
    );
    expect(() => validateCatalog([], [edition])).toThrow('Broken article');
  });
  it('rejects duplicate ranks and undocumented shortages', () => {
    const duplicate = structuredClone(edition);
    duplicate.sections.brasil.articleIds.push(article.id);
    expect(() => validateCatalog([article], [duplicate])).toThrow(
      'Duplicate ranks',
    );
    duplicate.sections.brasil = { articleIds: [], shortfall: '' };
    expect(() => validateCatalog([article], [duplicate])).toThrow(
      'Missing shortfall',
    );
  });
  it('invalidates approval after edits and is independent of object key ordering', () => {
    const revision = contentRevision([article], [edition]);
    const approval = {
      revision,
      approvedBy: 'Reviewer',
      approvedAt: '2026-09-20T00:00:00Z',
    };
    expect(isApproved([article], [edition], approval)).toBe(true);
    expect(
      isApproved([{ ...article, slug: 'changed' }], [edition], approval),
    ).toBe(false);
    expect(contentRevision([{ ...article }], [edition])).toBe(revision);
    expect(isApproved([article], [edition], null)).toBe(false);
  });
  it('keeps translated identity in deterministic routes', () => {
    expect(articleUrl(article, 'pt-BR')).toBe('/news/artigos/teste/');
    expect(articleUrl(article, 'en')).toBe('/news/en/artigos/teste/');
    expect(localUrl('', 'pt-BR')).toBe('/news/');
  });
});
