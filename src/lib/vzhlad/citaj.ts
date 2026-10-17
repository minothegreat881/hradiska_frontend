/**
 * ČÍTANIE VZHĽADU pri vykresľovaní — spoločné pre všetky komponenty.
 *
 * Tu sa zjednocuje to, čo sa líši medzi základným vzhľadom a vzhľadom z API:
 *   • kategória je pre web vždy `slug` — zo základného priamo, z API cez
 *     `documentId` → aktuálny slug v `rozriesene.kategorie`; kategória, ktorá
 *     tam nie je (zmazaná), sa ticho vynechá,
 *   • článok je slug v jazyku stránky — z API cez `rozriesene.clanky`; článok,
 *     ktorý v jazyku stránky nie je, sa vynechá; v základnom vzhľade je len
 *     slovenský slug a preklad adresy si komponent dohľadá ako doteraz,
 *   • záznam kategórie (obrázok, popisok, popis) sa berie z vzhľadu, keď tam
 *     nie je, zo základného vzhľadu (kód) — poradie zdrojov vzhľad → kód → DB.
 *
 * Plán, tabuľka 6.4. Funkcie nevyhadzujú výnimky.
 */

import { jazyk as jazykStranky, kategoria as prelozKategoriu, odkaz } from '../jazyk';
import { ZAKLADNY_VZHLAD } from './zakladny';
import { textVzhladu } from './texty';
import { adresaObrazka } from './obrazky';
import type {
  Vzhlad, Rozriesene, OdkazKategorie, OdkazClanku, VzhladKategorie, Obrazok, Text, Ciel, Jazyk,
  SekciaDomov, PolozkaCinnosti,
} from './typy';

/* ───────────────────────── Kategórie ───────────────────────── */

/** Aktuálny slug kategórie, alebo `null`, keď kategória už neexistuje. */
export function slugKategorie(k: OdkazKategorie | null | undefined, r: Rozriesene): string | null {
  if (!k) return null;
  if (k.dokument) return r.kategorie?.[k.dokument]?.slug ?? null;
  return k.slug || null;
}

/** Index záznamov kategórií podľa slugu — počíta sa raz na vzhľad. */
const indexy = new WeakMap<Vzhlad, WeakMap<Rozriesene, Map<string, VzhladKategorie>>>();
function index(v: Vzhlad, r: Rozriesene): Map<string, VzhladKategorie> {
  let podR = indexy.get(v);
  if (!podR) { podR = new WeakMap(); indexy.set(v, podR); }
  let m = podR.get(r);
  if (!m) {
    m = new Map();
    for (const k of v.kategorie) {
      const s = slugKategorie(k.kategoria, r);
      if (s && !m.has(s)) m.set(s, k);
    }
    podR.set(r, m);
  }
  return m;
}

const PRAZDNE: Rozriesene = { subory: {}, kategorie: {}, clanky: {} };

/** Záznam kategórie zo základného vzhľadu (z kódu). */
export function zakladnaKategoria(slug: string): VzhladKategorie | undefined {
  return index(ZAKLADNY_VZHLAD, PRAZDNE).get(slug);
}

/** Záznam kategórie: vzhľad → základný vzhľad. */
export function vzhladKategorie(v: Vzhlad, r: Rozriesene, slug: string): VzhladKategorie | undefined {
  return index(v, r).get(slug) ?? zakladnaKategoria(slug);
}

/**
 * Obrázok kategórie, ktorý sa dá nakresliť. Keď súbor z vzhľadu chýba
 * (zmazaný z médií), nastúpi obrázok zo základného vzhľadu — kresba kategórie.
 * `null` vo vzhľade znamená „bez obrázka" a platí.
 */
export function obrazokKategorie(v: Vzhlad, r: Rozriesene, slug: string): Obrazok | null {
  const vk = index(v, r).get(slug);
  if (vk) {
    if (vk.obrazok === null) return null;
    if (adresaObrazka(vk.obrazok, 'original', r)) return vk.obrazok;
  }
  return zakladnaKategoria(slug)?.obrazok ?? null;
}

/** Záložný obrázok kategórie pre prípad, že sa obrázok z vzhľadu nenačíta. */
export function zalohaObrazkaKategorie(slug: string): Obrazok | null {
  return zakladnaKategoria(slug)?.obrazok ?? null;
}

/**
 * Celý názov kategórie v jazyku stránky: vzhľad (`nazov`) → databáza
 * (preložená slovníkom, ako dnes) → názov z kódu (`titulok`) → slug.
 */
export function nazovKategorie(v: Vzhlad, r: Rozriesene, slug: string, nazovZDb?: string | null): string {
  const vk = index(v, r).get(slug);
  if (vk?.nazov?.sk) return textVzhladu(vk.nazov);
  if (nazovZDb) return prelozKategoriu(nazovZDb);
  const zaloha = vk ?? zakladnaKategoria(slug);
  if (zaloha?.titulok?.sk) return textVzhladu(zaloha.titulok);
  return prelozKategoriu(slug);
}

