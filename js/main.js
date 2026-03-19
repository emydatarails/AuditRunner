/* =====================================================
   AUDIT RUNNER — Phaser Game Configuration
   ===================================================== */

'use strict';

// Global AudioManager — Web Audio API tones
const AudioManager = {
  ctx: null,
  bgOscillators: [],
  bgGain: null,
  muted: false,

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgGain = this.ctx.createGain();
      this.bgGain.gain.value = 0.06;
      this.bgGain.connect(this.ctx.destination);
    } catch(e) {
      console.warn('Web Audio not available:', e);
    }
    return this;
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  playTone(freq, type = 'sine', duration = 0.2, volume = 0.25, attack = 0.005, release = 0.08) {
    if (!this.ctx || this.muted) return;
    try {
      const osc  = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 4000;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch(e) {}
  },

  playChord(freqs, type = 'sine', duration = 0.4, volume = 0.15) {
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, type, duration, volume), i * 60);
    });
  },

  // ─── Named Sounds ─────────────────────────────────
  play(name) {
    if (!this.ctx || this.muted) return;
    switch(name) {
      case 'gateToggleOn':
        this.playTone(440, 'square', 0.08, 0.2);
        setTimeout(() => this.playTone(660, 'square', 0.08, 0.15), 60);
        break;
      case 'gateToggleOff':
        this.playTone(330, 'square', 0.08, 0.2);
        setTimeout(() => this.playTone(220, 'square', 0.08, 0.15), 60);
        break;
      case 'blockSnap':
        this.playTone(523, 'sine', 0.12, 0.2);
        break;
      case 'blockSnapGold':
        this.playTone(659, 'sine', 0.18, 0.22);
        setTimeout(() => this.playTone(784, 'sine', 0.12, 0.15), 80);
        break;
      case 'blockRejected':
        this.playTone(180, 'sawtooth', 0.15, 0.25);
        break;
      case 'blockUngoverned':
        this.playTone(200, 'sawtooth', 0.2, 0.3);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.15, 0.25), 80);
        break;
      case 'blockMiss':
        this.playTone(300, 'sine', 0.1, 0.1);
        break;
      case 'auditEntry':
        this.playChord([220, 277, 330], 'sine', 0.5, 0.18);
        break;
      case 'auditPass':
        this.playChord([523, 659, 784], 'sine', 0.7, 0.2);
        break;
      case 'auditFail':
        this.playChord([440, 330, 220], 'sawtooth', 0.5, 0.2);
        break;
      case 'aiCoreUnlock':
        [523, 659, 784, 1047].forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.4, 0.2), i * 120);
        });
        break;
      case 'materialWeakness':
        this.playTone(80, 'sawtooth', 0.6, 0.4);
        setTimeout(() => this.playTone(60, 'sawtooth', 0.4, 0.35), 200);
        break;
      case 'monthClose':
        this.playTone(698, 'sine', 0.35, 0.25);
        setTimeout(() => this.playTone(880, 'sine', 0.35, 0.2), 180);
        break;
      case 'systemCrash':
        this.playTone(440, 'sawtooth', 0.4, 0.35);
        setTimeout(() => this.playTone(220, 'sawtooth', 0.5, 0.4), 150);
        setTimeout(() => this.playTone(110, 'sawtooth', 0.6, 0.45), 300);
        break;
      case 'strike1':
        this.playTone(440, 'sawtooth', 0.3, 0.3);
        break;
      case 'strike2':
        this.playTone(330, 'sawtooth', 0.4, 0.35);
        setTimeout(() => this.playTone(220, 'sawtooth', 0.3, 0.3), 150);
        break;
      case 'strike3':
        this.play('materialWeakness');
        break;
      case 'multiplier':
        this.playChord([784, 880, 1047], 'sine', 0.3, 0.15);
        break;
      case 'surge':
        this.playTone(220, 'sawtooth', 0.5, 0.35);
        setTimeout(() => this.playTone(330, 'sawtooth', 0.4, 0.3), 100);
        break;
      case 'aiCoreTick':
        this.playTone(880, 'sine', 0.1, 0.1);
        break;
    }
  },

  startAmbient(month = 1) {
    if (!this.ctx || this.muted) return;
    this.stopAmbient();
    const baseFreq = 55 + (month - 1) * 2;
    try {
      // Sub-bass drone
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.value = baseFreq;
      osc1.connect(this.bgGain);
      osc1.start();
      this.bgOscillators.push(osc1);

      // Harmonic
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = baseFreq * 1.5;
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.03;
      osc2.connect(g2);
      g2.connect(this.ctx.destination);
      osc2.start();
      this.bgOscillators.push(osc2);
    } catch(e) {}
  },

  stopAmbient() {
    this.bgOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
    this.bgOscillators = [];
  },

  setAmbientMonth(month) {
    this.startAmbient(month);
  },
};

// ─── Phaser Game Config ───────────────────────────────
const PhaserConfig = {
  type: Phaser.AUTO,
  width:  GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0D1117',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [BootScene, MenuScene, GameScene, AuditScene, ResultScene],
  callbacks: {
    postBoot: (game) => {
      window.gameInstance = game;
      // Hide loading screen
      const ls = document.getElementById('loading-screen');
      if (ls) {
        ls.classList.add('hidden');
        setTimeout(() => ls.remove(), 600);
      }
    }
  },
};

// ─── Launch ───────────────────────────────────────────
window.addEventListener('load', () => {
  // Check kiosk mode
  const params = new URLSearchParams(window.location.search);
  window.KIOSK_MODE = params.get('kiosk') === 'true';
  if (window.KIOSK_MODE) {
    document.body.classList.add('kiosk-mode');
  }

  // Wait for fonts then boot
  document.fonts.ready.then(() => {
    window.game = new Phaser.Game(PhaserConfig);
  });
});
