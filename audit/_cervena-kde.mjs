import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
for (const [meno,w,h,mob] of [['desktop',1440,900,false],['mobil',390,844,true]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const p = await ctx.newPage();
  await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
  await p.goto('http://localhost:4188/design/blog/mikulcice-kopcany?t=pecat',{waitUntil:'domcontentloaded'});
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4500);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const out=[];
    for (const el of document.querySelectorAll('*')) {
      if (!el.textContent || !el.textContent.trim() || el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.color !== 'rgb(201, 72, 58)') continue;
      const rr = el.getBoundingClientRect();
      const vidno = el.offsetParent !== null && rr.width > 1 && rr.height > 1;
      if (!vidno) continue;
      /* skutočný podklad: prvý predok s nepriehľadnou farbou */
      let bg='(žiadny)';
      for (let e=el; e; e=e.parentElement) { const q=getComputedStyle(e).backgroundColor;
        const m=/rgba?\(([^)]+)\)/.exec(q); if (m) { const p2=m[1].split(',').map(parseFloat);
          if ((p2[3]??1) > .95) { bg=q; break; } } }
      out.push({ text: el.textContent.trim().slice(0,22), px:+parseFloat(cs.fontSize).toFixed(1),
        w:cs.fontWeight, bg, kde:(el.closest('[class]')?.className+'').split(' ')[0] });
    }
    return out;
  });
  console.log(`\n### ${meno} — viditeľných prvkov s pečatnou červenou: ${r.length}`);
  const zhluk={}; r.forEach(x=>{const k=`${x.px}px/${x.w} na ${x.bg}`; (zhluk[k]??=[]).push(x.text);});
  for (const [k,v] of Object.entries(zhluk)) console.log(`  ${v.length}×  ${k}   napr. „${v.slice(0,3).join('", „')}"`);
  await ctx.close();
}
await b.close();
