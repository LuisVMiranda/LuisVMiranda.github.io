// Restore ignored binaries from this project's verified local release output.
import { copyFile, mkdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { root, sha256, verifyDownloads } from './verify.mjs';

const release = JSON.parse(await readFile(resolve(root, 'downloads/release.json'), 'utf8'));
await mkdir(resolve(root, 'downloads'), { recursive: true });
for (const artifact of release.artifacts) {
  const source = resolve(root, '../dist', artifact.file);
  const destination = resolve(root, 'downloads', artifact.file);
  assert.equal(await sha256(source), artifact.sha256, `Release mismatch: ${source}`);
  const temporary = `${destination}.part`;
  try {
    await copyFile(source, temporary);
    assert.equal(await sha256(temporary), artifact.sha256, 'Copy verification failed');
    await rename(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}
await verifyDownloads({ local: true });
console.log('Website downloads match the approved release manifest.');
