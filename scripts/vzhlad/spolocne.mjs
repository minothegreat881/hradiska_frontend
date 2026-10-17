/**
 * Spoločné pre testy vzhľadu webu: zoznam stránok, ustálenie stránky,
 * zachytenie DOM a snímky, porovnanie pixelov.
 *
 * Prostredie (plán, časť 10): dnešný web = build z `main` vo worktree
 * `../hradiska-web-zaklad`, nový web = build z vetvy; oba proti referenčnému
 * Strapi na `http://localhost:1338` (kópia ostrej DB, len GET).
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TU = dirname(fileURLToPath(import.meta.url));
export const KOREN = resolve(TU, '..', '..');
export const VYSTUP = join(TU, 'vystup');
export const BACKEND = process.env.VZHLAD_BACKEND || 'http://localhost:1338';
mkdirSync(VYSTUP, { recursive: true });

export const SIRKY = [
  { meno: '1440', width: 1440, height: 900 },
  { meno: '390', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
];
export const JAZYKY = ['sk', 'en', 'de'];
export const CLANOK_SK = 'devin';

const predpona = (j) => (j === 'sk' ? '' : `/${j}`);

/** Slugy kategórií z databázy a slug článku v každom jazyku. */
export async function nacitajZoznamy() {
  const r = await fetch(`${BACKEND}/api/blog-categories?sort=order:asc&pagination[pageSize]=100`);
  const kategorie = (await r.json()).data.map((k) => k.slug);
  const c = await fetch(`${BACKEND}/api/blog-posts?filters[slug][$eq]=${CLANOK_SK}&locale=sk&fields[0]=slug&populate[localizations][fields][0]=slug&populate[localizations][fields][1]=locale`);
  const p = (await c.json()).data[0];
  const clanok = { sk: p.slug };
  for (const l of p.localizations || []) clanok[l.locale] = l.slug;
  return { kategorie, clanok };
}

/** Všetky stránky testu zhody: domovská, kategórie, článok, aktuality — v troch jazykoch. */
export function stranky({ kategorie, clanok }) {
  const von = [];
  for (const j of JAZYKY) {
    const p = predpona(j);
    von.push({ id: `${j}-domov`, jazyk: j, druh: 'domov', cesta: p || '/' });
    for (const k of kategorie) von.push({ id: `${j}-kategoria-${k}`, jazyk: j, druh: 'kategoria', slug: k, cesta: `${p}/category/${k}` });
    if (clanok[j]) von.push({ id: `${j}-clanok`, jazyk: j, druh: 'clanok', cesta: `${p}/blog/${clanok[j]}` });
    von.push({ id: `${j}-aktuality`, jazyk: j, druh: 'aktuality', cesta: `${p}/aktuality` });
  }
  return von;
}

