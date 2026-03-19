/* =====================================================
   AUDIT RUNNER — All Game Copy & Data Constants
   ===================================================== */

'use strict';

// ─── COLOR PALETTE ────────────────────────────────────
const COLORS = {
  bgPrimary:        0x0D1117,
  bgSecondary:      0x161B22,
  gold:             0xD4A017,
  goldLight:        0xF0C040,
  greenVerified:    0x1A7A4A,
  greenLight:       0x2ECC71,
  redShadow:        0xC0392B,
  redLight:         0xE74C3C,
  yellowUnverified: 0xE67E22,
  yellowDark:       0x5D3A00,
  bluePL:           0x1A4A7A,
  blueLight:        0x3498DB,
  textPrimary:      0xE8E8E8,
  textMuted:        0x8A8A9A,
  border:           0x2A2A3A,
  white:            0xFFFFFF,
  black:            0x000000,
};

// CSS hex equivalents (for DOM elements)
const CSS_COLORS = {
  bgPrimary:        '#0D1117',
  bgSecondary:      '#161B22',
  gold:             '#D4A017',
  goldLight:        '#F0C040',
  greenVerified:    '#1A7A4A',
  greenLight:       '#2ECC71',
  redShadow:        '#C0392B',
  redLight:         '#E74C3C',
  yellowUnverified: '#E67E22',
  yellowDark:       '#5D3A00',
  bluePL:           '#1A4A7A',
  blueLight:        '#3498DB',
  textPrimary:      '#E8E8E8',
  textMuted:        '#8A8A9A',
  border:           '#2A2A3A',
};

// ─── GAME DIMENSIONS ──────────────────────────────────
const GAME_WIDTH  = 1280;
const GAME_HEIGHT = 720;
const HUD_HEIGHT  = 60;
const CTRL_HEIGHT = 80;
const GAME_FIELD_TOP    = HUD_HEIGHT;
const GAME_FIELD_BOTTOM = GAME_HEIGHT - CTRL_HEIGHT;
const CATCH_ZONE_Y = GAME_FIELD_BOTTOM - 120; // blocks catchable below this y

// ─── BLOCK CONFIGURATIONS ─────────────────────────────
const BLOCK_TYPES = {
  green: {
    id:         'green',
    label:      'VERIFIED ERP',
    icon:       '▪',
    fillColor:  0x1A7A4A,
    borderColor:0x2ECC71,
    darkFill:   0x124E30,
    basePoints: 100,
    ungoverned: 100,
    labels: ['REVENUE / USD','OPEX / EUR','HEADCOUNT','CAPEX / USD','NET INCOME','GROSS MARGIN','EBITDA','CASH FLOW'],
    values: ['$2.4M','€847K','1,240 HC','$12.1M','$4.7M','€3.2M','$8.9M','$1.1M'],
  },
  yellow: {
    id:         'yellow',
    label:      'UNVERIFIED CSV',
    icon:       '⚠',
    fillColor:  0x5D3A00,
    borderColor:0xE67E22,
    darkFill:   0x3D2600,
    basePoints: 60,
    ungoverned: 100,
    labels: ['CSV IMPORT','MANUAL ENTRY','MARKETING DATA','EXCEL UPLOAD','FIELD REPORT','SURVEY DATA','UNVALIDATED'],
    values: ['$450K','€210K','847 rows','$1.2M','€95K','317 entries','$2.1M'],
  },
  red: {
    id:         'red',
    label:      'SHADOW SHEET',
    icon:       '✕',
    fillColor:  0x4A0000,
    borderColor:0xC0392B,
    darkFill:   0x2E0000,
    basePoints: 0,
    ungoverned: 0, // causes strike
    labels: ['SHADOW_v7.xlsx','LONDON_FINAL.xlsx','DO_NOT_SHARE','budget_REAL.xlsx','Q3_REVISED_v12','FINAL_FINAL_v3','USE_THIS_ONE.xlsx'],
    values: ['$3.7M ???','€820K ???','?? HC','$5.1M ???','€1.4M ???','UNKNOWN','$2.9M ???'],
  },
  blue: {
    id:         'blue',
    label:      'CURRENCY P&L',
    icon:       '◈',
    fillColor:  0x001A3A,
    borderColor:0x1A4A7A,
    darkFill:   0x000E22,
    basePoints: 200,
    ungoverned: 100,
    labels: ['P&L / EUR→USD','FX EXPOSURE','HEDGED POSITION','CROSS-BORDER TX','FOREX RESERVE','MULTI-CCY BOOK','RATE EXPOSURE'],
    values: ['€2.8M→$3.1M','$7.4M FX','EUR/USD 1.08','£920K','¥14.2M','$5.6M','€3.9M'],
  },
};

