/**
 * BALÍK WEBU PRE DORUČENIE CEZ VZDUCH (OTA).
 *
 * Aplikácia si nesie web v sebe (`dist-app/`), takže samotné zostavenie APK
 * by znamenalo, že každá zmena na webe čaká na nové vydanie v obchode.
 * Tento skript vyrobí z toho istého `dist-app/` **zip balík**, ktorý si
 * nainštalovaná aplikácia stiahne sama a nabudúce sa spustí už z neho.
 *
 * Verzia balíka je `1.<RRMMDD>.<HHMM>` — je to platný semver, rastie v čase
 * a na prvý pohľad povie, kedy balík vznikol. Do `app-balik.json` sa zapíše aj
 * odtlačok (sha256), ktorý si telefón po stiahnutí overí; keby sa súbor
 * pokazil po ceste, appka ho zahodí a ostane na starom balíku.
 *
 * Číslo verzie zároveň čítajú `capacitor.config.ts` (aby vstavaný balík v APK
 * hlásil presne túto verziu a appka hneď po inštalácii nesťahovala to, čo už
 * v sebe má) a server pri kontrole aktualizácií.
 *
 * Spúšťa sa ako súčasť `npm run app:sync`, pred `cap sync`.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { zipSync } from 'fflate';

const KOREN = process.cwd();
const ZDROJ = path.join(KOREN, 'dist-app');
const VYSTUP = path.join(KOREN, 'app-balik');

/** Súbory, ktoré sú už komprimované — znovu ich stláčať je len stratený čas. */
const NESTLACAT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.woff', '.woff2', '.gz', '.br', '.zip', '.mp4', '.webm']);

if (!fs.existsSync(path.join(ZDROJ, 'index.html'))) {
  console.error('[balík] chýba `dist-app/index.html` — najprv `npm run build && npm run app:priprav`.');
  process.exit(1);
}

function verzia() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `1.${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}.${p(d.getHours())}${p(d.getMinutes())}`;
}

/** Cesty v zipe musia byť s `/` a bez obalovej mapky — appka ich rozbalí tak, ako sú. */
function nacitaj(dir, zaklad = '') {
  const von = {};
  for (const z of fs.readdirSync(dir, { withFileTypes: true })) {
    const cesta = path.join(dir, z.name);
    const vnutri = zaklad ? `${zaklad}/${z.name}` : z.name;
    if (z.isDirectory()) Object.assign(von, nacitaj(cesta, vnutri));
    else von[vnutri] = [fs.readFileSync(cesta), { level: NESTLACAT.has(path.extname(z.name).toLowerCase()) ? 0 : 6 }];
  }
  return von;
}

const v = verzia();
const nazov = `hradiska-web-${v}.zip`;

console.log('[balík] čítam dist-app…');
const subory = nacitaj(ZDROJ);
console.log(`[balík] ${Object.keys(subory).length} súborov, stláčam (chvíľu to potrvá)…`);
const zip = zipSync(subory, { mtime: new Date() });

fs.mkdirSync(VYSTUP, { recursive: true });
/* Staré zipy sa neupratávajú samé — po vydaní si ich človek zmaže sám,
   ale nech tu neleží desať rovnakých balíkov z jedného večera. */
for (const s of fs.readdirSync(VYSTUP)) if (s.startsWith('hradiska-web-') && s.endsWith('.zip')) fs.unlinkSync(path.join(VYSTUP, s));

const cesta = path.join(VYSTUP, nazov);
fs.writeFileSync(cesta, zip);
const sha = crypto.createHash('sha256').update(zip).digest('hex');

/* Adresa, na ktorej balík leží. Nie je odvodená z požiadavky telefónu:
   appka beží na `https://localhost` a server o svojej verejnej adrese nevie
   (stojí za proxy). Preto ju sem zapisuje ten, kto balík vydáva. */
const ZAKLAD = process.env.APP_BALIK_ZAKLAD || 'https://webdesignforhradiskask.vercel.app/strapi/app';

const popis = {
  verzia: v,
  subor: nazov,
  url: `${ZAKLAD}/${nazov}`,
  sha256: sha,
  velkostMB: +(zip.length / 1024 / 1024).toFixed(1),
  vzniklo: new Date().toISOString(),
};
fs.writeFileSync(path.join(KOREN, 'app-balik.json'), JSON.stringify(popis, null, 2) + '\n');
fs.writeFileSync(path.join(VYSTUP, 'aktualizacia.json'), JSON.stringify({ version: v, url: popis.url, checksum: sha }, null, 2) + '\n');

console.log(`[balík] hotovo: ${nazov} (${popis.velkostMB} MB)`);
console.log(`[balík] verzia ${v}, sha256 ${sha.slice(0, 16)}…`);
console.log('[balík] nahrať na server: app-balik/*.zip a app-balik/aktualizacia.json do /opt/hradiska/public/app/');
