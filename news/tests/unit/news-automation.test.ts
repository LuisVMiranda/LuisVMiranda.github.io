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
      issues.some((issue) => issue.includes('at least 3 paragraphs')),
    ).toBe(true);
  });

  it('accepts a complete article in every selected section', () => {
    const complete = structuredClone(article);
    complete.rights = { mode: 'original-report' };
    complete.translations['pt-BR'].aiSummary =
      'Resumo verificado com contexto, consequência imediata e relevância pública.';
    complete.translations.en.aiSummary =
      'Verified summary with context, immediate consequence, and public relevance.';
    complete.translations['pt-BR'].paragraphs = [
      'Primeiro parágrafo com fatos verificados e contexto suficiente para leitores.',
      'Segundo parágrafo explicando a cronologia e as atribuições relevantes.',
      'Terceiro parágrafo registrando a consequência e as incertezas conhecidas.',
    ];
    complete.translations.en.paragraphs = [
      'First paragraph with verified facts and enough context for readers.',
      'Second paragraph explaining the chronology and relevant attributions.',
      'Third paragraph recording the consequence and known uncertainties.',
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
  });
});
