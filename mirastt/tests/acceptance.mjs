import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startServer } from '../tools/serve.mjs';
import { root, sha256, verifyDownloads, verifyLinks } from '../tools/verify.mjs';
import { testDemo } from './demo.mjs';
import { testDemoBoundaries } from './demo-boundaries.mjs';
import { testLanguages, testLanguageBoundaries } from './languages.mjs';
import { testAccessibility } from './accessibility.mjs';
import { testScene, testFallbacks, testLayouts, testFeatures } from './page.mjs';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const artifacts = resolve(root, 'tests/artifacts');
await mkdir(artifacts, { recursive: true });
const server = await startServer(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [],
  external = [],
  failedResponses = [],
  results = [];
page.on('pageerror', (error) => errors.push(error.message));
context.on('request', (request) => {
  if (/^https?:/.test(request.url()) && !request.url().startsWith(base))
    external.push(request.url());
});
page.on('response', (response) => {
  if (response.status() >= 400) failedResponses.push(response.url());
});
await context.addInitScript(() => {
  window.microphoneCalls = 0;
  navigator.mediaDevices.getUserMedia = () => {
    window.microphoneCalls++;
    throw Error('No microphone allowed');
  };
});

async function check(name, run) {
  const started = Date.now();
  try {
    await run();
    results.push({ name, passed: true, ms: Date.now() - started });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: error.stack });
    console.error(`FAIL ${name}: ${error.message}`);
    await page
      .screenshot({ path: resolve(artifacts, `failure-${results.length}.png`) })
      .catch(() => {});
  }
}

try {
  const release = await verifyDownloads();
  await check('Release checksums and all static links', async () => {
    assert.ok((await verifyLinks()) > 20);
  });
  await page.goto(base);
  await testScene(page, check);
  await testLayouts(page, check, artifacts);
  await testFeatures(page, check);
  await testDemo(page, check, artifacts);
  await testDemoBoundaries(page, check);
  await testLanguages(page, check, artifacts);
  await testLanguageBoundaries(browser, base, check);
  await testAccessibility(page, check);
  await check('Windows download button delivers the verified installer', async () => {
    const pending = page.waitForEvent('download');
    await page.locator('.download-card.recommended').click();
    const download = await pending;
    assert.equal(download.suggestedFilename(), 'Mira-Setup.exe');
    assert.equal(await sha256(await download.path()), release.artifacts[0].sha256);
    await download.delete();
  });
  await check('Linux and metadata downloads use complete local files', async () => {
    for (const artifact of release.artifacts) {
      const response = await fetch(`${base}/downloads/${artifact.file}`, { method: 'HEAD' });
      assert.equal(response.status, 200);
      assert.equal(Number(response.headers.get('content-length')), artifact.bytes);
    }
    const response = await fetch(`${base}/downloads/release.json`);
    assert.deepEqual(await response.json(), release);
  });
  await testFallbacks(browser, base, check, artifacts);
  await check('Subdirectory deployment preserves modules, assets, and links', async () => {
    const nested = await startServer(0, '/mira/');
    const nestedPage = await browser.newPage();
    try {
      const url = `http://127.0.0.1:${nested.address().port}/mira/`;
      await nestedPage.goto(url);
      await nestedPage.waitForFunction(() => document.querySelector('#hero-art').dataset.renderer);
      assert.equal(
        await nestedPage.locator('.download-card.recommended').getAttribute('href'),
        'downloads/Mira-Setup.exe',
      );
      assert.equal((await fetch(`${url}downloads/Mira-Setup.exe`, { method: 'HEAD' })).status, 200);
    } finally {
      await nestedPage.close();
      nested.close();
    }
  });
  await check(
    'No external requests, microphone use, page errors, or failed resources',
    async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      assert.deepEqual(failedResponses, []);
      assert.equal(await page.evaluate(() => window.microphoneCalls), 0);
    },
  );
} finally {
  await browser.close();
  server.close();
  const report = { checkedAt: new Date().toISOString(), browser: 'Chromium', results };
  await writeFile(resolve(artifacts, 'results.json'), JSON.stringify(report, null, 2) + '\n');
}
const failed = results.filter((result) => !result.passed);
console.log(`${results.length - failed.length}/${results.length} acceptance checks passed.`);
process.exitCode = failed.length ? 1 : 0;
