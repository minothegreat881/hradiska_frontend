/**
 * PREVZATIE HODNÔT Z DATABÁZY pri načítaní konceptu („rebase", plán 7.4).
 *
 * Koncept nesie `zakladDb` — hodnoty v DB (poradie a názvy kategórií, výber
 * galérie), z ktorých vychádzal. Keď ich medzitým niekto zmenil inde
 * (obrazovka Kategórie), editor:
 *   • pri poli, ktoré koncept NEMENÍ (koncept = základ), potichu prevezme
 *     hodnotu z DB — koncept aj základ,
 *   • pri poli, ktoré koncept mení, nechá koncept aj základ tak — konflikt
 *     ukáže až zverejnenie (server, trojcestné zlúčenie) a ponúkne prevzatie.
 * Navyše sa z menu vyhodia zmazané kategórie a nové sa doplnia na koniec
 * (inak by server koncept odmietol: `menu.poradie` musí mať každú kategóriu).
 */

import type { Vzhlad, ZakladDb } from '../../../lib/vzhlad/typy';
import { kopia, type KategoriaVDb } from './operacie';

const nfc = (s: string | null | undefined) => (typeof s === 'string' ? s.normalize('NFC') : s);
const rovnakePole = (a: number[] | null | undefined, b: number[] | null | undefined) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

