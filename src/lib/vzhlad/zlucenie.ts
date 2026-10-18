/**
 * VZHĽAD WEBU — čo zverejnenie zapíše do existujúcich typov (plán, časť 4.5) a trojcestné zlúčenie.
 *
 * Staré verzie webu a appky nepoznajú vzhľad; čítajú `blog-category.order`, `blog-category.name`
 * a `domovska-galeria.fotky`. Zverejnenie im preto tieto tri veci zapíše. Medzičasom ich ale mohol
 * niekto zmeniť inde (obrazovka Kategórie, panel Strapi), a koncept by to ticho prepísal.
 *
 * Preto trojcestne, pre každé pole zvlášť:
 *  - `zaklad` = hodnota v DB, keď z nej koncept vychádzal (`zakladDb`, editor ju posiela s konceptom),
 *  - `koncept` = čo chce koncept,
 *  - `db`      = čo je v DB teraz.
 *
 *   koncept = zaklad            → koncept pole nemení, nezapisuje sa nič (ani keď sa DB medzitým zmenila)
 *   db = koncept                → v DB už je cieľová hodnota, netreba zapisovať (obaja urobili to isté)
 *   db = zaklad                 → zapíše sa koncept
 *   inak                        → KONFLIKT: zverejnenie sa zastaví a nezapíše nič
 *
 * Čistý modul bez importov okrem `./typy` (dá sa použiť aj v editore na ukážku „čo sa zapíše“).
 */

import type { Vzhlad, ZakladDb } from './typy';

export type ZapisDoDb =
  | { druh: 'poradie'; kategoria: string; z: number | null; na: number }
  | { druh: 'nazov'; kategoria: string; z: string | null; na: string }
  | { druh: 'fotogaleria'; z: number[]; na: number[] };

export interface KonfliktDb {
  /** Pole vo vzhľade, ktorého sa konflikt týka. */
  cesta: string;
  druh: 'poradie' | 'nazov' | 'fotogaleria';
  /** documentId kategórie (pri poradí a názve). */
  kategoria?: string;
  zaklad: unknown;
  koncept: unknown;
  db: unknown;
  sprava: string;
}

/** Krok poradia v `blog-category.order` (10, 20, 30 …), aby sa dalo neskôr vložiť medzi. */
export const KROK_PORADIA = 10;

/** Názvy sa porovnávajú v tvare NFC: rovnaký názov v inom zápise diakritiky nie je zmena. */
const rovnakyNazov = (a: string | null | undefined, b: string | null | undefined) =>
  typeof a === 'string' && typeof b === 'string' ? a.normalize('NFC') === b.normalize('NFC') : a === b;

const rovnakePole = (a: number[] | null | undefined, b: number[] | null | undefined) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Zostaví zoznam zápisov a konfliktov. Nič nezapisuje.
 * `zaklad` môže byť null (koncept bez základu) — potom je zmenou všetko, čo sa líši od DB, a konfliktom tiež.
 */
export function naplanujZapisy(
  koncept: Vzhlad,
  zaklad: ZakladDb | null,
  db: ZakladDb,
): { zapisy: ZapisDoDb[]; konflikty: KonfliktDb[] } {
  const zapisy: ZapisDoDb[] = [];
  const konflikty: KonfliktDb[] = [];

  // 1. Poradie kategórií — len keď koncept poradie vôbec určuje.
  const poradie = koncept.menu?.poradie ?? [];
  poradie.forEach((odkaz, i) => {
    const id = odkaz?.dokument;
    if (!id) return; // kontrola odkazov takýto koncept nepustí; tu sa len nič nezapíše
    const chce = (i + 1) * KROK_PORADIA;
    const zak = zaklad?.poradie?.[id];
    const teraz = db.poradie[id];
    if (zak === chce) return;
    if (teraz === chce) return;
    if (zak !== undefined && teraz === zak) {
      zapisy.push({ druh: 'poradie', kategoria: id, z: teraz ?? null, na: chce });
      return;
    }
    konflikty.push({
      cesta: `menu.poradie[${i}]`,
      druh: 'poradie',
      kategoria: id,
      zaklad: zak ?? null,
      koncept: chce,
      db: teraz ?? null,
      sprava: `Poradie kategórie „${odkaz.slug}“ sa v databáze medzitým zmenilo (bolo ${zak ?? '—'}, teraz ${teraz ?? '—'}).`,
    });
  });

  // 2. Slovenský názov kategórie — len pri kategóriách, kde koncept názov určuje (nazov ≠ null).
  (koncept.kategorie ?? []).forEach((k, i) => {
    const id = k?.kategoria?.dokument;
    if (!id || !k.nazov) return;
    const chce = k.nazov.sk;
    const zak = zaklad?.nazvy?.[id];
    const teraz = db.nazvy[id];
    if (rovnakyNazov(zak, chce)) return;
    if (rovnakyNazov(teraz, chce)) return;
    if (zak !== undefined && rovnakyNazov(teraz, zak)) {
      zapisy.push({ druh: 'nazov', kategoria: id, z: teraz ?? null, na: chce });
      return;
    }
    konflikty.push({
      cesta: `kategorie[${i}].nazov.sk`,
      druh: 'nazov',
      kategoria: id,
      zaklad: zak ?? null,
      koncept: chce,
      db: teraz ?? null,
      sprava: `Názov kategórie „${k.kategoria.slug}“ sa v databáze medzitým zmenil (bol „${zak ?? '—'}“, teraz „${teraz ?? '—'}“).`,
    });
  });

  // 3. Vybraná fotogaléria — len keď ju koncept určuje (fotogaleria ≠ null).
  const fotky = koncept.domov?.fotogaleria?.fotky;
  if (Array.isArray(fotky)) {
    const zak = zaklad?.fotogaleria;
    const teraz = db.fotogaleria;
    if (!rovnakePole(zak, fotky) && !rovnakePole(teraz, fotky)) {
      if (Array.isArray(zak) && rovnakePole(teraz, zak)) {
        zapisy.push({ druh: 'fotogaleria', z: teraz, na: [...fotky] });
      } else {
        konflikty.push({
          cesta: 'domov.fotogaleria.fotky',
          druh: 'fotogaleria',
          zaklad: zak ?? null,
          koncept: fotky,
          db: teraz,
          sprava: 'Výber fotiek domovskej galérie sa v databáze medzitým zmenil.',
        });
      }
    }
  }

  return { zapisy, konflikty };
}
