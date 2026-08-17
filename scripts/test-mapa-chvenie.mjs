/* Meria, či značky pri približovaní držia s mapou.
 *
 * Počas animácie sa 60× za sekundu odčíta poloha bodu z jeho `transform`.
 * Keď polohu prepočítava React až po vykreslení snímku, časť snímkov ostane
 * bez zmeny a potom nasleduje skok — a presne to je to chvenie. Meria sa
 * podiel „zamrznutých" snímkov a najväčší skok medzi dvoma snímkami.
 */
import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4188/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForSelector('.lmap-canvas');
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(4500);

const merania = [];
for (let k = 0; k < 5; k++) {
  const r = await p.evaluate(() => new Promise(res => {
    const el = document.querySelector('.lmap-node[data-lng], .lmap-node');
    if (!el) return res(null);
    const vzorky = [];
    const čítaj = () => {
      const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform);
      if (m) vzorky.push([+m[1], +m[2]]);
    };
    let n = 0;
    const tik = () => { čítaj(); if (++n < 40) requestAnimationFrame(tik); else res(vzorky); };
    document.querySelector('.lmap-zoom-box button').click();
    requestAnimationFrame(tik);
  }));
  if (!r || r.length < 10) { await p.waitForTimeout(700); continue; }
  let zamrznute = 0, maxSkok = 0;
  for (let i = 1; i < r.length; i++) {
    const d = Math.hypot(r[i][0] - r[i-1][0], r[i][1] - r[i-1][1]);
    if (d === 0) zamrznute++;
    if (d > maxSkok) maxSkok = d;
  }
  merania.push({ zamrznute: zamrznute / (r.length - 1), maxSkok });
  await p.waitForTimeout(900);
}
const pr = (f) => (merania.reduce((s, m) => s + f(m), 0) / merania.length);
console.log(`zamrznutých snímkov: ${(pr(m => m.zamrznute) * 100).toFixed(0)} % · najväčší skok: ${pr(m => m.maxSkok).toFixed(1)} px`);
await b.close();
