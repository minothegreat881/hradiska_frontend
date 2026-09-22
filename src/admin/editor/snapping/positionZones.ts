/**
 * Pravidlá rozloženia obrázkových blokov — JEDNO miesto pre web aj editor.
 *
 * Tento modul importuje verejný renderer (`DynamicZoneRenderer`), preto nesmie
 * ťahať nič z adminu: žiadny React, žiadne API, len čisté funkcie a konštanty.
 */

export type ImagePosition = 'left' | 'right' | 'center' | 'full' | 'breakout';
export type ImageWidth = '30' | '40' | '50' | '60' | '100';

/** Minimálny tvar bloku, ktorý pravidlá potrebujú (tvar zo Strapi). */
export interface LayoutBlock {
  __component: string;
  position?: string | null;
  width?: string | null;
  pairWithNext?: boolean | null;
}

const IMAGE = 'content.image-block';

export function positionOf(b: LayoutBlock): ImagePosition {
  return (b.position as ImagePosition) || 'center';
}

export function isFloat(b: LayoutBlock): boolean {
  const p = positionOf(b);
  return p === 'left' || p === 'right';
}

/**
 * Vykreslí web obrázok `a` a nasledujúci blok `b` ako dvojicu vedľa seba?
 *
 * Áno, len ak platí všetko naraz:
 *   1. `a` je obrázok so zaškrtnutým „Spárovať s ďalším",
 *   2. `b` existuje a je tiež obrázok,
 *   3. ich pozície sú opačné: vľavo + vpravo alebo vpravo + vľavo.
 *
 * Inak sa `pairWithNext` ticho ignoruje a oba obrázky idú samostatne.
 */
export function canPair(a: LayoutBlock | null | undefined, b: LayoutBlock | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.__component !== IMAGE || b.__component !== IMAGE) return false;
  if (!a.pairWithNext) return false;
  const pa = positionOf(a), pb = positionOf(b);
  return (pa === 'left' && pb === 'right') || (pa === 'right' && pb === 'left');
}

/** Prečo `canPair` vrátil false — slovenská veta pre admina, null ak sa spárujú. */
export function whyNotPair(a: LayoutBlock | null | undefined, b: LayoutBlock | null | undefined): string | null {
  if (canPair(a, b)) return null;
  if (!b || b.__component !== IMAGE) return 'Hneď za týmto obrázkom musí nasledovať ďalší obrázok.';
  return 'Obrázky musia byť jeden vľavo a druhý vpravo.';
}

// ── Mobil ────────────────────────────────────────────────────────────────────
//
// Pravidlo webu (styles/globals.css, blok „BLOG MEDIA RESPONSIVE"):
// pod MOBILE_MAX_PX (vrátane) sa obrázky prestanú riadiť desktopovou pozíciou
// a šírkou:
//   • obtekané (left/right)        → blok, šírka 100 %, max. 400 px, vycentrovaný,
//                                    text už neobteká
//   • centrované so šírkou < 100 % → to isté: 100 %, max. 400 px
//   • centrované 100 %, full,
//     breakout                     → bez zmeny, celá šírka stĺpca
//   • spárovaná dvojica            → pod sebou namiesto vedľa seba
//
// Hodnoty tu MUSIA sedieť s CSS; editor podľa nich kreslí mobilný náhľad.

/** Najväčšia šírka okna, pri ktorej platí mobilné pravidlo (`max-width: 767px`). */
export const MOBILE_MAX_PX = 767;
/** Strop šírky obrázka na mobile. */
export const MOBILE_IMAGE_MAX_PX = 400;

/** Ako obrázok vyzerá na mobile. `stacked` = blok v toku textu, bez obtekania. */
export function mobileLayout(b: LayoutBlock): { stacked: boolean; maxWidthPx: number | null } {
  const p = positionOf(b);
  if (p === 'left' || p === 'right') return { stacked: true, maxWidthPx: MOBILE_IMAGE_MAX_PX };
  if (p === 'center' && (b.width || '50') !== '100') return { stacked: true, maxWidthPx: MOBILE_IMAGE_MAX_PX };
  return { stacked: false, maxWidthPx: null };
}
