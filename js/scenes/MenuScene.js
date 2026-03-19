/* =====================================================
   MenuScene — Title Screen
   ===================================================== */

'use strict';

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this._started = false;
  }

  create() {
    this._started = false;
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const cx = W / 2;

    // ─── Background ───────────────────────────────────
    this.add.rectangle(cx, H / 2, W, H, COLORS.bgPrimary);

    // Subtle grid lines for the terminal feel
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, COLORS.border, 0.25);
    for (let x = 0; x < W; x += 80) {
      gridGfx.moveTo(x, 0); gridGfx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += 80) {
      gridGfx.moveTo(0, y); gridGfx.lineTo(W, y);
    }
    gridGfx.strokePath();

    // ─── Datarails Logo (top-left) ────────────────────
    this.add.text(24, 20, 'DATARAILS', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '13px',
      color: '#D4A017',
      letterSpacing: 4,
    });

    // ─── Glowing Hex Icon (center, upper) ─────────────
    const hexGfx = this.add.graphics();
    this._drawGlowHex(hexGfx, cx, H / 2 - 160, 36);

    this.tweens.add({
      targets: hexGfx,
      alpha: { from: 0.7, to: 1 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ─── Title ────────────────────────────────────────
    const title = this.add.text(cx, H / 2 - 85, 'AUDIT RUNNER', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#E8E8E8',
      shadow: { offsetX: 0, offsetY: 0, color: '#D4A017', blur: 20, fill: true },
    }).setOrigin(0.5);

    // ─── Subtitle ─────────────────────────────────────
    this.add.text(cx, H / 2 + 8, 'The FinanceOS Protocol', {
      fontFamily: '"Playfair Display", Georgia, serif',
      fontSize: '28px',
      fontStyle: 'italic',
      color: '#D4A017',
    }).setOrigin(0.5);

    // ─── Tagline ──────────────────────────────────────
    this.add.text(cx, H / 2 + 54, '"In the world of Finance, Truth is the only Currency."', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '14px',
      fontStyle: 'italic',
      color: '#8A8A9A',
    }).setOrigin(0.5);

    // ─── Gold Rule ────────────────────────────────────
    const rule = this.add.graphics();
    rule.lineStyle(1, COLORS.gold, 0.6);
    rule.moveTo(cx - 280, H / 2 + 90);
    rule.lineTo(cx + 280, H / 2 + 90);
    rule.strokePath();

    // ─── How to Play mini-guide ───────────────────────
    const howToLines = [
      '  CLICK / TAP blocks to catch them',
      '  SPACE BAR toggles the Governance Gate',
      '  Gate ON = governed data, gold trail, safety',
      '  Gate OFF = chaos mode — avoid Red blocks!',
    ];
    const howTo = this.add.text(cx, H / 2 + 130, howToLines.join('\n'), {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '12px',
      color: '#8A8A9A',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // ─── Press to Start ───────────────────────────────
    const pressText = this.add.text(cx, H / 2 + 230, '[ PRESS SPACE OR TAP TO BEGIN ]', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '14px',
      color: '#D4A017',
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pressText,
      alpha: { from: 1, to: 0.2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ─── Block legend ─────────────────────────────────
    this._drawLegend(cx, H / 2 + 280);

    // ─── Bottom Attribution ───────────────────────────
    this.add.text(cx, H - 20, 'Powered by Datarails FinanceOS', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '12px',
      color: '#D4A017',
      alpha: 0.7,
    }).setOrigin(0.5);

    // ─── Version / build info ─────────────────────────
    this.add.text(W - 12, H - 8, 'v1.0', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '10px',
      color: '#2A2A3A',
    }).setOrigin(1, 1);

    // ─── Input ────────────────────────────────────────
    this.input.keyboard.on('keydown-SPACE', this._startGame, this);
    this.input.on('pointerdown', this._startGame, this);

    // Fade in
    this.cameras.main.fadeIn(400, 13, 17, 23);
  }

  _drawLegend(cx, y) {
    const items = [
      { color: COLORS.greenVerified,    border: COLORS.greenLight,       label: '▪ VERIFIED' },
      { color: COLORS.yellowDark,       border: COLORS.yellowUnverified, label: '⚠ UNVERIFIED' },
      { color: 0x4A0000,                border: COLORS.redShadow,        label: '✕ SHADOW' },
      { color: COLORS.bluePL,           border: COLORS.blueLight,        label: '◈ P&L' },
    ];
    const blockW = 110;
    const blockH = 28;
    const gap = 16;
    const totalW = items.length * blockW + (items.length - 1) * gap;
    const startX = cx - totalW / 2;

    items.forEach((item, i) => {
      const bx = startX + i * (blockW + gap);
      const gfx = this.add.graphics();
      gfx.fillStyle(item.color, 1);
      gfx.fillRoundedRect(bx, y, blockW, blockH, 4);
      gfx.lineStyle(1, item.border, 0.9);
      gfx.strokeRoundedRect(bx, y, blockW, blockH, 4);

      this.add.text(bx + blockW / 2, y + blockH / 2, item.label, {
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontSize: '10px',
        color: '#E8E8E8',
      }).setOrigin(0.5);
    });
  }

  _drawGlowHex(gfx, cx, cy, r) {
    // Outer glow
    gfx.lineStyle(8, COLORS.gold, 0.1);
    this._hexPath(gfx, cx, cy, r + 10);
    gfx.strokePath();
    // Mid glow
    gfx.lineStyle(4, COLORS.gold, 0.3);
    this._hexPath(gfx, cx, cy, r + 4);
    gfx.strokePath();
    // Main hex
    gfx.lineStyle(2, COLORS.goldLight, 0.9);
    this._hexPath(gfx, cx, cy, r);
    gfx.strokePath();
    // Inner
    gfx.lineStyle(1, COLORS.gold, 0.5);
    this._hexPath(gfx, cx, cy, r * 0.65);
    gfx.strokePath();
    // Center dot
    gfx.fillStyle(COLORS.gold, 0.8);
    gfx.fillCircle(cx, cy, 4);
  }

  _hexPath(gfx, cx, cy, r) {
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) gfx.moveTo(x, y); else gfx.lineTo(x, y);
    }
    gfx.closePath();
  }

  _startGame() {
    if (this._started) return;
    this._started = true;

    // Resume audio on first interaction
    AudioManager.resume();
    AudioManager.play('gateToggleOn');

    this.cameras.main.fadeOut(300, 13, 17, 23);
    this.time.delayedCall(320, () => {
      this.input.keyboard.off('keydown-SPACE', this._startGame, this);
      this.input.off('pointerdown', this._startGame, this);
      this.scene.start('GameScene');
    });
  }

  shutdown() {
    this.input.keyboard.off('keydown-SPACE', this._startGame, this);
    this.input.off('pointerdown', this._startGame, this);
  }
}
