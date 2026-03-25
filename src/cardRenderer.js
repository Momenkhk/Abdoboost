const { createCanvas } = require('@napi-rs/canvas');

const NITRO_COLORS = ['#a9b6d0', '#f08a35', '#ced6e1', '#f7b02f', '#40b9ff', '#8964ff', '#62ef4f', '#ff4d93', '#86f0ff'];
const BOOST_COLORS = ['#ffb2ff', '#ff8bff', '#ef73ff', '#ff9af2', '#ffa8f6', '#ff98ff', '#f28bff', '#ffa5ff', '#ff7de8'];

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

  return {
    level,
    nextLevel,
    atMax,
    elapsed,
    remaining: nextTarget - now
  };
}

function drawLuxuryBackground(ctx, width, height) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#061415');
  bg.addColorStop(0.4, '#030f10');
  bg.addColorStop(1, '#091717');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const darkOverlay = ctx.createLinearGradient(0, 0, width, 0);
  darkOverlay.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
  darkOverlay.addColorStop(0.5, 'rgba(0, 0, 0, 0.15)');
  darkOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = darkOverlay;
  ctx.fillRect(0, 0, width, height);

  const blocks = [
    [30, 330], [90, 375], [160, 336], [230, 382],
    [width - 235, 28], [width - 170, 78], [width - 100, 32], [width - 48, 85]
  ];

  blocks.forEach(([x, y], i) => {
    const size = i % 2 === 0 ? 72 : 58;
    const glow = ctx.createLinearGradient(x, y, x + size, y + size);
    glow.addColorStop(0, '#e3ff41');
    glow.addColorStop(1, '#8b9d2e');
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = glow;
    ctx.shadowColor = '#dfff4f';
    ctx.shadowBlur = 20;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  });
}

function drawNitroBadge(ctx, x, y, color, highlight, faded) {
  ctx.save();
  ctx.globalAlpha = faded ? 0.35 : 1;
  const scale = highlight ? 1.16 : 1;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (highlight) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-50, -8);
  ctx.lineTo(-62, -20);
  ctx.lineTo(-85, -20);
  ctx.lineTo(-88, 8);
  ctx.lineTo(-58, 7);
  ctx.closePath();
  ctx.fill();

  const g = ctx.createLinearGradient(-40, -30, 40, 30);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBoostBadge(ctx, x, y, color, highlight, faded) {
  ctx.save();
  ctx.globalAlpha = faded ? 0.35 : 1;
  const scale = highlight ? 1.16 : 1;
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (highlight) {
    ctx.shadowColor = '#ff9df4';
    ctx.shadowBlur = 22;
  }

  const gem = ctx.createLinearGradient(-20, -25, 20, 25);
  gem.addColorStop(0, '#ffe5ff');
  gem.addColorStop(1, color);
  ctx.fillStyle = gem;

  ctx.beginPath();
  ctx.moveTo(0, -36);
  ctx.lineTo(30, 0);
  ctx.lineTo(0, 36);
  ctx.lineTo(-30, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function drawTimeline(ctx, { currentLevel, totalLevels, width, type, emojis }) {
  const startX = 130;
  const endX = width - 130;
  const iconY = type === 'nitro' ? 150 : 170;
  const markerBaseY = 268;

  for (let i = 1; i <= totalLevels; i += 1) {
    const x = startX + ((endX - startX) * (i - 1)) / (totalLevels - 1);
    const isPast = i < currentLevel;
    const isCurrent = i === currentLevel;

    if (type === 'nitro') {
      drawNitroBadge(ctx, x, iconY, NITRO_COLORS[i - 1], isCurrent, isPast);

      ctx.save();
      ctx.globalAlpha = isPast ? 0.4 : 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = isCurrent ? '30px sans-serif' : '24px sans-serif';
      ctx.fillText(emojis[String(i)] || '•', x, iconY);
      ctx.restore();
    } else {
      drawBoostBadge(ctx, x, iconY, BOOST_COLORS[i - 1], isCurrent, isPast);

      ctx.save();
      ctx.globalAlpha = isPast ? 0.4 : 1;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = isCurrent ? '30px sans-serif' : '24px sans-serif';
      ctx.fillText(emojis[String(i)] || '•', x, iconY);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#8fa6a8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, iconY + 38);
      ctx.lineTo(x, markerBaseY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 16, markerBaseY + 18);
      ctx.lineTo(x, markerBaseY + 4);
      ctx.lineTo(x + 16, markerBaseY + 18);
      ctx.stroke();
      ctx.restore();
    }
  }
}

async function renderMilestoneCard({ currentLevel, brandTitle, canvasSize, totalLevels, type, progressLine, emojis }) {
  const { width, height } = canvasSize;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawLuxuryBackground(ctx, width, height);

  ctx.fillStyle = '#d9ff48';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '58px sans-serif';
  ctx.fillText(brandTitle, width / 2, 56);

  drawTimeline(ctx, { currentLevel, totalLevels, width, type, emojis });

  ctx.fillStyle = '#f2f2f2';
  ctx.font = '34px sans-serif';
  ctx.fillText(progressLine, width / 2, 340);

  return await canvas.encode('png');
}

module.exports = {
  getProgress,
  formatRelative,
  renderMilestoneCard
};
