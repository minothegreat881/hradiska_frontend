/**
 * Náhľad konceptu článku na verejnom webe.
 *
 * Web štandardne číta len PUBLIKOVANÚ verziu. Koncept sa načíta iba vtedy,
 * keď platia obe podmienky naraz:
 *   1. URL má `?preview=draft` (tak ju otvára tlačidlo „Náhľad" v editore),
 *   2. v prehliadači je uložený JWT prihláseného správcu (ten istý kľúč,
 *      pod ktorý ho ukladá admin).
 * Bez tokenu sa stránka správa presne ako doteraz. O tom, či token smie
 * čítať koncepty, rozhoduje Strapi (rola Authenticated), nie tento súbor.
 */

/** Kľúč v localStorage, pod ktorým admin drží JWT. Zdieľa ho `admin/AuthContext`. */
export const ADMIN_TOKEN_KEY = 'hradiska.admin.jwt';

/** Vráti JWT správcu, ak si stránka pýta náhľad konceptu; inak null. */
export function getDraftPreviewToken(): string | null {
  try {
    if (new URLSearchParams(window.location.search).get('preview') !== 'draft') return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}