export async function spustiPrehliadac() {
  return chromium.launch({ args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text'] });
}

/**
 * Nový kontext so stálymi podmienkami: bez service workera, bez pohybu,
 * cudzie domény zablokované (mapka v článku ťahá dlaždice z Esri — výsledok
 * by závisel od siete, nie od webu).
 */
export async function novyKontext(prehliadac, sirka, { route } = {}) {
  const ctx = await prehliadac.newContext({
    viewport: { width: sirka.width, height: sirka.height },
    deviceScaleFactor: sirka.deviceScaleFactor ?? 1,
    isMobile: !!sirka.isMobile,
    hasTouch: !!sirka.hasTouch,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
    locale: 'sk-SK',
    timezoneId: 'Europe/Bratislava',
  });
  await ctx.route((u) => !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(u.href), (r) => r.abort());
  if (route) await route(ctx);
  return ctx;
}

const spi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Počká, kým sa stránka prestane meniť (sieť aj DOM). */
export async function ustal(page, { max = 30000, pokoj = 4, krok = 400 } = {}) {
  try { await page.waitForLoadState('networkidle', { timeout: max }); } catch { /* ide sa ďalej podľa DOM */ }
  const koniec = Date.now() + max;
  let posledny = '';
  let rovnakych = 0;
  while (Date.now() < koniec) {
    const teraz = await page.evaluate(() => document.body.innerHTML.length + ':' + document.body.innerHTML);
    if (teraz === posledny) {
      if (++rovnakych >= pokoj) break;
    } else { rovnakych = 0; posledny = teraz; }
    await spi(krok);
  }
  try { await page.waitForLoadState('networkidle', { timeout: 5000 }); } catch { /* nič */ }
}

/**
 * Stiahne aj odložené obrázky (`loading="lazy"` mimo obrazu) a počká, kým
 * dobehnú ich `onError` — karta článku pri mŕtvej fotke prepne na kresbu.
 * Bez toho by DOM závisel od toho, kam po načítaní dočiahol prehliadač.
 * Atribút `loading` sa potom vráti, takže DOM ostane taký, ako ho kreslí web.
 */
export async function nacitajObrazky(page) {
  await page.evaluate(async () => {
    const lenive = [...document.querySelectorAll('img[loading="lazy"]')];
    lenive.forEach((i) => { i.loading = 'eager'; });
    const koniec = Date.now() + 20000;
    while (Date.now() < koniec && ![...document.images].every((i) => i.complete)) await new Promise((r) => setTimeout(r, 150));
    await new Promise((r) => setTimeout(r, 300));
    lenive.forEach((i) => { if (i.isConnected) i.loading = 'lazy'; });
  });
}

/**
 * DOM tela stránky na porovnanie. Odstránia sa atribúty `data-vw*` (na webe
 * by aj tak nemali byť — overuje sa zvlášť) a obsah sekcie s mapou (mapa sa
 * bez posunu nenačíta, aj tak by tam nič nebolo). Voliteľne sa podstromy
 * z `nahradit` (selektory) nahradia zástupcom — akceptované rozdiely.
 */
export async function dom(page, { nahradit = [] } = {}) {
  return page.evaluate((nahradit) => {
    const telo = document.body.cloneNode(true);
    const vw = [];
    telo.querySelectorAll('*').forEach((el) => {
      for (const a of [...el.attributes]) if (a.name.startsWith('data-vw')) { vw.push(a.name); el.removeAttribute(a.name); }
    });
    telo.querySelectorAll('section.lhome-mapa, section.lart-mapa').forEach((el) => { el.innerHTML = ''; });
    for (const s of nahradit) telo.querySelectorAll(s).forEach((el) => { el.replaceWith(document.createComment(`akceptovany-rozdiel ${s}`)); });
    /* Adresy obrázkov sú absolútne (pôvod stránky + `/strapi`), odkazy na
       zdieľanie nesú adresu stránky zakódovanú — a dnešný a nový web bežia
       na rôznych portoch. Pôvod sa preto zjednotí (aj zakódovaný). */
    const html = telo.outerHTML.split(location.origin).join('http://POVOD')
      .split(encodeURIComponent(location.origin)).join(encodeURIComponent('http://POVOD'));
    return { html, vw };
  }, nahradit);
}

/**
 * Počká, kým dobehnú konečné animácie (Web Animations aj CSS). Roztiahnutím
 * okna sa prvky „dostanú do obrazu" a spustia sa ich nábehy (`whileInView`,
 * `ScrollReveal`) — tie DOM nemenia, takže `ustal` ich nevidí.
 */
async function cakajNaAnimacie(page) {
  await spi(200);
  await page.evaluate(async () => {
    const konecne = () => document.getAnimations().filter((x) => {
      const t = x.effect?.getComputedTiming?.();
      return x.playState === 'running' && t && Number.isFinite(t.endTime);
    });
    const koniec = Date.now() + 8000;
    while (Date.now() < koniec && konecne().length) {
      await Promise.race([Promise.all(konecne().map((x) => x.finished.catch(() => {}))), new Promise((r) => setTimeout(r, 500))]);
    }
  });
  await spi(300);
}

/** Počká na všetky obrázky (aj v pozadí) a písma. */
async function cakajNaObrazky(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
    /* Obrázky v pozadí (hlavička kategórie) — prehliadač ich má v pamäti,
       keď sa stiahnu raz cez Image(). */
    const pozadia = new Set();
    document.querySelectorAll('*').forEach((el) => {
      const b = getComputedStyle(el).backgroundImage;
      for (const m of b.matchAll(/url\("?([^")]+)"?\)/g)) pozadia.add(m[1]);
    });
    const koniec = Date.now() + 25000;
    while (Date.now() < koniec && ![...document.images].every((i) => i.complete)) await new Promise((r) => setTimeout(r, 150));
    await Promise.all([
      ...[...document.images].map((i) => (i.naturalWidth ? i.decode().catch(() => {}) : null)),
      ...[...pozadia].map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); }),
    ]);
    await document.fonts.ready;
    /* Obrázok, ktorý sa nenačítal (v lokálnej kópii médií chýba pár súborov,
       napr. titulná fotka článku Devín), kreslí Chromium raz s ikonou
       a popisom, raz bez — podľa toho, kedy chyba prišla. Na snímke sa preto
       skryje; DOM sa porovnáva skôr a nezmenený. */
    document.querySelectorAll('img').forEach((i) => { if (i.complete && !i.naturalWidth) i.style.visibility = 'hidden'; });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
}

