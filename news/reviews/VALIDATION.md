# HTML, Tailwind and JavaScript rebuild validation

Primary review performed on 20 September 2026. This review supersedes the
Astro implementation review; its history remains available in Git.

## Scope and content integrity

The frontend now consists of plain HTML rendered by JavaScript modules,
locally compiled Tailwind CSS and vanilla browser JavaScript. Astro source,
configuration and dependencies have been removed. Strict TypeScript and
JSDoc checking remain for the content, research and build modules.

GitHub Pages remains the only deployment target. The combined artifact
preserves the portfolio at `/` and places the portal at `/news/`, including
real bilingual `index.html` files. No runtime application server is required.
The existing 76 bilingual articles, eight ranked selections and editorial
approval were not edited. Approved content revision:

`426008592b16e0af326b04ae3b407c5241bdcc0718795bd0aa86027dd65f8aaf`

## Primary validation evidence

- Full `npm run quality` passed: strict TypeScript/checkJs, formatting,
  ESLint complexity <=10, depth <=3, parameters <=5, 599-line file limit,
  dependency-cycle and inline-script checks, 31 unit tests and production build.
- The build generated 196 static HTML pages. Pagefind indexed only the 152
  article pages across PT-BR and English. Sources, reviews and research are private.
- The final Playwright run passed 56 tests in Chromium, Firefox and WebKit.
  Four duplicate crawl/layout cases were intentionally skipped in Firefox/WebKit;
  both complete checks ran in Chromium. The official Playwright 1.63.0 Linux
  container ran with external networking disabled.
- Every generated URL was crawled for a single main heading, canonical metadata,
  working internal links and assets. `/news/` and `/news/index.html`, plus both
  English equivalents, return identical built homepages. Portfolio HTML matches
  the original repository file byte for byte.
- Both languages and themes were captured at 320, 768 and 1440 CSS pixels, with
  24px article text. Enlarged text and a 200% zoom-equivalent viewport passed.
  The primary reviewer inspected the homepage, all eight section designs,
  article, archive, search, editorial policy and error-page renders.
- Axe scans found no serious or critical violations in either theme on
  representative bilingual pages and the actual GitHub Pages fallback.
- Reader journeys verify locale-preserving links, Pagefind filtering and URL
  history, empty/unavailable search, theme persistence, unavailable storage,
  font limits, mobile navigation, keyboard order and reading without JavaScript.
- The long politics headline occupies two desktop lines in PT-BR and English.
  Its header measures 1080px and the body 800px at a 1440px viewport.
- The new native headline link opens its matching article by keyboard in both
  languages. The SVG arrow-only button appears after scrolling, returns to the
  top and focuses main content; reduced-motion and accessible labels pass.
- Unit tests protect out-of-order search responses, content approval invalidation,
  duplicate identities/ranks, research deduplication and date windows, source
  outages, simultaneous output protection and obsolete deployment rejection.
- Four build/package failure tests prove that failed builds preserve preceding
  output, competing operations respect the output lock, and failed CI output
  leaves the previous packaged-artifact pointer intact.

## Page ownership and scoring

Every owner used GPT-5.6 Luna at maximum reasoning. At most three owners worked
concurrently. The primary agent independently inspected source changes, rendered
pages and test results. Scores use five equally weighted categories: functionality,
design, accessibility/languages, modularity/concurrency, and tests/integrity.
All final scores require passing mandatory checks and no critical defects.

| Owner                             | Final score |
| --------------------------------- | ----------: |
| Homepage                          |         9.4 |
| Brasil                            |         9.3 |
| Mundo                             |         9.3 |
| Política                          |         9.3 |
| Economia                          |         9.3 |
| Tecnologia                        |         9.3 |
| Ciência                           |         9.3 |
| Cultura                           |         9.3 |
| Esportes                          |         9.3 |
| Article template                  |         9.4 |
| Search                            |         9.3 |
| Archive and edition               |         9.2 |
| Editorial policy                  |         9.3 |
| Error pages                       |         9.2 |
| Shared shell and reading controls |         9.3 |
| Static build and packaging        |         9.4 |

Failed submissions returned to the same owner:

- Homepage: 8.6; reduced oversized/constrained lead typography and localized the
  edition date. The same owner subsequently added the requested headline link.
- Article: 8.5; reduced the source heading and excessive gap above reading text.
- Editorial policy: 8.7; removed the artificial 11ch desktop heading constraint.
- Static build: 8.7; fixed the reproduced package-pointer failure and passed its
  new regression test. Earlier integration feedback also corrected staging,
  font selection, catalog paths and build/package serialization.

`pages.json` records owner identities, category scores, attempts and source hashes.
Its aggregate source revision binds the approval to the reviewed implementation;
shared-source changes invalidate approval. Original article approval remains separate.

## Performance and release

Lighthouse uses its default mobile simulated-throttling profile against the local
combined static artifact. Raw reports, responsive screenshots and browser traces
remain in ignored `artifacts/` and `playwright-report/`. CI retains validation reports.
Performance values are local lab measurements, not production field measurements.

The production workflow revalidates the implementation and content approvals,
serializes deployment, rejects obsolete commits and preserves a complete artifact
for rollback. The tests establish these specific invariants; they do not prove
that every possible race is mathematically absent.

| Page                      | Score |    LCP |    CLS | TBT |
| ------------------------- | ----: | -----: | -----: | --: |
| /                         |    97 | 2.105s | 0.0464 | 0ms |
| /en/secao/brasil/         |    98 | 1.955s | 0.0120 | 0ms |
| /busca/                   |    97 | 2.106s | 0.0019 | 0ms |
| /artigos/brasil-bets-sus/ |    98 | 1.956s | 0.0204 | 0ms |

All authored JavaScript combined: 3,449 bytes gzipped,
including the lazy search entry point and excluding generated Pagefind libraries.
Every release budget passed.

## Clean Linux installation follow-up

The first deployment attempt for `37eece1` stopped at `npm ci` because its
lockfile omitted bundled Tailwind WASI dependencies. The primary reviewer
returned the build to the same Luna/max owner at 8.8/10. That owner regenerated
the lockfile with npm; package versions and source code were unchanged.

The primary reviewer then independently ran a clean Linux `npm ci` and the full
quality command with Node 24.20.0 and npm 11.19.0, matching GitHub. Installation,
all 31 unit tests, constraints and the production build passed. All 196 HTML
files match the previously reviewed build except their stylesheet fingerprint.
The only CSS difference removes an unused `.inline` utility; authored JavaScript
is unchanged. Pagefind generated files were rebuilt for Linux. The build owner
was rescored 9.4/10 and shared approvals were renewed against the new lockfile.
GitHub repeats the complete browser and performance suite before publication.
