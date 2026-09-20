import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
  appendFile,
} from 'node:fs/promises';
import path from 'node:path';

const lockDirectory = path.resolve('artifacts/.build-lock');

async function acquireLock(): Promise<void> {
  await mkdir('artifacts', { recursive: true });
  try {
    await mkdir(lockDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error('Another static build/package is already running');
    throw error;
  }
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

async function commitPointer(
  pointer: string,
  staged: string,
  previous: string,
): Promise<void> {
  await rm(previous, { force: true });
  const hadPrevious = await moveIfPresent(pointer, previous);
  try {
    await rename(staged, pointer);
  } catch (error) {
    if (hadPrevious) await rename(previous, pointer);
    throw error;
  }
  try {
    await rm(previous, { force: true });
  } catch {
    // A valid new pointer and complete artifact are already committed.
  }
}

async function packagePages(): Promise<void> {
  await acquireLock();
  let destination: string | undefined;
  let complete = false;
  try {
    destination = await mkdtemp('artifacts/pages-');
    const repository = path.resolve('..');
    await cp(
      path.join(repository, 'index.html'),
      path.join(destination, 'index.html'),
    );
    await cp(
      path.join(repository, 'assets'),
      path.join(destination, 'assets'),
      {
        recursive: true,
      },
    );
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
    const build = JSON.parse(
      await readFile('artifacts/build.json', 'utf8'),
    ) as {
      preview: boolean;
      revision: string;
    };
    const site = new URL(
      process.env.SITE_URL || 'https://luisvmiranda.github.io',
    );
    const rules = build.preview
      ? 'User-agent: *\nDisallow: /news/\n'
      : `User-agent: *\nAllow: /\nSitemap: ${site.origin}/news/sitemap.xml\n`;
    await writeFile(path.join(destination, 'robots.txt'), rules);
    const manifest = { ...build, directory: path.resolve(destination) };
    const pointer = path.resolve('artifacts/pages-build.json');
    const stagedPointer = `${pointer}.next`;
    const previousPointer = `${pointer}.previous`;
    await writeFile(stagedPointer, JSON.stringify(manifest, null, 2) + '\n');
    try {
      if (process.env.GITHUB_OUTPUT)
        await appendFile(
          process.env.GITHUB_OUTPUT,
          `directory=news/${destination}\n`,
        );
      await commitPointer(pointer, stagedPointer, previousPointer);
      complete = true;
    } finally {
      await rm(stagedPointer, { force: true });
    }
    console.log(`Combined static Pages artifact: ${destination}`);
  } finally {
    if (!complete && destination)
      await rm(destination, { recursive: true, force: true });
    await rm(lockDirectory, { recursive: true, force: true });
  }
}

await packagePages();
