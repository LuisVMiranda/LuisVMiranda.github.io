import { it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, readFile } from 'node:fs/promises';
const execute = promisify(execFile);
it('isolates simultaneous research runs and preserves the published catalog', async () => {
  const before = await readFile('content/editions.json', 'utf8');
  const options = {
    env: { ...process.env, RESEARCH_FIXTURE: 'tests/fixtures/search.json' },
  };
  const runs = await Promise.all([
    execute(
      process.execPath,
      ['node_modules/tsx/dist/cli.mjs', 'scripts/research.ts'],
      options,
    ),
    execute(
      process.execPath,
      ['node_modules/tsx/dist/cli.mjs', 'scripts/research.ts'],
      options,
    ),
  ]);
  const directories = runs.map((run) =>
    run.stdout
      .match(/Review sources before selecting stories: (.+)/)![1]!
      .trim(),
  );
  expect(new Set(directories).size).toBe(2);
  for (const directory of directories)
    expect(await readdir(directory)).toHaveLength(9);
  expect(await readFile('content/editions.json', 'utf8')).toBe(before);
}, 20000);
