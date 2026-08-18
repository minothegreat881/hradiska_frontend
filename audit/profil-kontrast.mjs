/**
 * Kontrast v profile člena.
 *
 * Profil vidí len prihlásený člen, takže sa naň bežné meranie nedostane.
 * Skript preto podstrčí token a odpovede Strapi (tie isté ako
 * `profil-nahlad.mjs`) a premeria všetkých päť častí registra.
 *
 *   node audit/profil-kontrast.mjs [URL]
 */
import { chromium } from 'playwright';
import { ODPOVEDE } from './profil-udaje.mjs';

const URL = process.argv[2] || 'http://localhost:3000';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 2000 } });
for (const [vzor, telo] of ODPOVEDE) {
  await ctx.route(vzor, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(telo) }));
}
/* Súbory z uploadov servisuje logo — ide o to, či sa adresa poskladá
   správne, nie o to, čo je na snímke. */
await ctx.route('**/uploads/**', (r) => r.fulfill({ path: 'public/logo_hradiska_small.png' }));
await ctx.addInitScript(() => localStorage.setItem('hradiska.member.jwt', 'test'));
const p = await ctx.newPage();
await p.goto(`${URL}/profil`, { waitUntil: 'domcontentloaded' });
for (let i = 0; i < 12; i++) {
  const x = p.locator('.ck-btn-primary').first();
  if (await x.count() && await x.isVisible()) { await x.click({ force: true }); await p.waitForTimeout(350); }
  if (!(await p.locator('.ck-root').count())) break;
  await p.waitForTimeout(400);
}
await p.waitForSelector('.lprof-hlava');

let zleSpolu = 0;
const CASTI = ['ozvy', 'prispevky', 'ulozene', 'fotky', 'nastavenia'];
for (const [i, n] of CASTI.entries()) {
  await p.locator('.lprof-register button').nth(i).click();
  await p.waitForTimeout(800);
  /* Rozbalené polia sa merajú tiež — inak by úprava príspevku ostala
     nepremeraná a práve tam je najviac textu na netypickom podklade. */
  if (n === 'prispevky') {
    const u = p.locator('.lprof-akcie button').first();
    if (await u.count()) { await u.click(); await p.waitForTimeout(400); }
  }
  if (n === 'nastavenia') {
    const z = p.locator('.lprof-zrusit').first();
    if (await z.count()) { await z.click(); await p.waitForTimeout(400); }
  }

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
  console.log(`
### ${n}  — porušení: ${r.zle.length}  (nad obrázkom, nemerateľné: ${r.obrazSpolu})`);
  r.zle.sort((a, b) => a.pomer - b.pomer).forEach(x =>
    console.log(`  ${x.pomer}:1 (min ${x.min})  ${x.px}px  ${x.farba} na ${x.pozadie}  ${x.el}  „${x.text}"`));
}
await b.close();
console.log(`
spolu: ${zleSpolu}`);
process.exit(zleSpolu ? 1 : 0);
