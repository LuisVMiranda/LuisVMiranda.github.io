import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { articleSchema, editionSchema } from '../src/modules/content/schema';
import type { Article, Edition } from '../src/modules/content/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const CLEAN_DIRS = ['research/runs', 'artifacts'];

type CleanupPlan = {
  cutoff: string;
  removedEditionIds: string[];
  removedArticleIds: string[];
  removedArticlePaths: string[];
  protectedOldArticleIds: string[];
  localPaths: string[];
};

function argument(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function daysToKeep(): number {
  const value = Number(argument('--days', '3'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('--days must be a positive integer');
  return value;
}

function editionIsRetained(edition: Edition, cutoff: number): boolean {
  return Date.parse(edition.cutoff) >= cutoff;
}

function referencedArticleIds(editions: Edition[]): Set<string> {
  return new Set(
    editions.flatMap((edition) =>
      Object.values(edition.sections).flatMap((section) => section.articleIds),
    ),
  );
}

async function oldLocalPaths(
  directory: string,
  cutoff: number,
  paths: string[],
): Promise<void> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.gitkeep') continue;
    const path = join(directory, entry.name);
    const details = await stat(path);
    if (details.mtimeMs < cutoff) {
      paths.push(path);
      continue;
    }
    if (entry.isDirectory()) await oldLocalPaths(path, cutoff, paths);
  }
}

async function makePlan(now: Date, days: number): Promise<CleanupPlan> {
  const cutoffTime = now.getTime() - days * DAY_MS;
  const editions = editionSchema
    .array()
    .parse(JSON.parse(await readFile('content/editions.json', 'utf8')));
  if (!editions.length) throw new Error('Cannot clean without an edition');
  const newest = editions.reduce((latest, edition) =>
    edition.cutoff > latest.cutoff ? edition : latest,
  );
  const retainedEditions = editions.filter(
    (edition) =>
      editionIsRetained(edition, cutoffTime) || edition.id === newest.id,
  );
  const retainedIds = referencedArticleIds(retainedEditions);
  const names = (await readdir('content/articles')).filter((name) =>
    name.endsWith('.json'),
  );
  const articles: Article[] = [];
  const articlePaths = new Map<string, string>();
  await Promise.all(
    names.map(async (file) => {
      const value = articleSchema.parse(
        JSON.parse(await readFile(join('content/articles', file), 'utf8')),
      );
      articles.push(value);
      articlePaths.set(value.id, join('content/articles', file));
    }),
  );
  const removedArticles = articles.filter(
    (article) =>
      !retainedIds.has(article.id) &&
      Date.parse(article.publishedAt) < cutoffTime,
  );
  const protectedOld = articles.filter(
    (article) =>
      retainedIds.has(article.id) &&
      Date.parse(article.publishedAt) < cutoffTime,
  );
  const localPaths: string[] = [];
  for (const directory of CLEAN_DIRS)
    await oldLocalPaths(directory, cutoffTime, localPaths);
  return {
    cutoff: new Date(cutoffTime).toISOString(),
    removedEditionIds: editions
      .filter((edition) => !retainedEditions.includes(edition))
      .map((edition) => edition.id),
    removedArticleIds: removedArticles.map((article) => article.id),
    removedArticlePaths: removedArticles.map((article) => {
      const path = articlePaths.get(article.id);
      if (!path) throw new Error(`Missing file path for ${article.id}`);
      return path;
    }),
    protectedOldArticleIds: protectedOld.map((article) => article.id),
    localPaths,
  };
}

async function applyPlan(
  plan: CleanupPlan,
  editions: Edition[],
): Promise<void> {
  const retained = editions.filter(
    (edition) => !plan.removedEditionIds.includes(edition.id),
  );
  if (plan.removedEditionIds.length)
    await writeFile(
      'content/editions.json',
      JSON.stringify(retained, null, 2) + '\n',
    );
  await Promise.all(
    plan.removedArticlePaths.map((path) => rm(path, { force: true })),
  );
  await Promise.all(
    plan.localPaths.map((path) => rm(path, { recursive: true, force: true })),
  );
}

const days = daysToKeep();
const apply = process.argv.includes('--apply');
const now = new Date();
const plan = await makePlan(now, days);
if (apply) {
  const editions = editionSchema
    .array()
    .parse(JSON.parse(await readFile('content/editions.json', 'utf8')));
  await applyPlan(plan, editions);
  await writeFile(
    'artifacts/news-cleanup.json',
    JSON.stringify({ ...plan, appliedAt: now.toISOString(), days }, null, 2) +
      '\n',
  );
}
console.log(
  JSON.stringify(
    {
      mode: apply ? 'apply' : 'dry-run',
      days,
      cutoff: plan.cutoff,
      removedEditions: plan.removedEditionIds,
      removedArticles: plan.removedArticleIds,
      protectedOldArticles: plan.protectedOldArticleIds,
      localPaths: plan.localPaths,
    },
    null,
    2,
  ),
);
