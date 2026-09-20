import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const base = 'http://127.0.0.1:4321';
const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  stdio: 'ignore',
});
await mkdir('artifacts', { recursive: true });
async function ready(): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* Wait for the local test server. */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Preview server did not start');
}
await ready();
const chrome = await chromium.launch({
  args: ['--remote-debugging-port=9223'],
});
await new Promise((resolve) => setTimeout(resolve, 1500));
const articles = (await readdir('content/articles')).filter((name) =>
  name.endsWith('.json'),
);
const first = articles[0]
  ? (JSON.parse(await readFile(`content/articles/${articles[0]}`, 'utf8')) as {
      slug: string;
    })
  : null;
const routes = ['/', '/en/secao/brasil/', '/busca/'];
if (first) routes.push(`/artigos/${first.slug}/`);
const summaries = [];
try {
  for (const route of routes) {
    const report = await lighthouse(base + '/news' + route, {
      port: 9223,
      output: 'json',
      onlyCategories: ['performance', 'accessibility'],
      logLevel: 'error',
    });
    if (!report) throw new Error('Lighthouse did not produce a report');
    const metrics = report.lhr.audits;
    const summary = {
      route,
      performance: (report.lhr.categories.performance!.score || 0) * 100,
      lcp: metrics['largest-contentful-paint']!.numericValue!,
      cls: metrics['cumulative-layout-shift']!.numericValue!,
      tbt: metrics['total-blocking-time']!.numericValue!,
    };
    summaries.push(summary);
    await writeFile(
      `artifacts/lighthouse-${route.replaceAll('/', '-') || 'home'}.json`,
      JSON.stringify(report.lhr),
    );
  }
  const jsFiles = (await readdir('dist/assets')).filter((name) =>
    name.endsWith('.js'),
  );
  const compressed = await Promise.all(
    jsFiles.map(
      async (name) => gzipSync(await readFile(`dist/assets/${name}`)).length,
    ),
  );
  const total = compressed.reduce((sum, size) => sum + size, 0);
  await writeFile(
    'artifacts/performance-summary.json',
    JSON.stringify(
      {
        profile:
          'Lighthouse default mobile simulated throttling, local static server',
        summaries,
        allAuthoredJavaScriptGzipBytes: total,
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify({ summaries, totalJavaScriptGzipBytes: total }, null, 2),
  );
  if (
    total > 80 * 1024 ||
    summaries.some(
      (item) =>
        item.performance < 90 ||
        item.lcp > 2500 ||
        item.cls > 0.1 ||
        item.tbt > 200,
    )
  )
    throw new Error('Performance budget failed');
} finally {
  await chrome.close();
  server.kill();
}
