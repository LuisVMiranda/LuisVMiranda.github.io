export type FactCheckLocale = 'pt-BR' | 'en' | 'global';
export type FactCheckFinding =
  'supports' | 'contradicts' | 'context' | 'no-match' | 'inconclusive';

export interface FactCheckSource {
  id: string;
  name: string;
  locale: FactCheckLocale;
  homepage: string;
  searchHint: string;
  api?: string;
}

/**
 * Fact-checking organizations and tools consulted by verification subagents.
 * A no-match is neutral: it means the claim was not indexed by that source,
 * not that the claim was proven true.
 */
export const factCheckSources: FactCheckSource[] = [
  {
    id: 'aos-fatos',
    name: 'Aos Fatos',
    locale: 'pt-BR',
    homepage: 'https://www.aosfatos.org/',
    searchHint:
      'Search the exact claim, named person, number, and event in Portuguese.',
  },
  {
    id: 'agencia-lupa',
    name: 'Agência Lupa',
    locale: 'pt-BR',
    homepage: 'https://www.agencialupa.org/',
    searchHint:
      'Search the central claim and variants in Portuguese; inspect the verdict and context.',
  },
  {
    id: 'projeto-comprova',
    name: 'Projeto Comprova',
    locale: 'pt-BR',
    homepage: 'https://projetocomprova.com.br/',
    searchHint:
      'Search claims involving public-interest misinformation and coordinated narratives.',
  },
  {
    id: 'tse-fato-ou-boato',
    name: 'TSE Fato ou Boato',
    locale: 'pt-BR',
    homepage: 'https://www.tse.jus.br/comunicacao/noticias/fato-ou-boato',
    searchHint:
      'Use especially for elections, voting, institutions, candidates, and civic-process claims.',
  },
  {
    id: 'afp-fact-check',
    name: 'AFP Fact Check',
    locale: 'global',
    homepage: 'https://factcheck.afp.com/',
    searchHint:
      'Search the claim in English and the relevant local language; inspect the evidence and verdict.',
  },
  {
    id: 'reuters-fact-check',
    name: 'Reuters Fact Check',
    locale: 'global',
    homepage: 'https://www.reuters.com/fact-check/',
    searchHint:
      'Search the named claim, image, quote, institution, or event and compare the cited evidence.',
  },
  {
    id: 'full-fact',
    name: 'Full Fact',
    locale: 'global',
    homepage: 'https://fullfact.org/',
    searchHint:
      'Search for the claim and check the evidence, corrections, and uncertainty language.',
  },
  {
    id: 'google-fact-check-tools',
    name: 'Google Fact Check Tools',
    locale: 'global',
    homepage: 'https://toolbox.google.com/factcheck/explorer',
    searchHint:
      'Search the exact claim and variants; treat results as indexed ClaimReview records, not a final verdict.',
    api: 'https://factchecktools.googleapis.com/v1alpha1/claims:search',
  },
];

export const factCheckSourceIds = factCheckSources.map((source) => source.id);
