import { capsule, multiply, perspective, rotation, torus, transform } from './geometry.js';
import { createRenderer, material } from './gl.js';
import { setText, setLabel } from './i18n.js';

export function initScene() {
  const container = document.querySelector('#hero-art');
  const canvas = document.querySelector('#voice-scene');
  const pauseButton = document.querySelector('#motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try {
    renderer = createRenderer(canvas);
  } catch {
    return fallback();
  }

  const meshes = {
    shell: renderer.upload(capsule(2.05, 0.86)),
    face: renderer.upload(capsule(1.92, 0.67)),
    bar: renderer.upload(capsule(0.5, 0.5)),
    sphere: renderer.upload(capsule(0, 1)),
    orbit: renderer.upload(torus(3.53, 0.012)),
  };
  const colors = {
    shell: material('d7e4cb', 1.15),
    face: material('132822', 0.48),
    bars: material('b29aef', 0.7),
    light: material('d8f3a4', 0.5),
    orbit: material('a9b79e', 0.1),
    ball: material('bba3df', 1.2),
  };
  let yaw = -0.27,
    pitch = 0.3,
    paused = reduced.matches,
    recording = false;
  let visible = true,
    frame = 0,
    drag = null,
    lastTime = 0,
    phase = 0,
    destroyed = false;
  container.dataset.renderer = 'webgl';

  function drawPart(mesh, position, scale, color, angle = 0) {
    renderer.draw(meshes[mesh], transform(position, scale, angle), colors[color], scale);
  }

  function render(time) {
    frame = 0;
    if (destroyed) return;
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (!paused) phase += delta;
    const float = paused ? 0 : Math.sin(phase * 0.65) * 0.035;
    const global = rotation(pitch + float, yaw + float, -0.3);
    renderer.begin(perspective(canvas.width / canvas.height), transform([0, 0, -10.2]), global);
    renderer.draw(
      meshes.orbit,
      multiply(rotation(0.88, 0.35, 0), transform([0, 0, -0.12])),
      colors.orbit,
      [1, 1, 1],
    );
    drawPart('shell', [0, 0, 0], [1, 1, 0.84], 'shell');
    drawPart('face', [0, 0, 0.58], [1, 1, 0.34], 'face');
    drawWave();
    drawPart('sphere', [-2.15, 0, 0.84], [0.065, 0.065, 0.045], 'light');
    drawPart('bar', [2.13, 0, 0.84], [0.14, 0.04, 0.045], 'shell', Math.PI / 2);
    drawPart('sphere', [2.72, 1.67 + float, -0.25], [0.17, 0.17, 0.17], 'ball');
    drawPart('sphere', [-2.85, -1.38 - float, 0.5], [0.095, 0.095, 0.095], 'light');
    container.dataset.frames = String(Number(container.dataset.frames || 0) + 1);
    if (visible && !document.hidden && !paused) requestFrame();
  }

  function drawWave() {
    for (let i = 0; i < 17; i++) {
      const envelope = Math.sin(((i + 1) / 18) * Math.PI);
      const wave = Math.sin(phase * (recording ? 6 : 2.1) + i * 0.66);
      const height = 0.17 + envelope * (0.3 + (wave + 1) * (recording ? 0.28 : 0.16));
      drawPart('bar', [(i - 8) * 0.175, 0, 0.88], [height / 2, 0.083, 0.078], 'bars', Math.PI / 2);
    }
  }

  function requestFrame() {
    if (!frame && !destroyed) frame = requestAnimationFrame(render);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    requestFrame();
  }
  function updatePause() {
    pauseButton.setAttribute('aria-pressed', String(paused));
    setLabel(pauseButton, 'aria-label', `${paused ? 'Resume' : 'Pause'} ambient 3D motion`);
    setText(pauseButton, paused ? 'Resume motion' : 'Pause motion');
    requestFrame();
  }
  pauseButton.addEventListener('click', () => {
    paused = !paused;
    updatePause();
  });
  reduced.addEventListener('change', (event) => {
    paused = event.matches;
    updatePause();
  });
  document.querySelector('#rotate-scene').addEventListener('click', () => {
    yaw += 0.25;
    requestFrame();
  });
  document.querySelector('#reset-scene').addEventListener('click', () => {
    yaw = -0.27;
    pitch = 0.3;
    requestFrame();
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, yaw, pitch };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    yaw = drag.yaw + (event.clientX - drag.x) * 0.007;
    pitch = Math.max(-0.9, Math.min(0.9, drag.pitch + (event.clientY - drag.y) * 0.007));
    requestFrame();
  });
  const endDrag = () => {
    drag = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) requestFrame();
  });
  observer.observe(container);
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && visible) requestFrame();
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    destroyed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    sizeObserver.disconnect();
    fallback();
  });
  updatePause();
  resize();
  return {
    setRecording(value) {
      recording = value;
      requestFrame();
    },
  };

  function fallback() {
    container.dataset.renderer = 'fallback';
    setText(document.querySelector('#scene-hint'), 'A LITTLE SPACE FOR YOUR VOICE');
    document.querySelectorAll('.scene-controls button').forEach((button) => {
      button.hidden = true;
    });
    return { setRecording() {} };
  }
}
