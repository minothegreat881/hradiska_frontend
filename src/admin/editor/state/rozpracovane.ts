'use client';

/**
 * Jeden príznak: „v editore je niečo rozpísané a neuložené".
 *
 * Administrácia nemá router — prepína obrazovky stavom. Klik na položku
 * v ľavej ponuke preto editor jednoducho odmontuje a nič sa nespýta.
 * Redaktor tak odišiel z rozpísaného článku bez varovania a myslel si, že
 * o prácu prišiel (bola odložená v prehliadači, len sa o tom nedozvedel).
 *
 * Editor sem svoj stav zapisuje, ponuka sa naň pýta pred prepnutím. Je to
 * zámerne obyčajná premenná v module, nie kontext — vie sa na ňu spýtať aj
 * kód, ktorý nie je React komponent.
 */

let neulozene = false;
let odlozOkamzite: (() => void) | null = null;

export function nastavNeulozene(hodnota: boolean) {
  neulozene = hodnota;
}

/** Editor sem dá funkciu, ktorá okamžite odloží rozpísanú prácu. */
export function nastavOdkladac(fn: (() => void) | null) {
  odlozOkamzite = fn;
}

export function maNeulozeneZmeny(): boolean {
  return neulozene;
}

/** Odlož, čo je rozpísané (ak je čo) — volá sa pred odchodom z editora. */
export function odlozTeraz() {
  try { odlozOkamzite?.(); } catch { /* odloženie nesmie zhodiť odchod */ }
}
