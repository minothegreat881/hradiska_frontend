import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const p = await ctx.newPage();
await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto('http://localhost:4188/design?t=pecat',{waitUntil:'domcontentloaded'});
/* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
   bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
   skončí na lište, nie na mape). */
for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(500);
}
await p.waitForTimeout(5000);
await p.locator('.lfoot-cols').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
await p.locator('.lfoot-cols').screenshot({ path:'audit/screenshots/_pata-mobil-po.png' });
console.log('výrez pätičky uložený');
await b.close();
