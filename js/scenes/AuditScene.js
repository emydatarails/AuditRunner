/* =====================================================
   AuditScene — Surprise Audit Boss Battle Overlay
   ===================================================== */
'use strict';

class AuditScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AuditScene' });
  }

  init(data) {
    this._hasTrail  = data.hasTrail;
    this._dialogue  = data.dialogue;
    this._month     = data.month;
    this._timer     = 6;
    this._done      = false;
    this._spreadsheetEl = null;
  }

  create() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Dim overlay
    this._overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setDepth(80);

    // Auditor figure (geometric — walks in from right)
    this._auditorGfx = this.add.graphics().setDepth(82);
    this._drawAuditor(this._auditorGfx);
    this._auditorGfx.setPosition(W + 80, 0);

    this.tweens.add({
      targets: this._auditorGfx,
      x: W * 0.72,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => this._startAudit(),
    });
  }

  _drawAuditor(gfx) {
    // Geometric suited figure
    const cx = 0, cy = H / 2 - 20;
    // Head
    gfx.fillStyle(0xE8D5B0, 1);
    gfx.fillCircle(cx, cy - 90, 22);
    // Body (suit)
    gfx.fillStyle(0x161B22, 1);
    gfx.fillRect(cx - 22, cy - 68, 44, 70);
    // Suit lapels
    gfx.fillStyle(0x2A2A3A, 1);
    gfx.fillTriangle(cx - 22, cy - 68, cx, cy - 48, cx - 8, cy - 20);
    gfx.fillTriangle(cx + 22, cy - 68, cx, cy - 48, cx + 8, cy - 20);
    // Tie
    gfx.fillStyle(COLORS.gold, 1);
    gfx.fillTriangle(cx - 3, cy - 55, cx + 3, cy - 55, cx, cy - 25);
    // Legs
    gfx.fillStyle(0x0D1117, 1);
    gfx.fillRect(cx - 16, cy + 2, 13, 55);
    gfx.fillRect(cx + 3,  cy + 2, 13, 55);
    // Briefcase
    gfx.fillStyle(0x5D3A00, 1);
    gfx.fillRect(cx + 22, cy + 10, 28, 20);
    gfx.lineStyle(1, COLORS.gold, 0.8);
    gfx.strokeRect(cx + 22, cy + 10, 28, 20);
    // Pointing arm
    gfx.fillStyle(0xE8D5B0, 1);
    gfx.fillRect(cx - 40, cy - 40, 22, 8);
    // Finger point
    gfx.fillCircle(cx - 42, cy - 36, 4);
  }

  _startAudit() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    // Dialogue bubble
    const bubbleX = W * 0.72 - 160, bubbleY = H / 2 - 160;
    const bubbleW = 340, bubbleH = 80;
    const bubbleGfx = this.add.graphics().setDepth(83);
    bubbleGfx.fillStyle(COLORS.bgSecondary, 0.97);
    bubbleGfx.fillRoundedRect(bubbleX - bubbleW/2, bubbleY - bubbleH/2, bubbleW, bubbleH, 8);
    bubbleGfx.lineStyle(1, COLORS.gold, 0.8);
    bubbleGfx.strokeRoundedRect(bubbleX - bubbleW/2, bubbleY - bubbleH/2, bubbleW, bubbleH, 8);
    // Tail
    bubbleGfx.fillTriangle(bubbleX + bubbleW/2 - 10, bubbleY + 10, bubbleX + bubbleW/2 + 20, bubbleY + 30, bubbleX + bubbleW/2 - 10, bubbleY + 30);

    this.add.text(bubbleX, bubbleY, this._dialogue, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '12px', color: '#E8E8E8',
      wordWrap: { width: bubbleW - 24 }, align: 'center',
    }).setOrigin(0.5).setDepth(84);

    // Countdown timer
    this._timerText = this.add.text(W/2, H / 2 + 140, '6', {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '48px', fontStyle: 'bold', color: '#E74C3C',
    }).setOrigin(0.5).setDepth(84);

    // "THE EXTERNAL AUDITOR" label
    this.add.text(W * 0.72, H / 2 + 80, 'THE EXTERNAL AUDITOR', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: '#8A8A9A', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(84);

    // Start countdown
    this._timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: this._tickTimer, callbackScope: this,
    });

    // Brief pause then show scenario
    this.time.delayedCall(1200, () => {
      if (this._hasTrail) this._scenarioA();
      else                this._scenarioB();
    });
  }

  _tickTimer() {
    if (this._done) return;
    this._timer--;
    if (this._timerText) this._timerText.setText(`${this._timer}`);
    if (this._timer <= 0) {
      this._timerEvent.remove();
      if (!this._done) this._fail();
    }
  }

  // ─── Scenario A: Audit Trail exists ───────────────────
  _scenarioA() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;

    const label = this.add.text(W/2, H/2, 'Tracing audit trail...', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '16px', color: '#D4A017',
    }).setOrigin(0.5).setDepth(84);

    // Animate golden path from ledger center upward
    const pathGfx = this.add.graphics().setDepth(83);
    let progress = 0;
    const startY = GAME_FIELD_BOTTOM - 55;
    const endY   = H * 0.2;

    const pathTween = this.tweens.addCounter({
      from: 0, to: 1, duration: 1800, ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const p = tween.getValue();
        pathGfx.clear();
        pathGfx.lineStyle(3, COLORS.gold, 0.8);
        pathGfx.beginPath();
        pathGfx.moveTo(W/2, startY);
        // Wavy golden path upward
        for (let i = 0; i <= 20; i++) {
          const t = i / 20 * p;
          const py = startY - (startY - endY) * t;
          const px = W/2 + Math.sin(t * Math.PI * 4) * 60;
          pathGfx.lineTo(px, py);
        }
        pathGfx.strokePath();
        // Glow dots along path
        pathGfx.fillStyle(COLORS.goldLight, 0.9);
        const tp = p;
        const dotY = startY - (startY - endY) * tp;
        const dotX = W/2 + Math.sin(tp * Math.PI * 4) * 60;
        pathGfx.fillCircle(dotX, dotY, 5);
      },
      onComplete: () => {
        label.setText('Audit trail verified. Source confirmed.');
        label.setColor('#2ECC71');
        this.time.delayedCall(1500, () => this._pass());
      },
    });
  }

  // ─── Scenario B: No trail — spreadsheet mini-game ─────
  _scenarioB() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this._timerEvent.remove();
    this._timer = 6;
    this._timerEvent = this.time.addEvent({
      delay: 1000, loop: true, callback: this._tickTimer, callbackScope: this,
    });

    const label = this.add.text(W/2, H * 0.25,
      'No audit trail found.\nFind the correct figure — 6 seconds.',
      {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '14px', color: '#E74C3C', align: 'center',
      }
    ).setOrigin(0.5).setDepth(84);

    this._buildSpreadsheet();
  }

  _buildSpreadsheet() {
    const tabs = ['Summary','Final','Final_v2','REAL_Final','USE_THIS_ONE'];
    const headers = ['Region','Q1 Revenue','Q2 Revenue','Variance','Notes','IGNORE','DO NOT USE'];
    const data = [
      ['EMEA','$1.2M','$1.8M','50%','See tab 3','???','old'],
      ['APAC','$840K','$910K','8.3%','Revised','check email','#REF!'],
      ['NAM','$3.1M','$2.9M','-6.5%','FINAL','use v7','$3.4M?'],
      ['LATAM','€210K','€190K','-9.5%','TBD','ask London','N/A'],
      ['TOTAL','$5.35M','$5.79M','8.2%','#VALUE!','N/A','CORRECT →'],
    ];

    // Correct cell = row 4 (TOTAL), col 1 (Q1 Revenue) or randomize
    const correctRow = Math.floor(Math.random() * 4);
    const correctCol = 1 + Math.floor(Math.random() * 2);

    const el = document.getElementById('audit-spreadsheet');
    if (!el) { this._fail(); return; }
    this._spreadsheetEl = el;

    // Build title bar
    el.innerHTML = `
      <div class="ss-titlebar">
        <span>📊 Q3_Consolidation_FINAL_v12_USE_THIS_ONE.xlsx</span>
        <span>Microsoft Excel 2003</span>
      </div>
      <div class="ss-formula-bar">fx &nbsp;&nbsp; ${data[correctRow][correctCol]}</div>
      <div class="ss-tabs">
        ${tabs.map((t,i) => `<div class="ss-tab${i===0?' active':''}">${t}</div>`).join('')}
      </div>
      <table class="ss-grid"><thead><tr>
        <th style="width:28px"></th>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr></thead><tbody>
        ${data.map((row, ri) => `<tr>
          <td class="row-header">${ri+1}</td>
          ${row.map((cell, ci) => {
            const isCorrect = ri === correctRow && ci === correctCol;
            return `<td class="${isCorrect ? 'correct-cell' : ''}" data-correct="${isCorrect}">${cell}</td>`;
          }).join('')}
        </tr>`).join('')}
      </tbody></table>
      <div class="ss-instruction">Find the correct Q3 figure</div>
      <div class="ss-timer" id="ss-timer">6</div>
    `;

    el.style.display = 'block';
    el.style.position = 'absolute';

    // Click handler
    el.querySelectorAll('td[data-correct]').forEach(td => {
      td.addEventListener('click', () => {
        if (td.dataset.correct === 'true') {
          this._closeSpreadsheet();
          this._escapeWithoutTrail();
        } else {
          td.style.background = '#ffe0e0';
        }
      });
    });

    // Update timer display from game timer
    this._ssTimerInterval = setInterval(() => {
      const timerEl = document.getElementById('ss-timer');
      if (timerEl) timerEl.textContent = this._timer;
      if (this._done) { clearInterval(this._ssTimerInterval); this._closeSpreadsheet(); }
    }, 200);
  }

  _closeSpreadsheet() {
    clearInterval(this._ssTimerInterval);
    const el = document.getElementById('audit-spreadsheet');
    if (el) el.style.display = 'none';
    this._spreadsheetEl = null;
  }

  _escapeWithoutTrail() {
    this._done = true;
    if (this._timerEvent) this._timerEvent.remove();
    this._closeSpreadsheet();
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.add.text(W/2, H/2, 'You got lucky.\nFix your audit trail.', {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '28px', color: '#E67E22', align: 'center',
    }).setOrigin(0.5).setDepth(84);
    this.time.delayedCall(2000, () => this._finish(false, false));
  }

  _pass() {
    if (this._done) return;
    this._done = true;
    if (this._timerEvent) this._timerEvent.remove();
    this._exitAuditor(() => this._finish(true, false));
  }

  _fail() {
    if (this._done) return;
    this._done = true;
    this._closeSpreadsheet();
    this._exitAuditor(() => this._finish(false, true));
  }

  _exitAuditor(onDone) {
    this.tweens.add({
      targets: this._auditorGfx,
      x: GAME_WIDTH + 100,
      duration: 600,
      ease: 'Back.easeIn',
      onComplete: onDone,
    });
  }

  _finish(passed, failed) {
    const gameScene = this.scene.get('GameScene');
    this.scene.stop('AuditScene');
    this.scene.resume('GameScene');
    if (gameScene && gameScene.onAuditComplete) {
      gameScene.onAuditComplete(passed && !failed);
    }
  }

  shutdown() {
    this._closeSpreadsheet();
    if (this._timerEvent) this._timerEvent.remove();
  }
}
