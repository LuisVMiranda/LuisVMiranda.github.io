import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function sha256(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}

export async function verifyDownloads() {
  const release = JSON.parse(await readFile(resolve(root, 'downloads/release.json'), 'utf8'));
  const checksums = await readFile(resolve(root, 'downloads/checksums.txt'), 'utf8');
  for (const artifact of release.artifacts) {
    const path = resolve(root, 'downloads', artifact.file);
    assert.equal((await stat(path)).size, artifact.bytes, `${artifact.file}: wrong size`);
    assert.equal(await sha256(path), artifact.sha256, `${artifact.file}: wrong SHA-256`);
    assert.ok(checksums.includes(`${artifact.sha256}  ${artifact.file}`), 'Checksum list mismatch');
  }
  return release;
}

export async function verifyLinks() {
  const html = await readFile(resolve(root, 'index.html'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const links = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const link of links) {
    if (link === '#') continue;
    if (link.startsWith('#')) {
      assert.ok(ids.has(link.slice(1)), `Missing anchor ${link}`);
      continue;
    }
    assert.ok(!link.includes('://'), `Unexpected external dependency ${link}`);
    assert.ok((await stat(resolve(root, link))).isFile(), `Missing file ${link}`);
  }
  return links.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await verifyDownloads();
  const count = await verifyLinks();
  console.log(`Verified both release packages (size + SHA-256) and ${count} local links.`);
}
