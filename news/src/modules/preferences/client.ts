import { readPreferences, resizeFont, writePreferences } from './state';

function storage(): Storage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}
const settings = readPreferences(
  storage(),
  matchMedia('(prefers-color-scheme: dark)').matches,
);
const root = document.documentElement;
const theme = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const decrease = document.querySelector<HTMLButtonElement>(
  '[data-font-decrease]',
);
const increase = document.querySelector<HTMLButtonElement>(
  '[data-font-increase]',
);
const value = document.querySelector<HTMLOutputElement>('[data-font-value]');

function apply(): void {
  root.dataset.theme = settings.theme;
  root.style.setProperty('--article-size', `${settings.fontSize}px`);
  const action =
    settings.theme === 'dark'
      ? theme?.dataset.lightLabel
      : theme?.dataset.darkLabel;
  if (theme && action) theme.setAttribute('aria-label', action);
  if (decrease) decrease.disabled = settings.fontSize === 16;
  if (increase) increase.disabled = settings.fontSize === 24;
  if (value) value.textContent = `${settings.fontSize}px`;
}
theme?.addEventListener('click', () => {
  settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
  apply();
  writePreferences(storage(), settings);
});
function changeSize(direction: number): void {
  settings.fontSize = resizeFont(settings.fontSize, direction);
  apply();
  writePreferences(storage(), settings);
}
decrease?.addEventListener('click', () => changeSize(-1));
increase?.addEventListener('click', () => changeSize(1));
apply();
