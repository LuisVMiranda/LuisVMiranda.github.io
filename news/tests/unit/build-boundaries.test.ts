import { afterEach, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const runner = path.resolve('node_modules/tsx/dist/cli.mjs');
const build = path.resolve('scripts/build.ts');
const packager = path.resolve('scripts/package-pages.ts');
const temporary: string[] = [];

async function fixture(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'noticias-build-test-'));
  temporary.push(directory);
  await mkdir(path.join(directory, 'dist'));
  await mkdir(path.join(directory, 'artifacts'));
  await writeFile(
    path.join(directory, 'dist/index.html'),
    'previous complete site',
  );
  await writeFile(
    path.join(directory, 'artifacts/build.json'),
    '{"revision":"previous"}',
  );
  return directory;
}

afterEach(async () => {
  for (const directory of temporary.splice(0)) {
    if (!directory.startsWith(path.join(tmpdir(), 'noticias-build-test-')))
      throw new Error('Unexpected temporary directory');
    await rm(directory, { recursive: true, force: true });
  }
});

it('a failed build leaves the last complete output and its metadata intact', async () => {
  const directory = await fixture();
  await expect(
    run(process.execPath, [runner, build], { cwd: directory }),
  ).rejects.toThrow();
  expect(await readFile(path.join(directory, 'dist/index.html'), 'utf8')).toBe(
    'previous complete site',
  );
  expect(
    await readFile(path.join(directory, 'artifacts/build.json'), 'utf8'),
  ).toBe('{"revision":"previous"}');
});

it('a competing build refuses the held lock and never removes another build lock', async () => {
  const directory = await fixture();
  const lock = path.join(directory, 'artifacts/.build-lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner'), 'first build');
  await expect(
    run(process.execPath, [runner, build], { cwd: directory }),
  ).rejects.toThrow('Another static build');
  expect(await readFile(path.join(lock, 'owner'), 'utf8')).toBe('first build');
  expect(await readFile(path.join(directory, 'dist/index.html'), 'utf8')).toBe(
    'previous complete site',
  );
});

it('packaging cannot copy a site while another build owns the output lock', async () => {
  const directory = await fixture();
  const lock = path.join(directory, 'artifacts/.build-lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner'), 'first build');
  await expect(
    run(process.execPath, [runner, packager], { cwd: directory }),
  ).rejects.toThrow('Another static build/package');
  expect(await readFile(path.join(lock, 'owner'), 'utf8')).toBe('first build');
});

it('failed CI output preserves the preceding packaged artifact pointer', async () => {
  const repository = await fixture();
  const directory = path.join(repository, 'news');
  for (const name of ['dist', 'artifacts', 'static'])
    await mkdir(path.join(directory, name), { recursive: true });
  await mkdir(path.join(repository, 'assets'));
  await writeFile(path.join(repository, 'index.html'), 'portfolio');
  await writeFile(path.join(directory, 'dist/index.html'), 'new site');
  await writeFile(path.join(directory, 'static/404.html'), 'not found');
  await writeFile(
    path.join(directory, 'artifacts/build.json'),
    '{"preview":false,"revision":"new"}',
  );
  const pointer = path.join(directory, 'artifacts/pages-build.json');
  await writeFile(pointer, '{"directory":"previous","revision":"old"}');
  await expect(
    run(process.execPath, [runner, packager], {
      cwd: directory,
      env: {
        ...process.env,
        GITHUB_OUTPUT: path.join(directory, 'missing/output'),
      },
    }),
  ).rejects.toThrow();
  expect(await readFile(pointer, 'utf8')).toBe(
    '{"directory":"previous","revision":"old"}',
  );
});
