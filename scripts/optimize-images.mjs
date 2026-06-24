// Jednorazový skript na konverziu veľkých dekoratívnych PNG-čiek na WebP.
// Pôvodné PNG NEMAŽEME — slúžia ako fallback v <picture> elementoch.
// Spustenie: `node scripts/optimize-images.mjs`
//
// Pre obnovu (vrátenie sa k pôvodným PNG): jednoducho zmaž vygenerované `*.webp` súbory
// z `public/` a uprav <picture> obal v komponentoch na holý <img>.

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');

// max výška/šírka pre dekoratívne obrázky — pri 420px renderovanej veľkosti je 1400 dostatočné aj na retina.
const TARGETS = [
  { input: 'ornament-keramika.png', maxWidth: 1400, webpQuality: 78 },
  { input: 'medailon-bojna.png', maxWidth: 1400, webpQuality: 78 },
];

const fmt = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';

for (const { input, maxWidth, webpQuality } of TARGETS) {
  const inputPath = path.join(PUBLIC, input);
  const webpName = input.replace(/\.png$/i, '.webp');
  const webpPath = path.join(PUBLIC, webpName);

  try {
    const before = await stat(inputPath);
    const meta = await sharp(inputPath).metadata();
    const targetWidth = Math.min(meta.width ?? maxWidth, maxWidth);

    await sharp(inputPath)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: webpQuality, effort: 4 })
      .toFile(webpPath);

    const after = await stat(webpPath);
    const ratio = ((1 - after.size / before.size) * 100).toFixed(1);
    console.log(
      `[ok]  ${input}: ${fmt(before.size)} (${meta.width}×${meta.height}) → ` +
        `${webpName}: ${fmt(after.size)} (${targetWidth}px, -${ratio}%)`,
    );
  } catch (err) {
    console.error(`[err] ${input}:`, err.message);
    process.exitCode = 1;
  }
}
