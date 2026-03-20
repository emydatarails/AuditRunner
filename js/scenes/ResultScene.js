/* =====================================================
   ResultScene — End Screen & Share Card
   ===================================================== */
'use strict';

class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  init(data) {
    this._stats = data.stats || {};
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this._stats.integrityPct = this._stats.integrityPct || 0;
    const rank = getRank(this._stats.integrityPct);

    // Background
    this.add.rectangle(W/2, H/2, W, H, COLORS.bgPrimary);

    // Background grid
    const g = this.add.graphics();
    g.lineStyle(1, COLORS.border, 0.15);
    for (let x = 0; x < W; x += 80) { g.moveTo(x,0); g.lineTo(x,H); }
    for (let y = 0; y < H; y += 80) { g.moveTo(0,y); g.lineTo(W,y); }
    g.strokePath();

    // Simulated audit trail constellation in background
    this._drawBackgroundTrail();

    // Logo
    this.add.text(20, 16, 'DATARAILS', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '12px', color: '#D4A017', letterSpacing: 4,
    });

    // Rank icon + title
    this.add.text(W/2, 80, rank.icon, {
      fontSize: '56px', color: '#D4A017',
    }).setOrigin(0.5);

    this.add.text(W/2, 150, rank.title, {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '48px', fontStyle: 'bold', color: '#E8E8E8',
      shadow: { offsetX:0, offsetY:0, color:'#D4A017', blur:16, fill:true },
    }).setOrigin(0.5);

    this.add.text(W/2, 202, rank.subtitle, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '14px', color: '#8A8A9A', fontStyle: 'italic',
    }).setOrigin(0.5);

    // Gold rule
    const rule = this.add.graphics();
    rule.lineStyle(1, COLORS.gold, 0.6);
    rule.moveTo(W/2 - 300, 228); rule.lineTo(W/2 + 300, 228); rule.strokePath();

    // Stats grid
    this._drawStats(W, H);

    // Month emoji grid
    this._drawEmojiGrid(W);

    // Share card preview + buttons
    this._setupShareUI(W, H);

    this.cameras.main.fadeIn(500, 13, 17, 23);
    AudioManager.play('auditPass');
  }

  _drawBackgroundTrail() {
    // Static constellation of gold dots for visual richness
    const gfx = this.add.graphics().setDepth(1);
    const count = 120;
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const dots = [];
    for (let i = 0; i < count; i++) {
      dots.push({ x: 40 + Math.random() * (W-80), y: 40 + Math.random() * (H-80) });
    }
    // Lines between nearby dots
    for (let i = 0; i < dots.length; i++) {
      for (let j = i+1; j < dots.length; j++) {
        const dx = dots[j].x - dots[i].x, dy = dots[j].y - dots[i].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 90) {
          gfx.lineStyle(0.5, COLORS.gold, (1 - dist/90) * 0.1);
          gfx.beginPath(); gfx.moveTo(dots[i].x, dots[i].y); gfx.lineTo(dots[j].x, dots[j].y); gfx.strokePath();
        }
      }
    }
    dots.forEach(d => {
      gfx.fillStyle(COLORS.goldLight, 0.25 + Math.random() * 0.3);
      gfx.fillCircle(d.x, d.y, 1.5 + Math.random() * 1.5);
    });
  }

  _drawStats(W, H) {
    const s = this._stats;
    const col1X = W/2 - 280, col2X = W/2 + 40;
    const startY = 255;
    const lineH  = 36;

    const leftStats = [
      { label: 'Consolidated Value',  value: formatScore(s.totalScore   || 0) },
      { label: 'Governed Value',      value: formatScore(s.governedTotal || 0) },
      { label: 'Audit Integrity',     value: `${s.integrityPct || 0}%` },
      { label: 'Months Survived',     value: `${s.monthsPlayed || 0}` },
    ];
    const rightStats = [
      { label: 'Surprise Audits',     value: `${s.auditsSurvived || 0} survived` },
      { label: 'Material Weaknesses', value: `${s.materialWeaknesses || 0}` },
      { label: 'AI Core Activations', value: `${s.aiActivations || 0}` },
      { label: 'Total Strikes',       value: `${s.totalStrikes || 0}` },
    ];

    const drawStat = (x, y, label, value, valueColor) => {
      this.add.text(x, y, label + ':', {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '12px', color: '#8A8A9A',
      }).setDepth(5);
      this.add.text(x + 220, y, value, {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '13px', fontStyle: 'bold', color: valueColor || '#E8E8E8',
      }).setDepth(5);
    };

    leftStats.forEach((row, i) => {
      const vc = row.label === 'Audit Integrity'
        ? (s.integrityPct >= 75 ? '#2ECC71' : s.integrityPct >= 50 ? '#E67E22' : '#E74C3C')
        : '#E8E8E8';
      drawStat(col1X, startY + i * lineH, row.label, row.value, vc);
    });
    rightStats.forEach((row, i) => {
      const vc = row.label === 'Material Weaknesses' && (s.materialWeaknesses || 0) > 0
        ? '#E74C3C' : '#E8E8E8';
      drawStat(col2X, startY + i * lineH, row.label, row.value, vc);
    });

    // Integrity bar
    const barY = startY + 4 * lineH + 10;
    const barX = col1X, barW = 560, barH = 12;
    const barGfx = this.add.graphics().setDepth(5);
    barGfx.fillStyle(COLORS.border, 1);
    barGfx.fillRoundedRect(barX, barY, barW, barH, 4);
    const ip = s.integrityPct || 0;
    const fillColor = ip >= 75 ? COLORS.gold : ip >= 50 ? COLORS.yellowUnverified : COLORS.redLight;
    if (ip > 0) {
      barGfx.fillStyle(fillColor, 1);
      barGfx.fillRoundedRect(barX, barY, (ip/100)*barW, barH, 4);
    }
    this.add.text(barX + barW + 10, barY + 6, `${ip}% GOVERNED`, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '11px', color: '#' + fillColor.toString(16).padStart(6,'0'),
    }).setOrigin(0, 0.5).setDepth(5);
  }

  _drawEmojiGrid(W) {
    const history = this._stats.monthHistory || [];
    if (history.length === 0) return;

    this.add.text(W/2, 435, 'MONTHLY PERFORMANCE', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: '#8A8A9A', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(5);

    const emojis = history.map(m => m.emoji);
    const spacing = Math.min(38, (W - 120) / Math.max(emojis.length, 1));
    const totalW  = emojis.length * spacing;
    const startX  = W/2 - totalW/2 + spacing/2;

    emojis.forEach((emoji, i) => {
      this.add.text(startX + i * spacing, 462, emoji, {
        fontSize: '22px',
      }).setOrigin(0.5).setDepth(5);
    });
  }

  _setupShareUI(W, H) {
    // Generate share card
    this._shareCanvas = ShareCard.generate(this._stats);

    // Buttons row
    const btnY = H - 54;
    const buttons = [
      {
        label: '▶ PLAY AGAIN',
        color: COLORS.gold,
        action: () => { this.scene.start('MenuScene'); },
      },
      {
        label: '⬇ DOWNLOAD PNG',
        color: COLORS.greenLight,
        action: () => { ShareCard.download(this._shareCanvas); },
      },
      {
        label: '⧉ COPY CARD',
        color: COLORS.blueLight,
        action: async () => {
          const ok = await ShareCard.copyToClipboard(this._shareCanvas);
          this._showCopyFeedback(ok);
        },
      },
      {
        label: '🔗 SHARE LINKEDIN',
        color: COLORS.blueLight,
        action: () => {
          const caption = encodeURIComponent(ShareCard.buildCaption(this._stats));
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=https://datarails.com/audit-runner`, '_blank');
        },
      },
    ];

    const btnW = 180, btnH = 44, gap = 16;
    const totalW = buttons.length * btnW + (buttons.length-1) * gap;
    const startX = W/2 - totalW/2;

    buttons.forEach((btn, i) => {
      const bx = startX + i * (btnW + gap) + btnW/2;
      const hexColor = '#' + btn.color.toString(16).padStart(6,'0');

      const g = this.add.graphics().setDepth(10);
      g.lineStyle(1, btn.color, 0.8);
      g.strokeRect(bx - btnW/2, btnY - btnH/2, btnW, btnH);

      const t = this.add.text(bx, btnY, btn.label, {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '12px', color: hexColor,
      }).setOrigin(0.5).setDepth(11);

      const zone = this.add.zone(bx, btnY, btnW, btnH).setInteractive().setDepth(12);
      zone.on('pointerover', () => {
        g.clear();
        g.fillStyle(btn.color, 0.12);
        g.fillRect(bx-btnW/2, btnY-btnH/2, btnW, btnH);
        g.lineStyle(1, btn.color, 1);
        g.strokeRect(bx-btnW/2, btnY-btnH/2, btnW, btnH);
        this.game.canvas.style.cursor = 'pointer';
      });
      zone.on('pointerout', () => {
        g.clear();
        g.lineStyle(1, btn.color, 0.8);
        g.strokeRect(bx-btnW/2, btnY-btnH/2, btnW, btnH);
        this.game.canvas.style.cursor = 'default';
      });
      zone.on('pointerdown', btn.action);
    });

    // Powered by
    this.add.text(W/2, H - 12, 'Powered by Datarails FinanceOS  ·  datarails.com/audit-runner', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: '#D4A017', alpha: 0.7,
    }).setOrigin(0.5, 1).setDepth(5);
  }

  _showCopyFeedback(success) {
    const msg = success ? '✓ Card copied to clipboard!' : '✗ Copy failed — try Download instead';
    const color = success ? '#2ECC71' : '#E74C3C';
    const t = this.add.text(GAME_WIDTH/2, GAME_HEIGHT - 100, msg, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '13px', color,
    }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: 1800,
      onComplete: () => t.destroy() });
  }

  shutdown() {
    this.game.canvas.style.cursor = 'default';
  }
}
