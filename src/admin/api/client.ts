/**
 * HTTP klient pre admin → Strapi.
 *
 * Všetky volania idú cez `strapiFetch`, aby bolo na jednom mieste:
 *   - pridanie JWT hlavičky
 *   - preklad chýb Strapi do zrozumiteľnej správy
 *   - odhlásenie pri 401/403 (vypršaný alebo odobratý token)
 *
 * Overené proti bežiacemu Strapi 5.31.3 — endpointy a semantika nižšie nie sú
 * odhad, ale odskúšaný stav (vrátane toho, že `actions/publish` NEEXISTUJE).
 */

export const STRAPI_URL =
  (import.meta as any).env?.PROD ? '/strapi' : ((import.meta as any).env?.VITE_STRAPI_URL || 'http://localhost:1337');

/** Chyba z API so zachovaným stavovým kódom, nech sa dá rozlíšiť 401 od 400. */
export class StrapiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'StrapiError';
    this.status = status;
    this.details = details;
  }
}

/** Zavolá sa pri 401/403 — nastavuje ho AuthProvider. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

interface FetchOpts extends Omit<RequestInit, 'body'> {
  token?: string | null;
  /** JSON telo — serializuje sa samo. Pre FormData použi `raw`. */
  body?: unknown;
  /** Surové telo (FormData pri uploade) — Content-Type sa nenastavuje. */
  raw?: BodyInit;
}

export async function strapiFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { token, body, raw, headers, ...rest } = opts;

  const h: Record<string, string> = { ...(headers as Record<string, string>) };
  if (token) h.Authorization = `Bearer ${token}`;
  // FormData si Content-Type (aj boundary) nastavuje sám — nesmieme ho prepísať.
  if (body !== undefined && !raw) h['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${STRAPI_URL}${path}`, {
      ...rest,
      headers: h,
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new StrapiError(0, 'Strapi neodpovedá. Beží server na ' + STRAPI_URL + '?');
  }

  if (res.status === 401 || res.status === 403) {
    onUnauthorized?.();
    throw new StrapiError(res.status, 'Prihlásenie vypršalo alebo nemáte oprávnenie.');
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let json: any = null;
  if (text) {
    try { json = JSON.parse(text); } catch { /* nie JSON — nechaj null */ }
  }

  if (!res.ok) {
    const msg = json?.error?.message || `Chyba ${res.status}`;
    throw new StrapiError(res.status, translateError(res.status, msg), json?.error?.details);
  }

  return json as T;
}

/** Zrozumiteľnejšie hlášky pre bežné prípady. */
function translateError(status: number, raw: string): string {
  if (status === 400 && /unique/i.test(raw)) return 'Taký slug už existuje. Zvoľte iný.';
  if (status === 400) return `Neplatné údaje: ${raw}`;
  if (status === 404) return 'Záznam sa nenašiel.';
  if (status >= 500) return 'Chyba na strane Strapi. Skúste znova.';
  return raw;
}

/**
 * Poskladá query string. Strapi očakáva zátvorkovú notáciu
 * (`filters[slug][$eq]=x`), preto sa kľúče nekódujú, len hodnoty.
 */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}
