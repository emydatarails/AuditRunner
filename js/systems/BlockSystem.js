/* =====================================================
   BlockSystem — Block Spawning & Management
   ===================================================== */

'use strict';

class BlockSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeBlocks = [];
    this.pool = [];
    this.MAX_POOL = 15;
    this._initPool();
  }

  _initPool() {
    for (let i = 0; i < this.MAX_POOL; i++) {
      const block = this._createBlock();
      block.setVisible(false);
      block.setActive(false);
      this.pool.push(block);
    }
  }

  _createBlock() {
    const W = 140, H = 60;
    const container = this.scene.add.container(0, 0);
    container.setSize(W, H);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-W/2, -H/2, W, H),
      Phaser.Geom.Rectangle.Contains
    );

    // Background
    const bg = this.scene.add.graphics();
    container.add(bg);
    container.bg = bg;

    // Top section graphics (slightly lighter fill + data label)
    const topGfx = this.scene.add.graphics();
    container.add(topGfx);
    container.topGfx = topGfx;

    // Inner highlight (top-left edge)
    const hlGfx = this.scene.add.graphics();
    container.add(hlGfx);
    container.hlGfx = hlGfx;

    // Icon text
    const iconText = this.scene.add.text(-W/2 + 8, -H/2 + 6, '', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '14px',
      color: '#E8E8E8',
    });
    container.add(iconText);
    container.iconText = iconText;

    // Block name text
    const nameText = this.scene.add.text(-W/2 + 26, -H/2 + 7, '', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '10px',
      color: '#E8E8E8',
    });
    container.add(nameText);
    container.nameText = nameText;

    // Data value text (bottom half)
    const valueText = this.scene.add.text(0, H/2 - 14, '', {
      fontFamily: '"IBM Plex Mono", "Courier New", monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#D4A017',
    }).setOrigin(0.5, 0.5);
    container.add(valueText);
    container.valueText = valueText;

    // Gold shimmer overlay (for governance animation)
    const shimmer = this.scene.add.graphics();
    shimmer.setAlpha(0);
    container.add(shimmer);
    container.shimmer = shimmer;

    // Depth
    container.setDepth(20);

    return container;
  }

  _getFromPool() {
    for (const b of this.pool) {
      if (!b.active) return b;
    }
    return null;
  }

  spawn(typeId, x, monthConfig) {
    const block = this._getFromPool();
    if (!block) return null;

    const typeData = BLOCK_TYPES[typeId];
    if (!typeData) return null;

    const W = 140, H = 60;

    // Choose random label and value
    const label = typeData.labels[Math.floor(Math.random() * typeData.labels.length)];
    const value = typeData.values[Math.floor(Math.random() * typeData.values.length)];

    // Background
    block.bg.clear();
    block.bg.fillStyle(typeData.fillColor, 1);
    block.bg.fillRoundedRect(-W/2, -H/2, W, H, 6);
    // Darker bottom half
    block.bg.fillStyle(typeData.darkFill, 1);
    block.bg.fillRoundedRect(-W/2, 0, W, H/2, { tl:0, tr:0, bl:6, br:6 });
    // Border
    block.bg.lineStyle(2, typeData.borderColor, 0.9);
    block.bg.strokeRoundedRect(-W/2, -H/2, W, H, 6);
    // Inner highlight (top and left edges — lighter)
    block.bg.lineStyle(1, typeData.borderColor, 0.3);
    block.bg.beginPath();
    block.bg.moveTo(-W/2 + 6, -H/2 + 1);
    block.bg.lineTo(W/2 - 6, -H/2 + 1);
    block.bg.moveTo(-W/2 + 1, -H/2 + 6);
    block.bg.lineTo(-W/2 + 1, H/2 - 6);
    block.bg.strokePath();

    // Top divider line
    block.topGfx.clear();
    block.topGfx.lineStyle(1, typeData.borderColor, 0.25);
    block.topGfx.moveTo(-W/2 + 4, 0);
    block.topGfx.lineTo(W/2 - 4, 0);
    block.topGfx.strokePath();

    // Icon and texts
    block.iconText.setText(typeData.icon);
    block.iconText.setColor('#' + typeData.borderColor.toString(16).padStart(6, '0'));
    block.nameText.setText(label);
    block.nameText.setColor('#E8E8E8');
    block.valueText.setText(value);
    block.valueText.setColor('#D4A017');

    // Shimmer reset
    block.shimmer.clear();
    block.shimmer.setAlpha(0);

    // Data
    block.setData('type', typeId);
    block.setData('typeData', typeData);
    block.setData('speed', monthConfig.speed);
    block.setData('governed', false);
    block.setData('label', label);
    block.setData('value', value);

    // Position
    block.setPosition(x, -40);
    block.setVisible(true);
    block.setActive(true);
    block.setAlpha(1);
    block.setScale(1);
    block.angle = 0;

    this.activeBlocks.push(block);
    return block;
  }

  despawn(block) {
    block.setVisible(false);
    block.setActive(false);
    block.setData('type', null);
    const idx = this.activeBlocks.indexOf(block);
    if (idx !== -1) this.activeBlocks.splice(idx, 1);
    // Kill any running tweens
    this.scene.tweens.killTweensOf(block);
  }

  update(delta) {
    const toRemove = [];
    for (const block of this.activeBlocks) {
      if (!block.active) { toRemove.push(block); continue; }
      block.y += block.getData('speed') * (delta / 1000);
      // Check fallen off screen
      if (block.y > GAME_HEIGHT + 40) {
        toRemove.push(block);
        this.scene.events.emit('blockMissed', block);
      }
    }
    for (const b of toRemove) this.despawn(b);
  }

  chooseType(weights) {
    // weights: [green%, yellow%, red%, blue%]
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    const types = ['green', 'yellow', 'red', 'blue'];
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return types[i];
    }
    return types[0];
  }

  pauseAll() {
    for (const b of this.activeBlocks) {
      b.setData('speedPaused', b.getData('speed'));
      b.setData('speed', 0);
    }
  }

  resumeAll() {
    for (const b of this.activeBlocks) {
      const saved = b.getData('speedPaused');
      if (saved !== null && saved !== undefined) {
        b.setData('speed', saved);
        b.setData('speedPaused', null);
      }
    }
  }

  despawnAll() {
    const copy = [...this.activeBlocks];
    for (const b of copy) this.despawn(b);
  }

  playGoverningAnimation(block, onComplete) {
    const shimmer = block.shimmer;
    const W = 140, H = 60;
    shimmer.clear();
    shimmer.fillStyle(COLORS.goldLight, 0.35);
    shimmer.fillRoundedRect(-W/2, -H/2, W, H, 6);
    shimmer.setAlpha(0);

    this.scene.tweens.add({
      targets: shimmer,
      alpha: { from: 0, to: 1 },
      duration: 150,
      yoyo: true,
      repeat: 1,
      onComplete,
    });
  }

  applyRedTint(on) {
    for (const block of this.activeBlocks) {
      if (on) {
        block.setTint(0xFF8888);
      } else {
        block.clearTint();
      }
    }
  }

  destroy() {
    this.despawnAll();
    for (const b of this.pool) {
      b.destroy();
    }
    this.pool = [];
    this.activeBlocks = [];
  }
}
