'use client';

/**
 * Obrázok myšou — ťahanie na pozíciu a zväčšovanie za roh.
 *
 * Schéma Strapi sa NEMENÍ: pozícia má päť hodnôt (vľavo, vpravo, v strede,
 * celá šírka, cez okraj) a šírka päť krokov (30/40/50/60/100 %). Ťahanie je
 * preto plynulé, ale pustenie vždy prichytí na najbližšiu povolenú hodnotu.
 *
 * Kreslí sa do vrstvy nad článkom (`BlockOverlay`), takže rozvrh sa nemení.
 */

import React, { useRef, useState } from 'react';
import { MoveDiagonal2 } from 'lucide-react';
import { nearestStep, describe, widthEditable, SNAP_PX, WIDTH_STEPS } from '../snapping/widthSteps';
import type { ImagePosition } from '../snapping/positionZones';

export interface Rect { top: number; left: number; width: number; height: number; }

export interface ImageControlsProps {
  /** Obdĺžnik bloku v súradniciach vrstvy. */
  rect: Rect;
  /** Šírka textového stĺpca — z nej sa počítajú percentá. */
  columnWidth: number;
  position: string;
  width: string;
  onChange: (patch: { position?: string; width?: string }) => void;
  /** Koreň vrstvy (kvôli súradniciam a dokumentu okna plátna). */
  rootRef: React.RefObject<HTMLElement>;
}

const ZONES: { id: ImagePosition; label: string }[] = [
  { id: 'left', label: 'Vľavo, text obteká' },
  { id: 'center', label: 'V strede' },
  { id: 'right', label: 'Vpravo, text obteká' },
  { id: 'full', label: 'Celá šírka stĺpca' },
  { id: 'breakout', label: 'Cez okraj stĺpca' },
];

export function ImageControls({
  rect, columnWidth, position, width, onChange, rootRef,
}: ImageControlsProps) {
  const [drag, setDrag] = useState<null | { kind: 'move'; zone: ImagePosition } | { kind: 'size'; pct: number }>(null);
  const live = useRef<typeof drag>(null);
  live.current = drag;

  /** Ktorá zóna zodpovedá bodu? Ľavá a pravá tretina = obtekanie. */
  const zoneAt = (x: number, y: number): ImagePosition => {
    const rel = x / columnWidth;
    // Pod spodným okrajom stĺpca ponúkni presah cez okraj.
    if (rel < -0.06 || rel > 1.06) return 'breakout';
    if (rel < 0.28) return 'left';
    if (rel > 0.72) return 'right';
    // Stred: blízko horného okraja bloku = celá šírka, inak vycentrovane.
    return y < rect.top + 28 ? 'full' : 'center';
  };

  const startMove = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const root = rootRef.current; if (!root) return;
    const doc = root.ownerDocument;
    const rr = () => root.getBoundingClientRect();
    setDrag({ kind: 'move', zone: position as ImagePosition });

    const move = (ev: PointerEvent) => {
      const r = rr();
      setDrag({ kind: 'move', zone: zoneAt(ev.clientX - r.left, ev.clientY - r.top) });
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      const d = live.current;
      setDrag(null);
      if (d && d.kind === 'move' && d.zone !== position) onChange({ position: d.zone });
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const root = rootRef.current; if (!root) return;
    const doc = root.ownerDocument;
    setDrag({ kind: 'size', pct: Number(width) || 50 });

    const move = (ev: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const x = ev.clientX - r.left;
      // Pri obrázku vpravo sa ťahá opačným smerom.
      const raw = position === 'right'
        ? ((rect.left + rect.width - x) / columnWidth) * 100
        : (x - rect.left) / columnWidth * 100;
      setDrag({ kind: 'size', pct: Math.max(15, Math.min(100, raw)) });
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      const d = live.current;
      setDrag(null);
      if (d && d.kind === 'size') {
        const step = nearestStep(d.pct);
        if (step !== width) onChange({ width: step });
      }
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  const resizable = widthEditable(position);
  const movingZone = drag?.kind === 'move' ? drag.zone : null;
  const sizePct = drag?.kind === 'size' ? drag.pct : null;
  const snapped = sizePct != null ? nearestStep(sizePct) : null;

  return (
    <>
      {/* Plocha na ťahanie obrázka — prekrýva ho, aby sa dal chytiť kdekoľvek. */}
      <div
        className="ed-img-move"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        title="Potiahnutím presuniete obrázok, ťahaním za roh zmeníte veľkosť"
        onPointerDown={startMove}
      />

      {resizable && (
        <button
          className="ed-img-size"
          title="Ťahaním zmeníte šírku"
          aria-label="Zmeniť šírku obrázka"
          style={{
            top: rect.top + rect.height - 13,
            left: position === 'right' ? rect.left - 13 : rect.left + rect.width - 13,
          }}
          onPointerDown={startResize}
        >
          <MoveDiagonal2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Štítok so živou hodnotou */}
      {(movingZone || sizePct != null) && (
        <div className="ed-img-tag" style={{ top: rect.top + 6, left: rect.left + 6 }}>
          {movingZone ? describe(movingZone, width) : describe(position, snapped!)}
        </div>
      )}

      {/* Cieľové zóny počas ťahania */}
      {movingZone && (
        <div className="ed-zones">
          {ZONES.map((z) => (
            <div
              key={z.id}
              className={`ed-zone ed-zone-${z.id}${movingZone === z.id ? ' is-on' : ''}`}
            >
              <span>{z.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Kroky šírky počas zväčšovania */}
      {sizePct != null && (
        <div className="ed-steps" style={{ top: rect.top - 6, height: rect.height + 12 }}>
          {WIDTH_STEPS.filter((s) => s !== '100').map((s) => (
            <span
              key={s}
              className={`ed-step${snapped === s ? ' is-on' : ''}`}
              style={{ left: `${Number(s)}%` }}
            />
          ))}
        </div>
      )}
    </>
  );
}

export { SNAP_PX };
