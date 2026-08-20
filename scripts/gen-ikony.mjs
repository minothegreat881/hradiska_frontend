/**
 * Ikony aplikácie z jednej predlohy.
 *
 * PREČO. Kresba loga mala vlastné sivobiele pozadie rgb(237,237,236), kým
 * maskovateľná ikona okolo nej mala krémový rám — v nainštalovanej aplikácii
 * bolo preto vidieť svetlejší štvorec vnútri ikony. Skript pozadie kresby
 * vyplaví a nahradí farbou papiera stránky, takže ikona je jednoliata.
 *
 * Vyplavuje sa OD ROHOV, nie podľa podobnosti farby v celej ploche: svetlé
 * kamene a šindľová strecha majú miestami takmer rovnaký odtieň a plošná
 * zámena by ich prežrala. Takto sa mení len to, čo s okrajom naozaj súvisí.
 *
 *   node scripts/gen-ikony.mjs
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const PREDLOHA = 'public/favicon-512.png';
const PAPIER = { r: 243, g: 237, b: 225 };   // #f3ede1 — papier stránky
const TOLERANCIA = 26;                        // vzdialenosť v RGB od farby rohu

const { data, info } = await sharp(PREDLOHA).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: K } = info;
const idx = (x, y) => (y * W + x) * K;

/* Referenčná farba pozadia sa berie z rohu, nie sa háda. */
const r0 = data[idx(0, 0)], g0 = data[idx(0, 0) + 1], b0 = data[idx(0, 0) + 2];
const blizko = (i) => Math.hypot(data[i] - r0, data[i + 1] - g0, data[i + 2] - b0) <= TOLERANCIA;

const videne = new Uint8Array(W * H);
const front = [];
for (let x = 0; x < W; x++) { front.push([x, 0], [x, H - 1]); }
for (let y = 0; y < H; y++) { front.push([0, y], [W - 1, y]); }

let zmenene = 0;
while (front.length) {
  const [x, y] = front.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const p = y * W + x;
  if (videne[p]) continue;
  const i = p * K;
  if (!blizko(i)) continue;
  videne[p] = 1;
  data[i] = PAPIER.r; data[i + 1] = PAPIER.g; data[i + 2] = PAPIER.b; data[i + 3] = 255;
  zmenene++;
  front.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}
console.log(`vyplavené pozadie: ${zmenene} z ${W * H} bodov (${Math.round(zmenene / (W * H) * 100)} %)`);

const cista = await sharp(data, { raw: { width: W, height: H, channels: K } }).png().toBuffer();

/* Bežné ikony — kresba cez celú plochu. */
for (const [subor, velkost] of [['public/favicon-512.png', 512], ['public/favicon-192.png', 192], ['public/apple-touch-icon.png', 180], ['public/favicon-32.png', 32], ['public/favicon-16.png', 16]]) {
  await sharp(cista).resize(velkost, velkost).flatten({ background: PAPIER }).png().toFile(subor + '.tmp');
}

/* Maskovateľná — kresba na 60 % plochy, zvyšok je bezpečná zóna. Systém si
   z nej vyreže kruh alebo zaoblený štvorec a nesmie odrezať kresbu. */
const vnutro = Math.round(512 * 0.6);
const odsadenie = Math.round((512 - vnutro) / 2);
await sharp({ create: { width: 512, height: 512, channels: 4, background: { ...PAPIER, alpha: 1 } } })
  .composite([{ input: await sharp(cista).resize(vnutro, vnutro).toBuffer(), left: odsadenie, top: odsadenie }])
  .png().toFile('public/maskable-512.png.tmp');

const { rename } = await import('node:fs/promises');
for (const f of ['public/favicon-512.png', 'public/favicon-192.png', 'public/apple-touch-icon.png', 'public/favicon-32.png', 'public/favicon-16.png', 'public/maskable-512.png']) {
  await rename(f + '.tmp', f);
  const m = await sharp(f).metadata();
  const roh = await sharp(f).extract({ left: 0, top: 0, width: 8, height: 8 }).toBuffer();
  const st = await sharp(roh).stats();
  console.log(`  ${f} ${m.width}×${m.height} · roh rgb(${st.channels.slice(0,3).map(c => Math.round(c.mean)).join(',')})`);
}
