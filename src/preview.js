const fs = require('node:fs');
const path = require('node:path');
const { getConfig, getSettings } = require('./storage');
const { renderMilestoneCard } = require('./cardRenderer');

async function main() {
  const config = getConfig();
  const settings = getSettings();

  const outDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const type of ['nitro', 'boost']) {
    const png = await renderMilestoneCard({
      emojis: settings[type],
      currentLevel: 4,
      brandTitle: config.brand.title,
      canvasSize: config.theme.canvas,
      timelineTheme: config.theme.timeline,
      totalLevels: config.milestones.totalLevels
    });

    fs.writeFileSync(path.join(outDir, `${type}-preview.png`), png);
  }

  console.log('Generated preview images in artifacts/.');
}

main();