// ─── MONTH CONFIGURATIONS ─────────────────────────────
// weights: [green%, yellow%, red%, blue%]
const MONTH_CONFIGS = [
  { month:1,  speed:120, rate:2.0,  blocksToClose:20, weights:[80,15,5,0]   },
  { month:2,  speed:140, rate:1.75, blocksToClose:22, weights:[80,15,5,0]   },
  { month:3,  speed:170, rate:1.5,  blocksToClose:24, weights:[60,30,10,0]  },
  { month:4,  speed:200, rate:1.25, blocksToClose:24, weights:[50,25,20,5]  },
  { month:5,  speed:230, rate:1.1,  blocksToClose:25, weights:[50,25,20,5]  },
  { month:6,  speed:270, rate:1.0,  blocksToClose:25, weights:[40,25,25,10] },
  { month:7,  speed:310, rate:0.85, blocksToClose:26, weights:[30,25,30,15] },
  { month:8,  speed:360, rate:0.7,  blocksToClose:26, weights:[30,25,30,15] },
  { month:9,  speed:400, rate:0.65, blocksToClose:27, weights:[20,25,35,20] },
  { month:10, speed:420, rate:0.62, blocksToClose:27, weights:[20,25,35,20] },
  { month:11, speed:440, rate:0.6,  blocksToClose:28, weights:[20,25,35,20] },
  { month:12, speed:460, rate:0.6,  blocksToClose:28, weights:[20,25,35,20] },
];

function getMonthConfig(month) {
  if (month <= 0) month = 1;
  if (month <= MONTH_CONFIGS.length) return MONTH_CONFIGS[month - 1];
  // Beyond 12: extrapolate
  const base = MONTH_CONFIGS[MONTH_CONFIGS.length - 1];
  const extra = month - MONTH_CONFIGS.length;
  return {
    month,
    speed: Math.min(base.speed + extra * 20, 600),
    rate:  Math.max(base.rate - extra * 0.02, 0.4),
    blocksToClose: 28 + extra,
    weights: [20, 25, 35, 20],
  };
}

// ─── FAIL MESSAGES ────────────────────────────────────
const FAIL_MESSAGES = [
  "The SEC is typing...",
  "Your variance explanation has been flagged as vibes-based.",
  "The Board has lost confidence in your pivot tables.",
  "Reforecast initiated. Reason: astrology.",
  "The Board has requested your model in a format that does not exist.",
  "Your close process has been described as 'spirited.' — External Auditor Report, 2026",
  "Material Weakness confirmed. The London office sends their condolences. And another spreadsheet.",
  "Audit trail not found. In its place: 47 versions of a file called Final_v2_REVISED_REAL.xlsx.",
  "Your EBITDA was beautiful. While it lasted.",
  "The External Auditor has seen things. He is going on sabbatical.",
  "MATERIAL WEAKNESS DETECTED. The Board is considering a strongly-worded memo.",
  "Analysis complete: your financial model was, at best, aspirational.",
];

// ─── AUDIT DIALOGUE ───────────────────────────────────
const AUDIT_DIALOGUE = [
  "Where did this $450k come from? You have... 6 seconds.",
  "I've reviewed your consolidation. I have concerns.",
  "Interesting. Your Q3 travel expenses are... creative.",
  "The committee finds your variance explanation to be vibes-based.",
  "I see a figure here. I'd like to know its origin. Now.",
  "Your headcount numbers disagree with each other. Fascinating.",
  "Someone in this room knows where this number came from.",
];

// ─── BOARD INSIGHTS (AI CORE) ─────────────────────────
const BOARD_INSIGHTS = [
  "EBITDA is up 12% — someone tell the CFO it's safe to buy the private jet.",
  "Anomaly detected in Travel & Entertainment — someone is buying too many lattes.",
  "Headcount variance resolved. Turns out London hired 3 people and told no one.",
  "Forecast accuracy: 98.4%. Your CFO is about to look very smart in the board meeting.",
  "Currency exposure neutralized. Your EUR hedges are actually working this time.",
  "Q3 close complete. This is what a clean audit looks like.",
  "Revenue recognition: clean. Your auditors are considering a thank-you card.",
  "All 47 spreadsheet versions reconciled into 1 source of truth. Finally.",
];

