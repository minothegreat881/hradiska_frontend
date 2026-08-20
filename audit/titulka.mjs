/**
 * Titulná doska: ako vyzerá a či sa nadpis na fotografii dá prečítať.
 *
 * Kontrast sa NEMERÁ z priemeru fotky — nadpis leží nad snímkou, kde má
 * každé písmeno pod sebou inú farbu. Číta sa preto SKUTOČNE VYKRESLENÝ
 * obraz: stránka sa odfotí raz s nadpisom skrytým (čistý podklad aj so
 * zhustenou hmlou) a z tej snímky sa odčítajú pixely presne pod plochou
 * nadpisu. Berie sa najhorší, nie priemer.
 *
 * Prvá verzia skriptu si prechod dokresľovala do plátna podľa CSS. Bola to
 * rekonštrukcia, nie meranie — a keď sa gradient zmenil, merala už niečo iné
 * než čo bolo na obrazovke.
 *
 *   node audit/titulka.mjs [URL]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const BASE = process.argv[2] || 'http://localhost:4188';
const KAM = 'audit/snimky/titulka';
mkdirSync(KAM, { recursive: true });

const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const jas = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const pomer = (a, c) => { const x = jas(a), y = jas(c); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

const b = await chromium.launch();
let zle = 0;

for (const [meno, sirka, vyska] of [['pc', 1440, 1000], ['mobil', 390, 844]]) {
  const merítko = 2;
  const ctx = await b.newContext({ viewport: { width: sirka, height: vyska }, deviceScaleFactor: merítko });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'domcontentloaded' });

  for (let i = 0; i < 12; i++) {
    const x = p.locator('.ck-btn-primary').first();
    if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(350); }
    if (!(await p.locator('.ck-root').count())) break;
    await p.waitForTimeout(400);
  }

  await p.waitForSelector('.lhero-obraz');
  await p.waitForFunction(() => {
    const i = document.querySelector('.lhero-obraz');
    return i && i.complete && i.naturalWidth > 0;
  });
  await p.waitForTimeout(800);

  const titul = await p.locator('.lhero-titul').boundingBox();
  const info = await p.evaluate(() => {
    const t = document.querySelector('.lhero-titul');
    const o = document.querySelector('.lhero-obraz').getBoundingClientRect();
    const r = t.getBoundingClientRect();
    const cs = getComputedStyle(t);
    const f = /rgba?\(([^)]+)\)/.exec(cs.color)[1].split(',').map(parseFloat).slice(0, 3);
    return { farba: f, px: parseFloat(cs.fontSize), tucne: +cs.fontWeight,
             naFotke: r.top < o.bottom && r.bottom > o.top && r.left < o.right && r.right > o.left };
  });

  /* Podklad bez písmen: nadpis sa na chvíľu skryje (miesto si drží, takže
     sa nič nepresunie) a odfotí sa presne jeho obdĺžnik. */
  await p.locator('.lhero-napis').evaluate((el) => { el.style.visibility = 'hidden'; });
  await p.waitForTimeout(150);
  const podklad = `${KAM}/_podklad-${meno}.png`;
  await p.screenshot({ path: podklad, clip: titul });
  await p.locator('.lhero-napis').evaluate((el) => { el.style.visibility = ''; });
  await p.waitForTimeout(150);

  const { data, info: bm } = await sharp(podklad).raw().toBuffer({ resolveWithObject: true });
  let najhorsi = 99;
  for (let y = 0; y < bm.height; y += 2) {
    for (let x = 0; x < bm.width; x += 2) {
      const i = (y * bm.width + x) * bm.channels;
      const r = pomer(info.farba, [data[i], data[i + 1], data[i + 2]]);
      if (r < najhorsi) najhorsi = r;
    }
  }

  const doska = await p.locator('.lhero').boundingBox();
  await p.screenshot({ path: `${KAM}/${meno}.png`, clip: doska });

  const velke = info.px >= 24 || (info.px >= 18.66 && info.tucne >= 700);
  const min = velke ? 3 : 4.5;
  const ok = najhorsi >= min;
  if (!ok) zle++;
  console.log(`${meno.padEnd(6)} nadpis ${Math.round(info.px)}px ${info.naFotke ? 'na fotke ' : 'na papieri'} · najhorší pixel ${najhorsi.toFixed(2)}:1 (min ${min})  ${ok ? '✔' : '✘'}`);
  await ctx.close();
}

await b.close();
console.log(`snímky v ${KAM}`);
process.exit(zle ? 1 : 0);
