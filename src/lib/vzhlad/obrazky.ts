/**
 * OBRÁZKY VZHĽADU → adresy pre `<img>`.
 *
 * Obrázok vo vzhľade je jedno z troch:
 *   • `{ id }` — súbor z knižnice médií; server ho rozrieši v `subory`
 *     a zmenšenina sa berie z `formats[velkost]` (keď chýba, originál),
 *   • `{ cesta: '/uploads/…' }` — dnešná cesta v kóde (základný vzhľad);
 *     zmenšenina sa skladá predponou ako doteraz (`variant()`),
 *   • `{ cesta: '/znak_minca.webp', vlastny: true }` — súbor webu, berie sa,
 *     ako je.
 * Pri súboroch, ktoré Strapi zmenšil, dávajú obe prvé cesty tú istú adresu.
 *
 * Nikdy nevyhodí výnimku: čo nevie rozriešiť, vráti `null` a volajúci siahne
 * po obrázku zo základného vzhľadu.
 */

import { variant } from '../../data/categories';
import { zakladStrapi } from '../../data/rozcestnik';
import type { Obrazok, Rozriesene } from './typy';

export type Velkost = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

/** Adresy, ktoré smú ísť do `src` a do CSS `url("…")` — bez úvodzoviek a zátvoriek. */
const BEZPECNA_ADRESA = /^(https?:\/\/|\/)[^\s"'()<>\\]+$/;

const naAdresu = (u: string): string => (/^https?:\/\//.test(u) ? u : `${zakladStrapi()}${u}`);

/** Adresa obrázka v danej veľkosti, alebo `null`, keď ho nepoznáme. */
export function adresaObrazka(o: Obrazok | null | undefined, velkost: Velkost, r?: Rozriesene | null): string | null {
  try {
    if (!o || typeof o !== 'object') return null;
    if ('id' in o && typeof o.id === 'number') {
      const s = r?.subory?.[String(o.id)];
      if (!s || typeof s.url !== 'string') return null;
      const f = velkost === 'original' ? undefined : s.formats?.[velkost]?.url;
      const u = typeof f === 'string' && f ? f : s.url;
      return BEZPECNA_ADRESA.test(u) ? naAdresu(u) : null;
    }
    if ('cesta' in o && typeof o.cesta === 'string' && BEZPECNA_ADRESA.test(o.cesta)) {
      /* Súbor webu (`public/`) — žiadne zmenšeniny, žiadna adresa API. */
      if (!o.cesta.startsWith('/uploads/')) return o.cesta;
      return naAdresu(velkost === 'original' ? o.cesta : variant(o.cesta, velkost));
    }
  } catch {
    /* nečitateľný záznam = obrázok nepoznáme */
  }
  return null;
}

/** `srcset` z dvojíc (veľkosť, šírka v px). `null`, keď niektorá chýba. */
export function srcSetObrazka(o: Obrazok | null | undefined, dvojice: [Velkost, number][], r?: Rozriesene | null): string | null {
  const casti: string[] = [];
  for (const [v, w] of dvojice) {
    const u = adresaObrazka(o, v, r);
    if (!u) return null;
    casti.push(`${u} ${w}w`);
  }
  return casti.join(', ');
}

/** Výrez obrázka (`object-position`); `undefined`, keď nie je zadaný. */
export function poziciaObrazka(o: Obrazok | null | undefined): string | undefined {
  const p = o && typeof o === 'object' ? (o as { pozicia?: unknown }).pozicia : undefined;
  return typeof p === 'string' && /^[a-z0-9%.\s-]{1,40}$/i.test(p) ? p : undefined;
}

/** Je obrázok súbor z knižnice médií (môže chýbať alebo sa nenačítať)? */
export const jeSuborMedii = (o: Obrazok | null | undefined): boolean =>
  !!o && typeof o === 'object' && 'id' in o && typeof o.id === 'number';

/* Obrázky, ktorým už bola vymenená adresa za záložnú — druhý raz sa nemení
   (záloha sa tiež nemusí načítať a slučka by nemala koniec). WeakSet, nie
   atribút: DOM ostáva rovnaký. */
const vymenene = new WeakSet<HTMLImageElement>();

/**
 * Obsluha `onError` pre `<img>`: keď sa obrázok z knižnice médií nenačíta,
 * nastúpi záložný (obrázok zo základného vzhľadu). Bez zálohy `undefined`.
 */
export function priChybeVymen(zaloha: { src: string | null; srcSet?: string | null } | null) {
  if (!zaloha?.src) return undefined;
  const src = zaloha.src;
  return (e: { currentTarget: HTMLImageElement }) => {
    const img = e.currentTarget;
    if (vymenene.has(img)) return;
    vymenene.add(img);
    if (zaloha.srcSet) img.srcset = zaloha.srcSet;
    else img.removeAttribute('srcset');
    img.src = src;
  };
}
