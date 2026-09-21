import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { sections } from '../src/modules/content/sections';
import { SearxAdapter, FixtureAdapter } from '../src/modules/research/adapters';
import type { Candidate } from '../src/modules/research/types';

const fixturePath = process.env.RESEARCH_FIXTURE;
const focusQueries: Record<string, string[]> = {
  brasil: ['Brasil governo tribunais serviços públicos notícias recentes'],
  mundo: ['world affairs diplomacy conflict science latest news'],
  politica: [
    'política brasileira Congresso governo eleições notícias recentes',
    'Brazil politics Congress Supreme Court government latest news',
    'Brasil política governo Congresso STF eleições notícias',
  ],
  economia: ['economia Brasil mercados inflação negócios notícias recentes'],
  tecnologia: [
    'tecnologia inteligência artificial cibersegurança notícias recentes',
  ],
  ciencia: [
    'ciência saúde clima espaço pesquisa notícias recentes',
    'NASA climate health research latest news',
    'pesquisa científica brasileira saúde clima espaço notícias',
  ],
  cultura: [
    'cultura cinema música livros patrimônio notícias recentes',
    'cinema música literatura artes patrimônio latest news',
    'cultura brasileira cinema música livros patrimônio notícias',
  ],
  esportes: ['esportes futebol competições resultados notícias recentes'],
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
