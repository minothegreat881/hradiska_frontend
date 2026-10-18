/**
 * Drobné operácie nad vzhľadom pre editor (plátno aj klasickú úpravu).
 *
 * Editor mení vzhľad cez `zmen(popis, (v) => { … })` — dostane hlbokú kópiu
 * a smie ju meniť priamo; výsledok ide do histórie (Ctrl+Z). Tieto funkcie
 * sú preto zámerne MUTUJÚCE nad odovzdanou kópiou.
 */

import { prekladZoSlovnika } from '../../../lib/jazyk';
import { ZAKLADNY_VZHLAD } from '../../../lib/vzhlad/zakladny';
import { zaznamNovejKategorie } from '../../../lib/vzhlad/prevod';
import { VZOR_ID } from '../../../lib/vzhlad/typy';
import type {
  Vzhlad, Text, TextVolitelny, OdkazKategorie, OdkazClanku, VzhladKategorie, Jazyk, SekciaDomov,
  Rozriesene,
} from '../../../lib/vzhlad/typy';

/** Kľúč odkazu: documentId, inak slug. */
export const klucOdkazu = (o: { dokument: string | null; slug: string } | null | undefined): string =>
  (o ? o.dokument || `slug:${o.slug}` : '');

export const rovnakyOdkaz = (a: OdkazKategorie | OdkazClanku | null | undefined, b: OdkazKategorie | OdkazClanku | null | undefined) =>
  !!a && !!b && klucOdkazu(a) === klucOdkazu(b);

export const kopia = <T,>(x: T): T => (x == null ? x : (structuredClone(x) as T));

/** Presun v poli na mieste (index `na` je poloha PO vybratí prvku). */
export function presunVPoli<T>(pole: T[], z: number, na: number): void {
  if (z < 0 || z >= pole.length) return;
  const [p] = pole.splice(z, 1);
  pole.splice(Math.max(0, Math.min(pole.length, na)), 0, p);
}

/** Nové id podľa `VZOR_ID`, ktoré v zozname ešte nie je. */
export function noveId(zaklad: string, existujuce: Iterable<string>): string {
  const uz = new Set(existujuce);
  const holy = (zaklad || 'polozka').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'polozka';
  if (!uz.has(holy) && VZOR_ID.test(holy)) return holy;
  for (let i = 2; i < 1000; i++) {
    const k = `${holy}-${i}`;
    if (!uz.has(k)) return k;
  }
  return `${holy}-${Date.now().toString(36)}`.slice(0, 40);
}

/** Všetky id dlaždíc (sú jedinečné naprieč skupinami). */
export const idDlazdic = (v: Vzhlad): string[] => v.domov.dlazdice.skupiny.flatMap((s) => s.polozky.map((p) => p.id));

/* ───────────────────────── Texty ───────────────────────── */

/**
 * Nové znenie textu v jazyku. Slovenčina mení `sk` (preklady ostanú a editor
 * ich označí ako „k staršiemu zneniu"); angličtina a nemčina zapíšu výslovný
 * preklad a `enZo`/`deZo` = slovenské znenie, ku ktorému patrí.
 */
export function noveZnenie(t: Text | TextVolitelny | null | undefined, j: Jazyk, hodnota: string): Text {
  const z: Text = { sk: t?.sk ?? '', en: t?.en ?? null, de: t?.de ?? null, enZo: t?.enZo ?? null, deZo: t?.deZo ?? null };
  if (j === 'sk') { z.sk = hodnota; return z; }
  const prazdne = hodnota.trim() === '';
  if (j === 'en') { z.en = prazdne ? null : hodnota; z.enZo = prazdne ? null : z.sk; }
  else { z.de = prazdne ? null : hodnota; z.deZo = prazdne ? null : z.sk; }
  return z;
}

/** Ten istý zápis pre voliteľný text (krátky názov v menu) — prázdna slovenčina je povolená. */
export function noveZnenieVolitelne(t: TextVolitelny | null | undefined, j: Jazyk, hodnota: string): TextVolitelny | null {
  const z: TextVolitelny = { sk: t?.sk ?? null, en: t?.en ?? null, de: t?.de ?? null, enZo: t?.enZo ?? null, deZo: t?.deZo ?? null };
  const h = hodnota.trim() === '' ? null : hodnota;
  if (j === 'sk') z.sk = h;
  else if (j === 'en') { z.en = h; z.enZo = h ? z.sk ?? null : null; }
  else { z.de = h; z.deZo = h ? z.sk ?? null : null; }
  return z.sk || z.en || z.de ? z : null;
}

