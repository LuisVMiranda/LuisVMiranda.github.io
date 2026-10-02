const THEME_KEY = 'snapflow-theme';

export function normalizeTheme(value) {
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function initializeTheme(document, environment = window) {
  const media = environment.matchMedia('(prefers-color-scheme: dark)');
  const root = document.documentElement;
  const control = document.querySelector('#themeSelect');
  let preference = 'system';
  try { preference = normalizeTheme(environment.localStorage.getItem(THEME_KEY)); }
  catch { /* Follow the system when persistence is unavailable. */ }

  function applyTheme() {
    const dark = preference === 'dark' || (preference === 'system' && media.matches);
    root.dataset.themePreference = preference;
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
    control.value = preference;
    document.querySelector('meta[name="theme-color"]').content = dark ? '#121212' : '#f6f8fa';
  }

  control.addEventListener('change', () => {
    preference = normalizeTheme(control.value);
    try { environment.localStorage.setItem(THEME_KEY, preference); }
    catch { /* The selected theme still applies for this visit. */ }
    applyTheme();
  });
  media.addEventListener('change', () => { if (preference === 'system') applyTheme(); });
  environment.addEventListener('storage', (event) => {
    if (event.key !== THEME_KEY && event.key !== null) return;
    preference = normalizeTheme(event.newValue);
    applyTheme();
  });
  applyTheme();
}
