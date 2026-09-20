import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readContent } from './content-files';
import { contentRevision } from '../src/modules/editions/integrity';
import { validateDeployment } from '../src/modules/editions/publication';

const repository = process.env.GITHUB_REPOSITORY;
const commit = process.env.GITHUB_SHA;
if (!repository || !commit)
  throw new Error('This guard runs in the serialized Pages job');
const currentCommit = execFileSync(
  'gh',
  ['api', `repos/${repository}/git/ref/heads/main`, '--jq', '.object.sha'],
  { encoding: 'utf8' },
).trim();
const build = JSON.parse(
  await readFile('artifacts/pages-build.json', 'utf8'),
) as { preview: boolean; revision: string };
if (build.revision !== commit)
  throw new Error('Artifact built from a different commit');
const { articles, editions } = await readContent();
validateDeployment({
  candidateCommit: commit,
  currentCommit,
  contentRevision: contentRevision(articles, editions),
  approvedRevision: process.env.APPROVED_REVISION || '',
  preview: build.preview,
});
console.log(
  'Current approved static artifact is eligible for Pages deployment',
);
