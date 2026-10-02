import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { content, english } from './copy.js';
import { demoTotal, initializeDemo } from './demo.js';

const html = fs.readFileSync('website/index.html', 'utf8');
let language;
let demo;
const click = (selector) => document.querySelector(selector).click();
beforeEach(() => {
  document.body.innerHTML = '<ol><li data-step-indicator="0"></li><li data-step-indicator="1"></li><li data-step-indicator="2"></li></ol><div id="demoContent"></div>';
  language = 'pt-BR';
  demo = initializeDemo(document.querySelector('#demoContent'), () => ({ ...content[language], language }));
  demo.render();
});

describe('SnapFlow landing experience', () => {
  it('has an English translation for every authored text and accessible label', () => {
    document.body.innerHTML = html;
    const keys = [...document.querySelectorAll('[data-i18n], [data-label], [data-alt]')].flatMap((node) => [node.dataset.i18n, node.dataset.label, node.dataset.alt].filter(Boolean));
    expect(keys.length).toBeGreaterThan(60);
    keys.forEach((key) => expect(english[key], key).toBeTypeOf('string'));
    expect(html).toContain('<html lang="pt-BR">');
  });
  it('calculates the package discount and prevents an empty checkout', () => {
    expect([0, 1, 2, 3].map(demoTotal)).toEqual([0, 25, 50, 60]);
    click('[data-photo="1"]');
    expect(document.querySelector('.demo-checkout strong').textContent).toMatch(/60/);
    [0, 1, 2].forEach((i) => click(`[data-photo="${i}"]`));
    expect(document.querySelector('[data-action="continue"]')).toBeDisabled();
    expect(document.querySelector('#demoContent').textContent).toContain(content['pt-BR'].demo.choose);
  });
  it('unlocks exactly the selected downloads after a simulated Pix confirmation', () => {
    click('[data-action="continue"]');
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
    click('[data-action="pay"]');
    expect(document.querySelectorAll('a[download]')).toHaveLength(2);
    expect(document.querySelector('[data-step-indicator="2"]')).toHaveAttribute('aria-current', 'step');
    expect(document.querySelector('a[download]')).toHaveAttribute('download', 'snapflow-sample-1.webp');
    click('[data-action="restart"]');
    expect(document.querySelectorAll('[aria-pressed="true"]')).toHaveLength(2);
  });
  it('requires a second, explicit approval for a simulated cash/card payment', () => {
    click('[data-action="continue"]');
    const manual = document.querySelector('input[value="manual"]');
    manual.checked = true;
    manual.dispatchEvent(new Event('change', { bubbles: true }));
    click('[data-action="pay"]');
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
    expect(document.querySelector('#demoContent').textContent).toContain(content['pt-BR'].demo.pending);
    click('[data-action="approve"]');
    expect(document.querySelectorAll('a[download]')).toHaveLength(2);
  });
  it('keeps selection, total and the current payment step while changing language', () => {
    click('[data-photo="1"]');
    click('[data-action="continue"]');
    language = 'en'; demo.render();
    expect(document.querySelector('#demoContent').textContent).toContain('Almost yours.');
    expect(document.querySelector('.order-total').textContent).toContain('60.00');
    click('[data-action="back"]');
    expect(document.querySelectorAll('[aria-pressed="true"]')).toHaveLength(3);
    expect(document.querySelector('#demoContent').textContent).toContain('A day to remember.');
  });
});
