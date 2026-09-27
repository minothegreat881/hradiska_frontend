/**
 * ADRESA API — jedno miesto pre celý web aj pre budúcu mobilnú aplikáciu.
 *
 * Doteraz mal ten istý riadok vlastnú kópiu v dvanástich súboroch. Na webe to
 * fungovalo, lebo všetky kópie hovorili to isté. Problém by nastal až
 * v natívnej schránke (Capacitor): tam je `window.location.origin` niečo ako
 * `capacitor://localhost`, takže by všetkých dvanásť volaní mierilo do
 * prázdna — a opravovať by sa to muselo na dvanástich miestach.
 *
 * TRI PROSTREDIA, TRI ODPOVEDE:
 *
 *   1. vývoj              → `http://localhost:1337` (alebo `VITE_STRAPI_URL`)
 *   2. web v prehliadači  → rovnaký pôvod + `/strapi`
 *      Vercel prepisuje `/strapi/*` na Hetzner, takže volania idú cez jeho
 *      sieť aj s vyrovnávacou pamäťou a bez CORS.
 *   3. natívna aplikácia  → celá adresa produkcie
 *      Pôvod `capacitor://localhost` nie je web, takže sa k nemu nedá nič
 *      pripojiť. Ide sa priamo na doménu — zámerne na tú istú, aby appka
 *      ťažila z tej istej vyrovnávacej pamäte ako web.
 *
 * Pri prerenderi (Node, bez `window`) ostáva relatívna `/strapi`, presne ako
 * doteraz — hlavičky sa skladajú na serveri a absolútna adresa by tam bola
 * chyba.
 */

/** Adresa, na ktorú ide natívna aplikácia. Po presťahovaní na vlastnú doménu
    sa mení TU, nikde inde. Dá sa prebiť premennou `VITE_STRAPI_URL`. */
const PRODUKCNY_ZAKLAD = 'https://webdesignforhradiskask.vercel.app/strapi';

function urcAdresu(): string {
  const nastavena = (import.meta as any).env?.VITE_STRAPI_URL;
  if (nastavena) return String(nastavena).replace(/\/$/, '');

  if (!(import.meta as any).env?.PROD) return 'http://localhost:1337';

  // Prerender beží v Node — tam `window` nie je a adresa ostáva relatívna.
  if (typeof window === 'undefined') return '/strapi';

  const povod = window.location.origin;
  if (povod.startsWith('http')) return povod + '/strapi';

  // `capacitor://`, `file://` — natívna schránka.
  return PRODUKCNY_ZAKLAD;
}

export const STRAPI_URL = urcAdresu();

/** Beží to v natívnej schránke? Používa sa tam, kde sa web a appka líšia. */
export const jeNatvnaSchranka = (): boolean =>
  typeof window !== 'undefined' && !window.location.origin.startsWith('http');

/**
 * Cesta k súboru zo Strapi na úplnú adresu.
 *
 * Strapi vracia cesty relatívne k svojmu koreňu (`/uploads/…`). Bez predpony
 * ich prehliadač hľadá na frontende a obrázok sa nenačíta — v natívnej
 * schránke by sa nenačítal vôbec nikdy.
 */
export const naAdresuSuboru = (u: string | null | undefined): string | null =>
  u ? (u.startsWith('http') ? u : STRAPI_URL + u) : null;
