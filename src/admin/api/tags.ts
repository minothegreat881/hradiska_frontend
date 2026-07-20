/**
 * Štítky (blog-tag).
 *
 * Rola „Authenticated" má povolené find/findOne/create — mazanie zámerne nie,
 * aby sa štítok nedal odstrániť spod nôh iným článkom.
 */

import { strapiFetch } from './client';

export interface Tag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

/** Slug zo slovenského názvu — bez diakritiky, malé písmená, pomlčky. */
export function slugify(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function listTags(token: string, q?: string): Promise<Tag[]> {
  const parts = ['sort=name:asc', 'pagination[pageSize]=100'];
  if (q?.trim()) parts.push(`filters[name][$containsi]=${encodeURIComponent(q.trim())}`);
  const r = await strapiFetch<any>(`/api/blog-tags?${parts.join('&')}`, { token });
  return r.data ?? [];
}

/** Nájde štítok podľa názvu, a ak neexistuje, vytvorí ho. */
export async function findOrCreateTag(token: string, name: string): Promise<Tag> {
  const clean = name.trim();
  const slug = slugify(clean);

  const found = await strapiFetch<any>(
    `/api/blog-tags?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
    { token }
  );
  if (found.data?.[0]) return found.data[0];

  const created = await strapiFetch<any>('/api/blog-tags', {
    method: 'POST', token, body: { data: { name: clean, slug } },
  });
  return created.data;
}
