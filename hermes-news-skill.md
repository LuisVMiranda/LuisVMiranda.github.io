# Hermes News Skill

Portable operating specification for rebuilding and operating the `github-news` bilingual static-news pipeline with another Hermes Agent instance or endpoint.

Last verified against this repository: September 21, 2026.

Current repository:

- Git remote: `https://github.com/LuisVMiranda/LuisVMiranda.github.io.git`
- Repository root on the current machine: `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io`
- Application root: `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io\news`
- Production host: GitHub Pages at `https://luisvmiranda.github.io/`
- News site path: `https://luisvmiranda.github.io/news/`
- Publication branch: `main`
- Node requirement: Node 24 or newer
- Local search backend: native SearXNG at `http://localhost:8080`
- Current deployed CSS/content layout commit: `a462fb3507c45748112d41951d1a7d9b6b564847`

This document is a portable skill/runbook. It is deliberately self-contained so another Hermes can reconstruct the workflow, safety gates, scheduler jobs, content contract, testing process, publication process, and retention cycle without relying on conversation history.

To install it as an actual Hermes skill, copy this file to a skill directory as `SKILL.md`, for example:

```text
$HERMES_HOME/skills/hermes-news-skill/SKILL.md
```

The endpoint must still adapt paths, scheduler syntax, repository URLs, and available tools to its local environment. Never copy credentials, tokens, API keys, cookies, or connection strings into this file.

---

## 1. Mission

Operate a fully autonomous, source-grounded, bilingual editorial news portal.

The daily worker must perform the complete cycle without asking the user for confirmation:

1. Determine the current date and time.
2. Research current stories across all fixed desks.
3. Retrieve and read complete accessible source material.
4. Verify publication dates, canonical URLs, claims, and source quality.
5. Corroborate consequential or disputed claims.
6. Select exactly ten qualified stories per desk.
7. Write rights-safe original reporting in Brazilian Portuguese and English.
8. Add complete reading versions and concise AI-summary bullet lists.
9. Stage or refresh the edition and explicit lead story.
10. Run strict content, schema, review, build, browser, and performance gates.
11. Obtain an independent read-only review of the exact worktree.
12. Record machine approval for the exact content revision.
13. Commit and push directly to `main` when that is the configured product contract.
14. Verify the remote SHA, GitHub Actions, GitHub Pages deployment, and live routes.
15. Leave a dated failure artifact and preserve the last approved deployment if any safety gate fails.

There is no manual editorial approval step in the intended operating model. The independent read-only reviewer plus exact machine approval record is the automated review boundary.

The repository is a static site. Research, extraction, validation, editorial approval, and build happen before deployment. Readers do not need the local SearXNG service, a database, an API server, runtime functions, or application credentials.

---

## 2. Non-negotiable rules

These rules override convenience, speed, and partial success:

- Never ask the user a question during the unattended publication or retention cycle.
- Never invent facts, URLs, publication dates, source content, evidence, review results, test results, deployment results, or scheduler results.
- Never treat search snippets, RSS excerpts, social posts, aggregators, or an AI-generated summary as complete evidence.
- Never claim that a full source was retained when the run artifact contains only snippets, summaries, or a URL.
- Never republish a third-party article verbatim without a real license or explicit permission.
- Use `original-report` prose by default. Use `licensed-reproduction` only with a real permission reference and license.
- Keep full source extraction private as evidence. Do not copy private research or source bodies into the deployment artifact.
- Keep source URLs only in the dedicated Sources area. Article paragraphs must contain no inline URLs, Markdown links, HTML links, images, galleries, embeds, advertisements, tracking pixels, or related-story modules.
- Never pad a desk with rumors, duplicates, incomplete pages, weak candidates, or invented material.
- For the automated portal, every fixed desk must have exactly ten qualified references before publication. A shortfall is a fail-closed condition, not permission to publish fewer stories.
- Never use `--legacy-ok` as the daily publication gate. It is only a smoke-test escape hatch for an older pre-feature catalog.
- Never reuse approval after content, edition, editorial-manifest, renderer, stylesheet, schema, workflow, or review-bound input changes.
- Never edit page-review scores or hashes merely to silence a failed checker. Refresh them only after the affected source was actually reviewed.
- Never force-push, rewrite history, or discard unknown user changes.
- Never commit secrets or read credential files unnecessarily. Keep credentials outside the repository.
- Never claim a scheduler returned `ok` means the edition was published. Read back the actual run output, git state, CI, deployment, and live site.
- Never claim a successful local command proves remote publication. Verify the external system after every external write.
- If evidence is incomplete, sources conflict at the required verification level, the worktree contains unknown changes, or a gate fails, preserve the last approved edition and fail closed.

---

## 3. Fixed editorial structure

The portal has eight fixed desks:

1. `brasil`
2. `mundo`
3. `politica`
4. `economia`
5. `tecnologia`
6. `ciencia`
7. `cultura`
8. `esportes`

The automated edition contract is exactly ten references in each desk: 80 references total. Cross-section reuse is permitted when the same event legitimately belongs to more than one desk, but the article identity must remain stable and deduplicated. Secondary section references are preferred over creating duplicate articles.

The user's broader digest interests prioritize:

