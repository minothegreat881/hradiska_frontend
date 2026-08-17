import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900} });
const p = await ctx.newPage();
await p.goto('https://webdesignforhradiskask.vercel.app/design?t=pecat', { waitUntil:'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
  if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForTimeout(6500);
const r = await p.evaluate(() => {
  let ustalene=0, riziko=[];
  for (const img of document.querySelectorAll('img')) {
    if (img.getAttribute('width') && img.getAttribute('height')) { ustalene++; continue; }
    const cs = getComputedStyle(img);
    const rodic = img.parentElement ? getComputedStyle(img.parentElement) : null;
    const drzi = cs.position === 'absolute'
      || (rodic && (rodic.aspectRatio !== 'auto' || parseFloat(rodic.height) > 0 && rodic.height !== 'auto'))
      || cs.aspectRatio !== 'auto';
    if (drzi) ustalene++;
    else riziko.push({ src:(img.currentSrc||img.src||'').split('/').pop().slice(0,34), cls:img.className.slice(0,30) });
  }
  return { ustalene, riziko: riziko.slice(0,10), rizikoSpolu: riziko.length };
});
console.log(JSON.stringify(r,null,1));
await b.close();
