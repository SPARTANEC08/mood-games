(() => {
  const KEY = 'mood-games-sound-v2';
  const btn = document.getElementById('sound-toggle');
  const label = document.getElementById('sound-label');
  let on = true;
  let ctx = null;
  let pointerSound = false;

  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'off') on = false;
  } catch {}

  function apply() {
    if (btn) {
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    if (label) label.textContent = on ? 'Sound on' : 'Sound off';
  }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, delay, duration, volume = 0.035) {
    if (!on) return;
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  function click() {
    tone(320, 0, 0.055, 0.028);
  }

  function coin() {
    tone(880, 0, 0.07, 0.045);
    tone(1320, 0.07, 0.16, 0.045);
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    apply();
    if (on) coin();
  }

  if (btn) btn.addEventListener('click', toggle);

  // Монетка срабатывает на pointerdown — до перехода по ссылке.
  document.addEventListener('pointerdown', (event) => {
    const el = event.target.closest('.play, .cab-screen');
    if (!el || el.classList.contains('disabled')) return;
    pointerSound = true;
    coin();
    setTimeout(() => { pointerSound = false; }, 350);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    const el = event.target.closest('a,button');
    if (!el || el.id === 'sound-toggle') return;
    if (el.classList.contains('play') || el.classList.contains('cab-screen')) {
      if (pointerSound) return;
      coin();
      return;
    }
    click();
  });

  apply();
})();
