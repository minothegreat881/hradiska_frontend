import { chromium } from 'playwright';
const URL = process.argv[2] || 'http://localhost:4188/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:412,height:900}, deviceScaleFactor:2, isMobile:true, hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36' });
const p = await ctx.newPage();
await p.goto(URL, { waitUntil:'domcontentloaded' });
for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
await p.waitForSelector('.lmap-canvas');
await p.locator('.lmap-canvas').scrollIntoViewIfNeeded();
await p.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(p);
const bx = await p.locator('.lmap-canvas').boundingBox();
let x = Math.round(bx.x+bx.width/2), y = Math.round(bx.y+bx.height/2);
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
await p.waitForTimeout(60);
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
await p.waitForTimeout(4000);
const vp = p.viewportSize(); const mx = vp.width>>1, my = vp.height>>1;

const snap = () => p.evaluate(() => [...document.querySelectorAll('.lmap-mesto')].map(e => {
  const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(e.style.transform) || [0,0,0];
  return { n: e.querySelector('.lmap-mesto-n').textContent, x:+m[1], y:+m[2] };
}));
const drag = async (dx,dy) => {
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:mx,y:my}]});
  for (let i=1;i<=10;i++){ await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:mx+dx*i/10,y:my+dy*i/10}]}); await new Promise(r=>setTimeout(r,22)); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(900);
};
const pinch = async () => {
  for (let i=1;i<=10;i++){ const s=40+i*14;
    await cdp.send('Input.dispatchTouchEvent',{type:i===1?'touchStart':'touchMove',touchPoints:[{id:1,x:mx-s,y:my},{id:2,x:mx+s,y:my}]});
    await new Promise(r=>setTimeout(r,30)); }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(1100);
};
let zle=0, spolu=0, ukazka='', maxRovnakych=0, kdeR='';
for (let z=0; z<7; z++) {
  await pinch();
  for (let k=0;k<6;k++){
    const A = await snap();
    const dx = (k%2?70:-70), dy = (k%3===0?60:-50);
    await drag(dx,dy);
    const B = await snap();
    const c={}; B.forEach(o=>c[o.n]=(c[o.n]||0)+1);
    const mx2 = Math.max(0,...Object.values(c));
    if (mx2>maxRovnakych){ maxRovnakych=mx2; kdeR=JSON.stringify(Object.entries(c).filter(([,n])=>n>1)); }
    const bn=new Map(B.map(o=>[o.n,o]));
    for (const a of A){ const o=bn.get(a.n); if(!o) continue; spolu++;
      const e=Math.hypot((o.x-a.x)-dx,(o.y-a.y)-dy);
      if (e>12){ zle++; if(!ukazka) ukazka=`${a.n}: čakaný (${dx},${dy}), skutočný (${(o.x-a.x).toFixed(0)},${(o.y-a.y).toFixed(0)})`; } }
  }
}
console.log(`porovnaných: ${spolu} · nesedelo: ${zle}`, zle?'✘ '+ukazka:'✔');
console.log('najviac rovnakých názvov naraz:', maxRovnakych, maxRovnakych>1?('✘ '+kdeR):'✔');
await b.close();
