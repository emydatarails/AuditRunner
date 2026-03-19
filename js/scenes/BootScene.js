/* =====================================================
   BootScene — Initialize & Font Loading
   ===================================================== */

'use strict';

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // No binary assets to preload — all graphics are procedural
    // Fonts load via CSS @import, confirmed via document.fonts.ready in main.js
  }

  create() {
    // Initialize audio context (must be after user gesture, but we try early)
    // It will be fully initialized on first user interaction
    AudioManager.init();

    // Create a simple loading/init graphic
    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, width, height, COLORS.bgPrimary);

    const hexGfx = this.add.graphics();
    this._drawHex(hexGfx, width / 2, height / 2, 30, COLORS.gold, 0.6);

    const loadText = this.add.text(width / 2, height / 2 + 60, 'INITIALIZING FINANCEOS PROTOCOL...', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '12px',
      color: '#8A8A9A',
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
      targets: loadText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Short delay, then go to menu
    this.time.delayedCall(800, () => {
      this.scene.start('MenuScene');
    });
  }

  _drawHex(gfx, cx, cy, r, color, alpha = 1) {
    gfx.lineStyle(2, color, alpha);
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) gfx.moveTo(x, y);
      else gfx.lineTo(x, y);
    }
    gfx.closePath();
    gfx.strokePath();
  }
}
