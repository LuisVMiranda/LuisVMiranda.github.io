import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium, type Browser } from 'playwright';

type Candidate = {
  url: string;
  title: string;
  snippet: string;
  source: string;
  section: string;
  query: string;
};

type Extraction = Candidate & {
  finalUrl: string;
  status: number | null;
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

const runDirectoryValue = process.argv[process.argv.indexOf('--run') + 1];
const maxPerSection = Number(
  process.argv[process.argv.indexOf('--max-per-section') + 1] || 24,
);
const concurrency = Number(
  process.argv[process.argv.indexOf('--concurrency') + 1] || 8,
);
if (!runDirectoryValue) throw new Error('Usage: --run research/runs/RUN_ID');
const runDirectory = runDirectoryValue;

const extractionScript = String.raw`(() => {
  const removeSelectors = [
    "script", "style", "noscript", "template", "svg", "canvas", "iframe",
    "video", "audio", "form", "nav", "header", "footer", "aside",
    "[role=\"navigation\"]", "[role=\"complementary\"]",
    "[aria-label*=\"advert\" i]", "[aria-label*=\"share\" i]",
    "[class*=\"advert\" i]", "[class*=\"banner\" i]",
    "[class*=\"newsletter\" i]", "[class*=\"related\" i]",
    "[class*=\"recommend\" i]", "[class*=\"comment\" i]",
    "[id*=\"advert\" i]", "[id*=\"related\" i]", "[id*=\"comment\" i]"
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
    clone.querySelectorAll("br").forEach((node) => node.replaceWith(document.createTextNode("\\n")));
    const blocks = Array.from(clone.querySelectorAll("p, h2, h3, h4, li, blockquote, td, th"))
      .map((node) => normalized(node.textContent || ""))
      .filter((text) => text.length >= 25);
    const fallback = normalized(clone.textContent || "")
      .split(/\\n+/).map(normalized).filter((text) => text.length >= 25);
    const values = blocks.length >= 2 ? blocks : fallback;
    return values.filter((value, index) => values.indexOf(value) === index);
  };
  const candidates = selectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)).map((element) => ({
      selector, paragraphs: paragraphsFrom(element)
    })))
    .filter((candidate) => candidate.paragraphs.length >= 2)
    .sort((left, right) => right.paragraphs.join(" ").length - left.paragraphs.join(" ").length);
  const best = candidates[0];
  const paragraphs = best ? best.paragraphs : [];
  const bodyText = paragraphs.join("\\n\\n");
  const lower = bodyText.toLowerCase();
  const warnings = [];
  if (!best) warnings.push("No article container with multiple paragraphs found");
  if (paragraphs.length < 3) warnings.push("Fewer than three body paragraphs extracted");
  if (/subscribe|sign in to read|log in to continue|paywall/.test(lower))
    warnings.push("The page may be access-limited or paywalled");
  if (/read more|continue reading|keep reading/.test(lower))
    warnings.push("The extracted body contains a continuation marker");
  const metadata = (selector) => document.querySelector(selector)?.content?.trim() || null;
  const time = document.querySelector("time[datetime]")?.getAttribute("datetime");
  return {
    title: metadata("meta[property=\"og:title\"]") || document.title,
    canonicalUrl: document.querySelector("link[rel=\"canonical\"]")?.href || location.href,
    publishedAt: metadata("meta[property=\"article:published_time\"]") || metadata("meta[name=\"date\"]") || time || null,
    author: metadata("meta[name=\"author\"]") || metadata("meta[property=\"article:author\"]") || null,
    extractionSelector: best ? best.selector : "",
    paragraphs, bodyText, warnings
  };
})()`;

function host(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function idFor(url: string): string {
  return createHash('sha1').update(url).digest('hex').slice(0, 12);
}

function preferred(candidate: Candidate): number {
  const domain = host(candidate.url);
  if (!domain || domain.includes('msn.com') || domain.includes('reuters.com'))
    return 1;
  if (domain.includes('yahoo.com') || domain.includes('investing.com'))
    return 2;
  return 0;
}

async function readCandidates(): Promise<Candidate[]> {
  const files = (await readdir(runDirectory)).filter(
    (file) => file.endsWith('.json') && file !== 'run.json',
  );
  const all: Candidate[] = [];
  for (const file of files) {
    const data = JSON.parse(
      await readFile(`${runDirectory}/${file}`, 'utf8'),
    ) as { candidates?: Candidate[] };
    all.push(...(data.candidates || []));
  }
  return all;
}

async function extract(
  browser: Browser,
  candidate: Candidate,
): Promise<Extraction> {
  const page = await browser.newPage({
    locale: 'en-US',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  try {
    const response = await page.goto(candidate.url, {
      timeout: 30_000,
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(700);
    for (let index = 0; index < 5; index += 1) {
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(200);
    }
    const data = (await page.evaluate(extractionScript)) as {
      title: string;
      canonicalUrl: string;
      publishedAt: string | null;
      author: string | null;
      extractionSelector: string;
      paragraphs: string[];
      bodyText: string;
      warnings: string[];
    };
    const complete = Boolean(
      response?.ok() &&
      data.paragraphs.length >= 3 &&
      data.warnings.length === 0,
    );
    return {
      ...candidate,
      finalUrl: page.url(),
      status: response?.status() ?? null,
      ...data,
      wordCount: data.bodyText.split(/\s+/).filter(Boolean).length,
      complete,
      retrievedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ...candidate,
      finalUrl: candidate.url,
      status: null,
      canonicalUrl: candidate.url,
      publishedAt: null,
      author: null,
      extractionSelector: '',
      paragraphs: [],
      bodyText: '',
      wordCount: 0,
      complete: false,
      warnings: [String(error)],
      retrievedAt: new Date().toISOString(),
    };
  } finally {
    await page.close();
  }
}

const candidates = await readCandidates();
const bySection = new Map<string, Candidate[]>();
for (const candidate of candidates) {
  const list = bySection.get(candidate.section) || [];
  if (!list.some((item) => item.url === candidate.url)) list.push(candidate);
  bySection.set(candidate.section, list);
}
const selected = [...bySection.entries()].flatMap(([section, list]) =>
  list
    .sort((left, right) => preferred(left) - preferred(right))
    .slice(0, maxPerSection)
    .map((candidate) => ({ ...candidate, section })),
);

const browser = await chromium.launch({ headless: true });
const results: Extraction[] = [];
let cursor = 0;
const worker = async () => {
  while (cursor < selected.length) {
    const index = cursor++;
    const candidate = selected[index];
    if (!candidate) continue;
    const result = await extract(browser, candidate);
    results.push(result);
  }
};
await Promise.all(Array.from({ length: concurrency }, worker));
await browser.close();

const outputDirectory = `${runDirectory}/extractions`;
await mkdir(outputDirectory, { recursive: true });
for (const result of results) {
  const sectionDirectory = `${outputDirectory}/${result.section}`;
  await mkdir(sectionDirectory, { recursive: true });
  await writeFile(
    `${sectionDirectory}/${idFor(result.url)}.json`,
    JSON.stringify(result, null, 2),
  );
}
const summary = {
  runDirectory,
  attempted: results.length,
  complete: results.filter((result) => result.complete).length,
  rejected: results.filter((result) => !result.complete).length,
  bySection: Object.fromEntries(
    [...bySection.keys()].sort().map((section) => [
      section,
      {
        attempted: results.filter((result) => result.section === section)
          .length,
        complete: results.filter(
          (result) => result.section === section && result.complete,
        ).length,
      },
    ]),
  ),
  index: `${outputDirectory}/index.json`,
};
await writeFile(
  `${outputDirectory}/index.json`,
  JSON.stringify(summary, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
