import { writeFile } from 'node:fs/promises';
import { readContent } from './content-files';
import { contentRevision, isApproved } from '../src/modules/editions/integrity';

const { articles, editions, approval } = await readContent();
const revision = contentRevision(articles, editions);
const args = process.argv.slice(2);
function argument(name: string): string | undefined {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
if (args.includes('--approve')) {
  if (argument('--revision') !== revision)
    throw new Error(
      'Content changed: inspect the current revision before approval',
    );
  const approvedBy = argument('--by');
  if (!approvedBy || !args.includes('--confirm-reviewed'))
    throw new Error('Explicit reviewer and --confirm-reviewed are required');
  if (!articles.length || !editions.length)
    throw new Error('An empty edition cannot be approved');
  await writeFile(
    'content/approval.json',
    JSON.stringify(
      { revision, approvedBy, approvedAt: new Date().toISOString() },
      null,
      2,
    ) + '\n',
  );
  console.log(`Recorded editorial approval for ${revision}`);
} else {
  console.log(
    JSON.stringify(
      {
        revision,
        approved: isApproved(articles, editions, approval),
        articles: articles.length,
        editions: editions.length,
      },
      null,
      2,
    ),
  );
}
