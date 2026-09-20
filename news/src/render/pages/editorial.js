import { localUrl } from '../../modules/content/urls.ts';
import { escapeHtml } from '../html.js';

const copy = {
  en: {
    eyebrow: 'Notícias · Editorial policy',
    title: 'How we choose and publish',
    intro:
      'Notícias is an independent briefing built around verified sources, useful context, and a clear record of editorial decisions.',
    contents: 'On this page',
    sections: [
      {
        id: 'selection',
        title: 'What earns a place',
        paragraphs: [
          'We look for developments that matter to people, change how a public conversation is understood, or deserve careful context. Each desk ranks candidates by relevance, likely impact, freshness, and the quality of the available evidence. No single signal decides the order.',
          'Each edition has a fixed cutoff in São Paulo. We begin with the last 24 hours before it. When that window does not offer enough strong, verified material, we widen the search up to seven days and say so through the edition date and context. A short edition is better than invented completeness: when evidence does not support ten stories, we record the shortfall and publish fewer. We never invent stories to fill a list.',
        ],
      },
      {
        id: 'verification',
        title: 'Verification and attribution',
        paragraphs: [
          'Before publication, we verify the original source behind a claim and read the source itself whenever possible. We compare details, dates, names, and numbers against the strongest available record. A link is part of the reporting, so readers can follow the evidence for themselves.',
          'Our summaries are written by Notícias. They explain the source and its significance in our own words; they do not republish another outlet’s article. We name and link the sources that informed each story, and we do not fill a gap by guessing or presenting an unverified claim as fact.',
        ],
      },
      {
        id: 'languages',
        title: 'One story, two checked editions',
        paragraphs: [
          'Portuguese and English are paired versions of the same story. Editors check names, numbers, units, dates, and time references in both languages before an edition is approved. Translation can change a sentence’s shape, but it must not change what the evidence says.',
          'Both versions keep the same story identity. A reader can switch languages without losing the source trail, the publication history, or a correction.',
        ],
      },
      {
        id: 'approval',
        title: 'Human approval and a public record',
        paragraphs: [
          'A person reviews every edition before it is published. Approval is explicit and tied to the exact collection of stories, rankings, dates, and translations that was reviewed. A changed file cannot quietly replace the reviewed edition.',
          'This record supports accountability without asking readers to trust a black box. The selection is explainable: the sources, the shortfalls, and the time window are part of the edition’s story.',
        ],
      },
      {
        id: 'corrections',
        title: 'Corrections keep the same identity',
        paragraphs: [
          'When we correct a story, we describe the correction and show the updated date. The story keeps its identity and source trail, which makes the change visible instead of silently replacing the past.',
          'A correction does not erase the editorial responsibility attached to the original publication. It adds a clear note so readers can understand what changed and why.',
        ],
      },
      {
        id: 'reading',
        title: 'A readable, private interface',
        paragraphs: [
          'Section colors help readers orient themselves, but color is never the only way we identify a desk. Labels, headings, links, and structure carry the meaning for readers using any contrast, display, or assistive technology.',
          'Reading preferences such as theme and text size are stored in the browser on the device where they were chosen. Notícias does not require a reader account and does not use cookies for those preferences.',
        ],
      },
      {
        id: 'research',
        title: 'On-demand research',
        paragraphs: [
          'Editors research a developing subject when an edition needs a deeper answer or more context. We follow the same source and attribution standards, explain what is known, and distinguish confirmed facts from open questions.',
          'Research is completed before publication: it informs the edition’s selection and is reviewed alongside the stories. We publish only what the evidence and human review support.',
        ],
      },
    ],
    close:
      'Questions about our work? Read the sources on each story or browse the',
    closeLink: 'verified edition archive.',
  },
  'pt-BR': {
    eyebrow: 'Notícias · Política editorial',
    title: 'Como escolhemos e publicamos',
    intro:
      'Notícias é um briefing independente baseado em fontes verificadas, contexto útil e um registro claro das decisões editoriais.',
    contents: 'Nesta página',
    sections: [
      {
        id: 'selection',
        title: 'O que merece espaço',
        paragraphs: [
          'Procuramos acontecimentos que importam para as pessoas, mudam a compreensão de uma conversa pública ou pedem contexto cuidadoso. Cada editoria ordena as candidatas por relevância, impacto provável, atualidade e qualidade das evidências disponíveis. Nenhum sinal decide a ordem sozinho.',
          'Cada edição tem um horário de corte fixo em São Paulo. Começamos pelas 24 horas anteriores a ele. Quando esse intervalo não oferece material forte e verificável em quantidade suficiente, ampliamos a busca para até sete dias e deixamos isso claro pela data e pelo contexto da edição. Uma edição curta é melhor do que uma completude inventada: quando as evidências não sustentam dez notícias, registramos a falta e publicamos menos. Nunca inventamos notícias para preencher uma lista.',
        ],
      },
      {
        id: 'verification',
        title: 'Verificação e atribuição',
        paragraphs: [
          'Antes de publicar, verificamos a fonte original por trás de cada afirmação e lemos a própria fonte sempre que possível. Comparamos detalhes, datas, nomes e números com o registro mais forte disponível. O link faz parte da apuração, para que o leitor possa acompanhar as evidências.',
          'Nossos resumos são escritos pelas Notícias. Eles explicam a fonte e sua importância com nossas próprias palavras; não republicam o artigo de outro veículo. Indicamos e linkamos as fontes que orientaram cada notícia e não preenchemos uma lacuna com palpite nem apresentamos como fato uma afirmação não verificada.',
        ],
      },
      {
        id: 'languages',
        title: 'Uma história, duas edições conferidas',
        paragraphs: [
          'Português e inglês são versões pareadas da mesma história. Editores conferem nomes, números, unidades, datas e referências de tempo nos dois idiomas antes de aprovar a edição. A tradução pode mudar o formato de uma frase, mas não o que as evidências dizem.',
          'As duas versões mantêm a mesma identidade da história. O leitor pode trocar de idioma sem perder as fontes, o histórico de publicação ou uma correção.',
        ],
      },
      {
        id: 'approval',
        title: 'Aprovação humana e registro público',
        paragraphs: [
          'Uma pessoa revisa cada edição antes da publicação. A aprovação é explícita e ligada ao conjunto exato de notícias, posições, datas e traduções que foi revisado. Um arquivo alterado não pode substituir silenciosamente a edição conferida.',
          'Esse registro promove responsabilidade sem pedir que o leitor confie em uma caixa-preta. A seleção pode ser explicada: as fontes, as faltas e o intervalo de tempo fazem parte da história da edição.',
        ],
      },
      {
        id: 'corrections',
        title: 'Correções mantêm a mesma identidade',
        paragraphs: [
          'Quando corrigimos uma notícia, descrevemos a correção e mostramos a data de atualização. A história mantém sua identidade e seu caminho de fontes, tornando a mudança visível em vez de apagar o passado silenciosamente.',
          'Uma correção não apaga a responsabilidade editorial ligada à publicação original. Ela acrescenta uma nota clara para que o leitor entenda o que mudou e por quê.',
        ],
      },
      {
        id: 'reading',
        title: 'Uma interface legível e privada',
        paragraphs: [
          'As cores ajudam o leitor a se orientar pelas editorias, mas nunca são a única forma de identificar uma delas. Rótulos, títulos, links e estrutura carregam o significado para pessoas com qualquer contraste, tela ou tecnologia assistiva.',
          'Preferências de leitura, como tema e tamanho do texto, ficam guardadas no navegador do aparelho onde foram escolhidas. As Notícias não exigem conta de leitor e não usam cookies para essas preferências.',
        ],
      },
      {
        id: 'research',
        title: 'Pesquisa sob demanda',
        paragraphs: [
          'Editores pesquisam um assunto em desenvolvimento quando uma edição precisa de uma resposta mais profunda ou de mais contexto. Seguimos os mesmos padrões de fonte e atribuição, explicamos o que se sabe e distinguimos fatos confirmados de questões em aberto.',
          'A pesquisa é concluída antes da publicação: orienta a seleção da edição e é revisada junto com as notícias. Publicamos apenas o que as evidências e a revisão humana sustentam.',
        ],
      },
    ],
    close:
      'Dúvidas sobre nosso trabalho? Leia as fontes em cada notícia ou consulte o',
    closeLink: 'arquivo de edições verificadas.',
  },
};

