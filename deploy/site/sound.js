(() => {
  const KEY = 'mood-games-sound-v3';
  const btn = document.getElementById('sound-toggle');
  const label = document.getElementById('sound-label');
  let on = true;
  let ctx = null;
  let unlocked = false;

  try {
    if (localStorage.getItem(KEY) === 'off') on = false;
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
    return ctx;
  }

  // iOS/Safari: контекст надо создать и разбудить внутри жеста.
  function unlock() {
    const ac = audio();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    if (!unlocked) {
      try {
        const buffer = ac.createBuffer(1, 1, 22050);
        const source = ac.createBufferSource();
        source.buffer = buffer;
        source.connect(ac.destination);
        source.start(0);
        unlocked = true;
      } catch {}
    }
  }

  ['pointerdown', 'touchstart', 'click'].forEach((eventName) => {
    document.addEventListener(eventName, unlock, { capture: true, passive: true, once: true });
  });

  function tone(freq, delay, duration, volume = 0.035) {
    if (!on) return;
    const ac = audio();
    if (!ac) return;

    const play = () => {
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
    };

    if (ac.state === 'suspended') ac.resume().then(play).catch(() => {});
    else play();
  }

  function click() {
    tone(320, 0, 0.055, 0.028);
  }

  function coin() {
    tone(880, 0, 0.07, 0.045);
    tone(1320, 0.07, 0.16, 0.045);
  }

  function toggle() {
    if (on) {
      coin();
      on = false;
    } else {
      on = true;
      coin();
    }
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    apply();
  }

  if (btn) btn.addEventListener('click', toggle);

  document.addEventListener('click', (event) => {
    const el = event.target.closest('a,button');
    if (!el || el.id === 'sound-toggle') return;

    const gameLink = el.closest('a.play, a.cab-screen');
    const modifier = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (gameLink && !modifier && gameLink.origin === location.origin) {
      event.preventDefault();
      if (!on) {
        location.href = gameLink.href;
        return;
      }
      coin();
      setTimeout(() => { location.href = gameLink.href; }, 140);
      return;
    }

    if (el.classList.contains('play') || el.classList.contains('cab-screen')) coin();
    else click();
  });

  apply();
})();
