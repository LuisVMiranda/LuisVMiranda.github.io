import coast from './assets/coast.webp';
import events from './assets/events.webp';
import coastDetail from './assets/coast-detail.webp';

export const photos = [coast, coastDetail, events];

function featureVisuals(v) {
  return [
    `<div class="photo-stack"><div class="stack-photo back"><img src="${events}" alt="" loading="lazy" /></div><div class="stack-photo front"><img src="${coast}" alt="" loading="lazy" /><span>${v.brand}</span></div><span class="protect-pill">✓ ${v.protected}</span></div>`,
    `<div class="price-visual"><div class="price-row"><span>${v.single}</span><strong>R$ 25</strong></div><div class="price-row highlighted"><div><span>${v.pack}</span><small>${v.rules}</small></div><strong>R$ 60 <span>✓</span></strong></div><small class="example-label">${v.prices}</small></div>`,
    `<div class="delivery-visual"><span class="delivery-orbit"></span><span class="delivery-node">↧</span><div class="delivery-message"><span class="success-icon">✓</span><div><strong>${v.ready}</strong><span>${v.quality}</span></div></div></div>`,
    `<div class="chart-visual"><div class="chart-label"><span>${v.operation}</span><span>↗</span></div><div class="bar-chart">${Array.from({ length: 12 }, () => '<i></i>').join('')}</div><small class="example-label">${v.chart}</small></div>`,
  ];
}

// All markup values come from the local, authored copy dictionary, never user input.
export function renderSections(c) {
  document.querySelector('#flowSteps').innerHTML = c.steps.map(([title, text], i) => `<article><span class="step-number">0${i + 1}<span aria-hidden="true">${i === 2 ? '✓' : '↗'}</span></span><h3>${title}</h3><p>${text}</p></article>`).join('');
  document.querySelector('#demoSteps').innerHTML = c.demoSteps.map(([title, text], i) => `<li data-step-indicator="${i}"><span>${i + 1}</span><div><strong>${title}</strong><small>${text}</small></div></li>`).join('');
  const visuals = featureVisuals(c.visuals);
  document.querySelector('#featureGrid').innerHTML = c.features.map(([kicker, title, text], i) => `<article class="feature-card feature-${i}"><div class="feature-visual" aria-hidden="true">${visuals[i]}</div><span class="card-kicker">0${i + 1} / ${kicker}</span><h3>${title}</h3><p>${text}</p></article>`).join('');
  document.querySelector('#sceneGrid').innerHTML = c.scenes.map(([key, alt, tag, title, text]) => `<article class="scene"><img src="${key === 'coast' ? coast : events}" alt="${alt}" loading="lazy" width="1200" height="800" /><div class="scene-overlay"><span class="scene-tag">${tag}</span><h3>${title}</h3><p>${text}</p><a href="#demo"><span>${c.sceneCta}</span><span aria-hidden="true">↗</span></a></div></article>`).join('');
  const openFaqs = [...document.querySelectorAll('#faqList details')].map((item) => item.open);
  document.querySelector('#faqList').innerHTML = c.faqs.map(([question, answer], i) => `<details ${openFaqs[i] ? 'open' : ''}><summary>${question}</summary><p>${answer}</p></details>`).join('');
}
