/**
 * BALÍK PRE NATÍVNU APLIKÁCIU.
 *
 * Aplikácia si nesie web so sebou, takže všetko, čo je v `dist/`, skončí
 * v APK. Hotový `dist/` má ale 274 MB — z toho 202 MB sú zdrojové výškové
 * dáta (`.tif`, `.zip`), ktoré slúžia len pythonovským skriptom pri
 * generovaní reliéfu a na webe ani v appke ich nikto nečíta. Balík s nimi
 * by Google Play ani neprijal (limit 200 MB).
 *
 * Tento skript spraví z `dist/` zoštíhlenú kópiu `dist-app/`, ktorú berie
 * Capacitor (`webDir` v `capacitor.config.ts`).
 *
 * ČO SA VYNECHÁVA A PREČO:
 *   • zdrojové výškové dáta — vstup pre `scripts/merge_srtm.py`, nie obsah;
 *   • predvykreslené HTML článkov a kategórií — to je pre vyhľadávače,
 *     appka si stránky skladá sama z `index.html`;
 *   • `sitemap.xml`, `robots.txt` — to isté;
 *   • `sw.js` — service worker vnútri schránky nemá čo zrýchľovať (súbory
 *     sú v zariadení) a vie narobiť zmätok so starou verziou v pamäti.
 *
 * ČO SA NAOPAK NECHÁVA: mapové dlaždice `/mapa` (3 152 súborov, 21 MB).
 * Vďaka nim funguje mapa hradísk v aplikácii **aj bez signálu** — a práve
 * to je dôvod, prečo má appka zmysel.
 */

import fs from 'fs';
import path from 'path';

const KOREN = path.resolve(process.cwd());
const ZDROJ = path.join(KOREN, 'dist');
const CIEL = path.join(KOREN, 'dist-app');

/** Priečinky, ktoré sa do appky nekopírujú vôbec. */
const VYNECHAT_PRIECINKY = new Set([
  'articles',   // predvykreslené články pre vyhľadávače
  'blog',       // to isté, druhá cesta
  'kategoria',
  'category',
]);

/** Súbory podľa prípony — zdrojové dáta reliéfu. */
const VYNECHAT_PRIPONY = new Set(['.tif', '.tfw', '.hdr', '.hgt', '.zip']);

/** Jednotlivé súbory, ktoré patria webu, nie aplikácii. */
const VYNECHAT_SUBORY = new Set(['sitemap.xml', 'robots.txt', 'sw.js', 'offline.html']);

let skopirovanych = 0;
let vynechanych = 0;
let bajtovSkopirovanych = 0;
let bajtovVynechanych = 0;

function kopiruj(zo, do_) {
  for (const polozka of fs.readdirSync(zo, { withFileTypes: true })) {
    const zdroj = path.join(zo, polozka.name);
    const ciel = path.join(do_, polozka.name);

    if (polozka.isDirectory()) {
      if (VYNECHAT_PRIECINKY.has(polozka.name) && path.dirname(zdroj) === ZDROJ) {
        bajtovVynechanych += velkostPriecinka(zdroj);
        vynechanych++;
        continue;
      }
      fs.mkdirSync(ciel, { recursive: true });
      kopiruj(zdroj, ciel);
      continue;
    }

    const pripona = path.extname(polozka.name).toLowerCase();
    if (VYNECHAT_PRIPONY.has(pripona) || VYNECHAT_SUBORY.has(polozka.name)) {
      bajtovVynechanych += fs.statSync(zdroj).size;
      vynechanych++;
      continue;
    }

    fs.copyFileSync(zdroj, ciel);
    bajtovSkopirovanych += fs.statSync(ciel).size;
    skopirovanych++;
  }
}

function velkostPriecinka(p) {
  let s = 0;
  for (const x of fs.readdirSync(p, { withFileTypes: true })) {
    const c = path.join(p, x.name);
    s += x.isDirectory() ? velkostPriecinka(c) : fs.statSync(c).size;
  }
  return s;
}

if (!fs.existsSync(ZDROJ)) {
  console.error('[app] `dist/` neexistuje — najprv `npm run build`.');
  process.exit(1);
}

fs.rmSync(CIEL, { recursive: true, force: true });
fs.mkdirSync(CIEL, { recursive: true });
kopiruj(ZDROJ, CIEL);

const mb = (b) => (b / 1024 / 1024).toFixed(1) + ' MB';
console.log(`[app] balík pripravený: ${skopirovanych} súborov, ${mb(bajtovSkopirovanych)}`);
console.log(`[app] vynechané: ${vynechanych} položiek, ${mb(bajtovVynechanych)}`);

if (bajtovSkopirovanych > 150 * 1024 * 1024) {
  console.warn('[app] POZOR: balík presiahol 150 MB — Google Play má strop 200 MB.');
}
