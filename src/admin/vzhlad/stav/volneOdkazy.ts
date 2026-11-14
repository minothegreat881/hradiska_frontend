/**
 * VOĽNÉ ODKAZY v editore — rad pod hľadaním (`domov.odkazy`), tlačidlá
 * a odkazy pod činnosťou (`cinnost.tlacidla`, `cinnost.odkazy`).
 *
 * Koncepty a zverejnené vzhľady spred ich zavedenia tieto polia nemajú; web
 * vtedy kreslí základný vzhľad z kódu (`data/odkazy.ts`). Editor ich pri
 * načítaní doplní z toho istého základu, prevedené ako pri „Založiť
 * z dnešného webu": články a kategórie dostanú documentId, obrázky id
 * súboru z knižnice médií, texty výslovné EN a DE zo slovníka. Redaktor tak
 * v editore vidí presne to, čo web kreslí, a doplnenie uloží ako zmenu.
 */

import { ZAKLADNY_VZHLAD } from '../../../lib/vzhlad/zakladny';
import { prevedVzhlad, odkazyZakladneho } from '../../../lib/vzhlad/prevod';
import { prekladZoSlovnika } from '../../../lib/jazyk';
import type { Vzhlad, VolneOdkazy, VolnyOdkaz, Subor } from '../../../lib/vzhlad/typy';
import { clankyPodlaSlugu, suboryPodlaCesty, suboryPodlaId, type NajdenyClanok } from '../../api/vzhlad';
import { kopia, type KategoriaVDb } from './operacie';

/** Kde zoznam vo vzhľade je. */
export type KdeOdkazy = 'domov' | 'tlacidla' | 'cinnost';

export const NAZVY_ZOZNAMOV: Record<KdeOdkazy, string> = {
  domov: 'Odkazy pod hľadaním',
  tlacidla: 'Tlačidlá pod činnosťou',
  cinnost: 'Odkazy pod činnosťou',
};

/** Zoznam vo vzhľade (môže chýbať v starom koncepte). */
export function zoznamOdkazov(v: Vzhlad, kde: KdeOdkazy): VolneOdkazy | undefined {
  return kde === 'domov' ? v.domov.odkazy : kde === 'tlacidla' ? v.cinnost.tlacidla : v.cinnost.odkazy;
}

/** Zoznam na zápis — keď chýba, založí sa prázdny (doplnenie pri načítaní ho inak vždy dodá). */
export function zoznamNaZapis(v: Vzhlad, kde: KdeOdkazy): VolneOdkazy {
  const z = zoznamOdkazov(v, kde);
  if (z) return z;
  const novy: VolneOdkazy = { viditelne: true, polozky: [] };
  if (kde === 'domov') v.domov.odkazy = novy;
  else if (kde === 'tlacidla') v.cinnost.tlacidla = novy;
  else v.cinnost.odkazy = novy;
  return novy;
}

export function najdiOdkaz(v: Vzhlad, kde: KdeOdkazy, id: string): VolnyOdkaz | undefined {
  return zoznamOdkazov(v, kde)?.polozky.find((o) => o.id === id);
}

/** Obrázkové sú rad pod hľadaním a tlačidlá; odkazy pod činnosťou sú len text. */
export const sObrazkom = (kde: KdeOdkazy): boolean => kde !== 'cinnost';

export interface DoplnenieOdkazov {
  koncept: Vzhlad;
  /** Čo sa doplnilo (pre tichú poznámku „prevzaté"). */
  doplnene: string[];
  clanky: NajdenyClanok[];
  subory: Subor[];
}

/**
 * Doplní chýbajúce zoznamy zo základného vzhľadu. Keď nič nechýba, vráti
 * koncept bez zmeny a nič nesťahuje.
 */
export async function doplnVolneOdkazy(
  token: string, koncept: Vzhlad, kategorie: KategoriaVDb[], fotogaleria: number[],
): Promise<DoplnenieOdkazov> {
  const chyba: KdeOdkazy[] = (['domov', 'tlacidla', 'cinnost'] as const).filter((k) => !zoznamOdkazov(koncept, k));
  if (!chyba.length) return { koncept, doplnene: [], clanky: [], subory: [] };

  const Z = ZAKLADNY_VZHLAD;
  const casti = { domov: { odkazy: Z.domov.odkazy }, cinnost: { tlacidla: Z.cinnost.tlacidla, odkazy: Z.cinnost.odkazy } };
  const { slugyClankov, cestyObrazkov } = odkazyZakladneho(casti as unknown as Vzhlad);
  const [clanky, cesty] = await Promise.all([
    clankyPodlaSlugu(token, [...slugyClankov]),
    suboryPodlaCesty(token, [...cestyObrazkov]),
  ]);
  const { vzhlad } = prevedVzhlad({
    zakladny: Z,
    kategorie: kategorie.map((k) => ({ documentId: k.documentId, slug: k.slug, name: k.name, order: k.order })),
    clanky: new Map(clanky.map((c) => [c.slug, c.dokument])),
    subory: cesty,
    fotogaleria,
    preklad: prekladZoSlovnika,
  });

  const k = kopia(koncept);
  for (const kde of chyba) {
    const z = zoznamOdkazov(vzhlad, kde);
    if (!z) continue;
    if (kde === 'domov') k.domov.odkazy = z;
    else if (kde === 'tlacidla') k.cinnost.tlacidla = z;
    else k.cinnost.odkazy = z;
  }
  const ids = chyba.flatMap((kde) => zoznamOdkazov(k, kde)?.polozky ?? [])
    .map((o) => (o.obrazok && 'id' in o.obrazok ? o.obrazok.id : 0))
    .filter((id) => id > 0);
  const subory = ids.length ? await suboryPodlaId(token, ids) : [];
  return { koncept: k, doplnene: chyba.map((kde) => NAZVY_ZOZNAMOV[kde].toLowerCase()), clanky, subory };
}
