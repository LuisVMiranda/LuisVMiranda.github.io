# Implementation validation

Validated on 20 September 2026 UTC (19 September in São Paulo).
Deployment target: GitHub Pages only, portfolio at `/`, portal at `/news/`.
The initial local validation used drafts. Production release validation and
the editor's subsequent approval are recorded below.

## Evidence

- `npm run quality`: formatting, strict Astro/TypeScript checks, ESLint,
  inline HTML script checks, dependency-cycle detection, file limits,
  23 unit tests, and the production build passed.
- 196 static preview pages generated; all URLs crawled for a single heading,
  canonical metadata, working internal links and static assets.
- 38 browser tests passed. Four duplicate layout/crawl runs were intentionally
  skipped in Firefox/WebKit; those checks ran once in Chromium.
- Critical journeys ran in Chromium, Firefox and WebKit in the official
  `mcr.microsoft.com/playwright:v1.63.0-noble` container, with external networking
  disabled. The existing Windows Firefox executable could not start, so its
  failure was resolved for validation by using the official Linux environment.
- Axe scans: no serious or critical violations on representative bilingual
  pages or the actual GitHub Pages fallback. Accent contrast tests pass for
  all eight sections in both themes.
- Responsive screenshots cover both languages and themes at 320, 768 and
  1440 CSS pixels, including the largest article text size. Text enlargement
  and a 200% zoom-equivalent viewport also pass.
- Primary-agent visual review inspected the homepage, article, archive,
  search, policy, error design and all eight section designs. Keyboard checks
  verified visible skip-link focus and movement into the main reading order.
- The combined artifact's portfolio HTML matches the repository original.
  Research, source code, package files and approval records return 404.
- After the final archive count correction, the full generated-URL crawl was
  repeated successfully. The archive displays 76 unique stories, not 80
  section placements. Date-only source display was also checked in the browser.

## Performance

Lighthouse default mobile simulated throttling, local static Pages artifact.
The tested paths are relative to `/news/`.

| Page           | Score |     LCP |    CLS |  TBT |
| -------------- | ----: | ------: | -----: | ---: |
| Homepage       |    98 | 1.804 s | 0.0026 | 0 ms |
| English Brasil |    98 | 1.804 s | 0.0012 | 0 ms |
| Search         |    98 | 1.804 s | 0.0006 | 0 ms |
| Article        |    98 | 1.803 s | 0.0406 | 0 ms |

All authored JavaScript combined is 2,768 bytes gzipped, excluding the
lazy-loaded Pagefind library/index. Each release budget passed. These are
local lab measurements; production field performance is not yet measured.

Raw evidence remains in ignored `artifacts/` and `playwright-report/`.
The workflow retains validation reports and approved deployment artifacts.

## Page ownership and approval

All 14 page owners used GPT-5.6 Luna with maximum reasoning. The primary
agent returned failing submissions to the same owners. Recorded corrections
include homepage hierarchy and section selection, archive pagination and
unique counts, article typography and search filters, search initialization,
date-only source precision, and 404 script complexity.

`pages.json` records scores, category points, attempts, owners and source
hashes. Final scores range from 9.2 to 9.4. Relevant source changes invalidate
the approvals; the release guard checks every recorded file before publishing.
Git attributes pin portal/workflow text to LF so hashes survive Windows/Linux
checkouts. Design approval does not grant editorial approval of the stories.

## Editorial handoff

The editor explicitly approved the existing edition on 20 September 2026 UTC
(19 September in São Paulo), recorded in `content/approval.json`. It contains
ten selections in each section, comprising 76 distinct bilingual articles and
80 section references. Its approved content revision is:

`426008592b16e0af326b04ae3b407c5241bdcc0718795bd0aa86027dd65f8aaf`

The portal can be inspected with `npm run build:preview`, then
`npm run package:pages` and `npm run preview` at `/news/`.

Publishing requires the reviewed changes in GitHub, Pages configured to use
GitHub Actions, explicit editorial approval, and the protected manual workflow.
No Cloudflare service, hosting credential, or runtime backend is required.

## GitHub Pages homepage correction

The live `/news/` response reproduced the reported README page: HTTP 200,
"Local development" text present, and no `/news/_astro/` assets. The Pages API
confirmed `build_type: legacy` with `main:/` as its source. The successful
portal workflow had validated source only; its manual publish job had not run.
The API setting is now `build_type: workflow`, so the combined static artifact
can supply `/news/index.html` without Jekyll rendering the source README.

Production validation after explicit editorial approval:

- `npm run quality` passed, including all 23 unit tests and 196 static pages.
- The production artifact passed 41 Playwright tests in Chromium, Firefox and
  WebKit. Four duplicate crawl/layout runs were intentionally skipped.
- The new regression check confirms `/news/` and `/news/index.html` have
  identical HTML, a visible headline, the expected locale, and compiled CSS.
  The same check covers `/news/en/` and `/news/en/index.html`.
- The portfolio still matches its original HTML; README, update guide,
  content, review files and source code return 404 from the packaged site.
- All generated routes and internal assets resolved. Bilingual search,
  accessibility, themes, text sizing and the responsive matrix passed.

Primary review revalidated the shared browser-test change against the
production artifact. No page template, layout, stylesheet or story text changed;
the existing page design scores and owners are retained. The manifest records
the reviewed test revision. The manual release still checks exact editorial
approval and rejects obsolete commits before deploying.
