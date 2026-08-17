import { chromium } from 'playwright';
const BASE='http://localhost:4188', ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:1000}, deviceScaleFactor:4 });
const p = await ctx.newPage();
await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto(BASE+'/design/blog/mikulcice-kopcany?t=pecat',{waitUntil:'domcontentloaded'});
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4000);
await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim()==='3'
    && getComputedStyle(e).color==='rgb(201, 72, 58)' && !e.children.length);
  if (!el) return null;
  const retaz = [];
  for (let k = el, i = 0; k && i < 6; k = k.parentElement, i++) {
    const cs = getComputedStyle(k);
    retaz.push({
      kto: (k.className+'').split(' ').filter(Boolean).slice(0,2).join('.') || k.tagName.toLowerCase(),
      bg: cs.backgroundColor,
      inline: (k.getAttribute('style')||'').slice(0,60),
      viditelne: cs.display + '/' + cs.visibility,
    });
  }
  return retaz;
});
if (!info) console.log('nenájdené');
else for (const r of info) console.log('  ' + r.kto + '  bg=' + r.bg + '  ' + r.viditelne + '  inline="' + r.inline + '"');

await b.close();
