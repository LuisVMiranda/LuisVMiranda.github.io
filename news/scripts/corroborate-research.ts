import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

type Extraction = {
  url: string;
  finalUrl: string;
  canonicalUrl: string;
  title: string;
  snippet: string;
  bodyText: string;
  section: string;
  publishedAt: string | null;
  status: number | null;
  complete: boolean;
  warnings: string[];
};

type Match = {
  left: string;
  right: string;
  sections: [string, string];
  commonTerms: string[];
  score: number;
  independentDomains: [string, string];
  requiresHumanConfirmation: true;
};

const runDirectory = process.argv[process.argv.indexOf('--run') + 1];
if (!runDirectory) throw new Error('Usage: --run research/runs/RUN_ID');

const stopWords = new Set(
  `a an as at by da das de do dos e em for from in na nas no nos of o os para por que the to um uma with and news latest brasil brazil mundo world politica política economia economy tecnologia technology ciencia ciência cultura culture esportes sports`.split(
    ' ',
  ),
);

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase('pt-BR')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !stopWords.has(token)),
  );
}

function similarity(left: Extraction, right: Extraction): Match | null {
  const leftTerms = tokens(`${left.title} ${left.snippet}`);
  const rightTerms = tokens(`${right.title} ${right.snippet}`);
  const commonTerms = [...leftTerms].filter((term) => rightTerms.has(term));
  const unionSize = new Set([...leftTerms, ...rightTerms]).size;
  const score = unionSize ? commonTerms.length / unionSize : 0;
  if (commonTerms.length < 3 || score < 0.18) return null;
  const leftDomain = domainOf(left.canonicalUrl || left.url);
  const rightDomain = domainOf(right.canonicalUrl || right.url);
  if (!leftDomain || !rightDomain || leftDomain === rightDomain) return null;
  return {
    left: left.url,
    right: right.url,
    sections: [left.section, right.section],
    commonTerms: commonTerms.sort(),
    score: Number(score.toFixed(3)),
    independentDomains: [leftDomain, rightDomain],
    requiresHumanConfirmation: true,
  };
}

async function readExtractions(): Promise<Extraction[]> {
  const root = `${runDirectory}/extractions`;
  const sections = await readdir(root, { withFileTypes: true });
  const files = sections.flatMap((section) =>
    section.isDirectory()
      ? readdir(`${root}/${section.name}`).then((entries) =>
          entries
            .filter((entry) => entry.endsWith('.json'))
            .map((entry) => `${root}/${section.name}/${entry}`),
        )
      : [],
  );
  const paths = (await Promise.all(files)).flat();
  const records = await Promise.all(
    paths.map(
      async (path) => JSON.parse(await readFile(path, 'utf8')) as Extraction,
    ),
  );
  return records.filter(
    (record) =>
      record.complete && record.status !== null && record.status < 400,
  );
}

const records = await readExtractions();
const matches: Match[] = [];
for (let leftIndex = 0; leftIndex < records.length; leftIndex += 1) {
  for (
    let rightIndex = leftIndex + 1;
    rightIndex < records.length;
    rightIndex += 1
  ) {
    const match = similarity(records[leftIndex]!, records[rightIndex]!);
    if (match) matches.push(match);
  }
}
matches.sort(
  (left, right) =>
    right.score - left.score || left.left.localeCompare(right.left),
);
const unique = new Map<string, Match>();
for (const match of matches) {
  const key = [match.left, match.right].sort().join('|');
  if (!unique.has(key)) unique.set(key, match);
}
const output = `${runDirectory}/corroboration`;
await mkdir(output, { recursive: true });
const summary = {
  runDirectory,
  completeSources: records.length,
  suggestions: [...unique.values()],
  generatedAt: new Date().toISOString(),
  note: 'Suggestions are lexical leads only; an editor must verify matching facts and discrepancies in both complete source bodies.',
};
await writeFile(`${output}/index.json`, JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    {
      runDirectory,
      completeSources: records.length,
      suggestions: summary.suggestions.length,
      bySection: Object.fromEntries(
        [...new Set(summary.suggestions.flatMap((match) => match.sections))]
          .sort()
          .map((section) => [
            section,
            summary.suggestions.filter((match) =>
              match.sections.includes(section),
            ).length,
          ]),
      ),
      index: `${output}/index.json`,
    },
    null,
    2,
  ),
);
