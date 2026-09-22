'use client';

/**
 * Vrstva ovládania nad vykresleným článkom.
 *
 * Prečo vrstva a nie rámik priamo na bloku: obal bloku má `display: contents`,
 * aby rozvrh sedel s webom na stotinu pixela (viď BlockShell). Všetko, čo by
 * inak posúvalo obsah — rámik výberu, úchyt, lišta bloku, tlačidlá „+" — je
 * preto absolútne umiestnené nad článkom a do toku nezasahuje.
 *
 * Polohy blokov sa merajú z DOM (`data-block-uid`) a prepočítavajú pri každej
 * zmene veľkosti alebo obsahu.
 *
 * ŤAHANIE je na ukazovateľových udalostiach, nie na dnd-kit. Dôvody:
 *   • plátno je vlastné okno (iframe) a ťahanie musí počúvať jeho dokument,
 *   • Fáza 4 potrebuje vlastné prichytávanie obrázka na zóny a kroky šírky,
 *     čo by sa cez cudziu knižnicu aj tak obchádzalo,
 *   • zoznam je jednoduchý zvislý — celé je to zopár desiatok riadkov.
 * Ak by sme dnd-kit predsa chceli, mení sa len tento súbor.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  GripVertical, Copy, Trash2, Plus, ArrowUp, ArrowDown, X,
} from 'lucide-react';

export interface OverlayBlock {
  uid: string;
  type: string;
  label: string;
}

export interface BlockOverlayProps {
  /** Bloky v poradí, v akom sú na plátne. */
  blocks: OverlayBlock[];
  selectedUid: string | null;
  hoverUid: string | null;
  onSelect: (uid: string | null) => void;
  onMove: (uid: string, toIndex: number) => void;
  onDelete: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onInsert: (type: string, atIndex: number) => void;
  /** Ponuka typov blokov pre tlačidlo „+". */
  blockTypes: { id: string; label: string; accent: string }[];
  /** Koreň, voči ktorému sa počítajú súradnice (obal plátna v okne iframe). */
  rootRef: React.RefObject<HTMLElement>;
}

interface Rect { top: number; left: number; width: number; height: number; }

/** Zjednotený obdĺžnik detí obalu — samotný obal má `display: contents`, teda žiadny box. */
function measureBlock(el: Element, rootTop: number, rootLeft: number): Rect | null {
  const kids = [...el.children].filter((k) => !k.classList.contains('ed-block-tag'));
  if (!kids.length) return null;
  let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
  for (const k of kids) {
    const r = k.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    top = Math.min(top, r.top); left = Math.min(left, r.left);
    right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
  }
  if (!Number.isFinite(top)) return null;
  return { top: top - rootTop, left: left - rootLeft, width: right - left, height: bottom - top };
}

