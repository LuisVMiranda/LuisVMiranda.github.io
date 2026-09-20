# Daily Notícias automation

Run from `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io\news` every day at 08:00 in `America/Sao_Paulo`.

Goal: prepare one reviewable edition with up to ten verified stories in each of the eight desks (`brasil`, `mundo`, `politica`, `economia`, `tecnologia`, `ciencia`, `cultura`, `esportes`). The result is a draft branch, not an automatic production publication.

## Safety gates

1. Read the current date/time with `date` and inspect `git status --short --branch`. Abort without edits if the worktree is dirty, the branch cannot be updated safely, or the repository has diverged from `origin/main`.
2. Run `npm run research` to freeze one cutoff and retain the candidate run. Use web search and the original publisher pages to improve the candidates; search snippets are not evidence.
3. For every selected story, read the complete accessible article body. Reject paywalled, incomplete, undated, future, duplicate, rumor-only, or inaccessible sources. Do not bypass access controls. Keep raw retrieval evidence in ignored `research/runs/`.
4. Never pad a desk. If any desk has fewer than ten qualified stories, leave the current content untouched, write a failure report under `artifacts/`, and stop without committing.
5. Produce rights-safe original reporting, not near-verbatim copies. Each selected article must have paired PT-BR and EN title, synopsis, an original reading body with at least three substantive paragraphs, an `aiSummary` of two or three factual sentences, and:

```json
"rights": { "mode": "original-report" }
```

Use `licensed-reproduction` only when a real permission reference and license are recorded. Label the AI field only through the existing template: `Resumo por IA` / `AI summary`. 6. Update `research/editorial/<section>.json` with the shared cutoff, the exact ordered ten IDs, source evidence, selection reasons, and for every selected entry:

```json
"contentReview": {
  "bodyComplete": true,
  "aiSummaryReviewed": true
}
```

7. Append a new immutable edition through `npx tsx scripts/edition.ts YYYY-MM-DD` and set `leadArticleId` explicitly to the strongest Brasil story. Update the generated edition record if the helper's default lead is not correct. Do not edit `content/approval.json`.

## Verification and submission

Run all of these before committing:

```text
npm run news:verify
npm run check
npm test -- --run
npm run build:preview
npm run package:pages
npm run review
```

Inspect the preview in both languages, especially the homepage lead, all eight ranked lists, article pages, AI-summary block, sources, dates, language switch, dark mode, and reading controls. The strict `news:verify` command must pass; never use `--legacy-ok` here. If any check fails, do not commit or push.

When every gate passes, create or update the review branch `automation/daily-news`, commit only intended source/content/manifests/edition changes, and push that branch to `origin`. Do not force-push, change page-review scores, approve the content, merge the branch, or publish to GitHub Pages. Report the commit and branch so the editor can review and approve the exact digest.

If no qualified full-text selection exists, report the per-desk shortfall and leave the previously approved edition deployed. A successful search is never permission to submit unverified articles.
