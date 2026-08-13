import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
await p.goto(process.argv[2], { waitUntil: 'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForSelector('.lmap-pin', { timeout: 40000 });
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(3000);
const pin = await p.locator('.lmap-pin').first().boundingBox();
const cx = pin.x + pin.width/2, cy = pin.y + pin.height/2;
await p.mouse.move(cx - 120, cy - 120);
for (let i=1;i<=20;i++){ await p.mouse.move(cx-120+(120*i/20), cy-120+(120*i/20)); await p.waitForTimeout(30); }
await p.waitForTimeout(900);
const el = await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e?e.tagName+'.'+(e.className.baseVal??e.className):null;},[cx,cy]);
console.log('pod kurzorom:', el);
console.log('zvýraznených bodov:', await p.locator('.lmap-pin.is-hot').count(), ' kariet:', await p.locator('.lmap-card').count());
// klik na zhluk
const cl = await p.locator('.lmap-cluster').first().boundingBox();
if (cl) { await p.mouse.click(cl.x+cl.width/2, cl.y+cl.height/2); await p.waitForTimeout(2000);
  console.log('po kliku na zhluk — bodov:', await p.locator('.lmap-pin').count()); }
await b.close();
