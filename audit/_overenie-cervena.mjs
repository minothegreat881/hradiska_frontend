/* Posledný prežívajúci nález sa overuje PROTI SNÍMKE, nie proti skriptu.
   Detektor sa tri razy mýlil, štvrtý omyl nie je vylúčený. */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:1000}, deviceScaleFactor:3 });
const p = await ctx.newPage();
if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto(BASE+'/design/blog/mikulcice-kopcany?t=pecat', { waitUntil:'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4000);
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2500);

/* všetky prvky s pečatnou červenou ako farbou textu */
const zoznam = await p.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    if ([...el.children].some(c => c.textContent && c.textContent.trim())) continue;
    const cs = getComputedStyle(el);
    if (cs.color !== 'rgb(201, 72, 58)') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2) continue;
    out.push({ text: el.textContent.trim().slice(0,24), px: +parseFloat(cs.fontSize).toFixed(1),
      hrubka: cs.fontWeight, trieda: (el.className+'').split(' ')[0] || el.tagName.toLowerCase(),
      velkyText: parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700),
      rodic: (el.parentElement?.className+'').split(' ')[0] });
  }
  return out;
});
console.log('prvky s #c9483a ako farbou textu:');
zoznam.forEach(z => console.log(`  ${String(z.px).padStart(5)}px  hrúbka ${z.hrubka}  ${z.velkyText ? 'VEĽKÝ TEXT → hranica 3:1' : 'drobný → hranica 4,5:1'}   .${z.trieda}  „${z.text}"  (v .${z.rodic})`));

/* výrez okolo čísla kroku časovej osi + päty, na očné overenie */
for (const [meno, sel] of [['cislo-osi', '.lart-side, .lart-more'], ['pata', 'footer, .lfoot']]) {
  const el = p.locator(sel).first();
  if (await el.count()) { await el.scrollIntoViewIfNeeded().catch(()=>{}); await p.waitForTimeout(800);
    await el.screenshot({ path: `audit/screenshots/_overenie-${meno}.png` }).catch(()=>{});
    console.log(`výrez uložený: _overenie-${meno}.png`); }
}
await b.close();