1. Technology and artificial intelligence.
2. Relevant Brazilian technology, business, consumer, and public-policy developments.
3. Perfumery, ingredients, houses, launches, regulation, sustainability, and industry analysis.
4. Watches, movements, brands, auctions, collaborations, collecting, and industry events.
5. Adjacent stories only when they have a clear connection to those interests.

For the portal, the eight fixed desks and exact ten-per-desk contract take precedence over the smaller ten-item digest format. For a standalone `news-report` digest, produce exactly ten balanced items, one intentional emoji per title, Brazilian Portuguese summaries, source names, publication dates when available, clickable URLs, and a Sources section generated from the citation ledger.

---

## 4. Repository architecture and important paths

Run all application commands from `news/`.

Core paths:

```text
news/
  content/articles/*.json       Article records
  content/editions.json         Ordered editions and section references
  content/approval.json         Machine approval for exact content revision
  research/editorial/*.json     Selection, evidence, corroboration, review manifests
  research/runs/                Private ignored research/extraction artifacts
  artifacts/                    Ignored validation, failure, cleanup, and performance reports
  reviews/pages.json            Page-owner reviews and source-bound hashes
  reviews/VALIDATION.md         Validation evidence and current quality record
  src/modules/content/schema.ts Zod content and edition schemas
  src/modules/content/types.ts  Static TypeScript types
  src/render/pages/             Build-time page markup
  src/render/components/        Shared editorial markup
  src/styles/                   CSS and design tokens
  src/client/                   Browser-side controls and interactions
  scripts/research.ts           Candidate research run
  scripts/extract-article.ts    Single-page Playwright extraction fallback
  scripts/extract-research.ts   Batch extraction of candidate inventory
  scripts/corroborate-research.ts
  scripts/edition.ts            New edition staging and same-date refresh
  scripts/check-news.ts         Strict content and editorial-manifest gate
  scripts/review.ts             Content digest and machine approval
  scripts/check-reviews.ts      Page/source review-hash gate
  scripts/release-check.ts      Release approval gate
  scripts/deployment-check.ts   Obsolete-build/deployment gate
  scripts/build.ts              Preview and production builds
  scripts/package-pages.ts      Immutable GitHub Pages artifact packaging
  scripts/cleanup-news.ts       Three-day retention cleanup
  automation/daily-news-prompt.md
  automation/retention-prompt.md
  news-report.md                Editorial and rights policy
  README.md                     Project operation and quality gates
  package.json                  Commands and versions
  .github/workflows/news.yml    GitHub Actions validation and Pages deployment
```

The combined deployment artifact contains the unchanged portfolio root plus generated news output under `/news/`. It must not contain `content/`, `research/`, `reviews/`, credentials, Node dependencies, or private run artifacts.

Do not edit generated HTML, Pagefind output, `dist/`, or packaged Pages output directly. Edit source content and code, then rebuild.

---

## 5. Prerequisites for another Hermes endpoint

The next Hermes must have:

- `terminal` for dates, git, Node commands, builds, tests, and remote verification.
- `file` or equivalent read/write/patch tools for repository files.
- Direct `web` retrieval tools for search and extraction when available.
- `browser` tools for public-page inspection and the extraction fallback.
- `delegation` for an independent read-only content or visual reviewer.
- `cronjob` tools for listing, creating, updating, and reading scheduled jobs.
- GitHub CLI (`gh`) authenticated for the intended repository.
- Node 24+, npm, and the repository lockfile.
- Playwright browser dependencies for extraction and end-to-end tests.
- A native SearXNG endpoint, or an approved alternative research adapter.

Before doing anything:

1. Load the Hermes, news-report, editorial-news-automation, and GitHub skills if they exist.
2. Read this file, `news/README.md`, `news/news-report.md`, `news/research/TEMPLATE.md`, the schema, the daily prompt, the retention prompt, and the workflow.
3. Read current git status and branch.
4. List existing cron jobs. Update a matching job rather than creating a duplicate.
5. Verify `gh auth status` before relying on GitHub state.
6. Never assume the current date from memory. Run `date -u` or the platform equivalent.

Portability substitutions:

| Current value | Portable replacement |
|---|---|
| `C:\Users\Admin\Documents\GitHub\LuisVMiranda.github.io` | Repository root on the target endpoint |
| `news/` | Application root relative to repository root |
| `America/Sao_Paulo` | Requested local timezone, preserving the user's wall-clock intent |
| `http://localhost:8080` | Native SearXNG URL on the target endpoint |
| `https://luisvmiranda.github.io` | Configured GitHub Pages origin |
| `main` | Configured publication branch |
| `d97e426e8877` | The target endpoint's publication job ID |
| `140c898933b9` | The target endpoint's retention job ID |

Do not copy current job IDs to another endpoint without recreating and verifying the jobs there.

---

## 6. Research and evidence pipeline

### 6.1 Freeze one cutoff

Run `date` first. Run `npm run research` once per edition. One invocation creates an isolated private run directory and a shared UTC cutoff displayed in São Paulo time. All eight desk selections must use the same cutoff.

Do not run independent research commands that silently create different cutoffs for different desks.

### 6.2 Preflight SearXNG

When using local SearXNG:

