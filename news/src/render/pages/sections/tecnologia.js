import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Tecnologia em contexto',
    intro:
      'As decisões, ferramentas e descobertas que mudam a vida digital — com fontes, contexto e limites claros.',
  },
  en: {
    kicker: 'Technology in context',
    intro:
      'The decisions, tools and discoveries reshaping digital life — with sources, context and clear limits.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderTecnologia(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'tecnologia',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
