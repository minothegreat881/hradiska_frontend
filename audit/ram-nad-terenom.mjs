/* Je fokusový rám mapy vidieť nad SKUTOČNÝM reliéfom?
 *
 * Pod plátnom nie je jednotná plocha, ale terén — raz papierovo svetlý, raz
 * tmavý od tieňovania kopcov. Snímka mapy sa preto načíta späť do plátna
 * a odčítajú sa z nej naozajstné pixely pri okraji, kadiaľ rám vedie.
 *
 *   node audit/ram-nad-terenom.mjs [URL]
 */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const SVETLY_PAS = [243, 237, 225];   /* druhý pás rámu, viď mapa.css */
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
/* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
   bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
   skončí na lište, nie na mape). */
for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(500);
}
await p.waitForSelector('.lmap');
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(8000);
const ram = await p.evaluate(() => { const c=document.querySelector('.maplibregl-canvas'); c.focus();
  const cs=getComputedStyle(c); return { farba: cs.outlineColor, sirka: cs.outlineWidth }; });
const snimka = await p.locator('.lmap-canvas').screenshot();
const r = await p.evaluate(async ({ b64, ram, svetly }) => {
  const img = new Image();
  await new Promise(res => { img.onload = res; img.src = 'data:image/png;base64,' + b64; });
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  const jas = (c) => { const t = c.map(v => { v/=255; return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4; });
    return .2126*t[0]+.7152*t[1]+.0722*t[2]; };
  let sv = null, tm = null;
  for (const [x0,y0,w,h] of [[0,0,cv.width,10],[0,cv.height-10,cv.width,10],[0,0,10,cv.height],[cv.width-10,0,10,cv.height]])
    for (let y=y0;y<y0+h;y+=2) for (let x=x0;x<x0+w;x+=2) {
      const i=(y*cv.width+x)*4, c=[d[i],d[i+1],d[i+2]], L=jas(c);
      if (!sv || L>sv.L) sv={c,L}; if (!tm || L<tm.L) tm={c,L};
    }
  const m=/rgba?\(([^)]+)\)/.exec(ram.farba); const rc=m[1].split(',').map(parseFloat).slice(0,3);
  const pom=(a,b2)=>{const x=jas(a),y=jas(b2);return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2);};
  const hex=(c)=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  return { ram: hex(rc), svetlyTeren: hex(sv.c), tmavyTeren: hex(tm.c),
           cervSv: pom(rc,sv.c), cervTm: pom(rc,tm.c), svSv: pom(svetly,sv.c), svTm: pom(svetly,tm.c) };
}, { b64: snimka.toString('base64'), ram, svetly: SVETLY_PAS });
console.log(`terén: najsvetlejší ${r.svetlyTeren} · najtmavší ${r.tmavyTeren}`);
console.log(`  červený pás ${r.ram}: na svetlom ${r.cervSv}:1 · na tmavom ${r.cervTm}:1`);
console.log(`  svetlý  pás: na svetlom ${r.svSv}:1 · na tmavom ${r.svTm}:1`);
const ok=(a,c)=>Math.max(parseFloat(a),parseFloat(c))>=3;
console.log(`  → nad svetlým ${ok(r.cervSv,r.svSv)?'VIDNO ✔':'NEVIDNO ✘'} · nad tmavým ${ok(r.cervTm,r.svTm)?'VIDNO ✔':'NEVIDNO ✘'}`);
await b.close();
