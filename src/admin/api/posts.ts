/**
 * Čítanie článkov pre admin.
 *
 * ── Ako Strapi v5 pracuje s konceptmi (overené, nie odhad) ──────────────────
 * Každý dokument má DVE verzie: draft a published.
 *   ?status=draft      → vráti draft verziu KAŽDÉHO dokumentu; `publishedAt`
 *                        je v nej vždy null, aj keď dokument publikovaný JE.
 *   ?status=published  → vráti len tie, ktoré publikované sú.
 *   (bez parametra)    → správa sa ako `published`.
 *
 * Z toho plynie, že stav sa NEDÁ vyčítať z `publishedAt` v draft odpovedi.
 * Preto sa raz stiahne ľahký index publikovaných documentId a podľa neho sa
 * riadky označia. Strapi stropuje pageSize na 100, index teda ide po stránkach.
 */

import { strapiFetch, STRAPI_URL } from './client';

export interface PostListItem {
  documentId: string;
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  originalPublishedDate: string | null;
  publishedAt: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  coverThumbUrl: string | null;
  published: boolean;
}

export interface ListResult {
  items: PostListItem[];
  total: number;
  pageCount: number;
}

const DEEP_POPULATE = [
  'populate[0]=coverImage', 'populate[1]=gallery', 'populate[2]=category',
  'populate[3]=tags', 'populate[4]=blocks.image', 'populate[5]=blocks.images',
  'populate[6]=location', 'populate[7]=keyFacts', 'populate[8]=timeline',
  'populate[9]=blocks.items', 'populate[10]=quotes', 'populate[11]=blocks.secondImage',
].join('&');

// ── Index publikovaných ──────────────────────────────────────────────────────
let publishedCache: { set: Set<string>; at: number } | null = null;
const CACHE_MS = 30_000;

export function invalidatePublishedIndex() { publishedCache = null; }

async function publishedIndex(token: string): Promise<Set<string>> {
  if (publishedCache && Date.now() - publishedCache.at < CACHE_MS) return publishedCache.set;

  const set = new Set<string>();
  let page = 1;
  // Strop je 100/stránku — 305 článkov = 4 dotazy po ~5 KB.
  for (;;) {
    const r = await strapiFetch<any>(
      `/api/blog-posts?status=published&fields[0]=id&pagination[page]=${page}&pagination[pageSize]=100`,
      { token }
    );
    (r.data ?? []).forEach((d: any) => set.add(d.documentId));
    const pc = r.meta?.pagination?.pageCount ?? 1;
    if (page >= pc) break;
    page++;
  }
  publishedCache = { set, at: Date.now() };
  return set;
}

// ── Zoznam ───────────────────────────────────────────────────────────────────
export async function listPosts(opts: {
  token: string;
  page?: number;
  pageSize?: number;
  q?: string;
  categorySlug?: string;
  state?: 'all' | 'published' | 'draft';
  noCover?: boolean;
  sort?: string;
}): Promise<ListResult> {
  const { token, page = 1, pageSize = 25, q, categorySlug, state = 'all', noCover, sort } = opts;

  const parts = [
    // `status=draft` je jediný spôsob, ako v zozname vidieť aj nepublikované.
    'status=draft',
    'populate[0]=coverImage',
    'populate[1]=category',
    `sort=${sort || 'originalPublishedDate:desc'}`,
    `pagination[page]=${page}`,
    `pagination[pageSize]=${pageSize}`,
  ];
  if (q) parts.push(`filters[$or][0][title][$containsi]=${encodeURIComponent(q)}`,
                    `filters[$or][1][excerpt][$containsi]=${encodeURIComponent(q)}`);
  if (categorySlug) parts.push(`filters[category][slug][$eq]=${encodeURIComponent(categorySlug)}`);
  if (noCover) parts.push('filters[coverImage][id][$null]=true');

  const [res, pubSet] = await Promise.all([
    strapiFetch<any>(`/api/blog-posts?${parts.join('&')}`, { token }),
    publishedIndex(token),
  ]);

  let items: PostListItem[] = (res.data ?? []).map((d: any) => {
    const fmt = d.coverImage?.formats;
    const thumb = fmt?.thumbnail?.url || d.coverImage?.url || null;
    return {
      documentId: d.documentId,
      title: d.title ?? '',
      slug: d.slug ?? '',
      excerpt: d.excerpt ?? '',
      authorName: d.authorName ?? '',
      originalPublishedDate: d.originalPublishedDate ?? null,
      publishedAt: d.publishedAt ?? null,
      categoryName: d.category?.name ?? null,
      categorySlug: d.category?.slug ?? null,
      coverThumbUrl: thumb ? (thumb.startsWith('http') ? thumb : STRAPI_URL + thumb) : null,
      published: pubSet.has(d.documentId),
    };
  });

  // Filter stavu sa robí až tu — Strapi ho na úrovni dotazu neponúka.
  if (state === 'published') items = items.filter(i => i.published);
  if (state === 'draft') items = items.filter(i => !i.published);

  return {
    items,
    total: res.meta?.pagination?.total ?? items.length,
    pageCount: res.meta?.pagination?.pageCount ?? 1,
  };
}

// ── Súhrnné počty do hlavičky ────────────────────────────────────────────────
export async function fetchCounts(token: string) {
  const one = (extra: string) =>
    strapiFetch<any>(`/api/blog-posts?${extra}&pagination[pageSize]=1`, { token })
      .then(r => r.meta?.pagination?.total ?? 0);

  const [all, published, noCover] = await Promise.all([
    one('status=draft'),
    one('status=published'),
    one('status=draft&filters[coverImage][id][$null]=true'),
  ]);
  return { all, published, draft: all - published, noCover };
}

// ── Detail na editáciu ───────────────────────────────────────────────────────
export async function getPost(token: string, documentId: string): Promise<any> {
  const r = await strapiFetch<any>(
    `/api/blog-posts/${documentId}?status=draft&${DEEP_POPULATE}`,
    { token }
  );
  return r.data;
}

/**
 * Je dokument publikovaný?
 * Nedá sa to zistiť z `publishedAt` v draft odpovedi (tam je vždy null), preto
 * sa cielene pýtame na published verziu.
 */
export async function isPublished(token: string, documentId: string): Promise<boolean> {
  try {
    const r = await strapiFetch<any>(
      `/api/blog-posts/${documentId}?status=published&fields[0]=id`, { token }
    );
    return !!r?.data;
  } catch {
    return false; // 404 = published verzia neexistuje → je to koncept
  }
}

export async function listCategories(token: string) {
  const r = await strapiFetch<any>('/api/blog-categories?sort=order:asc&pagination[pageSize]=100', { token });
  return (r.data ?? []).map((c: any) => ({
    documentId: c.documentId, id: c.id, name: c.name, slug: c.slug,
  }));
}
