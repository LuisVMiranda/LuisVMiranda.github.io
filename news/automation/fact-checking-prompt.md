# Fact-checking subagent protocol

Use this procedure for every selected article before publication.

## Source registry

Brazilian-language and Brazil-specific sources:

- Aos Fatos: https://www.aosfatos.org/
- Agência Lupa: https://www.agencialupa.org/
- Projeto Comprova: https://projetocomprova.com.br/
- TSE Fato ou Boato: https://www.tse.jus.br/comunicacao/noticias/fato-ou-boato

International sources and tools:

- AFP Fact Check: https://factcheck.afp.com/
- Reuters Fact Check: https://www.reuters.com/fact-check/
- Full Fact: https://fullfact.org/
- Google Fact Check Explorer: https://toolbox.google.com/factcheck/explorer
- Optional Google Fact Check Tools API: https://factchecktools.googleapis.com/v1alpha1/claims:search

The source list is also encoded in `src/modules/research/fact-check-sources.ts`.

## Subagent instructions

1. Read the complete selected article evidence and identify its central factual claim, named entities, dates, numbers, images, quotations, and potentially misleading framing.
2. Search the relevant Brazilian sources in Portuguese and the international sources in English or the source's local language. Use exact claims and several meaningful variants, not just the article headline.
3. Open matching fact-check pages. Do not treat a search-result snippet as a finding.
4. Record one result per consulted source:
   - `supports`: the source's evidence supports the article's central claim;
   - `contradicts`: the source says the claim is false or materially conflicts with it;
   - `context`: the claim has a missing qualification or materially different context;
   - `no-match`: no relevant fact-check was found;
   - `inconclusive`: a relevant result exists but does not resolve the claim.
5. A no-match is neutral. It must not raise the score by itself and must not be described as proof of truth.
6. A contradictory finding blocks publication until the discrepancy is resolved, the article is corrected, or the story is excluded.
7. Distinguish a fact-check of the underlying event from a fact-check of a related rumor, image, quote, date, or political framing. A related result is useful context but is not automatically a verdict on the article.
8. Compare fact-check findings with the original source and independent corroboration. Resolve disagreements explicitly.
9. Assign a one-decimal evidence-confidence score from 0.0 to 10.0. This is an editorial confidence estimate, not a calibrated probability and not a guarantee. A score of 8.7 may be displayed as “87% estimated likelihood of being accurate” only with the caveat that it is based on the checked evidence.
10. Scores below 7.0 are not publishable in the automated edition until additional evidence or an editorial correction raises confidence. Do not raise a score merely to meet a quota.
11. Return only structured JSON for the primary agent to apply; do not edit repository files, approve content, commit, push, or deploy.

## Required output

```json
{
  "articleId": "stable-article-id",
  "verification": {
    "score": 8.7,
    "checkedAt": "2026-09-22T12:00:00Z",
    "checks": [
      {
        "provider": "Aos Fatos",
        "url": "https://www.aosfatos.org/",
        "finding": "no-match",
        "note": "No matching indexed claim was found; this result is neutral."
      },
      {
        "provider": "Reuters Fact Check",
        "url": "https://www.reuters.com/fact-check/",
        "finding": "supports",
        "note": "A related fact-check confirms the reported date and named institution."
      }
    ],
    "caveat": "The estimate reflects complete source extraction and cross-source review; it is not a mathematical guarantee."
  }
}
```

A batch document must contain exactly one update for every unique article selected by the edition and no unexpected IDs. The primary agent applies it with:

```text
npm run fact-check:apply -- --edition YYYY-MM-DD --input PATH_TO_AUDIT_JSON
```

After applying updates, run strict verification with:

```text
npm run news:verify -- --require-verification
```