// ─── HALLUCINATION ERRORS ─────────────────────────────
const HALLUCINATION_ERRORS = [
  "I've analyzed your data and concluded your company is a lemonade stand. In 1987. Please fix your source data.",
  "Forecast complete: Revenue will be either up, down, or flat. Check your inputs.",
  "I found 47 versions of Q3. I have chosen the one named final_FINAL_v3_USE_THIS_ONE.xlsx.",
  "I cannot work with this. Neither can your auditors. Govern your data first.",
  "Analysis error: I keep finding a spreadsheet called 'Do Not Share with CFO'. I have many questions.",
  "WARNING: 'Marketing_Budget_Actual_REAL_v9_USE_THIS.xlsx' detected. AI Core disabled for everyone's safety.",
];

// ─── MONTH EMOJIS (Share Card) ────────────────────────
const MONTH_EMOJIS = {
  clean:        '📗',
  audit_passed: '🛡️',
  ai_active:    '🤖',
  strikes:      '📕',
  failed:       '💥',
};

// ─── RANK TITLES ──────────────────────────────────────
const RANKS = [
  { min: 99, title: 'CFO of the Year',            icon: '🏆', subtitle: 'The audit trail doesn\'t lie.' },
  { min: 90, title: 'The Sovereign Source',        icon: '🏛️', subtitle: 'Your data is impeccable.' },
  { min: 75, title: 'Senior Financial Architect',  icon: '📊', subtitle: 'Strong governance instincts.' },
  { min: 60, title: 'Spreadsheet Survivor',        icon: '📋', subtitle: 'You made it. Mostly intact.' },
  { min:  0, title: 'Spreadsheet Junior',          icon: '📎', subtitle: 'The Board has questions.' },
];

function getRank(integrityPct) {
  for (const rank of RANKS) {
    if (integrityPct >= rank.min) return rank;
  }
  return RANKS[RANKS.length - 1];
}

// ─── SCORE FORMATTING ─────────────────────────────────
function formatScore(rawPoints) {
  const dollars = rawPoints * 50000;
  if (dollars >= 1e12) return `$${(dollars / 1e12).toFixed(1)}T`;
  if (dollars >= 1e9)  return `$${(dollars / 1e9).toFixed(1)}B`;
  if (dollars >= 1e6)  return `$${(dollars / 1e6).toFixed(1)}M`;
  if (dollars >= 1e3)  return `$${(dollars / 1e3).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

function formatIntPct(pct) {
  return `${Math.max(0, Math.round(pct))}%`;
}

// ─── FLOATING MESSAGE TEMPLATES ───────────────────────
const STRIKE_MESSAGES = [
  { strike: 1, text: "CFO is asking questions...",                   color: 0xE67E22 },
  { strike: 2, text: "The Board has lost confidence in your pivot tables.", color: 0xE74C3C },
  { strike: 3, text: "MATERIAL WEAKNESS CONFIRMED",                  color: 0xC0392B },
];

const CATCH_MESSAGES = {
  green:  { text: '+VERIFIED',  color: 0x2ECC71 },
  yellow: { text: '+RECONCILED',color: 0xE67E22 },
  blue:   { text: '+GOVERNED',  color: 0x3498DB },
  red_governed:   { text: 'REJECTED ✕', color: 0xC0392B },
  red_ungoverned: { text: 'STRIKE!',    color: 0xC0392B },
  miss_early:     { text: '-PREMATURE', color: 0x8A8A9A },
  miss_fallen:    { text: 'MISSED',     color: 0x8A8A9A },
};

// ─── SYSTEM CRASH MESSAGES ────────────────────────────
const CRASH_MESSAGES = [
  "System integrity check complete. Your governed data survived. Ungoverned data: deleted.",
  "RECONCILIATION FAILURE. Ungoverned records purged from the ledger.",
  "System crash neutralized. Governed data intact. The rest: gone.",
];

// ─── SURGE WARNING ────────────────────────────────────
const SURGE_WARNINGS = [
  "Incoming: The London office has sent their version. There are 14 of them.",
  "ALERT: Shadow spreadsheets detected in the pipeline. Governance Gate critical.",
  "WARNING: Multiple conflicting workbooks inbound. Brace for impact.",
];

// ─── FISCAL PERIODS ───────────────────────────────────
function getFiscalLabel(month) {
  const quarter = Math.ceil(month / 3);
  const monthInQ = ((month - 1) % 3) + 1;
  return `MONTH ${month} — FY2026 Q${quarter}`;
}
