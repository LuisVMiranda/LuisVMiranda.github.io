import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Brasil em foco',
    intro:
      'As decisões, acontecimentos e histórias que ajudam a entender o país hoje — com contexto para além do título.',
  },
  en: {
    kicker: 'Brazil in focus',
    intro:
      'The decisions, events and stories that help make sense of Brazil today — with context beyond the headline.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderBrasil(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'brasil',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