/* ───────────────────────── Kategórie ───────────────────────── */

export interface KategoriaVDb {
  documentId: string;
  slug: string;
  name: string;
  order: number | null;
}

/** Slug kategórie podľa odkazu (aktuálny z DB, keď ho pozná). */
export function slugOdkazu(o: OdkazKategorie, r: Rozriesene): string {
  return (o.dokument && r.kategorie[o.dokument]?.slug) || o.slug;
}

/** Odkaz na kategóriu z databázy. */
export const odkazNaKategoriu = (k: KategoriaVDb): OdkazKategorie => ({ dokument: k.documentId, slug: k.slug });

/** Index záznamu kategórie vo vzhľade (podľa documentId, inak slugu), alebo -1. */
export function indexZaznamu(v: Vzhlad, o: OdkazKategorie, r: Rozriesene): number {
  const slug = slugOdkazu(o, r);
  return v.kategorie.findIndex((k) => (o.dokument && k.kategoria.dokument ? k.kategoria.dokument === o.dokument : slugOdkazu(k.kategoria, r) === slug));
}

/**
 * Záznam kategórie vo vzhľade — keď chýba, založí ho: zo základného vzhľadu
 * (kategórie z kódu, aby sa nič nezmenilo), inak z databázy (popisok = názov).
 */
export function zaznamKategorie(v: Vzhlad, o: OdkazKategorie, r: Rozriesene, db: KategoriaVDb[]): VzhladKategorie {
  const i = indexZaznamu(v, o, r);
  if (i >= 0) return v.kategorie[i];
  const slug = slugOdkazu(o, r);
  const zKodu = ZAKLADNY_VZHLAD.kategorie.find((k) => k.kategoria.slug === slug);
  const zDb = db.find((k) => (o.dokument ? k.documentId === o.dokument : k.slug === slug));
  let novy: VzhladKategorie;
  if (zKodu) {
    novy = kopia(zKodu);
    novy.kategoria = { dokument: o.dokument ?? zDb?.documentId ?? null, slug };
  } else if (zDb) {
    novy = zaznamNovejKategorie(zDb, prekladZoSlovnika) as VzhladKategorie;
  } else {
    novy = {
      kategoria: { dokument: o.dokument, slug }, nazov: null, titulok: null, popisokDlazdice: { sk: slug },
      popisokMenu: null, popis: null, obrazok: null, tvary: null, clanky: { zoradenie: 'zverejnenie', pripnute: [] },
    };
  }
  v.kategorie.push(novy);
  return novy;
}

/* ───────────────────────── Sekcie ───────────────────────── */

export function najdiSekciu<T extends SekciaDomov['typ']>(v: Vzhlad, id: string): Extract<SekciaDomov, { typ: T }> | undefined {
  return v.domov.sekcie.find((s) => s.id === id) as Extract<SekciaDomov, { typ: T }> | undefined;
}

export const NAZVY_SEKCII: Record<SekciaDomov['typ'], string> = {
  mapa: 'Mapa',
  'dalsi-obsah': 'Ďalší obsah',
  cinnost: 'Činnosť združenia',
  kronika: 'Zo života združenia',
};

/** Doplní slovenský slug všetkým odkazom na článok `dokument`, ktoré ho nemajú (článok vybraný z plátna). */
export function doplnSlugClanku(v: Vzhlad, dokument: string, slug: string): void {
  (function prejdi(x: unknown) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(prejdi); return; }
    const o = x as Record<string, unknown>;
    if (o.dokument === dokument && 'slug' in o && !o.slug) o.slug = slug;
    for (const h of Object.values(o)) prejdi(h);
  })(v);
}

/* ───────────────────────── Neplatné odkazy ───────────────────────── */

/**
 * Odstráni zo vzhľadu odkazy na to, čo už neexistuje: zmazané kategórie
 * (dlaždice, riadky, menu, päta, záznamy), články (populárne, pripnuté,
 * ručné výbery, úvodný článok kroniky) a súbory (galéria; obrázok, ktorý
 * chýba, sa vráti na obrázok z kódu alebo na „bez obrázka").
 */
