import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

type ExtractedArticle = {
  requestedUrl: string;
  finalUrl: string;
  status: number | null;
  title: string;
  canonicalUrl: string;
  publishedAt: string | null;
  author: string | null;
  extractionSelector: string;
  paragraphs: string[];
  bodyText: string;
  wordCount: number;
  complete: boolean;
  warnings: string[];
  retrievedAt: string;
};

type BrowserExtraction = Pick<
  ExtractedArticle,
  | 'title'
  | 'canonicalUrl'
  | 'publishedAt'
  | 'author'
  | 'extractionSelector'
  | 'paragraphs'
  | 'bodyText'
  | 'warnings'
>;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function validateUrl(value: string): URL {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('The article URL must use HTTP or HTTPS');
  return url;
}

const requestedUrl = argument('--url');
const outputPath = argument('--output');
if (!requestedUrl) {
  throw new Error(
    'Usage: npx tsx scripts/extract-article.ts --url ARTICLE_URL [--output EVIDENCE.json]',
  );
}

const url = validateUrl(requestedUrl);
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const response = await page.goto(url.href, {
    timeout: 45_000,
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(1_000);

  for (let index = 0; index < 8; index += 1) {
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(350);
  }

  const extractionScript = String.raw`(() => {
    const removeSelectors = [
      "script", "style", "noscript", "template", "svg", "canvas",
      "iframe", "video", "audio", "form", "nav", "header", "footer",
      "aside", "[role=\"navigation\"]", "[role=\"complementary\"]",
      "[aria-label*=\"advert\" i]", "[aria-label*=\"share\" i]",
      "[class*=\"advert\" i]", "[class*=\"banner\" i]",
      "[class*=\"newsletter\" i]", "[class*=\"related\" i]",
      "[class*=\"recommend\" i]", "[class*=\"comment\" i]",
      "[id*=\"advert\" i]", "[id*=\"related\" i]",
      "[id*=\"comment\" i]"
    ];
    const selectors = [
      "[itemprop=\"articleBody\"]", "article", "[class*=\"article-body\" i]",
      "[class*=\"article-content\" i]", "[class*=\"story-body\" i]",
      "[class*=\"entry-content\" i]", "main"
    ];
    const normalized = (value) => value.replace(/\\s+/g, " ").trim();
    const paragraphsFrom = (root) => {
      const clone = root.cloneNode(true);
      clone.querySelectorAll(removeSelectors.join(",")).forEach((node) => node.remove());
      clone.querySelectorAll("img, picture, source, track, input, button").forEach((node) => node.remove());
      clone.querySelectorAll("a").forEach((anchor) => {
        anchor.replaceWith(document.createTextNode(anchor.textContent || ""));
      });
      clone.querySelectorAll("br").forEach((breakNode) => {
        breakNode.replaceWith(document.createTextNode("\\n"));
      });
      const blocks = Array.from(clone.querySelectorAll("p, h2, h3, h4, li, blockquote, td, th"))
        .map((node) => normalized(node.textContent || ""))
        .filter((text) => text.length >= 25);
      const fallback = normalized(clone.textContent || "")
        .split(/\\n+/)
        .map(normalized)
        .filter((text) => text.length >= 25);
      const values = blocks.length >= 2 ? blocks : fallback;
      return values.filter((value, index) => values.indexOf(value) === index);
    };
    const candidates = selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)).map((element) => ({
        selector,
        paragraphs: paragraphsFrom(element)
      })))
      .filter((candidate) => candidate.paragraphs.length >= 2)
      .sort((left, right) => right.paragraphs.join(" ").length - left.paragraphs.join(" ").length);
    const best = candidates[0];
    const paragraphs = best ? best.paragraphs : [];
    const bodyText = paragraphs.join("\\n\\n");
    const bodyLower = bodyText.toLowerCase();
    const warnings = [];
    if (!best) warnings.push("No article container with multiple paragraphs found");
    if (paragraphs.length < 3) warnings.push("Fewer than three body paragraphs extracted");
    if (/subscribe|sign in to read|log in to continue|paywall/.test(bodyLower))
      warnings.push("The page may be access-limited or paywalled");
    if (/read more|continue reading|keep reading/.test(bodyLower))
      warnings.push("The extracted body contains a continuation marker");
    const metadata = (selector) => document.querySelector(selector)?.content?.trim() || null;
    const time = document.querySelector("time[datetime]")?.getAttribute("datetime");
    return {
      title: metadata("meta[property=\"og:title\"]") || document.title,
      canonicalUrl: document.querySelector("link[rel=\"canonical\"]")?.href || location.href,
      publishedAt: metadata("meta[property=\"article:published_time\"]") || metadata("meta[name=\"date\"]") || time || null,
      author: metadata("meta[name=\"author\"]") || metadata("meta[property=\"article:author\"]") || null,
      extractionSelector: best ? best.selector : "",
      paragraphs,
      bodyText,
      warnings
    };
  })()`;
  const extracted = (await page.evaluate(
    extractionScript,
  )) as BrowserExtraction;

  const result: ExtractedArticle = {
    requestedUrl: url.href,
    finalUrl: page.url(),
    status: response?.status() ?? null,
    title: cleanText(extracted.title),
    canonicalUrl: extracted.canonicalUrl,
    publishedAt: extracted.publishedAt,
    author: extracted.author ? cleanText(extracted.author) : null,
    extractionSelector: extracted.extractionSelector,
    paragraphs: extracted.paragraphs,
    bodyText: extracted.bodyText,
    wordCount: extracted.bodyText.split(/\s+/).filter(Boolean).length,
    complete: Boolean(
      response?.ok() &&
      extracted.paragraphs.length >= 3 &&
      extracted.warnings.length === 0,
    ),
    warnings: extracted.warnings,
    retrievedAt: new Date().toISOString(),
  };

  if (outputPath) await writeFile(outputPath, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify({
      ...result,
      bodyText: undefined,
      paragraphs: undefined,
    }),
  );
} finally {
  await browser.close();
}
