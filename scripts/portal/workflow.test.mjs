import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('every main push schedules a successor for builds rejected as stale', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/portal.yml', import.meta.url), 'utf8');
  const push = workflow.split('  push:')[1].split('  workflow_dispatch:')[0];
  assert.match(push, /branches: \[main\]/);
  assert.doesNotMatch(push, /paths(?:-ignore)?:/,
    'A news-only push must also queue a current portal build when the stale-head guard rejects its predecessor');
});

test('failed news releases also queue recovery after displacing a pending portal job', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/portal.yml', import.meta.url), 'utf8');
  const condition = workflow.split('    if: >-')[1].split('    runs-on:')[0];
  assert.doesNotMatch(condition, /conclusion/,
    'Recovery must follow failed/cancelled news runs as well as successful ones');
  assert.match(condition, /workflow_run\.event == 'push'/);
  assert.match(condition, /workflow_run\.event == 'workflow_dispatch'/);
  assert.doesNotMatch(condition, /pull_request/);
});
