import { readdir, readFile } from 'node:fs/promises';
import { readContent } from './content-files';
import { isApproved } from '../src/modules/editions/integrity';

const { articles, editions, approval } = await readContent();
const preview = process.env.NEWS_PREVIEW === '1';
const expected =
  preview || isApproved(articles, editions, approval) ? articles.length : 0;
const routes = await readdir('dist/artigos').catch(() => [] as string[]);
if (routes.length !== expected)
  throw new Error(
    `Article leakage or missing pages: expected ${expected}, found ${routes.length}`,
  );
const english = await readdir('dist/en/artigos').catch(() => [] as string[]);
if (english.length !== expected)
  throw new Error('Bilingual publication mismatch');
for (const directory of ['research', 'content', 'reviews']) {
  const files = await readdir(`dist/${directory}`).catch(() => [] as string[]);
  if (files.length)
    throw new Error(`Private ${directory} leaked to public assets`);
}
if (preview || expected === 0) {
  const feed = await readFile('dist/rss.xml', 'utf8');
  if (feed.includes('<item>')) throw new Error('Draft RSS leak');
}
console.log(
  `Verified public isolation: ${expected} paired article pages; no private research or review assets.`,
);
