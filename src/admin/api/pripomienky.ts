/**
 * Pripomienky — poznámky pripnuté na prvok stránky (nástroj na webe).
 *
 * Číta a mení ich iba staff (rola Authenticated); práva sa nastavujú v
 * `hradiska-strapi/src/index.ts`, funkcia `setupStaffUserPermissions`.
 * Verejná ani členská rola na ne nemá nič, takže čitateľ ich nevidí.
 */

import { strapiFetch } from './client';

export type PripomienkaDruh = 'chyba' | 'obsah';
export type PripomienkaStav = 'nova' | 'riesi-sa' | 'hotova' | 'zamietnuta';

export interface AdminPripomienka {
  documentId: string;
  text: string;
  druh: PripomienkaDruh;
  stav: PripomienkaStav;
  url: string;
  nadpisStranky: string | null;
  popisPrvku: string | null;
  zariadenie: string | null;
  sirkaOkna: number | null;
  autor: string | null;
  createdAt: string;
}

export interface PripomienkyVysledok {
  items: AdminPripomienka[];
  total: number;
  pageCount: number;
}

const zoRiadku = (r: any): AdminPripomienka => ({
  documentId: r.documentId,
  text: r.text ?? '',
  druh: r.druh ?? 'chyba',
  stav: r.stav ?? 'nova',
  url: r.url ?? '',
  nadpisStranky: r.nadpisStranky ?? null,
  popisPrvku: r.popisPrvku ?? null,
  zariadenie: r.zariadenie ?? null,
  sirkaOkna: r.sirkaOkna ?? null,
  autor: r.user?.username ?? null,   // null = hosť (neprihlásený)
  createdAt: r.createdAt,
});

export async function listPripomienky(opts: {
  token: string;
  page?: number;
  pageSize?: number;
  stav?: PripomienkaStav | 'vsetky';
  druh?: PripomienkaDruh | 'vsetky';
  q?: string;
}): Promise<PripomienkyVysledok> {
  const { token, page = 1, pageSize = 30, stav = 'vsetky', druh = 'vsetky', q } = opts;
  const parts = [
    'populate[user][fields][0]=username',
    'sort=createdAt:desc',
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
  ];
  if (stav !== 'vsetky') parts.push(`filters[stav][$eq]=${stav}`);
  if (druh !== 'vsetky') parts.push(`filters[druh][$eq]=${druh}`);
  if (q?.trim()) {
    const v = encodeURIComponent(q.trim());
    parts.push(`filters[$or][0][text][$containsi]=${v}`, `filters[$or][1][url][$containsi]=${v}`);
  }

  const r = await strapiFetch<any>(`/api/pripomienky?${parts.join('&')}`, { token });
  const items = (r.data ?? []).map(zoRiadku);
  return {
    items,
    total: r.meta?.pagination?.total ?? items.length,
    pageCount: r.meta?.pagination?.pageCount ?? 1,
  };
}

/** Počty do filtračných chipov — cez `pageSize=1` a `meta.total`, nie celé zoznamy. */
export async function pripomienkyPocty(token: string) {
  const jeden = (extra: string) =>
    strapiFetch<any>(`/api/pripomienky?${extra}pagination[pageSize]=1`, { token })
      .then((r) => r.meta?.pagination?.total ?? 0)
      .catch(() => 0);
  const [vsetky, nove, riesiSa, hotove, zamietnute] = await Promise.all([
    jeden(''),
    jeden('filters[stav][$eq]=nova&'),
    jeden('filters[stav][$eq]=riesi-sa&'),
    jeden('filters[stav][$eq]=hotova&'),
    jeden('filters[stav][$eq]=zamietnuta&'),
  ]);
  return { vsetky, nova: nove, 'riesi-sa': riesiSa, hotova: hotove, zamietnuta: zamietnute };
}

export const nastavStav = (token: string, documentId: string, stav: PripomienkaStav) =>
  strapiFetch(`/api/pripomienky/${documentId}`, { method: 'PUT', token, body: { data: { stav } } });

export const zmazPripomienku = (token: string, documentId: string) =>
  strapiFetch(`/api/pripomienky/${documentId}`, { method: 'DELETE', token });

/** Zoznam pre vývojára — jeden blok textu na vloženie do správy. */
export function prePrenos(items: AdminPripomienka[]): string {
  const web = typeof window !== 'undefined' ? window.location.origin : '';
  return items
    .map((p, i) => `${i + 1}. [${p.druh}] ${p.text}\n   ${web}${p.url} — ${p.popisPrvku || 'neznámy prvok'}`)
    .join('\n');
}
