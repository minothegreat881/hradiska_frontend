/**
 * BLOKOVANIE ČLENA — zoznam účtov, ktorých príspevky nechcem vidieť.
 *
 * Kto si niekoho zablokuje, prestane vidieť jeho komentáre. Nie je to trest
 * ani moderácia: autor o tom nevie a ostatným sa jeho príspevky zobrazujú
 * ďalej.
 *
 * FILTRUJE SA TU, V PREHLIADAČI. Zoznam komentárov sa ťahá bez tokenu (viď
 * poznámku v `CommentSection.tsx`), takže server pri čítaní ani nevie, kto
 * sa pýta. Komentáre preto nesú číslo účtu autora (`authorId`) a odfiltruje
 * ich prehliadač.
 */

import { useCallback, useEffect, useState } from 'react';
import { STRAPI_URL } from './api-adresa';

export interface Blokovany {
  documentId: string;
  kohoId: number;
  kohoMeno: string;
}

async function volaj<T>(cesta: string, token: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${STRAPI_URL}/api${cesta}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  if (!r.ok) throw new Error(String(r.status));
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export const nacitajBlokovanych = (token: string) =>
  volaj<{ data: Blokovany[] }>('/blokovania/moje', token).then((r) => r.data || []);

export const zablokuj = (token: string, kohoId: number) =>
  volaj<{ data: any }>('/blokovania', token, { method: 'POST', body: JSON.stringify({ data: { kohoId } }) });

export const odblokuj = (token: string, documentId: string) =>
  volaj<void>(`/blokovania/${documentId}`, token, { method: 'DELETE' });

/**
 * Zoznam zablokovaných pre prihláseného člena.
 *
 * Bez prihlásenia je prázdny — a to je správne: blokovanie je osobné
 * nastavenie, nie vlastnosť obsahu.
 */
export function useBlokovani(token: string | null) {
  const [zoznam, setZoznam] = useState<Blokovany[]>([]);

  const obnov = useCallback(() => {
    if (!token) { setZoznam([]); return; }
    nacitajBlokovanych(token).then(setZoznam).catch(() => { /* bez zoznamu sa len nič neskryje */ });
  }, [token]);

  useEffect(() => { obnov(); }, [obnov]);

  const idcka = new Set(zoznam.map((b) => b.kohoId));
  return { zoznam, idcka, obnov };
}

/**
 * Odfiltruje príspevky zablokovaných autorov aj s ich odpoveďami.
 *
 * Pracuje na plochom zozname PRED zostavením stromu — inak by odpoveď na
 * skrytý komentár ostala visieť bez toho, na čo odpovedá.
 */
export function bezBlokovanych<T extends { authorId?: number | null; documentId?: string; inReplyTo?: string | null }>(
  polozky: T[],
  idcka: Set<number>
): T[] {
  if (!idcka.size) return polozky;

  const skryte = new Set<string>();
  for (const p of polozky) {
    if (p.authorId && idcka.has(p.authorId) && p.documentId) skryte.add(p.documentId);
  }
  /* Aj odpovede pod skrytým komentárom. Opakuje sa, kým pribúdajú — vlákno
     môže mať viac úrovní. */
  let pribudlo = true;
  while (pribudlo) {
    pribudlo = false;
    for (const p of polozky) {
      if (p.inReplyTo && skryte.has(p.inReplyTo) && p.documentId && !skryte.has(p.documentId)) {
        skryte.add(p.documentId);
        pribudlo = true;
      }
    }
  }
  return polozky.filter((p) => !(p.documentId && skryte.has(p.documentId)));
}
