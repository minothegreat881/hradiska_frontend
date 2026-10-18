/**
 * KONTEXT VZHĽADU — odkiaľ komponenty webu berú dlaždice, sekcie, menu, pätu…
 *
 * Verejný web: `App` obalí stránku `<VzhladProvider>` bez hodnoty. Provider
 * začne vloženým vzhľadom z HTML (inak základným) a hneď stiahne zverejnený
 * vzhľad z API; keď je novší, prekreslí sa (`nacitaj.ts`).
 *
 * Editor v administrácii: obalí plátno vlastným providerom s konceptom
 * a zapne režim úprav:
 *
 *   <VzhladProvider hodnota={{ vzhlad, rozriesene, upravy: true }}>
 *
 * V režime úprav komponenty pridajú prvkom `data-vw="…"` (názvy sú
 * v `docs/VZHLAD-WEBU.md`), skryté prvky nakreslia s `data-vw-skryte="1"`
 * namiesto vynechania, mapa sa nenačíta a animácie sú vypnuté. Mimo režimu
 * úprav nepribudne do DOM nič.
 *
 * Náhľad konceptu v novom okne (`?nahlad=vzhlad`, otvára ho editor): keď je
 * v prehliadači prihlásenie redaktora, provider namiesto zverejneného vzhľadu
 * stiahne s tokenom KONCEPT (`nahlad.ts`, sťahuje sa odložene) a dole ukáže
 * pás „Náhľad konceptu". Bez tokenu sa nestane nič — web ostane, ako je.
 * Náhľad platí v tej karte, kým ho redaktor neukončí (`sessionStorage`).
 */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EditModeContext } from '../../components/EditModeContext';
import {
  ZAKLADNY_STAV, PRAZDNE_ROZRIESENE, ocistiVzhlad, stiahniVzhlad, uvodnyStav,
  type StavVzhladu, type ZdrojVzhladu,
} from './nacitaj';
import type { Vzhlad, Rozriesene } from './typy';

export interface HodnotaVzhladu {
  vzhlad: Vzhlad;
  rozriesene: Rozriesene;
  /** Režim úprav (plátno editora). Na verejnom webe vždy `false`. */
  upravy: boolean;
  /** Náhľad konceptu (`?nahlad=vzhlad`): poradie menu a fotogaléria z konceptu ako na plátne, bez značiek úprav. */
  nahlad: boolean;
  zdroj: ZdrojVzhladu;
}

const VzhladKontext = createContext<HodnotaVzhladu>({
  vzhlad: ZAKLADNY_STAV.vzhlad,
  rozriesene: ZAKLADNY_STAV.rozriesene,
  upravy: false,
  nahlad: false,
  zdroj: 'zakladny',
});

/** Vzhľad pre komponenty. Bez providera vracia základný vzhľad. */
export const useVzhlad = (): HodnotaVzhladu => useContext(VzhladKontext);

/** Skratka: je zapnutý režim úprav? */
export const useUpravy = (): boolean => useContext(VzhladKontext).upravy;

export interface VzhladProviderProps {
  /**
   * Hodnota zvonka (editor). Keď je zadaná, provider nič nesťahuje.
   * Vzhľad sa aj tak prečíta tolerantne — nečitateľné časti nahradí základný.
   */
  hodnota?: { vzhlad: Vzhlad | null; rozriesene?: Rozriesene | null; upravy?: boolean };
  children: ReactNode;
}

/**
 * Len vo vývoji (`npm run dev`): `?vzhlad-upravy` zapne režim úprav na
 * verejnom webe — na skúšku značiek `data-vw` a snímky bez editora
 * (`scripts/vzhlad/snimky-upravy.mjs`). V produkčnom builde je
 * `import.meta.env.DEV` vždy `false` a vetva z balíka vypadne.
 */
const UPRAVY_VO_VYVOJI = !!(import.meta as { env?: { DEV?: boolean } }).env?.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).has('vzhlad-upravy');

/** Kľúč náhľadu konceptu v `sessionStorage` — náhľad prežije preklik na ďalšiu stránku webu. */
const KLUC_NAHLADU = 'hradiska.vzhlad.nahlad';

