import { setText } from './i18n.js';

const examples = {
  en: {
    message: 'Could we move our review to Thursday? I’ll send the notes beforehand.',
    idea: 'What if we made the first five minutes of every meeting a space for new ideas?',
    note: 'Remember to take a walk, call home, and leave a little room for the unexpected.',
  },
  pt: {
    message: 'Podemos passar nossa revisão para quinta-feira? Envio as anotações antes.',
    idea: 'E se os primeiros cinco minutos de cada reunião fossem um espaço para novas ideias?',
    note: 'Lembrar de caminhar, ligar para casa e deixar um pouco de espaço para o inesperado.',
  },
};
const contexts = {
  message: ['DRAFT MESSAGE', 'A thought worth sharing.', 'To: Your team'],
  idea: ['IDEA NOTEBOOK', 'What if we tried…', 'A little possibility'],
  note: ['PERSONAL NOTES', 'A reminder for later.', 'Just for you'],
};

export function initDemo(scene) {
  const $ = (selector) => document.querySelector(selector);
  const button = $('#record-button'),
    output = $('#demo-output'),
    pill = $('#demo-pill');
  const toggle = $('#toggle-recording'),
    toast = $('#delivery-toast'),
    copy = $('#copy-demo');
  let language = 'en',
    example = 'message',
    state = 'idle',
    started = 0,
    interval = 0;
  let typingTimer = 0,
    finishTimer = 0,
    hideTimer = 0,
    toastTimer = 0;
  let pointerHolding = false,
    keyHolding = false,
    previewCount = 0,
    typedIndex = 0;
  const text = () => examples[language][example];
  let revision = 0;

  function setState(value) {
    state = value;
    button.dataset.state = state;
    setText(
      $('#demo-step'),
      {
        idle: '01 / READY',
        recording: '02 / LISTENING',
        processing: '03 / WRITING',
        done: '04 / DELIVERED',
      }[state],
    );
    setText(
      $('#record-label'),
      state === 'recording'
        ? toggle.checked
          ? 'Tap to finish'
          : 'Release to finish'
        : state === 'processing'
          ? 'Finishing your thought…'
          : toggle.checked
            ? 'Tap to speak'
            : 'Hold to speak',
    );
    button.disabled = state === 'processing';
    toggle.disabled = ['recording', 'processing'].includes(state);
    document.querySelectorAll('[data-example], [data-demo-language]').forEach((item) => {
      item.disabled = toggle.disabled;
    });
    scene.setRecording(state === 'recording');
  }

  function tick() {
    const seconds = Math.floor((performance.now() - started) / 1000);
    const timer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    setText($('#demo-timer'), timer);
    setText($('#scene-time'), timer);
    const words = text().split(' ');
    previewCount = Math.min(
      words.length,
      Math.max(1, Math.floor((performance.now() - started) / 220)),
    );
    $('#live-preview').textContent = words.slice(0, previewCount).join(' ');
    // Bound only this scripted website demo; Mira's real recording limit is user-configurable.
    if (seconds >= 20) stop();
  }

  function start() {
    if (state === 'recording' || state === 'processing') return;
    revision++;
    clearTimers();
    output.value = '';
    copy.disabled = true;
    toast.classList.remove('visible');
    started = performance.now();
    setText($('#pill-state'), 'Listening');
    setText($('#editor-status'), 'Your field stays in focus');
    setText($('#scene-status'), 'A thought taking shape');
    pill.classList.add('visible');
    setState('recording');
    tick();
    interval = setInterval(tick, 90);
    setText(
      $('#demo-announcement'),
      'Simulated recording started. Release the button, or tap again in toggle mode, to deliver the example.',
    );
  }

  function stop() {
    if (state !== 'recording') return;
    clearInterval(interval);
    pointerHolding = keyHolding = false;
    setText($('#pill-state'), 'Finalizing');
    setText($('#editor-status'), 'Finishing the transcript…');
    setState('processing');
    hideTimer = setTimeout(() => pill.classList.remove('visible'), 1000);
    finishTimer = setTimeout(deliver, 520);
  }

  function deliver() {
    typedIndex = 0;
    setText($('#editor-status'), 'Inserting your words…');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      output.value = text();
      complete();
      return;
    }
    typingTimer = setInterval(() => {
      typedIndex += 3;
      output.value = text().slice(0, typedIndex);
      if (typedIndex >= text().length) {
        clearInterval(typingTimer);
        complete();
      }
    }, 18);
  }

  function complete() {
    setState('done');
    copy.disabled = false;
    setText($('#editor-status'), 'Delivered · edit it or copy it');
    setText($('#scene-status'), 'An idea, written.');
    setText(toast.querySelector('span:last-child'), 'Example delivered. Ready to copy.');
    toast.classList.add('visible');
    setText(
      $('#demo-announcement'),
      'Example inserted into the demo field. Nothing was copied to your clipboard automatically. Use Copy text if you want to keep it.',
    );
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 5000);
  }

  function clearTimers() {
    [interval, typingTimer].forEach(clearInterval);
    [finishTimer, hideTimer, toastTimer].forEach(clearTimeout);
  }

  function reset() {
    revision++;
    clearTimers();
    pointerHolding = keyHolding = false;
    output.value = '';
    copy.disabled = true;
    pill.classList.remove('visible');
    toast.classList.remove('visible');
    setText($('#editor-status'), 'Waiting for your words');
    updateSampleLanguage();
    setText($('#scene-time'), '00:00');
    setText($('#scene-status'), 'Ready for your next thought');
    $('#spoken-example').textContent = `“${text()}”`;
    const context = contexts[example];
    ['#editor-category', '#editor-title', '#editor-recipient'].forEach((id, index) => {
      setText($(id), context[index]);
    });
    setText(
      $('#demo-announcement'),
      'Interactive simulation. No microphone access or uploads. Try another example whenever you’re ready.',
    );
    setState('idle');
  }

  button.addEventListener('pointerdown', (event) => {
    if (toggle.checked || event.button !== 0) return;
    pointerHolding = true;
    button.setPointerCapture(event.pointerId);
    start();
  });
  button.addEventListener('pointerup', () => {
    if (pointerHolding) stop();
  });
  button.addEventListener('pointercancel', () => {
    if (pointerHolding) stop();
  });
  button.addEventListener('lostpointercapture', () => {
    if (pointerHolding) stop();
  });
  button.addEventListener('click', (event) => {
    if (toggle.checked) {
      toggleRecording();
    } else if (event.detail === 0 && !keyHolding && ['idle', 'done'].includes(state)) {
      start(); // Assistive-technology click gets a complete short example.
      finishTimer = setTimeout(stop, 1600);
    }
  });
  button.addEventListener('keydown', (event) => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    if (toggle.checked) {
      toggleRecording();
      return;
    }
    keyHolding = true;
    start();
  });
  button.addEventListener('keyup', (event) => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault();
    if (keyHolding) stop();
  });
  button.addEventListener('blur', () => {
    if (keyHolding) stop();
  });
  window.addEventListener('blur', () => {
    if (state === 'recording') stop();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'recording') stop();
  });
  $('#dictation-demo').addEventListener('keydown', (event) => {
    if (event.key === 'Escape') reset();
  });
  toggle.addEventListener('change', () => setState(state));
  $('#reset-demo').addEventListener('click', reset);
  output.addEventListener('input', () => {
    revision++;
    copy.disabled = !output.value.trim();
  });
  document.querySelectorAll('[data-example], [data-demo-language]').forEach((item) => {
    item.addEventListener('click', () => {
      const attribute = item.hasAttribute('data-example') ? 'data-example' : 'data-demo-language';
      document
        .querySelectorAll(`[${attribute}]`)
        .forEach((peer) => peer.setAttribute('aria-pressed', String(peer === item)));
      if (attribute === 'data-example') example = item.dataset.example;
      else language = item.dataset.demoLanguage;
      reset();
    });
  });
  copy.addEventListener('click', async () => {
    const request = ++revision;
    try {
      await navigator.clipboard.writeText(output.value);
      if (request !== revision) return;
      setText($('#demo-announcement'), 'Copied to your clipboard.');
      setText($('#editor-status'), 'Copied · ready to paste');
    } catch {
      if (request !== revision) return;
      output.focus();
      output.select();
      setText(
        $('#demo-announcement'),
        'Clipboard access is unavailable. The text is selected; use your system’s Copy command.',
      );
    }
  });
  function toggleRecording() {
    if (state === 'recording') stop();
    else start();
  }
  function updateSampleLanguage() {
    for (const element of [output, $('#spoken-example'), $('#live-preview')]) {
      element.lang = language === 'pt' ? 'pt-BR' : language;
    }
  }
  updateSampleLanguage();
  setState('idle');
}
