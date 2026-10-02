# Website acceptance — 2026-10-02

The complete static site is in this directory, including the actual Windows
installer and Linux archive. It is ready to upload following `README.md`.
Public hosting was not part of this task and has not been published.

## Requirement evidence

| Requirement | Implementation and verified result |
| --- | --- |
| Interactive 3D landing page | Native WebGL meshes/shaders in `scripts/geometry.js`, `gl.js`, and `scene.js`. Browser tests confirm rendered pixels change on rotation, reset, and pointer drag. |
| Mira theme | Bundled Roboto, waveform branding, floating dictation pill, shortcut keycaps, tray/dictation workflow. Desktop and mobile screenshots visually inspected. |
| Dynamic examples | Scripted English and Portuguese message/idea/note examples. Hold/release, keyboard activation, touch, toggle, timer, live preview, insertion, reset, and explicit copy tested. No microphone capture. |
| Feature explanations | Local Whisper / API engine selector, six interface language previews, focus preservation, recording limits, clipboard recovery, setup instructions, and FAQs. Product claims checked against Mira source by independent reviewer. |
| Downloads people can use | Windows and Linux binaries included locally. File sizes and SHA-256 match `downloads/release.json`. Browser downloaded the real Windows installer and verified its hash. Linux link responds with the complete archive size. No private GitHub links used as public downloads. |
| Six website languages | Top dropdown translates the full page, metadata, accessible labels, and live demo messages. All 180 catalog entries are present in every language. Browser locale detection and saved choice work; switching preserves edited text and recording state. |
| Scroll to top | Minimal 44 px square up-arrow appears after scrolling 320 px. All six accessible labels, three viewport widths, keyboard activation and focus transfer to the header, mouse activation, smooth scrolling, and reduced motion passed browser checks. |
| Deployment-ready folder | Zero runtime dependencies, external requests, or API keys. All 39 links/assets resolve. Root and `/mira/` subdirectory serving both pass. README documents hosting, MIME types, large-file requirements, and restoring ignored binaries from a fresh checkout. |

## Checks completed

- **38/38 browser acceptance checks passed** in headless Microsoft Edge using
  Playwright and software WebGL on Windows.
- Responsive layouts at **320, 390, 768, and 1440 pixels** have no horizontal
  overflow in all six site languages. Keyboard FAQ controls, reduced motion, manual pause, offscreen
  animation suspension, touch input, and WebGL-disabled fallback passed.
- Automated axe-core WCAG A/AA checks found **zero violations** at desktop and
  mobile widths. JavaScript-disabled pages retain information and downloads.
- Clipboard writes require an explicit click. Rejected writes select the text
  for manual copying. Delayed results cannot override Reset or a newer recording.
- No application page errors, failed resources, external HTTP requests, or
  microphone use during acceptance. Fonts and all translation catalogs are local.
- Structural gates passed: all source files below **600 lines** (largest 469),
  cyclomatic complexity at most **10**, at most **5 parameters** per function,
  and control-flow nesting at most **3**.
- Independent review verified **100 geometry invariant cases**, downloads and
  deployment, then replayed **8 boundary checks**. Its three findings—Enter
  repeat in toggle mode, repeating assistive-technology activation, and stale
  asynchronous clipboard status—were fixed and independently rechecked. No
  remaining blocking findings in the reviewed scope.
- The subsequent localization review passed eight independent locale/storage
  boundary checks, preserved active recording and user text during switching,
  and confirmed Spanish/French/German mobile layouts and preview language tags.
- Clean installation of pinned test dependencies succeeded; npm reported no
  known dependency vulnerabilities at the time of installation.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run verify
npm run quality
npm test
```

To use installed Edge instead, set `BROWSER_EXECUTABLE` to its executable path.
The test suite starts/stops its own localhost servers. Machine-generated results
and screenshots are saved under `tests/artifacts/` (ignored by Git). The preview
server is started separately using `npm run dev`.

Safari, Firefox, manual screen-reader acceptance, and GPU performance on physical
mobile devices have not been verified. Public-host headers and download behavior
must be checked on the eventual deployment. No new STT accuracy or native Mira
compatibility claims are implied by these website tests.
