export function initScrollToTop() {
  const button = document.querySelector('.scroll-top');
  const update = () => {
    button.hidden = window.scrollY < 320;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}
