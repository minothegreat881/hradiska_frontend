import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto('http://localhost:4188/design/blog/mikulcice-kopcany?t=pecat',{waitUntil:'domcontentloaded'});
/* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
   bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
   skončí na lište, nie na mape). */
for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(500);
}
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4500);
const r = await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim()==='3'
    && getComputedStyle(e).color==='rgb(201, 72, 58)' && !e.children.length && e.offsetParent);
  if (!el) return 'nenájdené';
  const rod = el.parentElement;
  return { vlastnyInline: el.getAttribute('style')||'(žiadny)',
           trieda: el.className||'(žiadna)',
           rodicInline: rod?.getAttribute('style')||'(žiadny)',
           rodicTrieda: rod?.className||'(žiadna)',
           vSide: !!el.closest('.lart-side'), vBody: !!el.closest('.article-body-wrapper') };
});
console.log(JSON.stringify(r,null,1));
await b.close();
