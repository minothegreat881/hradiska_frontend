/**
 * Nahlásené komentáre — podnety od čitateľov.
 *
 * Číta a mení ich iba redakcia (rola Authenticated); práva sa nastavujú
 * v `hradiska-strapi/src/index.ts`. Člen smie nahlásenie len podať.
 *
 * Odpis komentára (`odpisObsahu`) uložil server pri nahlásení zámerne —
 * keď sa komentár medzitým zmaže, v zozname musí ostať vidieť, čo sa riešilo.
 */

import { strapiFetch } from './client';

export type NahlasenieStav = 'nove' | 'vybavene' | 'zamietnute';
export type NahlasenieDruh = 'komentar' | 'fotokomentar';

export interface AdminNahlasenie {
  documentId: string;
  druh: NahlasenieDruh;
  cielDocumentId: string;
  dovod: string;
  poznamka: string | null;
  stav: NahlasenieStav;
  odpisObsahu: string;
  autorObsahu: string;
  url: string | null;
  nahlasil: string | null;
  createdAt: string;
}

export const DOVODY: Record<string, string> = {
  spam: 'spam alebo reklama',
  urazka: 'urážka',
  nevhodne: 'nevhodný obsah',
  nepravda: 'nepravdivé tvrdenie',
  ine: 'iné',
};

const zoRiadku = (r: any): AdminNahlasenie => ({
  documentId: r.documentId,
  druh: r.druh ?? 'komentar',
  cielDocumentId: r.cielDocumentId ?? '',
  dovod: r.dovod ?? 'ine',
  poznamka: r.poznamka ?? null,
  stav: r.stav ?? 'nove',
  odpisObsahu: r.odpisObsahu ?? '',
  autorObsahu: r.autorObsahu ?? '',
  url: r.url ?? null,
  nahlasil: r.user?.displayName || r.user?.username || null,
  createdAt: r.createdAt,
});

export async function listNahlasenia(opts: {
  token: string;
  page?: number;
  pageSize?: number;
  stav?: NahlasenieStav | 'vsetky';
}): Promise<{ items: AdminNahlasenie[]; total: number; pageCount: number }> {
  const { token, page = 1, pageSize = 30, stav = 'vsetky' } = opts;
  const parts = [
    'populate[user][fields][0]=username',
    'populate[user][fields][1]=displayName',
    'sort=createdAt:desc',
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
  ];
  if (stav !== 'vsetky') parts.push(`filters[stav][$eq]=${stav}`);

  const r = await strapiFetch<any>(`/api/nahlasenia?${parts.join('&')}`, { token });
  const items = (r.data ?? []).map(zoRiadku);
  return {
    items,
    total: r.meta?.pagination?.total ?? items.length,
    pageCount: r.meta?.pagination?.pageCount ?? 1,
  };
}

/** Počty do chipov — cez `pageSize=1` a `meta.total`, nie celé zoznamy. */
export async function nahlaseniaPocty(token: string) {
  const jeden = (extra: string) =>
    strapiFetch<any>(`/api/nahlasenia?${extra}pagination[pageSize]=1`, { token })
      .then((r) => r.meta?.pagination?.total ?? 0)
      .catch(() => 0);
  const [vsetky, nove, vybavene, zamietnute] = await Promise.all([
    jeden(''),
    jeden('filters[stav][$eq]=nove&'),
    jeden('filters[stav][$eq]=vybavene&'),
    jeden('filters[stav][$eq]=zamietnute&'),
  ]);
  return { vsetky, nove, vybavene, zamietnute };
}

export const nastavStavNahlasenia = (token: string, documentId: string, stav: NahlasenieStav) =>
  strapiFetch(`/api/nahlasenia/${documentId}`, { method: 'PUT', token, body: { data: { stav } } });

export const zmazNahlasenie = (token: string, documentId: string) =>
  strapiFetch(`/api/nahlasenia/${documentId}`, { method: 'DELETE', token });

/** Zmazanie samotného komentára, ktorého sa nahlásenie týka. */
export const zmazNahlasenyPrispevok = (token: string, n: AdminNahlasenie) =>
  strapiFetch(
    n.druh === 'komentar'
      ? `/api/blog-comments/${n.cielDocumentId}`
      : `/api/photo-comments/${n.cielDocumentId}`,
    { method: 'DELETE', token }
  );
