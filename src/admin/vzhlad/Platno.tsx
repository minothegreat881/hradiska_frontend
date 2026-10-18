'use client';

/**
 * PLÁTNO EDITORA VZHĽADU — skutočné komponenty webu v okne (`CanvasFrame`),
 * obalené `VzhladProvider` s konceptom a režimom úprav.
 *
 *   Domovská:        LabNav · LabKategorieVysuv · LabHome · LabJoinUs · LabFooter
 *   Kategória:       LabNav · LabKategorieVysuv · CategoryPage · LabFooter
 *   Hlavička a päta: LabNav (rozbalené, s druhým riadkom) · LabKategorieLista · LabFooter
 *
 * Jazyk plátna: administrácia beží na `/admin`, teda slovensky; plátno si
 * jazyk nastaví cez `nastavJazykPlatna` (len pre plátno, verejný web ho
 * nepoužíva) a pri zmene jazyka sa stránka nakreslí nanovo.
 *
 * Okno plátna vs. okno administrácie: CSS media dotazy v okne plátna platia
 * samy. JS dotazy (`window.matchMedia` v komponentoch webu — mozaika
 * fotogalérie, popis poľa hľadania) by sa však pýtali okna administrácie;
 * kým je editor otvorený, `window.matchMedia` sa preto pýta okna plátna.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CanvasFrame, type CanvasZoom } from '../editor/platno/CanvasFrame';
import { nastavJazykPlatna } from '../../lib/jazyk';
import { VzhladProvider } from '../../lib/vzhlad/VzhladContext';
import { LabNav } from '../../design-lab/LabNav';
import { LabKategorieVysuv } from '../../design-lab/LabKategorieVysuv';
import { LabHome } from '../../design-lab/LabHome';
import { LabJoinUs } from '../../design-lab/LabJoinUs';
import { LabFooter } from '../../design-lab/LabFooter';
import LabKategorieLista from '../../design-lab/LabKategorieLista';
import { CategoryPage } from '../../pages/CategoryPage';
import type { Jazyk, Rozriesene, Vzhlad } from '../../lib/vzhlad/typy';
import type { Stranka } from './stav/KonceptKontext';
import { Vrstva, type AkciaVrstvy, type UpozornenieNaPlatne } from './Vrstva';
import type { KategoriaVDb } from './stav/operacie';

/** Obrázok kategórie ako kľúč (id/cesta + výrez). */
function klucObrazka(v: Vzhlad, slug: string): string {
  const o = v.kategorie.find((k) => k.kategoria.slug === slug)?.obrazok;
  return o ? `${'id' in o ? o.id : o.cesta}|${o.pozicia ?? ''}` : 'bez';
}

export const SIRKA_POCITAC = 1440;
export const SIRKA_MOBIL = 390;
/** Výška okna, ktorú plátno predstiera (`100vh` v okne vysokom ako obsah by rástlo donekonečna). */
const VYSKA_OKNA = { pocitac: 900, mobil: 844 } as const;

export type Zariadenie = 'pocitac' | 'mobil';

/* ── `window.matchMedia` → okno plátna ── */
let oknoPlatna: Window | null = null;
let povodnyMatchMedia: typeof window.matchMedia | null = null;
let pocetPlatien = 0;
function zapniOknoPlatna() {
  if (pocetPlatien++ > 0) return;
  povodnyMatchMedia = window.matchMedia;
  const povodny = povodnyMatchMedia;
  window.matchMedia = function matchMediaPlatna(q: string) {
    const w = oknoPlatna;
    return w && w !== window ? w.matchMedia(q) : povodny.call(window, q);
  } as typeof window.matchMedia;
}
function vypniOknoPlatna() {
  if (--pocetPlatien > 0) return;
  if (povodnyMatchMedia) window.matchMedia = povodnyMatchMedia;
  povodnyMatchMedia = null;
  oknoPlatna = null;
}

/** Prvý prvok v okne plátna: nastaví okno pre `matchMedia` skôr, než ho komponenty webu použijú. */
function OknoPlatna({ onDoc }: { onDoc: (d: Document) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const d = ref.current?.ownerDocument;
    if (!d) return;
    oknoPlatna = d.defaultView;
    onDoc(d);
  }, [onDoc]);
  return <span ref={ref} hidden />;
}

