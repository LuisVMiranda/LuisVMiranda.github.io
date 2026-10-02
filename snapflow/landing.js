import { content, english } from './copy.js';
import { renderSections } from './sections.js';
import { initializeDemo } from './demo.js';
import { initializeTheme } from './theme.js';

initializeTheme(document);

const portuguese = {};
document.querySelectorAll('[data-i18n], [data-label], [data-alt]').forEach((node) => {
  if (node.dataset.i18n) portuguese[node.dataset.i18n] = node.textContent;
  if (node.dataset.label) portuguese[node.dataset.label] = node.getAttribute('aria-label');
  if (node.dataset.alt) portuguese[node.dataset.alt] = node.alt;
});

export function storedLanguage(storage) {
  try { return storage.getItem('snapflow-language') === 'en' ? 'en' : 'pt-BR'; }
  catch { return 'pt-BR'; }
}

let language = storedLanguage({ getItem: (key) => localStorage.getItem(key) });
const demo = initializeDemo(document.querySelector('#demoContent'), () => ({ ...content[language], language }));

function applyLanguage() {
  const dictionary = language === 'en' ? english : portuguese;
  document.documentElement.lang = language;
  document.title = content[language].title;
  document.querySelector('meta[name="description"]').content = content[language].description;
  document.querySelector('meta[property="og:title"]').content = content[language].title;
  document.querySelector('meta[property="og:description"]').content = content[language].description;
  document.querySelector('meta[property="og:locale"]').content = language === 'en' ? 'en_US' : 'pt_BR';
  document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = dictionary[node.dataset.i18n]; });
  document.querySelectorAll('[data-label]').forEach((node) => { node.setAttribute('aria-label', dictionary[node.dataset.label]); });
  document.querySelectorAll('[data-alt]').forEach((node) => { node.alt = dictionary[node.dataset.alt]; });
  document.querySelector('#languageName').textContent = language === 'en' ? 'EN' : 'PT-BR';
  document.querySelector('#languageToggle').setAttribute('aria-label', language === 'en' ? 'Mudar para Português brasileiro' : 'Switch to English');
  renderSections(content[language]);
  demo.render();
}

document.querySelector('#languageToggle').addEventListener('click', () => {
  language = language === 'en' ? 'pt-BR' : 'en';
  try { localStorage.setItem('snapflow-language', language); } catch { /* Language still works when storage is disabled. */ }
  applyLanguage();
});

const menu = document.querySelector('#mobileNav');
const menuToggle = document.querySelector('#menuToggle');
function closeMenu() { menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false'); }
menuToggle.addEventListener('click', () => {
  menu.hidden = !menu.hidden;
  menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
});
menu.querySelectorAll('a, button').forEach((item) => item.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

const dialog = document.querySelector('#startDialog');
document.querySelectorAll('[data-start]').forEach((button) => button.addEventListener('click', () => dialog.showModal()));
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
document.querySelector('[data-demo-link]').addEventListener('click', () => {
  window.location.hash = 'demo';
  document.querySelector('#demoContent button')?.focus({ preventScroll: true });
});
document.querySelector('[data-year]').textContent = new Date().getFullYear();

const art = document.querySelector('#heroArt');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
art.addEventListener('pointermove', (event) => {
  if (motion.matches || event.pointerType !== 'mouse') return;
  const rect = art.getBoundingClientRect();
  art.style.setProperty('--tilt-x', `${((event.clientY - rect.top) / rect.height - .5) * -5}deg`);
  art.style.setProperty('--tilt-y', `${((event.clientX - rect.left) / rect.width - .5) * 5}deg`);
});
art.addEventListener('pointerleave', () => { art.style.setProperty('--tilt-x', '0deg'); art.style.setProperty('--tilt-y', '0deg'); });
applyLanguage();
