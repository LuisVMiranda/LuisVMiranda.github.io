import { cp, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const miraFiles = [
  'index.html', 'favicon.ico', 'assets', 'styles', 'scripts',
  'downloads/release.json', 'downloads/checksums.txt',
];

// Publish the standalone landing bundle and its assets, excluding development files.
const snapflowFiles = [
  'index.html', 'landing-icon.svg', 'landing.bundle.js',
  'landing.css', 'landing-theme.css', 'landing-responsive.css',
  'assets/hero-camera.webp', 'assets/hero-camera-dark.webp',
  'assets/coast.webp', 'assets/coast-detail.webp', 'assets/events.webp',
  'portfolio.html', 'sobre.html', 'favicon.svg', 'site.css',
  'site.js', 'navigation.js', 'carousel.js', 'contact.js',
  'erick-about-maceio.png', 'erick-pfp-01.png',
];

async function rejectSymlinks(source) {
  const info = await lstat(source);
  if (info.isSymbolicLink()) throw new Error(`Symlink cannot be published: ${source}`);
  if (!info.isDirectory()) return;
  for (const entry of await readdir(source)) await rejectSymlinks(join(source, entry));
}

async function copy(source, destination, optional = false) {
  try {
    await rejectSymlinks(source);
    await mkdir(join(destination, '..'), { recursive: true });
    await cp(source, destination, { recursive: true, errorOnExist: true, force: false });
  } catch (error) {
    if (!optional || error.code !== 'ENOENT') throw error;
  }
}

export async function packagePortal(options) {
  const { source, reviewed, output, news, portalSha } = options;
  const build = JSON.parse(await readFile(join(reviewed, 'artifacts/build.json'), 'utf8'));
  if (build.preview !== false || build.revision !== news.sha) {
    throw new Error('Expected the approved news production build at the selected revision');
  }
  // Require a fresh destination: never merge an old artifact into a new release.
  await mkdir(output);
  for (const name of ['index.html', 'assets']) await copy(join(source, name), join(output, name));
  for (const name of ['CNAME', 'favicon.ico', 'favicon.svg']) {
    await copy(join(source, name), join(output, name), true);
  }
  for (const name of miraFiles) {
    await copy(join(source, 'mirastt', name), join(output, 'mirastt', name));
  }
  for (const name of snapflowFiles) {
    await copy(join(source, 'snapflow', name), join(output, 'snapflow', name));
  }
  await copy(join(reviewed, 'dist'), join(output, 'news'));
  await copy(join(reviewed, 'static/404.html'), join(output, '404.html'));
  const site = new URL(process.env.SITE_URL || 'https://luisvmiranda.github.io');
  if (site.protocol !== 'https:' || site.pathname !== '/') throw new Error('Invalid site origin');
  await writeFile(join(output, '.nojekyll'), '');
  await writeFile(join(output, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${site.origin}/news/sitemap.xml\n`);
  await writeFile(join(output, 'deployment.json'), JSON.stringify({
    portalSha, newsSha: news.sha, newsRunId: news.runId,
  }, null, 2) + '\n');
  for (const page of ['index.html', 'mirastt/index.html', 'snapflow/index.html', 'news/index.html']) {
    if (!(await readFile(join(output, page), 'utf8')).trim()) throw new Error(`Empty page: ${page}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await packagePortal({
    source: process.cwd(), reviewed: resolve('.reviewed-news/news'),
    output: process.env.PAGES_OUTPUT,
    news: { sha: process.env.NEWS_SHA, runId: Number(process.env.NEWS_RUN_ID) },
    portalSha: process.env.PORTAL_SHA,
  });
  console.log(`Complete static site: ${process.env.PAGES_OUTPUT}`);
}
