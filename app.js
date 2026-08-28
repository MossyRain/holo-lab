(() => {
  const tabs = [...document.querySelectorAll('.tab')];
  const modes = {
    tilt: document.getElementById('tiltMode'),
    stereo: document.getElementById('stereoMode')
  };
  const tiltCard = document.getElementById('tiltCard');
  const sensorBtn = document.getElementById('sensorBtn');
  const sensorStatus = document.getElementById('sensorStatus');
  const resetBtn = document.getElementById('resetBtn');
  const stereoStage = document.getElementById('stereoStage');
  const stereoCards = [...document.querySelectorAll('.stereo-card')];
  const depthValue = document.getElementById('depthValue');
  const phaseValue = document.getElementById('phaseValue');

  let sensorActive = false;
  let stereoDepth = 0;
  let stereoPhase = 50;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  function setMode(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === name));
    Object.entries(modes).forEach(([key, el]) => el.classList.toggle('active', key === name));
  }
  tabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));

  function setTiltVisual(nx, ny) {
    nx = clamp(nx, -1, 1);
    ny = clamp(ny, -1, 1);
    tiltCard.style.setProperty('--x', `${50 + nx * 42}%`);
    tiltCard.style.setProperty('--y', `${50 + ny * 42}%`);
    tiltCard.style.setProperty('--ry', `${nx * 9}deg`);
    tiltCard.style.setProperty('--rx', `${-ny * 9}deg`);
    tiltCard.style.setProperty('--phase', `${50 + nx * 34}%`);
  }

  function pointerToCard(e) {
    const r = tiltCard.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - .5) * 2;
    const ny = ((e.clientY - r.top) / r.height - .5) * 2;
    setTiltVisual(nx, ny);
  }

  let tiltPointer = false;
  tiltCard.addEventListener('pointerdown', e => {
    tiltPointer = true;
    tiltCard.setPointerCapture(e.pointerId);
    pointerToCard(e);
  });
  tiltCard.addEventListener('pointermove', e => { if (tiltPointer) pointerToCard(e); });
  tiltCard.addEventListener('pointerup', () => { tiltPointer = false; });
  tiltCard.addEventListener('pointercancel', () => { tiltPointer = false; });

  function orientationHandler(e) {
    if (!sensorActive) return;
    const gamma = clamp(e.gamma ?? 0, -35, 35);
    const beta = clamp((e.beta ?? 0) - 45, -35, 35);
    setTiltVisual(gamma / 35, beta / 35);
  }

  async function startSensor() {
    try {
      if (typeof DeviceOrientationEvent === 'undefined') {
        sensorStatus.textContent = 'この端末では傾きセンサーを利用できません。タッチ操作をご利用ください。';
        return;
      }
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          sensorStatus.textContent = '傾きセンサーの許可がありません。タッチ操作は利用できます。';
          return;
        }
      }
      if (!sensorActive) {
        window.addEventListener('deviceorientation', orientationHandler, true);
        sensorActive = true;
      }
      sensorBtn.textContent = 'TILT ACTIVE';
      sensorStatus.textContent = '傾きセンサー接続中。端末をゆっくり傾けてください。';
    } catch (err) {
      sensorStatus.textContent = '傾きセンサーを開始できませんでした。Safariで開き、再度お試しください。';
    }
  }
  sensorBtn.addEventListener('click', startSensor);

  function updateStereo() {
    const sep = stereoDepth * 0.12;
    const layers = [
      ['.figure', 1.0],
      ['.orb', 1.55],
      ['.ghost-a', 0.62],
      ['.ghost-b', -0.8],
      ['.radial-lines', -0.45],
      ['.spectral', 0.2]
    ];

    stereoCards.forEach((card, i) => {
      const eye = i === 0 ? -1 : 1;
      card.style.setProperty('--x', `${stereoPhase}%`);
      card.style.setProperty('--y', `${100 - stereoPhase}%`);
      card.style.setProperty('--phase', `${stereoPhase}%`);
      card.querySelectorAll('.shine').forEach(el => {
        el.style.transform = `translateX(${(stereoPhase - 50) * 1.8}%) scale(1.7)`;
      });
      layers.forEach(([sel, factor]) => {
        const el = card.querySelector(sel);
        if (!el) return;
        const dx = eye * sep * factor;
        const baseRotate = sel === '.ghost-a' ? ' rotate(-18deg)' : sel === '.ghost-b' ? ' rotate(25deg)' : '';
        el.style.translate = `${dx}px 0`;
        if (baseRotate) el.style.rotate = '';
      });
    });
    depthValue.textContent = Math.round(stereoDepth);
    phaseValue.textContent = Math.round(stereoPhase);
  }

  let stereoPointer = false;
  let startX = 0, startY = 0, startDepth = 0, startPhase = 50;

  stereoStage.addEventListener('pointerdown', e => {
    stereoPointer = true;
    stereoStage.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    startDepth = stereoDepth;
    startPhase = stereoPhase;
  });
  stereoStage.addEventListener('pointermove', e => {
    if (!stereoPointer) return;
    const r = stereoStage.getBoundingClientRect();
    stereoDepth = clamp(startDepth + (e.clientX - startX) / r.width * 160, -80, 80);
    stereoPhase = clamp(startPhase - (e.clientY - startY) / r.height * 100, 0, 100);
    updateStereo();
  });
  stereoStage.addEventListener('pointerup', () => { stereoPointer = false; });
  stereoStage.addEventListener('pointercancel', () => { stereoPointer = false; });

  resetBtn.addEventListener('click', () => {
    setTiltVisual(0, 0);
    stereoDepth = 0;
    stereoPhase = 50;
    updateStereo();
  });

  setTiltVisual(0, 0);
  updateStereo();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
