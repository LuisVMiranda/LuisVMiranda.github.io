import { renderSectionPage } from '../../components/section-page.js';

/** @param {import('../../types.ts').RenderContext} context */
export default function renderEsportes(context) {
  return renderSectionPage(context, { sectionId: 'esportes' });
}
