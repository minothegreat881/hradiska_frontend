/**
 * VZHĽAD WEBU — kontrola údajov. Jedna definícia pre server (BE `src/api/vzhlad-webu/kontrola.ts`)
 * aj editor (FE `src/lib/vzhlad/kontrola.ts`); súbor sa kopíruje, preto nemá žiadne importy
 * okrem `./typy` a nepoužíva nič zo Strapi ani z prehliadača.
 *
 *  - `skontrolujTvar(v)`    — štruktúra, typy, limity, povolené cesty a odkazy, jedinečnosť.
 *                              Nepotrebuje databázu, dá sa pustiť v editore pri každom ťuknutí.
 *  - `skontrolujOdkazy(v,k)` — či kategórie, články a súbory, na ktoré vzhľad ukazuje, existujú.
 *                              `k` dodá server z databázy (editor môže z toho, čo má načítané).
 *  - `skontrolujZakladDb(z)` — tvar `zakladDb` (hodnoty z DB, z ktorých koncept vychádzal).
 *  - `zbierajOdkazy(v)`     — všetky odkazy na kategórie, články a obrázky aj s cestou k poľu
 *                              (server z nich rozrieši odpoveď a chráni fotky pred zmazaním).
 *
 * Chyby majú cestu k poľu ako `domov.dlazdice.skupiny[1].polozky[0].kategoria` a správu po slovensky.
 * Kontrola vždy prejde celý vzhľad a vráti všetky chyby naraz (najviac `NAJVIAC_CHYB`).
 */

import {
  SCHEMA_VZHLADU,
  LIMITY,
  VZOR_ID,
  VZOR_CESTY,
  VZOR_CESTY_OBRAZKA,
  KLUCE_CINNOSTI,
  TYPY_SEKCII,
  DRUHY_SIETI,
} from './typy';
import type {
  ChybaVzhladu,
  OdkazClanku,
  OdkazKategorie,
  Vzhlad,
  ZoradenieClankov,
} from './typy';

/* ───────────────────────── Pomocné konštanty ───────────────────────── */

/** Viac chýb naraz nemá zmysel ukazovať a odpoveď by bola zbytočne veľká. */
export const NAJVIAC_CHYB = 200;

