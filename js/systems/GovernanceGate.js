/* =====================================================
   GovernanceGate — Gate Toggle Logic & Visual State
   ===================================================== */

'use strict';

class GovernanceGate {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.isOn = true;
    this._container = null;
    this._knobTween = null;
    this._vignetteOn  = null;
    this._vignetteOff = null;
    this._init();
  }

  _init() {
    // Vignette overlays (full screen edges)
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    this._vignetteOn  = this.scene.add.graphics().setDepth(50).setAlpha(0);
    this._vignetteOff = this.scene.add.graphics().setDepth(50).setAlpha(0);
    this._drawVignette(this._vignetteOn,  0x1A7A4A);  // green
    this._drawVignette(this._vignetteOff, 0xC0392B);  // red/amber

    this._container = this.scene.add.container(this.x, this.y).setDepth(60);
    this._drawToggle();
    this._setVignette();
  }

  _drawVignette(gfx, color) {
    const W = GAME_WIDTH, H = GAME_HEIGHT, t = 40;
    gfx.clear();
    // Top edge
    gfx.fillStyle(color, 0.18);
    gfx.fillRect(0, 0, W, t);
    // Bottom edge
    gfx.fillRect(0, H - t, W, t);
    // Left edge
    gfx.fillRect(0, 0, t, H);
    // Right edge
    gfx.fillRect(W - t, 0, t, H);
  }

  _drawToggle() {
    this._container.removeAll(true);

    const trackW = 88, trackH = 36;
    const knobR  = 14;

    // Track background
    const trackGfx = this.scene.add.graphics();
    const trackColor = this.isOn ? 0x1A7A4A : 0x5D3A00;
    trackGfx.fillStyle(trackColor, 1);
    trackGfx.fillRoundedRect(-trackW/2, -trackH/2, trackW, trackH, trackH/2);
    trackGfx.lineStyle(2, this.isOn ? COLORS.greenLight : COLORS.yellowUnverified, 0.8);
    trackGfx.strokeRoundedRect(-trackW/2, -trackH/2, trackW, trackH, trackH/2);

    // LED indicator (small circle on the right of track)
    const ledGfx = this.scene.add.graphics();
    const ledColor = this.isOn ? COLORS.greenLight : COLORS.yellowUnverified;
    const ledX = this.isOn ? trackW/2 - knobR - 2 : -trackW/2 + knobR + 2;
    ledGfx.fillStyle(ledColor, 0.9);
    ledGfx.fillCircle(0, 0, 5);

    // Knob
    const knobGfx = this.scene.add.graphics();
    const knobX = this.isOn ? trackW/2 - knobR - 4 : -trackW/2 + knobR + 4;
    knobGfx.fillStyle(COLORS.white, 0.95);
    knobGfx.fillCircle(0, 0, knobR);
    // Knob shadow
    knobGfx.fillStyle(0x000000, 0.2);
    knobGfx.fillCircle(1, 2, knobR - 1);

    // Mode label
    const labelText = this.scene.add.text(0, trackH/2 + 10,
      this.isOn ? 'GOVERNANCE MODE' : 'CHAOS MODE', {
        fontFamily: '"IBM Plex Mono", "Courier New", monospace',
        fontSize: '10px',
        color: this.isOn ? '#2ECC71' : '#E67E22',
        letterSpacing: 1,
      }
    ).setOrigin(0.5, 0);

    this._container.add([trackGfx, ledGfx, knobGfx, labelText]);
    this._container.trackGfx = trackGfx;
    this._container.knobGfx  = knobGfx;
    this._container.ledGfx   = ledGfx;
    this._container.knobX    = knobX;

    // Position knob and LED
    knobGfx.setPosition(knobX, 0);
    ledGfx.setPosition(knobX, -10);

    // Interactive area
    this._container.setSize(trackW + 20, trackH + 30);
    this._container.setInteractive(
      new Phaser.Geom.Rectangle(-(trackW/2 + 10), -(trackH/2 + 8), trackW + 20, trackH + 38),
      Phaser.Geom.Rectangle.Contains
    );

    this._container.on('pointerover', () => {
      this.scene.game.canvas.style.cursor = 'pointer';
    });
    this._container.on('pointerout', () => {
      this.scene.game.canvas.style.cursor = 'default';
    });
    this._container.on('pointerdown', () => {
      this.toggle();
    });

    // Glow pulse on track when ON
    if (this.isOn) {
      this.scene.tweens.add({
        targets: trackGfx,
        alpha: { from: 0.8, to: 1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  _setVignette() {
    if (this.isOn) {
      this._vignetteOn.setAlpha(1);
      this._vignetteOff.setAlpha(0);
    } else {
      this._vignetteOn.setAlpha(0);
      this._vignetteOff.setAlpha(0.7);
    }
  }

  toggle() {
    this.isOn = !this.isOn;
    AudioManager.play(this.isOn ? 'gateToggleOn' : 'gateToggleOff');
    this._drawToggle();
    this._setVignette();
    this.scene.events.emit('gateToggled', this.isOn);
  }

  setState(on) {
    if (this.isOn === on) return;
    this.isOn = on;
    this._drawToggle();
    this._setVignette();
  }

  getIsOn() { return this.isOn; }

  destroy() {
    if (this._container) {
      this.scene.tweens.killTweensOf(this._container);
      this._container.destroy();
    }
    if (this._vignetteOn)  this._vignetteOn.destroy();
    if (this._vignetteOff) this._vignetteOff.destroy();
  }
}
