# Complete GitHub Pages publication

`Publish complete static portal` publishes the current portfolio, `mirastt/` and `snapflow/`
alongside the last successfully published, approved news version. GitHub Pages
replaces the entire site with each artifact; copying files into the repository
alone does not publish them.

The workflow runs after every push to `main`, manually, and after main-branch
news push/manual runs finish (including failures). It selects an actual successful
`publish` job from `news.yml`,
checks out that exact commit separately, rechecks its original implementation and
editorial approvals, and rebuilds it. Pending news edits and their approval files
are never changed or treated as approved. Source selection and deployment share
the news workflow's `github-pages` concurrency group. A stale portal commit is
rejected immediately before deploying.
Every main push queues a replacement, including news-only pushes, so an obsolete
portal build cannot be rejected without scheduling a current one.
Following failed news runs also recovers portal jobs displaced in GitHub's shared
concurrency queue. This never makes a failed news run eligible as approved source.

The existing news workflow still validates pending news changes independently.
Its failures do not block Mira or SnapFlow publication. After a future approved news release,
the follow-up portal workflow restores the complete site; the original news-only
artifact may briefly be visible while that follow-up builds. Removing that
transition would require a separately reviewed change to the news release pipeline.

SnapFlow publishes its standalone `index.html`, `landing.bundle.js`, icon, three
stylesheets and five WebP images under `/snapflow/`, plus the linked photographer
portfolio/about pages and their runtime assets. The explicit list lives in
`package.mjs`; update it when adding runtime assets. Build scripts, source tests,
image prompts and dependencies are excluded. Its relative asset URLs work at this
subdirectory without rewriting or running the SnapFlow development server.

Only Mira's public HTML, assets, styles, scripts and two download metadata files
are packaged. Installers remain on Google Drive. Development dependencies, tests,
test screenshots and local binaries are excluded. `deployment.json` records both
source commits and the approved news run used for the published site.

Run the dependency-free regression tests with:

```sh
node --test scripts/portal/*.test.mjs
node mirastt/tools/verify.mjs
```

When checking a publication, use the **Publish complete static portal** Actions
run and verify `/`, `/news/`, `/mirastt/`, `/snapflow/` and `/deployment.json`. A failed news
review run means pending news needs its own review; it does not mean the complete portal's
separate publication failed.
