/**
 * NÁHĽAD KONCEPTU VZHĽADU na verejnom webe (`?nahlad=vzhlad`).
 *
 * Sťahuje sa odložene — len v karte, ktorú otvoril editor vzhľadu
 * („Náhľad v novom okne") a len keď je v prehliadači prihlásenie redaktora
 * (`hradiska.admin.jwt`). Koncept dá iba backend a iba redaktorovi
 * (`GET /api/vzhlad-webu/koncept`); bez platného tokenu vráti 401 a web
 * ostane pri zverejnenom vzhľade.
 *
 * Koncept `null` (prázdny) = po zverejnení by web kreslil základný vzhľad,
 * takže náhľad ukáže ten.
 */

import { STRAPI_URL } from '../api-adresa';
import { ADMIN_TOKEN_KEY } from '../preview';
import { precitajOdpoved, ZAKLADNY_STAV, type StavVzhladu } from './nacitaj';

export async function nacitajNahlad(signal?: AbortSignal): Promise<StavVzhladu | null> {
  let token: string | null = null;
  try { token = window.localStorage.getItem(ADMIN_TOKEN_KEY); } catch { /* bez pamäte prehliadača niet náhľadu */ }
  if (!token) return null;
  try {
    const r = await fetch(`${STRAPI_URL}/api/vzhlad-webu/koncept`, { headers: { Authorization: `Bearer ${token}` }, signal, cache: 'no-store' });
    if (!r.ok) return null;
    const o = await r.json();
    if (!o || o.koncept == null) return { ...ZAKLADNY_STAV, zdroj: 'zvonka' };
    /* Verzia je len pre ETag verejného webu; náhľad sa nikdy neprepíše zverejneným. */
    return precitajOdpoved({ data: o.koncept, verzia: Number.MAX_SAFE_INTEGER, subory: o.subory, kategorie: o.kategorie, clanky: o.clanky }, 'zvonka');
  } catch {
    return null;
  }
}
