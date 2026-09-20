import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { sections } from '../src/modules/content/sections';
import { automationIssues } from '../src/modules/research/automation';
import { readContent } from './content-files';

interface VerifiedEntry {
  articleId?: string;
  evidence?: string;
  selectionReason?: string;
  contentReview?: {
    bodyComplete?: boolean;
    aiSummaryReviewed?: boolean;
  };
}
interface EditorialManifest {
  cutoff?: string;
  verified?: VerifiedEntry[];
}

async function manifest(section: string): Promise<EditorialManifest> {
  const source = await readFile(`research/editorial/${section}.json`, 'utf8');
  return JSON.parse(source) as EditorialManifest;
}

function sameOrder(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

function missing(condition: boolean, message: string): string[] {
  return condition ? [] : [message];
}

function entryIssues(
  section: string,
  expected: string[],
  entry: VerifiedEntry,
  index: number,
  legacyOk: boolean,
): string[] {
  const label = `${section}/${entry.articleId ?? expected[index] ?? 'unknown'}`;
  const legacyIssues = legacyOk
    ? []
    : [
        ...missing(
          Boolean(entry.contentReview?.bodyComplete),
          `${label} body is not marked complete and reviewed`,
        ),
        ...missing(
          Boolean(entry.contentReview?.aiSummaryReviewed),
          `${label} AI summary is not marked reviewed`,
        ),
      ];
  return [
    ...missing(
      Boolean(entry.evidence?.trim()),
      `${label} has no source evidence`,
    ),
    ...missing(
      Boolean(entry.selectionReason?.trim()),
      `${label} has no selection reason`,
    ),
    ...legacyIssues,
  ];
}

const legacyOk = process.argv.includes('--legacy-ok');
const { articles, editions } = await readContent();
const edition = [...editions].sort((a, b) =>
  b.cutoff.localeCompare(a.cutoff),
)[0];
if (!edition)
  throw new Error('No edition is available for automation verification');
const issues = automationIssues(edition, articles, 10, !legacyOk);
for (const { id: section } of sections) {
  let data: EditorialManifest;
  try {
    data = await manifest(section);
  } catch (error) {
    issues.push(
      `${section} editorial manifest is unreadable: ${String(error)}`,
    );
    continue;
  }
  const expected = edition.sections[section].articleIds;
  const verified = data.verified ?? [];
  const verifiedIds = verified.map((entry) => entry.articleId ?? '');
  if (data.cutoff !== edition.cutoff)
    issues.push(`${section} manifest cutoff does not match ${edition.id}`);
  if (!sameOrder(expected, verifiedIds))
    issues.push(`${section} manifest order does not match the edition`);
  issues.push(
    ...verified.flatMap((entry, index) =>
      entryIssues(section, expected, entry, index, legacyOk),
    ),
  );
}
const report = {
  edition: edition.id,
  cutoff: edition.cutoff,
  verifiedAt: new Date().toISOString(),
  ok: issues.length === 0,
  selected: sections.reduce(
    (total, { id }) => total + edition.sections[id].articleIds.length,
    0,
  ),
  issues,
};
const output =
  process.env.NEWS_VERIFICATION_REPORT || 'artifacts/news-verification.json';
await mkdir(output.slice(0, output.lastIndexOf('/')), {
  recursive: true,
}).catch(() => undefined);
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (issues.length)
  throw new Error(
    `News verification failed with ${issues.length} blocking issues`,
  );
