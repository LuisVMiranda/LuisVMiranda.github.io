import en from './locales/en.js';
import pt from './locales/pt.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import it from './locales/it.js';
import de from './locales/de.js';

export const catalogs = { en, pt, es, fr, it, de };
const normalize = (text) => text.replace(/\s+/g, ' ').trim();
const keys = new Map(Object.entries(en).map(([key, source]) => [normalize(source), key]));
const staticText = new Map(),
  dynamicText = new Map(),
  attributes = new Map();
const excluded =
  'script,style,noscript,[data-no-translate],.wordmark,kbd,[data-ui-language],[data-demo-language]';
let selected = 'en';

export function resolveLanguage(value = '') {
  const code = value.toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(catalogs, code) ? code : 'en';
}

export function t(source, values = {}) {
  const key = keys.get(normalize(source));
  let result = catalogs[selected][key] ?? source;
  for (const [name, value] of Object.entries(values))
    result = result.replaceAll(`{${name}}`, value);
  return result;
}

export function setText(element, source) {
  dynamicText.set(element, source);
  element.textContent = t(source);
}

export function setLabel(element, name, source, values = {}) {
  if (!attributes.has(element)) attributes.set(element, new Map());
  attributes.get(element).set(name, { source, values });
  element.setAttribute(name, t(source, values));
}

function captureText() {
  const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest(excluded)) continue;
    const source = normalize(node.textContent);
    if (keys.has(source))
      staticText.set(node, { source, space: node.textContent.match(/^(\s*)[\s\S]*?(\s*)$/) });
  }
  for (const element of document.querySelectorAll('[aria-label],[placeholder],meta[content]')) {
    for (const name of ['aria-label', 'placeholder', 'content']) {
      const source = element.getAttribute(name);
      if (source && keys.has(normalize(source))) setLabel(element, name, source);
    }
  }
}

function renderLanguage() {
  document.documentElement.lang = selected === 'pt' ? 'pt-BR' : selected;
  document.querySelector('#site-language').value = selected;
  for (const [node, binding] of staticText) {
    if (!node.isConnected) {
      staticText.delete(node);
      continue;
    }
    node.textContent = binding.space[1] + t(binding.source) + binding.space[2];
  }
  for (const [element, source] of dynamicText) element.textContent = t(source);
  for (const [element, bindings] of attributes) {
    for (const [name, { source, values }] of bindings)
      element.setAttribute(name, t(source, values));
  }
}

function preferredLanguage() {
  try {
    const saved = localStorage.getItem('mira-site-language');
    if (saved) return saved;
  } catch {
    /* Storage may be disabled; the selector still works for this visit. */
  }
  return navigator.language;
}

export function initI18n() {
  captureText();
  selected = resolveLanguage(preferredLanguage());
  renderLanguage();
  document.querySelector('#site-language').disabled = false;
  document.querySelector('#site-language').addEventListener('change', (event) => {
    selected = resolveLanguage(event.target.value);
    try {
      localStorage.setItem('mira-site-language', selected);
    } catch {
      /* Optional persistence. */
    }
    renderLanguage();
  });
}
