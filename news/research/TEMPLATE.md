# On-demand editorial research

Run `npm run research` from the application root. Each invocation creates a
unique private run directory, freezes one UTC cutoff displayed in São Paulo
time, and searches all eight sections in Portuguese and English. Nothing is
published by this command. `RESEARCH_FIXTURE` switches to recorded JSON input.

## Selection record for each section

- Section and edition identity; cutoff; retrieval time; PT-BR and EN queries.
- Candidate source URL, source name, headline and claimed publication date.
- Original page opened, verified publication time, evidence and retrieval notes.
- Canonical URL and shared event identity for deduplication.
- Relevance, public impact and source quality: integers 0–3 with rationale.
- Prioritize the preceding 24 hours, then expand to seven days. Reject future,
  undated, inaccessible or unsupported stories. Explain any list below ten.
- Record ordered selections and reasons for exclusion. Ten is a ceiling, not
  permission to fill a shortage with weaker or invented reporting.

## Bilingual draft

Each draft must match the article schema: a stable identity and slug, primary
section, optional secondary sections, original publication/update times,
source names/HTTPS URLs, PT-BR and EN title, summary, and two original concise
context paragraphs. Attribute estimates and allegations. Do not copy source
articles. Keep translations factually equivalent, including dates and numbers.

- Stage each JSON draft under `content/articles`. Record source checks under
  `research/editorial`; neither research folder is copied into the website.
- For every selected story, add `contentReview.bodyComplete: true` and
  `contentReview.aiSummaryReviewed: true` only after checking the full reading
  version and its bilingual AI summary against the retrieved source. New
  article JSON must also declare `rights.mode`; licensed reproductions require
  a permission reference.
  Use one identity for an event shared by multiple sections. Add secondary
  section references rather than publishing a duplicate article.

## Review and publish

1. Open sources, compare both translations, and check every factual claim.
2. Prepare `content/editions.json` with at most ten ranked references per section.
3. Run `npm run build:preview`, inspect both languages and all reading controls.
4. Run `npm run review` to obtain the exact content digest.
5. Only after explicit editorial approval, run `npm run review -- --approve
--revision DIGEST --by "Reviewer" --confirm-reviewed`.
6. Rebuild production. Any content edit changes the digest and invalidates
   approval. Deployment also requires valid primary-agent page reviews.

## Later validation and improvement

Record this evaluation separately from story selection:

| Dimension   | Evidence to retain                                                  |
| ----------- | ------------------------------------------------------------------- |
| Coverage    | Eligible candidates, verified selections and shortfalls per section |
| Freshness   | Counts within 24 hours versus seven-day expansion                   |
| Sources     | Source diversity, unavailable pages and unsupported claims rejected |
| Duplication | Shared URLs/events found and normalized identities                  |
| Translation | Number/date mismatches and terminology corrections                  |
| Reading     | Long headline, mobile, maximum text size and dark-mode screenshots  |
| Discovery   | Representative Portuguese/English queries and expected results      |
| Improvement | Observed defect, proposed change, owner and next validation         |

Research failures never replace the currently deployed edition. Repeat runs
remain isolated, and approval applies to the exact reviewed content only.
