# Mira STT landing page

A complete static site: interactive WebGL dictation pill, hold/release and toggle
workflow simulation, English/Portuguese examples, six-language interface preview,
engine comparison, FAQs, and verified Windows/Linux downloads. Roboto and all
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
4. Ensure the host permits a **189,208,690-byte individual file** and about
   **281 MB total**. Hosts with smaller limits need the two packages on object
   storage; update all download links and keep `release.json` / checksums accurate.
5. Serve `.js` as `text/javascript`, `.css` as `text/css`, `.ttf` as `font/ttf`,
   `.exe` as `application/octet-stream`, and `.tar.gz` as `application/gzip`.
   Do not apply HTTP `Content-Encoding: gzip` to the archive itself. Enable
   byte-range responses on large downloads if your host supports them.
6. Revalidate the public download links after deployment. The page uses bundled
   downloads because this project's GitHub repository is private.

Do not upload `node_modules/`, `tools/`, `tests/`, or development package files.
The existing local `downloads/` contains the actual installers, ready to upload.
No deployment has been published automatically.

Suggested response headers: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, and
`Permissions-Policy: microphone=(), camera=(), geolocation=()`.
Cache HTML, scripts, and release files with revalidation because filenames are
stable. Give font/icon files a longer cache lifetime if desired.

## Release files and Git

Large application binaries are intentionally ignored by Git. A fresh checkout
must restore them before deployment. With the matching app release in `../dist/`:

```sh
npm run sync-downloads
npm run verify
```

Alternatively place the two release binaries in `downloads/` using their exact
manifest filenames. Verification fails for missing or different files. To ship a
new release, update the page version/size labels, `downloads/release.json`, and
`downloads/checksums.txt` together, then run the full acceptance suite.

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
