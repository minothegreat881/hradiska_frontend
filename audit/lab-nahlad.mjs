/* Porovná stránku v starom šate a v Pečati (labová cesta).
 *   node audit/lab-nahlad.mjs <stara-cesta> <labova-cesta> [URL]
 */
import { chromium } from 'playwright';
const STARA = process.argv[2], NOVA = process.argv[3];
const BASE = process.argv[4] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const MENO = (STARA.replace(/[^\w]+/g,'-').replace(/^-|-$/g,'') || 'domov');
const b = await chromium.launch();
for (const [znacka, cesta] of [['stary', STARA], ['pecat', NOVA]]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
  await p.goto(BASE+cesta, { waitUntil:'domcontentloaded' });
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.waitForTimeout(7000);
  await p.screenshot({ path:`audit/screenshots/prevod-${MENO}-${znacka}.png` });
  await ctx.close();
}
console.log(`prevod-${MENO}-stary.png / -pecat.png`);
await b.close();
