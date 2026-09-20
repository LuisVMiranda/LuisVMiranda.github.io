import { readFile, writeFile } from 'node:fs/promises';
import { sections } from '../src/modules/content/sections';
import { editionSchema } from '../src/modules/content/schema';
import { readContent } from './content-files';
import { validateCatalog } from '../src/modules/editions/integrity';
import type { Edition } from '../src/modules/content/types';

interface Selection {
  cutoff: string;
  verified: { articleId: string }[];
  shortfall: { 'pt-BR': string; en: string };
}
const id = process.argv[2];
if (!id || !/^[a-z0-9-]+$/.test(id))
  throw new Error('Usage: npx tsx scripts/edition.ts EDITION_ID');
const { articles, editions } = await readContent();
if (editions.some((entry) => entry.id === id))
  throw new Error('An edition identity is immutable; choose a new edition ID');
const selections = await Promise.all(
  sections.map(async ({ id: section }) => ({
    section,
    data: JSON.parse(
      await readFile(`research/editorial/${section}.json`, 'utf8'),
    ) as Selection,
  })),
);
const cutoffs = new Set(selections.map(({ data }) => data.cutoff));
if (cutoffs.size !== 1)
  throw new Error('All sections must share the same research cutoff');
const sectionRecords = Object.fromEntries(
  selections.map(({ section, data }) => [
    section,
    {
      articleIds: data.verified.map((entry) => entry.articleId),
      shortfall: data.shortfall['pt-BR'] || '',
      shortfallEn: data.shortfall.en || '',
    },
  ]),
);
const leadArticleId = articles.find(
  (article) => article.section === 'brasil',
)?.id;
const edition = editionSchema.parse({
  id,
  cutoff: selections[0]!.data.cutoff,
  sections: sectionRecords,
  leadArticleId,
}) as Edition;
validateCatalog(articles, [...editions, edition]);
await writeFile(
  'content/editions.json',
  JSON.stringify([...editions, edition], null, 2) + '\n',
);
console.log(
  `Staged ${id}. Existing content approval is now invalid; review both languages before approval.`,
);
