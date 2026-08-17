/* Overenie sporných nálezov: namiesto hádania farby pozadia z kaskády sa
   pozadie ODČÍTA Z OBRAZOVKY — vyrenderovaný pixel tesne vedľa textu. */
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.goto('https://webdesignforhradiskask.vercel.app/design/blog/mikulcice-kopcany?t=pecat', { waitUntil:'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForTimeout(6500);
const ciele = ['Odborné texty','Migrácie slovanských kmeňov','Lokalita','Zdieľať článok','48.8081'];
for (const t of ciele) {
  const el = p.locator(`text=${t}`).first();
  if (!await el.count()) { console.log(`${t}: nenájdené`); continue; }
  await el.scrollIntoViewIfNeeded().catch(()=>{});
  await p.waitForTimeout(600);
  const box = await el.boundingBox();
  if (!box) { console.log(`${t}: bez polohy`); continue; }
  const farba = await el.evaluate(e => getComputedStyle(e).color);
  const shot = await p.screenshot({ clip: { x: box.x, y: Math.max(0, box.y - 6), width: Math.min(60, box.width), height: 4 } });
  console.log(`${t}  ·  farba textu ${farba}  ·  vzorka pozadia uložená`);
  const fs = await import('node:fs');
  fs.writeFileSync(`audit/screenshots/_vzorka-${t.slice(0,12).replace(/[^\w]/g,'_')}.png`, shot);
}
await b.close();
