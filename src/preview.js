const fs = require('node:fs');
const path = require('node:path');
const { getConfig } = require('./storage');
const { renderMilestoneCard } = require('./cardRenderer');

async function main() {
  const config = getConfig();

  const outDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const type of ['nitro', 'boost']) {
    const png = await renderMilestoneCard({
      currentLevel: 4,
      brandTitle: config.brand.title,
      canvasSize: config.theme.canvas,
      totalLevels: config.milestones.totalLevels,
      type,
      progressLine: 'You will reach next badge in: 2 months'
    });

    fs.writeFileSync(path.join(outDir, `${type}-preview.png`), png);
  }

  console.log('Generated preview images in artifacts/.');
}

main();