1. Probe the exact native route used by the adapter: `/search?q=...&format=json`.
2. Validate that the response is JSON with usable result records.
3. Do not mistake `/health`, the root page, an HTML result, an MCP bridge, a 403, or a 404 for native JSON compatibility.
4. If HTML works but JSON returns 403, inspect the mounted SearXNG `settings.yml` and enable both `html` and `json` under `search.formats`, restart the container, and retest.
5. Do not change the bind address when the listener is already exposed.
6. The native SearXNG endpoint in the current environment is port 8080. Port 8090 is an MCP bridge, not the native search API.

Use `SEARXNG_URL` for a run-specific endpoint when needed. Keep local service configuration outside the repository unless the project explicitly versions it.

### 6.3 Build the candidate inventory

After research:

```text
npx tsx scripts/extract-research.ts --run RUN_DIR --max-per-section 40 --concurrency 8
npm run research:corroborate -- --run RUN_DIR
```

Read:

```text
research/runs/RUN_DIR/extractions/index.json
research/runs/RUN_DIR/corroboration/index.json
```

The corroboration output is a lexical lead list, not proof. Confirm matching facts and discrepancies by reading both complete source bodies.

For every selected source, require:

- HTTP success.
- `complete: true`.
- At least three meaningful extracted paragraphs before drafting.
- No extraction warnings.
- A canonical HTTPS URL.
- A verified publication date or a defensible date explanation.
- Retrieval timestamp.
- Source name and original publisher identity.
- Evidence notes and source limitations.
- Selection reason or exclusion reason.
- Corroboration evidence when required.

If a source is blocked, use this recovery ladder:

1. Direct web extraction.
2. Public browser retrieval.
3. Repository Playwright fallback:

```text
npx tsx scripts/extract-article.ts --url SOURCE_URL --output EVIDENCE.json
```

4. A reputable accessible alternative or primary source.
5. Exclude the candidate if complete evidence cannot be obtained.

Never bypass access controls. If only snippets, summaries, or a URL are available, mark the evidence incomplete and do not select it.

### 6.4 Date and relevance rules

- Prioritize the preceding 24 hours.
- Expand to a maximum seven-day window only when necessary and explain why.
- Reject future, undated, inaccessible, duplicate, rumor-only, or out-of-scope stories.
- Deduplicate canonical URLs and shared events.
- Prefer primary records plus independent reputable reporting.
- Press releases and company statements are claims from the issuing organization, not independent confirmation.
- Do not rank by clickbait, headline intensity, or search position.
- If a desk has fewer than ten qualified stories after focused searches and appropriate extraction, fail closed. Do not publish a shortfall in the daily portal edition.

### 6.5 Claim verification

Use this decision rule:

| Claim type | Required basis |
|---|---|
| Consequential, disputed, manipulation-prone, medical, safety, allegation, or market-moving | At least one independent reputable corroborating source; use two independent sources when especially disputed or easy to manipulate |
| Official primary result or routine institutional result | Primary record plus precise scope/uncertainty note; add independent reporting when it materially affects people or markets |
| Low-risk service, culture, schedule, observation, or routine result | One complete reputable source plus a concrete explanation of why the bounded claim has low downside |
| Missing, conflicting, incomplete, or rights-unclear evidence | Exclude the story or preserve the last approved edition |

Record:

- Matching facts.
- Discrepancies.
- Which source supports each material claim.
- Why the evidence is sufficient.
- Why independent corroboration was unnecessary when using a low-risk exception.

Never relabel an allegation or material claim as low-risk merely to clear the gate.

---

## 7. Article content contract

Every selected article must contain:

- Stable lowercase-hyphenated `id` and `slug`.
- Primary section and optional secondary sections.
- `publishedAt` and `updatedAt` with timezone offsets.
- Optional `publishedDate` when only a calendar date is known.
- At least one HTTPS source in `sources`.
- Paired `pt-BR` and `en` translations.
- A short `summary` for cards, metadata, RSS, and discovery.
- A complete original-report body.
- Rights metadata for new automated articles.
- A bilingual AI summary when used.

Rights format:

```json
{
  "rights": {
    "mode": "original-report"
  }
}
```

Licensed reproduction requires:

```json
{
  "rights": {
    "mode": "licensed-reproduction",
    "license": "REAL LICENSE NAME",
    "permissionRef": "REAL PERMISSION REFERENCE"
  }
}
```

Never fabricate permission references.

### 7.1 Bilingual reading version

For the current rich-reading contract:

- Each locale needs at least five substantive paragraphs when the verified source material supports that detail.
- Add at least two meaningful paragraphs beyond the initial event account.
- Use chronology, overlooked facts, named actors, numbers, consequences, caveats, context, practical implications, and next steps only when supported by evidence.
- Do not pad a short source and do not invent detail.
- Keep PT-BR and English factually equivalent, especially dates, names, numbers, qualifications, and uncertainty.
- Include correction notes when appropriate.
- Preserve source names and URLs only in the dedicated Sources section.

The repository schema still permits two paragraphs for backward compatibility, but the strict automated publication gate requires the current rich edition to provide at least five substantive paragraphs per locale.

### 7.2 AI summaries

The current contract is:

```json
{
  "aiSummary": [
    "Short factual point about what happened.",
    "Important consequence, number, or context.",
    "Qualification, uncertainty, or next step when supported."
  ]
}
```

Rules:

