# github-news daily automation (120-minute fail-closed target)

Run from the news application path injected as this job's `workdir`. The recurring schedule remains 05:00 America/Sao_Paulo (GMT-3), with the 08:00 editorial target. Publish directly to `main` only after every strict gate and the exact-revision independent PASS below.

Goal: produce exactly ten verified stories for each of `brasil`, `mundo`, `politica`, `economia`, `tecnologia`, `ciencia`, `cultura`, and `esportes`; retain exactly 80 ordered section references, deduplicating shared events into stable article IDs; then publish the verified edition. Preserve the existing bilingual site design, article schema, source rights, cutoff discipline, and fail-closed behavior.

## Subagent model and reasoning

The `github-news` job is pinned to `gpt-6-luna` via `openai-codex`; the profile's `delegation.model` and `delegation.provider` are also `gpt-6-luna` and `openai-codex`. The job reasoning pin must be `xhigh`. Use that inherited model and effort for every drafting, fact-check, and independent-review child. Do not override them, fall back to another model, or invent unsupported per-task model fields. If scheduler/profile readback differs, fail closed before delegating. Do not change global delegation settings from this prompt.

## Runtime budget — 120-minute fail-closed target

At start, use `date -u +%s` to record the epoch and write the run start/cutoff to the run record. Check elapsed time at every phase boundary. T+120 minutes is a prompt-enforced stop target, not an OS-level kill switch for an LLM-driven cron run. Stop at the first phase boundary at or after T+120, fail closed, and do not claim a hard termination or sub-two-hour completion unless measured. Bound each subprocess with its own timeout. Phase budgets:

- T+00–05: preflight and source-tool check.
- T+05–15: one frozen research run and candidate ranking.
- T+15–35: source-body extraction and bounded shortfall searches.
- T+35–65: desk-parallel selection, original bilingual articles, summaries, and manifests.
- T+65–80: one desk-batched fact-check pass and apply.
- T+80–95: strict gate, formatting/tests, preview/package, and review digest.
- T+95–105: independent read-only review of the exact digest and approval.
- T+105–120: commit/push, GitHub Actions/Pages, and live-route readback.

Do not extend a phase by repeating a failed command or browsing the same source again. Allow at most one retry for an infrastructure/tool failure, then change retrieval path once or fail closed. For a content or test defect, allow one scoped repair and one full relevant rerun. If a phase deadline is missed, or exact gates cannot finish by T+105, write a concise failure artifact and do not approve, commit, or push. Never claim the two-hour target if elapsed time exceeds it. Include measured total and per-stage durations in the final report.

## 1. Preflight and frozen research

Read current UTC time, `git status --short --branch`, repository instructions, `README.md`, `news-report.md`, `research/TEMPLATE.md`, the schema, and existing editorial/edition state. Before researching, inspect this date's run records. Reuse one same-date run no older than six hours only when its frozen cutoff and research, extraction, and corroboration indexes parse and agree; resume from its earliest incomplete stage and never repeat a completed stage. Otherwise create one new frozen run. Fetch `origin` and confirm the branch is synchronized. Abort without editing if an unrelated worktree change exists, if another github-news owner process is still alive, or if the target cannot be identified. Preserve all existing user/draft files; do not reset or clean them.

When no valid resumable same-date run exists, run `npm run research` exactly once to establish one immutable UTC cutoff for all eight desks. Treat search results as candidate leads only. Rank for the preceding 24 hours, expanding to seven days only when needed; reject future, undated, duplicate, inaccessible, unsupported, or rights-unclear items.

## 2. Bounded source collection

Run once:

`npx tsx scripts/extract-research.ts --run RUN_DIR --max-per-section 16 --concurrency 12`

This caps the first pass at 128 candidate pages instead of crawling up to 320. Accept a source only with successful HTTP status, `complete: true`, at least three substantive paragraphs, and no warnings. Read the saved complete body; snippets and the lexical `research:corroborate` output are never evidence. Run `npm run research:corroborate -- --run RUN_DIR` once as a deduplication/corroboration lead list, not as a truth verdict.

If a desk has fewer than ten qualified sources, do at most one focused search batch and extract no more than 16 supplemental candidates for each short desk. Keep the total ceiling at 32 attempted source bodies per desk. Do not re-fetch a complete accepted source. For a failed URL, make one alternate retrieval attempt using the approved recovery ladder; never bypass access controls or loop on the same route. If any desk remains short, record exact eligible/rejected counts and fail closed without changing the published edition.

For selected stories, use the saved complete extraction as the source of truth. Directly retrieve only independent corroboration needed for consequential, disputed, medical, safety, market-moving, or allegation claims; use two independent sources when the dispute warrants it. Routine, low-risk service/culture/scheduled/result facts may use one complete reputable source with a concrete bounded-risk rationale. Attribute official, company, police, court, and coalition claims. Preserve conflicting figures and source time-stages; do not infer a reconciled fact.

## 3. Parallel drafting and summaries

