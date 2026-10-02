import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { selectPublishedNews, requireCurrentHead } from './news-source.mjs';
import { packagePortal } from './package.mjs';

const sha = 'a'.repeat(40);
const run = (id, overrides = {}) => ({
  id, head_sha: sha, head_branch: 'main', event: 'push', conclusion: 'success',
  ...overrides,
});

test('selects an actual news publication, excluding PRs and skipped publish jobs', async () => {
  const runs = [run(4, { event: 'pull_request' }), run(3), run(2), run(1)];
  const selected = await selectPublishedNews({
    runs: async () => runs,
    jobs: async (id) => [{ name: 'publish', conclusion: id === 2 ? 'success' : 'skipped' }],
  });
  assert.deepEqual(selected, { sha, runId: 2 });
});

test('finds older successful publications across API pages', async () => {
  const selected = await selectPublishedNews({
    runs: async (page) => page === 1
      ? Array.from({ length: 100 }, (_, id) => run(id, { event: 'pull_request' }))
      : [run(101, { event: 'workflow_dispatch' })],
    jobs: async () => [{ name: 'publish', conclusion: 'success' }],
  });
  assert.equal(selected.runId, 101);
});

test('a failed rerun does not roll back previously published news', async () => {
  const selected = await selectPublishedNews({
    runs: async () => [run(5, { conclusion: 'failure', run_attempt: 2 }), run(4)],
    jobs: async (id, attempt) => [{ name: 'publish', conclusion: attempt === 1 ? 'success' : 'failure' }],
  });
  assert.equal(selected.runId, 5);
});

test('fails closed without a proven publication or with a stale portal build', async () => {
  await assert.rejects(selectPublishedNews({ runs: async () => [], jobs: async () => [] }), /No successful/);
  assert.throws(() => requireCurrentHead(sha, 'b'.repeat(40)), /changed/);
  assert.doesNotThrow(() => requireCurrentHead(sha, sha));
});

async function fixture(root, file, content = 'fixture') {
  const destination = join(root, file);
  await mkdir(join(destination, '..'), { recursive: true });
  await writeFile(destination, content);
}

test('packages both sites and current downloads without pending news or development files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portal-test-'));
  const source = join(root, 'source');
  const reviewed = join(root, 'reviewed');
  const output = join(root, 'public');
  try {
    const files = [
      'index.html', 'assets/main.css', 'mirastt/index.html', 'mirastt/favicon.ico',
      'mirastt/assets/font.woff2', 'mirastt/styles/main.css', 'mirastt/scripts/main.js',
      'mirastt/downloads/release.json', 'mirastt/downloads/checksums.txt',
      'mirastt/downloads/private.exe', 'mirastt/node_modules/dependency.js',
      'mirastt/tests/artifacts/screenshot.png', 'mirastt/.env', 'news/dist/index.html',
    ];
    for (const file of files) await fixture(source, file, file);
    await fixture(reviewed, 'dist/index.html', 'approved news');
    await fixture(reviewed, 'static/404.html', 'approved 404');
    await fixture(reviewed, 'artifacts/build.json', JSON.stringify({ preview: false, revision: sha }));
    await packagePortal({ source, reviewed, output, news: { sha, runId: 2 }, portalSha: sha });
    assert.equal(await readFile(join(output, 'news/index.html'), 'utf8'), 'approved news');
    assert.equal(await readFile(join(output, 'mirastt/index.html'), 'utf8'), 'mirastt/index.html');
    assert.equal(await readFile(join(output, 'mirastt/downloads/release.json'), 'utf8'), 'mirastt/downloads/release.json');
    assert.deepEqual((await readdir(join(output, 'mirastt'))).sort(),
      ['assets', 'downloads', 'favicon.ico', 'index.html', 'scripts', 'styles']);
    assert.deepEqual((await readdir(join(output, 'mirastt/downloads'))).sort(), ['checksums.txt', 'release.json']);
    await assert.rejects(packagePortal({ source, reviewed, output, news: { sha, runId: 2 }, portalSha: sha }), /EEXIST/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects preview or mismatched news builds', async () => {
  const root = await mkdtemp(join(tmpdir(), 'portal-test-'));
  try {
    for (const build of [{ preview: true, revision: sha }, { preview: false, revision: 'b'.repeat(40) }]) {
      await fixture(root, 'artifacts/build.json', JSON.stringify(build));
      await assert.rejects(packagePortal({
        source: root, reviewed: root, output: join(root, 'public'),
        news: { sha, runId: 2 }, portalSha: sha,
      }), /approved news/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