export function BlockOverlay({
  blocks, selectedUid, hoverUid, onSelect, onMove, onDelete, onDuplicate, onInsert, blockTypes, rootRef,
}: BlockOverlayProps) {
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [drag, setDrag] = useState<{ uid: string; y: number; target: number } | null>(null);
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // ── Meranie ────────────────────────────────────────────────────────────────
  const measureAll = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const next: Record<string, Rect> = {};
    root.querySelectorAll('[data-block-uid]').forEach((el) => {
      const uid = (el as HTMLElement).dataset.blockUid!;
      const r = measureBlock(el, rr.top, rr.left);
      if (r) next[uid] = r;
    });
    setRects(next);
  }, [rootRef]);

  useLayoutEffect(() => { measureAll(); }, [measureAll, blocks]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const win = root.ownerDocument.defaultView!;
    const ro = new ResizeObserver(() => measureAll());
    ro.observe(root);
    root.querySelectorAll('[data-block-uid] > *').forEach((el) => ro.observe(el));
    // Obrázky dorastajú po načítaní — po každom prepočítaj.
    const imgs = [...root.querySelectorAll('img')];
    const onLoad = () => measureAll();
    imgs.forEach((i) => i.addEventListener('load', onLoad));
    win.addEventListener('resize', measureAll);
    const t = win.setInterval(measureAll, 1000); // poistka pre písma a dobehnuté prechody
    return () => {
      ro.disconnect();
      imgs.forEach((i) => i.removeEventListener('load', onLoad));
      win.removeEventListener('resize', measureAll);
      win.clearInterval(t);
    };
  }, [measureAll, rootRef, blocks]);

  // ── Ťahanie ────────────────────────────────────────────────────────────────
  const startDrag = (uid: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const root = rootRef.current;
    if (!root) return;
    const doc = root.ownerDocument;
    onSelect(uid);
    const from = blocks.findIndex((b) => b.uid === uid);
    setDrag({ uid, y: e.clientY - root.getBoundingClientRect().top, target: from });

    const move = (ev: PointerEvent) => {
      const rr = root.getBoundingClientRect();
      const y = ev.clientY - rr.top;
      // Kam by blok spadol: prvá medzera, ktorá je pod ukazovateľom.
      let target = blocks.length;
      for (let i = 0; i < blocks.length; i++) {
        const r = rects[blocks[i].uid];
        if (!r) continue;
        if (y < r.top + r.height / 2) { target = i; break; }
      }
      setDrag((d) => (d ? { ...d, y, target } : d));
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const fromIdx = blocks.findIndex((b) => b.uid === d.uid);
      let to = d.target;
      if (to > fromIdx) to -= 1; // po vybratí bloku sa index posunie
      if (to !== fromIdx && to >= 0) onMove(d.uid, to);
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  // ── Kreslenie ──────────────────────────────────────────────────────────────
  const gapY = (i: number): number => {
    const before = i > 0 ? rects[blocks[i - 1].uid] : null;
    const after = i < blocks.length ? rects[blocks[i].uid] : null;
    if (before && after) return (before.top + before.height + after.top) / 2;
    if (after) return after.top - 6;
    if (before) return before.top + before.height + 6;
    return 0;
  };

  const selected = selectedUid ? rects[selectedUid] : null;
  const selectedIdx = blocks.findIndex((b) => b.uid === selectedUid);
  const selectedBlock = blocks[selectedIdx];

  return (
    /* `pointer-events-none` je nutné: globals.css vynucuje pravidlom
       „NUCLEAR OPTION" (riadok 48) `pointer-events: auto !important` na KAŽDÝ
       div, takže samotná vlastnosť v našom štýle neprejde. Trieda má vlastné
       !important pravidlo a je v tomto projekte určená presne na toto. */
    <div className="ed-overlay pointer-events-none" aria-hidden={false}>
      {/* rámik pri prejdení myšou */}
      {hoverUid && hoverUid !== selectedUid && rects[hoverUid] && (
        <div className="ed-frame ed-frame-hover pointer-events-none" style={boxStyle(rects[hoverUid])}>
          <span className="ed-frame-tag">{blocks.find((b) => b.uid === hoverUid)?.label}</span>
        </div>
      )}

      {/* rámik výberu + úchyt + lišta */}
      {selected && selectedBlock && (
        <div className="ed-frame ed-frame-selected pointer-events-none" style={boxStyle(selected)}>
          <span className="ed-frame-tag ed-frame-tag-on">{selectedBlock.label}</span>

          <button
            className="ed-grip"
            title="Potiahnutím presuniete blok"
            aria-label={`Presunúť blok ${selectedBlock.label}`}
            onPointerDown={startDrag(selectedBlock.uid)}
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <div className="ed-toolbar" onPointerDown={(e) => e.stopPropagation()}>
            <button title="Posunúť vyššie" aria-label="Posunúť vyššie"
                    disabled={selectedIdx <= 0}
                    onClick={() => onMove(selectedBlock.uid, selectedIdx - 1)}>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button title="Posunúť nižšie" aria-label="Posunúť nižšie"
                    disabled={selectedIdx >= blocks.length - 1}
                    onClick={() => onMove(selectedBlock.uid, selectedIdx + 1)}>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button title="Duplikovať" aria-label="Duplikovať blok"
                    onClick={() => onDuplicate(selectedBlock.uid)}>
              <Copy className="w-3.5 h-3.5" />
            </button>
            {/* Potvrdenie sa pýta admin, nie plátno: okno plátna je vysoké ako
                celý článok, takže `position: fixed` by dialóg odsunulo mimo
                obrazovky (overené — Playwright ho nevedel ani kliknúť). */}
            <button className="ed-danger" title="Zmazať" aria-label="Zmazať blok"
                    onClick={() => onDelete(selectedBlock.uid)}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* medzery na vkladanie */}
      {blocks.length > 0 && Array.from({ length: blocks.length + 1 }, (_, i) => (
        <div key={`gap-${i}`} className="ed-gap" style={{ top: gapY(i) }}>
          <button className="ed-gap-btn" title="Vložiť blok sem" aria-label="Vložiť blok sem"
                  onClick={() => setMenuAt(menuAt === i ? null : i)}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <span className="ed-gap-line" />
          {menuAt === i && (
            <div className="ed-menu" role="menu">
              <div className="ed-menu-head">
                Vložiť blok
                <button onClick={() => setMenuAt(null)} aria-label="Zavrieť"><X className="w-3.5 h-3.5" /></button>
              </div>
              {blockTypes.map((t) => (
                <button key={t.id} role="menuitem" onClick={() => { onInsert(t.id, i); setMenuAt(null); }}>
                  <span className="ed-menu-dot" style={{ background: t.accent }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* čiara, kam blok spadne */}
      {drag && <div className="ed-drop pointer-events-none" style={{ top: gapY(drag.target) }} />}

    </div>
  );
}

function boxStyle(r: Rect): React.CSSProperties {
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}
