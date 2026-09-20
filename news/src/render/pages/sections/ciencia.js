import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Ciência em contexto',
    intro:
      'Descobertas, pesquisas e decisões que ajudam a entender como o conhecimento muda o país e o mundo.',
  },
  en: {
    kicker: 'Science in context',
    intro:
      'Discoveries, research and decisions that help explain how knowledge is changing Brazil and the world.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderCiencia(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'ciencia',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
