const SCROLL_THRESHOLD = 400;

/** @returns {HTMLElement | null} */
function mainTarget() {
  const main = document.getElementById('main');
  return main instanceof HTMLElement ? main : document.querySelector('h1');
}

/** @returns {HTMLButtonElement} */
function createButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'scroll-top';
  button.dataset.scrollTop = '';
  button.setAttribute(
    'aria-label',
    document.documentElement.lang === 'en' ? 'Back to top' : 'Voltar ao topo',
  );
  button.hidden = true;
  button.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 19V5m-6 6 6-6 6 6"/></svg>';
  return button;
}

/** @param {HTMLButtonElement} button */
function updateVisibility(button) {
  button.hidden = window.scrollY <= SCROLL_THRESHOLD;
}

function scrollToTop() {
  let reduced = false;
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reduced = false;
  }
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  const target = mainTarget();
  if (target) {
    target.focus({ preventScroll: true });
  }
}

if (typeof document !== 'undefined') {
  const button = createButton();
  document.body.append(button);
  window.addEventListener('scroll', () => updateVisibility(button), {
    passive: true,
  });
  button.addEventListener('click', scrollToTop);
  updateVisibility(button);
}