export interface PlatnoProps {
  stranka: Stranka;
  jazyk: Jazyk;
  zariadenie: Zariadenie;
  zoom: CanvasZoom;
  vzhlad: Vzhlad;
  rozriesene: Rozriesene;
  kategorieDb: KategoriaVDb[];
  vyber: string | null;
  onVyber: (n: string | null) => void;
  lenNaCitanie: boolean;
  onZmena: (popis: string, fn: (v: Vzhlad) => void) => void;
  onAkcia: (a: AkciaVrstvy) => void;
  onKlaves: (e: KeyboardEvent) => void;
  upozornenia: Map<string, UpozornenieNaPlatne[]>;
  pisatTeraz: number;
  /** Dokument plátna (klávesy, odrolovanie na prvok, testy). */
  onDokument?: (d: Document | null) => void;
}

export function Platno(p: PlatnoProps) {
  const [doc, setDoc] = useState<Document | null>(null);
  const onDokument = p.onDokument;
  const onDoc = useMemo(() => (d: Document) => { setDoc(d); onDokument?.(d); }, [onDokument]);

  /* Jazyk sa musí nastaviť skôr, než sa komponenty webu vykreslia. */
  nastavJazykPlatna(p.jazyk);
  useEffect(() => () => nastavJazykPlatna(null), []);
  useEffect(() => { zapniOknoPlatna(); return () => { vypniOknoPlatna(); onDokument?.(null); }; }, [onDokument]);

  const vyska = VYSKA_OKNA[p.zariadenie];
  const hodnota = useMemo(() => ({ vzhlad: p.vzhlad, rozriesene: p.rozriesene, upravy: true }), [p.vzhlad, p.rozriesene]);
  const kluc = `${p.jazyk}|${p.stranka.druh}|${p.stranka.druh === 'kategoria' ? p.stranka.slug : ''}`;

  const css = `
/* Plátno editora vzhľadu: „100vh" je tu výška okna zariadenia, nie výška obsahu. */
.min-h-screen { min-height: ${vyska}px !important; }
.lnac--cela, .lart-cakanie { min-height: ${vyska}px !important; }
@media (max-width: 860px) { .lakv-logo { max-height: ${Math.round(vyska * 0.68)}px !important; } }
.lnav-mobile { max-height: none !important; }
`;

  return (
    <CanvasFrame width={p.zariadenie === 'mobil' ? SIRKA_MOBIL : SIRKA_POCITAC} zoom={p.zoom} onKeyDown={p.onKlaves} title="Plátno vzhľadu webu">
      <OknoPlatna onDoc={onDoc} />
      <style>{css}</style>
      <div key={kluc} className="min-h-screen lab" data-theme="pecat" data-vw-platno={p.stranka.druh}>
        <VzhladProvider hodnota={hodnota}>
          {p.stranka.druh === 'domov' && (
            <>
              <LabNav />
              <LabKategorieVysuv />
              <LabHome />
              <LabJoinUs />
              <LabFooter />
            </>
          )}
          {p.stranka.druh === 'kategoria' && (
            <>
              <LabNav />
              <LabKategorieVysuv />
              {/* Kľúč s obrázkom kategórie: hlavička je CSS pozadie (`background`
                  spolu s `backgroundColor`) a jeho zmena za behu vypisuje v Reacte
                  varovanie — po výmene obrázka sa stránka nakreslí nanovo. */}
              <CategoryPage key={klucObrazka(p.vzhlad, p.stranka.slug)} categorySlug={p.stranka.slug} />
              <LabFooter />
            </>
          )}
          {p.stranka.druh === 'menu' && (
            <>
              <LabNav rozbalene />
              <LabKategorieLista />
              <LabFooter />
            </>
          )}
        </VzhladProvider>
      </div>
      {doc && (
        <Vrstva
          doc={doc}
          kontext={{ v: p.vzhlad, r: p.rozriesene, j: p.jazyk, db: p.kategorieDb, stranka: p.stranka }}
          vyber={p.vyber}
          onVyber={p.onVyber}
          lenNaCitanie={p.lenNaCitanie}
          onZmena={p.onZmena}
          onAkcia={p.onAkcia}
          upozornenia={p.upozornenia}
          pisatTeraz={p.pisatTeraz}
        />
      )}
    </CanvasFrame>
  );
}

export default Platno;
