import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.goto('https://webdesignforhradiskask.vercel.app/design?t=pecat', { waitUntil:'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForSelector('.lmap'); await p.locator('.lmap-canvas').scrollIntoViewIfNeeded(); await p.waitForTimeout(6000);
const r = await p.evaluate(() => {
  const m = document.querySelector('.lmap');
  const gl = document.querySelector('.lmap-gl');
  return {
    rolaSekcie: m?.getAttribute('role') || null,
    popisSekcie: m?.getAttribute('aria-label') || null,
    platnoTabIndex: document.querySelector('.maplibregl-canvas')?.getAttribute('tabindex'),
    platnoRola: document.querySelector('.maplibregl-canvas')?.getAttribute('role'),
    platnoPopis: document.querySelector('.maplibregl-canvas')?.getAttribute('aria-label'),
    bodovTlacidiel: document.querySelectorAll('.lmap-pin').length,
    zoznamAlternativa: !!document.querySelector('.lmap [role="list"], .lmap ul, .lmap ol'),
    legendaTlacidlo: !!document.querySelector('.lmap-legend-h'),
    ariaLive: document.querySelectorAll('.lmap [aria-live]').length,
    pinTabbable: [...document.querySelectorAll('.lmap-pin')].filter(e=>e.tabIndex>=0).length,
  };
});
console.log(JSON.stringify(r,null,1));
// da sa k bodu dostat tabulátorom?
await p.evaluate(()=>document.querySelector('.lmap-canvas').scrollIntoView());
let najdene=null;
for (let i=0;i<60;i++){ await p.keyboard.press('Tab');
  const t = await p.evaluate(()=>{const e=document.activeElement;return e?e.className+'':'';});
  if (typeof t==='string' && t.includes('lmap-pin')) { najdene=i; break; } }
console.log('bod dosiahnutý tabulátorom po', najdene===null?'NEDOSIAHNUTÝ v 60 krokoch':najdene+' krokoch');
await b.close();
