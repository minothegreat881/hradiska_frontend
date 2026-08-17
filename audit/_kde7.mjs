import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:3 });
const p = await ctx.newPage();
await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
await p.goto('http://localhost:4188/design?t=pecat',{waitUntil:'domcontentloaded'});
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4500);
const r = await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find(e => e.textContent.trim()==='7'
    && !e.children.length && getComputedStyle(e).color==='rgb(201, 72, 58)' && e.offsetParent);
  if (!el) return 'nenájdené';
  const retaz=[];
  for (let k=el, i=0; k && i<7; k=k.parentElement, i++)
    retaz.push((k.className+'').split(' ').filter(Boolean).slice(0,2).join('.') || k.tagName.toLowerCase());
  el.scrollIntoView({block:'center'});
  return { retaz, vLfoot: !!el.closest('.lfoot'), rodicTrieda: (el.parentElement?.className+'') };
});
console.log(JSON.stringify(r,null,1));
await p.waitForTimeout(900);
const b2 = await p.evaluate(() => { const el=[...document.querySelectorAll('*')].find(e=>e.textContent.trim()==='7'
  && !e.children.length && getComputedStyle(e).color==='rgb(201, 72, 58)' && e.offsetParent);
  const q=el.getBoundingClientRect(); return {x:q.x,y:q.y}; });
await p.screenshot({ path:'audit/screenshots/_nalez-sedmicka.png', clip:{x:Math.max(0,b2.x-150),y:Math.max(0,b2.y-30),width:360,height:80} });
await b.close();
