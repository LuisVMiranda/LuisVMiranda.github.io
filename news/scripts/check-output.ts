import { readdir, readFile } from 'node:fs/promises';
import { readContent } from './content-files';
import { isApproved } from '../src/modules/editions/integrity';

async function entries(directory: string): Promise<string[]> {
  return readdir(directory).catch(() => [] as string[]);
}

async function assertPrivateAssets(directory: string): Promise<void> {
  for (const privateDirectory of ['research', 'content', 'reviews']) {
    if ((await entries(`${directory}/${privateDirectory}`)).length)
      throw new Error(`Private ${privateDirectory} leaked to public assets`);
  }
}

async function assertDraftFeeds(
  directory: string,
  required: boolean,
): Promise<void> {
  if (!required) return;
  for (const feed of ['rss.xml', 'en/rss.xml']) {
    if ((await readFile(`${directory}/${feed}`, 'utf8')).includes('<item>'))
      throw new Error('Draft RSS leak');
  }
}

export async function checkOutput(
  directory = 'dist',
  preview = process.env.NEWS_PREVIEW === '1',
): Promise<void> {
  const { articles, editions, approval } = await readContent();
  const expected =
    preview || isApproved(articles, editions, approval) ? articles.length : 0;
  const routes = await entries(`${directory}/artigos`);
  if (routes.length !== expected)
    throw new Error(
      `Article leakage or missing pages: expected ${expected}, found ${routes.length}`,
    );
  const english = await entries(`${directory}/en/artigos`);
  if (english.length !== expected)
    throw new Error('Bilingual publication mismatch');
  await assertPrivateAssets(directory);
  await assertDraftFeeds(directory, preview || expected === 0);
  console.log(
    `Verified public isolation: ${expected} paired article pages; no private research or review assets.`,
  );
}

if (process.argv[1]?.endsWith('check-output.ts'))
  await checkOutput(process.env.NEWS_DIST || 'dist');
