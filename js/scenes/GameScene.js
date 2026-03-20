/* =====================================================
   GameScene — Core Gameplay (Part 1: Setup & HUD)
   ===================================================== */
'use strict';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this._paused      = false;
    this._gameOver    = false;
    this._monthClosing = false;
    this._surgActive  = false;
    this._aiWasActive = false;

    this.currentMonth      = 1;
    this.blocksCaughtThisMonth = 0;
    this.consecutiveCleanMonths = 0;
    this.auditsSurvivedThisMonth = false;
    this.monthRetried = false;

    // Systems
    this.scoreSystem  = new ScoreSystem(this);
    this.blockSystem  = new BlockSystem(this);
    this.auditTrail   = new AuditTrail(this);
    this.gate         = new GovernanceGate(this, 120, GAME_HEIGHT - 40);
    this.aiCore       = new AICore(this);

    this._buildBackground();
    this._buildHUD();
    this._buildLedger();
    this._buildControlBar();
    this._setupInput();
    this._setupEvents();
    this._startMonth(this.currentMonth);

    AudioManager.resume();
    AudioManager.startAmbient(1);

    this.cameras.main.fadeIn(400, 13, 17, 23);
  }

  // ─── Background ──────────────────────────────────────
  _buildBackground() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this.add.rectangle(W/2, H/2, W, H, COLORS.bgPrimary).setDepth(0);

    // Subtle grid
    const g = this.add.graphics().setDepth(1);
    g.lineStyle(1, COLORS.border, 0.15);
    for (let x = 0; x < W; x += 80) { g.moveTo(x,0); g.lineTo(x,H); }
    for (let y = 0; y < H; y += 80) { g.moveTo(0,y); g.lineTo(W,y); }
    g.strokePath();

    // HUD separator line
    const sep = this.add.graphics().setDepth(5);
    sep.lineStyle(1, COLORS.border, 0.8);
    sep.moveTo(0, HUD_HEIGHT); sep.lineTo(W, HUD_HEIGHT);
    sep.moveTo(0, GAME_FIELD_BOTTOM); sep.lineTo(W, GAME_FIELD_BOTTOM);
    sep.strokePath();
  }

  // ─── HUD Bar ─────────────────────────────────────────
  _buildHUD() {
    const W = GAME_WIDTH;
    // Background
    this.add.rectangle(W/2, HUD_HEIGHT/2, W, HUD_HEIGHT, COLORS.bgSecondary, 0.95).setDepth(4);

    // Logo
    this.add.text(16, HUD_HEIGHT/2, 'DATARAILS', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '13px', color: '#D4A017', letterSpacing: 4,
    }).setOrigin(0, 0.5).setDepth(6);

    // Fiscal period
    this._fiscalText = this.add.text(W/2, HUD_HEIGHT/2, getFiscalLabel(1), {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '13px', color: '#8A8A9A', letterSpacing: 2,
    }).setOrigin(0.5, 0.5).setDepth(6);

    // Strike indicators (3 icons right side)
    this._strikeIcons = [];
    for (let i = 0; i < 3; i++) {
      const icon = this.add.graphics().setDepth(6);
      this._strikeIcons.push({ gfx: icon, x: W - 100 + i * 28, y: HUD_HEIGHT/2 });
    }
    this._updateStrikeIcons();

    // Month indicator
    this._monthBanner = this.add.text(W/2, HUD_HEIGHT/2 - 1, '', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '11px', color: '#D4A017',
    }).setOrigin(0.5, 0.5).setDepth(6).setAlpha(0);
  }

  _updateStrikeIcons() {
    const strikes = this.scoreSystem.strikes;
    const colors = [0x2ECC71, 0xE67E22, 0xE74C3C];
    this._strikeIcons.forEach((si, i) => {
      si.gfx.clear();
      const color = i < strikes ? colors[i] : COLORS.border;
      si.gfx.fillStyle(color, 1);
      si.gfx.fillCircle(si.x, si.y, 7);
      if (i < strikes) {
        si.gfx.lineStyle(1, COLORS.white, 0.3);
        si.gfx.strokeCircle(si.x, si.y, 7);
      }
    });
  }

  // ─── Central Ledger ───────────────────────────────────
  _buildLedger() {
    this._ledgerX = GAME_WIDTH / 2;
    this._ledgerY = GAME_FIELD_BOTTOM - 55;
    this._catchRadius = 110; // half-width of catch zone

    const ledgerGfx = this.add.graphics().setDepth(25);
    this._ledgerGfx = ledgerGfx;
    this._drawLedger(ledgerGfx, false);

    // Pulse tween on glow
    this._ledgerGlow = this.add.graphics().setDepth(24);
    this._drawLedgerGlow(this._ledgerGlow, 1);
    this.tweens.add({
      targets: this._ledgerGlow,
      alpha: { from: 0.4, to: 0.9 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Catch zone indicator (subtle)
    this._catchZoneGfx = this.add.graphics().setDepth(16);
    this._drawCatchZone();
  }

  _drawLedger(gfx, aiMode) {
    const cx = this._ledgerX, cy = this._ledgerY;
    const r = 56;
    gfx.clear();
    const borderColor = aiMode ? COLORS.blueLight : COLORS.gold;
    const fillColor   = aiMode ? 0x001830 : COLORS.bgSecondary;

    // Hex fill
    gfx.fillStyle(fillColor, 0.9);
    this._hexPath(gfx, cx, cy, r);
    gfx.fillPath();

    // Hex border layers
    gfx.lineStyle(3, borderColor, 0.9);
    this._hexPath(gfx, cx, cy, r);
    gfx.strokePath();

    gfx.lineStyle(1, aiMode ? COLORS.blueLight : COLORS.goldLight, 0.4);
    this._hexPath(gfx, cx, cy, r - 8);
    gfx.strokePath();

    // Label
    const label = aiMode ? 'AI CORE' : '◆ LEDGER ◆';
    const lColor = aiMode ? '#3498DB' : '#D4A017';
    if (this._ledgerLabel) this._ledgerLabel.destroy();
    this._ledgerLabel = this.add.text(cx, cy, label, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: lColor, letterSpacing: 1,
    }).setOrigin(0.5, 0.5).setDepth(26);
  }

  _drawLedgerGlow(gfx, alpha) {
    const cx = this._ledgerX, cy = this._ledgerY;
    gfx.clear();
    for (let i = 4; i > 0; i--) {
      gfx.fillStyle(COLORS.gold, 0.04 * i * alpha);
      gfx.fillCircle(cx, cy, 56 + i * 14);
    }
  }

  _drawCatchZone() {
    const gfx = this._catchZoneGfx;
    gfx.clear();
    gfx.lineStyle(1, COLORS.gold, 0.08);
    gfx.strokeRect(
      this._ledgerX - this._catchRadius,
      CATCH_ZONE_Y,
      this._catchRadius * 2,
      GAME_FIELD_BOTTOM - CATCH_ZONE_Y
    );
  }

  _hexPath(gfx, cx, cy, r) {
    gfx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? gfx.moveTo(x, y) : gfx.lineTo(x, y);
    }
    gfx.closePath();
  }

  // ─── Control Bar ─────────────────────────────────────
  _buildControlBar() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const barY = GAME_FIELD_BOTTOM;
    this.add.rectangle(W/2, barY + CTRL_HEIGHT/2, W, CTRL_HEIGHT, COLORS.bgSecondary, 0.95).setDepth(4);

    // Score display (center)
    this._scoreLabel = this.add.text(W/2, barY + 18, '$0.0K CONSOLIDATED', {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '22px', color: '#E8E8E8', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5).setDepth(6);

    this._scoreSubLabel = this.add.text(W/2, barY + 42, 'MULTIPLIER: 1×', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: '#8A8A9A',
    }).setOrigin(0.5, 0.5).setDepth(6);

    // Integrity meter (right)
    const meterX = W - 220, meterY = barY + 12;
    this.add.text(meterX, meterY, 'DATA INTEGRITY', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '10px', color: '#8A8A9A', letterSpacing: 1,
    }).setDepth(6);

    this._integrityBg = this.add.graphics().setDepth(6);
    this._integrityFill = this.add.graphics().setDepth(6);
    this._integrityText = this.add.text(meterX + 210, meterY + 20, '100%', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '12px', color: '#2ECC71',
    }).setOrigin(1, 0.5).setDepth(6);

    this._drawIntegrityMeter(100);

    // AI Sync progress (far right)
    this._aiProgressText = this.add.text(W - 16, barY + CTRL_HEIGHT - 10, 'AI SYNC: 0/3 CLEAN MONTHS', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '9px', color: '#8A8A9A',
    }).setOrigin(1, 1).setDepth(6);
    this.aiCore.setProgressDisplay(this._aiProgressText);
  }

  _drawIntegrityMeter(pct) {
    const W = GAME_WIDTH;
    const meterX = W - 220, meterY = GAME_FIELD_BOTTOM + 26;
    const meterW = 180, meterH = 10;

    this._integrityBg.clear();
    this._integrityBg.fillStyle(COLORS.border, 1);
    this._integrityBg.fillRoundedRect(meterX, meterY, meterW, meterH, 3);

    const fillW = Math.max(0, (pct / 100) * meterW);
    const color = pct > 66 ? 0x2ECC71 : pct > 33 ? 0xE67E22 : 0xE74C3C;

    this._integrityFill.clear();
    if (fillW > 0) {
      this._integrityFill.fillStyle(color, 1);
      this._integrityFill.fillRoundedRect(meterX, meterY, fillW, meterH, 3);
    }

    const textColor = pct > 66 ? '#2ECC71' : pct > 33 ? '#E67E22' : '#E74C3C';
    this._integrityText.setText(`${Math.round(pct)}%`).setColor(textColor);
  }

  // ─── Input ────────────────────────────────────────────
  _setupInput() {
    // Space = toggle gate (unless kiosk)
    if (!window.KIOSK_MODE) {
      this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this._spaceKey.on('down', () => {
        if (this._paused || this._gameOver) return;
        if (this.aiCore.active) return; // no gate during AI Core
        this.gate.toggle();
      });
    }

    // ESC = quit confirmation
    this._escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this._escKey.on('down', () => { if (!this._gameOver) this._confirmQuit(); });

    // Click on blocks
    this.input.on('gameobjectdown', (pointer, obj) => {
      if (this._paused || this._gameOver) return;
      if (this.aiCore.active) return;
      this._onBlockClicked(obj);
    });
  }

  // ─── Events ───────────────────────────────────────────
  _setupEvents() {
    this.events.on('blockMissed', (block) => this._onBlockMissed(block));
    this.events.on('gateToggled', (isOn) => {
      // Apply red tint to in-flight blocks when gate OFF
      this.blockSystem.applyRedTint(!isOn);
    });
    this.events.on('aiCoreActivated',   () => { this._drawLedger(this._ledgerGfx, true); });
    this.events.on('aiCoreDeactivated', () => {
      this._drawLedger(this._ledgerGfx, false);
      this.scoreSystem.resetMultiplier();
      this._updateScoreDisplay();
    });
    this.events.on('hallucinationError', (msg) => this._showToast(msg, 0xE74C3C, 3500));
  }

  // ─── Month Management ─────────────────────────────────
  _startMonth(month) {
    this._monthClosing = false;
    this._surgActive   = false;
    this._surgTimer    = null;
    this._crashFired   = false;
    this.blocksCaughtThisMonth = 0;
    this.auditsSurvivedThisMonth = false;
    this._aiWasActive  = false;
    this.monthRetried  = false;

    // Clear any blocks from previous month
    this.blockSystem.despawnAll();

    const cfg = getMonthConfig(month);
    this._currentConfig = cfg;

    // Update HUD
    this._fiscalText.setText(getFiscalLabel(month));

    // Start spawner
    this._stopSpawner();
    this._spawnTimer = this.time.addEvent({
      delay: cfg.rate * 1000,
      loop: true,
      callback: this._spawnBlock,
      callbackScope: this,
    });

    // Schedule potential System Crash (month 4+, 30% chance)
    if (month >= 4 && !this._crashFired && Math.random() < 0.3) {
      const crashDelay = 5000 + Math.random() * 10000;
      this.time.delayedCall(crashDelay, this._triggerSystemCrash, [], this);
    }

    // Schedule Shadow Surge (month 4+, every 2 months, random timing)
    if (month >= 4 && month % 2 === 0) {
      const surgeDelay = 3000 + Math.random() * 8000;
      this.time.delayedCall(surgeDelay, this._triggerShadowSurge, [], this);
    }
  }

  _stopSpawner() {
    if (this._spawnTimer) { this._spawnTimer.remove(); this._spawnTimer = null; }
  }

  _spawnBlock() {
    if (this._paused || this._monthClosing || this._gameOver) return;
    const cfg = this._currentConfig;
    const weights = this._surgActive
      ? [15, 15, 70, 0]   // Surge: mostly red
      : cfg.weights;

    const typeId = this.blockSystem.chooseType(weights);
    const margin = 160;
    const x = margin + Math.random() * (GAME_WIDTH - margin * 2);
    this.blockSystem.spawn(typeId, x, cfg);
  }

  _advanceMonth() {
    if (this._monthClosing || this._gameOver) return;
    this._monthClosing = true;
    this._stopSpawner();
    this.blockSystem.pauseAll();

    const month = this.currentMonth;
    const wasClean = this.scoreSystem.isMonthGoverned();

    // Month close bonus
    const bonus = 50 + month * 10;
    this.scoreSystem.addPoints(bonus, true);
    AudioManager.play('monthClose');

    // AI Core check
    this.aiCore.onMonthClose(wasClean);
    if (wasClean) this.consecutiveCleanMonths++;
    else          this.consecutiveCleanMonths = 0;

    // Show month close banner
    this._showMonthCloseBanner(month, wasClean, () => {
      // Check for Surprise Audit
      if (month % 3 === 0) {
        this._triggerSurpriseAudit();
      } else {
        this._nextMonth();
      }
    });
  }

  _showMonthCloseBanner(month, clean, onDone) {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setDepth(80);
    const banner = this.add.text(W/2, H/2 - 60, `MONTH ${month} CLOSE`, {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '52px', fontStyle: 'bold', color: '#D4A017',
    }).setOrigin(0.5).setDepth(81).setAlpha(0);

    const stats = this.add.text(W/2, H/2 + 20,
      `Score: ${this.scoreSystem.getDisplayScore()}   Integrity: ${this.scoreSystem.integrityPct}%`,
      {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '16px', color: '#E8E8E8',
      }
    ).setOrigin(0.5).setDepth(81).setAlpha(0);

    const cleanText = this.add.text(W/2, H/2 + 60,
      clean ? '✓ CLEAN MONTH — FULL GOVERNANCE' : 'Month closed.',
      {
        fontFamily: '"IBM Plex Mono","Courier New",monospace',
        fontSize: '13px', color: clean ? '#2ECC71' : '#8A8A9A',
      }
    ).setOrigin(0.5).setDepth(81).setAlpha(0);

    this.tweens.add({ targets: [banner, stats, cleanText], alpha: 1, duration: 400 });
    this.time.delayedCall(2200, () => {
      this.tweens.add({
        targets: [overlay, banner, stats, cleanText],
        alpha: 0, duration: 400,
        onComplete: () => {
          overlay.destroy(); banner.destroy(); stats.destroy(); cleanText.destroy();
          onDone();
        },
      });
    });
  }

  _nextMonth() {
    this.scoreSystem.closeMonth(
      this.currentMonth,
      this.auditsSurvivedThisMonth,
      this._aiWasActive,
      this.monthRetried
    );
    this.currentMonth++;
    AudioManager.setAmbientMonth(this.currentMonth);
    this._drawIntegrityMeter(100);
    this._updateStrikeIcons();
    this.blockSystem.resumeAll();
    this._startMonth(this.currentMonth);
  }

  // ─── Block Clicking ───────────────────────────────────
  _onBlockClicked(obj) {
    // Find in active blocks
    const block = this.blockSystem.activeBlocks.find(b => b === obj);
    if (!block || !block.active) return;

    const inCatchZone = block.y >= CATCH_ZONE_Y && block.y <= GAME_FIELD_BOTTOM + 10;

    if (!inCatchZone) {
      // Early click = miss
      AudioManager.play('blockMiss');
      this.scoreSystem.addPoints(-10, false);
      this._floatText(block.x, block.y, CATCH_MESSAGES.miss_early.text, CATCH_MESSAGES.miss_early.color);
      this.blockSystem.despawn(block);
      this._updateScoreDisplay();
      return;
    }

    this._catchBlock(block);
  }

  _catchBlock(block) {
    const typeId  = block.getData('type');
    const typeData = BLOCK_TYPES[typeId];
    const gateOn  = this.gate.getIsOn();
    this.blocksCaughtThisMonth++;

    if (typeId === 'red') {
      if (gateOn) {
        // Safe rejection
        AudioManager.play('blockRejected');
        this._floatText(block.x, block.y, CATCH_MESSAGES.red_governed.text, CATCH_MESSAGES.red_governed.color);
        // Bounce animation
        this.tweens.add({
          targets: block,
          y: block.y - 80,
          alpha: 0,
          duration: 400,
          ease: 'Back.easeOut',
          onComplete: () => this.blockSystem.despawn(block),
        });
      } else {
        // Strike!
        AudioManager.play('blockUngoverned');
        this._floatText(block.x, block.y, CATCH_MESSAGES.red_ungoverned.text, CATCH_MESSAGES.red_ungoverned.color);
        this.blockSystem.despawn(block);
        this._applyStrike();
      }
      this._updateScoreDisplay();
      return;
    }

    // Non-red block
    if (gateOn) {
      // Governed catch
      const delay = typeId === 'blue' ? 800 : 400;
      this._paused = true;
      this.blockSystem.playGoverningAnimation(block, () => {
        this._paused = false;
        const pts = this.scoreSystem.addPoints(typeData.basePoints, true);
        this.auditTrail.emit(this._ledgerX, this._ledgerY, 4);
        AudioManager.play('blockSnapGold');
        this._flashLedger();
        this._floatText(block.x, block.y,
          `+${formatScore(pts)}`,
          typeData.borderColor
        );
        this.blockSystem.despawn(block);
        this._updateScoreDisplay();
        this._checkMonthEnd();
      });
    } else {
      // Ungoverned catch
      const pts = this.scoreSystem.addPoints(
        typeId === 'yellow' ? 100 : typeId === 'blue' ? 100 : typeData.basePoints,
        false
      );
      AudioManager.play('blockSnap');
      this._floatText(block.x, block.y, `+${formatScore(pts)}`, typeData.borderColor);
      this.blockSystem.despawn(block);
      this._updateScoreDisplay();
      this._checkMonthEnd();
    }
  }

  _onBlockMissed(block) {
    if (!block.getData('type')) return;
    this.scoreSystem.addPoints(-5, false);
    this._updateScoreDisplay();
  }

  _checkMonthEnd() {
    const cfg = this._currentConfig;
    if (this.blocksCaughtThisMonth >= cfg.blocksToClose && !this._monthClosing) {
      this._advanceMonth();
    }
  }

  // ─── Strike System ────────────────────────────────────
  _applyStrike(double = false) {
    const count = double ? 2 : 1;
    let strikeNum;
    for (let i = 0; i < count; i++) strikeNum = this.scoreSystem.strike();

    const strikeData = STRIKE_MESSAGES[Math.min(strikeNum - 1, 2)];
    this._floatText(GAME_WIDTH/2, GAME_HEIGHT/2 - 80, strikeData.text, strikeData.color, 22);

    if (strikeNum === 1) {
      this._flashScreen(0xE67E22, 1);
    } else if (strikeNum === 2) {
      this._flashScreen(0xE74C3C, 3);
      this._jitterHUD();
    } else {
      // Strike 3 = Material Weakness
      this._flashScreen(0xC0392B, 3);
      this._triggerMaterialWeakness();
      return;
    }

    this._drawIntegrityMeter(this.scoreSystem.integrityPct);
    this._updateStrikeIcons();
  }

  _triggerMaterialWeakness() {
    this._stopSpawner();
    this.blockSystem.pauseAll();
    AudioManager.play('materialWeakness');

    const msg = FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)];
    const isEarlyGame = this.currentMonth <= 2;

    this.time.delayedCall(800, () => {
      this._showMaterialWeaknessScreen(msg, isEarlyGame);
    });
  }

  _showMaterialWeaknessScreen(msg, hardGameOver) {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x1A0000, 0.92).setDepth(85);

    this.add.text(W/2, H/2 - 100, 'MATERIAL WEAKNESS', {
      fontFamily: '"Playfair Display",Georgia,serif',
      fontSize: '52px', fontStyle: 'bold', color: '#E74C3C',
    }).setOrigin(0.5).setDepth(86);

    this.add.text(W/2, H/2 - 30, msg, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '15px', color: '#E8E8E8',
      wordWrap: { width: 700 }, align: 'center',
    }).setOrigin(0.5).setDepth(86);

    if (hardGameOver || this.currentMonth <= 2) {
      // Hard game over
      const btn = this._makeButton(W/2, H/2 + 80, 'TRY AGAIN', () => {
        this.scene.start('GameScene');
      });
      const shareBtn = this._makeButton(W/2, H/2 + 130, 'SEE MY RESULTS', () => {
        this._endGame();
      });
    } else {
      // Retry option
      this.add.text(W/2, H/2 + 60,
        `Retry Month ${this.currentMonth} (-20% ungoverned score penalty)`,
        { fontFamily: '"IBM Plex Mono","Courier New",monospace', fontSize: '12px', color: '#8A8A9A' }
      ).setOrigin(0.5).setDepth(86);

      this._makeButton(W/2 - 110, H/2 + 100, 'RETRY MONTH', () => {
        const penalty = this.scoreSystem.retryMonth();
        this.monthRetried = true;
        overlay.destroy();
        this._drawIntegrityMeter(100);
        this._updateStrikeIcons();
        this.blockSystem.resumeAll();
        this._monthClosing = false;
        this._startMonth(this.currentMonth);
      });
      this._makeButton(W/2 + 110, H/2 + 100, 'END GAME', () => {
        this._endGame();
      });
    }
  }

  _makeButton(x, y, label, onClick) {
    const W = label.length * 9 + 40;
    const H = 44;
    const g = this.add.graphics().setDepth(87);
    g.lineStyle(1, COLORS.gold, 0.8);
    g.strokeRect(x - W/2, y - H/2, W, H);
    const t = this.add.text(x, y, label, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '13px', color: '#D4A017',
    }).setOrigin(0.5).setDepth(88);
    const zone = this.add.zone(x, y, W, H).setInteractive().setDepth(89);
    zone.on('pointerover', () => { g.clear(); g.fillStyle(COLORS.gold, 0.15); g.fillRect(x-W/2,y-H/2,W,H); g.lineStyle(1,COLORS.gold,1); g.strokeRect(x-W/2,y-H/2,W,H); });
    zone.on('pointerout',  () => { g.clear(); g.lineStyle(1,COLORS.gold,0.8); g.strokeRect(x-W/2,y-H/2,W,H); });
    zone.on('pointerdown', onClick);
    return { g, t, zone };
  }

  // ─── Score Display ────────────────────────────────────
  _updateScoreDisplay() {
    this._scoreLabel.setText(`${this.scoreSystem.getDisplayScore()} CONSOLIDATED`);
    const mult = this.scoreSystem.multiplier;
    this._scoreSubLabel.setText(`MULTIPLIER: ${mult}×  |  GOVERNED: ${this.scoreSystem.getGovernedDisplay()}`);
    this._drawIntegrityMeter(this.scoreSystem.integrityPct);
    this._updateStrikeIcons();
  }

  // ─── Special Events ───────────────────────────────────
  _triggerSurpriseAudit() {
    this._stopSpawner();
    this.blockSystem.pauseAll();
    const hasTrail = this.scoreSystem.hasEnoughTrailForAudit();
    AudioManager.play('auditEntry');

    // Launch AuditScene as overlay
    this.scene.launch('AuditScene', {
      hasTrail,
      dialogue: AUDIT_DIALOGUE[Math.floor(Math.random() * AUDIT_DIALOGUE.length)],
      month: this.currentMonth,
    });
    this.scene.pause('GameScene');
  }

  onAuditComplete(passed) {
    this.scene.resume('GameScene');
    if (passed) {
      this.scoreSystem.setMultiplier(2);
      this.auditsSurvivedThisMonth = true;
      this._showToast('AUDIT PASSED — 2× MULTIPLIER ACTIVE', 0x2ECC71, 2500);
      AudioManager.play('auditPass');
    } else {
      this._applyStrike();
      this._showToast('AUDIT FAILED. Fix your trail.', 0xE74C3C, 2500);
      AudioManager.play('auditFail');
    }
    this._nextMonth();
  }

  _triggerSystemCrash() {
    if (this._monthClosing || this._gameOver || this._crashFired) return;
    this._crashFired = true;
    this._stopSpawner();
    this.blockSystem.pauseAll();
    AudioManager.play('systemCrash');

    // SYSTEM INTEGRITY CHECK warning
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const flashOverlay = this.add.rectangle(W/2, H/2, W, H, 0xC0392B, 0.0).setDepth(82);
    const warnText = this.add.text(W/2, H/2 - 30, 'SYSTEM INTEGRITY CHECK', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '28px', color: '#E74C3C', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(83).setAlpha(0);

    const subText = this.add.text(W/2, H/2 + 20, 'SCANNING LEDGER...', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '14px', color: '#8A8A9A',
    }).setOrigin(0.5).setDepth(83).setAlpha(0);

    this.tweens.add({ targets: [warnText, subText], alpha: 1, duration: 200 });
    this.tweens.add({ targets: flashOverlay, alpha: 0.25, duration: 200, yoyo: true, repeat: 2 });

    this.time.delayedCall(2000, () => {
      const wiped = this.scoreSystem.wipeUngoverned();
      let resultMsg;
      if (wiped === 0) {
        resultMsg = '100% governed. System crash: neutralized.';
        this.scoreSystem.addPoints(500, true);
        this._showToast(resultMsg + ' +BONUS', 0x2ECC71, 3000);
      } else {
        resultMsg = `${CRASH_MESSAGES[Math.floor(Math.random() * CRASH_MESSAGES.length)]}`;
        this._showToast(resultMsg, 0xE74C3C, 3000);
      }
      warnText.destroy(); subText.destroy(); flashOverlay.destroy();
      this._updateScoreDisplay();
      this.blockSystem.resumeAll();
      this._stopSpawner();
      const cfg = this._currentConfig;
      this._spawnTimer = this.time.addEvent({
        delay: cfg.rate * 1000, loop: true,
        callback: this._spawnBlock, callbackScope: this,
      });
    });
  }

  _triggerShadowSurge() {
    if (this._monthClosing || this._gameOver || this._surgActive) return;
    this._surgActive = true;
    const msg = SURGE_WARNINGS[Math.floor(Math.random() * SURGE_WARNINGS.length)];
    AudioManager.play('surge');
    this._showToast(msg, 0xC0392B, 2500);

    // After 8 seconds, end surge
    this.time.delayedCall(8000, () => {
      this._surgActive = false;
      this._showToast('Shadow surge cleared.', 0x2ECC71, 1500);
    });
  }

  // ─── AI Core Integration ──────────────────────────────
  _tryActivateAICore() {
    if (this.aiCore.active) return;
    this.aiCore.tryActivate(() => {
      // Auto-catch callback
      if (!this.aiCore.active) return;
      const blocks = [...this.blockSystem.activeBlocks];
      if (blocks.length === 0) return;
      // Auto-catch nearest block in catch zone, or highest-value
      const catchable = blocks.filter(b => b.y >= CATCH_ZONE_Y);
      if (catchable.length > 0) {
        const b = catchable[0];
        this._autoCatchBlock(b);
      }
    });
    if (this.aiCore.active) {
      this._aiWasActive = true;
      this.scoreSystem.setMultiplier(3);
    }
  }

  _autoCatchBlock(block) {
    if (!block.active) return;
    const typeId = block.getData('type');
    if (typeId === 'red') {
      // AI always governs — red safely rejected
      AudioManager.play('blockRejected');
      this.blockSystem.despawn(block);
      return;
    }
    const typeData = BLOCK_TYPES[typeId];
    const pts = this.scoreSystem.addPoints(typeData.basePoints, true);
    this.auditTrail.emit(this._ledgerX, this._ledgerY, 6);
    AudioManager.play('aiCoreTick');
    this._floatText(block.x, block.y, `+${formatScore(pts)}`, typeData.borderColor);
    this.blockSystem.despawn(block);
    this._updateScoreDisplay();
    this._checkMonthEnd();
  }

  // ─── Visual Effects ───────────────────────────────────
  _flashLedger() {
    const flash = this.add.graphics().setDepth(27);
    this._hexPath(flash, this._ledgerX, this._ledgerY, 60);
    flash.fillStyle(COLORS.white, 0.6);
    flash.fillPath();
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });
  }

  _flashScreen(color, times = 1) {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    let count = 0;
    const doFlash = () => {
      if (count >= times) return;
      count++;
      const fl = this.add.rectangle(W/2, H/2, W, H, color, 0.35).setDepth(88);
      this.tweens.add({
        targets: fl, alpha: 0, duration: 150,
        onComplete: () => { fl.destroy(); if (count < times) this.time.delayedCall(80, doFlash); }
      });
    };
    doFlash();
  }

  _jitterHUD() {
    // Make score text jitter briefly
    const orig = { x: this._scoreLabel.x, y: this._scoreLabel.y };
    let count = 0;
    const jitter = this.time.addEvent({
      delay: 60, repeat: 10,
      callback: () => {
        this._scoreLabel.setPosition(
          orig.x + (Math.random() - 0.5) * 8,
          orig.y + (Math.random() - 0.5) * 4
        );
        count++;
        if (count >= 10) {
          this._scoreLabel.setPosition(orig.x, orig.y);
          jitter.remove();
        }
      },
    });
  }

  _floatText(x, y, text, color, size = 16) {
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(x, y, text, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: `${size}px`, color: hexColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(70);
    this.tweens.add({
      targets: t, y: y - 70, alpha: 0, duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  _showToast(msg, color, duration = 2000) {
    const W = GAME_WIDTH;
    const hexColor = '#' + color.toString(16).padStart(6, '0');
    const bg = this.add.rectangle(W/2, HUD_HEIGHT + 30, W * 0.7, 44, color, 0.15).setDepth(75);
    const t = this.add.text(W/2, HUD_HEIGHT + 30, msg, {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '12px', color: hexColor,
      wordWrap: { width: W * 0.65 }, align: 'center',
    }).setOrigin(0.5).setDepth(76);
    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: [bg, t], alpha: 0, duration: 400,
        onComplete: () => { bg.destroy(); t.destroy(); },
      });
    });
  }

  // ─── Quit ─────────────────────────────────────────────
  _confirmQuit() {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this._stopSpawner();
    this.blockSystem.pauseAll();
    const overlay = this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.7).setDepth(90);
    const t = this.add.text(W/2, H/2 - 30, 'End session and see results?', {
      fontFamily: '"IBM Plex Mono","Courier New",monospace',
      fontSize: '18px', color: '#E8E8E8',
    }).setOrigin(0.5).setDepth(91);

    this._makeButton(W/2 - 90, H/2 + 40, 'YES — END', () => { this._endGame(); });
    this._makeButton(W/2 + 90, H/2 + 40, 'CANCEL', () => {
      overlay.destroy(); t.destroy();
      this.blockSystem.resumeAll();
      this._spawnTimer = this.time.addEvent({
        delay: this._currentConfig.rate * 1000, loop: true,
        callback: this._spawnBlock, callbackScope: this,
      });
    });
  }

  _endGame() {
    this._gameOver = true;
    this._stopSpawner();
    this.blockSystem.despawnAll();
    // Close current month in history
    this.scoreSystem.closeMonth(
      this.currentMonth, this.auditsSurvivedThisMonth,
      this._aiWasActive, this.monthRetried
    );
    AudioManager.stopAmbient();
    this.cameras.main.fadeOut(500, 13, 17, 23);
    this.time.delayedCall(520, () => {
      this.scene.start('ResultScene', { stats: this.scoreSystem.getStats() });
    });
  }

  // ─── Update Loop ──────────────────────────────────────
  update(time, delta) {
    if (this._gameOver) return;

    if (!this._paused && !this._monthClosing) {
      this.blockSystem.update(delta);
    }

    this.auditTrail.update(delta);
    this.aiCore.update(delta);

    // Thin trail when gate is OFF
    if (!this.gate.getIsOn() && Math.random() < 0.02) {
      this.auditTrail.thinOut();
    }

    // AI Core deactivation
    if (this.aiCore.active && this.aiCore._activeTimer <= 0) {
      this.scoreSystem.resetMultiplier();
      this._updateScoreDisplay();
    }
  }

  // ─── Cleanup ──────────────────────────────────────────
  shutdown() {
    this._stopSpawner();
    this.blockSystem.destroy();
    this.auditTrail.destroy();
    this.gate.destroy();
    this.aiCore.destroy();
    this.events.removeAllListeners();
    if (this._spaceKey) this._spaceKey.removeAllListeners();
    if (this._escKey)   this._escKey.removeAllListeners();
    AudioManager.stopAmbient();
  }
}
