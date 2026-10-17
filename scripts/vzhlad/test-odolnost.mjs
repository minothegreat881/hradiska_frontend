/**
 * TEST ODOLNOSTI (plán, časť 10.5 a tabuľka 6.4) — čo urobí nový web, keď
 * vzhľad z API chýba, je pokazený alebo sa odkazuje na niečo, čo už nie je.
 *
 * Každý prípad: stránka sa nakreslí, v konzole nie je chyba (sieťové hlásenia
 * prehliadača o zámerne pokazených adresách sa nerátajú — nie sú to chyby
 * stránky) a zodpovedajúci prvok je vynechaný alebo nahradený zo základného
 * vzhľadu. Vzhľad sa podstrkuje cez Playwright na /strapi/api/vzhlad-webu.
 *
 *   node scripts/vzhlad/test-odolnost.mjs
 * (potrebuje build vetvy v dist/ a vystup/vzhlad-v1-odpoved.json z prevodu)
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spustiServer } from './server.mjs';
import { KOREN, VYSTUP, SIRKY, spustiPrehliadac, novyKontext, ustal, nacitajObrazky, dom, prvyRozdiel, zapis } from './spolocne.mjs';

const PORT = 4302;
const V1 = JSON.parse(readFileSync(join(VYSTUP, 'vzhlad-v1-odpoved.json'), 'utf8'));
const kopia = () => structuredClone(V1);
const server = await spustiServer({ dist: resolve(KOREN, 'dist'), port: PORT });
const prehliadac = await spustiPrehliadac();

const kronika = (o) => o.data.domov.sekcie.find((s) => s.typ === 'kronika');
const dlazdica = (o, slug) => o.data.domov.dlazdice.skupiny.flatMap((s) => s.polozky).find((p) => p.kategoria.slug === slug);
const zaznam = (o, slug) => o.data.kategorie.find((k) => k.kategoria.slug === slug);

/** Otvorí stránku s podstrčenou odpoveďou API. `odpoved` = funkcia (route) alebo objekt. */
async function otvor(cesta, odpoved, sirka = SIRKY[0]) {
  const ctx = await novyKontext(prehliadac, sirka, {
    route: async (c) => {
      if (odpoved === undefined) return;
      await c.route('**/strapi/api/vzhlad-webu', typeof odpoved === 'function' ? odpoved
        : (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(odpoved) }));
    },
  });
  const page = await ctx.newPage();
  const konzola = [];
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/^Failed to load resource/.test(m.text())) konzola.push(m.text()); });
  page.on('pageerror', (e) => konzola.push(`pageerror: ${e.message}`));
  await page.goto(`http://127.0.0.1:${PORT}${cesta}`, { waitUntil: 'load', timeout: 60000 });
  await ustal(page);
  await nacitajObrazky(page);
  await ustal(page, { pokoj: 3 });
  return { page, ctx, konzola };
}

const vysledky = [];
async function pripad(meno, cesta, odpoved, over) {
  let ok = false; let detail = '';
  try {
    const { page, ctx, konzola } = await otvor(cesta, odpoved);
    const nakreslena = await page.evaluate(() => !!document.querySelector('.lnav') && !!document.querySelector('.lfoot') && document.body.innerText.length > 500);
    const chyby = await over(page);
    await ctx.close();
    ok = nakreslena && !konzola.length && !chyby.length;
    detail = [!nakreslena && 'stránka sa nenakreslila', ...konzola.map((k) => `konzola: ${k}`), ...chyby].filter(Boolean).join('; ');
  } catch (e) {
    detail = `výnimka: ${e.message.split('\n')[0]}`;
  }
  vysledky.push({ meno, ok, detail });
  console.log(`  ${ok ? 'OK     ' : 'ZLYHAL '} ${meno}${detail ? ` — ${detail}` : ''}`);
}

