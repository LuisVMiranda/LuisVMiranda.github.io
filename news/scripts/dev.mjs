import { spawnSync } from 'node:child_process';

// Development is an explicit build, package and serve cycle; it does not watch files.
/** @param {string[]} args */
function run(args) {
  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    windowsHide: true,
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

run(['node_modules/tsx/dist/cli.mjs', 'scripts/build.ts', '--preview']);
run(['node_modules/tsx/dist/cli.mjs', 'scripts/package-pages.ts']);
await import('./serve.mjs');