/**
 * Snímka celej stránky so stálymi podmienkami.
 *
 * Snímka celej stránky vykreslí aj to, čo je pod okrajom okna, a tým spustí
 * pozorovateľov (vybraná fotogaléria kroniky sa dotiahne, až keď je
 * „v obraze", nábehy `whileInView`) — stránka sa teda zmení práve snímaním.
 * Preto sa sníma dovtedy, kým dve snímky po sebe nie sú bajt po bajte rovnaké
 * (najviac päťkrát); medzi nimi sa čaká na sieť, DOM, animácie a obrázky.
 *
 * `css` = doplnkové pravidlá (napr. pevná výška oblasti s akceptovaným
 * rozdielom, aby nepohla zvyškom stránky), `maska` = selektory zakryté farbou.
 */
export async function snimka(page, { css = '', maska = [] } = {}) {
  if (css) await page.addStyleTag({ content: css });
  await page.addStyleTag({ content: 'section.lhome-mapa, section.lart-mapa { visibility: hidden !important; } *, *::before, *::after { caret-color: transparent !important; }' });
  const nasnimaj = async () => {
    await ustal(page, { max: 15000, pokoj: 3 });
    await cakajNaAnimacie(page);
    await cakajNaObrazky(page);
    await spi(300);
    return page.screenshot({
      fullPage: true, animations: 'disabled', caret: 'hide', scale: 'css',
      mask: maska.map((m) => page.locator(m)), maskColor: '#ff00ff',
    });
  };
  let predosla = await nasnimaj();
  for (let i = 0; i < 5; i++) {
    const dalsia = await nasnimaj();
    if (dalsia.equals(predosla)) return dalsia;
    predosla = dalsia;
  }
  return predosla;
}

/**
 * Pixely dvoch PNG. Bez `oblasti` musia mať rovnaký rozmer a porovná sa celá
 * plocha. `oblasti` = pásy riadkov `{ a0, a1, b0 }`: riadky [a0, a1) prvej
 * snímky proti riadkom od b0 druhej (pás pod akceptovaným rozdielom sa môže
 * posunúť). Vráti počet rozdielnych pixelov, -1 pri nesúhlase rozmerov.
 */
export async function porovnajPng(a, b, oblasti = null) {
  const nacitaj = (x) => sharp(x).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [ia, ib] = await Promise.all([nacitaj(a), nacitaj(b)]);
  const w = ia.info.width;
  if (w !== ib.info.width) return { rozdiel: -1, dovod: `šírka ${w} ≠ ${ib.info.width}` };
  if (!oblasti) {
    if (ia.info.height !== ib.info.height) return { rozdiel: -1, dovod: `výška ${ia.info.height} ≠ ${ib.info.height}` };
    oblasti = [{ a0: 0, a1: ia.info.height, b0: 0 }];
  }
  let rozdiel = 0;
  for (const { a0, a1, b0 } of oblasti) {
    if (a1 - a0 + b0 > ib.info.height || a1 > ia.info.height) return { rozdiel: -1, dovod: `pás ${a0}–${a1} mimo snímky` };
    for (let y = a0; y < a1; y++) {
      const oa = y * w * 4;
      const ob = (y - a0 + b0) * w * 4;
      for (let x = 0; x < w * 4; x += 4) {
        if (ia.data[oa + x] !== ib.data[ob + x] || ia.data[oa + x + 1] !== ib.data[ob + x + 1] || ia.data[oa + x + 2] !== ib.data[ob + x + 2]) rozdiel++;
      }
    }
  }
  return { rozdiel, vyska: [ia.info.height, ib.info.height] };
}

/** Prvý rozdiel dvoch reťazcov s okolím — do správy. */
export function prvyRozdiel(a, b, okolie = 160) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return null;
  return { pozicia: i, dnes: a.slice(Math.max(0, i - okolie), i + okolie), novy: b.slice(Math.max(0, i - okolie), i + okolie) };
}

export function zapis(meno, obsah) {
  const f = join(VYSTUP, meno);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, typeof obsah === 'string' || Buffer.isBuffer(obsah) ? obsah : JSON.stringify(obsah, null, 2));
  return f;
}

/** Jednoduchý rad úloh s obmedzeným súbehom. */
export async function poJednom(zoznam, sucasne, fn) {
  const von = new Array(zoznam.length);
  let i = 0;
  const pracovnik = async () => { while (i < zoznam.length) { const k = i++; von[k] = await fn(zoznam[k], k); } };
  await Promise.all(Array.from({ length: Math.min(sucasne, zoznam.length) }, pracovnik));
  return von;
}
