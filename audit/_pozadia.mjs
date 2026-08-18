/* Na akých podkladoch tie dva tokeny reálne sedia.
 *
 * Pozadie sa skladá NAHOR cez celý reťazec rodičov s miešaním priehľadnosti,
 * nie odčítaním prvého nepriehľadného predka — to bola chyba prvého prechodu.
 * Keď sa cestou narazí na obrázok alebo prechod, prvok sa hlási osobitne, lebo
 * z farieb sa merať nedá.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const BASE = process.argv[2] || 'https://webdesignforhradiskask.vercel.app';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';
const CIELE = { '#6d6f74': '--l-muted', '#96938c': '--l-muted-2' };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 2400 } });
const p = await ctx.newPage();
/* Lokálny build nemá pri sebe Strapi — volania na API preto vybavíme
   z nasadenej stránky, aby mal lab reálny obsah a meranie zmysel. */
if (BASE.includes('localhost')) {
  await p.route('**/strapi/**', async (r) => {
    const u = new URL(r.request().url());
    try {
      const res = await fetch(ZDROJ + u.pathname + u.search, { headers: { accept: 'application/json' } });
      r.fulfill({ status: res.status, body: Buffer.from(await res.arrayBuffer()),
                  headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
    } catch { r.abort(); }
  });
}
const vsetko = {};
for (const [n, cesta] of [['domovska','/design?t=pecat'], ['clanok','/design/blog/mikulcice-kopcany?t=pecat']]) {
  await p.goto(BASE + cesta, { waitUntil: 'domcontentloaded' });
  /* Cookie lišta sa objavuje s oneskorením a prekrýva spodok stránky —
     bez trpezlivého odkliknutia hlásia merania falošné chyby (kurzor
     skončí na lište, nie na mape). */
  for (let i = 0; i < 12; i++) {
    const x = p.locator('.ck-btn-primary').first();
    if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(400); }
    if (!(await p.locator('.ck-root').count())) break;
    await p.waitForTimeout(500);
  }
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(4000);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(3000);

  vsetko[n] = await p.evaluate((CIELE) => {
    const hex = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null;
      const q = m[1].split(',').map(parseFloat);
      return { c: [q[0], q[1], q[2]], a: q.length > 3 ? q[3] : 1 }; };
    const naHex = (c) => '#' + c.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
    const zmiesaj = (vrch, spod) => vrch.c.map((v, i) => v * vrch.a + spod[i] * (1 - vrch.a));

    /* Zloží podklad zdola nahor: začne priehľadné, postupne pridáva farby
       predkov, kým nie je nepriehľadné. */
    const podklad = (el) => {
      const vrstvy = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { obraz: true, kde: e.tagName.toLowerCase() + '.' + [...e.classList].slice(0,2).join('.') };
        const q = hex(cs.backgroundColor);
        if (q && q.a > 0) vrstvy.push(q);
        if (q && q.a >= 0.999) break;
      }
      let spod = [255,255,255];
      for (let i = vrstvy.length - 1; i >= 0; i--) spod = zmiesaj(vrstvy[i], spod);
      return { obraz: false, farba: naHex(spod) };
    };

    const out = {};
    for (const el of document.querySelectorAll('*')) {
      if (!el.textContent || !el.textContent.trim()) continue;
      if ([...el.children].some(c => c.textContent && c.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      const f = hex(cs.color); if (!f) continue;
      const fh = '#' + f.c.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
      if (!CIELE[fh]) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) continue;
      const pk = podklad(el);
      const kluc = fh + ' na ' + (pk.obraz ? 'OBRÁZOK/PRECHOD (' + pk.kde + ')' : pk.farba);
      (out[kluc] ||= { pocet: 0, px: new Set(), ukazky: [] });
      out[kluc].pocet++;
      out[kluc].px.add(Math.round(parseFloat(cs.fontSize)));
      if (out[kluc].ukazky.length < 3) out[kluc].ukazky.push(
        (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : el.tagName.toLowerCase())
        + ' „' + el.textContent.trim().slice(0,22) + '"');
    }
    return Object.fromEntries(Object.entries(out).map(([k,v]) => [k, { pocet: v.pocet, px: [...v.px].sort((a,b)=>a-b), ukazky: v.ukazky }]));
  }, CIELE);
}
await b.close();
writeFileSync('audit/pozadia.json', JSON.stringify(vsetko, null, 1), 'utf8');

const L = (h) => { const n = parseInt(h.slice(1),16);
  const c = [(n>>16)&255,(n>>8)&255,n&255].map(v => { v/=255; return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4; });
  return .2126*c[0]+.7152*c[1]+.0722*c[2]; };
const R = (a,b) => { const x=L(a), y=L(b); return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)); };

for (const [route, v] of Object.entries(vsetko)) {
  console.log(`\n### ${route}`);
  for (const [k, d] of Object.entries(v).sort((a,b)=>b[1].pocet-a[1].pocet)) {
    const [fh, , bh] = k.split(' ');
    const pom = bh.startsWith('#') ? R(fh, bh).toFixed(2) + ':1' : '—';
    console.log(`  ${d.pocet}×  ${k}  → ${pom}   ${d.px.join('/')}px`);
    d.ukazky.forEach(u => console.log(`        ${u}`));
  }
}
