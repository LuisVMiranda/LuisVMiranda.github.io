import { readdir, readFile, writeFile } from 'node:fs/promises';
import { editionSchema, articleSchema } from '../src/modules/content/schema';
import type { Article } from '../src/modules/content/types';

type VerificationUpdate = NonNullable<Article['verification']>;
type AuditDocument = {
  articles?: Record<string, VerificationUpdate>;
  errors?: string[];
};

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`Missing ${name} argument`);
  return value;
}

function updatesFrom(
  document: AuditDocument,
): Record<string, VerificationUpdate> {
  if (!document.articles || typeof document.articles !== 'object')
    throw new Error('Fact-check audit must contain an articles mapping');
  return document.articles;
}

function validateUpdate(id: string, update: VerificationUpdate): void {
  const parsed = articleSchema.safeParse({
    id,
    slug: id,
    section: 'brasil',
    secondarySections: [],
    publishedAt: update.checkedAt,
    updatedAt: update.checkedAt,
    sources: update.checks.map((check) => ({
      name: check.provider,
      url: check.url,
    })),
    verification: update,
    translations: {
      'pt-BR': {
        title: 'Placeholder title',
        summary: 'Placeholder summary for validation.',
        paragraphs: [
          'Placeholder paragraph with enough length for validation.',
          'Second placeholder paragraph with enough length for validation.',
        ],
      },
      en: {
        title: 'Placeholder title',
        summary: 'Placeholder summary for validation.',
        paragraphs: [
          'Placeholder paragraph with enough length for validation.',
          'Second placeholder paragraph with enough length for validation.',
        ],
      },
    },
  });
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => issue.message)
      .join('; ');
    throw new Error(`${id} has invalid verification data: ${messages}`);
  }
  if (update.score < 7)
    throw new Error(`${id} verification score must be at least 7.0/10`);
  if (update.checks.some((check) => check.finding === 'contradicts'))
    throw new Error(`${id} has an unresolved contradicting fact-check finding`);
}

const input = argument('--input');
const editionId = argument('--edition');
const document = JSON.parse(await readFile(input, 'utf8')) as AuditDocument;
if (document.errors?.length)
  throw new Error(
    `Fact-check audit contains errors:\n- ${document.errors.join('\n- ')}`,
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
const updateIds = Object.keys(updates);
const missing = selectedIds.filter((id) => !updates[id]);
const unexpected = updateIds.filter((id) => !selectedIds.includes(id));
if (missing.length)
  throw new Error(`Missing fact-check updates for: ${missing.join(', ')}`);
if (unexpected.length)
  throw new Error(
    `Unexpected fact-check updates for: ${unexpected.join(', ')}`,
  );

const names = (await readdir('content/articles')).filter((name) =>
  name.endsWith('.json'),
);
const articles = new Map<string, { path: string; value: Article }>();
for (const name of names) {
  const path = `content/articles/${name}`;
  const value = articleSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  articles.set(value.id, { path, value });
}

const now = new Date().toISOString();
let changed = 0;
for (const id of selectedIds) {
  const entry = articles.get(id);
  if (!entry) throw new Error(`Edition references missing article ${id}`);
  const update = updates[id]!;
  validateUpdate(id, update);
  entry.value.verification = update;
  entry.value.updatedAt = now;
  articleSchema.parse(entry.value);
  await writeFile(entry.path, JSON.stringify(entry.value, null, 2) + '\n');
  changed += 1;
}

console.log(
  JSON.stringify(
    {
      edition: editionId,
      checkedAt: now,
      selected: selectedIds.length,
      changed,
      minimumScore: 7,
      sources: 'Brazilian and international fact-check registry',
    },
    null,
    2,
  ),
);
