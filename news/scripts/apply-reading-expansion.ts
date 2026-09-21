import { readdir, readFile, writeFile } from 'node:fs/promises';
import { editionSchema } from '../src/modules/content/schema';
import type { Article, Locale } from '../src/modules/content/types';

type LocaleUpdate = {
  appendParagraphs: [string, string];
  aiSummaryBullets: string[];
};

type ExpansionUpdate = Record<Locale, LocaleUpdate>;

type ExpansionDocument = {
  articles?: Record<string, ExpansionUpdate>;
  articleIds?: string[];
  errors?: string[];
};

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Missing ${name} argument`);
  return value;
}

function updatesFrom(
  document: ExpansionDocument,
): Record<string, ExpansionUpdate> {
  const updates =
    document.articles ??
    (document as unknown as Record<string, ExpansionUpdate>);
  if (!updates || typeof updates !== 'object')
    throw new Error('Expansion document must contain an articles mapping');
  return updates;
}

function updateFor(
  updates: Record<string, ExpansionUpdate>,
  id: string,
): ExpansionUpdate {
  const update = updates[id];
  if (!update) throw new Error(`Missing expansion update for ${id}`);
  return update;
}

function validateUpdate(id: string, update: ExpansionUpdate): void {
  for (const locale of ['pt-BR', 'en'] as const) {
    const value = update[locale];
    if (!value || value.appendParagraphs?.length !== 2)
      throw new Error(
        `${id}/${locale} must provide exactly two appended paragraphs`,
      );
    if (
      !value.appendParagraphs.every(
        (paragraph) => paragraph.trim().length >= 35,
      )
    )
      throw new Error(`${id}/${locale} appended paragraphs are too short`);
    if (
      !Array.isArray(value.aiSummaryBullets) ||
      value.aiSummaryBullets.length < 1
    )
      throw new Error(
        `${id}/${locale} must provide at least one AI-summary bullet`,
      );
    if (value.aiSummaryBullets.length > 5)
      throw new Error(
        `${id}/${locale} must provide no more than five AI-summary bullets`,
      );
    if (!value.aiSummaryBullets.every((bullet) => bullet.trim().length >= 8))
      throw new Error(
        `${id}/${locale} contains an AI-summary bullet that is too short`,
      );
  }
}

const input = argument('--input');
const editionId = argument('--edition');
const document = JSON.parse(await readFile(input, 'utf8')) as ExpansionDocument;
if (document.errors?.length)
  throw new Error(
    `Expansion document contains errors:\n- ${document.errors.join('\n- ')}`,
  );

const editions = editionSchema
  .array()
  .parse(JSON.parse(await readFile('content/editions.json', 'utf8')));
const edition = editions.find((item) => item.id === editionId);
if (!edition) throw new Error(`Edition ${editionId} was not found`);
const selectedIds = [
  ...new Set(
    Object.values(edition.sections).flatMap((section) => section.articleIds),
  ),
];
const updates = updatesFrom(document);
const names = (await readdir('content/articles')).filter((name) =>
  name.endsWith('.json'),
);
const articles = new Map<string, { path: string; value: Article }>();
for (const name of names) {
  const path = `content/articles/${name}`;
  const value = JSON.parse(await readFile(path, 'utf8')) as Article;
  articles.set(value.id, { path, value });
}

const missing = selectedIds.filter((id) => !updates[id]);
if (missing.length)
  throw new Error(`Missing expansion updates for: ${missing.join(', ')}`);
const now = new Date().toISOString();
let changed = 0;
for (const id of selectedIds) {
  const entry = articles.get(id);
  if (!entry) throw new Error(`Edition references missing article ${id}`);
  const update = updateFor(updates, id);
  validateUpdate(id, update);
  if (entry.value.translations.en.paragraphs.length >= 5)
    throw new Error(
      `${id} already has five or more paragraphs; refusing duplicate expansion`,
    );
  for (const locale of ['pt-BR', 'en'] as const) {
    const translation = entry.value.translations[locale];
    const localeUpdate = update[locale];
    translation.paragraphs.push(...localeUpdate.appendParagraphs);
    translation.aiSummary = localeUpdate.aiSummaryBullets;
  }
  entry.value.updatedAt = now;
  await writeFile(entry.path, JSON.stringify(entry.value, null, 2) + '\n');
  changed += 1;
}

console.log(
  JSON.stringify(
    {
      edition: editionId,
      updatedAt: now,
      selected: selectedIds.length,
      changed,
      summaries: 'bullet-list',
      minimumParagraphs: 5,
    },
    null,
    2,
  ),
);
