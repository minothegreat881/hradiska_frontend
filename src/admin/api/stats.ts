/**
 * Skutočné počty pre obrazovku Analytika.
 *
 * Všetko sa ráta cez `pagination[pageSize]=1` a `meta.pagination.total`, takže
 * sa neťahá ani jeden celý záznam. Čo sa spočítať nedá, vráti `null` a v
 * rozhraní sa zobrazí „—“ (nie nula, tá by klamala).
 *
 * Návštevnosť sa tu neráta vôbec — meranie zatiaľ nebeží a vymyslené čísla
 * boli v starej obrazovke natvrdo v `admin/data.ts`.
 */

import { strapiFetch } from './client';

export interface ContentStats {
  articles: number | null;
  published: number | null;
  publishedLast30: number | null;
  tags: number | null;
  categories: number | null;
  commentsWaiting: number | null;
  noCover: number | null;
  noMeta: number | null;
  noLocation: number | null;
}

const EMPTY: ContentStats = {
  articles: null, published: null, publishedLast30: null, tags: null, categories: null,
  commentsWaiting: null, noCover: null, noMeta: null, noLocation: null,
};

export async function fetchContentStats(token: string): Promise<ContentStats> {
  const total = (path: string): Promise<number | null> =>
    strapiFetch<any>(`${path}${path.includes('?') ? '&' : '?'}pagination[pageSize]=1`, { token })
      .then((r) => r?.meta?.pagination?.total ?? null)
      .catch(() => null);

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    articles, published, publishedLast30, tags, categories, commentsWaiting, noCover, noMeta, noLocation,
  ] = await Promise.all([
    // `status=draft` počíta VŠETKY dokumenty (každý má draft verziu).
    total('/api/blog-posts?status=draft'),
    total('/api/blog-posts?status=published'),
    total(`/api/blog-posts?status=published&filters[publishedAt][$gte]=${encodeURIComponent(since)}`),
    /* Obrázky sa tu NERÁTAJÚ. Rozhranie `/api/upload/files` stránkovanie
       ignoruje, počet nevracia a na dotaz pošle VŠETKÝCH 28 592 záznamov —
       pár desiatok megabajtov pri každom otvorení obrazovky. Knižnica médií
       má vlastnú obrazovku, počet sa dá doplniť, až keď pribudne endpoint. */
    total('/api/blog-tags'),
    total('/api/blog-categories'),
    total('/api/blog-comments?filters[status][$eq]=waiting'),
    total('/api/blog-posts?status=draft&filters[coverImage][id][$null]=true'),
    total('/api/blog-posts?status=draft&filters[metaDescription][$null]=true'),
    total('/api/blog-posts?status=draft&filters[location][id][$null]=true'),
  ]);

  return { ...EMPTY, articles, published, publishedLast30, tags, categories, commentsWaiting, noCover, noMeta, noLocation };
}
