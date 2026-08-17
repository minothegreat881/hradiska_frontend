/* Rozpis dotykových cieľov pod 44 px — pomenované, nie spočítané.
 *   node audit/ciele-rozpis.mjs [URL]
 */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';

const zmeraj = async (b, meno, w, h, dotyk, cesta) => {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile: dotyk && w < 700, hasTouch: dotyk });
  const p = await ctx.newPage();
  if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => { const u=new URL(r.request().url());
    try { const res=await fetch(ZDROJ+u.pathname+u.search,{headers:{accept:'application/json'}});
      r.fulfill({status:res.status, body:Buffer.from(await res.arrayBuffer()), headers:{'content-type':res.headers.get('content-type')||'application/json'}}); } catch { r.abort(); } });
  await p.goto(BASE+cesta, { waitUntil:'domcontentloaded' });
  for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
    if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
  await p.evaluate(()=>window.scrollTo(0,document.body.scrollHeight)); await p.waitForTimeout(4500);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const kam = (el) => {
      if (el.closest('.lmap')) return 'mapa (produkčný komponent)';
      if (el.closest('[data-lab-toolbar]') || (!el.closest('.lab') && el.closest('body > div > div'))) return null;
      if (el.closest('.lart-share, .share')) return 'zdieľanie článku';
      if (el.closest('.pl-, [class*="lightbox"], [class*="gallery"], .lart-gal')) return 'galéria článku';
      if (el.closest('.comment, [class*="comment"], .pl-thread')) return 'komentáre (produkčný komponent)';
      if (el.closest('.lfoot')) return 'pätička';
      if (el.closest('.lnav')) return 'navigácia';
      if (el.closest('.lart-side')) return 'bočný stĺpec článku';
      if (el.closest('.lart-more')) return 'súvisiace články';
      if (el.closest('.article-body-wrapper, .lart-body')) return 'telo článku';
      return 'inde';
    };
    const out = {};
    for (const el of document.querySelectorAll('a,button,input,select,[role="button"]')) {
      const q = el.getBoundingClientRect();
      if (q.width < 2 || q.height < 2) continue;
      if (q.width >= 44 && q.height >= 44) continue;
      const k = kam(el);
      if (!k) continue;
      const kluc = k + ' · ' + (el.tagName.toLowerCase() + ((el.className+'').split(' ').filter(Boolean)[0] ? '.'+(el.className+'').split(' ').filter(Boolean)[0] : ''));
      (out[kluc] ??= { n:0, rozmery:new Set(), ukazky:[] });
      out[kluc].n++;
      out[kluc].rozmery.add(Math.round(q.width)+'×'+Math.round(q.height));
      if (out[kluc].ukazky.length < 2) out[kluc].ukazky.push((el.innerText||el.getAttribute('aria-label')||el.getAttribute('title')||'').trim().slice(0,24));
    }
    return Object.fromEntries(Object.entries(out).map(([k,v]) => [k, { n:v.n, rozmery:[...v.rozmery].slice(0,3), ukazky:v.ukazky }]));
  });
  console.log(`\n### ${meno} — ${cesta}`);
  let spolu = 0;
  for (const [k, v] of Object.entries(r).sort((a,b)=>b[1].n-a[1].n)) {
    spolu += v.n;
    console.log(`  ${String(v.n).padStart(3)}×  ${k}   ${v.rozmery.join(', ')}   „${v.ukazky.filter(Boolean).join('", „')}"`);
  }
  console.log(`  spolu (bez labovej lišty): ${spolu}`);
  await ctx.close();
};

const b = await chromium.launch();
await zmeraj(b, 'mobil 390 (dotyk)', 390, 844, true, '/design/blog/mikulcice-kopcany?t=pecat');
await zmeraj(b, 'dotykový notebook 1440 (dotyk, šírka desktopu)', 1440, 900, true, '/design/blog/mikulcice-kopcany?t=pecat');
await zmeraj(b, 'myš 1440 (bez dotyku)', 1440, 900, false, '/design/blog/mikulcice-kopcany?t=pecat');
await b.close();
