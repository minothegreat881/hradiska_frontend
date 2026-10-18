'use client';

/**
 * SPODNÝ LIST — pravý panel editora vzhľadu na telefóne a tablete (≤ 1023 px).
 *
 * Tri polohy: zbalený (vidno len úchyt a nadpis vybraného prvku), polovica
 * obrazovky a celý (pod hlavičkou editora). Úchyt: klepnutie prepne na ďalšiu
 * polohu, potiahnutie prstom (alebo myšou) list posunie a pustenie ho prichytí
 * k najbližšej polohe. Úchyt má `touch-action: none` — len on; obsah listu
 * a stránka pod ním sa posúvajú normálne.
 *
 * Kreslí sa v dokumente administrácie (nie v okne plátna), `position: fixed`.
 */

import { useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export type StavListu = 'zbalene' | 'polovica' | 'cele';

const PORADIE: StavListu[] = ['zbalene', 'polovica', 'cele'];
const POPIS: Record<StavListu, string> = { zbalene: 'zbalené', polovica: 'na polovicu obrazovky', cele: 'na celú obrazovku' };

/** Výška listu v px pre polohu (rovnaké čísla ako v CSS `vzhlad-editor.css`). */
function vyska(s: StavListu): number {
  const h = window.visualViewport?.height ?? window.innerHeight;
  if (s === 'zbalene') return 88;
  if (s === 'polovica') return Math.round(h * 0.5);
  return Math.max(200, h - 128);
}

export function SpodnyList({ stav, onStav, children }: { stav: StavListu; onStav: (s: StavListu) => void; children: ReactNode }) {
  const [tah, setTah] = useState<number | null>(null);
  const zaciatok = useRef<{ y: number; h: number; pohol: boolean } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /** Posledné stlačenie úchytu bolo potiahnutie (nasledujúci `click` sa ignoruje). */
  const poTahani = useRef(false);

  const dalsi = PORADIE[(PORADIE.indexOf(stav) + 1) % PORADIE.length];

  const dole = (e: RPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    zaciatok.current = { y: e.clientY, h: listRef.current?.getBoundingClientRect().height ?? vyska(stav), pohol: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const pohyb = (e: RPointerEvent<HTMLButtonElement>) => {
    const z = zaciatok.current;
    if (!z) return;
    const dy = z.y - e.clientY;
    if (!z.pohol && Math.abs(dy) < 6) return;
    z.pohol = true;
    setTah(Math.max(56, Math.min(vyska('cele'), z.h + dy)));
  };
  const hore = (e: RPointerEvent<HTMLButtonElement>) => {
    const z = zaciatok.current;
    zaciatok.current = null;
    poTahani.current = !!z?.pohol;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!z?.pohol || tah === null) { setTah(null); return; }
    /* Prichytiť k najbližšej polohe. */
    const najblizsi = PORADIE.reduce((a, b) => (Math.abs(vyska(b) - tah) < Math.abs(vyska(a) - tah) ? b : a));
    setTah(null);
    onStav(najblizsi);
  };
  const zrus = () => { zaciatok.current = null; setTah(null); };

  /* Klepnutie (bez potiahnutia) — ďalšia poloha. `click` príde aj po ťahaní, preto stráž. */
  const naKlik = () => { if (poTahani.current) { poTahani.current = false; return; } onStav(dalsi); };

  return (
    <div
      ref={listRef}
      className={`vw-list je-${stav}${tah !== null ? ' je-tahany' : ''}`}
      style={tah !== null ? { height: tah } : undefined}
      role="region"
      aria-label="Nastavenia vybraného prvku"
      data-vw-list={stav}
    >
      <button
        type="button"
        className="vw-list-uchyt"
        aria-label={`Panel: ${POPIS[stav]}. Klepnutím ${POPIS[dalsi]}, potiahnutím zmeníte výšku.`}
        title="Potiahnite alebo klepnite"
        onPointerDown={dole}
        onPointerMove={pohyb}
        onPointerUp={hore}
        onPointerCancel={zrus}
        onClick={naKlik}
        data-vw-list-uchyt
      >
        <span className="vw-list-pruh pointer-events-none" />
        {stav === 'cele' ? <ChevronDown className="vw-list-sipka" /> : <ChevronUp className="vw-list-sipka" />}
      </button>
      <div className="vw-list-telo">{children}</div>
    </div>
  );
}

export default SpodnyList;
