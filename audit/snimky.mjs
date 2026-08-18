/* Snímky dotknutých rout. `node audit/snimky.mjs <predtym|potom> [URL]` */
import { chromium } from 'playwright';
const ZNACKA = process.argv[2] || 'stav';
const BASE = process.argv[3] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
for (const [meno, w, h, mob] of [['desktop',1440,900,false], ['mobil',390,844,true]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob, deviceScaleFactor:1 });
  const p = await ctx.newPage();
  if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
  for (const [n, cesta] of [['domovska','/'], ['clanok','/blog/mikulcice-kopcany']]) {
    await p.goto(BASE+cesta, { waitUntil:'domcontentloaded' });
    for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
      if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
    await p.waitForTimeout(5000);
    await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(2500);
    await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(1500);
    await p.screenshot({ path:`audit/screenshots/${n}-${meno}-${ZNACKA}.png`, fullPage:true });
    console.log(`${n}-${meno}-${ZNACKA}.png`);
  }
  await ctx.close();
}
await b.close();
