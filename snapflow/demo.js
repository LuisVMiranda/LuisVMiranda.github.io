import { photos } from './sections.js';

export function demoTotal(count) {
  return count * (count >= 3 ? 20 : 25);
}

export function initializeDemo(element, getCopy) {
  const state = { selected: new Set([0, 2]), step: 0, method: 'pix', pending: false };
  const currency = (value) => new Intl.NumberFormat(getCopy().language, { style: 'currency', currency: 'BRL' }).format(value);
  const button = (action, text, extra = '') => `<button class="button dark demo-action" data-action="${action}" ${extra}>${text}<span aria-hidden="true">↗</span></button>`;

  function selection(c) {
    return `<div class="demo-gallery-heading"><span class="demo-location">${c.location}</span><h3>${c.title}</h3><p>${c.subtitle}</p></div><div class="demo-photo-grid">${photos.map((src, i) => `<button class="demo-photo photo-${i}" data-photo="${i}" aria-pressed="${state.selected.has(i)}" aria-label="${c.select}: ${c.photoLabels[i]}"><img src="${src}" alt="${c.photoLabels[i]}" width="400" height="480" /><span class="photo-watermark">snapflow</span><span class="photo-check" aria-hidden="true">${state.selected.has(i) ? '✓' : '+'}</span><span class="photo-index">0${i + 1}</span></button>`).join('')}</div><div class="selection-status"><span>${state.selected.size} / 3 ${c.selected}</span><span>${c.badge}</span></div><p class="price-hint">${c.priceHint}</p><div class="demo-checkout"><div><small>${c.total}</small><strong>${currency(demoTotal(state.selected.size))}</strong></div>${button('continue', c.continue, state.selected.size ? '' : 'disabled')}</div>${!state.selected.size ? `<p class="empty-hint">${c.choose}</p>` : ''}`;
  }

  function payment(c) {
    if (state.pending) return `<div class="payment-panel"><span class="large-state-icon pending-icon" aria-hidden="true">◷</span><h3 tabindex="-1" data-stage-title>${c.pending}</h3><p>${c.pendingText}</p><div class="order-total"><span>${c.total}</span><strong>${currency(demoTotal(state.selected.size))}</strong></div>${button('approve', c.approve)}<p class="simulation-note">${c.simulation}</p><button class="plain-button" data-action="back">← ${c.back}</button></div>`;
    return `<div class="payment-panel"><span class="demo-location">${c.badge}</span><h3 tabindex="-1" data-stage-title>${c.paymentTitle}</h3><p>${c.paymentSubtitle}</p><fieldset class="payment-methods"><legend>${c.paymentSubtitle}</legend>${['pix', 'manual'].map((method) => `<label class="payment-option"><input type="radio" name="demo-payment" value="${method}" ${state.method === method ? 'checked' : ''} /><span><strong>${c[method]}</strong><small>${c[`${method}Hint`]}</small></span><span aria-hidden="true">${method === 'pix' ? '◈' : '▱'}</span></label>`).join('')}</fieldset><div class="order-total"><span>${state.selected.size} / 3 ${c.selected}</span><strong>${currency(demoTotal(state.selected.size))}</strong></div>${button('pay', state.method === 'pix' ? c.pay : c.request)}<p class="simulation-note">${c.simulation}</p><button class="plain-button" data-action="back">← ${c.back}</button></div>`;
  }

  function complete(c) {
    return `<div class="complete-panel"><span class="large-state-icon" aria-hidden="true">✓</span><h3 tabindex="-1" data-stage-title>${c.done}</h3><p>${c.doneSub}</p><div class="download-list">${[...state.selected].map((i) => `<a class="download-row" href="${photos[i]}" download="snapflow-sample-${i + 1}.webp"><img src="${photos[i]}" alt="" width="48" height="48" /><span>${c.download} 0${i + 1}</span><span aria-hidden="true">↧</span></a>`).join('')}</div><small class="download-note">${c.downloadNote}</small><button class="plain-button" data-action="restart">↻ ${c.restart}</button></div>`;
  }

  function render(focusStage = false) {
    const { demo: c } = getCopy();
    const views = [selection, payment, complete];
    element.innerHTML = views[state.step](c);
    document.querySelectorAll('[data-step-indicator]').forEach((item, i) => {
      item.classList.toggle('active', i === state.step);
      item.classList.toggle('completed', i < state.step);
      if (i === state.step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    if (focusStage) element.querySelector('[data-stage-title]')?.focus({ preventScroll: true });
  }

  const actions = {
    continue: () => { if (state.selected.size) state.step = 1; },
    back: () => { state.step = 0; state.pending = false; },
    pay: () => { if (state.method === 'pix') state.step = 2; else state.pending = true; },
    approve: () => { state.step = 2; state.pending = false; },
    restart: () => { state.step = 0; state.pending = false; },
  };
  element.addEventListener('click', (event) => {
    const photo = event.target.closest('[data-photo]');
    if (photo) {
      const index = Number(photo.dataset.photo);
      if (state.selected.has(index)) state.selected.delete(index);
      else state.selected.add(index);
      render();
      element.querySelector(`[data-photo="${index}"]`).focus({ preventScroll: true });
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!actions[action]) return;
    actions[action]();
    render(true);
    if (state.step === 0) element.querySelector('[data-photo]')?.focus({ preventScroll: true });
  });
  element.addEventListener('change', (event) => {
    if (event.target.name !== 'demo-payment') return;
    state.method = event.target.value;
    render();
    element.querySelector(`input[value="${state.method}"]`).focus({ preventScroll: true });
  });
  return { render };
}