- One to five bullets per locale.
- Short factual sentences, not a replacement paragraph.
- Number of bullets should reflect relevance and the amount of verified body material.
- PT-BR and English must both include the field or both omit it.
- New content should use arrays.
- Archived string summaries remain valid and must continue rendering correctly.
- The renderer shows the labeled compact block immediately below article metadata and before the full body.

### 7.3 Fact-check sources and article confidence score

Every new automated article must receive a fact-check review from subagents
before publication. The configured Brazilian sources are:

- Aos Fatos: `https://www.aosfatos.org/`
- Agência Lupa: `https://www.agencialupa.org/`
- Projeto Comprova: `https://projetocomprova.com.br/`
- TSE Fato ou Boato: `https://www.tse.jus.br/comunicacao/noticias/fato-ou-boato`

The configured international sources and tools are:

- AFP Fact Check: `https://factcheck.afp.com/`
- Reuters Fact Check: `https://www.reuters.com/fact-check/`
- Full Fact: `https://fullfact.org/`
- Google Fact Check Explorer: `https://toolbox.google.com/factcheck/explorer`
- Optional Google Fact Check Tools API: `https://factchecktools.googleapis.com/v1alpha1/claims:search`

The authoritative source registry is
`news/src/modules/research/fact-check-sources.ts`; the subagent procedure is
`news/automation/fact-checking-prompt.md`.

Fact-checking subagents must search exact claim variants, open matching pages,
compare verdicts with the complete source article and independent corroboration,
and record one of `supports`, `contradicts`, `context`, `no-match`, or
`inconclusive` for each consulted source. A no-match is neutral, not proof of
truth. A contradictory finding blocks publication until resolved.

Each selected article stores an optional-backward-compatible `verification`
object with:

```json
{
  "score": 8.7,
  "checkedAt": "2026-09-22T12:00:00Z",
  "checks": [
    {
      "provider": "Aos Fatos",
      "url": "https://www.aosfatos.org/",
      "finding": "no-match",
      "note": "No matching indexed claim was found; this result is neutral."
    }
  ],
  "caveat": "Editorial estimate based on checked evidence; not a mathematical guarantee."
}
```

Scores use one decimal place from 0.0 to 10.0. New automated publication
requires at least 7.0 and no unresolved `contradicts` finding. The public
article displays the score in the AI-summary box as an estimated percentage,
for example `8.7/10 — 87% estimated likelihood of being accurate`, followed by
an explicit caveat that the figure is an editorial evidence-confidence estimate,
not a calibrated probability or guarantee.

Use the machine handoff command after combining subagent results:

```text
npm run fact-check:apply -- --edition YYYY-MM-DD --input FACT_CHECK_AUDIT.json
npm run news:verify -- --require-verification
```

### 7.4 Clean article body

Reject generated body paragraphs containing:

- `http://` or `https://` URLs.
- Markdown link syntax.
- HTML anchors.
- Image or figure markup.
- Galleries.
- Video, audio, iframe, embed, or tracking markup.
- Advertising or sponsored modules.
- Related-story blocks.
- Decorative media copied from a source.

If an image caption contains an important fact, verify it independently and preserve only the fact as clean prose.

---

## 8. Editorial manifests and edition staging

Each `research/editorial/<section>.json` must record:

- Shared cutoff.
- Exact ordered ten IDs.
- Complete source evidence.
- Corroboration evidence or a concrete low-risk/primary-source basis.
- Selection reasons.
- Exclusion reasons where relevant.
- Translation/review status.
- `contentReview.bodyComplete: true`.
- `contentReview.aiSummaryReviewed: true`.

Stage a new date or refresh the same date with an explicit lead:

```text
npx tsx scripts/edition.ts YYYY-MM-DD --lead ARTICLE_ID --refresh
```

Use `--refresh` only for a newer, fully reviewed current-date edition. It replaces the same-date edition in place, invalidates approval, and updates homepage and section ordering while preserving older dated editions.

Do not infer the lead from catalog order. Pass it explicitly, selecting the strongest current Brasil story unless the product specifies another rule.

After staging, verify:

- Every desk has exactly ten IDs.
- All desks share one cutoff.
- The lead exists in the catalog.
- Every ID resolves to an article.
- Shared stories are deterministic and not duplicated as separate article identities.
- Older dated editions remain intact except when the retention job is intentionally removing them.

---

## 9. Existing-content expansion workflow

The September 21, 2026 migration established the reusable pattern for enriching an existing edition without creating new articles:

1. Freeze the exact current edition ID.
2. Enumerate its selected article IDs and deduplicate shared IDs.
3. Generate expansion records in independent batches by desk.
4. Normalize direct and wrapped batch formats.
5. Reject unexpected IDs and conflicting duplicate updates.
6. Apply updates only to existing selected article files.
7. Refuse to create new article IDs.
8. Require at least five substantive paragraphs in both locales after migration.
9. Require one to five AI-summary bullets in both locales.
10. Run the full strict gate and all builds/tests.
11. Recompute the content digest.
12. Obtain fresh independent review and machine approval.

The repository command is:

```text
npm run expand:edition -- --edition YYYY-MM-DD --input PATH_TO_COMBINED_EXPANSION_JSON
```

The migration must report:

- Selected references.
- Unique selected article count.
- Updated article count.
- Newly created article count, which must be zero for this migration mode.
- Paragraph counts by locale.
- AI-summary bullet counts by locale.
- Rejected or unexpected IDs.