/**
 * @param {typeof copy.en} labels
 * @param {import('../types.ts').RenderContext['locale']} locale
 * @returns {string}
 */
function renderContents(labels, locale) {
  /** @param {string} id */
  const href = (id) => `${localUrl('editorial', locale)}#${id}`;
  const items = labels.sections
    .map(
      (section, index) =>
        `<li><a href="${escapeHtml(href(section.id))}">${index + 1}. ${escapeHtml(section.title)}</a></li>`,
    )
    .join('');
  return `<nav class="editorial-contents" aria-label="${escapeHtml(labels.contents)}">
    <p class="editorial-contents__label">${escapeHtml(labels.contents)}</p>
    <ol>${items}</ol>
  </nav>`;
}

/**
 * @param {typeof copy.en} labels
 * @returns {string}
 */
function renderPolicy(labels) {
  return labels.sections
    .map(
      (
        section,
        index,
      ) => `<section id="${escapeHtml(section.id)}" class="editorial-section" aria-labelledby="${escapeHtml(section.id)}-title">
        <p class="editorial-section__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</p>
        <h2 id="${escapeHtml(section.id)}-title">${escapeHtml(section.title)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </section>`,
    )
    .join('');
}

/** @param {import('../types.ts').RenderContext} context @returns {string} */
export default function renderEditorial(context) {
  const labels = copy[context.locale];
  return `<div class="editorial-page">
    <header class="editorial-hero">
      <p class="editorial-eyebrow">${escapeHtml(labels.eyebrow)}</p>
      <h1 id="editorial-title">${escapeHtml(labels.title)}</h1>
      <p class="editorial-intro">${escapeHtml(labels.intro)}</p>
    </header>
    <div class="editorial-layout">
      ${renderContents(labels, context.locale)}
      <article class="editorial-policy" aria-label="${escapeHtml(labels.title)}">
        ${renderPolicy(labels)}
        <p class="editorial-close">${escapeHtml(labels.close)} <a href="${escapeHtml(localUrl('arquivo', context.locale))}">${escapeHtml(labels.closeLink)}</a></p>
      </article>
    </div>
  </div>`;
}