Select the strongest ten distinct stories per desk, deduplicate event identities before delegation, and record the exact 80-reference order. Dispatch one bounded drafting task per desk in parallel; each task owns only its desk manifest and article IDs whose `primarySection` it owns. Shared IDs have one deterministic owner and one article file. Do not ask agents to edit the edition, approval, scripts, page-review hashes, or another desk's files. Each worker writes within its assigned scope and returns only a compact JSON handoff with desk, ordered IDs, changed paths, hashes, source counts, validation results, and blockers. Do not paste full article prose or source bodies into the parent transcript; the parent reads back the exact files and verifies the hashes.

Each selected article must include paired PT-BR/EN title, synopsis, five or more substantive original-report paragraphs when evidence supports that length, clean body text, HTTPS sources, publication time at source-displayed precision, rights metadata, and one-to-five factual AI-summary bullets per locale. Draft the summaries with the article from the retained full source and verified facts—do not run a separate summary rewrite pass. Do not copy source prose, invent context, embed URLs/media, or pad short reporting. Preserve selected order/cutoff and record complete extraction metadata, selection reasons, source/corroboration facts, translation parity, and review flags in the desk manifest. Never fabricate cutoff provenance from a later capture.

## 4. Single fact-check pass

After drafting, dispatch one read-only fact-check batch per primary desk (eight batches total, not one worker per article). Each batch checks all unique articles in that desk against claim-relevant entries in `src/modules/research/fact-check-sources.ts` and the retained primary/corroborating sources. Open relevant fact-check pages; snippets alone are not findings. Record exactly one score (0.0–10.0, one decimal), UTC timestamp, consulted provider/HTTPS URL, finding (`supports`, `contradicts`, `context`, `no-match`, `inconclusive`), concise note, and caveat per article. A no-match is neutral. Scores are editorial evidence confidence, not calibrated probability. Resolve contradictions or exclude the story; score below 7.0 blocks publication. Do not run a second article-by-article fact-check round after the batch.

Write each desk audit to a file and return only its path, SHA-256, exact audited IDs, and blockers. Merge audit output programmatically: exact unique selected-ID coverage, no duplicates/unexpected IDs, valid schema/URLs/findings/scores, and no unresolved blocker. Apply once with `npm run fact-check:apply -- --edition YYYY-MM-DD --input AUDIT.json`; then compile/refresh the same-date edition with the explicit lead. Article summary and score render in the existing bilingual block with a non-guarantee caveat; do not change shared presentation or page review scores during a content run.

## 5. Strict verification and bounded quality checks

Run `npm run news:verify -- --require-verification`; it must pass with zero blocking issues. Never use `--legacy-ok`. Then run independent, read-only local checks and inspect results:

- `npm run lint`
- `npm run format:check`
- `npm run check`
- `npm run test`
- `npm run build:preview`
- `npm run package:pages`
- `npm run test:e2e`
- `npm run test:performance`
- `npx tsx scripts/check-reviews.ts`

Run independent lint/type/unit/format commands concurrently where safe; build and package in order; run browser/performance checks against the fresh packaged preview, not an unrelated existing server. Do not reuse stale E2E servers. Inspect homepage/lead, all eight ordered lists, representative PT-BR and English articles, score/caveat, dates, sources, and language switching. Do not update page-review hashes without real visual review. If a check fails, make one narrowly scoped evidence-backed repair and rerun all affected gates; otherwise fail closed.

## 6. Independent review, approval, and release

Run `npm run review` and capture the exact digest after all publication-bound content, manifests, and edition data are final. Dispatch one independent read-only reviewer—not additional review fan-out—to inspect the exact digest, 80 references, unique IDs, all article translations/summaries/scores, evidence/provenance, strict test output, and built routes. The reviewer may not edit, apply scores, approve, stage, commit, push, or deploy. It must return PASS for this exact revision by T+105; otherwise leave the prior approved edition live and save the blocker report.

Only after PASS, record machine approval with the exact digest and traceable reviewer identity using the repository's documented approval command. Recheck strict verification and digest. Commit only intended, verified news content/manifests/edition/approval and authorized automation files; never include unrelated drafts or OCI files. Push `main` without force-push. Read back the exact remote SHA, matching GitHub Actions validation and Pages publish conclusions, and PT-BR/EN live routes with expected localized content. If the 120-minute limit is reached before remote deployment/live-route verification, report publication as incomplete rather than claiming success.

## Test-only invocation

When invoked with an explicit test-only override, run in a dedicated isolated worktree. Verify that any pre-existing dirty paths exactly match the allowlist and hashes supplied with the test override; treat only those paths as the test fixture and do not edit, stage, reset, or commit them. Stop if any other initial change exists. Keep all selected-story edits, manifests, audit artifacts, and outputs inside the isolated worktree. Exercise research, drafting, fact-check, strict/local quality, build/package, and independent review, but do not write machine approval, commit, push, or deploy. Report elapsed time and blockers. The launcher is responsible for restoring any temporary cron workdir after the test; do not edit scheduler state.

## Completion message

Report the exact edition date, cutoff, eight-desk/reference/unique-story counts, confidence-score range, explicit lead, total and stage timings, commit/remote SHA and CI/Pages/live-route results when published, or precise fail-closed blockers. Distinguish local test completion from external publication. The Telegram delivery is the final response; send exactly one concise message after all applicable checks complete. Never include credentials or long process logs.