The September 21 implementation updated 77 unique existing articles, created no new articles, produced at least five paragraphs per updated locale, and produced two-to-three bullets per locale.

---

## 10. Article template and layout contract

Article pages use build-time rendering with a wider header measure and a narrower reading measure. The article body is designed for focused reading with responsive typography, local Source Serif 4 and Inter fonts, keyboard-accessible controls, dark mode, language switching, and enlarged-text support.

The latest compact article-header values in `news/src/styles/article.css` are:

```css
.article-header {
  padding-block: clamp(0.125rem, 0.45vw, 0.5rem)
    clamp(0.5rem, 0.9vw, 0.75rem);
}

.article-title {
  font-size: clamp(2.5rem, 4.4vw, 3.25rem);
  margin: 0 0 0.625rem;
}

.article-summary {
  font-size: clamp(1.05rem, 1.8vw, 1.3rem);
  margin: 0 0 clamp(0.875rem, 2vw, 1.375rem);
}

.article-content {
  margin-block: clamp(0.75rem, 1.5vw, 1.125rem) 0;
}
```

The article title and lead font sizes were intentionally reduced to limit vertical height while preserving hierarchy. The margin below the navbar was reduced further to remove negative space without crowding the eyebrow. Do not make the header so compact that focus indicators, the language/theme controls, or the eyebrow-to-title transition become unclear.

Any template or CSS change requires:

- Rebuild the preview.
- Inspect PT-BR and English.
- Inspect light and dark themes.
- Inspect 320, 375, 768, and 1440px widths.
- Check 24px text-size overflow.
- Check line wrapping and hierarchy.
- Check keyboard focus indicators and skip links.
- Check language/theme/font controls.
- Check contrast and Axe output.
- Check no horizontal overflow.
- Run `npx tsx scripts/check-reviews.ts`.
- Refresh only the affected source hashes in `reviews/pages.json` after real review evidence.
- Obtain an independent read-only visual/accessibility PASS before publishing.

---

## 11. Validation and quality gates

Run commands from `news/`.

Basic setup:

```text
npm ci
```

Research/content gates:

```text
npm run research
npm run news:verify
npm run review
npx tsx scripts/check-reviews.ts
npx tsx scripts/release-check.ts
```

Code and formatting gates:

```text
npm run check
npm run lint
npm run format:check
npm test -- --run
```

Build and artifact gates:

```text
npm run build:preview
npm run package:pages
npm run test:e2e
npm run test:performance
```

The full intended local pre-publication sequence is:

```text
npm run news:verify
npm run check
npm run lint
npm run format:check
npm test -- --run
npm run build:preview
npm run package:pages
npm run test:e2e
npm run test:performance
npx tsx scripts/check-reviews.ts
npm run review
npx tsx scripts/release-check.ts
```

Quality constraints:

- Authored text files must remain below the repository's configured line limit.
- Complexity <= 10.
- Nesting <= 3.
- Function parameters <= 5.
- Type checks pass for application and scripts.
- Formatting and cycle checks pass.
- Unit tests pass.
- Chromium, Firefox, and WebKit browser journeys pass.
- Axe and responsive layout checks pass.
- Lighthouse target: mobile performance >= 90, LCP <= 2500ms, CLS <= 0.1, TBT <= 200ms.
- Authored compressed JavaScript <= 80 KiB.
- Static package contains no private source/research/review data or runtime search dependency.

Strict `news:verify` must report zero blocking issues. The gate validates section counts, article structure, paragraph requirements, bullet summaries, rights metadata, HTTPS sources, editorial-manifest order/cutoff, evidence, selection reasons, review flags, dates, duplicates, and lead validity.

---

## 12. Review and approval protocol

### 12.1 Content review

Run:

```text
npm run review
```

Record the exact 64-character `revision` emitted by the command. The revision is computed from content and editions, not from a vague description of the worktree.

Deploy an independent read-only reviewer in a separate Hermes context. Provide:

- Repository path.
- Exact target revision.
- Current edition and cutoff.
- Required section/article counts.
- Required checks and their actual results.
- Source/evidence and rights requirements.
- Any relevant visual scope.

The reviewer must not:

- Edit files.
- Generate content.
- Approve content.
- Commit.
- Push.
- Merge.
- Deploy.

The reviewer must inspect the exact current worktree and return `PASS` or `FAIL` with concrete blockers. On `FAIL`, fix only evidence-backed issues, rerun all affected gates, recompute the revision, and obtain a fresh reviewer result.

### 12.2 Machine approval

Only after an independent reviewer returns `PASS`:

```text
npm run review -- --approve \
  --revision EXACT_64_CHAR_REVISION \
  --by "github-news independent reviewer" \
  --confirm-reviewed
```

For retention-only content cleanup, use a distinct reviewer identity such as:

```text
npm run review -- --approve \
  --revision EXACT_64_CHAR_REVISION \
  --by "github-news retention worker" \
  --confirm-reviewed
```

Never edit `content/approval.json` by hand. Approval must be generated by the script for the exact current revision.

After approval, rerun:

```text
npm run review
npx tsx scripts/release-check.ts
```

The approval record must match the exact content revision. Any article, edition, manifest, or publication-bound input change invalidates prior approval.

### 12.3 Page reviews and hashes

`reviews/pages.json` binds page-owner review evidence and source hashes. A renderer, CSS, schema, workflow, documentation, or test change can invalidate the relevant review entries.

