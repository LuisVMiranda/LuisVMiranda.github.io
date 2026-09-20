import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Economia em foco',
    intro:
      'Juros, renda, trabalho e decisões empresariais que movem o país — com contexto para além do título.',
  },
  en: {
    kicker: 'Economy in focus',
    intro:
      'Rates, income, work and business decisions shaping the country — with context beyond the headline.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderEconomia(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'economia',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
