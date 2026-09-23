'use client';

/**
 * Titulná fotografia s ťahaním výrezu.
 *
 * Hlavička článku je širší pás než fotografia, takže sa orezáva
 * (`object-fit: cover`). Doteraz sa orezávala vždy zo stredu a nedalo sa
 * s tým nič robiť — pri vysokých fotkách tak z hradiska často ostalo iba nebo.
 *
 * Ťahanie posúva `object-position`. Hodnota sa ukladá do poľa `coverPosition`
 * a web ju pri vykreslení rešpektuje. Staršie články pole nemajú a ostávajú
 * vycentrované.
 */

import React, { useState } from 'react';

const clamp = (v: number) => Math.max(0, Math.min(100, v));

/** „center 30%" → { x: 50, y: 30 }. Rozumie aj slovám left/right/top/bottom. */
export function parsePosition(value: string): { x: number; y: number } {
  const words: Record<string, number> = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
  const parts = (value || '').trim().split(/\s+/);
  const toNum = (p: string | undefined, fallback: number) => {
    if (p == null) return fallback;
    if (p in words) return words[p];
    const n = parseFloat(p);
    return Number.isFinite(n) ? clamp(n) : fallback;
  };
  return { x: toNum(parts[0], 50), y: toNum(parts[1], 50) };
}

export function CoverImage({
  src, position, onChange,
}: {
  src: string;
  position: string;
  /** Chýba pri čítacom zobrazení — vtedy sa ťahať nedá. */
  onChange?: (value: string) => void;
}) {
  const [live, setLive] = useState<string | null>(null);
  const [hint, setHint] = useState(false);

  const start = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!onChange) return;
    e.preventDefault();
    const img = e.currentTarget;
    const box = img.getBoundingClientRect();
    const doc = img.ownerDocument;
    // Ťahanie nadväzuje na súčasný výrez, nezačína od stredu.
    const from = parsePosition(position);
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const move = (ev: PointerEvent) => {
      moved = true;
      // Posun myšou o šírku/výšku obrázka = posun výrezu o 100 %.
      const x = clamp(from.x - ((ev.clientX - startX) / box.width) * 100);
      const y = clamp(from.y - ((ev.clientY - startY) / box.height) * 100);
      setLive(`${Math.round(x)}% ${Math.round(y)}%`);
    };
    const up = () => {
      doc.removeEventListener('pointermove', move);
      doc.removeEventListener('pointerup', up);
      setLive((v) => {
        if (v && moved) onChange(v);
        return null;
      });
    };
    doc.addEventListener('pointermove', move);
    doc.addEventListener('pointerup', up);
  };

  const value = live || position;

  return (
    <>
      <img
        className="lart-hero-img"
        src={src}
        alt=""
        aria-hidden="true"
        decoding="async"
        style={{ objectPosition: value, cursor: onChange ? 'grab' : undefined }}
        onPointerDown={start}
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
      />
      {onChange && (hint || live) && (
        <div className="ed-cover-hint">
          {live ? `Výrez ${value}` : 'Potiahnutím posuniete výrez fotografie'}
        </div>
      )}
    </>
  );
}
