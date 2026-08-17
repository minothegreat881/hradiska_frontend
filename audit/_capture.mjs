/* Vizuálny baseline laboratória. Ukladá na disk, nič nenačítava do kontextu. */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://webdesignforhradiskask.vercel.app';
const ROUTY = [
  ['domovska',  '/design?t=pecat'],
  ['clanok',    '/design/blog/mikulcice-kopcany?t=pecat'],
  ['povodna',   '/design?t=povodna'],
];
const SIRKY = [['desktop', 1440, 900], ['mobil', 390, 844]];
const b = await chromium.launch();
for (const [meno, w, h] of SIRKY) {
  const ctx = await b.newContext({
    viewport: { width: w, height: h },
    isMobile: meno === 'mobil', hasTouch: meno === 'mobil',
    deviceScaleFactor: 2,
  });
  const p = await ctx.newPage();
  for (const [n, cesta] of ROUTY) {
    await p.goto(BASE + cesta, { waitUntil: 'domcontentloaded' });
    for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
      if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
    await p.waitForTimeout(6000);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await p.waitForTimeout(2500);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `audit/screenshots/${n}-${meno}.png`, fullPage: true });
    console.log(`${n}-${meno}.png`);
  }
  await ctx.close();
}
await b.close();
