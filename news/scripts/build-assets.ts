import { build as bundle } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface BuildAssetsResult {
  styles: string;
  client: string;
  search: string;
  themeInit: string;
}

const assetPrefix = '/news/assets/';
const fontWeights = [400, 600, 700] as const;

function digest(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function assetUrl(name: string): string {
  return `${assetPrefix}${name}`;
}

async function writeHashed(
  directory: string,
  stem: string,
  extension: string,
  content: Uint8Array,
): Promise<string> {
  const filename = `${stem}.${digest(content)}${extension}`;
  await writeFile(path.join(directory, filename), content);
  return filename;
}

async function copyFonts(directory: string): Promise<string> {
  const packages = [
    { family: 'inter', cssFamily: 'Inter' },
    { family: 'source-serif-4', cssFamily: 'Source Serif 4' },
  ];
  const rules: string[] = [];
  for (const font of packages) {
    for (const weight of fontWeights) {
      const source = path.resolve(
        `node_modules/@fontsource/${font.family}/files/${font.family}-latin-${weight}-normal.woff2`,
      );
      const content = await readFile(source);
      const filename = await writeHashed(
        directory,
        `${font.family}-${weight}`,
        '.woff2',
        content,
      );
      rules.push(
        `@font-face{font-family:'${font.cssFamily}';font-style:normal;font-display:swap;font-weight:${weight};src:url('${assetUrl(filename)}') format('woff2')}`,
      );
    }
  }
  return rules.join('');
}

function stripFontImports(source: string): string {
  return source.replace(/@import\s+['"]@fontsource\/[^'"]+['"]\s*;?/g, '');
}

async function compileStyles(
  directory: string,
  fontCss: string,
): Promise<string> {
  const source = 'src/styles/main.css';
  await readFile(source);
  const output = path.join(directory, 'styles.raw.css');
  const cli = path.resolve('node_modules/@tailwindcss/cli/dist/index.mjs');
  const result = spawnSync(
    process.execPath,
    [cli, '-i', source, '-o', output, '--minify'],
    {
      stdio: 'inherit',
      windowsHide: true,
    },
  );
  if (result.status !== 0) throw new Error('Tailwind CSS compilation failed');
  const css = Buffer.from(
    `${fontCss}${stripFontImports(await readFile(output, 'utf8'))}`,
  );
  const filename = await writeHashed(directory, 'styles', '.css', css);
  await rm(output, { force: true });
  return assetUrl(filename);
}

async function bundleScript(
  directory: string,
  stem: string,
  entry: string,
): Promise<string> {
  await readFile(entry);
  const output = path.join(directory, `${stem}.raw.js`);
  await bundle({
    entryPoints: [entry],
    outfile: output,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  });
  const content = await readFile(output);
  const filename = await writeHashed(directory, stem, '.js', content);
  await rm(output, { force: true });
  return assetUrl(filename);
}

async function readThemeInit(): Promise<string> {
  return readFile('src/client/theme-init.js', 'utf8');
}

export async function buildAssets(output: string): Promise<BuildAssetsResult> {
  const directory = path.join(output, 'assets');
  await mkdir(directory, { recursive: true });
  const fontCss = await copyFonts(directory);
  const styles = await compileStyles(directory, fontCss);
  const client = await bundleScript(directory, 'client', 'src/client/main.js');
  const search = await bundleScript(
    directory,
    'search',
    'src/client/search.js',
  );
  const themeInit = await readThemeInit();
  return { styles, client, search, themeInit };
}

if (process.argv[1]?.endsWith('build-assets.ts')) {
  const output = process.argv[2] || 'dist';
  await buildAssets(path.resolve(output));
  console.log(`Built static assets in ${path.resolve(output, 'assets')}`);
}