/** Poradie documentId podľa hodnôt `order` (pri zhode podľa poradia v `zaloha`). */
function zoradPodla(poradie: Record<string, number>, ids: string[]): string[] {
  return ids
    .map((id, i) => ({ id, i, o: poradie[id] ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.o - b.o || a.i - b.i)
    .map((x) => x.id);
}

export interface VysledokRebase {
  koncept: Vzhlad;
  zakladDb: ZakladDb;
  /** Čo sa prevzalo (na tichú poznámku v editore). */
  prevzate: string[];
}

export function prevezmiZDb(koncept: Vzhlad, zaklad: ZakladDb | null, db: ZakladDb, kategorieDb: KategoriaVDb[]): VysledokRebase {
  const k = kopia(koncept);
  /* Koncept bez základu: základom je DB teraz — čo sa od nej líši, je zámerná zmena konceptu. */
  const z: ZakladDb = zaklad ? kopia(zaklad) : kopia(db);
  const prevzate: string[] = [];
  const vDb = new Set(Object.keys(db.poradie));

  /* 1. Názvy kategórií. */
  for (const zaz of k.kategorie) {
    const id = zaz.kategoria.dokument;
    if (!id || !vDb.has(id)) continue;
    const teraz = db.nazvy[id];
    const zak = z.nazvy[id];
    if (!zaz.nazov) { z.nazvy[id] = teraz; continue; }
    const konceptMeni = zak === undefined ? nfc(zaz.nazov.sk) !== nfc(teraz) : nfc(zaz.nazov.sk) !== nfc(zak);
    if (!konceptMeni) {
      if (nfc(teraz) !== nfc(zaz.nazov.sk) && teraz) {
        zaz.nazov = { ...zaz.nazov, sk: teraz };
        prevzate.push(`názov kategórie „${teraz}“`);
      }
      z.nazvy[id] = teraz;
    }
  }
  for (const id of vDb) if (z.nazvy[id] === undefined) z.nazvy[id] = db.nazvy[id];

  /* 2. Poradie menu. */
  if (k.menu.poradie.length) {
    const slugy = new Map(kategorieDb.map((c) => [c.documentId, c.slug]));
    // zmazané kategórie preč zo všetkých zoznamov menu
    const zmazane = k.menu.poradie.filter((o) => o.dokument && !vDb.has(o.dokument));
    if (zmazane.length) {
      const preč = (zoznam: typeof k.menu.poradie) => zoznam.filter((o) => !o.dokument || vDb.has(o.dokument));
      k.menu.poradie = preč(k.menu.poradie);
      k.menu.hlavnyRiadok = preč(k.menu.hlavnyRiadok);
      k.menu.skryte = preč(k.menu.skryte);
      prevzate.push(`z menu vypadli zmazané kategórie (${zmazane.map((o) => o.slug).join(', ')})`);
    }
    const ids = k.menu.poradie.map((o) => o.dokument).filter((x): x is string => !!x);
    const zakladne = zoradPodla(z.poradie, ids);
    const dbPoradie = zoradPodla(db.poradie, ids);
    const konceptMeni = ids.join() !== zakladne.join();
    if (!konceptMeni && dbPoradie.join() !== ids.join()) {
      k.menu.poradie = dbPoradie.map((id) => ({ dokument: id, slug: slugy.get(id) ?? k.menu.poradie.find((o) => o.dokument === id)!.slug }));
      prevzate.push('poradie kategórií v menu');
    }
    // nové kategórie (sú v DB, v poradí konceptu nie)
    const uz = new Set(k.menu.poradie.map((o) => o.dokument));
    const nove = zoradPodla(db.poradie, [...vDb].filter((id) => !uz.has(id)));
    if (nove.length) {
      for (const id of nove) k.menu.poradie.push({ dokument: id, slug: slugy.get(id) ?? id });
      prevzate.push('nové kategórie na koniec menu');
    }
    if (!konceptMeni) z.poradie = { ...db.poradie };
    else for (const id of vDb) if (z.poradie[id] === undefined) z.poradie[id] = db.poradie[id];
  } else {
    z.poradie = { ...db.poradie };
  }
  for (const id of Object.keys(z.poradie)) if (!vDb.has(id)) delete z.poradie[id];
  for (const id of Object.keys(z.nazvy)) if (!vDb.has(id)) delete z.nazvy[id];

  /* 3. Vybraná fotogaléria. */
  const fg = k.domov.fotogaleria;
  if (!fg) z.fotogaleria = [...db.fotogaleria];
  else if (rovnakePole(fg.fotky, z.fotogaleria)) {
    if (!rovnakePole(fg.fotky, db.fotogaleria)) {
      fg.fotky = [...db.fotogaleria];
      prevzate.push('výber vybranej fotogalérie');
    }
    z.fotogaleria = [...db.fotogaleria];
  }

  return { koncept: k, zakladDb: z, prevzate };
}

/**
 * „Prevziať hodnoty z DB" po konflikte pri zverejnení: koncept zahodí svoje
 * zmeny tých polí, ktoré sa medzitým zmenili v databáze.
 */
export function prevezmiKonflikty(
  koncept: Vzhlad, zaklad: ZakladDb | null, db: ZakladDb, kategorieDb: KategoriaVDb[],
  druhy: Set<'poradie' | 'nazov' | 'fotogaleria'>, kategorie: Set<string>,
): { koncept: Vzhlad; zakladDb: ZakladDb } {
  const k = kopia(koncept);
  const z: ZakladDb = zaklad ? kopia(zaklad) : kopia(db);
  if (druhy.has('nazov')) {
    for (const zaz of k.kategorie) {
      const id = zaz.kategoria.dokument;
      if (id && kategorie.has(id) && zaz.nazov && db.nazvy[id]) zaz.nazov = { ...zaz.nazov, sk: db.nazvy[id] };
      if (id && kategorie.has(id)) z.nazvy[id] = db.nazvy[id];
    }
  }
  if (druhy.has('poradie') && k.menu.poradie.length) {
    const slugy = new Map(kategorieDb.map((c) => [c.documentId, c.slug]));
    const ids = k.menu.poradie.map((o) => o.dokument).filter((x): x is string => !!x);
    k.menu.poradie = zoradPodla(db.poradie, ids).map((id) => ({ dokument: id, slug: slugy.get(id) ?? id }));
    z.poradie = { ...db.poradie };
  }
  if (druhy.has('fotogaleria') && k.domov.fotogaleria) {
    k.domov.fotogaleria.fotky = [...db.fotogaleria];
    z.fotogaleria = [...db.fotogaleria];
  }
  return { koncept: k, zakladDb: z };
}

/** „Ponechať moje": základ = DB teraz, takže zverejnenie zapíše koncept (zámerne prepíše DB). */
export function ponechajMoje(zaklad: ZakladDb | null, db: ZakladDb, druhy: Set<'poradie' | 'nazov' | 'fotogaleria'>, kategorie: Set<string>): ZakladDb {
  const z: ZakladDb = zaklad ? kopia(zaklad) : kopia(db);
  if (druhy.has('poradie')) z.poradie = { ...db.poradie };
  if (druhy.has('nazov')) for (const id of kategorie) z.nazvy[id] = db.nazvy[id];
  if (druhy.has('fotogaleria')) z.fotogaleria = [...db.fotogaleria];
  return z;
}
