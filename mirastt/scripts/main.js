import { initScene } from './scene.js';
import { initDemo } from './demo.js';
import { initI18n, setText, setLabel } from './i18n.js';
import { initScrollToTop } from './scroll-top.js';

initI18n();
initScrollToTop();
const scene = initScene();
initDemo(scene);

const interfaceLabels = {
  en: ['Preferences', 'Appearance', 'Follow system', 'Save preferences'],
  pt: ['Preferências', 'Aparência', 'Seguir o sistema', 'Salvar preferências'],
  es: ['Preferencias', 'Apariencia', 'Seguir el sistema', 'Guardar preferencias'],
  fr: ['Préférences', 'Apparence', 'Suivre le système', 'Enregistrer les préférences'],
  it: ['Preferenze', 'Aspetto', 'Segui il sistema', 'Salva preferenze'],
  de: ['Einstellungen', 'Darstellung', 'Systemeinstellung', 'Einstellungen speichern'],
};
const languageNames = {
  en: 'English',
  pt: 'Português',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  de: 'Deutsch',
};
document.querySelectorAll('[data-ui-language]').forEach((button) => {
  setLabel(button, 'aria-label', 'Preview {language} interface', {
    language: languageNames[button.dataset.uiLanguage],
  });
  button.addEventListener('click', () => {
    document
      .querySelectorAll('[data-ui-language]')
      .forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button)));
    const labels = interfaceLabels[button.dataset.uiLanguage];
    ['preview-preferences', 'preview-appearance', 'preview-system', 'preview-save'].forEach(
      (id, index) => {
        document.getElementById(id).textContent = labels[index];
      },
    );
    document.querySelector('.language-preview').lang = button.dataset.uiLanguage;
  });
});

const engineCopy = {
  local: [
    'W',
    'Whisper, right here.',
    'Download a model once. Later recordings are processed locally. Smaller models use less memory; accuracy varies.',
  ],
  cloud: [
    '↗',
    'Your preferred connection.',
    'Connect OpenAI, Gemini Live, or a compatible API. Audio goes to the selected service; provider pricing and limits apply.',
  ],
};
document.querySelectorAll('[data-engine]').forEach((button) =>
  button.addEventListener('click', () => {
    document
      .querySelectorAll('[data-engine]')
      .forEach((peer) => peer.setAttribute('aria-pressed', String(peer === button)));
    const mode = button.dataset.engine;
    document.getElementById('engine-diagram').dataset.mode = mode;
    ['engine-symbol', 'engine-title', 'engine-detail'].forEach((id, index) => {
      setText(document.getElementById(id), engineCopy[mode][index]);
    });
  }),
);
