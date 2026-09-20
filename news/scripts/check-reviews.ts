import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  validatePageReviews,
  type ReviewManifest,
} from '../src/modules/editions/page-reviews';

export async function checkReviews(): Promise<void> {
  const manifest = JSON.parse(
    await readFile('reviews/pages.json', 'utf8'),
  ) as ReviewManifest;
  await validatePageReviews(manifest, async (file) =>
    createHash('sha256')
      .update(await readFile(file))
      .digest('hex'),
  );
}
await checkReviews();
console.log('All 14 page approvals match the current source revision.');
