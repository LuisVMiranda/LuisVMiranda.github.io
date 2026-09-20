import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Esporte em movimento',
    intro:
      'Resultados, competições e histórias que ajudam a ler o esporte brasileiro — com contexto para além do placar.',
  },
  en: {
    kicker: 'Sport in motion',
    intro:
      'Results, competitions and stories that help make sense of Brazilian sport — with context beyond the score.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderEsportes(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'esportes',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
