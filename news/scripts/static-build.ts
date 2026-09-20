import { spawnSync } from 'node:child_process';
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { buildAssets } from './build-assets.ts';
import { archiveRoutes } from '../src/modules/editions/routes.ts';
import { sections } from '../src/modules/content/sections.ts';
import { feed, xml } from '../src/modules/content/feed.ts';
import { localUrl } from '../src/modules/content/urls.ts';
import type { Locale } from '../src/modules/content/types.ts';
import { checkOutput } from './check-output.ts';

export interface StaticBuildOptions {
  preview: boolean;
  site?: string;
}

const defaultSite = 'https://luisvmiranda.github.io';
const lockDirectory = path.resolve('artifacts/.build-lock');

function siteOrigin(value: string): URL {
  const site = new URL(value);
  if (site.protocol !== 'https:' || site.pathname !== '/')
    throw new Error('SITE_URL must be an HTTPS origin');
  return site;
}

async function writeRoute(
  output: string,
  route: { locale: Locale; path: string },
  html: string,
): Promise<void> {
  const url = localUrl(route.path, route.locale);
  const relative = url.replace(/^\/news\//, '').replace(/\/$/, '');
  const directory = path.join(output, relative);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

async function copyPublic(output: string): Promise<void> {
  const source = path.resolve('public');
  for (const entry of await readdir(source, { withFileTypes: true })) {
    await cp(path.join(source, entry.name), path.join(output, entry.name), {
      recursive: entry.isDirectory(),
    });
  }
}

function runPagefind(output: string): void {
  const result = spawnSync(
    process.execPath,
    ['node_modules/pagefind/lib/runner/bin.cjs', '--site', output],
    { stdio: 'inherit', windowsHide: true },
  );
  if (result.status !== 0) throw new Error('Pagefind indexing failed');
}

async function writeFeeds(
  output: string,
  articles: import('../src/modules/content/types.ts').Article[],
  site: URL,
  preview: boolean,
): Promise<void> {
  const published = preview ? [] : articles;
  await writeFile(path.join(output, 'rss.xml'), feed(published, 'pt-BR', site));
  await mkdir(path.join(output, 'en'), { recursive: true });
  await writeFile(path.join(output, 'en/rss.xml'), feed(published, 'en', site));
}

async function writeSitemap(
  output: string,
  articles: import('../src/modules/content/types.ts').Article[],
  editions: import('../src/modules/content/types.ts').Edition[],
  site: URL,
  preview: boolean,
): Promise<void> {
  const paths = [
    '',
    ...archiveRoutes(editions).map((route) => route.path),
    'editorial',
    ...sections.map((section) => `secao/${section.id}`),
    ...articles.map((article) => `artigos/${article.slug}`),
    ...editions.map((edition) => `edicao/${edition.id}`),
  ];
  const locales: Locale[] = ['pt-BR', 'en'];
  const urls = preview
    ? ''
    : locales
        .flatMap((locale) =>
          paths.map(
            (route) =>
              `<url><loc>${xml(new URL(localUrl(route, locale), site).href)}</loc></url>`,
          ),
        )
        .join('');
  const body = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  await writeFile(path.join(output, 'sitemap.xml'), body);
}

async function moveIfPresent(
  source: string,
  destination: string,
): Promise<boolean> {
  try {
    await rename(source, destination);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function publish(
  temp: string,
  destination: string,
  metadata: string,
): Promise<void> {
  const previousDist = `${destination}.previous`;
  const metadataPath = path.resolve('artifacts/build.json');
  const previousMetadata = `${metadataPath}.previous`;
  const stagedMetadata = `${metadataPath}.next`;
  let movedDist = false;
  let movedMetadata = false;
  let newDist = false;
  let newMetadata = false;
  await rm(previousDist, { recursive: true, force: true });
  await rm(previousMetadata, { force: true });
  try {
    await writeFile(stagedMetadata, metadata);
    movedDist = await moveIfPresent(destination, previousDist);
    movedMetadata = await moveIfPresent(metadataPath, previousMetadata);
    await rename(temp, destination);
    newDist = true;
    await rename(stagedMetadata, metadataPath);
    newMetadata = true;
  } catch (error) {
    if (newMetadata) await rm(metadataPath, { force: true });
    if (movedMetadata) await rename(previousMetadata, metadataPath);
    if (newDist) await rm(destination, { recursive: true, force: true });
    if (movedDist) await rename(previousDist, destination);
    throw error;
  } finally {
    await rm(stagedMetadata, { force: true });
  }
  await rm(previousDist, { recursive: true, force: true });
  await rm(previousMetadata, { force: true });
}

async function acquireLock(): Promise<void> {
  await mkdir('artifacts', { recursive: true });
  try {
    await mkdir(lockDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error('Another static build is already running');
    throw error;
  }
}

export async function buildSite(options: StaticBuildOptions): Promise<void> {
  const site = siteOrigin(options.site || process.env.SITE_URL || defaultSite);
  await acquireLock();
  const destination = path.resolve('dist');
  let temp: string | undefined;
  let published = false;
  try {
    temp = await mkdtemp(path.resolve('artifacts/static-build-'));
    const { loadCatalog } = await import('../src/modules/content/catalog.ts');
    const { createRoutes } = await import('../src/render/routes.js');
    const { renderPage } = await import('../src/render/index.js');
    const catalog = await loadCatalog(options.preview);
    const assets = await buildAssets(temp);
    await copyPublic(temp);
    const routes = createRoutes(catalog);
    for (const route of routes) {
      const html = renderPage({
        ...route,
        preview: options.preview,
        site: site.origin,
        assets,
      });
      await writeRoute(temp, route, html);
    }
    await writeFeeds(temp, catalog.articles, site, options.preview);
    await writeSitemap(
      temp,
      catalog.articles,
      catalog.editions,
      site,
      options.preview,
    );
    runPagefind(temp);
    await checkOutput(temp, options.preview);
    await publish(
      temp,
      destination,
      `${JSON.stringify(
        {
          preview: options.preview,
          revision: process.env.GITHUB_SHA || 'local',
        },
        null,
        2,
      )}\n`,
    );
    published = true;
  } finally {
    if (!published && temp) await rm(temp, { recursive: true, force: true });
    await rm(lockDirectory, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith('static-build.ts'))
  await buildSite({ preview: process.argv.includes('--preview') });
