/**
 * GDPR cookie-consent — stav súhlasu + gating analytiky.
 *
 * Princíp: pred udelením súhlasu sa NESMIE načítať žiadny analytický skript.
 * Súhlas sa ukladá do localStorage s verziou — pri zmene znenia stačí zvýšiť
 * CONSENT_VERSION a banner sa zobrazí znova.
 *
 * Kategórie:
 *   - necessary  … vždy zapnuté (prihlásenie/JWT, consent sám) — nedá sa vypnúť
 *   - analytics  … voliteľné (Umami/Plausible – zatiaľ NENAPOJENÉ, viď initAnalytics)
 */
export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'cookie-consent';
const EVT_CHANGED = 'hradiska:consent-changed';
export const EVT_OPEN_SETTINGS = 'hradiska:open-cookie-settings';

export type Consent = {
  v: number;        // verzia znenia
  ts: number;       // timestamp rozhodnutia
  analytics: boolean;
};

/** Prečíta uložený súhlas. null = ešte nerozhodnuté alebo neplatná/stará verzia. */
export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Consent;
    if (!c || typeof c.analytics !== 'boolean' || c.v !== CONSENT_VERSION) return null;
    return c;
  } catch {
    return null;
  }
}

/** true, ak už používateľ rozhodol (v aktuálnej verzii znenia). */
export function hasDecided(): boolean {
  return getConsent() !== null;
}

/** Uloží rozhodnutie a upozorní appku (event) — podľa toho sa (ne)spustí analytika. */
export function setConsent(analytics: boolean): void {
  const c: Consent = { v: CONSENT_VERSION, ts: Date.now(), analytics };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* localStorage nedostupné (napr. privátny režim) — pokračuj, len sa nezapamätá */
  }
  window.dispatchEvent(new CustomEvent(EVT_CHANGED, { detail: c }));
  applyConsent(c);
}

/** Prihlásenie sa na zmenu súhlasu. Vráti odhlasovaciu funkciu. */
export function onConsentChange(cb: (c: Consent) => void): () => void {
  const h = (e: Event) => cb((e as CustomEvent).detail as Consent);
  window.addEventListener(EVT_CHANGED, h);
  return () => window.removeEventListener(EVT_CHANGED, h);
}

/** Otvorí panel „Zvyky hradiska" (nastavenia) — volá sa z pätičky/zásad. */
export function openCookieSettings(): void {
  window.dispatchEvent(new CustomEvent(EVT_OPEN_SETTINGS));
}

/**
 * Spustí/zastaví analytiku podľa súhlasu. Zatiaľ NO-OP placeholder — analytika
 * (Umami/Plausible) ešte nie je napojená. Keď bude, sem príde jediné miesto,
 * kde sa jej skript načíta — a LEN ak `c.analytics === true`.
 */
let analyticsLoaded = false;
export function applyConsent(c: Consent | null): void {
  if (c?.analytics && !analyticsLoaded) {
    analyticsLoaded = true;
    // TODO (produkcia): načítať Umami/Plausible skript (bez cookies, GDPR-friendly).
    // napr. dynamicky <script defer data-website-id=… src="https://…/script.js">.
    // Pred týmto bodom sa NESMIE načítať nič analytické.
  }
}

/** Zavolať raz pri štarte appky — ak už je súhlas, aplikuje ho (napr. spustí analytiku). */
export function initConsent(): void {
  applyConsent(getConsent());
}
