/**
 * Klientske fulltextové hľadanie v článkoch.
 *
 * Index (čistý text tela 305 článkov) sa lenivo stiahne z backendu až pri prvom
 * hľadaní (GET /api/search-index, ~1 MB gzip, HTTP-cache 5 min) a v pamäti sa
 * postaví MiniSearch. Samotné hľadanie je tak okamžité, diakritiky-necitlivé,
 * odolné voči skloňovaniu (prefix + fuzzy) a s rankingom (názov > štítky/lokalita
 * > telo). Viď backend src/api/blog-post/controllers/blog-post.ts.
 */
import MiniSearch from 'minisearch';

const STRAPI_URL = import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

export interface IndexDoc {
  slug: string;
  title: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  cover: string | null;
  place: string | null;
  hasLocation: boolean;
  text: string;
}

export interface SearchHit extends IndexDoc {
  score: number;
}

/** Zloží diakritiku a dá na malé písmená (index aj dopyt rovnako). */
export function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

interface LoadedIndex {
  mini: MiniSearch;
  bySlug: Map<string, IndexDoc>;
}

let loadPromise: Promise<LoadedIndex> | null = null;

async function loadIndex(): Promise<LoadedIndex> {
  const res = await fetch(`${STRAPI_URL}/api/search-index`, {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  });
  if (!res.ok) throw new Error(`search-index HTTP ${res.status}`);
  const json = await res.json();
  const items: IndexDoc[] = json.items || [];

  const bySlug = new Map<string, IndexDoc>();
  for (const it of items) bySlug.set(it.slug, it);

  const mini = new MiniSearch<IndexDoc>({
    idField: 'slug',
    fields: ['title', 'tags', 'place', 'excerpt', 'categoryName', 'text'],
    // text v store nedržíme (~2,8 MB) — telo si berieme z bySlug na snippet.
    storeFields: [],
    processTerm: (term) => fold(term),
    extractField: (doc, field) => {
      const v = (doc as any)[field];
      return Array.isArray(v) ? v.join(' ') : v == null ? '' : String(v);
    },
  });
  mini.addAll(items);
  return { mini, bySlug };
}

/** Lenivo (singleton) načíta a postaví index. Ďalšie volania sú okamžité. */
export function getSearchIndex(): Promise<LoadedIndex> {
  if (!loadPromise) loadPromise = loadIndex().catch((e) => { loadPromise = null; throw e; });
  return loadPromise;
}

/** Spustí hľadanie. Vráti zoradené zhody (najlepšie prvé). */
export async function searchArticles(query: string, limit = 30): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const { mini, bySlug } = await getSearchIndex();
  const results = mini.search(q, {
    boost: { title: 5, tags: 2.5, place: 3, categoryName: 2, excerpt: 1.5, text: 1 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: 'AND',
  });
  const hits: SearchHit[] = [];
  for (const r of results) {
    const doc = bySlug.get(r.id as string);
    if (doc) hits.push({ ...doc, score: r.score });
    if (hits.length >= limit) break;
  }
  return hits;
}

export interface Snippet { pre: string; mid: string; post: string; matched: boolean; }

/**
 * Úryvok tela okolo prvého výskytu ktoréhokoľvek slova z dopytu, so zvýraznenou
 * zhodou. Diakritiky-necitlivé; indexy počítame nad zloženým textom, ale režeme
 * pôvodný (kvôli správnej dĺžke a diakritike vo výpise).
 */
export function makeSnippet(text: string, query: string, radius = 70): Snippet {
  if (!text) return { pre: '', mid: '', post: '', matched: false };
  const folded = fold(text);
  const terms = fold(query).split(/\s+/).filter((t) => t.length >= 2);
  let idx = -1;
  let termLen = 0;
  for (const t of terms) {
    const i = folded.indexOf(t);
    if (i >= 0 && (idx < 0 || i < idx)) { idx = i; termLen = t.length; }
  }
  if (idx < 0) {
    const head = text.slice(0, radius * 2).trim();
    return { pre: head + (text.length > radius * 2 ? '…' : ''), mid: '', post: '', matched: false };
  }
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + termLen + radius);
  const pre = (start > 0 ? '…' : '') + text.slice(start, idx);
  const mid = text.slice(idx, idx + termLen);
  const post = text.slice(idx + termLen, end) + (end < text.length ? '…' : '');
  return { pre, mid, post, matched: true };
}

/**
 * Zvýrazní v texte prvý výskyt ktoréhokoľvek slova z dopytu (diakritiky-necitlivé).
 * Vhodné na názov: pri viacslovnom dopyte zvýrazní aspoň jedno sediace slovo.
 */
export function highlightTerm(text: string, query: string): Snippet {
  if (!text || !query) return { pre: text, mid: '', post: '', matched: false };
  const folded = fold(text);
  const terms = fold(query).split(/\s+/).filter((t) => t.length >= 2);
  let idx = -1;
  let len = 0;
  for (const t of terms) {
    const i = folded.indexOf(t);
    if (i >= 0 && (idx < 0 || i < idx)) { idx = i; len = t.length; }
  }
  if (idx < 0) return { pre: text, mid: '', post: '', matched: false };
  return { pre: text.slice(0, idx), mid: text.slice(idx, idx + len), post: text.slice(idx + len), matched: true };
}

/** Absolútna URL náhľadu obálky (backend vracia relatívnu /uploads/…). */
export function coverToUrl(cover: string | null): string | undefined {
  if (!cover) return undefined;
  return cover.startsWith('http') ? cover : `${STRAPI_URL}${cover}`;
}
