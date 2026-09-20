import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const preview = process.argv.includes('--preview');
const env = {
  ...process.env,
  ASTRO_TELEMETRY_DISABLED: '1',
  NEWS_PREVIEW: preview ? '1' : '0',
};
function run(script: string, args: string[]): void {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
run('node_modules/astro/bin/astro.mjs', ['build']);
run('node_modules/pagefind/lib/runner/bin.cjs', ['--site', 'dist']);
run('node_modules/tsx/dist/cli.mjs', ['scripts/check-output.ts']);
await mkdir('artifacts', { recursive: true });
await writeFile(
  'artifacts/build.json',
  JSON.stringify(
    { preview, revision: process.env.GITHUB_SHA || 'local' },
    null,
    2,
  ),
);
