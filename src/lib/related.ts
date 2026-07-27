/**
 * Odporúčací systém „Súvisiace / Mohlo by vás zaujímať".
 *
 * Cieľ: adresné, tematicky podobné články — nie len „prvé N z kategórie".
 * Postup: MiniSearch (už načítaný pre vyhľadávanie) sa dopytuje kľúčovými slovami
 * SAMOTNÉHO článku (názov + tagy + lokalita + excerpt) → dostaneme články s najväčším
 * prekryvom slov. Skóre potom doladíme boostom za rovnakú kategóriu, lokalitu a tagy.
 * Výsledok je deduplikovaný a bez samotného článku.
 */
import { getSearchIndex, fold, type IndexDoc } from './searchIndex';

const STRAPI_URL = import.meta.env.PROD ? '/strapi' : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

// Slovenské stopslová — nech dopyt necielime na „a, na, sa, v, že…".
const STOP = new Set(
  ('a aj ako ale alebo ani áno by bol bola boli bolo bez do ho i iba ich im je jej jeho k ku '
    + 'kde keď ktorý ktorá ktoré ktorí len ma má mal mať me medzi mi mne my na nad nám náš neho '
    + 'nie no o od po pod pre pred pri s sa si so tak takže te ten tento to toto tu túto u už v '
    + 'vo z za zo že ich sú bude budú viac však tiež nato preto tam teda').split(' ')
);

export interface RelatedCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  categoryName: string;
  coverImage: string;
  publishedAt?: string;
  readTime: number;
}

function coverUrl(cover: string | null): string {
  if (!cover) return '';
  return cover.startsWith('http') ? cover : `${STRAPI_URL}${cover}`;
}

function readingTime(doc: IndexDoc): number {
  const words = ((doc as any).text || doc.excerpt || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)); // ~200 slov/min
}

function toCard(doc: IndexDoc): RelatedCard {
  return {
    id: doc.slug,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt || '',
    category: doc.categorySlug,
    categoryName: doc.categoryName,
    coverImage: coverUrl(doc.cover),
    publishedAt: (doc as any).date || undefined,
    readTime: readingTime(doc),
  };
}

/** Kľúčové slová článku pre dopyt (názov má väčšiu váhu, bez stopslov a krátkych). */
function keyTerms(doc: IndexDoc): string {
  const words = (s: string) => fold(s || '').split(/[^a-z0-9á-ž]+/i).filter((w) => w.length >= 4 && !STOP.has(w));
  const titleW = words(doc.title);
  const excerptW = words(doc.excerpt).slice(0, 18);
  // názov dvakrát (vyššia váha) + tagy + lokalita + časť excerptu
  return [...titleW, ...titleW, ...doc.tags, doc.place || '', ...excerptW].join(' ').trim();
}

/**
 * Vráti až `limit` tematicky najbližších článkov k danému slugu.
 * Ak MiniSearch nájde málo (veľmi krátky/ojedinelý článok), doplní z rovnakej kategórie.
 */
export async function getRelated(slug: string, limit = 6): Promise<RelatedCard[]> {
  let idx;
  try {
    idx = await getSearchIndex();
  } catch {
    return [];
  }
  const { mini, bySlug } = idx;
  const cur = bySlug.get(slug);
  if (!cur) return [];

  const seen = new Set<string>([slug]);
  const scored: Array<{ doc: IndexDoc; score: number }> = [];

  const query = keyTerms(cur);
  const hits = query ? mini.search(query, { combineWith: 'OR', fuzzy: 0.1, prefix: false }) : [];
  for (const h of hits) {
    if (seen.has(h.id as string)) continue;
    const doc = bySlug.get(h.id as string);
    if (!doc) continue;
    seen.add(doc.slug);
    let s = h.score;
    if (doc.categorySlug && doc.categorySlug === cur.categorySlug) s += 8;
    if (doc.place && cur.place && doc.place === cur.place) s += 14;
    const sharedTags = doc.tags.filter((t) => cur.tags.includes(t)).length;
    s += sharedTags * 5;
    if (doc.cover) s += 1; // jemne uprednostni články s obrázkom (krajšie karty)
    scored.push({ doc, score: s });
  }
  scored.sort((a, b) => b.score - a.score);

  const result: RelatedCard[] = scored.slice(0, limit).map((x) => toCard(x.doc));

  // Fallback — doplň z rovnakej kategórie, potom hocičím, nech je vždy plných `limit`.
  if (result.length < limit) {
    const rest = [...bySlug.values()].filter((d) => !seen.has(d.slug));
    rest.sort((a, b) => Number(b.categorySlug === cur.categorySlug) - Number(a.categorySlug === cur.categorySlug));
    for (const d of rest) {
      if (result.length >= limit) break;
      seen.add(d.slug);
      result.push(toCard(d));
    }
  }
  return result;
}
