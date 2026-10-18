/**
 * Vzhľad webu — volania na backend (`hradiska-strapi`, `docs/VZHLAD-WEBU-API.md`).
 *
 * Všetko ide cez `strapiFetch` (token, preklad chýb, odhlásenie pri 401/403).
 * Chyby majú tvar Strapi; strojovo čitateľný dôvod je v `details.kod`:
 *   • 400 `neplatne-udaje`  → `details.chyby: ChybaVzhladu[]` (cesta k poľu + správa),
 *   • 409 `koncept-zmeneny` → `details: { verziaKonceptu, koncept, zakladDb, konceptUpravil, konceptUpravene }`,
 *   • 409 `konflikt-db`     → `details.konflikty: KonfliktDb[]`, `details.db` = DB teraz.
 */

import { strapiFetch, StrapiError, STRAPI_URL } from './client';
import type {
  Vzhlad, ZakladDb, OdpovedKonceptu, OdpovedVzhladu, ChybaVzhladu, Rozriesene, ClanokVJazyku, Jazyk,
} from '../../lib/vzhlad/typy';
import type { KonfliktDb, ZapisDoDb } from '../../lib/vzhlad/zlucenie';

const V = '/api/vzhlad-webu';

export interface UlozenyKoncept {
  verziaKonceptu: number;
  konceptUpravil: string | null;
  konceptUpravene: string | null;
}

export interface Zverejnene {
  verziaZverejnena: number;
  verziaKonceptu: number;
  zverejnilKto: string | null;
  zverejneneKedy: string | null;
  zakladDb: ZakladDb;
  zapisy: ZapisDoDb[];
  doplnenaPredoslaVerzia?: boolean;
}

export interface VerziaVZozname {
  verzia: number;
  zverejnil: string | null;
  zverejnene: string | null;
  poznamka: string | null;
}

export interface VerziaHistorie extends Rozriesene {
  verzia: number;
  obsah: Vzhlad | null;
  zakladDb: ZakladDb | null;
  zverejnil: string | null;
  zverejnene: string | null;
  poznamka: string | null;
}

export interface MiestoPouzitia {
  zdroj: 'koncept' | 'zverejnene' | 'historia';
  verzia?: number;
  cesta: string;
  podla?: 'id' | 'cesta';
}

export interface PouzitieSuboru {
  id: number;
  subor: { id: number; name: string; url: string; mime: string };
  miesta: MiestoPouzitia[];
  chraneny: boolean;
  mozeSaZmazat: boolean;
}

/** Podrobnosti 409 `koncept-zmeneny`. */
export interface KonceptZmeneny {
  kod: 'koncept-zmeneny';
  verziaKonceptu: number;
  koncept: Vzhlad | null;
  zakladDb: ZakladDb | null;
  konceptUpravil: string | null;
  konceptUpravene: string | null;
}

/** Strojovo čitateľný dôvod chyby (`details.kod`). */
export const kodChyby = (e: unknown): string | null => {
  const d = (e as StrapiError)?.details as { kod?: unknown } | undefined;
  return typeof d?.kod === 'string' ? d.kod : null;
};
export const chybyKontroly = (e: unknown): ChybaVzhladu[] => {
  const d = (e as StrapiError)?.details as { chyby?: unknown } | undefined;
  return Array.isArray(d?.chyby) ? (d!.chyby as ChybaVzhladu[]) : [];
};
export const konfliktyDb = (e: unknown): { konflikty: KonfliktDb[]; db: ZakladDb | null } => {
  const d = (e as StrapiError)?.details as { konflikty?: unknown; db?: unknown } | undefined;
  return { konflikty: Array.isArray(d?.konflikty) ? (d!.konflikty as KonfliktDb[]) : [], db: (d?.db as ZakladDb) ?? null };
};
export const konceptZmeneny = (e: unknown): KonceptZmeneny | null =>
  kodChyby(e) === 'koncept-zmeneny' ? ((e as StrapiError).details as KonceptZmeneny) : null;

export const nacitajKoncept = (token: string) => strapiFetch<OdpovedKonceptu>(`${V}/koncept`, { token });

export const ulozKoncept = (token: string, telo: { zaklad: number; data: Vzhlad | null; zakladDb: ZakladDb | null }) =>
  strapiFetch<UlozenyKoncept>(`${V}/koncept`, { method: 'PUT', token, body: telo });

export const zverejnitKoncept = (token: string, telo: { zaklad: number; poznamka?: string }) =>
  strapiFetch<Zverejnene>(`${V}/zverejnit`, { method: 'POST', token, body: telo });

export const nacitajHistoriu = async (token: string): Promise<VerziaVZozname[]> =>
  (await strapiFetch<{ verzie: VerziaVZozname[] }>(`${V}/historia`, { token })).verzie ?? [];

export const nacitajVerziu = (token: string, verzia: number) =>
  strapiFetch<VerziaHistorie>(`${V}/historia/${verzia}`, { token });

export const obnovVerziu = (token: string, verzia: number, zaklad?: number) =>
  strapiFetch<UlozenyKoncept & { obnovenaVerzia: number }>(`${V}/obnovit/${verzia}`, {
    method: 'POST', token, body: zaklad === undefined ? {} : { zaklad },
  });

export const pouzitieSuboru = (token: string, id: number) =>
  strapiFetch<PouzitieSuboru>(`${V}/pouzitie-suboru/${id}`, { token });

/** Verejný zverejnený vzhľad — bez tokenu, presne to, čo vidí web. */
export async function verejnyVzhlad(): Promise<OdpovedVzhladu | null> {
  try {
    const r = await fetch(`${STRAPI_URL}${V}`, { cache: 'no-store' });
    return r.ok ? ((await r.json()) as OdpovedVzhladu) : null;
  } catch {
    return null;
  }
}

