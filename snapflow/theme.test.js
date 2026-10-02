import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeTheme } from './theme.js';

function environment(saved = null, dark = false) {
  const listeners = {};
  const media = { matches: dark, addEventListener: vi.fn((_, listener) => { listeners.media = listener; }) };
  return {
    media, listeners,
    matchMedia: () => media,
    localStorage: { getItem: vi.fn(() => saved), setItem: vi.fn() },
    addEventListener: vi.fn((type, listener) => { listeners[type] = listener; }),
  };
}

beforeEach(() => {
  document.head.innerHTML = '<meta name="theme-color" content="#f6f8fa">';
  document.body.innerHTML = '<select id="themeSelect"><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Escuro</option></select>';
  delete document.documentElement.dataset.theme;
});

function selectTheme(value) {
  const control = document.querySelector('#themeSelect');
  control.value = value;
  control.dispatchEvent(new Event('change'));
}

describe('landing theme preference', () => {
  it('follows system changes until an explicit choice, and can return to system', () => {
    const env = environment(null, true);
    initializeTheme(document, env);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.querySelector('#themeSelect').value).toBe('system');
    selectTheme('light');
    expect(env.localStorage.setItem).toHaveBeenCalledWith('snapflow-theme', 'light');
    env.listeners.media();
    expect(document.documentElement.dataset.theme).toBe('light');
    selectTheme('system');
    expect(document.documentElement.dataset.theme).toBe('dark');
    env.media.matches = false;
    env.listeners.media();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('restores a saved choice and updates browser chrome without touching the locale', () => {
    document.documentElement.lang = 'en';
    initializeTheme(document, environment('dark', false));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.querySelector('meta[name="theme-color"]').content).toBe('#121212');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(document.documentElement.lang).toBe('en');
  });

  it('synchronizes another tab and responds to preference removal', () => {
    const env = environment('light', true);
    initializeTheme(document, env);
    env.listeners.storage({ key: 'snapflow-theme', newValue: 'dark' });
    expect(document.querySelector('#themeSelect').value).toBe('dark');
    env.listeners.storage({ key: 'unrelated', newValue: 'light' });
    expect(document.documentElement.dataset.theme).toBe('dark');
    env.listeners.storage({ key: 'snapflow-theme', newValue: null });
    expect(document.querySelector('#themeSelect').value).toBe('system');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('still allows theme selection if browser storage is blocked', () => {
    const env = environment(null, true);
    env.localStorage.getItem.mockImplementation(() => { throw new Error('Blocked'); });
    env.localStorage.setItem.mockImplementation(() => { throw new Error('Blocked'); });
    initializeTheme(document, env);
    expect(document.documentElement.dataset.theme).toBe('dark');
    selectTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it.each(['dark', 'light', 'system', 'invalid'])('pre-paint script and runtime agree for %s', (saved) => {
    const html = fs.readFileSync('website/index.html', 'utf8');
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    const env = environment(saved, true);
    new Function('document', 'localStorage', 'matchMedia', script)(document, env.localStorage, env.matchMedia);
    const initial = document.documentElement.dataset.theme;
    initializeTheme(document, env);
    expect(document.documentElement.dataset.theme).toBe(initial);
  });
});

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => Number.parseInt(value, 16) / 255);
  const [r, g, b] = channels.map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * r + .7152 * g + .0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + .05) / (dark + .05);
}

describe('landing palette contrast', () => {
  const css = fs.readFileSync('website/landing-theme.css', 'utf8');
  const declarations = (selector) => Object.fromEntries([...css.match(selector)[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value]));
  const light = declarations(/:root \{([\s\S]*?)\}/);
  const dark = { ...light, ...declarations(/:root\[data-theme='dark'\] \{([\s\S]*?)\}/) };
  const pairs = [
    ['ink', 'paper'], ['ink', 'surface'], ['ink', 'surface-raised'],
    ['muted', 'paper'], ['muted', 'surface'], ['muted', 'surface-raised'], ['muted', 'accent-soft'],
    ['accent-text', 'paper'], ['accent-text', 'surface'], ['accent-text', 'accent-soft'],
    ['link', 'paper'], ['link', 'surface'], ['link', 'surface-raised'], ['link', 'link-soft'],
    ['on-accent', 'brand-green'], ['on-accent', 'green-hover'], ['pending-text', 'pending-bg'],
  ];
  it.each([['light', light], ['dark', dark]])('%s text pairs meet 4.5:1 contrast', (_, tokens) => {
    pairs.forEach(([foreground, background]) => {
      expect(contrast(tokens[foreground], tokens[background]), `${foreground} / ${background}`).toBeGreaterThanOrEqual(4.5);
    });
  });
  it('retains the app’s exact action and surface palette', () => {
    const app = fs.readFileSync('src/styles/tokens-base.css', 'utf8');
    ['#00c851', '#1e90ff', '#121212', '#1e1e1e', '#2a2a2a', '#9ca3af'].forEach((color) => {
      expect(app).toContain(color);
      expect(Object.values(dark)).toContain(color);
    });
  });
});
