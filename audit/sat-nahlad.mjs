/* Ako vyzerá ostrá stránka so zapnutým šatom a bez neho.
 *   node audit/sat-nahlad.mjs <cesta> [URL]
 */
import { chromium } from 'playwright';
const CESTA = process.argv[2] || '/blog/mikulcice-kopcany';
const BASE = process.argv[3] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const MENO = CESTA.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'domov';
const b = await chromium.launch();
for (const [znacka, dopyt] of [['bez', '?sat=povodna'], ['pecat', '?sat=pecat']]) {
  const ctx = await b.newContext({ viewport:{width:1440,height:900} });
  const p = await ctx.newPage();
  if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
  await p.goto(BASE+CESTA+dopyt, { waitUntil:'domcontentloaded' });
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.waitForTimeout(7000);
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(3000);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(1500);
  const stav = await p.evaluate(() => ({
    trieda: document.querySelector('.min-h-screen')?.className,
    tema: document.querySelector('.min-h-screen')?.getAttribute('data-theme'),
    papier: getComputedStyle(document.body).backgroundColor,
  }));
  console.log(`${znacka.padEnd(6)} trieda="${stav.trieda}" tema=${stav.tema} pozadie=${stav.papier}`);
  /* Celá stránka býva 20 000 px vysoká a na posúdenie sa nedá pozerať.
     Berú sa preto tri výrezy v čitateľnej mierke. */
  for (const [kde, y] of [['hore', 0], ['telo', 1400], ['spodok', -1]]) {
    if (y === -1) await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
    else await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(1200);
    await p.screenshot({ path:`audit/screenshots/sat-${MENO}-${kde}-${znacka}.png` });
  }
  await ctx.close();
}
await b.close();
