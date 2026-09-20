import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  appendFile,
} from 'node:fs/promises';
import path from 'node:path';

// A fresh directory prevents concurrent artifacts from mixing editions.
await mkdir('artifacts', { recursive: true });
const destination = await mkdtemp('artifacts/pages-');
const repository = path.resolve('..');
await cp(
  path.join(repository, 'index.html'),
  path.join(destination, 'index.html'),
);
await cp(path.join(repository, 'assets'), path.join(destination, 'assets'), {
  recursive: true,
});
for (const optional of ['CNAME', 'favicon.ico', 'favicon.svg']) {
  await cp(
    path.join(repository, optional),
    path.join(destination, optional),
  ).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  });
}
await cp('dist', path.join(destination, 'news'), { recursive: true });
await cp('static/404.html', path.join(destination, '404.html'));
await writeFile(path.join(destination, '.nojekyll'), '');
const build = JSON.parse(await readFile('artifacts/build.json', 'utf8')) as {
  preview: boolean;
  revision: string;
};
const site = new URL(process.env.SITE_URL || 'https://luisvmiranda.github.io');
const rules = build.preview
  ? 'User-agent: *\nDisallow: /news/\n'
  : `User-agent: *\nAllow: /\nSitemap: ${site.origin}/news/sitemap.xml\n`;
await writeFile(path.join(destination, 'robots.txt'), rules);
const manifest = { ...build, directory: path.resolve(destination) };
await writeFile(
  'artifacts/pages-build.json',
  JSON.stringify(manifest, null, 2) + '\n',
);
if (process.env.GITHUB_OUTPUT)
  await appendFile(
    process.env.GITHUB_OUTPUT,
    `directory=news/${destination}\n`,
  );
console.log(`Combined static Pages artifact: ${destination}`);
