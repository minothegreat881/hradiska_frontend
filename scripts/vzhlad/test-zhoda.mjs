/**
 * TEST ZHODY (plán, časť 10.2) — nový web musí nakresliť to isté, čo dnešný.
 *
 *   dnešný web = build z `main` vo worktree ../hradiska-web-zaklad (port 4301)
 *   nový web   = build z vetvy (port 4302)
 * Oba proti tomu istému referenčnému Strapi (http://localhost:1338), oba
 * servírované ako na Verceli (`server.mjs`).
 *
 * Stránky: domovská, všetky kategórie z databázy, jeden článok, /aktuality —
 * v sk, en (/en/…) a de (/de/…), na šírke 1440 aj 390. Porovnáva sa DOM tela
 * po ustálení a pixely snímky celej stránky (mapa skrytá, animácie vypnuté).
 *
 * Režimy:
 *   1  — nový web bez vzhľadu z API (endpoint chýba → základný vzhľad); tolerancia nula
 *   2  — vzhľad v1 z prevodu (`vystup/vzhlad-v1-odpoved.json`) podstrčený na
 *        /strapi/api/vzhlad-webu (web ho stiahne po prvom kreslení a prekreslí sa)
 *   2v — ten istý vzhľad VLOŽENÝ do HTML (ako to robí prerender) a API vracia
 *        tú istú verziu — skúška prvého kreslenia z vloženého vzhľadu
 * Akceptované rozdiely v režimoch 2/2v (nič iné):
 *   • EN a DE domovská, kronika: úvodný článok a pripnuté zápisy sa začnú
 *     zobrazovať správne (dnes sa hľadajú podľa slovenského slugu a v cudzom
 *     jazyku sa nenájdu) — porovnanie DOM aj pixelov vynechá úvodnú dlaždicu,
 *     pás zápisov a časovú os a test zvlášť overí, že nový stav je správny,
 *   • adresa obrázka z `formats` namiesto skladanej cesty (ten istý súbor) —
 *     pri dnešných súboroch sú obe adresy zhodné, pravidlo sa neuplatní.
 *
 *   node scripts/vzhlad/test-zhoda.mjs [--rezim 1,2,2v] [--len <regex>] [--sucasne 3]
 */
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spustiServer } from './server.mjs';
import {
  KOREN, VYSTUP, SIRKY, nacitajZoznamy, stranky, spustiPrehliadac, novyKontext, ustal, nacitajObrazky, dom, snimka,
  porovnajPng, prvyRozdiel, zapis, poJednom,
} from './spolocne.mjs';

const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const REZIMY = arg('--rezim', '1,2,2v').split(',');
const LEN = arg('--len', null);
const SUCASNE = Number(arg('--sucasne', '3'));
const DIST_DNES = resolve(KOREN, '..', 'hradiska-web-zaklad', 'dist');
const DIST_NOVY = resolve(KOREN, 'dist');
const ODPOVED_SUBOR = join(VYSTUP, 'vzhlad-v1-odpoved.json');

if (!existsSync(join(DIST_DNES, 'index.html'))) throw new Error(`Chýba build dnešného webu: ${DIST_DNES}`);
if ((REZIMY.includes('2') || REZIMY.includes('2v')) && !existsSync(ODPOVED_SUBOR)) throw new Error('Chýba vystup/vzhlad-v1-odpoved.json — najprv `node scripts/vzhlad/prevod.mjs --odpoved`.');
const ODPOVED = existsSync(ODPOVED_SUBOR) ? readFileSync(ODPOVED_SUBOR, 'utf8') : null;
const odp = ODPOVED ? JSON.parse(ODPOVED) : null;

const PORT_DNES = 4301;
/* `--samo`: nový web nahradí dnešný — skúška, či je samotné meranie stále. */
const PORT_NOVY = a.includes('--samo') ? 4301 : 4302;
const servery = [
  await spustiServer({ dist: DIST_DNES, port: PORT_DNES }),
  await spustiServer({ dist: DIST_NOVY, port: 4302 }),
];

