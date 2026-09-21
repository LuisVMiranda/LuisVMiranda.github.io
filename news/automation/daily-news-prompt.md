# github-news daily automation

Run from `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io\news` every day at 07:45 GMT-3 (`America/Sao_Paulo`). The scheduled job is named `github-news` and publishes verified editions directly to `main`, leaving a 15-minute buffer before the 08:00 editorial target.

Goal: prepare one verified edition with exactly ten verified, fully developed stories in each fixed desk: `brasil`, `mundo`, `politica`, `economia`, `tecnologia`, `ciencia`, `cultura`, and `esportes`, then commit and push it to `main` so GitHub Pages can deploy it automatically. No human editorial step is required: an independent read-only subagent must review the exact content revision before the automation records approval and publishes.

Read `news-report.md`, `README.md`, `research/TEMPLATE.md`, `src/modules/content/schema.ts`, the existing section manifests, and the current Git status before making any edit. Preserve the existing site design and article template. Populate the existing optional AI-summary field; do not redesign the pages or edit generated HTML.

## Safety gates

1. Read the current date/time with `date` and inspect `git status --short --branch`. Abort without content edits if the worktree is dirty, the branch cannot be updated safely, or the repository has diverged from `origin/main`.
2. Run `npm run research` once to freeze one shared cutoff and retain the candidate run. Treat its local SearXNG results as a candidate inventory only. Before selecting stories, run `npx tsx scripts/extract-research.ts --run RUN_DIR --max-per-section 40 --concurrency 8`, then run `npm run research:corroborate -- --run RUN_DIR`. Read both generated indexes: `extractions/index.json` and `corroboration/index.json`. The latter contains lexical leads only; confirm the matching facts and discrepancies in both complete source bodies before using a pair as corroboration. You must use the web search and web extraction tools directly to locate and read complete original publisher pages for selected stories. If `web_extract` has no backend, use the browser tool to open the public article; if the browser tool cannot start, use the batch Playwright evidence under `research/runs/RUN_DIR/extractions/`. If a page is blocked, follow the approved recovery ladder and pivot to an accessible original or reputable alternative. Continue with direct web retrieval rather than failing solely because one retrieval path is unavailable. Search snippets, RSS excerpts, aggregators, and AI-generated text are not evidence.
3. For every selected story, use a complete extracted source body, including meaningful qualifications, updates, corrections, lists, tables, and captions. Preserve the source's factual coverage, chronology, attribution, caveats and relevant context in the published reading version. Accept a batch record only when HTTP succeeded, `complete: true`, there are at least three extracted paragraphs, and warnings are empty; retain its JSON evidence in the ignored run directory. If the batch inventory leaves a desk below ten complete sources, perform focused web searches and run `scripts/extract-article.ts` for the additional candidates before declaring a shortfall. Reject paywalled or incomplete pages, undated or future stories, duplicates, rumors, inaccessible sources, and stories outside the desk. Do not bypass access controls. Keep raw retrieval evidence only in ignored `research/runs/`.
4. Validate each story before selection. For consequential, disputed, unusually consequential, or manipulation-prone claims, require at least one independent reputable corroborating source and use two when the claim warrants it. For routine low-risk service, culture, schedule or result reports, a complete reputable publisher source may be sufficient when the facts are directly stated, internally coherent, and no conflicting evidence appears; record why independent corroboration was not materially necessary. Prefer an official primary record plus an independent newsroom or wire service. Record the corroborating URLs, matching facts, discrepancies, and why the evidence supports publication. If credible sources conflict or the story cannot be verified at the appropriate level, mark it unverified and omit it rather than presenting it as fact.
5. Select the top ten distinct qualified stories per desk, prioritizing the preceding 24 hours and expanding to seven days only when necessary. Deduplicate canonical URLs and shared events across desks; use one article identity with justified secondary sections when appropriate.
6. Never pad a desk. Use the complete-source inventory and corroboration leads to select real stories; do not report zero merely because every story lacks a second source when the story is routine and low-risk under step 4. If any desk still has fewer than ten qualified stories after focused retrieval and the appropriate verification gate, leave the current content, edition, approval record, and deployment untouched; write a dated failure report under `artifacts/`; report the per-desk shortfall and the exact rejected-source reasons; and stop without committing or pushing.

## Article and template contract

6. Produce a complete, faithful, rights-safe reading version. Read the full source article and carry over all material verified facts, chronology, attribution, qualifications, corrections and relevant context. Do not publish a near-verbatim or paragraph-by-paragraph substitute for an unlicensed source: use `original-report` prose unless the source is public domain or a real reproduction license/permission is recorded. Each selected article must include paired PT-BR and EN title, synopsis, source links, publication/update dates, an original reading body with at least three substantive paragraphs per language, and:

```json
"rights": { "mode": "original-report" }
```

Use `licensed-reproduction` only with a real permission reference and license. Preserve the existing article template. Every new article must provide paired `translations[locale].aiSummary` values: two or three factual sentences, normally 40–70 words, explaining what the article provides (the event, why it matters, and the relevant context). The existing renderer must show this field in the compact block labeled `Resumo por IA` / `AI summary` immediately below the article metadata and before the full reading body. The summary is a guide, never a replacement for the body.

The published body is intentionally minimalist: remove all inline hyperlinks, Markdown links, HTML links, images, image galleries, embeds, tracking pixels, advertisements, related-story modules and decorative media from the article text. Keep source names and URLs only in the article's dedicated Sources area. If an image caption contains a material fact, preserve that fact as clean prose only after verifying it independently; never carry the image or its embed into the portal. Reject the article if the generated body still contains URLs, link markup, image markup or embedded media.

7. Update `research/editorial/<section>.json` with the shared cutoff, the exact ordered ten IDs, complete source and corroboration evidence, selection reasons, translation/review status, and for every selected entry:

```json
"contentReview": {
  "bodyComplete": true,
  "aiSummaryReviewed": true
}
```

8. Stage the current edition through `npx tsx scripts/edition.ts YYYY-MM-DD --lead ARTICLE_ID --refresh`, selecting the strongest current Brasil story explicitly. The `--refresh` mode replaces the same-date edition in place so the homepage and all section pages immediately use the latest verified rankings; older dated editions remain preserved. Do not edit page-review scores or shared implementation hashes during a content run.

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

Inspect the preview in both languages: homepage lead, all eight ranked lists, article pages, AI-summary block placement and labels, full body paragraphs, sources, dates, language switch, dark mode, and reading controls. The strict `news:verify` command must pass; never use `--legacy-ok`. If any check fails, do not commit or push.

After the local checks pass, calculate the exact `npm run review` revision and deploy an independent read-only reviewer with `delegate_task`. Give it the repository path, target commit, and required checks; it must not edit files, commit, push, approve, or merge. Stop if it returns anything other than `PASS` or if it reports a content or infrastructure blocker.

Only after the independent reviewer returns `PASS`, record machine approval with `npm run review -- --approve --revision DIGEST --by "github-news independent reviewer" --confirm-reviewed`. Verify the approval revision, the exact content digest, and all selected counts again. Then remain on `main`, commit only intended source/content/manifests/edition/approval changes, and push `main` to `origin`. Never use `automation/daily-news` as the publication branch, force-push, alter page-review scores, or claim deployment before reading back the remote SHA and GitHub Actions result.

A successful search is never permission to submit unverified articles. If no qualified full-text selection exists, fail closed and leave the previously approved edition deployed. A successful push is not proof of publication; verify the Pages workflow and report its run and deployment state.
