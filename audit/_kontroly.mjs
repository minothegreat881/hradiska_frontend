/* Merateľné kontroly nad laboratóriom. Výstup na disk (audit/nalezy.json).
 *
 * POZOR: číslo „kontrast pod normou" z tohto skriptu NEPLATÍ — skladá pozadie
 * naivne (prvý nepriehľadný predok) a hlási text nad fotografiou aj podklad
 * v absolútne umiestnenom súrodencovi ako porušenie. V audite si na tom
 * vyrobil 30 falošných nálezov. Na kontrast používaj `audit/kontrast-over.mjs`.
 * Ostatné čísla (skip-link, mená, menovky, zameranie, nadpisy) sú v poriadku. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.argv[2] || 'https://webdesignforhradiskask.vercel.app';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';

const vPage = () => {
  const lum = (c) => { const s = c.map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4; }); return 0.2126*s[0]+0.7152*s[1]+0.0722*s[2]; };
  const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { c:[p[0],p[1],p[2]], a: p.length>3?p[3]:1 }; };
  const pozadie = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const b = rgb(getComputedStyle(e).backgroundColor);
      if (b && b.a > 0.85) return b.c;
    }
    return [255,255,255];
  };
  const pomer = (f, b) => { const L1 = lum(f), L2 = lum(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05); };
  const cesta = (el) => { const c = [...el.classList].slice(0,2).join('.'); return el.tagName.toLowerCase() + (c?'.'+c:''); };

  const out = { lang: document.documentElement.lang || null, kontrast: [], ciele: [], obrazky: [], mena: [], vstupy: [], nadpisy: [], skip: null };

  // preskočiť na obsah
  const prvy = document.querySelector('a[href^="#"]');
  out.skip = prvy ? prvy.textContent.trim().slice(0,40) : null;

  // kontrast textu
  const videne = new Set();
  for (const el of document.querySelectorAll('p,span,a,h1,h2,h3,h4,li,button,label,small,strong,em,b,div')) {
    if (!el.textContent || !el.textContent.trim()) continue;
    if ([...el.children].some(c => c.textContent && c.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'none') continue;
    const f = rgb(cs.color); if (!f) continue;
    const velke = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    const p = pomer(f.c, pozadie(el));
    const min = velke ? 3 : 4.5;
    if (p < min) {
      const k = cesta(el) + '|' + Math.round(p*10);
      if (videne.has(k)) continue; videne.add(k);
      out.kontrast.push({ el: cesta(el), text: el.textContent.trim().slice(0,32), pomer: +p.toFixed(2), min, px: Math.round(parseFloat(cs.fontSize)) });
    }
  }
  // dotykové ciele
  for (const el of document.querySelectorAll('a,button,input,select,[role="button"]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.width < 44 || r.height < 44) out.ciele.push({ el: cesta(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent||el.ariaLabel||'').trim().slice(0,26) });
  }
  // obrázky
  for (const el of document.querySelectorAll('img')) {
    const chyba = [];
    if (el.alt === null || el.getAttribute('alt') === null) chyba.push('bez alt');
    if (!el.getAttribute('width') || !el.getAttribute('height')) chyba.push('bez rozmerov');
    if (chyba.length) out.obrazky.push({ src: (el.currentSrc||el.src||'').split('/').pop().slice(0,40), chyba });
  }
  // prístupné mená
  for (const el of document.querySelectorAll('button,a,[role="button"]')) {
    const t = (el.innerText || '').trim();
    if (!t && !el.getAttribute('aria-label') && !el.getAttribute('title')) {
      const r = el.getBoundingClientRect(); if (r.width < 2) continue;
      out.mena.push({ el: cesta(el), html: el.outerHTML.slice(0,70) });
    }
  }
  // vstupy
  for (const el of document.querySelectorAll('input,select,textarea')) {
    if (el.type === 'hidden') continue;
    const ma = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest('label');
    if (!ma) out.vstupy.push({ el: cesta(el), type: el.type, name: el.name || null });
  }
  // nadpisy
  out.nadpisy = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  return out;
};

const b = await chromium.launch();
const vysledok = {};
for (const [meno, w, h, mob] of [['desktop',1440,900,false], ['mobil',390,844,true]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:mob, hasTouch:mob });
  const p = await ctx.newPage();
  /* Lokálny build nemá pri sebe Strapi — volania na API vybavíme z nasadenej
     stránky, inak je článok prázdny a merania z neho neplatia. */
  if (BASE.includes('localhost')) await p.route('**/strapi/**', async (r) => {
    const u = new URL(r.request().url());
    try { const res = await fetch(ZDROJ + u.pathname + u.search, { headers: { accept: 'application/json' } });
      r.fulfill({ status: res.status, body: Buffer.from(await res.arrayBuffer()),
                  headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
    } catch { r.abort(); }
  });
  for (const [n, cesta] of [['domovska','/design?t=pecat'], ['clanok','/design/blog/mikulcice-kopcany?t=pecat']]) {
    await p.goto(BASE+cesta, { waitUntil:'domcontentloaded' });
    for (let i=0;i<3;i++){const x=p.locator('.ck-btn-primary').first();
      if(await x.count()&&await x.isVisible()){await x.click({force:true});await p.waitForTimeout(300);}else break;}
    await p.waitForTimeout(6500);
    const r = await p.evaluate(vPage);

    // tabulátor: viditeľné zameranie
    const zaostrenie = [];
    for (let i = 0; i < 26; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const cs = getComputedStyle(e);
        const vidno = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0)
          || cs.boxShadow !== 'none' || cs.borderColor !== getComputedStyle(document.body).borderColor;
        const rr = e.getBoundingClientRect();
        return { el: e.tagName.toLowerCase()+'.'+[...e.classList].slice(0,2).join('.'), vidno,
                 vHladisku: rr.top >= -2 && rr.bottom <= innerHeight + 2, text: (e.innerText||e.ariaLabel||'').trim().slice(0,24) };
      });
      if (s) zaostrenie.push(s);
    }
    r.zaostrenie = { spolu: zaostrenie.length, bezRamu: zaostrenie.filter(z=>!z.vidno).map(z=>z.el+' · '+z.text) };
    vysledok[`${n}-${meno}`] = r;
  }
  await ctx.close();
}
await b.close();
writeFileSync('audit/nalezy.json', JSON.stringify(vysledok, null, 1), 'utf8');
for (const [k, v] of Object.entries(vysledok)) {
  console.log(`\n== ${k} ==`);
  console.log(` lang=${v.lang} · skip-link=${v.skip ?? 'CHÝBA'}`);
  console.log(` kontrast pod normou: ${v.kontrast.length}`);
  console.log(` dotykové ciele pod 44px: ${v.ciele.length}`);
  console.log(` obrázky s chybou: ${v.obrazky.length} · bez prístupného mena: ${v.mena.length} · vstupy bez menovky: ${v.vstupy.length}`);
  console.log(` tabulátor: ${v.zaostrenie.spolu} prvkov, bez viditeľného zamerania: ${v.zaostrenie.bezRamu.length}`);
  console.log(` nadpisy: ${v.nadpisy.join(',')}`);
}
