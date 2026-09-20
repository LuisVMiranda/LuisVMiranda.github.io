import { renderSectionPage } from '../../components/section-page.js';

const copy = {
  'pt-BR': {
    kicker: 'Cultura em contexto',
    intro:
      'As obras, vozes, instituições e políticas que ajudam a ler a vida cultural brasileira — com contexto além da agenda.',
  },
  en: {
    kicker: 'Culture in context',
    intro:
      'The works, voices, institutions and policies that help read Brazil’s cultural life — with context beyond the listings.',
  },
};

/** @param {import('../../types.ts').RenderContext} context */
export default function renderCultura(context) {
  const localizedCopy = copy[context.locale];
  return renderSectionPage(context, {
    sectionId: 'cultura',
    kicker: localizedCopy.kicker,
    intro: localizedCopy.intro,
  });
}
