/**
 * Web Audio API synthesizer for Block Blast sound effects
 * Zero external audio files required, zero latency, 100% reliable
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private adMuted: boolean = false;
  private unlocked: boolean = false;

  constructor() {
    // Read saved preference
    const saved = localStorage.getItem('blockblast_muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
    this.installUnlock();
  }

  /**
   * iOS Safari / standalone PWA won't start Web Audio until it is created
   * and resumed inside a real user gesture. Do it once, on the first tap.
   */
  private installUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      const ctx = this.initCtx();
      if (!ctx) return;

      if (!this.unlocked) {
        try {
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          this.unlocked = true;
        } catch {
          // AudioContext safety
        }
      }
    };

    ['pointerdown', 'touchstart', 'click'].forEach((eventName) => {
      window.addEventListener(eventName, unlock, { capture: true, passive: true, once: true });
    });
  }

  public setAdMute(mute: boolean) {
    this.adMuted = mute;
  }

  public isMuted(): boolean {
    return this.muted || this.adMuted;
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('blockblast_muted', String(this.muted));
    if (!this.muted) {
      this.playPickup();
    }
    return this.muted;
  }

  // Play subtle pickup sound
  public playPickup() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // AudioContext safety
    }
  }

  // Play satisfying placement snap
  public playPlace() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Thump component
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);

      // Click transient
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(900, now);
      clickOsc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);

      clickOsc.start(now);
      clickOsc.stop(now + 0.03);
    } catch {
      // safety
    }
  }

  // Play musical line clear chime (pitch rises with combo)
  public playLineClear(lines: number, combo: number) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Pentatonic scale base frequencies: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      const baseIndex = Math.min(combo * 2, notes.length - 3);

      // Play 3 rapid arpeggiated chime notes
      for (let i = 0; i < Math.min(lines + 2, 5); i++) {
        const noteIdx = Math.min(baseIndex + i, notes.length - 1);
        const freq = notes[noteIdx];
        const time = now + i * 0.06;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Bright overtone
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, time);

        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(time);
        osc.stop(time + 0.35);
        osc2.start(time);
        osc2.stop(time + 0.35);
      }
    } catch {
      // safety
    }
  }

  // Play extra combo celebration fanfare
  public playComboFanfare(combo: number) {
    if (this.muted || combo < 2) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime + 0.15;
      const root = 440 * Math.pow(2, (combo % 6) / 12);
      
      const freqs = [root, root * 1.25, root * 1.5, root * 2];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);

        gain.gain.setValueAtTime(0.12, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.4);
      });
    } catch {
      // safety
    }
  }

  // Game over sound
  public playGameOver() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [350, 311, 277, 220];
      
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        const time = now + idx * 0.15;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        // Lowpass filter for warm tone
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, time);

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(time);
        osc.stop(time + 0.28);
      });
    } catch {
      // safety
    }
  }

  public playButton() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // safety
    }
  }
}

export const sound = new SoundEngine();
