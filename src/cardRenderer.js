const { createCanvas } = require('@napi-rs/canvas');

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
  bg.addColorStop(0, '#040404');
  bg.addColorStop(0.35, '#161006');
  bg.addColorStop(0.8, '#0a0a0a');
  bg.addColorStop(1, '#030303');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const topGold = ctx.createRadialGradient(width * 0.5, 0, 20, width * 0.5, 30, width * 0.75);
  topGold.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
  topGold.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = topGold;
  ctx.fillRect(0, 0, width, height);

  const blocks = [
    [35, 340], [88, 370], [145, 332], [200, 362],
    [width - 240, 48], [width - 182, 83], [width - 125, 45], [width - 72, 78]
  ];

  blocks.forEach(([x, y], i) => {
    const size = i % 2 === 0 ? 62 : 48;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffe66a';
    ctx.shadowBlur = 25;
    ctx.fillRect(x, y, size, size);
    ctx.restore();
  });

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 9; i += 1) {
    ctx.fillRect(110 + (i * 135), 80, 100, 280);
  }
  ctx.restore();
}

function drawTimeline(ctx, { emojis, currentLevel, totalLevels, width, theme }) {
  const startX = 150;
  const endX = width - 150;
  const y = 205;

  for (let i = 1; i <= totalLevels; i += 1) {
    const x = startX + ((endX - startX) * (i - 1)) / (totalLevels - 1);
    const isPast = i < currentLevel;
    const isCurrent = i === currentLevel;

    const baseW = isCurrent ? 104 : 88;
    const baseH = isCurrent ? 66 : 58;

    ctx.save();
    ctx.globalAlpha = isPast ? theme.pastOpacity : 1;

    const chipGradient = ctx.createLinearGradient(x - baseW / 2, y - baseH / 2, x + baseW / 2, y + baseH / 2);
    chipGradient.addColorStop(0, isCurrent ? '#ffd84d' : '#1a1a1a');
    chipGradient.addColorStop(1, isCurrent ? '#c79400' : '#090909');

    ctx.fillStyle = chipGradient;
    ctx.strokeStyle = isCurrent ? '#ffe9a2' : 'rgba(255, 215, 0, 0.45)';
    ctx.lineWidth = isCurrent ? 3.5 : 2;

    if (isCurrent) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 30;
    }

    ctx.beginPath();
    ctx.roundRect(x - baseW / 2, y - baseH / 2, baseW, baseH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = isCurrent ? '#161616' : '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isCurrent ? '38px sans-serif' : '32px sans-serif';
    ctx.fillText(emojis[String(i)] || '•', x, y - 2);

    ctx.fillStyle = 'rgba(255, 224, 130, 0.95)';
    ctx.font = '17px sans-serif';
    ctx.fillText(`L${i}`, x, y + 47);

    if (i < totalLevels) {
      const nextX = startX + ((endX - startX) * i) / (totalLevels - 1);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + baseW / 2 + 6, y);
      ctx.lineTo(nextX - 52, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}

async function renderMilestoneCard({ emojis, currentLevel, brandTitle, canvasSize, timelineTheme, totalLevels }) {
  const { width, height } = canvasSize;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  drawLuxuryBackground(ctx, width, height);

  ctx.fillStyle = '#ffe08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '64px sans-serif';
  ctx.fillText(brandTitle, width / 2, 74);

  drawTimeline(ctx, {
    emojis,
    currentLevel,
    totalLevels,
    width,
    theme: timelineTheme
  });

  ctx.fillStyle = 'rgba(255, 222, 138, 0.90)';
  ctx.font = '26px sans-serif';
  ctx.fillText('Premium Nitro & Boost Timeline', width / 2, 420);

  return await canvas.encode('png');
}

module.exports = {
  getProgress,
  formatRelative,
  renderMilestoneCard
};
