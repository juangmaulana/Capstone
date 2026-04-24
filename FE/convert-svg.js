const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const files = [
  'peta-titik-api-baluran-2019-2025',
  'peta-lst-baluran-2025',
  'peta-indeks-vegetasi-baluran-2025',
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const name of files) {
    const svgPath = path.join(__dirname, 'public', `${name}.svg`);
    const pngPath = path.join(__dirname, 'public', `${name}.png`);

    console.log(`Converting ${name}.svg → ${name}.png ...`);

    // Use 2x of original size for good quality
    const w = 1304;
    const h = 1304;
    await page.setViewportSize({ width: w, height: h });

    const fileUrl = `file://${svgPath}`;
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: pngPath,
      fullPage: true,
      type: 'png',
      timeout: 120000,
    });

    const stats = fs.statSync(pngPath);
    console.log(`  ✓ Saved ${name}.png (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  await browser.close();
  console.log('\nDone! All SVGs converted to PNG.');
})();