try {
  /* Referencia: nový web, keď endpoint vzhľadu neexistuje (základný vzhľad). */
  const ref = {};
  for (const cesta of ['/', '/category/refugia']) {
    const { page, ctx } = await otvor(cesta, (r) => r.fulfill({ status: 404, body: 'Not Found' }));
    ref[cesta] = (await dom(page)).html;
    await ctx.close();
  }
  const akoZakladny = (cesta) => async (page) => {
    const d = (await dom(page)).html;
    const r = prvyRozdiel(ref[cesta], d);
    if (r) { zapis(`odolnost/${cesta.replace(/\W+/g, '_')}-rozdiel.json`, r); return [`DOM sa líši od základného vzhľadu na pozícii ${r.pozicia}`]; }
    return [];
  };

  console.log('[odolnosť] celý vzhľad nepoužiteľný → základný vzhľad (DOM = web bez vzhľadu)');
  await pripad('API vypnuté (spojenie odmietnuté)', '/', (r) => r.abort('connectionrefused'), akoZakladny('/'));
  await pripad('API vráti 500', '/', (r) => r.fulfill({ status: 500, body: 'Internal Server Error' }), akoZakladny('/'));
  await pripad('API vráti data: null', '/', { data: null, verzia: 0, subory: {}, kategorie: {}, clanky: {} }, akoZakladny('/'));
  await pripad('schema: 2 (novší backend)', '/', (() => { const o = kopia(); o.data.schema = 2; o.verzia = 9; return o; })(), akoZakladny('/'));
  await pripad('zlý tvar celku (domov nie je objekt)', '/', (() => { const o = kopia(); o.data.domov = 'x'; o.verzia = 9; return o; })(), akoZakladny('/'));
  await pripad('nie JSON', '/', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"data": {' }), akoZakladny('/'));
  await pripad('schema: 2 na stránke kategórie', '/category/refugia', (() => { const o = kopia(); o.data.schema = 2; return o; })(), akoZakladny('/category/refugia'));

  console.log('[odolnosť] chýbajúce kúsky → vynechať alebo nahradiť zo základného');
  {
    /* Fotka chýba v `subory` (zmazaná z médií) → obrázok zo základného vzhľadu. */
    const o = kopia();
    const id = zaznam(o, 'refugia').obrazok.id;
    delete o.subory[id];
    await pripad('chýbajúca fotka (nie je v subory) → dlaždica so základným obrázkom', '/', o, async (page) => {
      const src = await page.getAttribute('a.lkat-dlazdica[href="/category/refugia"] img', 'src');
      return src && src.endsWith('/strapi/uploads/small_kategoria_refugium_023d7282bb.jpg') ? [] : [`obrázok dlaždice ${src}`];
    });
    await pripad('chýbajúca fotka (nie je v subory) → hlavička kategórie so základným obrázkom', '/category/refugia', o, async (page) => {
      const bg = await page.$eval('.ch-foto', (e) => e.style.background);
      return bg.includes('/strapi/uploads/kategoria_refugium_023d7282bb.jpg') ? [] : [`hlavička: ${bg.slice(0, 120)}`];
    });
  }
  {
    /* Fotka je v `subory`, ale súbor vráti 404 → po chybe nastúpi základný obrázok. */
    const o = kopia();
    const id = zaznam(o, 'refugia').obrazok.id;
    o.subory[id] = { ...o.subory[id], url: '/uploads/neexistuje_000.jpg', formats: { small: { url: '/uploads/small_neexistuje_000.jpg', width: 500, height: 300 }, medium: { url: '/uploads/medium_neexistuje_000.jpg', width: 750, height: 450 }, thumbnail: { url: '/uploads/thumbnail_neexistuje_000.jpg', width: 245, height: 150 } } };
    await pripad('chýbajúca fotka (404) → dlaždica aj lišta so základným obrázkom', '/', o, async (page) => {
      const z = [];
      const img = page.locator('a.lkat-dlazdica[href="/category/refugia"] img');
      const stav = await img.evaluate((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 }));
      if (!/(small|medium)_kategoria_refugium_023d7282bb\.jpg$/.test(stav.src) || !stav.ok) z.push(`dlaždica: ${JSON.stringify(stav)}`);
      return z;
    });
    await pripad('chýbajúca fotka (404) → hlavička kategórie so základným obrázkom', '/category/refugia', o, async (page) => {
      const bg = await page.$eval('.ch-foto', (e) => e.style.background);
      return bg.includes('/strapi/uploads/kategoria_refugium_023d7282bb.jpg') ? [] : [`hlavička: ${bg.slice(0, 120)}`];
    });
  }
  {
    /* Kategória zmazaná (documentId nie je v rozriesene.kategorie) → dlaždica,
       riadok aj odkaz v päte sa vynechajú. */
    const o = kopia();
    dlazdica(o, 'povesti').kategoria.dokument = 'zmazana0000000000000000';
    const riadok = o.data.domov.sekcie.find((s) => s.typ === 'dalsi-obsah').riadky.find((r) => r.kategoria.slug === 'odborne-texty');
    riadok.kategoria.dokument = 'zmazana0000000000000001';
    o.data.pata.stlpce[1].odkazy.find((x) => x.ciel.kategoria?.slug === '3d-modely').ciel.kategoria.dokument = 'zmazana0000000000000002';
    await pripad('kategória mimo rozriesene → dlaždica, riadok a odkaz v päte vynechané', '/', o, async (page) => {
      const z = [];
      if (await page.locator('a.lkat-dlazdica[href="/category/povesti"]').count()) z.push('dlaždica Povesti ostala');
      if (await page.locator('.lkat-dlazdica').count() !== 8) z.push(`dlaždíc ${await page.locator('.lkat-dlazdica').count()} (čakal som 8)`);
      if (await page.locator('.cat-rail a[href="/category/povesti"]').count()) z.push('Povesti ostali v lište');
      if (await page.locator('.dob-vsetky[href="/category/odborne-texty"]').count()) z.push('riadok Odborné texty ostal');
      if (await page.locator('.dob-kategoria').count() !== 2) z.push(`riadkov ${await page.locator('.dob-kategoria').count()} (čakal som 2)`);
      if (await page.locator('.lfoot-col a[href="/category/3d-modely"]').count()) z.push('odkaz 3D modely v päte ostal');
      return z;
    });
  }
  {
    /* Článok nie je v `clanky` pre jazyk → populárne a pripnuté sa vynechajú,
       úvodný článok tiež; v angličtine chýba len anglická verzia. */
    const o = kopia();
    const pop = o.data.domov.hladanie.popularne;
    pop[0].clanok.dokument = 'neexistuje00000000000000';
    const kr = kronika(o);
    const druhy = kr.pripnute[1].dokument;
    delete o.clanky[druhy].en;
    await pripad('článok mimo clanky → populárne vynechané (sk)', '/', o, async (page) => {
      const z = [];
      const texty = await page.$$eval('.lhero-rychle a', (a) => a.map((x) => x.textContent));
      if (texty.join('|') !== 'Devín|Molpír') z.push(`populárne: ${texty.join('|')}`);
      const sep = await page.locator('.lhero-rychle > span[aria-hidden="true"]').count();
      if (sep !== 1) z.push(`oddeľovačov ${sep}`);
      return z;
    });
    await pripad('článok mimo clanky pre jazyk → pripnutý vynechaný (en)', '/en', o, async (page) => {
      const pas = await page.$$eval('.lakv-strip a', (a) => a.slice(0, 4).map((x) => x.getAttribute('href')));
      const ocakavane = [0, 2, 3].map((i) => `/en/blog/${o.clanky[kr.pripnute[i].dokument].en.slug}`);
      return ocakavane.every((h, i) => pas[i] === h) ? [] : [`pás: ${pas.join(', ')}`];
    });
    const o2 = kopia();
    kronika(o2).uvodnyClanok.dokument = 'neexistuje00000000000000';
    await pripad('úvodný článok kroniky mimo clanky → dlaždica úvodu vynechaná', '/', o2, async (page) => (
      await page.locator('.lakv-pinned').count() ? ['úvodná dlaždica ostala'] : []
    ));
  }
  {
    const o = kopia();
    o.data.domov.sekcie.splice(1, 0, { id: 'novinka', typ: 'galeria-3d', viditelna: true, nieco: [1, 2, 3] });
    await pripad('neznámy typ sekcie → preskočený, ostatné sekcie sa nakreslia', '/', o, async (page) => {
      const z = [];
      for (const s of ['section.lhome-mapa', 'section.dob', 'section.lhome-cinnost', 'section.lakv']) if (!(await page.locator(s).count())) z.push(`chýba ${s}`);
      return z;
    });
  }
  {
    const o = kopia();
    o.data.domov.dlazdice.skupiny[1].polozky = [];
    await pripad('prázdna skupina dlaždíc → nezobrazí sa ani jej nadpis', '/', o, async (page) => {
      const z = [];
      if (await page.locator('.lkat-predel').count()) z.push('nadpis „Pramene a tradícia" ostal');
      if (await page.locator('.lkat-rad--pramene').count()) z.push('rad pramene ostal');
      if (await page.locator('.lkat-rad--typy .lkat-dlazdica').count() !== 5) z.push('horný rad sa zmenil');
      if (await page.locator('.cat-rail-predel').count()) z.push('oddeľovač v lište ostal');
      return z;
    });
    const o2 = kopia();
    for (const p of o2.data.domov.dlazdice.skupiny[1].polozky) p.kategoria.dokument = `zmazana-${p.id}`;
    await pripad('skupina len so zmazanými kategóriami → nezobrazí sa ani nadpis', '/', o2, async (page) => (
      await page.locator('.lkat-predel, .lkat-rad--pramene').count() ? ['skupina alebo nadpis ostali'] : []
    ));
  }
  {
    const o = kopia();
    o.data.domov.sekcie.find((s) => s.typ === 'mapa').viditelna = false;
    o.data.domov.pridajteSa.viditelna = false;
    kronika(o).fotogaleriaViditelna = false;
    await pripad('skryté sekcie (mapa, pridajte sa, fotogaléria) sa nekreslia, bez data-vw', '/', o, async (page) => {
      const z = [];
      if (await page.locator('section.lhome-mapa').count()) z.push('mapa ostala');
      if (await page.locator('section.ljoin').count()) z.push('pridajte sa ostalo');
      if (await page.locator('.lakv-gal').count()) z.push('fotogaléria ostala');
      const vw = await page.locator('[data-vw], [data-vw-skryte]').count();
      if (vw) z.push(`${vw} prvkov s data-vw na verejnom webe`);
      return z;
    });
  }
} finally {
  await prehliadac.close();
  server.close();
}

const ok = vysledky.filter((v) => v.ok).length;
zapis('odolnost-vysledok.json', { kedy: new Date().toISOString(), prislo: `${ok} z ${vysledky.length}`, vysledky });
console.log(`\n[odolnosť] prešlo ${ok} z ${vysledky.length}`);
process.exit(ok === vysledky.length ? 0 : 1);
