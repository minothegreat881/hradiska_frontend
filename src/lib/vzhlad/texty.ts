/**
 * TEXTY VZHĽADU v jazyku stránky.
 *
 * Poradie (plán, časť 4.4):
 *   1. výslovný preklad vo vzhľade (`en`, `de`),
 *   2. preklad zo slovníka webu pod slovenským kľúčom — presne ako `t(sk)` dnes,
 *   3. slovenčina.
 *
 * Základný vzhľad má len `sk`, takže s ním vracia `textVzhladu` to isté, čo
 * vracalo `t()` v komponentoch. Prevod dnešného stavu vypĺňa `en`/`de` tým,
 * čo by dnes vrátil slovník — výsledok je opäť ten istý.
 */

import { jazyk as jazykStranky, prekladZoSlovnika } from '../jazyk';
import type { Jazyk, Text, TextVolitelny } from './typy';

const neprazdny = (x: unknown): x is string => typeof x === 'string' && x !== '';

/** Text vzhľadu v danom jazyku (predvolene v jazyku stránky). Nikdy nevyhodí výnimku. */
export function textVzhladu(text: Text | TextVolitelny | null | undefined, j: Jazyk = jazykStranky()): string {
  if (!text || typeof text !== 'object') return '';
  const sk = typeof text.sk === 'string' ? text.sk : '';
  if (j === 'sk') return sk;
  const vyslovny = (text as Record<string, unknown>)[j];
  if (neprazdny(vyslovny)) return vyslovny;
  if (!sk) return '';
  return prekladZoSlovnika(sk, j) ?? sk;
}

/**
 * Len výslovné znenie pre daný jazyk, bez slovníka a bez slovenčiny.
 * Krátke názvy v menu: doslovný preklad slovenskej skratky („Všeobecne" →
 * „Allgemein") nedáva zmysel, preto sa pri chýbajúcom znení berie celý názov.
 */
export function lenVyslovny(text: TextVolitelny | Text | null | undefined, j: Jazyk = jazykStranky()): string | null {
  if (!text || typeof text !== 'object') return null;
  const v = (text as Record<string, unknown>)[j];
  return neprazdny(v) ? v : null;
}

/**
 * Tvar počtu pod dlaždicou. Slovenčina počíta v troch tvaroch (1 / 2–4 / 5+),
 * angličtina a nemčina v jednom — výslovný alebo slovník nad tretím tvarom.
 */
export function tvarPoctuVzhladu(
  tvary: { sk: [string, string, string]; en?: string | null; de?: string | null },
  n: number,
  j: Jazyk = jazykStranky(),
): string {
  const [jedno, malo, vela] = tvary.sk;
  if (j === 'sk') {
    if (n === 1) return jedno;
    if (n >= 2 && n <= 4) return malo;
    return vela;
  }
  const v = tvary[j];
  if (neprazdny(v)) return v;
  return prekladZoSlovnika(vela, j) ?? vela;
}
