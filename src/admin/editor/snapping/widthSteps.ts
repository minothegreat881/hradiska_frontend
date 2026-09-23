/**
 * Prichytávanie šírky obrázka na pevné kroky.
 *
 * Schéma Strapi pozná iba päť hodnôt (`image-block.json`), preto sa ťahaním za
 * roh mení šírka plynulo, ale pustenie ju vždy prichytí na najbližší krok.
 * Žiadna zmena schémy — všetkých 2 484 obrázkov ostáva platných.
 */

import type { ImageWidth } from './positionZones';

export const WIDTH_STEPS: ImageWidth[] = ['30', '40', '50', '60', '100'];

/** Prah prichytenia v pixeloch (aj pre zóny pozície). */
export const SNAP_PX = 24;

/** Najbližší povolený krok k danej šírke v percentách. */
export function nearestStep(percent: number): ImageWidth {
  let best: ImageWidth = WIDTH_STEPS[0];
  let bestDist = Infinity;
  for (const step of WIDTH_STEPS) {
    const d = Math.abs(Number(step) - percent);
    if (d < bestDist) { bestDist = d; best = step; }
  }
  return best;
}

/**
 * Je pri danej pozícii zmena šírky vôbec povolená?
 * `full` a `breakout` idú vždy na celú šírku, tam sa šírka nenastavuje.
 */
export function widthEditable(position: string): boolean {
  return position !== 'full' && position !== 'breakout';
}

/** Popis pre štítok pri obrázku počas ťahania, napr. „vpravo · 40 %". */
export function describe(position: string, width: string): string {
  const pos: Record<string, string> = {
    left: 'vľavo', right: 'vpravo', center: 'v strede',
    full: 'celá šírka', breakout: 'cez okraj',
  };
  const p = pos[position] || position;
  return widthEditable(position) ? `${p} · ${width} %` : p;
}