/* ───────────────────────── Údaje pre editor ───────────────────────── */

export interface KategoriaDb {
  documentId: string;
  slug: string;
  name: string;
  order: number | null;
}

/** Všetky kategórie z databázy (verejné čítanie) v poradí menu. */
export async function kategorieZDb(token: string): Promise<KategoriaDb[]> {
  const r = await strapiFetch<{ data: KategoriaDb[] }>('/api/blog-categories?sort=order:asc&pagination[pageSize]=100', { token });
  return (r.data ?? []).map((k) => ({ documentId: k.documentId, slug: k.slug, name: k.name, order: k.order ?? null }));
}

export interface NajdenyClanok {
  dokument: string;
  /** Slovenský slug a názov. */
  slug: string;
  nazov: string;
  kategoria: string | null;
  datum: string | null;
  obrazok: number | null;
  /** Ten istý článok v jazykoch, v ktorých je zverejnený (pre `rozriesene.clanky`). */
  jazyky: Partial<Record<Jazyk, ClanokVJazyku>>;
}

const POLIA_CLANKU = 'fields[0]=title&fields[1]=slug&fields[2]=publishedAt&fields[3]=originalPublishedDate'
  + '&populate[coverImage][fields][0]=id&populate[category][fields][0]=slug'
  + '&populate[localizations][fields][0]=slug&populate[localizations][fields][1]=title&populate[localizations][fields][2]=locale'
  + '&populate[localizations][populate][coverImage][fields][0]=id';

function naClanok(p: any): NajdenyClanok {
  const jazyky: Partial<Record<Jazyk, ClanokVJazyku>> = {
    sk: { slug: p.slug, nazov: p.title, obrazok: p.coverImage?.id ?? null },
  };
  for (const l of p.localizations ?? []) {
    if ((l.locale === 'en' || l.locale === 'de') && l.slug) {
      jazyky[l.locale as Jazyk] = { slug: l.slug, nazov: l.title, obrazok: l.coverImage?.id ?? p.coverImage?.id ?? null };
    }
  }
  return {
    dokument: p.documentId, slug: p.slug, nazov: p.title,
    kategoria: p.category?.slug ?? null,
    datum: p.originalPublishedDate || p.publishedAt || null,
    obrazok: p.coverImage?.id ?? null,
    jazyky,
  };
}

/**
 * Hľadanie článku podľa názvu (len zverejnené v slovenčine — iné vzhľad
 * neprijme). Prázdne `q` vráti najnovšie, voliteľne z jednej kategórie.
 */
export async function hladajClanky(token: string, q: string, opts: { kategoria?: string | null; pocet?: number } = {}): Promise<NajdenyClanok[]> {
  const casti = [`locale=sk`, `sort=publishedAt:desc`, `pagination[pageSize]=${opts.pocet ?? 12}`, POLIA_CLANKU];
  if (q.trim()) casti.push(`filters[title][$containsi]=${encodeURIComponent(q.trim())}`);
  if (opts.kategoria) casti.push(`filters[category][slug][$eq]=${encodeURIComponent(opts.kategoria)}`);
  const r = await strapiFetch<{ data: any[] }>(`/api/blog-posts?${casti.join('&')}`, { token });
  return (r.data ?? []).map(naClanok);
}

/** Články podľa documentId (doplnenie `rozriesene.clanky` pre to, čo editor práve vybral). */
export async function clankyPodlaDokumentu(token: string, dokumenty: string[]): Promise<NajdenyClanok[]> {
  if (!dokumenty.length) return [];
  const q = dokumenty.map((d, i) => `filters[documentId][$in][${i}]=${encodeURIComponent(d)}`).join('&');
  const r = await strapiFetch<{ data: any[] }>(`/api/blog-posts?${q}&locale=sk&pagination[pageSize]=${Math.min(100, dokumenty.length)}&${POLIA_CLANKU}`, { token });
  return (r.data ?? []).map(naClanok);
}

/** Články podľa slovenských slugov (prevod dnešného stavu). */
export async function clankyPodlaSlugu(token: string, slugy: string[]): Promise<NajdenyClanok[]> {
  if (!slugy.length) return [];
  const q = slugy.map((s, i) => `filters[slug][$in][${i}]=${encodeURIComponent(s)}`).join('&');
  const r = await strapiFetch<{ data: any[] }>(`/api/blog-posts?${q}&locale=sk&pagination[pageSize]=100&${POLIA_CLANKU}`, { token });
  return (r.data ?? []).map(naClanok);
}

/** Súbory knižnice médií podľa cesty (`/uploads/…`) → id. */
export async function suboryPodlaCesty(token: string, cesty: string[]): Promise<Map<string, number>> {
  const von = new Map<string, number>();
  const zoznam = [...cesty];
  for (let i = 0; i < zoznam.length; i += 40) {
    const davka = zoznam.slice(i, i + 40);
    const q = davka.map((c, k) => `filters[url][$in][${k}]=${encodeURIComponent(c)}`).join('&');
    const r = await strapiFetch<any>(`/api/upload/files?${q}&fields[0]=id&fields[1]=url&limit=${davka.length * 2}`, { token });
    const pole: { id: number; url: string }[] = Array.isArray(r) ? r : r?.data ?? [];
    /* Pri viacerých záznamoch s rovnakou adresou berie prevod prvý (najnižšie id). */
    for (const f of [...pole].sort((a, b) => a.id - b.id)) if (!von.has(f.url)) von.set(f.url, f.id);
  }
  return von;
}
