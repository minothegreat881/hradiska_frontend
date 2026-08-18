/* Obhliadka celého webu v novom šate: každá routa, snímka + hľadanie
 * zvyškov starej grafiky (zlaté a hnedé odtiene starej palety).
 *   node audit/obhliadka.mjs [URL]
 */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';

const ROUTY = [
  ['domov', '/'], ['galeria', '/galeria'], ['aktuality', '/aktuality'],
  ['kategoria', '/category/kniezacie-sidla'], ['clanok', '/blog/mikulcice-kopcany'],
  ['hladat', '/hladat?q=hradisko'], ['o-nas', '/o-nas'],
  ['zasady', '/ochrana-osobnych-udajov'], ['podmienky', '/podmienky-pouzivania'],
  ['prihlasenie', '/prihlasenie'], ['404', '/tato-stranka-neexistuje'],
];

/* Odtiene starej palety — zlatá, hnedá, krémová. */
const STARE = ['#a87437','#9a5d1f','#c8862f','#7d4f1d','#c4a574','#e6c98a','#3a2a1e',
               '#2d1810','#8a795e','#faf7f1','#f4ead4','#efe2c0','#c8a15a','#e3d4ad'];

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
const p = await ctx.newPage();
if (BASE.includes('localhost')) {
  await p.route('**/strapi/uploads/**', async (r) => { const c=new URL(r.request().url()).pathname.replace('/strapi','');
    try { const res=await fetch('http://188.245.47.29'+c); r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'image/jpeg'}}); } catch { r.abort(); } });
  await p.route('**/strapi/api/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
}

for (const [meno, cesta] of ROUTY) {
  await p.goto(BASE + cesta, { waitUntil: 'domcontentloaded' });
  /* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
     bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
     skončí na lište, nie na mape). */
  for (let i = 0; i < 12; i++) {
    const x = p.locator('.ck-btn-primary').first();
    if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
    if (!(await p.locator('.ck-root').count())) break;
    await p.waitForTimeout(500);
  }
  await p.waitForTimeout(7000);
  const n = await p.evaluate((stare) => {
    const roz = (s) => { const m=/rgba?\(([^)]+)\)/.exec(s); if(!m) return null;
      const q=m[1].split(',').map(parseFloat);
      return '#'+q.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); };
    const najdene = {};
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const rodic = el.parentElement ? getComputedStyle(el.parentElement) : null;
      for (const [vl, hod] of [['color', cs.color], ['pozadie', cs.backgroundColor], ['ram', cs.borderTopColor]]) {
        const h = roz(hod); if (!h || !stare.includes(h)) continue;
        /* Zdedená hodnota nie je nález — hlási sa len to, čo si prvok
           nastavuje sám. Inak celý dokument svieti farbou z `body`. */
        if (vl === 'color' && rodic && rodic.color === hod) continue;
        const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) continue;
        const kluc = `${h} (${vl}) ${el.tagName.toLowerCase()}.${(el.className+'').split(' ').filter(Boolean)[0]||''}`;
        najdene[kluc] = (najdene[kluc] || 0) + 1;
      }
    }
    return najdene;
  }, STARE);
  const polozky = Object.entries(n).sort((a,b)=>b[1]-a[1]);
  console.log(`\n### ${meno}  ${cesta}  — zvyškov starej palety: ${polozky.reduce((s,[,c])=>s+c,0)}`);
  polozky.slice(0, 6).forEach(([k, c]) => console.log(`  ${String(c).padStart(3)}×  ${k}`));
  await p.screenshot({ path: `audit/screenshots/obhliadka-${meno}.png` });
}
await b.close();