When a hash fails:

1. Read the changed source.
2. Rebuild the affected page.
3. Run the affected browser/visual/accessibility review.
4. Update only the hash supported by current evidence.
5. Rerun `npx tsx scripts/check-reviews.ts`.

Do not change numeric review scores just to make the checker pass.

---

## 13. GitHub Pages workflow

`.github/workflows/news.yml` runs on pull requests, pushes to `main`, and authorized manual dispatch.

Validation job requirements:

- Working directory `news/`.
- Node 24.
- `npm ci`.
- Legacy smoke gate followed by strict rich-article gate on `main` and daily automation.
- Page-review check.
- Quality suite.
- Browser installation.
- Preview build.
- Pages packaging.
- End-to-end tests.
- Performance tests.
- Artifact upload for test/performance evidence.

Publish job requirements:

- Push or approved manual dispatch on `main`.
- Serialized `github-pages` concurrency.
- `npx tsx scripts/release-check.ts`.
- Production build.
- `npm run package:pages`.
- Pages artifact upload.
- 30-day complete artifact retention for rollback review.
- `npx tsx scripts/deployment-check.ts`.
- GitHub Pages deployment.

The workflow must resolve approval consistently. If an environment input such as `APPROVED_REVISION` is empty, release and deployment checks must fall back to the checked-in `content/approval.json`; otherwise validation can pass while publishing rejects the same revision.

Never choose GitHub Pages "Deploy from a branch" for this project. Use GitHub Actions. Branch deployment can run Jekyll against the repository and render `news/README.md` as the homepage instead of the generated artifact.

---

## 14. Publication procedure

Before editing:

```text
git status --short --branch
git fetch origin
git log -3 --oneline --decorate
gh auth status
```

If the branch is behind or diverged, align safely before starting. If the worktree has unknown changes, stop and preserve them. Automation-owned partial output may be recovered only when it is clearly limited to known automation paths; unknown paths must not be discarded.

After all gates and reviewer approval:

```text
git add news
git commit -m "feat(news): publish verified edition"
git push origin main
git status --short --branch
git rev-parse HEAD
git ls-remote origin refs/heads/main
```

Then verify GitHub Actions:

```text
gh run list --commit COMMIT_SHA --limit 10 \
  --json databaseId,name,status,conclusion,headSha,url

gh run watch RUN_ID --exit-status
```

Read GitHub Pages state:

```text
gh api repos/OWNER/REPO/pages --jq '{status,html_url}'
```

Verify live routes with HTTP requests. At minimum check:

- `/news/`
- `/news/en/`
- Portuguese section routes.
- English section routes.
- A representative Portuguese article.
- A representative English article.
- Portfolio root remains unchanged.

A successful local build, successful git push, scheduler `ok`, or workflow dispatch is not enough by itself. Report the exact reviewer verdict, digest, commit, remote SHA, workflow run, deployment state, and live-route result.

---

## 15. Daily publication scheduler

Current job:

- Name: `github-news`
- Current job ID: `d97e426e8877`
- Schedule: `45 7 * * *`
- Timezone: `America/Sao_Paulo` / GMT-3
- Workdir: repository `news/` directory
- Intended publication branch: `main`
- Editorial target: 08:00 local time
- The 05:00 start leaves a three-hour buffer before the target because source retrieval, fact-checking, independent review, testing, deployment, and Telegram delivery are not a four-minute operation.
- Current delivery target: `telegram`; the final response is sent only after live publication verification.

Before creating or updating a job:

1. List existing jobs.
2. Match by purpose, workdir, and schedule.
3. Update the matching job instead of creating a duplicate.
4. Keep the scheduler prompt synchronized with `automation/daily-news-prompt.md`.
5. Read the job back and confirm name, ID, schedule, enabled state, next run, timezone, workdir, delivery, attached toolsets, and prompt preview.

The publication job must have access to terminal, file, skills, web, browser, and delegation tools. Attached skills do not guarantee that direct web/browser/delegation tools are available, so expose them explicitly in the scheduler configuration when the scheduler supports toolsets.

The prompt must state:

- Fully unattended behavior.
- Exact repository workdir.
- Current date/cutoff handling.
- Eight desks and exactly ten stories per desk.
- Complete source extraction and fallback ladder.
- Corroboration rules.
- Rights-safe original reporting.
- Five substantive paragraphs per locale for current rich editions.
- One-to-five bilingual AI-summary bullets.
- Same-date `--refresh` behavior.
- Strict checks and independent review.
- Exact machine approval.
- Direct `main` publication.
- Remote/CI/Pages verification.
- Fail-closed behavior.
- No credentials or unknown-file deletion.
- One concise Telegram completion/failure summary after the final live-site decision.

Never launch a second run while the same job has a running entry. A concurrent run can race on content, approval, and shared publication state.

A scheduler delivery of `local` is history-only in CLI sessions. For this job,
use the gateway-connected `telegram` target. Send exactly one concise success
summary after Pages and live routes verify, including edition date, eight-desk
and 80-reference counts, unique article count, verification-score range, lead,
commit SHA, deployment status, and live-route status. On fail-closed runs, send
one concise notice that the previous approved edition remains live and name the
blocking gate; never imply that new news was published.

---

