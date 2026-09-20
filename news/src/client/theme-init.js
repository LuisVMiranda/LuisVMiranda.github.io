(() => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const key = 'noticias.preferences.v1';
  const sizes = [16, 18, 20, 22, 24];
  let system = 'light';
  try {
    system = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    system = 'light';
  }
  try {
    const saved = JSON.parse(window.localStorage.getItem(key) || '{}');
    root.dataset.theme =
      saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : system;
    const size = sizes.includes(saved.fontSize) ? saved.fontSize : 18;
    root.style.setProperty('--article-size', `${size}px`);
  } catch {
    root.dataset.theme = system;
    root.style.setProperty('--article-size', '18px');
  }
})();
