'use client';

/**
 * Obal jedného bloku na plátne editora.
 *
 * Fáza 1 — len rámik pri prejdení myšou a menovka typu. Výber, úchyt na
 * ťahanie, lišta bloku a tlačidlo „+ vložiť" pribudnú vo Fáze 2, drag a resize
 * obrázka vo Fáze 4.
 *
 * Dôležité: obal nesmie zmeniť rozvrh. Preto `display: contents`-ovú cestu
 * nevolíme (rozbila by `float` aj `clear`), ale obal je bežný blok bez okrajov
 * a rámik sa kreslí `outline`-om, ktorý nezaberá miesto.
 */

import React from 'react';

export interface BlockShellProps {
  /** Poradie bloku v článku, od 0. */
  index: number;
  /** Ľudský názov typu bloku („Obrázok", „Citát", …). */
  label: string;
  /** Strapi typ, napr. `content.image-block`. */
  type: string;
  children: React.ReactNode;
}

export function BlockShell({ index, label, type, children }: BlockShellProps) {
  return (
    <div className="ed-block" data-block-index={index} data-block-type={type}>
      <span className="ed-block-tag" aria-hidden="true">{label}</span>
      {children}
    </div>
  );
}
