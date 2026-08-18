/* Kontrola kontrastu textu v labe.
 *
 * Pozadie sa skladá NAHOR cez celý reťazec rodičov s miešaním priehľadnosti.
 * Keď sa cestou narazí na obrázok alebo prechod, prvok sa hlási osobitne —
 * z farieb sa merať nedá a prvý prechod auditu si na tom vyrobil 30 falošných
 * nálezov.
 *
 *   node audit/kontrast-over.mjs [URL]
 */
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:4188';
const ZDROJ = 'https://webdesignforhradiskask.vercel.app';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 2400 } });
const p = await ctx.newPage();
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

let zleSpolu = 0;
/* Routy sa dajú zadať aj zvonku: node audit/kontrast-over.mjs <URL> <cesta…> */
const ROUTY = process.argv.length > 3
  ? process.argv.slice(3).map(c => [c.replace(/[^\w]+/g, '-').replace(/^-|-$/g, ''), c])
  : [['domovska','/design?t=pecat'], ['clanok','/design/blog/mikulcice-kopcany?t=pecat']];
for (const [n, cesta] of ROUTY) {
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

  const r = await p.evaluate(() => {
    const roz = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null;
      const q = m[1].split(',').map(parseFloat);
      return { c: [q[0], q[1], q[2]], a: q.length > 3 ? q[3] : 1 }; };
    const naHex = (c) => '#' + c.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
    const zmiesaj = (v, s) => v.c.map((x, i) => x * v.a + s[i] * (1 - v.a));
    const jas = (c) => { const s = c.map(v => { v/=255; return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4; });
      return .2126*s[0]+.7152*s[1]+.0722*s[2]; };
    const pomer = (f, g) => { const x = jas(f), y = jas(g); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
    const prekryva = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const podklad = (el) => {
      const box = el.getBoundingClientRect();
      const vrstvy = [];
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { obraz: true };
        /* Fotka nemusí byť pozadím — býva samostatným `<img>` pod textom
           (karty súvisiacich článkov). Kaskáda o nej nevie, preto sa hľadá
           obrázok, ktorý sa s textom prekrýva. Bez toho vychádzal svetlý
           text nad tmavou fotkou ako porušenie. */
        for (const o of e.children) {
          if (o.contains(el)) continue;
          const os = getComputedStyle(o);
          const tag = o.tagName;
          const jeObraz = tag === 'IMG' || tag === 'PICTURE' || tag === 'CANVAS' || tag === 'VIDEO';
          const jeVrstva = os.position === 'absolute' || os.position === 'fixed';
          if (!jeObraz && !jeVrstva) continue;
          if (!prekryva(box, o.getBoundingClientRect())) continue;
          /* Podklad nemusí byť ani pozadím, ani obrázkom v kaskáde: karty
             článkov ho majú v absolútne umiestnenom súrodencovi (fotka +
             závoj). Kaskáda ho nevidí, oko áno. */
          if (jeObraz || (os.backgroundImage && os.backgroundImage !== 'none')) return { obraz: true };
          const q = roz(os.backgroundColor);
          if (q && q.a > 0) { vrstvy.push(q); if (q.a >= 0.999) { let s2 = [255,255,255];
            for (let i = vrstvy.length - 1; i >= 0; i--) s2 = zmiesaj(vrstvy[i], s2);
            return { obraz: false, c: s2 }; } }
        }
        const q = roz(cs.backgroundColor);
        if (q && q.a > 0) vrstvy.push(q);
        if (q && q.a >= 0.999) break;
      }
      let s = [255,255,255];
      for (let i = vrstvy.length - 1; i >= 0; i--) s = zmiesaj(vrstvy[i], s);
      return { obraz: false, c: s };
    };
    const meno = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' && el.className.trim()
      ? '.' + el.className.trim().split(/\s+/)[0] : '');

    const zle = [], obraz = [];
    const videne = new Set();
    for (const el of document.querySelectorAll('*')) {
      if (!el.textContent || !el.textContent.trim()) continue;
      if ([...el.children].some(c => c.textContent && c.textContent.trim())) continue;
      const rr = el.getBoundingClientRect(); if (rr.width < 3 || rr.height < 3) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
      const f = roz(cs.color); if (!f) continue;
      const px = parseFloat(cs.fontSize);
      const velke = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700);
      const min = velke ? 3 : 4.5;
      const pk = podklad(el);
      if (pk.obraz) { obraz.push(meno(el)); continue; }
      const v = pomer(f.c, pk.c);
      if (v >= min) continue;
      const k = meno(el) + '|' + Math.round(v*10); if (videne.has(k)) continue; videne.add(k);
      zle.push({ el: meno(el), text: el.textContent.trim().slice(0,30), pomer: +v.toFixed(2), min,
                 px: Math.round(px), farba: naHex(f.c), pozadie: naHex(pk.c) });
    }
    return { zle, obrazSpolu: obraz.length };
  });

  zleSpolu += r.zle.length;
  console.log(`\n### ${n}  — porušení: ${r.zle.length}  (nad obrázkom, nemerateľné: ${r.obrazSpolu})`);
  r.zle.sort((a,b)=>a.pomer-b.pomer).forEach(x =>
    console.log(`  ${x.pomer}:1 (min ${x.min})  ${x.px}px  ${x.farba} na ${x.pozadie}  ${x.el}  „${x.text}"`));
}
await b.close();
console.log(`\nspolu: ${zleSpolu}`);
process.exit(zleSpolu ? 1 : 0);
