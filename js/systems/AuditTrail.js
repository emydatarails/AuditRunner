/* =====================================================
   AuditTrail — Golden Particle Constellation System
   ===================================================== */

'use strict';

class AuditTrail {
  constructor(scene) {
    this.scene   = scene;
    this.particles = [];
    this.MAX_PARTICLES = 200;
    this._graphics = null;
    this._renderTimer = 0;
    this._init();
  }

  _init() {
    // Single graphics object for all particles (performance)
    this._graphics = this.scene.add.graphics().setDepth(15);
  }

  emit(x, y, count = 4) {
    // Enforce max
    while (this.particles.length + count > this.MAX_PARTICLES) {
      this.particles.shift(); // Remove oldest
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 25;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 0.3,
        vy: -15 - Math.random() * 30,  // float upward
        life: 1,
        maxLife: 45 + Math.random() * 25, // seconds ×60
        size: 1.5 + Math.random() * 2,
        // settle: slow drift once upward motion done
        settled: false,
        drift: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  emitBurst(x, y, count = 8) {
    while (this.particles.length + count > this.MAX_PARTICLES) {
      this.particles.shift();
    }
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 0.25,
        vy: Math.sin(angle) * speed * 0.25 - 20,
        life: 1,
        maxLife: 55 + Math.random() * 20,
        size: 2 + Math.random() * 2.5,
        settled: false,
        drift: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  update(delta) {
    const dt = delta / 1000;
    const toRemove = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x  += p.vx;
      p.y  += p.vy * dt * 30;
      p.vx += p.drift;
      p.vy *= 0.97;  // decelerate upward
      if (Math.abs(p.vy) < 0.5) p.settled = true;

      if (p.settled) {
        p.vx *= 0.98;
        p.x  += Math.sin(Date.now() * 0.001 + i) * 0.2;
      }

      // Gentle drift within bounds
      if (p.x < 40) p.vx += 0.1;
      if (p.x > GAME_WIDTH - 40) p.vx -= 0.1;
      if (p.y < GAME_FIELD_TOP + 10) p.vy += 0.2;

      p.life -= 1 / (p.maxLife * 60);
      if (p.life <= 0) toRemove.push(i);
    }

    // Remove dead particles (reverse to preserve indices)
    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.particles.splice(toRemove[i], 1);
    }

    this._render();
  }

  _render() {
    const gfx = this._graphics;
    gfx.clear();

    if (this.particles.length === 0) return;

    // Draw constellation lines between nearby particles
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < Math.min(i + 8, this.particles.length); j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 60) {
          const lineAlpha = (1 - dist / 60) * 0.12 * Math.min(p1.life, p2.life);
          gfx.lineStyle(0.5, COLORS.gold, lineAlpha);
          gfx.beginPath();
          gfx.moveTo(p1.x, p1.y);
          gfx.lineTo(p2.x, p2.y);
          gfx.strokePath();
        }
      }
    }

    // Draw particles
    for (const p of this.particles) {
      const alpha = p.life * 0.85;
      // Outer glow
      gfx.fillStyle(COLORS.gold, alpha * 0.3);
      gfx.fillCircle(p.x, p.y, p.size * 2);
      // Core
      gfx.fillStyle(COLORS.goldLight, alpha);
      gfx.fillCircle(p.x, p.y, p.size);
    }
  }

  getParticleCount() { return this.particles.length; }

  // Returns an approximate "trail density" 0-1 for audit scenario checks
  getDensity() {
    return Math.min(1, this.particles.length / 80);
  }

  clear() {
    this.particles = [];
    this._graphics.clear();
  }

  thinOut() {
    // Called when gate is OFF — gradually remove particles
    if (this.particles.length > 0) {
      this.particles.splice(0, Math.ceil(this.particles.length * 0.05));
    }
  }

  destroy() {
    if (this._graphics) this._graphics.destroy();
    this.particles = [];
  }
}
