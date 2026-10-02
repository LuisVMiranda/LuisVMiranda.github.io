import fs from 'node:fs';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';

const root = path.resolve('website');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

it('ships an ordinary script and local assets for direct HTML opening', () => {
  expect(html).not.toMatch(/<script[^>]*type="module"/);
  expect(html).toContain('src="./landing.bundle.js"');
  expect(fs.existsSync(path.join(root, 'landing.bundle.js'))).toBe(true);
});

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

function exerciseBundle(directory) {
  const page = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  const parsed = new DOMParser().parseFromString(page, 'text/html');
  document.head.innerHTML = parsed.head.innerHTML;
  document.body.innerHTML = parsed.body.innerHTML;
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn() }));
  const fetch = vi.fn(() => { throw new Error('The standalone landing page must not fetch data.'); });
  vi.stubGlobal('fetch', fetch);

  // Execute the shipped classic script in the test DOM, without a module loader
  // or any local-file browser navigation/network access.
  new Function(fs.readFileSync(path.join(directory, 'landing.bundle.js'), 'utf8'))();
  expect(document.querySelectorAll('.demo-photo img')).toHaveLength(3);
  expect(document.querySelectorAll('.feature-card')).toHaveLength(4);
  expect(document.querySelectorAll('.scene img')).toHaveLength(2);
  for (const node of document.querySelectorAll('img, script[src], link[rel="stylesheet"]')) {
    const reference = node.getAttribute('src') || node.getAttribute('href');
    if (reference.startsWith('https:') || reference.startsWith('data:image/')) continue;
    expect(reference).toMatch(/^\.\//);
    expect(fs.existsSync(path.resolve(directory, reference)), reference).toBe(true);
  }

  const theme = document.querySelector('#themeSelect');
  theme.value = 'dark';
  theme.dispatchEvent(new Event('change'));
  document.querySelector('#languageToggle').click();
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(document.documentElement.lang).toBe('en');
  expect(document.querySelector('#demoContent').textContent).toContain('A day to remember.');
  document.querySelector('[data-action="continue"]').click();
  document.querySelector('[data-action="pay"]').click();
  expect(document.querySelectorAll('a[download]')).toHaveLength(2);
  for (const link of document.querySelectorAll('a[download]')) {
    expect(fs.existsSync(path.resolve(directory, link.getAttribute('href')))).toBe(true);
  }
  expect(fetch).not.toHaveBeenCalled();
}

it('renders photos, themes, translations and checkout from the shipped classic script', () => {
  exerciseBundle(root);
});

it.skipIf(!fs.existsSync('dist/website/index.html'))('keeps the production package directly openable, too', () => {
  const output = path.resolve('dist/website');
  expect(fs.readFileSync(path.join(output, 'index.html'), 'utf8')).not.toMatch(/<script[^>]*type="module"/);
  exerciseBundle(output);
});