## 16. Retention scheduler and self-cleaning cycle

Current job:

- Name: `github-news-retention`
- Current job ID: `140c898933b9`
- Schedule: `30 8 * * *`
- Timezone: `America/Sao_Paulo` / GMT-3
- Workdir: `news/`
- It runs after the 05:00 publication job.
- Retention window: three 24-hour days.

The current retention job must remain separate from publication. Publication creates and verifies the newest edition first; retention runs afterward.

Dry-run:

```text
npm run news:cleanup -- --days 3
```

Apply:

```text
npm run news:cleanup -- --days 3 --apply
```

The cleanup script:

1. Reads and validates `content/editions.json`.
2. Computes `now - 3*24h` as the cutoff.
3. Retains editions newer than the cutoff and always retains the newest edition.
4. Computes every article ID referenced by retained editions.
5. Deletes only article JSON files older than the cutoff that are not referenced by retained editions.
6. Protects old articles still referenced by retained editions.
7. Prunes old paths under the explicitly approved local directories:
   - `research/runs/`
   - `artifacts/`
8. Preserves `.gitkeep` files.
9. Writes `artifacts/news-cleanup.json` on apply.
10. Prints removed editions, removed article IDs, protected old IDs, local paths, cutoff, and mode.

The cleanup must never delete:

- Credentials.
- `.env` files.
- Unknown files.
- Current manifests.
- `content/approval.json` merely because it is old.
- Article files still referenced by a retained edition.
- Files outside approved retention directories.

Before applying deletion:

1. Check git status.
2. Run the dry-run.
3. Inspect the planned removed/protected paths.
4. Abort if unknown changes are present.
5. Apply only the approved plan.
6. Run `npm run news:verify` and the full relevant validation suite.
7. Recompute review/approval if tracked content changed.
8. Obtain fresh review if the publication-bound content changed.
9. Commit only intended cleanup changes.
10. Push `main` and verify remote, CI, Pages, and live routes.

The cleanup is conservative by design. An old article can remain temporarily if an active retained edition references it. The next daily refresh must replace stale references with fresh stories before those protected articles can be deleted.

Do not treat timestamp age alone as permission to delete every old article. Cross-section reuse and delayed edition cutoffs can otherwise create broken routes.

---

## 17. Recovery and failure handling

### Dirty worktree

- If unrelated files are dirty, do not edit, reset, commit, or delete them.
- If only known automation-owned paths are dirty from an interrupted run, validate them and resume when safe.
- Preserve unknown paths and report the blocker.

### Stale approval

Expected behavior: any content or edition update invalidates approval.

Recovery:

1. Run `npm run review`.
2. Read the exact current revision.
3. Obtain a fresh independent read-only PASS.
4. Run the approval command with the exact revision.
5. Rerun `npm run review` and `npx tsx scripts/release-check.ts`.

### Page-review hash failure

- Identify changed files.
- Rebuild and visually review the affected page.
- Update only source hashes backed by actual review.
- Rerun `npx tsx scripts/check-reviews.ts`.

### SearXNG failure

- Probe the exact JSON search route.
- Confirm native response shape.
- Check whether port 8090 is an MCP bridge rather than native SearXNG.
- Inspect mounted output formats if JSON is denied.
- Use direct web retrieval, browser, or Playwright fallback.
- Do not publish from snippets alone.

### Browser extraction failure

- Try browser on a public source.
- Try `scripts/extract-article.ts`.
- Use an accessible primary or reputable alternative.
- Exclude the source if complete body evidence cannot be established.

### Reviewer failure

- Do not approve or publish.
- Fix only concrete evidence-backed blockers.
- Re-run affected checks.
- Recompute revision.
- Dispatch a fresh reviewer for the exact worktree.

### Push race or ref-lock failure

- Read `git ls-remote origin refs/heads/main` first.
- Another writer may already have applied the commit.
- Do not force-push or blindly retry.
- Compare remote SHA, local SHA, and commit history.

### Cron owner wedge

A cron run can be marked wedged or stale by Hermes. Do not infer publication from a wedge or stale-owner message. Inspect the run transcript/output, git state, remote SHA, CI, and Pages state. Start another run only after confirming no active writer remains.

### CI approval mismatch

If validation passes but publish rejects approval:

- Inspect `APPROVED_REVISION` handling.
- Ensure empty environment input falls back to checked-in `content/approval.json`.
- Ensure release and deployment resolve the same revision.
- Fix the gate, rerun validation, and publish again only after the exact revision is approved.

### Retention failure

- Preserve the existing approved edition.
- Do not delete unknown paths.
- Restore or re-run from the dry-run plan only after the cause is understood.
- Re-run strict verification and route checks before any push.

---

## 18. Current implementation facts

As of the current verified state:

- September 21, 2026 edition has 80 references: 10 per desk.
- It contains 77 unique article identities because some stories are intentionally reused across sections.
- Existing selected articles were expanded rather than replaced.
- The rich migration updated 77 existing articles and created no new article IDs.
- Updated locales have at least five substantive paragraphs.
- Updated AI summaries use two-to-three bullets, within the one-to-five limit.
- Legacy string summaries remain backward-compatible.
- Source URLs are restricted to the dedicated Sources section.
- Schema, renderer, prompt, tests, migration script, README, review manifest, CSS, and retention worker are implemented.
- The latest compact header values are recorded in Section 10.
- Independent visual/accessibility reviews passed in both locales, both themes, and 320/375/768/1440px layouts, including enlarged text and keyboard focus.
- The latest layout commit is `a462fb3507c45748112d41951d1a7d9b6b564847`.
- The GitHub Actions Pages workflow passed for that commit and GitHub Pages reported `built`.
- Current GitHub warnings about actions targeting deprecated Node.js 20 are non-blocking but should be revisited before the platform deadline.

