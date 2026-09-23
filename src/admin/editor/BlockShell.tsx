'use client';

/**
 * Obal jedného bloku na plátne editora.
 *
 * NEVYTVÁRA ŽIADNY BOX. Má `display: contents`, takže v rozvrhu akoby nebol —
 * a to je zámer: obyčajný `div` okolo bloku posúval pomocné značky s nulovou
 * výškou o 8 px (namerané na článku „Hradište pri Partizánskom" v mobilnom
 * zobrazení, Fáza 1). S `display: contents` sedí rozvrh s webom na stotinu
 * pixela.
 *
 * Preto sa sem nekreslí ani rámik výberu, ani úchyt či lišta — tie sú vo
 * vrstve nad článkom (`BlockOverlay`), ktorá je absolútne umiestnená a takisto
 * do rozvrhu nezasahuje.
 *
 * Obal teda robí dve veci: nesie značky `data-block-*` na meranie a chytá
 * kliknutie a prejdenie myšou (udalosti bublajú z detí, aj keď box nemá).
 */

import React from 'react';
import { useEditorUI } from './EditorUIContext';

export interface BlockShellProps {
  index: number;
  uid: string;
  label: string;
  type: string;
  children: React.ReactNode;
}

export function BlockShell({ index, uid, label, type, children }: BlockShellProps) {
  const ui = useEditorUI();
  // Do textu sa píše priamo na mieste bloku (Fáza 3). Ostatné typy zatiaľ nie.
  const writing = ui.editingUid === uid && type === 'content.rich-text' && !!ui.renderInline;
  return (
    <div
      className="ed-block"
      data-block-index={index}
      data-block-uid={uid}
      data-block-type={type}
      data-block-label={label}
      onMouseEnter={() => ui.hover(uid)}
      onMouseLeave={() => ui.hover(null)}
      onMouseDown={() => ui.select(uid)}
    >
      {writing ? ui.renderInline!(uid) : children}
    </div>
  );
}
