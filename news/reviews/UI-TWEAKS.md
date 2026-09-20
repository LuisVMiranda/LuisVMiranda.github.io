# Compact section and metadata review

Primary review: 20 September 2026. This extends `VALIDATION.md` for the
requested presentation changes; existing article content remains unchanged.

## Scope

- Scroll-to-top is square and measures 43.2 by 43.2 pixels, 10% smaller than
  the previous 48-pixel control. The arrow, accessible labels, keyboard focus
  and reduced-motion behavior are preserved.
- Story dates have a divider, one rem of separation, and a localized
  Published / Publicado label. Dates retain their semantic `time` values.
- All eight section names and edition dates appear beside the brand in the
  masthead. The redundant hero, introductory copy and selection subtitle are
  removed. Mobile controls occupy a separate row to avoid cramped text.
- Ranked story order, section colors, shortfalls, archive links, bilingual
  routes, static output and the existing portfolio are preserved.

## Ownership and independent scoring

Both refinement owners used GPT-5.6 Luna at maximum reasoning. The primary
reviewer inspected their diffs and rendered output and ran independent checks.

| Owner                         | Function | Design | Access/languages | Modularity | Tests | Total |
| ----------------------------- | -------: | -----: | ---------------: | ---------: | ----: | ----: |
| `/root/date_button_luna`      |        2 |    1.9 |              1.9 |        1.8 |   1.8 |   9.4 |
| `/root/compact_sections_luna` |        2 |    1.8 |              1.9 |        1.8 |   1.8 |   9.3 |

The initial section integration scored 8.3: mobile language text wrapped,
the date was too small, the content gap was excessive, and a navigation
function exceeded complexity 10. The same owner corrected these defects.
No failing submission was approved. All affected page approvals were renewed
against the final source hashes, with their earlier owner history retained.

## Validation evidence

- Clean Linux installation and the full quality gate passed: strict types,
  formatting, ESLint constraints, fewer than 600 physical lines per authored
  file, dependency-cycle checks, 31 unit tests and production build.
- Playwright: 65 passed across Chromium, Firefox and WebKit. Four duplicate
  crawl/layout cases are intentionally skipped outside Chromium.
- Every generated URL was crawled: 196 HTML pages, with only 152 bilingual
  article pages indexed by Pagefind. Private project sources remain excluded.
- All eight sections in both languages passed masthead, date, story order and
  overflow checks at 320, 768 and 1440 pixels. The complete responsive matrix
  also covered both themes, large article text and the zoom scenario.
- Axe found no serious or critical violations in the tested pages, including
  the new compact section masthead in both themes and languages. Keyboard
  skip links, language switching, mobile navigation and scroll controls pass.
- The primary reviewer inspected each section design and homepage date cards,
  plus desktop, tablet and mobile section renders. Generated screenshots and
  detailed browser reports remain in ignored validation artifact directories.
- No dependencies, content, approval records or deployment infrastructure
  were changed. The approved content revision is still
  `426008592b16e0af326b04ae3b407c5241bdcc0718795bd0aa86027dd65f8aaf`.

## Performance

Lighthouse default mobile simulated throttling against the production static
artifact in the official Playwright 1.63.0 Linux image:

| Page                   | Score |    LCP |    CLS | TBT |
| ---------------------- | ----: | -----: | -----: | --: |
| Homepage               |    96 | 2.266s | 0.0173 | 0ms |
| English Brasil section |    98 | 1.965s | 0.0017 | 0ms |
| Search                 |    97 | 2.115s | 0.0020 | 0ms |
| Representative article |    97 | 1.968s | 0.0663 | 0ms |

Authored JavaScript totals 3,449 gzip bytes, including the lazy search entry
and excluding generated Pagefind libraries. All release budgets passed.
