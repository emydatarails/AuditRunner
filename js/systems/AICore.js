/* =====================================================
   AICore — AI Core Power-Up Logic
   ===================================================== */

'use strict';

class AICore {
  constructor(scene) {
    this.scene = scene;
    this.cleanMonths     = 0;   // Consecutive governed months
    this.unlocked        = false;
    this.active          = false;
    this.activeDuration  = 15000; // 15 seconds
    this._activeTimer    = 0;
    this._insightTimer   = 0;
    this._insightIndex   = 0;
    this._overlay        = null;
    this._progressText   = null;
    this._insightText    = null;
    this._autoCatchTimer = null;
    this._shuffledInsights = [...BOARD_INSIGHTS].sort(() => Math.random() - 0.5);
  }

  // Called at end of each month
  onMonthClose(wasClean) {
    if (wasClean) {
      this.cleanMonths++;
    } else {
      this.cleanMonths = 0; // Reset streak
    }

    if (!this.unlocked && this.cleanMonths >= 3) {
      this.unlocked = true;
    }

    this._updateProgressDisplay();
  }

  tryActivate(onAutoCatch) {
    if (!this.unlocked) {
      // Show hallucination error
      const msg = HALLUCINATION_ERRORS[Math.floor(Math.random() * HALLUCINATION_ERRORS.length)];
      this.scene.events.emit('hallucinationError', msg);
      return false;
    }
    if (this.active) return false;

    this._activate(onAutoCatch);
    return true;
  }

  _activate(onAutoCatch) {
    this.active = true;
    this._activeTimer = this.activeDuration;
    AudioManager.play('aiCoreUnlock');
    this.scene.events.emit('aiCoreActivated');

    // Flash white overlay
    const flash = this.scene.add.rectangle(
      GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF
    ).setDepth(90).setAlpha(0.7);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      ease: 'Expo.easeOut',
      onComplete: () => flash.destroy(),
    });

    // Blue tint overlay
    this._overlay = this.scene.add.rectangle(
      GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x001830
    ).setDepth(12).setAlpha(0.3);

    // AI STATUS text
    const statusText = this.scene.add.text(
      GAME_WIDTH/2, GAME_FIELD_TOP + 40,
      'AI CORE ONLINE — FinanceOS is now reconciling on your behalf.',
      {
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontSize: '14px',
        color: '#3498DB',
        letterSpacing: 1,
      }
    ).setOrigin(0.5).setDepth(91);

    this.scene.tweens.add({
      targets: statusText,
      alpha: { from: 0, to: 1 },
      duration: 400,
    });

    this._statusText = statusText;

    // Board insight text
    this._insightText = this.scene.add.text(
      GAME_WIDTH/2, GAME_HEIGHT/2 - 40, '',
      {
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontSize: '13px',
        color: '#3498DB',
        alpha: 0,
        wordWrap: { width: 600 },
        align: 'center',
        letterSpacing: 0.5,
      }
    ).setOrigin(0.5).setDepth(91);

    this._insightTimer = 0;
    this._showNextInsight();

    // Start auto-catch loop
    if (typeof onAutoCatch === 'function') {
      this._autoCatchTimer = this.scene.time.addEvent({
        delay: 600,
        loop: true,
        callback: onAutoCatch,
      });
    }

    // Update progress display to show AI CORE ACTIVE
    this._updateProgressDisplay();
  }

  _showNextInsight() {
    if (!this.active || !this._insightText) return;

    const insight = this._shuffledInsights[this._insightIndex % this._shuffledInsights.length];
    this._insightIndex++;

    // Typewriter effect
    this._insightText.setText('');
    this._insightText.setAlpha(1);

    let charIndex = 0;
    const typeTimer = this.scene.time.addEvent({
      delay: 35,
      repeat: insight.length - 1,
      callback: () => {
        charIndex++;
        this._insightText.setText(insight.substring(0, charIndex));
      },
    });

    // Schedule next insight after 3 seconds
    this.scene.time.delayedCall(3000, () => {
      if (!this.active) return;
      this.scene.tweens.add({
        targets: this._insightText,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          if (this.active) this._showNextInsight();
        },
      });
    });
  }

  update(delta) {
    if (!this.active) return;

    this._activeTimer -= delta;
    if (this._activeTimer <= 0) {
      this._deactivate();
    }
  }

  _deactivate() {
    this.active  = false;
    this.unlocked = false; // Requires 3 more clean months for re-use
    this.cleanMonths = 0;

    if (this._autoCatchTimer) {
      this._autoCatchTimer.remove();
      this._autoCatchTimer = null;
    }

    if (this._overlay) {
      this.scene.tweens.add({
        targets: this._overlay,
        alpha: 0,
        duration: 600,
        onComplete: () => { if (this._overlay) { this._overlay.destroy(); this._overlay = null; } },
      });
    }

    if (this._statusText) {
      this.scene.tweens.add({
        targets: this._statusText,
        alpha: 0,
        duration: 400,
        onComplete: () => { if (this._statusText) { this._statusText.destroy(); this._statusText = null; } },
      });
    }

    if (this._insightText) {
      this.scene.tweens.add({
        targets: this._insightText,
        alpha: 0,
        duration: 400,
        onComplete: () => { if (this._insightText) { this._insightText.destroy(); this._insightText = null; } },
      });
    }

    this.scene.events.emit('aiCoreDeactivated');
    this._updateProgressDisplay();
  }

  getTimeRemaining() {
    return Math.ceil(this._activeTimer / 1000);
  }

  setProgressDisplay(textObject) {
    this._progressText = textObject;
    this._updateProgressDisplay();
  }

  _updateProgressDisplay() {
    if (!this._progressText) return;
    if (this.active) {
      this._progressText.setText('AI CORE: ACTIVE');
      this._progressText.setColor('#3498DB');
    } else if (this.unlocked) {
      this._progressText.setText('AI SYNC: READY');
      this._progressText.setColor('#D4A017');
    } else {
      const needed = 3 - this.cleanMonths;
      this._progressText.setText(`AI SYNC: ${this.cleanMonths}/3 CLEAN MONTHS`);
      this._progressText.setColor('#8A8A9A');
    }
  }

  destroy() {
    if (this._autoCatchTimer) this._autoCatchTimer.remove();
    if (this._overlay)     this._overlay.destroy();
    if (this._statusText)  this._statusText.destroy();
    if (this._insightText) this._insightText.destroy();
  }
}
