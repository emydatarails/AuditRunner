/* =====================================================
   ScoreSystem — Scoring, Multipliers, Integrity Meter
   ===================================================== */

'use strict';

class ScoreSystem {
  constructor(scene) {
    this.scene = scene;
    this.reset();
  }

  reset() {
    this.governedTotal    = 0;
    this.ungovernedTotal  = 0;
    this.totalRaw         = 0;
    this.multiplier       = 1;
    this.strikes          = 0;       // Strikes this month
    this.totalStrikes     = 0;       // All-time strikes
    this.integrityPct     = 100;
    this.monthsPlayed     = 0;
    this.monthHistory     = [];      // Per-month records
    this.auditsSurvived   = 0;
    this.aiActivations    = 0;
    this.materialWeaknesses = 0;
    this.currentMonthGoverned   = 0;
    this.currentMonthUngoverned = 0;
    this.currentMonthBlocks     = 0;
  }

  get totalScore() {
    return this.governedTotal + this.ungovernedTotal;
  }

  addPoints(points, governed = true) {
    const earned = Math.floor(points * this.multiplier);
    if (governed) {
      this.governedTotal += earned;
      this.currentMonthGoverned += earned;
    } else {
      this.ungovernedTotal += earned;
      this.currentMonthUngoverned += earned;
    }
    this.totalRaw += earned;
    this.currentMonthBlocks++;
    return earned;
  }

  strike() {
    this.strikes++;
    this.totalStrikes++;
    this.multiplier = 1; // Reset multiplier on strike

    if (this.strikes === 1) {
      this.integrityPct = 66;
      return 1;
    } else if (this.strikes === 2) {
      this.integrityPct = 33;
      return 2;
    } else if (this.strikes >= 3) {
      this.integrityPct = 0;
      this.materialWeaknesses++;
      return 3;
    }
    return this.strikes;
  }

  setMultiplier(m) {
    this.multiplier = m;
  }

  resetMultiplier() {
    this.multiplier = 1;
  }

  wipeUngoverned() {
    const wiped = this.ungovernedTotal;
    this.ungovernedTotal = 0;
    this.currentMonthUngoverned = 0;
    return wiped;
  }

  isMonthGoverned() {
    // Returns true if this month has been 100% governed (zero ungoverned snaps)
    return this.currentMonthUngoverned === 0 && this.currentMonthBlocks > 0;
  }

  closeMonth(monthNum, auditPassed, aiActive, retried) {
    const total = this.currentMonthGoverned + this.currentMonthUngoverned;
    const integrityRating = total > 0
      ? Math.round((this.currentMonthGoverned / total) * 100)
      : 100;

    let emoji = MONTH_EMOJIS.clean;
    if (retried)           emoji = MONTH_EMOJIS.failed;
    else if (aiActive)     emoji = MONTH_EMOJIS.ai_active;
    else if (auditPassed)  emoji = MONTH_EMOJIS.audit_passed;
    else if (this.strikes > 0) emoji = MONTH_EMOJIS.strikes;

    if (auditPassed) this.auditsSurvived++;
    if (aiActive)    this.aiActivations++;

    this.monthHistory.push({
      month: monthNum,
      governed: this.currentMonthGoverned,
      ungoverned: this.currentMonthUngoverned,
      blocks: this.currentMonthBlocks,
      strikes: this.strikes,
      integrityRating,
      emoji,
    });

    this.monthsPlayed = monthNum;

    // Reset per-month trackers
    this.strikes = 0;
    this.integrityPct = 100;
    this.currentMonthGoverned   = 0;
    this.currentMonthUngoverned = 0;
    this.currentMonthBlocks     = 0;
    this.multiplier = 1;
  }

  retryMonth() {
    // Penalty: -20% of current ungoverned score
    const penalty = Math.floor(this.ungovernedTotal * 0.2);
    this.ungovernedTotal = Math.max(0, this.ungovernedTotal - penalty);
    this.strikes = 0;
    this.integrityPct = 100;
    this.currentMonthGoverned   = 0;
    this.currentMonthUngoverned = 0;
    this.currentMonthBlocks     = 0;
    return penalty;
  }

  getAuditIntegrityPct() {
    const total = this.governedTotal + this.ungovernedTotal;
    if (total === 0) return 100;
    return Math.round((this.governedTotal / total) * 100);
  }

  hasEnoughTrailForAudit() {
    // Scenario A requires >50% governed score
    return this.getAuditIntegrityPct() >= 50;
  }

  getDisplayScore() { return formatScore(this.totalScore); }
  getGovernedDisplay() { return formatScore(this.governedTotal); }

  getStats() {
    return {
      totalScore:         this.totalScore,
      governedTotal:      this.governedTotal,
      ungovernedTotal:    this.ungovernedTotal,
      integrityPct:       this.getAuditIntegrityPct(),
      monthsPlayed:       this.monthsPlayed,
      totalStrikes:       this.totalStrikes,
      materialWeaknesses: this.materialWeaknesses,
      auditsSurvived:     this.auditsSurvived,
      aiActivations:      this.aiActivations,
      monthHistory:       this.monthHistory,
      multiplier:         this.multiplier,
    };
  }
}