/** documentId v Strapi 5 (24 malých písmen a číslic; necháva sa rezerva). */
const VZOR_DOKUMENTU = /^[a-z0-9]{1,64}$/;
/** Slug ako ho povoľuje pole `uid` v Strapi (v DB je aj jeden s veľkým písmenom). */
const VZOR_SLUGU = /^[A-Za-z0-9\-_.~]{1,200}$/;
/** Výrez obrázka (CSS object-position) — len percentá, nič, čím by sa dalo vpašovať CSS. */
const VZOR_POZICIE = /^(\d{1,3}(?:\.\d{1,2})?)% (\d{1,3}(?:\.\d{1,2})?)%$/;
/** Riadiace znaky okrem tabulátora a nového riadka. */
const RIADIACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
/** Znaky, ktoré do adresy nepatria (a otvárali by cestu k vloženiu do HTML). */
const ZAKAZANE_V_ADRESE = /[\s<>"'`\\]/;
const VZOR_EMAILU = /^[^\s@<>"'`\\]+@[^\s@<>"'`\\]+\.[^\s@<>"'`\\]+$/;

const ZORADENIA: readonly ZoradenieClankov[] = ['zverejnenie', 'povodny-datum', 'abecedne'];
const VYBERY = ['najnovsie', 'rucne'] as const;

/** Najviac sekcií domovskej (typy sú 4, „Ďalší obsah“ sa môže opakovať). */
const NAJVIAC_SEKCII = TYPY_SEKCII.length + LIMITY.riadkovClankov;
/** Strop dĺžky zoznamov kategórií (dnes ich je 14). */
const NAJVIAC_KATEGORII = 100;

/* ───────────────────────── Zbierač chýb ───────────────────────── */

class Chyby {
  readonly zoznam: ChybaVzhladu[] = [];
  pridaj(cesta: string, sprava: string): void {
    if (this.zoznam.length < NAJVIAC_CHYB) this.zoznam.push({ cesta, sprava });
  }
}

type O = Record<string, unknown>;

const pod = (cesta: string, kluc: string) => (cesta ? `${cesta}.${kluc}` : kluc);
const prvok = (cesta: string, i: number) => `${cesta}[${i}]`;
const ma = (o: O, k: string) => Object.prototype.hasOwnProperty.call(o, k);
const jeObjekt = (x: unknown): x is O => typeof x === 'object' && x !== null && !Array.isArray(x);
const skrat = (s: string) => (s.length > 40 ? `${s.slice(0, 40)}…` : s);

/**
 * Objekt s presne danými kľúčmi. Vráti false, ak to nie je objekt (ďalej sa nekontroluje).
 * Nepoznaný kľúč je chyba — editor ani web by ho neuložili, takže je to preklep alebo podvrh.
 */
function objekt(ch: Chyby, cesta: string, x: unknown, povinne: readonly string[], volitelne: readonly string[] = []): x is O {
  if (!jeObjekt(x)) {
    ch.pridaj(cesta, 'Očakáva sa objekt.');
    return false;
  }
  for (const k of Object.keys(x)) {
    if (!povinne.includes(k) && !volitelne.includes(k)) ch.pridaj(pod(cesta, k), `Nepoznaný kľúč „${skrat(k)}“.`);
  }
  for (const k of povinne) {
    if (!ma(x, k) || x[k] === undefined) ch.pridaj(pod(cesta, k), 'Chýba povinné pole.');
  }
  return true;
}

function zoznam(ch: Chyby, cesta: string, x: unknown, min: number, max: number): x is unknown[] {
  if (!Array.isArray(x)) {
    ch.pridaj(cesta, 'Očakáva sa zoznam.');
    return false;
  }
  if (x.length < min) ch.pridaj(cesta, min === 1 ? 'Zoznam nesmie byť prázdny.' : `Zoznam musí mať aspoň ${min} položiek.`);
  if (x.length > max) ch.pridaj(cesta, `Zoznam môže mať najviac ${max} položiek (má ${x.length}).`);
  return true;
}

/** Prejde najviac prvých `max` položiek (dlhší zoznam je už chybou a nemá zmysel ho celý prechádzať). */
function kazdy(x: unknown[], max: number, f: (p: unknown, i: number) => void): void {
  const n = Math.min(x.length, max);
  for (let i = 0; i < n; i++) f(x[i], i);
}

function bool(ch: Chyby, cesta: string, x: unknown): void {
  if (x !== undefined && typeof x !== 'boolean') ch.pridaj(cesta, 'Očakáva sa áno/nie (true/false).');
}

function celeCislo(ch: Chyby, cesta: string, x: unknown, min: number, max: number): void {
  if (x === undefined) return;
  if (typeof x !== 'number' || !Number.isInteger(x)) ch.pridaj(cesta, 'Očakáva sa celé číslo.');
  else if (x < min || x > max) ch.pridaj(cesta, `Číslo musí byť od ${min} do ${max}.`);
}

function jedenZ<T extends string>(ch: Chyby, cesta: string, x: unknown, moznosti: readonly T[]): x is T {
  if (x === undefined) return false;
  if (typeof x !== 'string' || !(moznosti as readonly string[]).includes(x)) {
    ch.pridaj(cesta, `Povolené hodnoty: ${moznosti.join(', ')}.`);
    return false;
  }
  return true;
}

/** Obyčajný text: dĺžka, žiadne HTML, žiadne riadiace znaky. */
function retazec(ch: Chyby, cesta: string, h: string, limit: number): void {
  if (h.length > limit) ch.pridaj(cesta, `Text je dlhší ako ${limit} znakov (má ${h.length}).`);
  if (/[<>]/.test(h)) ch.pridaj(cesta, 'Text nesmie obsahovať znaky < a > (HTML sa nepovoľuje).');
  if (RIADIACE.test(h)) ch.pridaj(cesta, 'Text obsahuje neplatné riadiace znaky.');
}

const JAZYKOVE = ['sk', 'en', 'de', 'enZo', 'deZo'] as const;

/** `Text` (sk povinná) alebo `TextVolitelny` (všetko voliteľné). */
function text(ch: Chyby, cesta: string, x: unknown, limit: number, skPovinna = true): void {
  if (!objekt(ch, cesta, x, skPovinna ? ['sk'] : [], skPovinna ? ['en', 'de', 'enZo', 'deZo'] : JAZYKOVE)) return;
  for (const j of JAZYKOVE) {
    if (!ma(x, j) || x[j] === undefined) continue;
    const h = x[j];
    const c = pod(cesta, j);
    if (j === 'sk' && skPovinna) {
      if (typeof h !== 'string' || !h.trim()) {
        ch.pridaj(c, 'Slovenský text je povinný.');
        continue;
      }
    } else if (h === null) continue;
    if (typeof h !== 'string') {
      ch.pridaj(c, 'Očakáva sa text.');
      continue;
    }
    retazec(ch, c, h, limit);
  }
}

function textAleboNull(ch: Chyby, cesta: string, x: unknown, limit: number): void {
  if (x === null) return;
  text(ch, cesta, x, limit);
}

/* ───────────────────────── Odkazy a obrázky ───────────────────────── */

/** Kľúč, podľa ktorého sa odkazy na tú istú kategóriu/článok považujú za rovnaké. */
export function klucOdkazu(o: unknown): string {
  if (!jeObjekt(o)) return '';
  return o.dokument ? `d:${String(o.dokument)}` : `s:${String(o.slug ?? '')}`;
}

function odkaz(ch: Chyby, cesta: string, x: unknown): void {
  if (!objekt(ch, cesta, x, ['dokument', 'slug'])) return;
  const d = x.dokument;
  if (d !== null && d !== undefined && (typeof d !== 'string' || !VZOR_DOKUMENTU.test(d))) {
    ch.pridaj(pod(cesta, 'dokument'), 'Neplatné documentId (malé písmená a číslice) alebo null.');
  }
  const s = x.slug;
  if (s !== undefined && (typeof s !== 'string' || !VZOR_SLUGU.test(s))) {
    ch.pridaj(pod(cesta, 'slug'), 'Neplatný slug (písmená, číslice, pomlčky; 1–200 znakov).');
  }
}

/** Zoznam odkazov bez opakovania. */
function zoznamOdkazov(ch: Chyby, cesta: string, x: unknown, min: number, max: number, coSaOpakuje: string): void {
  if (!zoznam(ch, cesta, x, min, max)) return;
  const videne = new Set<string>();
  kazdy(x, max, (p, i) => {
    odkaz(ch, prvok(cesta, i), p);
    if (!jeObjekt(p)) return;
    const k = klucOdkazu(p);
    if (videne.has(k)) ch.pridaj(prvok(cesta, i), `${coSaOpakuje} je v zozname dvakrát.`);
    videne.add(k);
  });
}

function obrazok(ch: Chyby, cesta: string, x: unknown): void {
  if (!jeObjekt(x)) {
    ch.pridaj(cesta, 'Očakáva sa obrázok ({ id } alebo { cesta }).');
    return;
  }
  if (ma(x, 'id')) {
    objekt(ch, cesta, x, ['id'], ['pozicia']);
    const id = x.id;
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) ch.pridaj(pod(cesta, 'id'), 'Id súboru musí byť kladné celé číslo.');
  } else if (ma(x, 'cesta')) {
    objekt(ch, cesta, x, ['cesta'], ['vlastny', 'pozicia']);
    const c = x.cesta;
    if (typeof c !== 'string' || c.length > LIMITY.url || !VZOR_CESTY_OBRAZKA.test(c)) {
      ch.pridaj(pod(cesta, 'cesta'), 'Cesta obrázka musí byť /uploads/<súbor> alebo /<súbor>.webp|png|jpg|jpeg|svg.');
    }
    bool(ch, pod(cesta, 'vlastny'), x.vlastny);
  } else {
    ch.pridaj(cesta, 'Obrázok musí mať id súboru alebo cestu.');
    return;
  }
  const p = x.pozicia;
  if (p === undefined || p === null) return;
  const m = typeof p === 'string' ? VZOR_POZICIE.exec(p) : null;
  if (!m || Number(m[1]) > 100 || Number(m[2]) > 100) {
    ch.pridaj(pod(cesta, 'pozicia'), 'Výrez musí byť v tvare „50% 40%“ (0–100 %) alebo null.');
  }
}

function obrazokAleboNull(ch: Chyby, cesta: string, x: unknown): void {
  if (x === null) return;
  obrazok(ch, cesta, x);
}

/** Cesta webu podľa `VZOR_CESTY` (ten nepustí ani `//…`, čo by prehliadač čítal ako adresu iného webu). */
function cestaWebu(ch: Chyby, cesta: string, x: unknown): void {
  if (typeof x !== 'string' || x.length > LIMITY.url || !VZOR_CESTY.test(x)) {
    ch.pridaj(cesta, 'Cesta webu musí začínať jedným „/“ a obsahovať len malé písmená, číslice, „-“, „/“ (a parametre ?a=b).');
  }
}

/** Adresa mimo webu: len `https://…` alebo `mailto:…`. */
function adresa(ch: Chyby, cesta: string, x: unknown, povolene: 'https' | 'mailto' | 'oboje'): void {
  if (typeof x !== 'string' || !x) {
    ch.pridaj(cesta, 'Očakáva sa adresa.');
    return;
  }
  if (x.length > LIMITY.url) {
    ch.pridaj(cesta, `Adresa je dlhšia ako ${LIMITY.url} znakov.`);
    return;
  }
  if (ZAKAZANE_V_ADRESE.test(x) || RIADIACE.test(x)) {
    ch.pridaj(cesta, 'Adresa obsahuje nepovolené znaky (medzery, úvodzovky, < >).');
    return;
  }
  if (x.startsWith('mailto:')) {
    if (povolene === 'https') ch.pridaj(cesta, 'Tu sa očakáva adresa https://…');
    else if (!VZOR_EMAILU.test(x.slice('mailto:'.length).split('?')[0])) ch.pridaj(cesta, 'Neplatná e-mailová adresa za „mailto:“.');
    return;
  }
  if (x.startsWith('https://')) {
    if (povolene === 'mailto') {
      ch.pridaj(cesta, 'Tu sa očakáva adresa mailto:…');
      return;
    }
    let u: URL | null = null;
    try {
      u = new URL(x);
    } catch {
      u = null;
    }
    if (!u || u.protocol !== 'https:' || !u.hostname || u.username || u.password) ch.pridaj(cesta, 'Neplatná adresa https://…');
    return;
  }
  ch.pridaj(cesta, povolene === 'mailto' ? 'Tu sa očakáva adresa mailto:…' : 'Odkaz mimo webu musí začínať https:// (alebo mailto:).');
}

function ciel(ch: Chyby, cesta: string, x: unknown): void {
  if (!jeObjekt(x)) {
    ch.pridaj(cesta, 'Očakáva sa cieľ odkazu.');
    return;
  }
  switch (x.druh) {
    case 'kategoria':
      if (objekt(ch, cesta, x, ['druh', 'kategoria'])) odkaz(ch, pod(cesta, 'kategoria'), x.kategoria);
      return;
    case 'clanok':
      if (objekt(ch, cesta, x, ['druh', 'clanok'])) odkaz(ch, pod(cesta, 'clanok'), x.clanok);
      return;
    case 'cesta':
      if (objekt(ch, cesta, x, ['druh', 'cesta'])) cestaWebu(ch, pod(cesta, 'cesta'), x.cesta);
      return;
    case 'url':
      if (objekt(ch, cesta, x, ['druh', 'url'])) adresa(ch, pod(cesta, 'url'), x.url, 'oboje');
      return;
    default:
      ch.pridaj(pod(cesta, 'druh'), 'Povolené druhy cieľa: kategoria, clanok, cesta, url.');
  }
}

/** Kontroluje jedinečnosť id v rámci jedného druhu prvkov (dlaždice, skupiny, sekcie …). */
function idPrvku(ch: Chyby, cesta: string, x: unknown, videne: Set<string>, druh: string): void {
  if (typeof x !== 'string' || !VZOR_ID.test(x)) {
    ch.pridaj(cesta, 'Id musí mať 1–40 znakov: malé písmená, číslice, pomlčky.');
    return;
  }
  if (videne.has(x)) ch.pridaj(cesta, `Id „${x}“ je medzi ${druh} dvakrát.`);
  videne.add(x);
}

/* ───────────────────────── Časti vzhľadu ───────────────────────── */

function domov(ch: Chyby, c: string, x: unknown): void {
  if (!objekt(ch, c, x, ['uvod', 'dlazdice', 'hladanie', 'sekcie', 'fotogaleria', 'pridajteSa'])) return;

  const u = x.uvod;
  const cu = pod(c, 'uvod');
  if (objekt(ch, cu, u, ['nadtitulok', 'nadpis', 'znak'])) {
    text(ch, pod(cu, 'nadtitulok'), u.nadtitulok, LIMITY.nadpis);
    text(ch, pod(cu, 'nadpis'), u.nadpis, LIMITY.nadpis);
    if (ma(u, 'znak')) obrazokAleboNull(ch, pod(cu, 'znak'), u.znak);
  }

  const d = x.dlazdice;
  const cd = pod(c, 'dlazdice');
  if (objekt(ch, cd, d, ['viditelne', 'skupiny'])) {
    bool(ch, pod(cd, 'viditelne'), d.viditelne);
    const cs = pod(cd, 'skupiny');
    if (zoznam(ch, cs, d.skupiny, 1, LIMITY.skupinDlazdic)) {
      const idSkupin = new Set<string>();
      const idDlazdic = new Set<string>();
      kazdy(d.skupiny, LIMITY.skupinDlazdic, (s, i) => {
        const ci = prvok(cs, i);
        if (!objekt(ch, ci, s, ['id', 'nadpis', 'polozky'])) return;
        idPrvku(ch, pod(ci, 'id'), s.id, idSkupin, 'skupinami dlaždíc');
        if (ma(s, 'nadpis')) textAleboNull(ch, pod(ci, 'nadpis'), s.nadpis, LIMITY.nadpis);
        const cp = pod(ci, 'polozky');
        if (!zoznam(ch, cp, s.polozky, 1, LIMITY.dlazdicVSkupine)) return;
        kazdy(s.polozky, LIMITY.dlazdicVSkupine, (p, j) => {
          const cj = prvok(cp, j);
          if (!objekt(ch, cj, p, ['id', 'kategoria', 'pocet'])) return;
          idPrvku(ch, pod(cj, 'id'), p.id, idDlazdic, 'dlaždicami');
          odkaz(ch, pod(cj, 'kategoria'), p.kategoria);
          bool(ch, pod(cj, 'pocet'), p.pocet);
        });
      });
    }
  }

  const h = x.hladanie;
  const ch_ = pod(c, 'hladanie');
  if (objekt(ch, ch_, h, ['viditelne', 'vyzva', 'popularneViditelne', 'popularne'])) {
    bool(ch, pod(ch_, 'viditelne'), h.viditelne);
    text(ch, pod(ch_, 'vyzva'), h.vyzva, LIMITY.nadpis);
    bool(ch, pod(ch_, 'popularneViditelne'), h.popularneViditelne);
    const cp = pod(ch_, 'popularne');
    if (zoznam(ch, cp, h.popularne, 0, LIMITY.popularnych)) {
      kazdy(h.popularne, LIMITY.popularnych, (p, i) => {
        const ci = prvok(cp, i);
        if (!objekt(ch, ci, p, ['text', 'clanok'])) return;
        text(ch, pod(ci, 'text'), p.text, LIMITY.nazov);
        odkaz(ch, pod(ci, 'clanok'), p.clanok);
      });
    }
  }

  sekcie(ch, pod(c, 'sekcie'), x.sekcie);

  const f = x.fotogaleria;
  const cf = pod(c, 'fotogaleria');
  if (f !== null && f !== undefined && objekt(ch, cf, f, ['fotky'])) {
    const cfo = pod(cf, 'fotky');
    if (zoznam(ch, cfo, f.fotky, 0, LIMITY.fotiekGalerie)) {
      const videne = new Set<number>();
      kazdy(f.fotky, LIMITY.fotiekGalerie, (id, i) => {
        if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1) ch.pridaj(prvok(cfo, i), 'Id súboru musí byť kladné celé číslo.');
        else if (videne.has(id)) ch.pridaj(prvok(cfo, i), 'Fotka je v galérii dvakrát.');
        else videne.add(id);
      });
    }
  }

  const p = x.pridajteSa;
  const cps = pod(c, 'pridajteSa');
  if (objekt(ch, cps, p, ['viditelna', 'nadtitulok', 'nadpis', 'citat', 'uvod', 'email', 'prosby'])) {
    bool(ch, pod(cps, 'viditelna'), p.viditelna);
    text(ch, pod(cps, 'nadtitulok'), p.nadtitulok, LIMITY.nadpis);
    text(ch, pod(cps, 'nadpis'), p.nadpis, LIMITY.nadpis);
    text(ch, pod(cps, 'citat'), p.citat, LIMITY.textKratky);
    text(ch, pod(cps, 'uvod'), p.uvod, LIMITY.textDlhy);
    if (p.email !== undefined && (typeof p.email !== 'string' || p.email.length > LIMITY.email || !VZOR_EMAILU.test(p.email))) {
      ch.pridaj(pod(cps, 'email'), `Očakáva sa e-mailová adresa (najviac ${LIMITY.email} znakov).`);
    }
    const cpr = pod(cps, 'prosby');
    if (zoznam(ch, cpr, p.prosby, 0, LIMITY.prosieb)) {
      kazdy(p.prosby, LIMITY.prosieb, (q, i) => {
        const ci = prvok(cpr, i);
        if (!objekt(ch, ci, q, ['nadpis', 'text'])) return;
        text(ch, pod(ci, 'nadpis'), q.nadpis, LIMITY.textKratky);
        text(ch, pod(ci, 'text'), q.text, LIMITY.textDlhy);
      });
    }
  }
}

function sekcie(ch: Chyby, c: string, x: unknown): void {
  if (!zoznam(ch, c, x, 0, NAJVIAC_SEKCII)) return;
  const idSekcii = new Set<string>();
  const idRiadkov = new Set<string>();
  const typy = new Set<string>();
  kazdy(x, NAJVIAC_SEKCII, (s, i) => {
    const ci = prvok(c, i);
    if (!jeObjekt(s)) {
      ch.pridaj(ci, 'Očakáva sa objekt.');
      return;
    }
    if (!jedenZ(ch, pod(ci, 'typ'), s.typ, TYPY_SEKCII)) {
      if (s.typ === undefined) ch.pridaj(pod(ci, 'typ'), 'Chýba typ sekcie.');
      return;
    }
    const typ = s.typ;
    if (typ !== 'dalsi-obsah' && typy.has(typ)) ch.pridaj(pod(ci, 'typ'), `Sekcia „${typ}“ môže byť na stránke len raz.`);
    typy.add(typ);
    const spolocne = ['id', 'typ', 'viditelna'];
    if (typ === 'mapa' || typ === 'cinnost') {
      if (!objekt(ch, ci, s, spolocne)) return;
    } else if (typ === 'dalsi-obsah') {
      if (!objekt(ch, ci, s, [...spolocne, 'nadpis', 'riadky'])) return;
      text(ch, pod(ci, 'nadpis'), s.nadpis, LIMITY.nadpis);
      const cr = pod(ci, 'riadky');
      if (zoznam(ch, cr, s.riadky, 0, LIMITY.riadkovClankov)) {
        kazdy(s.riadky, LIMITY.riadkovClankov, (r, j) => riadok(ch, prvok(cr, j), r, idRiadkov));
      }
    } else {
      if (!objekt(ch, ci, s, [...spolocne, 'uvodnyClanok', 'pripnute', 'obrazok', 'fotogaleriaViditelna'])) return;
      if (s.uvodnyClanok !== null && s.uvodnyClanok !== undefined) odkaz(ch, pod(ci, 'uvodnyClanok'), s.uvodnyClanok);
      zoznamOdkazov(ch, pod(ci, 'pripnute'), s.pripnute, 0, LIMITY.pripnutych, 'Článok');
      if (ma(s, 'obrazok')) obrazokAleboNull(ch, pod(ci, 'obrazok'), s.obrazok);
      bool(ch, pod(ci, 'fotogaleriaViditelna'), s.fotogaleriaViditelna);
    }
    idPrvku(ch, pod(ci, 'id'), s.id, idSekcii, 'sekciami');
    bool(ch, pod(ci, 'viditelna'), s.viditelna);
  });
}

function riadok(ch: Chyby, c: string, r: unknown, idRiadkov: Set<string>): void {
  if (!objekt(ch, c, r, ['id', 'kategoria', 'nadpis', 'pocet', 'vyber', 'zoradenie', 'lenSObrazkom', 'clanky', 'obrazky'])) return;
  idPrvku(ch, pod(c, 'id'), r.id, idRiadkov, 'riadkami článkov');
  odkaz(ch, pod(c, 'kategoria'), r.kategoria);
  if (ma(r, 'nadpis')) textAleboNull(ch, pod(c, 'nadpis'), r.nadpis, LIMITY.nadpis);
  celeCislo(ch, pod(c, 'pocet'), r.pocet, 1, LIMITY.clankovVRiadku);
  jedenZ(ch, pod(c, 'vyber'), r.vyber, VYBERY);
  jedenZ(ch, pod(c, 'zoradenie'), r.zoradenie, ZORADENIA);
  bool(ch, pod(c, 'lenSObrazkom'), r.lenSObrazkom);
  zoznamOdkazov(ch, pod(c, 'clanky'), r.clanky, 0, LIMITY.clankovVRiadku, 'Článok');
  const co = pod(c, 'obrazky');
  if (zoznam(ch, co, r.obrazky, 0, LIMITY.clankovVRiadku)) {
    const videne = new Set<string>();
    kazdy(r.obrazky, LIMITY.clankovVRiadku, (o, i) => {
      const ci = prvok(co, i);
      if (!objekt(ch, ci, o, ['clanok', 'obrazok'])) return;
      odkaz(ch, pod(ci, 'clanok'), o.clanok);
      obrazok(ch, pod(ci, 'obrazok'), o.obrazok);
      const k = klucOdkazu(o.clanok);
      if (videne.has(k)) ch.pridaj(pod(ci, 'clanok'), 'Pre ten istý článok je iný obrázok zadaný dvakrát.');
      videne.add(k);
    });
  }
}

function kategorie(ch: Chyby, c: string, x: unknown): void {
  if (!zoznam(ch, c, x, 0, NAJVIAC_KATEGORII)) return;
  const videne = new Set<string>();
  kazdy(x, NAJVIAC_KATEGORII, (k, i) => {
    const ci = prvok(c, i);
    if (!objekt(ch, ci, k, ['kategoria', 'nazov', 'titulok', 'popisokDlazdice', 'popisokMenu', 'popis', 'obrazok', 'tvary', 'clanky'])) return;
    odkaz(ch, pod(ci, 'kategoria'), k.kategoria);
    if (jeObjekt(k.kategoria)) {
      const kl = klucOdkazu(k.kategoria);
      if (videne.has(kl)) ch.pridaj(pod(ci, 'kategoria'), 'Kategória je vo vzhľade kategórií dvakrát.');
      videne.add(kl);
    }
    if (ma(k, 'nazov')) textAleboNull(ch, pod(ci, 'nazov'), k.nazov, LIMITY.nazov);
    if (ma(k, 'titulok')) textAleboNull(ch, pod(ci, 'titulok'), k.titulok, LIMITY.nazov);
    text(ch, pod(ci, 'popisokDlazdice'), k.popisokDlazdice, LIMITY.popisokDlazdice);
    if (k.popisokMenu !== null && k.popisokMenu !== undefined) text(ch, pod(ci, 'popisokMenu'), k.popisokMenu, LIMITY.popisokMenu, false);
    if (ma(k, 'popis')) textAleboNull(ch, pod(ci, 'popis'), k.popis, LIMITY.popis);
    if (ma(k, 'obrazok')) obrazokAleboNull(ch, pod(ci, 'obrazok'), k.obrazok);

    const t = k.tvary;
    const ct = pod(ci, 'tvary');
    if (t !== null && t !== undefined && objekt(ch, ct, t, ['sk'], ['en', 'de'])) {
      if (!Array.isArray(t.sk) || t.sk.length !== 3) ch.pridaj(pod(ct, 'sk'), 'Očakávajú sa presne 3 tvary (1, 2–4, 5 a viac).');
      else t.sk.forEach((s, j) => {
        if (typeof s !== 'string' || !s.trim()) ch.pridaj(prvok(pod(ct, 'sk'), j), 'Tvar nesmie byť prázdny.');
        else retazec(ch, prvok(pod(ct, 'sk'), j), s, LIMITY.popisokDlazdice);
      });
      for (const j of ['en', 'de'] as const) {
        const h = t[j];
        if (h === undefined || h === null) continue;
        if (typeof h !== 'string') ch.pridaj(pod(ct, j), 'Očakáva sa text alebo null.');
        else retazec(ch, pod(ct, j), h, LIMITY.popisokDlazdice);
      }
    }

    const cl = k.clanky;
    const cc = pod(ci, 'clanky');
    if (objekt(ch, cc, cl, ['zoradenie', 'pripnute'])) {
      jedenZ(ch, pod(cc, 'zoradenie'), cl.zoradenie, ZORADENIA);
      zoznamOdkazov(ch, pod(cc, 'pripnute'), cl.pripnute, 0, LIMITY.pripnutych, 'Článok');
    }
  });
}

function cinnost(ch: Chyby, c: string, x: unknown): void {
  if (!objekt(ch, c, x, ['nadpis', 'polozky'])) return;
  text(ch, pod(c, 'nadpis'), x.nadpis, LIMITY.nadpis);
  const cp = pod(c, 'polozky');
  if (!zoznam(ch, cp, x.polozky, KLUCE_CINNOSTI.length, KLUCE_CINNOSTI.length)) return;
  const videne = new Set<string>();
  kazdy(x.polozky, KLUCE_CINNOSTI.length, (p, i) => {
    const ci = prvok(cp, i);
    if (!objekt(ch, ci, p, ['kluc', 'nazov', 'popis', 'obrazok', 'viditelna', 'naDomovskej'])) return;
    if (jedenZ(ch, pod(ci, 'kluc'), p.kluc, KLUCE_CINNOSTI)) {
      if (videne.has(p.kluc)) ch.pridaj(pod(ci, 'kluc'), `Činnosť „${p.kluc}“ je v zozname dvakrát.`);
      videne.add(p.kluc);
    }
    text(ch, pod(ci, 'nazov'), p.nazov, LIMITY.nazov);
    text(ch, pod(ci, 'popis'), p.popis, LIMITY.popis);
    if (ma(p, 'obrazok')) obrazok(ch, pod(ci, 'obrazok'), p.obrazok);
    bool(ch, pod(ci, 'viditelna'), p.viditelna);
    bool(ch, pod(ci, 'naDomovskej'), p.naDomovskej);
  });
  for (const k of KLUCE_CINNOSTI) if (!videne.has(k)) ch.pridaj(cp, `Chýba činnosť „${k}“ (každá musí byť v zozname práve raz).`);
}

function menu(ch: Chyby, c: string, x: unknown): void {
  if (!objekt(ch, c, x, ['poradie', 'hlavnyRiadok', 'skryte'])) return;
  zoznamOdkazov(ch, pod(c, 'poradie'), x.poradie, 0, NAJVIAC_KATEGORII, 'Kategória');
  zoznamOdkazov(ch, pod(c, 'hlavnyRiadok'), x.hlavnyRiadok, 0, NAJVIAC_KATEGORII, 'Kategória');
  zoznamOdkazov(ch, pod(c, 'skryte'), x.skryte, 0, NAJVIAC_KATEGORII, 'Kategória');
  const poradie = Array.isArray(x.poradie) ? x.poradie.filter(jeObjekt).map((o) => klucOdkazu(o)) : [];
  const vPoradi = new Set(poradie);
  const hlavny = new Set<string>();
  for (const [pole, zoz] of [['hlavnyRiadok', x.hlavnyRiadok], ['skryte', x.skryte]] as const) {
    if (!Array.isArray(zoz)) continue;
    kazdy(zoz, NAJVIAC_KATEGORII, (o, i) => {
      if (!jeObjekt(o)) return;
      const k = klucOdkazu(o);
      if (poradie.length > 0 && !vPoradi.has(k)) ch.pridaj(prvok(pod(c, pole), i), 'Kategória nie je v poradí menu (menu.poradie).');
      if (pole === 'hlavnyRiadok') hlavny.add(k);
      else if (hlavny.has(k)) ch.pridaj(prvok(pod(c, pole), i), 'Kategória nemôže byť v hlavnom riadku menu a zároveň skrytá.');
    });
  }
}

function pata(ch: Chyby, c: string, x: unknown): void {
  if (!objekt(ch, c, x, ['stlpce', 'siete'])) return;
  const cs = pod(c, 'stlpce');
  if (zoznam(ch, cs, x.stlpce, 0, LIMITY.stlpcovPaty)) {
    const idStlpcov = new Set<string>();
    kazdy(x.stlpce, LIMITY.stlpcovPaty, (s, i) => {
      const ci = prvok(cs, i);
      if (!objekt(ch, ci, s, ['id', 'nadpis', 'odkazy'])) return;
      idPrvku(ch, pod(ci, 'id'), s.id, idStlpcov, 'stĺpcami päty');
      text(ch, pod(ci, 'nadpis'), s.nadpis, LIMITY.nadpis);
      const co = pod(ci, 'odkazy');
      if (!zoznam(ch, co, s.odkazy, 0, LIMITY.odkazovVStlpci)) return;
      kazdy(s.odkazy, LIMITY.odkazovVStlpci, (o, j) => {
        const cj = prvok(co, j);
        if (!objekt(ch, cj, o, ['text', 'ciel'])) return;
        text(ch, pod(cj, 'text'), o.text, LIMITY.nazov);
        ciel(ch, pod(cj, 'ciel'), o.ciel);
      });
    });
  }
  const cn = pod(c, 'siete');
  if (zoznam(ch, cn, x.siete, 0, LIMITY.odkazovVStlpci)) {
    kazdy(x.siete, LIMITY.odkazovVStlpci, (s, i) => {
      const ci = prvok(cn, i);
      if (!objekt(ch, ci, s, ['druh', 'url'])) return;
      if (jedenZ(ch, pod(ci, 'druh'), s.druh, DRUHY_SIETI)) adresa(ch, pod(ci, 'url'), s.url, s.druh === 'email' ? 'mailto' : 'https');
    });
  }
}

/* ───────────────────────── Verejné funkcie ───────────────────────── */

/** Kontrola tvaru vzhľadu bez databázy. Prázdny zoznam = v poriadku. */
export function skontrolujTvar(v: unknown): ChybaVzhladu[] {
  const ch = new Chyby();
  if (!objekt(ch, '', v, ['schema', 'domov', 'kategorie', 'cinnost', 'menu', 'pata'])) return ch.zoznam;
  if (v.schema !== SCHEMA_VZHLADU) {
    // Iná verzia schémy má iné pravidlá — ďalej kontrolovať nemá zmysel.
    return [{ cesta: 'schema', sprava: `Neznáma verzia schémy (server pozná ${SCHEMA_VZHLADU}).` }];
  }
  domov(ch, 'domov', v.domov);
  kategorie(ch, 'kategorie', v.kategorie);
  cinnost(ch, 'cinnost', v.cinnost);
  menu(ch, 'menu', v.menu);
  pata(ch, 'pata', v.pata);
  return ch.zoznam;
}

/** Tvar `zakladDb` (PUT /koncept ho nesie spolu s konceptom). */
export function skontrolujZakladDb(z: unknown): ChybaVzhladu[] {
  const ch = new Chyby();
  if (!objekt(ch, 'zakladDb', z, ['poradie', 'nazvy', 'fotogaleria'])) return ch.zoznam;
  for (const [pole, typ] of [['poradie', 'number'], ['nazvy', 'string']] as const) {
    const m = z[pole];
    if (!jeObjekt(m)) {
      ch.pridaj(`zakladDb.${pole}`, 'Očakáva sa objekt documentId → hodnota.');
      continue;
    }
    const kluce = Object.keys(m);
    if (kluce.length > NAJVIAC_KATEGORII) ch.pridaj(`zakladDb.${pole}`, 'Priveľa kategórií.');
    for (const k of kluce.slice(0, NAJVIAC_KATEGORII)) {
      const h = m[k];
      if (!VZOR_DOKUMENTU.test(k)) ch.pridaj(`zakladDb.${pole}`, `Neplatné documentId „${skrat(k)}“.`);
      else if (typ === 'number' ? typeof h !== 'number' || !Number.isInteger(h) : typeof h !== 'string' || h.length > LIMITY.nazov) {
        ch.pridaj(`zakladDb.${pole}.${k}`, typ === 'number' ? 'Očakáva sa celé číslo.' : 'Očakáva sa text.');
      }
    }
  }
  const f = z.fotogaleria;
  if (!Array.isArray(f) || f.length > 1000 || f.some((id) => typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1)) {
    ch.pridaj('zakladDb.fotogaleria', 'Očakáva sa zoznam id súborov.');
  }
  return ch.zoznam;
}

export interface NajdenyOdkaz<T> {
  cesta: string;
  odkaz: T;
}

export interface NajdenyObrazok {
  cesta: string;
  /** id súboru z knižnice médií … */
  id?: number;
  /** … alebo cesta (/uploads/… či súbor webu). */
  subor?: string;
}

export interface OdkazyVzhladu {
  kategorie: NajdenyOdkaz<OdkazKategorie>[];
  clanky: NajdenyOdkaz<OdkazClanku>[];
  obrazky: NajdenyObrazok[];
}

/**
 * Všetky odkazy vo vzhľade. Predpokladá vzhľad, ktorý prešiel `skontrolujTvar`;
 * na čomkoľvek inom nespadne, len vynechá, čo nerozumie.
 */
export function zbierajOdkazy(v: Vzhlad | null | undefined): OdkazyVzhladu {
  const out: OdkazyVzhladu = { kategorie: [], clanky: [], obrazky: [] };
  if (!jeObjekt(v)) return out;
  const kat = (cesta: string, o: unknown) => {
    if (jeObjekt(o)) out.kategorie.push({ cesta, odkaz: o as unknown as OdkazKategorie });
  };
  const cl = (cesta: string, o: unknown) => {
    if (jeObjekt(o)) out.clanky.push({ cesta, odkaz: o as unknown as OdkazClanku });
  };
  const ob = (cesta: string, o: unknown) => {
    if (!jeObjekt(o)) return;
    if (typeof o.id === 'number') out.obrazky.push({ cesta, id: o.id });
    else if (typeof o.cesta === 'string') out.obrazky.push({ cesta, subor: o.cesta });
  };
  const pole = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
  const obj = (x: unknown): O => (jeObjekt(x) ? x : {});

  const d = obj(v.domov);
  ob('domov.uvod.znak', obj(d.uvod).znak);
  pole(obj(d.dlazdice).skupiny).forEach((s, i) =>
    pole(obj(s).polozky).forEach((p, j) => kat(`domov.dlazdice.skupiny[${i}].polozky[${j}].kategoria`, obj(p).kategoria)),
  );
  pole(obj(d.hladanie).popularne).forEach((p, i) => cl(`domov.hladanie.popularne[${i}].clanok`, obj(p).clanok));
  pole(d.sekcie).forEach((s0, i) => {
    const s = obj(s0);
    const c = `domov.sekcie[${i}]`;
    if (s.typ === 'dalsi-obsah') {
      pole(s.riadky).forEach((r0, j) => {
        const r = obj(r0);
        const cr = `${c}.riadky[${j}]`;
        kat(`${cr}.kategoria`, r.kategoria);
        pole(r.clanky).forEach((a, k) => cl(`${cr}.clanky[${k}]`, a));
        pole(r.obrazky).forEach((o, k) => {
          cl(`${cr}.obrazky[${k}].clanok`, obj(o).clanok);
          ob(`${cr}.obrazky[${k}].obrazok`, obj(o).obrazok);
        });
      });
    } else if (s.typ === 'kronika') {
      cl(`${c}.uvodnyClanok`, s.uvodnyClanok);
      pole(s.pripnute).forEach((a, k) => cl(`${c}.pripnute[${k}]`, a));
      ob(`${c}.obrazok`, s.obrazok);
    }
  });
  const f = d.fotogaleria;
  if (jeObjekt(f)) pole(f.fotky).forEach((id, i) => {
    if (typeof id === 'number') out.obrazky.push({ cesta: `domov.fotogaleria.fotky[${i}]`, id });
  });

  pole(v.kategorie).forEach((k0, i) => {
    const k = obj(k0);
    kat(`kategorie[${i}].kategoria`, k.kategoria);
    ob(`kategorie[${i}].obrazok`, k.obrazok);
    pole(obj(k.clanky).pripnute).forEach((a, j) => cl(`kategorie[${i}].clanky.pripnute[${j}]`, a));
  });
  pole(obj(v.cinnost).polozky).forEach((p, i) => ob(`cinnost.polozky[${i}].obrazok`, obj(p).obrazok));
  const m = obj(v.menu);
  for (const k of ['poradie', 'hlavnyRiadok', 'skryte'] as const) pole(m[k]).forEach((o, i) => kat(`menu.${k}[${i}]`, o));
  pole(obj(v.pata).stlpce).forEach((s, i) =>
    pole(obj(s).odkazy).forEach((o, j) => {
      const c = obj(obj(o).ciel);
      const cesta = `pata.stlpce[${i}].odkazy[${j}].ciel`;
      if (c.druh === 'kategoria') kat(`${cesta}.kategoria`, c.kategoria);
      if (c.druh === 'clanok') cl(`${cesta}.clanok`, c.clanok);
    }),
  );
  return out;
}

/**
 * Kontrola odkazov proti databáze.
 *  - `kategorie` = documentId VŠETKÝCH kategórií v DB (podľa nich sa kontroluje aj úplnosť `menu.poradie`),
 *  - `clanky`    = documentId článkov zverejnených v slovenčine (stačia tie, na ktoré vzhľad odkazuje),
 *  - `subory`    = id existujúcich OBRÁZKOV (stačia tie, na ktoré vzhľad odkazuje).
 * Na serveri musí mať každý odkaz documentId — slug sám nestačí (mení sa, documentId nie).
 */
export function skontrolujOdkazy(
  v: Vzhlad,
  k: { kategorie: Set<string>; clanky: Set<string>; subory: Set<number> },
): ChybaVzhladu[] {
  const ch = new Chyby();
  const o = zbierajOdkazy(v);
  for (const { cesta, odkaz: x } of o.kategorie) {
    if (!x.dokument) ch.pridaj(cesta, `Kategória „${skrat(String(x.slug ?? ''))}“ nemá documentId.`);
    else if (!k.kategorie.has(x.dokument)) ch.pridaj(cesta, `Kategória „${skrat(String(x.slug ?? x.dokument))}“ neexistuje.`);
  }
  for (const { cesta, odkaz: x } of o.clanky) {
    if (!x.dokument) ch.pridaj(cesta, `Článok „${skrat(String(x.slug ?? ''))}“ nemá documentId.`);
    else if (!k.clanky.has(x.dokument)) ch.pridaj(cesta, `Článok „${skrat(String(x.slug ?? x.dokument))}“ neexistuje alebo nie je zverejnený v slovenčine.`);
  }
  for (const { cesta, id } of o.obrazky) {
    if (id !== undefined && !k.subory.has(id)) ch.pridaj(cesta, `Súbor s id ${id} neexistuje alebo nie je obrázok.`);
  }
  const poradie = Array.isArray(v?.menu?.poradie) ? v.menu.poradie : [];
  if (poradie.length > 0) {
    const vPoradi = new Set(poradie.map((x) => x?.dokument).filter(Boolean));
    for (const id of k.kategorie) {
      if (!vPoradi.has(id)) ch.pridaj('menu.poradie', `Kategória s documentId ${id} chýba v poradí menu (každá kategória musí byť v poradí práve raz).`);
    }
  }
  return ch.zoznam;
}
