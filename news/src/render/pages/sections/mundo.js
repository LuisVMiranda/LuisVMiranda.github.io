import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Mundo em foco',
    intro:
      'Diplomacia, conflitos e decisões internacionais que redesenham o cenário global.',
  },
  en: {
    kicker: 'World in focus',
    intro:
      'Diplomacy, conflicts, and international decisions reshaping the global landscape.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderMundo(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'mundo',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
