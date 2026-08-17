/* Nájde prvky, ktoré podľa kontrolného skriptu padajú, vypíše ich reťazec
   nádob a KAŽDÝ odfotí zblízka — na očné overenie, nie na vieru v skript. */
import { chromium } from 'playwright';
const ZDROJ='https://webdesignforhradiskask.vercel.app';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, deviceScaleFactor:3 });
const p = await ctx.newPage();
await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
  try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
    r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });

for (const [meno, cesta] of [['domovska','/design?t=pecat'], ['clanok','/design/blog/mikulcice-kopcany?t=pecat']]) {
  await p.goto('http://localhost:4188'+cesta,{waitUntil:'domcontentloaded'});
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4500);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2000);

  const n = await p.evaluate(() => {
    window.__zle = [];
    for (const el of document.querySelectorAll('*')) {
      if (!el.textContent || !el.textContent.trim() || el.children.length) continue;
      const cs = getComputedStyle(el);
      if (cs.color !== 'rgb(201, 72, 58)') continue;
      if (!el.offsetParent) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2) continue;
      const px = parseFloat(cs.fontSize);
      if (px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700)) continue;   // veľký text, hranica 3:1
      /* má prvok alebo niektorý predok vlastný prechod/obrázok? */
      let podklad = null, prechod = false;
      for (let e = el; e && !podklad; e = e.parentElement) {
        const c2 = getComputedStyle(e);
        if (c2.backgroundImage && c2.backgroundImage !== 'none') { prechod = true; podklad = c2.backgroundImage.slice(0,46); break; }
        const m = /rgba?\(([^)]+)\)/.exec(c2.backgroundColor);
        if (m) { const q = m[1].split(',').map(parseFloat); if ((q[3]??1) > .95) podklad = c2.backgroundColor; }
      }
      window.__zle.push({ text: el.textContent.trim().slice(0,20), px, w: cs.fontWeight, prechod, podklad });
    }
    return window.__zle.length;
  });
  console.log(`\n### ${meno} — drobný červený text: ${n}`);
  const zoznam = await p.evaluate(() => window.__zle);
  zoznam.forEach((z,i) => console.log(`  [${i}] ${z.px}px/${z.w}  ${z.prechod ? 'NA PRECHODE → nemerateľné z farieb' : 'na ' + z.podklad}  „${z.text}"`));

  for (let i = 0; i < Math.min(zoznam.length, 4); i++) {
    const box = await p.evaluate((idx) => {
      const zoz = [...document.querySelectorAll('*')].filter(el => el.textContent && el.textContent.trim()
        && !el.children.length && getComputedStyle(el).color === 'rgb(201, 72, 58)' && el.offsetParent
        && el.getBoundingClientRect().width > 2
        && !(parseFloat(getComputedStyle(el).fontSize) >= 24));
      const el = zoz[idx]; if (!el) return null;
      el.scrollIntoView({ block:'center' });
      return true;
    }, i);
    if (!box) continue;
    await p.waitForTimeout(900);
    const r2 = await p.evaluate((idx) => {
      const zoz = [...document.querySelectorAll('*')].filter(el => el.textContent && el.textContent.trim()
        && !el.children.length && getComputedStyle(el).color === 'rgb(201, 72, 58)' && el.offsetParent
        && el.getBoundingClientRect().width > 2
        && !(parseFloat(getComputedStyle(el).fontSize) >= 24));
      const el = zoz[idx]; if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }, i);
    if (!r2) continue;
    await p.screenshot({ path: `audit/screenshots/_nalez-${meno}-${i}.png`,
      clip: { x: Math.max(0, r2.x-70), y: Math.max(0, r2.y-24), width: 240, height: 64 } });
  }
  console.log(`  výrezy: _nalez-${meno}-*.png`);
}
await b.close();
