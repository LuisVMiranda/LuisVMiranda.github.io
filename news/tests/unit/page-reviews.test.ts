import { expect, it } from 'vitest';
import {
  requiredPages,
  validatePageReviews,
} from '../../src/modules/editions/page-reviews';

const reviews = () => ({
  sharedFiles: { shell: 'reviewed' },
  pages: requiredPages.map((page) => ({
    page,
    score: 9.5,
    model: 'gpt-5.6-luna',
    reasoning: 'max',
    checksPassed: true,
    files: { [page]: 'reviewed' },
  })),
});
it('invalidates page approval after a shared change', async () => {
  await expect(
    validatePageReviews(reviews(), async () => 'reviewed'),
  ).resolves.toBeUndefined();
  await expect(
    validatePageReviews(reviews(), async (file) =>
      file === 'shell' ? 'edited' : 'reviewed',
    ),
  ).rejects.toThrow('changed file');
});
it('refuses a failed page, a low score or a substituted model', async () => {
  const manifest = reviews();
  manifest.pages[0]!.score = 8.9;
  await expect(
    validatePageReviews(manifest, async () => 'reviewed'),
  ).rejects.toThrow('Missing passing');
  manifest.pages[0]!.score = 9.5;
  manifest.pages[0]!.model = 'other';
  await expect(
    validatePageReviews(manifest, async () => 'reviewed'),
  ).rejects.toThrow('Wrong page owner');
});
