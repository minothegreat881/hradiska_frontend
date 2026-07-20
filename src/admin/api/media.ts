/**
 * Knižnica médií.
 *
 * ⚠️ Upload plugin sa správa INAK než content API (overené):
 *   - `/api/upload/files` vracia HOLÉ POLE, bez `data`/`meta` obálky
 *   - **`pagination[pageSize]` IGNORUJE** — bez parametrov vráti VŠETKÝCH
 *     5 424 súborov naraz, čo je 7,43 MB na jeden dotaz
 *   - stránkuje sa len cez `start` + `limit` (s limit=50 je to 0,06 MB)
 *   - `/api/upload/files/count` NEEXISTUJE (404), takže celkový počet
 *     sa nedá zistiť lacno → UI používa „Načítať ďalšie", nie čísla strán
 *   - `filters[name][$containsi]` funguje
 */

import { strapiFetch, STRAPI_URL } from './client';

export interface MediaFile {
  id: number;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  /** v KB, tak to ukladá Strapi */
  size: number;
  mime: string;
  url: string;
  formats?: Record<string, { url: string; width: number; height: number }>;
  createdAt: string;
}

export const PAGE = 48;

export function fileUrl(f: MediaFile, size: 'thumbnail' | 'small' | 'medium' | 'original' = 'thumbnail') {
  const raw = size === 'original' ? f.url : (f.formats?.[size]?.url ?? f.url);
  return raw.startsWith('http') ? raw : STRAPI_URL + raw;
}

export async function listFiles(opts: {
  token: string;
  start?: number;
  limit?: number;
  q?: string;
}): Promise<MediaFile[]> {
  const { token, start = 0, limit = PAGE, q } = opts;
  // POZOR: `limit` je jediný spôsob, ako obmedziť odpoveď — bez neho príde 7,4 MB.
  const parts = [`start=${start}`, `limit=${limit}`, 'sort=createdAt:desc'];
  if (q?.trim()) parts.push(`filters[name][$containsi]=${encodeURIComponent(q.trim())}`);

  const res = await strapiFetch<MediaFile[] | { data: MediaFile[] }>(
    `/api/upload/files?${parts.join('&')}`, { token }
  );
  return Array.isArray(res) ? res : (res as any).data ?? [];
}

/** Nahranie súborov. Strapi čaká multipart s poľom `files`. */
export async function uploadFiles(token: string, files: File[]): Promise<MediaFile[]> {
  const fd = new FormData();
  files.forEach(f => fd.append('files', f));
  // Content-Type sa NESMIE nastaviť ručne — prehliadač doplní boundary.
  const res = await strapiFetch<MediaFile[]>('/api/upload', {
    method: 'POST', token, raw: fd,
  });
  return Array.isArray(res) ? res : [];
}

export async function deleteFile(token: string, id: number) {
  return strapiFetch(`/api/upload/files/${id}`, { method: 'DELETE', token });
}
