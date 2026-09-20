export const requiredPages = [
  'home',
  'brasil',
  'mundo',
  'politica',
  'economia',
  'tecnologia',
  'ciencia',
  'cultura',
  'esportes',
  'article',
  'search',
  'archive',
  'editorial',
  'error',
  'shell',
  'static-build',
];
export interface PageReview {
  page: string;
  score: number;
  model: string;
  reasoning: string;
  files: Record<string, string>;
  checksPassed: boolean;
}
export interface ReviewManifest {
  sharedFiles: Record<string, string>;
  pages: PageReview[];
}
export async function validatePageReviews(
  manifest: ReviewManifest,
  digest: (file: string) => Promise<string>,
): Promise<void> {
  for (const page of requiredPages) {
    const review = manifest.pages.find((entry) => entry.page === page);
    if (!review || review.score < 9 || !review.checksPassed)
      throw new Error(`Missing passing review: ${page}`);
    if (review.model !== 'gpt-5.6-luna' || review.reasoning !== 'max')
      throw new Error(`Wrong page owner model: ${page}`);
    await validateHashes(review.files, digest);
  }
  await validateHashes(manifest.sharedFiles, digest);
}
async function validateHashes(
  files: Record<string, string>,
  digest: (file: string) => Promise<string>,
): Promise<void> {
  if (!Object.keys(files).length)
    throw new Error('Review must record source hashes');
  for (const [file, expected] of Object.entries(files)) {
    if ((await digest(file)) !== expected)
      throw new Error(`Review invalidated by changed file: ${file}`);
  }
}
