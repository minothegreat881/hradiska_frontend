import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
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
await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const out=[];
  for (const el of document.querySelectorAll('a,button,[role="button"]')) {
    const q = el.getBoundingClientRect();
    if (q.width < 2 || q.height < 2) continue;
    if (q.width >= 44 && q.height >= 44) continue;
    if (el.closest('.lmap')) continue;              // mapa = produkcia
    out.push({ w:Math.round(q.width), h:Math.round(q.height),
      trieda: (el.className+'').split(' ').filter(Boolean).slice(0,2).join('.') || el.tagName.toLowerCase(),
      rodic: (() => { const c=[]; for (let k=el.parentElement,i=0;k&&i<4;k=k.parentElement,i++) {
        const t=(k.className+'').split(' ').filter(Boolean)[0]; if (t) c.push(t); }
        return c.join(' < ') || '(bez tried)'; })(),
      text: (el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,20) });
  }
  return out;
});
const zhluk={}; r.forEach(x=>{ const k=x.trieda+' (v .'+x.rodic+')'; (zhluk[k]??=[]).push(`${x.w}x${x.h} „${x.text}"`); });
for (const [k,v] of Object.entries(zhluk)) console.log(`  ${v.length}×  ${k}\n        ${v.slice(0,3).join(' · ')}`);
await b.close();
