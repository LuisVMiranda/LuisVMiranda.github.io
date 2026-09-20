import type { Article, Edition } from '../../src/modules/content/types';
import { sections } from '../../src/modules/content/sections';
export const article: Article = {
  id: 'teste',
  slug: 'teste',
  section: 'brasil',
  secondarySections: [],
  publishedAt: '2026-09-19T10:00:00Z',
  updatedAt: '2026-09-19T10:00:00Z',
  sources: [{ name: 'Test source', url: 'https://example.org/source' }],
  translations: {
    'pt-BR': {
      title: 'Título de teste',
      summary: 'Resumo apenas para testes automatizados.',
      paragraphs: [
        'Primeiro parágrafo somente para teste.',
        'Segundo parágrafo somente para teste.',
      ],
    },
    en: {
      title: 'Test headline',
      summary: 'Summary for automated testing only.',
      paragraphs: [
        'First paragraph for automated testing.',
        'Second paragraph for automated testing.',
      ],
    },
  },
};
export const edition: Edition = {
  id: '2026-09-19',
  cutoff: '2026-09-20T00:00:00Z',
  leadArticleId: article.id,
  sections: Object.fromEntries(
    sections.map(({ id }) => [
      id,
      {
        articleIds: id === 'brasil' ? [article.id] : [],
        shortfall: 'Test fixture shortage',
      },
    ]),
  ) as Edition['sections'],
};
