# Notícias

Independent bilingual Editorial Brief portal. The portfolio at the repository
root is unchanged. Run all commands below inside `news/` with Node 24.

## Local development

```powershell
npm ci
npm run dev
npm run build:preview
npm run package:pages
npm run preview
```

Open `http://127.0.0.1:4321/news/`. Preview builds visibly identify unapproved drafts,
block indexing, and omit draft RSS/sitemap entries. Production builds include
content only when its SHA-256 matches the editorial approval record. No
runtime connection to the local search instance is needed by readers.

`npm run dev` builds and packages a fresh preview before starting the local
static server. It does not watch source files; restart it after changes.

PT-BR routes start at `/news/`; English routes start at `/news/en/`. Language switching
preserves story, section and edition identity. Pagefind builds language-specific
indexes. Source Serif 4 and Inter are bundled locally.

The source repository is not itself the deployable site: publish only the
combined artifact produced by `npm run package:pages`.

## Research and publication

Read [the model's news-update guide](news-report.md) for complete-source retrieval,
future full reading versions and AI summaries, design preservation, and publication.
Use [the research template](research/TEMPLATE.md) to retain selection evidence.
The local SearXNG endpoint
defaults to `http://localhost:8080`; `SEARXNG_URL` may select another local port.
`npm run research` writes separate candidate runs; it never approves stories. The
`github-news` automation runs daily at 08:00 GMT-3 using
`automation/daily-news-prompt.md`; it stages reviewable updates on
`automation/daily-news` and never edits approval or publishes unreviewed content.

```powershell
npm run research
npm run news:verify
npm run review
npm run quality
npm run build:preview
npm run package:pages
npm run test:e2e
npm run test:performance
```

`npm run news:verify` is the automation gate. It refuses an edition unless all
sections contain ten ordered references, every selected article has a bilingual
AI summary, rights metadata, and at least three body paragraphs, and every
editorial manifest records source evidence, selection reasoning, a
complete-body review and an AI-summary review. `--legacy-ok` is only a smoke-test escape hatch for the
pre-feature catalog; it must not be used by the daily job or for publication.
The review command documents its required digest and reviewer arguments in
the research template. New edits invalidate approval. Corrected stories retain
their identity, update timestamp, and bilingual correction note.

## Design and architecture

The frontend uses HTML rendered at build time by small JavaScript modules,
compiled Tailwind CSS, and vanilla browser JavaScript. There is no Astro,
hydration framework, Tailwind CDN, or runtime content fetch. Existing strict
TypeScript content and research modules remain build-time validation tools.

`src/render/pages/` owns page markup, `src/render/components/` shares repeated
editorial markup, and `src/styles/` owns the compiled design tokens and
typesetting. `src/client/` contains browser entry points. Escape editorial
values with `escapeHtml` before inserting them into HTML. Generated files are
recreated in `dist/`; do not edit them directly.

Article headers have a wider measure than body text, so long headlines can
use the available desktop space without forcing short lines. The reading
controls still affect only article copy. The SVG arrow button appears after
scrolling, returns keyboard focus to the main content, and respects reduced
motion preferences.
The homepage's main headline is a native link to the matching localized article.

Content validates paired translations and references. Editions validates
rankings and approval digests. Research hides search access behind live and
recorded adapters. Discovery protects asynchronous search ordering. Reading
Preferences isolates storage failures and font/theme validation.

Each page design and each of the eight section pages is owned by a dedicated
GPT-5.6 Luna agent at `max` reasoning. The primary agent verifies each submission
and records a score in `reviews/pages.json`. Scores below 9/10 go back to the
same owner. Failing checks block approval regardless of the numeric score.
Shared-file hashes invalidate all affected reviews after integration changes.

## Quality gates

- All authored text files are at most 599 physical lines.
- Complexity <=10, nesting <=3, function parameters <=5.
- Type checks, formatting, module cycle checks, unit tests and production build.
- Chromium, Firefox and WebKit reader journeys; axe and responsive screenshots.
- Lighthouse default mobile profile: performance >=90, LCP <=2500ms,
  CLS <=0.1, TBT <=200ms. Authored compressed JS <=80KiB.

Generated output, dependencies, lockfiles and private generated research runs
are explicitly excluded from source-size checks. Test reports go to ignored
`artifacts/` and `playwright-report/` directories.

## GitHub Pages operation

GitHub Pages is the only production host. The build produces plain HTML,
locally compiled Tailwind CSS, self-hosted fonts and
JavaScript. Pagefind runs entirely in the reader's browser. Research, validation
and editorial approval happen before the build; there are no runtime functions,
Workers, database connections, API credentials or application servers.

The workflow validates pushes and pull requests. Publication is a manual run
of **GitHub Pages portal**, with the approved content digest. In repository
Settings → Pages, select **GitHub Actions** as the source. The workflow uses
GitHub's built-in token; no hosting secret is needed. Protect the github-pages
environment with reviewers. NEWS_SITE_URL optionally changes the HTTPS origin;
the portal remains under /news/.

Do not select **Deploy from a branch**: that runs Jekyll against the source
repository and can render `news/README.md` as the news homepage. The actual
homepage is generated as `news/dist/index.html` and packaged at
`news/index.html` in the deployment artifact. Both `/news/` and
`/news/index.html` must display this built page; English uses `/news/en/`.
A successful push validation alone does not deploy the site: run the manual
publication workflow with the approved digest and confirm its **publish** job
succeeds. Verify the live homepage, its CSS, and the unchanged portfolio.

A fresh immutable artifact combines the unchanged root index.html and assets/
with the generated news/dist/ at /news/. Private source, research artifacts,
review files and Node dependencies are never packaged. The workflow serializes
publication and rejects an obsolete main revision immediately before deploy.

GitHub Pages has one root 404.html. It includes both languages and selects EN
for missing /news/en/ addresses. Existing language-specific recovery pages also
work directly. GitHub controls HTTP caching; application-defined cache headers
and edge error handlers are not used. Fingerprinted assets remain versioned.

Complete approved artifacts are retained for 30 days. To roll back, revert the
content and code to a known-good revision through Git, revalidate page reviews
and editorial approval, and publish through the same workflow. This keeps the
portfolio and search index in the same complete deployment.

The server in scripts/serve.mjs is only a local test utility. Nothing executes
on a server when a reader visits the published site. The site remains readable
when the local research machine and SearXNG are offline.

When a source provides only a calendar date, `publishedDate` preserves that
date in both languages and structured metadata. Its normalized `publishedAt`
is used for ordering only; the RSS feed omits an unknown publication time.

See [validation evidence](reviews/VALIDATION.md) and the revision-bound
[page review manifest](reviews/pages.json) for the current implementation.
