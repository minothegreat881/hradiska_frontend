'use client';

/**
 * Volania na Strapi pre pripomienky.
 *
 * Písať a čítať smie KTOKOĽVEK, aj neprihlásený — web je zatiaľ technický a
 * testeri naň dostávajú odkaz. Keď je v prehliadači uložené prihlásenie do
 * administrácie (`hradiska.admin.jwt`), pošle sa a redaktor navyše smie meniť
 * stav a mazať. O právach rozhoduje server, nie toto.
 */

import { ADMIN_TOKEN_KEY } from '../lib/preview';

const STRAPI_URL = import.meta.env.PROD
  ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi')
  : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

export type Druh = 'chyba' | 'obsah';
export type Stav = 'nova' | 'riesi-sa' | 'hotova' | 'zamietnuta';

export interface Pripomienka {
  documentId: string;
  text: string;
  druh: Druh;
  stav: Stav;
  url: string;
  nadpisStranky: string | null;
  selektor: string | null;
  popisPrvku: string | null;
  otisokTextu: string | null;
  x: number | null;
  y: number | null;
  sirkaOkna: number | null;
  zariadenie: string | null;
  autor: string | null;
  createdAt: string;
}

export function adminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
}

async function zavolaj<T>(cesta: string, init?: RequestInit): Promise<T> {
  const token = adminToken();
  const r = await fetch(`${STRAPI_URL}${cesta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}

const zoRiadku = (r: any): Pripomienka => ({
  documentId: r.documentId,
  text: r.text ?? '',
  druh: r.druh ?? 'chyba',
  stav: r.stav ?? 'nova',
  url: r.url ?? '',
  nadpisStranky: r.nadpisStranky ?? null,
  selektor: r.selektor ?? null,
  popisPrvku: r.popisPrvku ?? null,
  otisokTextu: r.otisokTextu ?? null,
  x: typeof r.x === 'number' ? r.x : null,
  y: typeof r.y === 'number' ? r.y : null,
  sirkaOkna: r.sirkaOkna ?? null,
  zariadenie: r.zariadenie ?? null,
  autor: r.user?.username ?? null,
  createdAt: r.createdAt,
});

/** Pripomienky tejto stránky. Hotové a zamietnuté sa na webe nekreslia. */
export async function preStranku(url: string): Promise<Pripomienka[]> {
  const q = [
    `filters[url][$eq]=${encodeURIComponent(url)}`,
    'filters[stav][$in][0]=nova',
    'filters[stav][$in][1]=riesi-sa',
    'populate[user][fields][0]=username',
    'sort=createdAt:asc',
    'pagination[pageSize]=100',
  ].join('&');
  const r = await zavolaj<any>(`/api/pripomienky?${q}`);
  return (r.data ?? []).map(zoRiadku);
}

/** Jedna pripomienka podľa id — pre odkaz „otvoriť na mieste". */
export async function jedna(documentId: string): Promise<Pripomienka | null> {
  try {
    const r = await zavolaj<any>(`/api/pripomienky/${documentId}?populate[user][fields][0]=username`);
    return r?.data ? zoRiadku(r.data) : null;
  } catch { return null; }
}

export async function pridaj(data: {
  text: string; druh: Druh; url: string; nadpisStranky: string;
  selektor: string; popisPrvku: string; otisokTextu: string;
  x: number; y: number; sirkaOkna: number;
}): Promise<Pripomienka> {
  const r = await zavolaj<any>('/api/pripomienky', { method: 'POST', body: JSON.stringify({ data }) });
  return zoRiadku(r.data);
}

export const zmenStav = (documentId: string, stav: Stav) =>
  zavolaj(`/api/pripomienky/${documentId}`, { method: 'PUT', body: JSON.stringify({ data: { stav } }) });

export const zmaz = (documentId: string) =>
  zavolaj(`/api/pripomienky/${documentId}`, { method: 'DELETE' });

/**
 * Je to redaktor? Podľa uloženého prihlásenia do administrácie.
 *
 * Slúži LEN na to, čo sa ukáže v rozhraní (meniť stav, mazať, odkaz do
 * administrácie). O skutočnom práve rozhoduje server: hosťovi vráti na tie
 * akcie 403, nech si v prehliadači nastaví čokoľvek.
 */
export const jeRedaktor = (): boolean => !!adminToken();
