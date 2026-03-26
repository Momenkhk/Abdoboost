const { createCanvas } = require('@napi-rs/canvas');

const NITRO_COLORS = ['#b7bfd4', '#e67b2a', '#d9e1ea', '#ffaf1f', '#49bbff', '#9366ff', '#66f13d', '#ff4e97', '#8be9ff'];
const BOOST_COLORS = ['#f79dff', '#f48dff', '#ef7fff', '#ee88ff', '#ee93ff', '#f394ff', '#ef8bff', '#e783ff', '#de74ff'];

function monthsToMs(months) {
  return months * 30 * 24 * 60 * 60 * 1000;
}

function formatRelative(ms) {
  const abs = Math.abs(ms);
  const units = [
    { label: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    { label: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'day', ms: 24 * 60 * 60 * 1000 },
    { label: 'hour', ms: 60 * 60 * 1000 },
    { label: 'minute', ms: 60 * 1000 }
  ];

  for (const unit of units) {
    const value = Math.floor(abs / unit.ms);
    if (value >= 1) return `${value} ${unit.label}${value > 1 ? 's' : ''}`;
  }

  return 'moments';
}

function getProgress(startTimestamp, milestoneMonths) {
  const now = Date.now();
  const elapsed = now - startTimestamp;

  let level = 1;
  for (let i = milestoneMonths.length - 1; i >= 0; i -= 1) {
    if (elapsed >= monthsToMs(milestoneMonths[i])) {
      level = i + 1;
      break;
    }
  }

  const maxLevel = milestoneMonths.length;
  const nextLevel = Math.min(maxLevel, level + 1);
  const atMax = level >= maxLevel;
  const nextTarget = startTimestamp + monthsToMs(milestoneMonths[nextLevel - 1]);

  return { level, nextLevel, atMax, elapsed, remaining: nextTarget - now };
}

function drawBackground(ctx, width, height) {
  const g = ctx.createLinearGradient(0, 0, width, height);
  g.addColorStop(0, '#031112');
  g.addColorStop(0.55, '#05191a');
  g.addColorStop(1, '#031010');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i += 1) {
    const x = i < 4 ? 25 + i * 60 : width - 260 + ((i - 4) * 58);
    const y = i < 4 ? height - 125 + ((i % 2) * 38) : 18 + ((i % 2) * 38);
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#dbff4b';
    ctx.shadowColor = '#dbff4b';
    ctx.shadowBlur = 25;
    ctx.fillRect(x, y, 62, 62);
    ctx.restore();
  }
}

function drawNitroBadge(ctx, x, y, color, active, past) {
  ctx.save();
  ctx.globalAlpha = past ? 0.35 : 1;
  const scale = active ? 1.12 : 1;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-46, -6);
  ctx.lineTo(-64, -20);
  ctx.lineTo(-88, -20);
  ctx.lineTo(-90, 8);
  ctx.lineTo(-56, 8);
  ctx.closePath();
  ctx.fill();

  const cg = ctx.createLinearGradient(-44, -28, 42, 28);
  cg.addColorStop(0, '#ffffff');
  cg.addColorStop(1, color);
  ctx.fillStyle = cg;
  if (active) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
  }
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(32,40,70,0.55)';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBoostShape(ctx, level) {
  switch (level) {
    case 1:
      ctx.moveTo(0, -34); ctx.lineTo(30, 20); ctx.lineTo(-30, 20); break;
    case 2:
      ctx.moveTo(0, -36); ctx.lineTo(30, 0); ctx.lineTo(0, 36); ctx.lineTo(-30, 0); break;
    case 3:
      ctx.moveTo(0, -36); ctx.lineTo(22, -8); ctx.lineTo(14, 30); ctx.lineTo(-14, 30); ctx.lineTo(-22, -8); break;
    case 4:
      ctx.moveTo(0, -34); ctx.lineTo(30, -16); ctx.lineTo(30, 16); ctx.lineTo(0, 34); ctx.lineTo(-30, 16); ctx.lineTo(-30, -16); break;
    case 5:
      for (let i = 0; i < 5; i += 1) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; const r = i % 2 === 0 ? 34 : 14; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } break;
    case 6:
      ctx.moveTo(0, -36); ctx.lineTo(22, -10); ctx.lineTo(22, 12); ctx.lineTo(0, 36); ctx.lineTo(-22, 12); ctx.lineTo(-22, -10); break;
    case 7:
      ctx.moveTo(0, -34); ctx.lineTo(30, -16); ctx.lineTo(26, 20); ctx.lineTo(0, 36); ctx.lineTo(-26, 20); ctx.lineTo(-30, -16); break;
    case 8:
      ctx.moveTo(0, -36); ctx.lineTo(30, -14); ctx.lineTo(16, 32); ctx.lineTo(-16, 32); ctx.lineTo(-30, -14); break;
    default:
      ctx.moveTo(0, -36); ctx.lineTo(24, -8); ctx.lineTo(12, 34); ctx.lineTo(-12, 34); ctx.lineTo(-24, -8);
  }
}

function drawBoostBadge(ctx, x, y, color, active, past, level) {
  ctx.save();
  ctx.globalAlpha = past ? 0.35 : 1;
  const scale = active ? 1.12 : 1;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const lg = ctx.createLinearGradient(-30, -34, 24, 34);
  lg.addColorStop(0, '#ffe4ff');
  lg.addColorStop(1, color);
  ctx.fillStyle = lg;
  if (active) {
    ctx.shadowColor = '#ff8fff';
    ctx.shadowBlur = 26;
  }

  ctx.beginPath();
  drawBoostShape(ctx, level);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.38)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawTimeline(ctx, { currentLevel, totalLevels, width, type, emojis }) {
  const startX = 118;
  const endX = width - 118;
  const iconY = type === 'nitro' ? 160 : 150;

  for (let i = 1; i <= totalLevels; i += 1) {
    const x = startX + ((endX - startX) * (i - 1)) / (totalLevels - 1);
    const past = i < currentLevel;
    const active = i === currentLevel;

    if (type === 'nitro') {
      drawNitroBadge(ctx, x, iconY, NITRO_COLORS[i - 1], active, past);
    } else {
      drawBoostBadge(ctx, x, iconY, BOOST_COLORS[i - 1], active, past, i);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = '#a2b8ba';
      ctx.beginPath();
      ctx.moveTo(x, iconY + 42);
      ctx.lineTo(x, 252);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 14, 271);
      ctx.lineTo(x, 258);
      ctx.lineTo(x + 14, 271);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = past ? 0.45 : 0.95;
    ctx.font = active ? '22px sans-serif' : '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2f2f2';
    ctx.fillText(emojis[String(i)] || '•', x, type === 'nitro' ? 225 : 300);
    ctx.restore();
  }
}

async function renderMilestoneCard({ currentLevel, brandTitle, canvasSize, totalLevels, type, progressLine, emojis }) {
  const { width, height } = canvasSize;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx, width, height);

  ctx.fillStyle = '#FFD700';
  ctx.textAlign = 'center';
  ctx.font = '62px sans-serif';
  ctx.fillText(brandTitle, width / 2, 65);

  drawTimeline(ctx, { currentLevel, totalLevels, width, type, emojis });

  ctx.fillStyle = '#f0f0f0';
  ctx.font = '30px sans-serif';
  ctx.fillText(progressLine, width / 2, 350);

  return await canvas.encode('png');
}

module.exports = { getProgress, formatRelative, renderMilestoneCard };
