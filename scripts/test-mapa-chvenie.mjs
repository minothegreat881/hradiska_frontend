/**
 * Meria, či značky pri približovaní držia s mapou.
 *
 * Body, zhluky aj názvy miest sú HTML nad plátnom mapy. Ak sa ich poloha
 * prepočítava až po tom, čo mapa vykreslí snímok, značky zaostávajú — časť
 * snímkov ostane bez zmeny a potom nasleduje skok. Presne to človek vidí ako
 * chvenie a poskakovanie.
 *
 * Postup: v stránke beží odčítavanie polohy 60× za sekundu, medzitým sa
 * z ovládača točí kolieskom. Hodnotí sa LEN čas, keď sa mapa naozaj hýbe —
 * snímky po dobehnutí sú nehybné oprávnene.
 *
 * Sleduje sa konkrétne MIESTO podľa zemepisnej polohy, nie odkaz na prvok:
 * React počas približovania prvky vymieňa (zhluky sa rozpadajú) a odpojený
 * prvok by sa tváril, že zamrzol.
 *
 *   node scripts/test-mapa-chvenie.mjs [URL]
 */
import { chromium } from 'playwright';

const URL = process.argv[2] || 'http://localhost:4188/';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 3; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(300); }
  else break;
}
await p.waitForSelector('.lmap-canvas');
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(4500);

const box = await p.locator('.lmap-canvas').boundingBox();
const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);

const start = () => p.evaluate(() => {
  const prvy = document.querySelector('.lmap-mesto[data-lng]')
    || document.querySelector('.lmap-node[data-lng]')
    || document.querySelector('.lmap-mesto');
  if (!prvy) return false;
  /* Staršie verzie stránky polohu v značke nenesú — vtedy sa to isté miesto
     hľadá podľa názvu. Bez toho by sa dali merať len nové verzie a porovnanie
     „pred a po" by nebolo možné. */
  const podlaPolohy = !!prvy.dataset.lng;
  const vyber = podlaPolohy ? `[data-lng="${prvy.dataset.lng}"][data-lat="${prvy.dataset.lat}"]` : null;
  const nazov = podlaPolohy ? null : prvy.querySelector('.lmap-mesto-n').textContent;
  window.__vz = [];
  const najdi = () => {
    if (vyber) return document.querySelector(vyber);
    for (const e of document.querySelectorAll('.lmap-mesto')) {
      if (e.querySelector('.lmap-mesto-n').textContent === nazov) return e;
    }
    return null;
  };
  const tik = () => {
    const el = najdi();
    const m = el && /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(el.style.transform);
    window.__vz.push(m ? [+m[1], +m[2]] : null);
    window.__raf = requestAnimationFrame(tik);
  };
  tik();
  return true;
});
const stop = () => p.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__vz; });

const merania = [];
for (let k = 0; k < 6; k++) {
  if (!(await start())) { await p.waitForTimeout(600); continue; }
  await p.mouse.move(cx, cy);
  for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, k % 2 ? 200 : -200); await p.waitForTimeout(110); }
  await p.waitForTimeout(500);
  const r = await stop();

  const d = [];
  for (let i = 1; i < r.length; i++) {
    d.push(r[i] && r[i - 1] ? Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]) : null);
  }
  const prvy = d.findIndex(x => x > 0.01);
  const posl = d.map(x => x > 0.01).lastIndexOf(true);
  if (prvy < 0 || posl - prvy < 5) { await p.waitForTimeout(600); continue; }
  const okno = d.slice(prvy, posl + 1).filter(x => x !== null);
  merania.push({
    zamrznute: okno.filter(x => x <= 0.01).length / okno.length,
    maxSkok: Math.max(...okno),
    snimkov: okno.length,
  });
  await p.waitForTimeout(700);
}

if (!merania.length) { console.log('nepodarilo sa odmerať'); await b.close(); process.exit(1); }
const pr = (f) => merania.reduce((s, m) => s + f(m), 0) / merania.length;
console.log(`meraní: ${merania.length} · snímkov v pohybe: ${pr(m => m.snimkov).toFixed(0)}`);
console.log(`zamrznutých snímkov POČAS pohybu: ${(pr(m => m.zamrznute) * 100).toFixed(0)} % · najväčší skok: ${pr(m => m.maxSkok).toFixed(1)} px`);
await b.close();
