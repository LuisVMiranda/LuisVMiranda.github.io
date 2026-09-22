import { describe, expect, it } from 'vitest';
import { automationIssues } from '../../src/modules/research/automation';
import { article, edition } from './fixtures';

describe('daily news automation gate', () => {
  it('rejects a selection that is not ten complete bilingual articles', () => {
    const issues = automationIssues(edition, [article]);
    expect(
      issues.some((issue) => issue.includes('brasil must contain exactly 10')),
    ).toBe(true);
    expect(issues.some((issue) => issue.includes('AI summary'))).toBe(true);
    expect(
      issues.some((issue) => issue.includes('at least 5 paragraphs')),
    ).toBe(true);
  });

  it('accepts a complete article in every selected section', () => {
    const complete = structuredClone(article);
    complete.rights = { mode: 'original-report' };
    complete.verification = {
      score: 8.7,
      checkedAt: '2026-09-22T12:00:00Z',
      checks: [
        {
          provider: 'Aos Fatos',
          url: 'https://www.aosfatos.org/',
          finding: 'no-match',
          note: 'No matching claim was indexed; this is neutral evidence.',
        },
      ],
      caveat: 'Editorial estimate based on checked sources, not a guarantee.',
    };
    complete.translations['pt-BR'].aiSummary = [
      'Resumo verificado com contexto e consequência imediata.',
      'A relevância pública está explicitada.',
    ];
    complete.translations.en.aiSummary = [
      'Verified summary with context and immediate consequence.',
      'The public relevance is explicit.',
    ];
    complete.translations['pt-BR'].paragraphs = [
      'Primeiro parágrafo com fatos verificados e contexto suficiente para leitores.',
      'Segundo parágrafo explicando a cronologia e as atribuições relevantes.',
      'Terceiro parágrafo registrando a consequência e as incertezas conhecidas.',
      'Quarto parágrafo acrescentando um detalhe relevante já verificado na fonte.',
      'Quinto parágrafo explicando os próximos passos e os limites conhecidos.',
    ];
    complete.translations.en.paragraphs = [
      'First paragraph with verified facts and enough context for readers.',
      'Second paragraph explaining the chronology and relevant attributions.',
      'Third paragraph recording the consequence and known uncertainties.',
      'Fourth paragraph adding another relevant detail already verified in the source.',
      'Fifth paragraph explaining the next steps and known limits.',
    ];
    const completeEdition = structuredClone(edition);
    for (const section of Object.keys(completeEdition.sections)) {
      completeEdition.sections[
        section as keyof typeof completeEdition.sections
      ] = {
        articleIds: [complete.id],
        shortfall: 'Fixture uses one article per section.',
      };
    }
    expect(automationIssues(completeEdition, [complete], 1)).toEqual([]);
    expect(
      automationIssues(completeEdition, [complete], 1, true, true),
    ).toEqual([]);
  });

  it('blocks missing or contradictory fact-check verification when required', () => {
    const complete = structuredClone(article);
    complete.rights = { mode: 'original-report' };
    complete.translations['pt-BR'].aiSummary = [
      'Resumo verificado com contexto.',
    ];
    complete.translations.en.aiSummary = ['Verified summary with context.'];
    complete.translations['pt-BR'].paragraphs = Array.from(
      { length: 5 },
      (_, index) =>
        `Parágrafo factual de teste número ${index + 1} com contexto suficiente.`,
    );
    complete.translations.en.paragraphs = Array.from(
      { length: 5 },
      (_, index) =>
        `Factual test paragraph number ${index + 1} with enough context.`,
    );
    const completeEdition = structuredClone(edition);
    for (const section of Object.keys(completeEdition.sections)) {
      completeEdition.sections[
        section as keyof typeof completeEdition.sections
      ] = {
        articleIds: [complete.id],
        shortfall: 'Fixture uses one article per section.',
      };
    }
    const missing = automationIssues(
      completeEdition,
      [complete],
      1,
      true,
      true,
    );
    expect(missing.some((issue) => issue.includes('missing fact-check'))).toBe(
      true,
    );
    complete.verification = {
      score: 8.2,
      checkedAt: '2026-09-22T12:00:00Z',
      checks: [
        {
          provider: 'Reuters Fact Check',
          url: 'https://www.reuters.com/fact-check/',
          finding: 'contradicts',
          note: 'The indexed claim conflicts with the article assertion.',
        },
      ],
      caveat:
        'Editorial estimate pending resolution of the conflicting finding.',
    };
    const contradictory = automationIssues(
      completeEdition,
      [complete],
      1,
      true,
      true,
    );
    expect(
      contradictory.some((issue) => issue.includes('contradicting fact-check')),
    ).toBe(true);
  });

  it('rejects inline links and media from published reading text', () => {
    const complete = structuredClone(article);
    complete.rights = { mode: 'original-report' };
    complete.translations['pt-BR'].aiSummary = [
      'Resumo verificado com contexto e consequência imediata.',
    ];
    complete.translations.en.aiSummary = [
      'Verified summary with context and immediate consequence.',
    ];
    complete.translations['pt-BR'].paragraphs = [
      'Primeiro parágrafo com fatos verificados e contexto suficiente para leitores.',
      'Segundo parágrafo explicando a cronologia e as atribuições relevantes.',
      'Terceiro parágrafo com uma fonte https://example.com que não deve ser publicado.',
      'Quarto parágrafo acrescentando um detalhe relevante já verificado na fonte.',
      'Quinto parágrafo explicando os próximos passos e os limites conhecidos.',
    ];
    complete.translations.en.paragraphs = [
      'First paragraph with verified facts and enough context for readers.',
      'Second paragraph explaining the chronology and relevant attributions.',
      'Third paragraph with an <img src="photo.jpg"> that must not be published.',
      'Fourth paragraph adding another relevant detail already verified in the source.',
      'Fifth paragraph explaining the next steps and known limits.',
    ];
    const completeEdition = structuredClone(edition);
    for (const section of Object.keys(completeEdition.sections)) {
      completeEdition.sections[
        section as keyof typeof completeEdition.sections
      ] = {
        articleIds: [complete.id],
        shortfall: 'Fixture uses one article per section.',
      };
    }
    const issues = automationIssues(completeEdition, [complete], 1);
    expect(
      issues.some((issue) => issue.includes('inline links or media')),
    ).toBe(true);
  });
});