/** Bublina dlaždice: `titulok` → `nazov` → názov z databázy. */
export function titulokKategorie(vk: VzhladKategorie | undefined, r: Rozriesene, slug: string): string {
  if (vk?.titulok?.sk) return textVzhladu(vk.titulok);
  if (vk?.nazov?.sk) return textVzhladu(vk.nazov);
  const dok = vk?.kategoria.dokument;
  const db = dok ? r.kategorie?.[dok]?.nazov : null;
  return prelozKategoriu(db || slug);
}

/* ───────────────────────── Dlaždice ───────────────────────── */

export interface DlazdicaNaWebe {
  id: string;
  slug: string;
  vk: VzhladKategorie | undefined;
  pocet: boolean;
  /** Poradie naprieč skupinami (oneskorenie nábehu v CSS). */
  poradie: number;
}

export interface SkupinaNaWebe {
  id: string;
  nadpis: Text | null;
  polozky: DlazdicaNaWebe[];
}

/** Skupiny dlaždíc bez zmazaných kategórií; prázdna skupina sa vynechá aj s nadpisom. */
export function skupinyDlazdic(v: Vzhlad, r: Rozriesene): SkupinaNaWebe[] {
  const von: SkupinaNaWebe[] = [];
  let poradie = 0;
  for (const s of v.domov.dlazdice.skupiny) {
    const polozky: DlazdicaNaWebe[] = [];
    for (const d of s.polozky) {
      const slug = slugKategorie(d.kategoria, r);
      if (!slug) continue;
      polozky.push({ id: d.id, slug, vk: vzhladKategorie(v, r, slug), pocet: d.pocet, poradie: poradie++ });
    }
    if (polozky.length) von.push({ id: s.id, nadpis: s.nadpis, polozky });
  }
  return von;
}

/* ───────────────────────── Články ───────────────────────── */

export interface ClanokNaWebe {
  /** Slug v jazyku stránky; pri `prelozit` slovenský. */
  slug: string;
  dokument: string | null;
  /** Základný vzhľad pozná len slovenský slug — adresu v jazyku stránky treba dohľadať. */
  prelozit: boolean;
}

/** Článok v jazyku stránky, alebo `null`, keď v ňom nie je (zmazaný, nezverejnený). */
export function clanokVJazyku(c: OdkazClanku | null | undefined, r: Rozriesene, j: Jazyk = jazykStranky()): ClanokNaWebe | null {
  if (!c) return null;
  if (c.dokument) {
    const z = r.clanky?.[c.dokument]?.[j];
    return z?.slug ? { slug: z.slug, dokument: c.dokument, prelozit: false } : null;
  }
  return c.slug ? { slug: c.slug, dokument: null, prelozit: j !== 'sk' } : null;
}

/* ───────────────────────── Sekcie a činnosť ───────────────────────── */

export function sekcia<T extends SekciaDomov['typ']>(v: Vzhlad, typ: T): Extract<SekciaDomov, { typ: T }> | undefined {
  return v.domov.sekcie.find((s) => s.typ === typ) as Extract<SekciaDomov, { typ: T }> | undefined;
}

/** Položky činnosti v poradí vzhľadu. */
export function polozkyCinnosti(v: Vzhlad): PolozkaCinnosti[] {
  return v.cinnost.polozky;
}

/* ───────────────────────── Menu ───────────────────────── */

const mnozina = (zoznam: OdkazKategorie[], r: Rozriesene): Set<string> =>
  new Set(zoznam.map((k) => slugKategorie(k, r)).filter((s): s is string => !!s));

export const hlavnyRiadokMenu = (v: Vzhlad, r: Rozriesene): Set<string> => mnozina(v.menu.hlavnyRiadok, r);
export const skryteVMenu = (v: Vzhlad, r: Rozriesene): Set<string> => mnozina(v.menu.skryte, r);
export const poradieMenu = (v: Vzhlad, r: Rozriesene): string[] =>
  v.menu.poradie.map((k) => slugKategorie(k, r)).filter((s): s is string => !!s);

/* ───────────────────────── Odkazy ───────────────────────── */

/**
 * Cieľ odkazu → adresa. Cesty webu dostanú jazykovú predponu, vonkajšie
 * adresy ostávajú. `null` = cieľ už neexistuje (odkaz sa vynechá).
 */
export function adresaCiela(c: Ciel, r: Rozriesene, j: Jazyk = jazykStranky()): string | null {
  switch (c.druh) {
    case 'kategoria': {
      const s = slugKategorie(c.kategoria, r);
      return s ? odkaz(`/category/${s}`, j) : null;
    }
    case 'clanok': {
      const cl = clanokVJazyku(c.clanok, r, j);
      /* Slovenský slug v cudzom jazyku by viedol na „Article not found",
         slovenská verzia existuje vždy. */
      if (!cl) return null;
      return cl.prelozit ? odkaz(`/blog/${cl.slug}`, 'sk') : odkaz(`/blog/${cl.slug}`, j);
    }
    case 'cesta':
      return odkaz(c.cesta, j);
    case 'url':
      return c.url;
    default:
      return null;
  }
}
