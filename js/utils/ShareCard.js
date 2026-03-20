/* =====================================================
   ShareCard — 1200×630 PNG Generator
   ===================================================== */
'use strict';

class ShareCard {
  static generate(stats) {
    const W = 1200, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const gold = '#D4A017', goldLight = '#F0C040';
    const bg   = '#0D1117', bg2 = '#161B22';
    const green = '#2ECC71', red = '#E74C3C';
    const text  = '#E8E8E8', muted = '#8A8A9A';

    const rank = getRank(stats.integrityPct);

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = '#2A2A3A';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Gold border
    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    // Header band
    ctx.fillStyle = bg2;
    ctx.fillRect(12, 12, W - 24, 72);
    ctx.strokeStyle = gold; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 84); ctx.lineTo(W - 12, 84); ctx.stroke();

    // Logo (top-left)
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = gold;
    ctx.letterSpacing = '4px';
    ctx.fillText('DATARAILS', 36, 54);

    // Game title (top-center)
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillStyle = text;
    ctx.textAlign = 'center';
    ctx.fillText('AUDIT RUNNER: The FinanceOS Protocol', W/2, 46);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = muted;
    ctx.fillText(`FY2026 — ${stats.monthsPlayed} Months Played`, W/2, 68);

    // Emoji grid (month history)
    const emojis = stats.monthHistory.map(m => m.emoji);
    ctx.textAlign = 'center';
    ctx.font = '26px serif';
    const emojiY = 120;
    const emojiSpacing = 38;
    const gridStartX = W/2 - (emojis.length * emojiSpacing) / 2 + emojiSpacing / 2;
    emojis.forEach((emoji, i) => {
      ctx.fillText(emoji, gridStartX + i * emojiSpacing, emojiY);
    });
    if (emojis.length === 0) {
      ctx.font = '24px "Courier New"';
      ctx.fillStyle = muted;
      ctx.fillText('(no months completed)', W/2, emojiY);
    }

    // Divider
    ctx.strokeStyle = gold + '44'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, 148); ctx.lineTo(W - 60, 148); ctx.stroke();

    // Stats (left column)
    const statsX = 80, statsColW = 480;
    const statRows = [
      { label: 'Consolidated Value',    value: formatScore(stats.totalScore) },
      { label: 'Governed Value',        value: formatScore(stats.governedTotal) },
      { label: 'Surprise Audits',       value: `${stats.auditsSurvived} survived` },
      { label: 'Material Weaknesses',   value: `${stats.materialWeaknesses}` },
      { label: 'AI Core Activations',   value: `${stats.aiActivations}` },
    ];

    ctx.textAlign = 'left';
    statRows.forEach((row, i) => {
      const y = 190 + i * 40;
      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = muted;
      ctx.fillText(row.label + ':', statsX, y);
      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillStyle = text;
      ctx.fillText(row.value, statsX + 260, y);
    });

    // Integrity bar
    const intPct = stats.integrityPct;
    const barY = 395, barX = statsX, barW = statsColW - 40, barH = 18;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = muted;
    ctx.fillText('Audit Integrity:', barX, barY - 6);
    ctx.fillStyle = '#2A2A3A';
    ctx.fillRect(barX, barY, barW, barH);
    const fillW = (intPct / 100) * barW;
    const barColor = intPct >= 90 ? gold : intPct >= 60 ? '#E67E22' : red;
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, fillW, barH);
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = text;
    ctx.fillText(`${intPct}%`, barX + barW + 12, barY + 14);

    // Vertical divider
    ctx.strokeStyle = '#2A2A3A'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W/2 + 20, 155); ctx.lineTo(W/2 + 20, 460); ctx.stroke();

    // Rank box (right column)
    const rankX = W/2 + 60, rankY = 175, rankW = W - rankX - 60;
    ctx.strokeStyle = gold; ctx.lineWidth = 2;
    ctx.strokeRect(rankX, rankY, rankW, 120);
    ctx.fillStyle = bg2;
    ctx.fillRect(rankX + 1, rankY + 1, rankW - 2, 118);
    ctx.textAlign = 'center';
    ctx.font = '36px serif';
    ctx.fillText(rank.icon, rankX + rankW/2, rankY + 48);
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = gold;
    ctx.fillText(rank.title, rankX + rankW/2, rankY + 80);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = muted;
    ctx.fillText(rank.subtitle, rankX + rankW/2, rankY + 106);

    // Quote
    const quote = ShareCard._buildQuote(stats, rank);
    ctx.font = 'italic 14px "Courier New", monospace';
    ctx.fillStyle = text;
    ctx.textAlign = 'center';
    const lines = ShareCard._wrapText(ctx, quote, rankW - 20);
    lines.forEach((line, i) => {
      ctx.fillText(line, rankX + rankW/2, rankY + 155 + i * 22);
    });

    // Footer
    ctx.fillStyle = bg2;
    ctx.fillRect(12, H - 60, W - 24, 48);
    ctx.strokeStyle = gold + '55'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, H - 60); ctx.lineTo(W - 12, H - 60); ctx.stroke();
    ctx.font = '13px "Courier New", monospace';
    ctx.fillStyle = gold; ctx.textAlign = 'center';
    ctx.fillText('Play Audit Runner → datarails.com/audit-runner', W/2, H - 30);
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = muted;
    ctx.fillText('#AuditRunner  #FinanceOS  #Datarails', W/2, H - 12);

    return canvas;
  }

  static _buildQuote(stats, rank) {
    const months = stats.monthsPlayed;
    const mw     = stats.materialWeaknesses;
    if (mw === 0 && months >= 6) return `${months} months. Zero material weaknesses. The audit trail doesn't lie.`;
    if (mw === 0) return `Clean ledger. Every block governed. Auditors are pleased.`;
    if (stats.integrityPct >= 75) return `${months} months survived. Mostly governed. Getting there.`;
    return `The Board has questions. The audit trail has answers. Neither are good.`;
  }

  static _wrapText(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxW && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  static buildCaption(stats) {
    const rank = getRank(stats.integrityPct);
    const months = stats.monthsPlayed;
    const mw = stats.materialWeaknesses;
    let caption = '';
    if (mw === 0 && months >= 6) {
      caption = `${months} months. Zero material weaknesses. The audit trail doesn't lie. 🛡️`;
    } else if (stats.integrityPct >= 75) {
      caption = `${months} months of financial governance. ${rank.icon} ${rank.title}.`;
    } else {
      caption = `Survived ${months} months of chaos. The Board is questioning some decisions.`;
    }
    return `${caption} #AuditRunner #FinanceOS — datarails.com/audit-runner`;
  }

  static download(canvas, filename = 'audit-runner-result.png') {
    canvas.toBlob(blob => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  static async copyToClipboard(canvas) {
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch(e) {
      console.warn('Clipboard copy failed:', e);
      return false;
    }
  }
}
