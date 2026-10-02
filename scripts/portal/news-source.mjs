import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const publishingEvents = new Set(['push', 'workflow_dispatch']);

export async function selectPublishedNews(api) {
  for (let page = 1; ; page += 1) {
    const runs = await api.runs(page);
    for (const run of runs) {
      const source = await publishedSource(api, run);
      if (source) return source;
    }
    if (runs.length < 100) throw new Error('No successful main-branch news publication found');
  }
}

async function publishedSource(api, run) {
  if (run.head_branch !== 'main') return null;
  if (!publishingEvents.has(run.event) || !/^[a-f0-9]{40}$/.test(run.head_sha)) return null;
  // A failed rerun must not erase evidence that an earlier attempt published.
  for (let attempt = run.run_attempt || 1; attempt >= 1; attempt -= 1) {
    const jobs = await api.jobs(run.id, attempt);
    if (jobs.some((job) => job.name === 'publish' && job.conclusion === 'success')) {
      return { sha: run.head_sha, runId: run.id };
    }
  }
  return null;
}

export function requireCurrentHead(candidate, current) {
  if (!/^[a-f0-9]{40}$/.test(candidate) || candidate !== current) {
    throw new Error('Main changed during this build; a newer portal build must publish');
  }
}

function githubApi() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository || '')) throw new Error('Missing repository');
  if (!process.env.GH_TOKEN) throw new Error('Missing GitHub token');
  return async (endpoint) => {
    const response = await fetch(`https://api.github.com/repos/${repository}/${endpoint}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}: ${endpoint}`);
    return response.json();
  };
}

async function main() {
  const api = githubApi();
  if (process.argv[2] === 'check-head') {
    const ref = await api('git/ref/heads/main');
    requireCurrentHead(process.env.PORTAL_SHA, ref.object.sha);
    console.log('Portal source still matches main.');
    return;
  }
  const source = await selectPublishedNews({
    runs: async (page) => (await api(
      `actions/workflows/news.yml/runs?branch=main&per_page=100&page=${page}`,
    )).workflow_runs,
    jobs: async (id, attempt) => (await api(
      `actions/runs/${id}/attempts/${attempt}/jobs?per_page=100`,
    )).jobs,
  });
  console.log(`Reusing published news source ${source.sha} (run ${source.runId}).`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `sha=${source.sha}\nrun_id=${source.runId}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
