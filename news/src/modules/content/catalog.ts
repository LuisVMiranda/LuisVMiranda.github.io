import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { articleSchema, approvalSchema, editionSchema } from './schema';
import { isApproved, validateCatalog } from '../editions/integrity';
import type { Article, Edition } from './types';

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(path.resolve(file), 'utf8'));
}

export async function loadCatalog(
  preview = process.env.NEWS_PREVIEW === '1',
): Promise<{
  articles: Article[];
  editions: Edition[];
}> {
  const names = (await readdir(path.resolve('content/articles')))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const articles = await Promise.all(
    names.map(async (name) =>
      articleSchema.parse(await readJson(path.join('content/articles', name))),
    ),
  );
  const raw = await readJson('content/editions.json');
  const editions = editionSchema
    .array()
    .parse(raw)
    .sort((a, b) => b.cutoff.localeCompare(a.cutoff));
  validateCatalog(articles, editions);
  if (preview) return { articles, editions };
  const approval = approvalSchema
    .nullable()
    .parse(await readJson('content/approval.json'));
  if (!articles.length && !editions.length) return { articles, editions };
  if (!isApproved(articles, editions, approval))
    return { articles: [], editions: [] };
  return { articles, editions };
}
