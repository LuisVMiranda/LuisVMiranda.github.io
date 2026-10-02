# Mira STT landing page

A complete static site: interactive WebGL dictation pill, hold/release and toggle
workflow simulation, English/Portuguese examples, six-language interface preview,
engine comparison, FAQs, and Windows/Linux downloads hosted on Google Drive. Roboto and all
assets are local. No analytics, cookies, CDN, API keys, or runtime dependencies.
The header dropdown offers English, Brazilian Portuguese, Spanish, French,
Italian, and German across the full page and live demo controls. It starts in the
browser's language and remembers a visitor's selection in localStorage when
available. With storage disabled, switching still works for the current visit.

## Preview

With Node.js 20 or newer, run from this folder:

```sh
npm run dev
```

Open http://127.0.0.1:4173. No dependency installation or build step is needed to
preview or deploy. Serve over HTTP rather than opening `index.html` as a file:
browser ES modules require HTTP. Copy text needs HTTPS or localhost.

## Deploy

1. Run `npm run verify` to validate local links and both package hashes.
2. Upload `index.html`, `favicon.ico`, and the complete `assets/`, `styles/`,
   `scripts/`, and `downloads/` directories to a static host using HTTPS.
3. Use `index.html` as the directory index. No SPA fallback, server application,
   environment variables, or build command is required. Relative links support
   either a domain root or a subdirectory (use a trailing slash).
4. Windows buttons open the Windows Google Drive sharing page; the Linux card
   opens the Linux sharing page. Visitors download the file through Drive.
   Keep both files shared with anyone who has the link. Drive may show its own
   confirmation or download-limit notices.
5. Only release metadata and checksums from `downloads/` need to be deployed.
   Do not commit or upload the application binaries to GitHub Pages.
6. Revalidate both public Drive links after deployment. The static page uses no
   external runtime resources; Drive is contacted only when visitors follow a link.

Do not upload `node_modules/`, `tools/`, `tests/`, or development package files.

Suggested response headers: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and
`Permissions-Policy: microphone=(), camera=(), geolocation=()`.
Cache HTML, scripts, and release files with revalidation because filenames are
stable. Give font/icon files a longer cache lifetime if desired.

## Release files and Git

The site does not require binaries in a fresh checkout. `npm run verify` checks
the Drive URL metadata, checksum list, and page links. It does not download or
hash remote Drive contents. The published hashes describe the validated Mira
release; when replacing a Drive file, update its size/hash metadata too.

To audit optional local binary copies, run `node tools/verify.mjs --local`.
`npm run sync-downloads` remains an optional maintainer utility when matching
build output is available in `../dist/`; it is not a deployment step.

## Acceptance tests

Only development tests need Playwright. Install the version in `package.json`,
then its Chromium browser:

```sh
npm install
npx playwright install chromium
npm test
npm run quality
```

To use an installed Edge/Chrome, set `BROWSER_EXECUTABLE` to its absolute path.
`PLAYWRIGHT_MODULE` may point to an existing Playwright `index.mjs` when testing
with a managed runtime. Tests start and stop their own localhost server, check
desktop/mobile layouts and interaction states, exercise graceful fallbacks, and
write screenshots/results to `tests/artifacts/`. No microphone or provider is used.
The quality command checks source-file length (600 lines), per-function cyclomatic
complexity (10), parameter count (5), and control-flow nesting (3). Automated axe
checks cover WCAG A/AA rules in desktop and mobile layouts; they do not replace
manual screen-reader testing. `AXE_CORE` can point to an existing `axe.min.js`.

## Design and behavior

- Native WebGL geometry and shading, pointer rotation, keyboard controls,
  reduced-motion and user pause support, offscreen animation suspension,
  and a CSS illustration when WebGL is unavailable.
- The demo uses scripted examples. It never captures audio or calls an STT API.
  The demo-only automatic stop is 20 seconds. Mira's actual recording limit is
  independently configurable, including zero for no Mira cutoff.
- Nothing writes to the clipboard without a Copy text click. Blocked clipboard
  access selects the text for manual copying.
- English static content and downloads remain available without JavaScript.
  Full website language switching uses JavaScript. The language card separately
  previews Mira's interface; the EN/PT speech samples remain in their selected
  sample language, and visitor-edited transcript text is never translated.
- Product limitations are explicit: automatic insertion depends on target app
  support; the Windows installer is unsigned; no tested macOS binary is offered.

Roboto's OFL license is included at `assets/OFL.txt`.

Translations are maintained in `scripts/locales/` with identical semantic keys.
Static text and translated attributes bind to their English source; dynamic copy
uses `setText` / `setLabel` from `scripts/i18n.js`. Do not pass user text through
those helpers. Language tests check catalog parity, placeholders, metadata,
dynamic states, persistence, storage refusal, and mobile layouts in all six locales.
