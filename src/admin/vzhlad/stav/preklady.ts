/**
 * Stav prekladov textov vzhľadu (plán, časť 4.4).
 *
 *   chyba      — výslovný preklad nie je a slovník ho nepozná → web ukáže slovenčinu (žltá),
 *   zastarany  — preklad vznikol k inému slovenskému zneniu (`enZo` ≠ `sk`) → web ukazuje starý (žltá),
 *   slovnik    — text je dnes zo slovníka webu (výslovný preklad chýba alebo sa rovná slovníku),
 *                kým ho redaktor neprepíše (len označenie, nie výhrada),
 *   ok         — výslovný preklad k aktuálnemu zneniu.
 */

import { prekladZoSlovnika } from '../../../lib/jazyk';
import type { Text, TextVolitelny, Vzhlad } from '../../../lib/vzhlad/typy';

export type StavPrekladu = 'ok' | 'chyba' | 'zastarany' | 'slovnik';
export type CudziJazyk = 'en' | 'de';

export function stavPrekladu(t: Text | TextVolitelny | null | undefined, j: CudziJazyk, volitelny = false): StavPrekladu {
  if (!t || typeof t !== 'object' || !t.sk) return 'ok';
  const v = (t as Record<string, unknown>)[j];
  const zo = (t as Record<string, unknown>)[`${j}Zo`];
  const zoSlovnika = prekladZoSlovnika(t.sk, j);
  if (typeof v !== 'string' || v === '') return zoSlovnika ? 'slovnik' : volitelny ? 'ok' : 'chyba';
  if (typeof zo === 'string' && zo !== t.sk) return 'zastarany';
  if (zoSlovnika && v === zoSlovnika) return 'slovnik';
  return 'ok';
}

export const jeVyhrada = (s: StavPrekladu) => s === 'chyba' || s === 'zastarany';

export interface NajdenyText {
  cesta: string;
  text: Text | TextVolitelny;
  volitelny: boolean;
}

const KLUCE_TEXTU = new Set(['sk', 'en', 'de', 'enZo', 'deZo']);

/** Všetky texty vzhľadu (objekty s `sk` ako reťazcom a len jazykovými kľúčmi). */
export function vsetkyTexty(v: Vzhlad | null | undefined): NajdenyText[] {
  const von: NajdenyText[] = [];
  (function prejdi(x: unknown, cesta: string, kluc: string) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach((y, i) => prejdi(y, `${cesta}[${i}]`, kluc)); return; }
    const o = x as Record<string, unknown>;
    const kluce = Object.keys(o);
    if (kluce.length && kluce.every((k) => KLUCE_TEXTU.has(k)) && (typeof o.sk === 'string' || o.sk === null)) {
      von.push({ cesta, text: o as unknown as Text, volitelny: kluc === 'popisokMenu' });
      return;
    }
    for (const [k, h] of Object.entries(o)) prejdi(h, cesta ? `${cesta}.${k}` : k, k);
  })(v, '', '');
  return von;
}

/** Počet výhrad (chýbajúci alebo zastaraný preklad) v jazyku. */
export function pocetVyhrad(v: Vzhlad | null | undefined, j: CudziJazyk): number {
  return vsetkyTexty(v).filter((t) => jeVyhrada(stavPrekladu(t.text, j, t.volitelny))).length;
}

export const POPIS_STAVU: Record<StavPrekladu, string> = {
  ok: '',
  chyba: 'chýba preklad — web ukáže slovenčinu',
  zastarany: 'preklad je k staršiemu zneniu — skontrolujte ho',
  slovnik: 'zo slovníka',
};
