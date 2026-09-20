import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Política em foco',
    intro:
      'As decisões, disputas e propostas que ajudam a entender o poder no Brasil — com contexto para além do título.',
  },
  en: {
    kicker: 'Politics in focus',
    intro:
      'The decisions, disputes and proposals that help explain power in Brazil — with context beyond the headline.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderPolitica(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'politica',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
