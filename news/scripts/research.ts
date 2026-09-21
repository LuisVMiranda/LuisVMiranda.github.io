import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { sections } from '../src/modules/content/sections';
import { SearxAdapter, FixtureAdapter } from '../src/modules/research/adapters';
import type { Candidate } from '../src/modules/research/types';

const fixturePath = process.env.RESEARCH_FIXTURE;
const focusQueries: Record<string, string[]> = {
  brasil: [
    'Brasil governo tribunais serviços públicos notícias recentes',
    'site:agenciabrasil.ebc.com.br Brasil notícias',
    'site:g1.globo.com Brasil notícias hoje',
    'site:cnnbrasil.com.br Brasil notícias',
  ],
  mundo: [
    'world affairs diplomacy conflict science latest news',
    'international affairs United Nations AP BBC latest news',
    'site:apnews.com world latest news',
    'site:bbc.com/news world latest news',
  ],
  politica: [
    'política brasileira Congresso governo eleições notícias recentes',
    'Brazil politics Congress Supreme Court government latest news',
    'Brasil política governo Congresso STF eleições notícias',
    'site:g1.globo.com/politica política Brasil',
    'site:valorinternational.globo.com/politics Brazil politics',
    'site:cnnbrasil.com.br/politica política Brasil',
  ],
  economia: [
    'economia Brasil mercados inflação negócios notícias recentes',
    'site:valor.globo.com economia Brasil',
    'site:correiobraziliense.com.br economia Brasil',
    'site:cnnbrasil.com.br/economia economia Brasil',
  ],
  tecnologia: [
    'tecnologia inteligência artificial cibersegurança notícias recentes',
    'site:tecmundo.com.br tecnologia inteligência artificial',
    'site:canaltech.com.br tecnologia IA',
    'site:theverge.com technology AI latest news',
  ],
  ciencia: [
    'ciência saúde clima espaço pesquisa notícias recentes',
    'NASA climate health research latest news',
    'pesquisa científica brasileira saúde clima espaço notícias',
    'site:agencia.fapesp.br ciência pesquisa',
    'site:nasa.gov news science',
    'site:iaea.org/newscenter news science',
    'site:nature.com science research latest news',
    'site:sciencedaily.com/releases science research',
    'site:news.mit.edu science research latest',
    'site:medicalxpress.com/news science health research',
    'site:space.com space science latest news',
  ],
  cultura: [
    'cultura cinema música livros patrimônio notícias recentes',
    'cinema música literatura artes patrimônio latest news',
    'cultura brasileira cinema música livros patrimônio notícias',
    'site:agenciabrasil.ebc.com.br cultura',
    'site:theguardian.com culture latest news',
    'site:variety.com culture film music latest news',
  ],
  esportes: [
    'esportes futebol competições resultados notícias recentes',
    'site:ge.globo.com esportes futebol',
    'site:espn.com sports latest news',
    'site:olympics.com latest sports news',
  ],
};
const adapter = fixturePath
  ? new FixtureAdapter(
      JSON.parse(await readFile(fixturePath, 'utf8')) as Candidate[],
    )
  : new SearxAdapter(process.env.SEARXNG_URL);
const cutoff = new Date().toISOString();
const runId = `${cutoff.replace(/[:.]/g, '-')}-${randomUUID()}`;
const directory = `research/runs/${runId}`;
await mkdir(directory, { recursive: false }).catch(
  async (error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
    await mkdir('research/runs', { recursive: true });
    await mkdir(directory);
  },
);
await writeFile(
  `${directory}/run.json`,
  JSON.stringify(
    { runId, cutoff, timezone: 'America/Sao_Paulo', status: 'pending-review' },
    null,
    2,
  ),
);
for (const section of sections) {
  const queries = [
    `${section.label['pt-BR']} notícias ${section.id === 'mundo' ? 'internacionais' : 'Brasil'}`,
    `${section.label.en} latest news ${section.id === 'mundo' ? 'world' : 'Brazil'}`,
    ...(focusQueries[section.id] ?? []),
  ];
  const results = await Promise.allSettled(
    queries.map((query) => adapter.search(query, section.id)),
  );
  const candidates = results.flatMap((result) =>
    result.status === 'fulfilled' ? result.value : [],
  );
  const errors = results
    .filter((result) => result.status === 'rejected')
    .map((result) => String((result as PromiseRejectedResult).reason));
  const review = {
    section: section.id,
    cutoff,
    queries,
    retrievedAt: new Date().toISOString(),
    candidates,
    errors,
    verified: [],
    selected: [],
    shortfall: 'Awaiting source verification',
    improvements: [],
  };
  await writeFile(
    `${directory}/${section.id}.json`,
    JSON.stringify(review, null, 2),
    { flag: 'wx' },
  );
  console.log(
    `${section.id}: ${candidates.length} candidates; ${errors.length} errors`,
  );
}
console.log(`Review sources before selecting stories: ${directory}`);
