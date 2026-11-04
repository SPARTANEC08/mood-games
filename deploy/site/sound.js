(() => {
  const KEY = 'mood-games-sound';
  const btn = document.getElementById('sound-toggle');
  const label = document.getElementById('sound-label');
  let on = false;
  let ctx = null;

  try { on = localStorage.getItem(KEY) === 'on'; } catch {}

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

  function tone(freq, delay, duration, volume = 0.03) {
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
    if (!on) return;
    tone(320, 0, 0.055, 0.025);
  }

  function coin() {
    if (!on) return;
    tone(880, 0, 0.07, 0.04);
    tone(1320, 0.07, 0.16, 0.04);
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    apply();
    if (on) coin();
  }

  if (btn) btn.addEventListener('click', toggle);

  document.addEventListener('click', (event) => {
    const el = event.target.closest('a,button');
    if (!el || el.id === 'sound-toggle') return;
    const card = el.closest('.game-card');
    if (el.classList.contains('play') || (card && el.classList.contains('cover'))) coin();
    else click();
  });

  apply();
})();
