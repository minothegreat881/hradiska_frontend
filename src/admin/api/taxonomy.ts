/**
 * Kategórie a štítky.
 *
 * Zápis smie iba staff (rola Authenticated) — práva sa nastavujú v
 * `hradiska-strapi/src/index.ts`, funkcia `setupStaffUserPermissions`.
 * Verejná rola má na oboje len čítanie.
 */

import { strapiFetch } from './client';

export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string | null;
  order?: number | null;
  /** Počet článkov — dopočítava sa zvlášť, Strapi ho v zozname nevracia. */
  posts?: number;
}

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  posts?: number;
}

/** Slug z názvu: bez diakritiky, malé písmená, spojovníky. */
export function toSlug(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Počty článkov pre VŠETKY kategórie a štítky naraz.
 *
 * Prvá verzia sa pýtala zvlášť na každý štítok — pri 230 štítkoch to bolo 230
 * dotazov a obrazovka sa načítavala niekoľko sekúnd. Teraz sa raz prejdú
 * články (len id + slugy väzieb, štyri stránky po 100) a počty sa zrátajú tu.
 */
async function countsBySlug(token: string): Promise<{ category: Map<string, number>; tags: Map<string, number> }> {
  const category = new Map<string, number>();
  const tags = new Map<string, number>();
  const bump = (m: Map<string, number>, slug?: string) => {
    if (slug) m.set(slug, (m.get(slug) ?? 0) + 1);
  };

  for (let page = 1; page <= 30; page++) {
    const r = await strapiFetch<any>(
      '/api/blog-posts?status=draft&fields[0]=id' +
      '&populate[category][fields][0]=slug&populate[tags][fields][0]=slug' +
      `&pagination[page]=${page}&pagination[pageSize]=100`,
      { token }
    ).catch(() => null);
    const rows = r?.data ?? [];
    for (const post of rows) {
      bump(category, post?.category?.slug);
      for (const t of post?.tags ?? []) bump(tags, t?.slug);
    }
    const p = r?.meta?.pagination;
    if (!p || page >= (p.pageCount ?? 1)) break;
  }
  return { category, tags };
}

// ── Kategórie ────────────────────────────────────────────────────────────────

export async function listCategories(token: string): Promise<Category[]> {
  const r = await strapiFetch<any>('/api/blog-categories?sort=order:asc&pagination[pageSize]=100', { token });
  const cats: Category[] = r.data ?? [];
  const { category } = await countsBySlug(token);
  return cats.map((c) => ({ ...c, posts: category.get(c.slug) ?? 0 }));
}

export async function createCategory(token: string, data: Partial<Category>) {
  const r = await strapiFetch<any>('/api/blog-categories', {
    method: 'POST', token,
    body: { data: { name: data.name, slug: data.slug, description: data.description || null, order: data.order ?? 99 } },
  });
  return r.data;
}

export async function updateCategory(token: string, documentId: string, data: Partial<Category>) {
  const body: any = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.slug !== undefined) body.slug = data.slug;
  if (data.description !== undefined) body.description = data.description || null;
  if (data.order !== undefined) body.order = data.order;
  const r = await strapiFetch<any>(`/api/blog-categories/${documentId}`, {
    method: 'PUT', token, body: { data: body },
  });
  return r.data;
}

export async function deleteCategory(token: string, documentId: string) {
  await strapiFetch(`/api/blog-categories/${documentId}`, { method: 'DELETE', token });
}

/** Uloží poradie po presunutí. Posiela len tie, ktorým sa `order` zmenil. */
export async function saveCategoryOrder(token: string, ordered: Category[]) {
  const changed = ordered
    .map((c, i) => ({ c, i }))
    .filter(({ c, i }) => c.order !== i);
  for (const { c, i } of changed) {
    await updateCategory(token, c.documentId, { order: i });
  }
  return changed.length;
}

// ── Štítky ───────────────────────────────────────────────────────────────────

export async function listTags(token: string): Promise<Tag[]> {
  const all: Tag[] = [];
  // Štítkov sú stovky — stránkuje sa, kým niečo chodí.
  for (let page = 1; page <= 20; page++) {
    const r = await strapiFetch<any>(
      `/api/blog-tags?sort=name:asc&pagination[page]=${page}&pagination[pageSize]=100`, { token }
    );
    all.push(...(r.data ?? []));
    const p = r?.meta?.pagination;
    if (!p || page >= (p.pageCount ?? 1)) break;
  }
  const { tags } = await countsBySlug(token);
  return all.map((t) => ({ ...t, posts: tags.get(t.slug) ?? 0 }));
}

export async function updateTag(token: string, documentId: string, data: Partial<Tag>) {
  const r = await strapiFetch<any>(`/api/blog-tags/${documentId}`, {
    method: 'PUT', token, body: { data: { name: data.name, ...(data.slug ? { slug: data.slug } : {}) } },
  });
  return r.data;
}

export async function deleteTag(token: string, documentId: string) {
  await strapiFetch(`/api/blog-tags/${documentId}`, { method: 'DELETE', token });
}

/**
 * Zlúčenie štítkov: články zdrojových štítkov sa preradia pod cieľový
 * a zdrojové sa vymažú.
 *
 * Strapi nevie „presunúť reláciu" jedným dotazom, takže sa to robí po článkoch:
 * ku každému sa pripojí cieľový štítok (`connect`) a odpoja zdrojové
 * (`disconnect`). Pole `tags` sa tým neprepíše celé, len sa upraví.
 */
export async function mergeTags(token: string, targetId: string, sourceIds: string[]) {
  let moved = 0;
  for (const sourceId of sourceIds) {
    if (sourceId === targetId) continue;
    const src = await strapiFetch<any>(`/api/blog-tags/${sourceId}`, { token });
    const slug = src?.data?.slug;
    if (!slug) continue;

    for (let guard = 0; guard < 50; guard++) {
      const r = await strapiFetch<any>(
        `/api/blog-posts?status=draft&filters[tags][slug][$eq]=${encodeURIComponent(slug)}&fields[0]=id&pagination[pageSize]=50`,
        { token }
      );
      const posts = r?.data ?? [];
      if (!posts.length) break;
      for (const p of posts) {
        await strapiFetch(`/api/blog-posts/${p.documentId}?status=draft`, {
          method: 'PUT', token,
          body: { data: { tags: { connect: [targetId], disconnect: [sourceId] } } },
        });
        moved++;
      }
    }
    await deleteTag(token, sourceId);
  }
  return moved;
}

/**
 * Dvojice štítkov, ktoré sú pravdepodobne to isté — líšia sa iba veľkosťou
 * písmen, diakritikou alebo medzerami. Porovnáva sa na klientovi.
 */
export function duplicatePairs(tags: Tag[]): [Tag, Tag][] {
  const key = (t: Tag) =>
    t.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const byKey = new Map<string, Tag[]>();
  for (const t of tags) {
    const k = key(t);
    if (!k) continue;
    byKey.set(k, [...(byKey.get(k) ?? []), t]);
  }
  const pairs: [Tag, Tag][] = [];
  for (const group of byKey.values()) {
    for (let i = 1; i < group.length; i++) pairs.push([group[0], group[i]]);
  }
  return pairs;
}
