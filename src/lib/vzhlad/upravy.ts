/**
 * Značky režimu úprav pre editor vzhľadu.
 *
 * `data-vw="<druh>:<id>"` pomenúva prvok, ktorý editor vie vybrať; zoznam
 * názvov je v `docs/VZHLAD-WEBU.md`. `data-vw-skryte="1"` nesie prvok, ktorý
 * je na webe skrytý — v režime úprav sa nakreslí, aby sa dal znova zobraziť.
 *
 * Obe funkcie vracajú `undefined` mimo režimu úprav, takže React atribút
 * nevykreslí a verejný DOM ostane presne taký ako predtým.
 */

export const vw = (upravy: boolean, nazov: string): string | undefined => (upravy ? nazov : undefined);

export const vwSkryte = (upravy: boolean, skryte: boolean): '1' | undefined => (upravy && skryte ? '1' : undefined);
