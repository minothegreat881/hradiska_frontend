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
 *      Vnútri appky je pôvod `https://localhost` (Android) alebo
 *      `capacitor://localhost` (iOS) — na oboch nie je čo obslúžiť, takže
 *      sa ide priamo na doménu. Zámerne na tú istú ako web, aby appka
 *      ťažila z tej istej vyrovnávacej pamäte.
 *
 * POZOR NA `https://localhost`: keď Android otvára appku cez `androidScheme:
 * 'https'`, pôvod **začína na `http`**, takže podľa neho sa natívna schránka
 * rozoznať nedá. Appka sa preto hlási značkou `window.__HRADISKA_APP__`,
 * ktorú do `index.html` vkladá `scripts/priprav-app.mjs`. Bez toho appka
 * posielala volania na `https://localhost/strapi`, nenačítala nič a ostala
 * visieť na úvodnej obrazovke — a na webe sa tá chyba nedala uvidieť.
 *
 * Pri prerenderi (Node, bez `window`) ostáva relatívna `/strapi`, presne ako
 * doteraz — hlavičky sa skladajú na serveri a absolútna adresa by tam bola
 * chyba.
 */

/** Adresa, na ktorú ide natívna aplikácia. Po presťahovaní na vlastnú doménu
    sa mení TU, nikde inde. Dá sa prebiť premennou `VITE_API_ADRESA`. */
const PRODUKCNY_ZAKLAD = 'https://webdesignforhradiskask.vercel.app/strapi';

/**
 * Beží to vnútri nainštalovanej aplikácie?
 *
 * Tri nezávislé odpovede, lebo ani jedna sama nestačí:
 *   • značka z balíka appky — jediná, ktorá platí vždy a hneď,
 *   • most Capacitora — keby sa balík raz robil inak,
 *   • pôvod, ktorý nie je web (`capacitor://`, `file://`) — staršie appky.
 */
function vNatvnejSchranke(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  if (w.__HRADISKA_APP__ === true) return true;
  try {
    if (w.Capacitor?.isNativePlatform?.()) return true;
  } catch {
    /* most nemusí byť pripravený — nevadí, značka rozhodla vyššie */
  }
  return !/^https?:/.test(window.location.origin);
}

function urcAdresu(): string {
  const env = (import.meta as any).env;

  /* VÝVOJ. `VITE_STRAPI_URL` platí LEN tu — v produkcii sa nesmie pozerať.
     Vo Verceli tá premenná ostala nastavená na dávno zrušený cloudflare
     tunel a keď sa na ňu produkcia na chvíľu spoliehala, prestali sa načítať
     články (ERR_NAME_NOT_RESOLVED). Poradie je tu úmyselné, nie náhodné. */
  if (!env?.PROD) return String(env?.VITE_STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');

  // Prerender beží v Node — tam `window` nie je a adresa ostáva relatívna.
  if (typeof window === 'undefined') return '/strapi';

  /* Natívna schránka. Vlastná premenná, nie `VITE_STRAPI_URL`: tú nastavuje
     web a appka ju nesmie zdediť. */
  if (vNatvnejSchranke()) return String(env?.VITE_API_ADRESA || PRODUKCNY_ZAKLAD).replace(/\/$/, '');

  return window.location.origin + '/strapi';
}

export const STRAPI_URL = urcAdresu();

/** Beží to v natívnej schránke? Používa sa tam, kde sa web a appka líšia. */
export const jeNatvnaSchranka = (): boolean => vNatvnejSchranke();

/**
 * Cesta k súboru zo Strapi na úplnú adresu.
 *
 * Strapi vracia cesty relatívne k svojmu koreňu (`/uploads/…`). Bez predpony
 * ich prehliadač hľadá na frontende a obrázok sa nenačíta — v natívnej
 * schránke by sa nenačítal vôbec nikdy.
 */
export const naAdresuSuboru = (u: string | null | undefined): string | null =>
  u ? (u.startsWith('http') ? u : STRAPI_URL + u) : null;
