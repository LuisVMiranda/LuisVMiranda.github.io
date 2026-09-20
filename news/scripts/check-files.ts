import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const excluded = new Set([
  'node_modules',
  'dist',
  '.astro',
  '.cache',
  'artifacts',
  'test-results',
  'playwright-report',
  'coverage',
]);
const textExtensions = new Set([
  '.ts',
  '.js',
  '.mjs',
  '.astro',
  '.css',
  '.json',
  '.jsonc',
  '.md',
  '.yml',
  '.yaml',
  '.svg',
  '.html',
  '.txt',
  '.example',
]);
async function files(directory: string): Promise<string[]> {
  if (path.resolve(directory) === path.resolve('research/runs')) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const lists = await Promise.all(
    entries
      .filter((entry) => !excluded.has(entry.name))
      .map(async (entry) => {
        const full = path.join(directory, entry.name);
        return entry.isDirectory() ? files(full) : [full];
      }),
  );
  return lists.flat();
}
const violations: string[] = [];
for (const file of await files('.')) {
  if (
    file.endsWith('package-lock.json') ||
    (!textExtensions.has(path.extname(file)) &&
      !path.basename(file).startsWith('.'))
  )
    continue;
  const source = await readFile(file, 'utf8');
  const lines = source.split('\n').length - Number(source.endsWith('\n'));
  if (lines >= 600) violations.push(`${file}: ${lines} lines (maximum 599)`);
}
if (violations.length) throw new Error(violations.join('\n'));
console.log('All authored text files are below 600 lines.');
