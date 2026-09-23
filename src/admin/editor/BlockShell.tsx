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
  const boxRef = React.useRef<HTMLDivElement>(null);
  /* Výška vykresleného bloku, odmeraná EŠTE PRED prepnutím na písanie.
     TipTap sadzí text o kúsok inak (iniciálku kreslí CSS, nie vložený znak),
     takže blok pri kliknutí zmenil výšku a celý článok pod ním poskočil —
     to bolo to trhnutie. Pri písaní sa preto miesto najprv podrží a pustí sa
     až vtedy, keď sa obsah naozaj mení. */
  const [reserve, setReserve] = React.useState<number | null>(null);

  // Do textu sa píše priamo na mieste bloku (Fáza 3). Ostatné typy zatiaľ nie.
  const writing = ui.editingUid === uid && type === 'content.rich-text' && !!ui.renderInline;
  React.useEffect(() => { if (!writing) setReserve(null); }, [writing]);

  const zmeraj = () => {
    const el = boxRef.current;
    if (!el) return;
    let top = Infinity, bottom = -Infinity;
    for (const k of Array.from(el.children)) {
      const r = k.getBoundingClientRect();
      if (!r.height) continue;
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    if (Number.isFinite(top)) setReserve(Math.round(bottom - top));
  };

  return (
    <div
      ref={boxRef}
      className="ed-block"
      data-block-index={index}
      data-block-uid={uid}
      data-block-type={type}
      data-block-label={label}
      onMouseEnter={() => ui.hover(uid)}
      onMouseLeave={() => ui.hover(null)}
      onMouseDown={() => { if (type === 'content.rich-text') zmeraj(); ui.select(uid); }}
    >
      {writing ? (
        <div
          className="ed-block-writing"
          style={reserve ? { minHeight: reserve } : undefined}
          /* Len čo sa text naozaj mení, podržané miesto pustíme — inak by
             blok ostal privysoký po zmazaní odseku. */
          onKeyDown={(e) => { if (reserve && e.key.length === 1) setReserve(null); }}
        >
          {ui.renderInline!(uid)}
        </div>
      ) : children}
    </div>
  );
}