const zoznamy = await nacitajZoznamy();
let vsetky = stranky(zoznamy);
if (LEN) vsetky = vsetky.filter((s) => new RegExp(LEN).test(s.id));
const pohlady = vsetky.flatMap((s) => SIRKY.map((sirka) => ({ s, sirka, kluc: `${s.id}-${sirka.meno}` })));

const AKCEPTOVANE_KRONIKA = ['.lakv-pinned', '.lakv-strip', '.lakv-os'];
/* Úvodná dlaždica má s nájdeným článkom iný obsah (perex, autor) a tým aj
   výšku — bez pevnej výšky by sa celý zvyšok stránky posunul o zlomok pixela
   a líšil by sa celý. Pevná výška len na snímke, v oboch weboch rovnako. */
const CSS_KRONIKA = '.lakv-pinned { height: 460px !important; min-height: 460px !important; max-height: 460px !important; overflow: hidden !important; box-sizing: border-box !important; }';
const jeKronikaVCudzomJazyku = (s, rezim) => rezim !== '1' && s.druh === 'domov' && s.jazyk !== 'sk';

/** Konzola bez sieťových hlásení prehliadača (tie sú zvlášť a rovnaké pre oba weby). */
const sledujKonzolu = (page) => {
  const z = { konzola: [], siet: [] };
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    if (/^Failed to load resource/.test(m.text())) return;
    z.konzola.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => z.konzola.push(`pageerror: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) z.siet.push(`${r.status()} ${new URL(r.url()).pathname}`); });
  return z;
};

/** Načíta a zachytí jeden pohľad. */
async function zachyt(prehliadac, port, p, rezim) {
  const ctx = await novyKontext(prehliadac, p.sirka, {
    route: async (c) => {
      if (rezim === '2' || rezim === '2v') {
        await c.route('**/strapi/api/vzhlad-webu', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: ODPOVED }));
      }
      if (rezim === '2v') {
        /* Ako prerender: vzhľad v hlavičke HTML, `<` ako \u003c. */
        const znacka = `<script type="application/json" id="vzhlad-webu">${ODPOVED.trim().replace(/</g, '\\u003c')}</script>`;
        await c.route((u) => u.port === String(PORT_NOVY), async (r) => {
          if (r.request().resourceType() !== 'document') return r.fallback();
          const o = await r.fetch();
          const html = (await o.text()).replace('</head>', `${znacka}\n  </head>`);
          return r.fulfill({ response: o, body: html, headers: { ...o.headers(), 'content-type': 'text/html; charset=utf-8' } });
        });
      }
    },
  });
  const page = await ctx.newPage();
  const z = sledujKonzolu(page);
  await page.goto(`http://127.0.0.1:${port}${p.s.cesta}`, { waitUntil: 'load', timeout: 60000 });
  await ustal(page);
  /* Odložené obrázky načítať pred zachytením DOM (mŕtva fotka → kresba). */
  await nacitajObrazky(page);
  await ustal(page, { pokoj: 3 });
  const celyDom = await dom(page);
  const domAkcept = jeKronikaVCudzomJazyku(p.s, rezim) || (rezim === 'dnes' && p.s.druh === 'domov' && p.s.jazyk !== 'sk')
    ? await dom(page, { nahradit: AKCEPTOVANE_KRONIKA }) : null;
  /* Pás kroniky (dokumentové súradnice) — pre porovnanie pixelov mimo neho. */
  const kronika = await page.evaluate(() => {
    const el = document.querySelector('section.lakv');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { hore: Math.round(r.top + scrollY), dole: Math.round(r.bottom + scrollY) };
  });
  /* Overenie akceptovaného rozdielu: úvodný článok a pripnuté v jazyku stránky. */
  const kronikaStav = p.s.druh === 'domov' ? await page.evaluate(() => ({
    uvod: document.querySelector('.lakv-pinned')?.getAttribute('href') ?? null,
    pas: [...document.querySelectorAll('.lakv-strip a')].slice(0, 6).map((x) => x.getAttribute('href')),
    vPase: [...document.querySelectorAll('.lakv-strip a')].map((x) => x.getAttribute('href')),
  })) : null;
  /* Dnešný web potrebuje obe snímky (režim 1 celú, režimy 2/2v so zakrytou
     kronikou v cudzom jazyku); nový len tú, ktorú porovnáva. */
  const cudziDomov = p.s.druh === 'domov' && p.s.jazyk !== 'sk';
  const png = rezim === 'dnes' || !jeKronikaVCudzomJazyku(p.s, rezim) ? await snimka(page) : null;
  const pngAkcept = (rezim === 'dnes' && cudziDomov) || jeKronikaVCudzomJazyku(p.s, rezim)
    ? await snimka(page, { css: CSS_KRONIKA, maska: AKCEPTOVANE_KRONIKA }) : null;
  await ctx.close();
  return { dom: celyDom.html, vw: celyDom.vw, domAkcept: domAkcept?.html ?? null, png, pngAkcept, kronika, kronikaStav, ...z };
}

/** Očakávaný stav kroniky s vzhľadom v1 v jazyku stránky. */
function overKroniku(s, stav) {
  if (!odp || !stav) return null;
  const kr = odp.data.domov.sekcie.find((x) => x.typ === 'kronika');
  const predpona = s.jazyk === 'sk' ? '' : `/${s.jazyk}`;
  const uvod = odp.clanky[kr.uvodnyClanok.dokument]?.[s.jazyk];
  const pripnute = kr.pripnute.map((c) => odp.clanky[c.dokument]?.[s.jazyk]).filter(Boolean).map((c) => `${predpona}/blog/${c.slug}`);
  const chyby = [];
  if (uvod && stav.uvod !== `${predpona}/blog/${uvod.slug}`) chyby.push(`úvodný článok vedie na ${stav.uvod}, čakal som ${predpona}/blog/${uvod.slug}`);
  pripnute.forEach((h, i) => { if (stav.pas[i] !== h) chyby.push(`pripnutý ${i + 1}: ${stav.pas[i]} ≠ ${h}`); });
  if (uvod && stav.vPase.includes(`${predpona}/blog/${uvod.slug}`)) chyby.push('úvodný článok je aj v páse zápisov');
  return chyby;
}

rmSync(join(VYSTUP, 'zhoda'), { recursive: true, force: true });
const prehliadac = await spustiPrehliadac();
const vysledky = {};
const zaciatok = Date.now();

try {
  /* Dnešný web sa zachytí raz a porovná so všetkými režimami. */
  const dnes = new Map();
  console.log(`[zhoda] ${pohlady.length} pohľadov (${vsetky.length} stránok × ${SIRKY.length} šírky), režimy ${REZIMY.join(', ')}`);
  for (const rezim of REZIMY) {
    const zaznam = [];
    await poJednom(pohlady, SUCASNE, async (p, k) => {
      let d = dnes.get(p.kluc);
      let n;
      for (let pokus = 1; pokus <= 2; pokus++) {
        try {
          [d, n] = await Promise.all([d ? Promise.resolve(d) : zachyt(prehliadac, PORT_DNES, p, 'dnes'), zachyt(prehliadac, PORT_NOVY, p, rezim)]);
          break;
        } catch (e) {
          if (pokus === 2) throw e;
          console.warn(`  ${p.kluc}: ${e.message.split('\n')[0]} — skúšam znova`);
        }
      }
      dnes.set(p.kluc, d);

      const akcept = jeKronikaVCudzomJazyku(p.s, rezim);
      const domA = akcept ? d.domAkcept : d.dom;
      const domB = akcept ? n.domAkcept : n.dom;
      const rozdielDom = prvyRozdiel(domA, domB);

      /* Pri akceptovanom rozdiele kroniky sa porovnáva celá stránka so
         zakrytou úvodnou dlaždicou, pásom zápisov a časovou osou. */
      const pix = akcept ? await porovnajPng(d.pngAkcept, n.pngAkcept) : await porovnajPng(d.png, n.png);

      const novaKonzola = n.konzola.filter((x) => !d.konzola.includes(x));
      const overenie = rezim !== '1' && p.s.druh === 'domov' ? overKroniku(p.s, n.kronikaStav) : null;
      const vysl = {
        kluc: p.kluc, cesta: p.s.cesta, sirka: p.sirka.meno,
        domRovnaky: !rozdielDom, pixelyRovnake: pix.rozdiel === 0, pixelov: pix.rozdiel, dovod: pix.dovod,
        dataVw: n.vw.length, akceptovany: akcept ? 'kronika EN/DE' : null,
        kronikaChyby: overenie && overenie.length ? overenie : undefined,
        konzolaNovy: novaKonzola.length ? novaKonzola : undefined,
        sietNovy: n.siet.filter((x) => !d.siet.includes(x)),
      };
      zaznam.push(vysl);
      const ok = vysl.domRovnaky && vysl.pixelyRovnake && !vysl.dataVw && !vysl.kronikaChyby && !vysl.konzolaNovy;
      if (!ok) {
        const zl = `zhoda/rezim-${rezim}/${p.kluc}`;
        zapis(`${zl}-dnes.html`, domA);
        zapis(`${zl}-novy.html`, domB);
        zapis(`${zl}-dnes.png`, akcept ? d.pngAkcept : d.png);
        zapis(`${zl}-novy.png`, akcept ? n.pngAkcept : n.png);
        if (rozdielDom) zapis(`${zl}-rozdiel.json`, rozdielDom);
      }
      console.log(`  [${rezim}] ${String(k + 1).padStart(3)}/${pohlady.length} ${ok ? 'OK ' : 'ROZDIEL'} ${p.kluc}${vysl.domRovnaky ? '' : ' DOM'}${vysl.pixelyRovnake ? '' : ` pixely=${pix.rozdiel}${pix.dovod ? ` (${pix.dovod})` : ''}`}${vysl.dataVw ? ` data-vw=${vysl.dataVw}` : ''}${vysl.kronikaChyby ? ` kronika: ${vysl.kronikaChyby.join('; ')}` : ''}${vysl.konzolaNovy ? ` konzola: ${vysl.konzolaNovy[0]}` : ''}${akcept ? ' [akceptovaný rozdiel: kronika]' : ''}`);
    });
    zaznam.sort((x, y) => x.kluc.localeCompare(y.kluc));
    const rovnake = zaznam.filter((v) => v.domRovnaky && v.pixelyRovnake && !v.dataVw && !v.kronikaChyby && !v.konzolaNovy).length;
    vysledky[rezim] = { rovnake, celkom: zaznam.length, akceptovane: zaznam.filter((v) => v.akceptovany).map((v) => v.kluc), pohlady: zaznam };
  }
} finally {
  await prehliadac.close();
  servery.forEach((s) => s.close());
}

const suhrn = Object.fromEntries(Object.entries(vysledky).map(([r, v]) => [r, `rovnaké ${v.rovnake} z ${v.celkom}`]));
zapis('zhoda-vysledok.json', { kedy: new Date().toISOString(), trvanie_s: Math.round((Date.now() - zaciatok) / 1000), suhrn, vysledky });
console.log('\n[zhoda] výsledok:');
for (const [r, v] of Object.entries(vysledky)) {
  console.log(`  režim ${r}: rovnaké ${v.rovnake} z ${v.celkom}${v.akceptovane.length ? ` (z toho ${v.akceptovane.length} s akceptovaným rozdielom kroniky EN/DE: ${v.akceptovane.join(', ')})` : ''}`);
}
console.log(`  podrobnosti: ${join(VYSTUP, 'zhoda-vysledok.json')}`);
const zle = Object.values(vysledky).some((v) => v.rovnake !== v.celkom);
process.exit(zle ? 1 : 0);