export function vycistiNeplatne(v: Vzhlad, k: { kategorie: Set<string>; clanky: Set<string>; subory: Set<number> }): void {
  const katOk = (o: OdkazKategorie | null | undefined) => !o?.dokument || k.kategorie.has(o.dokument);
  const clOk = (o: OdkazClanku | null | undefined) => !o?.dokument || k.clanky.has(o.dokument);
  const obrOk = (o: { id?: number } | { cesta: string } | null | undefined) => !o || !('id' in o) || o.id === undefined || k.subory.has(o.id);

  for (const s of v.domov.dlazdice.skupiny) s.polozky = s.polozky.filter((p) => katOk(p.kategoria));
  v.domov.hladanie.popularne = v.domov.hladanie.popularne.filter((p) => clOk(p.clanok));
  if (!obrOk(v.domov.uvod.znak as never)) v.domov.uvod.znak = null;
  for (const s of v.domov.sekcie) {
    if (s.typ === 'dalsi-obsah') {
      s.riadky = s.riadky.filter((r) => katOk(r.kategoria));
      for (const r of s.riadky) {
        r.clanky = r.clanky.filter(clOk);
        r.obrazky = r.obrazky.filter((o) => clOk(o.clanok) && obrOk(o.obrazok as never));
      }
    }
    if (s.typ === 'kronika') {
      if (!clOk(s.uvodnyClanok)) s.uvodnyClanok = null;
      s.pripnute = s.pripnute.filter(clOk);
      if (!obrOk(s.obrazok as never)) {
        const zaloha = ZAKLADNY_VZHLAD.domov.sekcie.find((x) => x.typ === 'kronika') as Extract<SekciaDomov, { typ: 'kronika' }> | undefined;
        s.obrazok = zaloha?.obrazok ?? null;
      }
    }
  }
  if (v.domov.fotogaleria) v.domov.fotogaleria.fotky = v.domov.fotogaleria.fotky.filter((id) => k.subory.has(id));
  v.kategorie = v.kategorie.filter((z) => katOk(z.kategoria));
  for (const z of v.kategorie) {
    z.clanky.pripnute = z.clanky.pripnute.filter(clOk);
    if (!obrOk(z.obrazok as never)) z.obrazok = ZAKLADNY_VZHLAD.kategorie.find((x) => x.kategoria.slug === z.kategoria.slug)?.obrazok ?? null;
  }
  for (const p of v.cinnost.polozky) {
    if (!obrOk(p.obrazok as never)) p.obrazok = ZAKLADNY_VZHLAD.cinnost.polozky.find((x) => x.kluc === p.kluc)!.obrazok;
  }
  v.menu.poradie = v.menu.poradie.filter(katOk);
  v.menu.hlavnyRiadok = v.menu.hlavnyRiadok.filter(katOk);
  v.menu.skryte = v.menu.skryte.filter(katOk);
  for (const s of v.pata.stlpce) {
    s.odkazy = s.odkazy.filter((o) => (o.ciel.druh === 'kategoria' ? katOk(o.ciel.kategoria) : o.ciel.druh === 'clanok' ? clOk(o.ciel.clanok) : true));
  }
}

/* ───────────────────────── Menu ───────────────────────── */

/**
 * Dva riadky menu tak, ako ich kreslí `LabNav` na plátne: poradie z konceptu
 * (`menu.poradie`), keď je, inak z databázy; hlavný riadok = `hlavnyRiadok`.
 */
export function radyMenu(v: Vzhlad, r: Rozriesene, db: KategoriaVDb[]): { hlavny: KategoriaVDb[]; dalsi: KategoriaVDb[] } {
  const slugPoradia = v.menu.poradie.map((o) => slugOdkazu(o, r));
  const miesto = (k: KategoriaVDb) => { const i = slugPoradia.indexOf(k.slug); return i < 0 ? slugPoradia.length : i; };
  const zoradene = slugPoradia.length ? [...db].sort((a, b) => miesto(a) - miesto(b)) : [...db];
  const hlavne = new Set(v.menu.hlavnyRiadok.map((o) => slugOdkazu(o, r)));
  return { hlavny: zoradene.filter((k) => hlavne.has(k.slug)), dalsi: zoradene.filter((k) => !hlavne.has(k.slug)) };
}

/** Zapíše nové riadky menu: poradie = hlavný riadok + druhý riadok, hlavný riadok = prvý. */
export function nastavRadyMenu(v: Vzhlad, hlavny: KategoriaVDb[], dalsi: KategoriaVDb[]): void {
  v.menu.poradie = [...hlavny, ...dalsi].map(odkazNaKategoriu);
  v.menu.hlavnyRiadok = hlavny.map(odkazNaKategoriu);
  const vPoradi = new Set(v.menu.poradie.map((o) => o.dokument));
  v.menu.skryte = v.menu.skryte.filter((o) => !o.dokument || vPoradi.has(o.dokument));
}
