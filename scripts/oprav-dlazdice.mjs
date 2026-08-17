/**
 * Spriehľadní čiernu vo reliéfnych dlaždiciach.
 *
 * PREČO. Dlaždice vznikli z `gdal2tiles`, ktorý miesta bez podkladu vypĺňa
 * ČIERNOU. Prevod do WebP mal tú výplň spriehľadniť, ale kľúčoval len
 * neutrálnu šeď hillshadu — čierna ostala nepriehľadná. Na mape sa to
 * prejavilo ako čierne pásy pri hornom a dolnom okraji výrezu dlaždíc; kým
 * bolo plátno nižšie, boli mimo pohľadu.
 *
 * AKO. Dlaždice sa dekódujú a znova zakódujú v prehliadači (Node WebP nevie),
 * pixel tmavší než prah dostane nulovú priehľadnosť. Prah je nízky zámerne:
 * najtmavšie miesto skutočného reliéfu má okolo #55534d, takže sa ho to
 * nedotkne.
 *
 *   node scripts/oprav-dlazdice.mjs            (najprv len vypíše, čo by robil)
 *   node scripts/oprav-dlazdice.mjs --zapis    (prepíše dlaždice)
 */
import { chromium } from 'playwright';
import { readdirSync, statSync, writeFileSync } from 'node:fs';

const ZAPIS = process.argv.includes('--zapis');
const PRAH = 12;          // pod touto hodnotou vo všetkých zložkách = výplň
const KVALITA = 0.9;

const zoznam = [];
const chod = (d) => {
  for (const e of readdirSync(d)) {
    const c = d + '/' + e;
    if (statSync(c).isDirectory()) chod(c);
    else if (c.endsWith('.webp')) zoznam.push(c);
  }
};
chod('public/mapa');
console.log(`dlaždíc: ${zoznam.length}${ZAPIS ? '' : '  (skúšobný beh, nič sa neprepíše)'}`);

const b = await chromium.launch();
const p = await (await b.newContext()).newPage();
await p.goto('http://localhost:4188/');

let opravenych = 0, bezZmeny = 0;
const DAVKA = 60;
for (let i = 0; i < zoznam.length; i += DAVKA) {
  const davka = zoznam.slice(i, i + DAVKA);
  const vysledky = await p.evaluate(async ({ cesty, prah, kvalita }) => {
    const out = [];
    for (const c of cesty) {
      const url = c.replace('public', '');
      const img = new Image();
      if (!await new Promise(r => { img.onload = () => r(true); img.onerror = () => r(false); img.src = url; })) {
        out.push({ c, stav: 'nenačítal sa' }); continue;
      }
      const cv = document.createElement('canvas');
      cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d');
      g.drawImage(img, 0, 0);
      const obraz = g.getImageData(0, 0, cv.width, cv.height);
      const d = obraz.data;
      let zmenenych = 0;
      for (let k = 0; k < d.length; k += 4) {
        if (d[k + 3] > 0 && d[k] < prah && d[k + 1] < prah && d[k + 2] < prah) {
          d[k + 3] = 0; zmenenych++;
        }
      }
      if (!zmenenych) { out.push({ c, stav: 'bez zmeny' }); continue; }
      g.putImageData(obraz, 0, 0);
      out.push({ c, stav: 'opravená', zmenenych, data: cv.toDataURL('image/webp', kvalita) });
    }
    return out;
  }, { cesty: davka, prah: PRAH, kvalita: KVALITA });

  for (const v of vysledky) {
    if (v.stav === 'opravená') {
      opravenych++;
      if (ZAPIS) writeFileSync(v.c, Buffer.from(v.data.split(',')[1], 'base64'));
    } else bezZmeny++;
  }
  process.stdout.write(`\r  ${Math.min(i + DAVKA, zoznam.length)}/${zoznam.length} · opravených ${opravenych}`);
}
console.log(`\nopravených: ${opravenych} · bez zmeny: ${bezZmeny}${ZAPIS ? ' · zapísané' : ' · NEZAPÍSANÉ (spusti s --zapis)'}`);
await b.close();
