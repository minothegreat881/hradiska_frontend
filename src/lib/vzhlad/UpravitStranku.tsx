/**
 * „Upraviť túto stránku" — odkaz z verejného webu do editora vzhľadu.
 *
 * Kreslí ho `App` len vtedy, keď je v prehliadači uložené prihlásenie do
 * administrácie (`hradiska.admin.jwt`, ten istý kľúč ako náhľad konceptu
 * článku). Je to iba odkaz — či prihlásenie ešte platí, overí administrácia.
 * Návštevník bez prihlásenia nedostane do stránky nič, ani tento súbor
 * (sťahuje sa odložene).
 *
 * Cieľ podľa stránky: domovská → `#/vzhlad/domov`, kategória →
 * `#/vzhlad/kategoria/<slug>`, všade inde hlavička a päta → `#/vzhlad/menu`.
 */

export function cielUpravy(route: string, slug?: string): string {
  if (route === 'home') return '/admin#/vzhlad/domov';
  if (route === 'category' && slug) return `/admin#/vzhlad/kategoria/${encodeURIComponent(slug)}`;
  return '/admin#/vzhlad/menu';
}

export function UpravitStranku({ route, slug }: { route: string; slug?: string }) {
  return (
    <a className="vw-upravit" href={cielUpravy(route, slug)} title="Otvorí túto stránku v editore vzhľadu v administrácii">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      <span>Upraviť túto stránku</span>
    </a>
  );
}

export default UpravitStranku;