Do not treat these values as universal for a different endpoint. Recompute current edition IDs, counts, cutoffs, approval revisions, commit SHAs, job IDs, and live URLs on the target endpoint.

---

## 19. Completion checklist

Before saying the task is complete, verify every applicable item:

### Research

- [ ] Current date/time read from the machine.
- [ ] One shared cutoff frozen.
- [ ] Native search route and response shape preflighted.
- [ ] Eight desks covered.
- [ ] At least ten complete qualified sources per desk.
- [ ] Complete extraction evidence exists for each selected source.
- [ ] Corroboration exists for consequential/disputed claims.
- [ ] Canonical URLs and publication dates verified.
- [ ] No duplicates, rumors, future dates, inaccessible pages, or rights-unclear sources selected.

### Content

- [ ] Exactly ten references in each desk.
- [ ] Explicit lead article.
- [ ] PT-BR and English title, synopsis, and body.
- [ ] At least five substantive paragraphs per locale for the current rich edition.
- [ ] One-to-five factual AI-summary bullets per locale.
- [ ] Rights metadata present and honest.
- [ ] No inline URLs, links, media, ads, embeds, or related-story modules.
- [ ] Source URLs appear only in Sources.
- [ ] Editorial manifests match order and cutoff.
- [ ] Body and AI summary review flags are true.

### Code and design

- [ ] Schema/types/renderer/tests/docs/prompt are aligned.
- [ ] Legacy string summaries still render.
- [ ] CSS and template changes visually reviewed.
- [ ] Mobile, tablet, desktop, dark mode, both locales, enlarged text, focus, and overflow checked.
- [ ] Page-review hashes match actual source.

### Validation

- [ ] `npm run news:verify` passes without `--legacy-ok`.
- [ ] `npm run check` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run format:check` passes.
- [ ] Unit tests pass.
- [ ] Preview build passes.
- [ ] Pages packaging passes.
- [ ] Browser tests pass.
- [ ] Performance checks pass.
- [ ] `check-reviews.ts` passes.
- [ ] `release-check.ts` passes.
- [ ] Independent read-only reviewer returns PASS.
- [ ] Machine approval matches exact revision.

### Publication

- [ ] Only intended files staged.
- [ ] Commit created on intended branch.
- [ ] Remote SHA matches local commit.
- [ ] GitHub Actions validation passes.
- [ ] GitHub Pages publish passes.
- [ ] Live homepage, language routes, section routes, and representative articles return HTTP 200.
- [ ] Portfolio root remains unchanged.

### Scheduling and retention

- [ ] Existing publication job listed and updated rather than duplicated.
- [ ] Publication prompt matches repository daily prompt.
- [ ] Publication job schedule and next run read back.
- [ ] Retention job exists separately after publication.
- [ ] Retention dry-run inspected.
- [ ] Three-day cutoff applied.
- [ ] Active references protected.
- [ ] Only approved directories pruned.
- [ ] Cleanup changes validated, reviewed, approved, committed, pushed, and deployed when tracked content changes.

---

## 20. Rebuild prompt for another Hermes

Use this as the initial instruction after copying the file into the target repository:

```text
You are the autonomous maintainer of the bilingual static news portal described in hermes-news-skill.md. Read that file completely before acting. Work from the repository's news application root. Do not ask the user questions during the run.

First inspect the repository README, editorial guide, schema, research template, daily prompt, retention prompt, package scripts, workflow, git status, current branch, remote state, and existing Hermes cron jobs. Adapt paths, timezone, remote URL, scheduler IDs, and local search endpoint to this environment without changing the operating contract.

The publication contract is source-grounded bilingual original reporting, exactly ten qualified references per each of the eight desks, at least five substantive paragraphs per current rich article locale, one-to-five bilingual AI-summary bullets, clean article bodies with source URLs only in Sources, complete evidence, corroboration for consequential claims, explicit rights metadata, independent read-only review, exact machine approval, direct publication to the configured branch, and post-push verification of remote SHA, CI, Pages, and live routes.

The retention contract is a separate daily job after publication. Keep a rolling three 24-hour-day window, protect all references still used by retained editions, delete only old unreferenced article files and explicitly approved local run/build artifacts, run a dry-run before apply, and fail closed on unknown files or validation errors.

Use tools to inspect and modify the repository. Continue until the requested task is actually verified. Never fabricate output, skip a required gate, reuse stale approval, force-push, or claim publication from a local result alone.
```

---

## 21. Final operating principle

The system is successful only when it is both autonomous and conservative:

- Autonomous means it researches, writes, reviews, approves, publishes, cleans, and verifies without waiting for a person.
- Conservative means it refuses incomplete evidence, rights ambiguity, stale approvals, unknown-file risk, broken references, failed tests, failed review, failed deployment, and unverified external state.

When those principles conflict with speed, preserve the last approved edition and fail closed.
