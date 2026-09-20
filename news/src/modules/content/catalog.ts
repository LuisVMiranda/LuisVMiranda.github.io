import { getCollection } from 'astro:content';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { articleSchema, approvalSchema, editionSchema } from './schema';
import { isApproved, validateCatalog } from '../editions/integrity';
import type { Article, Edition } from './types';

export const previewMode = process.env.NEWS_PREVIEW === '1';

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(`.${path}`), 'utf8'));
}

export async function loadCatalog(): Promise<{
  articles: Article[];
  editions: Edition[];
}> {
  const entries = await getCollection('articles');
  const articles = entries.map((entry) => articleSchema.parse(entry.data));
  const raw = await readJson('/content/editions.json');
  const editions = editionSchema
    .array()
    .parse(raw)
    .sort((a, b) => b.cutoff.localeCompare(a.cutoff));
  validateCatalog(articles, editions);
  if (previewMode) return { articles, editions };
  const approval = approvalSchema
    .nullable()
    .parse(await readJson('/content/approval.json'));
  if (!articles.length && !editions.length) return { articles, editions };
  if (!isApproved(articles, editions, approval))
    return { articles: [], editions: [] };
  return { articles, editions };
}