/** Chce táto karta náhľad konceptu a je v prehliadači prihlásenie redaktora? */
function chceNahlad(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const zAdresy = new URLSearchParams(window.location.search).get('nahlad') === 'vzhlad';
    if (zAdresy) window.sessionStorage.setItem(KLUC_NAHLADU, '1');
    if (!zAdresy && window.sessionStorage.getItem(KLUC_NAHLADU) !== '1') return false;
    return !!window.localStorage.getItem('hradiska.admin.jwt');
  } catch {
    return false;
  }
}

function ukonciNahlad() {
  try { window.sessionStorage.removeItem(KLUC_NAHLADU); } catch { /* nič */ }
  const u = new URL(window.location.href);
  u.searchParams.delete('nahlad');
  window.location.href = u.pathname + u.search + u.hash;
}

/** Pás v náhľade konceptu — návštevník ho nikdy neuvidí (náhľad potrebuje prihlásenie). */
function PasNahladu() {
  return (
    <div role="status" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10005, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '8px 14px', background: '#2f2418', color: '#f7efdc', font: '500 13px Inter, system-ui, sans-serif' }}>
      <span>Náhľad konceptu vzhľadu — takto bude web vyzerať po zverejnení. Návštevníci ho zatiaľ nevidia.</span>
      <button type="button" onClick={ukonciNahlad} style={{ border: '1px solid #c98a3c', background: 'none', color: '#f7efdc', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', font: 'inherit' }}>
        Ukončiť náhľad
      </button>
    </div>
  );
}

export function VzhladProvider({ hodnota, children }: VzhladProviderProps) {
  const zvonka = hodnota !== undefined;
  const [stav, setStav] = useState<StavVzhladu>(() => (zvonka ? ZAKLADNY_STAV : uvodnyStav()));
  const [nahlad, setNahlad] = useState(false);

  useEffect(() => {
    if (zvonka) return;
    const ovladac = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let zrusene = false;
    if (chceNahlad()) {
      import('./nahlad')
        .then((m) => m.nacitajNahlad(ovladac?.signal))
        .then((n) => { if (!zrusene && n) { setStav(n); setNahlad(true); } })
        .catch(() => { /* náhľad sa nepodaril — ostáva zverejnený vzhľad */ });
      return () => { zrusene = true; ovladac?.abort(); };
    }
    stiahniVzhlad(stav.verzia, ovladac?.signal).then((novy) => {
      if (!zrusene && novy) setStav(novy);
    });
    return () => { zrusene = true; ovladac?.abort(); };
    /* Raz po pripojení — ďalšia zmena sa prejaví po novom načítaní stránky. */
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [zvonka]);

  const vzhladZvonka = hodnota?.vzhlad;
  const ocisteny = useMemo(() => (zvonka ? ocistiVzhlad(vzhladZvonka) : null), [zvonka, vzhladZvonka]);

  const rozriesenaZvonka = hodnota?.rozriesene;
  const upravy = zvonka ? !!hodnota?.upravy : UPRAVY_VO_VYVOJI;
  const vysledok = useMemo<HodnotaVzhladu>(() => {
    if (zvonka) {
      return {
        vzhlad: ocisteny ?? ZAKLADNY_STAV.vzhlad,
        rozriesene: rozriesenaZvonka ?? PRAZDNE_ROZRIESENE,
        upravy,
        nahlad: false,
        zdroj: 'zvonka',
      };
    }
    return { vzhlad: stav.vzhlad, rozriesene: stav.rozriesene, upravy, nahlad, zdroj: stav.zdroj };
  }, [zvonka, ocisteny, rozriesenaZvonka, upravy, nahlad, stav]);

  /* Režim úprav zároveň vypína zjavovanie pri posune (ScrollReveal, médiá
     článku) — na plátne v iframe by sa pozorovanie nespustilo a obsah by
     ostal priehľadný. Na webe sa kontext úprav nevkladá vôbec. */
  const obsah = (
    <VzhladKontext.Provider value={vysledok}>
      {children}
      {nahlad && <PasNahladu />}
    </VzhladKontext.Provider>
  );
  return upravy ? <EditModeContext.Provider value>{obsah}</EditModeContext.Provider> : obsah;
}

export default VzhladProvider;
