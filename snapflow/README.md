# SnapFlow product landing page

A responsive, bilingual landing page for SnapFlow, with Brazilian Portuguese as the default and a persistent English toggle. Light and dark themes follow the app’s charcoal, vivid green, and blue palette, with editorial typography, coordinated 3D camera artwork, subtle pointer depth, and locally stored campaign photography.

## Run

To view the landing page without a server, double-click `website/index.html`. Keep the full `website` folder together: the HTML needs its CSS, `landing.bundle.js`, and `assets/` directory. You can also open `dist/website/index.html` after building, keeping that output folder intact.

The checked-in `landing.bundle.js` is an ordinary browser script, so direct file opening does not need ES-module loading or Vite’s image importer. It is generated from the source modules by `npm.cmd run build:website`; rerun that command after changing source code. Do not edit the bundle directly. Vite development still uses the original modules for normal live updates.

From the repository root:

```powershell
npm.cmd run dev:website
npm.cmd run build:website
```

The normal development port is 5174 (configurable by the existing environment). Production output is `dist/website/`. During this implementation the review server used `http://127.0.0.1:5184/` to avoid interfering with existing services.

## Pages and modules

- `index.html`: SnapFlow landing page and PT-BR static copy.
- `landing.js`: language preference, menu, native getting-started dialog, and pointer effect.
- `landing.bundle.js`, `build-offline.mjs`: generated direct-file runtime and its reproducible build integration.
- `copy.js`: English static copy plus all bilingual dynamic content.
- `sections.js`: field scenarios, features, FAQs, and workflow cards.
- `demo.js`: independent purchase simulation and package calculation.
- `landing.css`, `landing-responsive.css`: visual system and responsive/reduced-motion rules.
- `landing-theme.css`, `theme.js`: semantic color tokens, accessible color variants, and System/Light/Dark preferences.
- `assets/`: optimized local WebP campaign imagery; generation prompts in `assets/PROMPTS.md`.
- `portfolio.html`: preserved existing Erick Ramon portfolio, with its gallery API integration.
- `sobre.html`: preserved photographer biography, now linking to `portfolio.html`.

The existing Vite website configuration builds all three HTML entry points. Portfolio deep links now use `portfolio.html#portfolio`, `portfolio.html#servicos`, and `portfolio.html#contato`.

## Behavior and product accuracy

The language toggle updates copy, metadata, image descriptions, and accessible names without losing demo selection or payment state. A fresh visit uses PT-BR regardless of browser language; a saved explicit English preference is honored. The existing photographer pages remain in Portuguese, and their English landing-page link is labeled accordingly.

The interactive demo is local only: it never calls the API, creates a payment, or submits customer data. Sample pricing is R$25 per photo, or R$20 each for three photos. Pix simulation unlocks selected samples; cash/card simulation requires a separate photographer approval. Sample downloads are actual local WebP assets. Real ZIP delivery is explained, not falsely simulated. All campaign photography is generated illustrative imagery.

The getting-started CTA opens installation guidance with a link to the actual project README. There is no invented subscription, trial, contact address, or signup backend. Product descriptions follow the repository README and manifesto; no roadmap features are advertised as available.

Images are local and compressed. Google Fonts supplies DM Sans and Manrope, with system font fallbacks if unavailable. No animation framework or additional package dependency was added. Motion respects `prefers-reduced-motion`; menus and modal support keyboard navigation and Escape.

## Verify

```powershell
npx.cmd eslint website
npx.cmd vitest run website
npm.cmd run build:website
```

The landing tests cover translation completeness, package boundaries, empty selection, Pix release, manual approval gating, downloadable samples, and language changes during checkout. Existing portfolio tests continue to target the preserved page.

The standalone tests execute the generated classic script without an ES-module loader or data requests, verify every referenced local image/script/stylesheet, and exercise theme, translation, payment, and sample-download behavior. When a production build exists, the same checks run on its HTML and assets. The photographer portfolio still requires its gallery API for live customer content.

## App palette and themes

Color decisions are grounded in `src/styles/tokens-base.css`, `components-actions.css`, and `payment.css`. The app uses green for primary actions/success, blue for navigation, and neutral charcoal surfaces. The landing keeps those roles:

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#F6F8FA` | `#121212` (app) |
| Cards | `#FFFFFF` | `#1E1E1E` (app) |
| Raised surfaces | `#EDF1F5` | `#2A2A2A` (app) |
| Primary text | `#161B22` | `#FFFFFF` |
| Supporting text | `#535E6D` | `#9CA3AF` (app) |
| Primary action fill | `#00C851` (app) | `#00C851` (app) |
| Text on primary actions | `#07120B` | `#07120B` |
| Green text | `#007B32` | `#00C851` |
| Link text | `#006BC9` | `#4AA3FF` |

The original `#1E90FF` blue remains a brand/focus accent. Text-specific blue and green shades are adjusted where necessary for contrast. The theme tests verify 17 foreground/background pairs per theme at a minimum 4.5:1 ratio, plus the exact app palette. Browser checks also cover rendered text on solid surfaces; photograph overlays and decorative artwork are inspected visually rather than treated as solid-color contrast pairs. This is not a claim of full accessibility certification.

The selector follows the system by default, remembers explicit light/dark choices, responds to system changes in System mode, synchronizes across tabs, and works without localStorage. An early head script applies the preference before CSS paints. Theme controls and options are translated in PT-BR/English; theme changes do not rebuild the demo or reset a purchase selection. The original photographer portfolio retains its existing independent theme behavior.

The dark hero uses `assets/hero-camera-dark.webp`, a coordinated imagegen edit of the existing composition. Both variants are local; CSS shows only the active theme’s image, including for assistive technology. The theme toggle does not dim or invert photographs.
