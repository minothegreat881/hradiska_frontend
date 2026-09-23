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
  GripVertical, Copy, Trash2, Plus, ArrowUp, ArrowDown,
  Image as ImageIcon, Columns2, Captions, Square, Sun, AlertTriangle,
} from 'lucide-react';
import { ImageControls } from './blocks/ImageControls';
import { BlockFields } from './blocks/BlockFields';
import { canPair, whyNotPair } from './snapping/positionZones';
import { BlockPicker } from './blocks/BlockPicker';

export interface OverlayBlock {
  uid: string;
  type: string;
  label: string;
  /** Blok v tvare Strapi — z neho sa berú polia na úpravu. */
  data: any;
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
  /** Zmena poľa vybraného bloku (pozícia, šírka, popis, text…). */
  onPatch: (uid: string, patch: any) => void;
  /** Otvorí knižnicu médií pre daný blok. */
  onPickMedia: (uid: string, multiple: boolean) => void;
  /** Blok, do ktorého sa práve píše — ten rám nedostáva. */
  editingUid?: string | null;
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

/** Zhodujú sa všetky obdĺžniky? Porovnáva sa na stotinu pixela. */
function sameRects(a: Record<string, Rect>, b: Record<string, Rect>): boolean {
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    const x = a[k], y = b[k];
    if (!y) return false;
    if (Math.abs(x.top - y.top) > 0.01 || Math.abs(x.left - y.left) > 0.01
      || Math.abs(x.width - y.width) > 0.01 || Math.abs(x.height - y.height) > 0.01) return false;
  }
  return true;
}

export function BlockOverlay({
  blocks, selectedUid, hoverUid, onSelect, onMove, onDelete, onDuplicate, onInsert, blockTypes, rootRef,
  onPatch, onPickMedia, editingUid,
}: BlockOverlayProps) {
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const [drag, setDrag] = useState<{ uid: string; y: number; target: number } | null>(null);
  const [menuAt, setMenuAt] = useState<number | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // ── Meranie ────────────────────────────────────────────────────────────────
  /* Prepočet sa spúšťa pri KAŽDEJ zmene výšky blokov (ResizeObserver na deťoch
     obalu), po načítaní obrázkov, pri zmene veľkosti okna a pri zmene počtu
     blokov. Stav sa však prepíše len vtedy, keď sa čísla naozaj líšia — inak
     by sa plátno prekresľovalo donekonečna (a vo Faze 3 pri každom písmene). */
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
    setRects((prev) => (sameRects(prev, next) ? prev : next));
  }, [rootRef]);

  /* Prepnutie bloku na písanie a späť vymení prvky v DOM — premeraj hneď v
     tom istom kroku, inak sa rám na jednu snímku nakreslí na starú súradnicu
     a vyzerá to ako trhnutie. */
  useLayoutEffect(() => { measureAll(); }, [measureAll, blocks, editingUid]);

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
    // Zmeny v obsahu blokov (písanie, výmena obrázka) — nové deti treba sledovať.
    const mo = new MutationObserver(() => {
      root.querySelectorAll('[data-block-uid] > *').forEach((el) => ro.observe(el));
      measureAll();
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });

    win.addEventListener('resize', measureAll);
    // Poistka pre písma a dobehnuté prechody; `sameRects` zabráni prekresleniu naprázdno.
    const t = win.setInterval(measureAll, 1000);
    return () => {
      ro.disconnect();
      mo.disconnect();
      imgs.forEach((i) => i.removeEventListener('load', onLoad));
      win.removeEventListener('resize', measureAll);
      win.clearInterval(t);
    };
  }, [measureAll, rootRef, blocks]);

  // ── Ťahanie ────────────────────────────────────────────────────────────────
  /* SÚRADNICE A MIERKA: plátno sa navonok zmenšuje CSS transformáciou, ale
     udalosti aj `getBoundingClientRect()` tu pochádzajú z VNÚTRA okna plátna,
     kde mierka neplatí. Obe strany výpočtu sú teda v tej istej sústave a
     prepočítavať mierkou netreba — overené ťahaním pri zmenšení aj pri 100 %. */
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

  /* Kým nie je nič zmerané (prvé vykreslenie, prepnutie zariadenia), nekresli
     medzery vôbec. Inak by všetky — vrátane vždy viditeľného „Pridať blok" —
     na okamih sadli na nulu, teda na začiatok článku. */
  const measured = Object.keys(rects).length > 0;

  /** Spodok priestoru článku — záchrana, keď sa nedá zmerať žiadny blok. */
  const contentBottom = (): number => {
    const root = rootRef.current;
    const box = root?.querySelector('.article-content') as HTMLElement | null;
    if (!root || !box) return 0;
    const rr = root.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    return br.top - rr.top + br.height + 6;
  };

  // ── Kreslenie ──────────────────────────────────────────────────────────────
  const selected = selectedUid ? rects[selectedUid] : null;
  const selectedIdx = blocks.findIndex((b) => b.uid === selectedUid);
  const selectedBlock = blocks[selectedIdx];
  const d = selectedBlock?.data ?? {};
  const isImage = selectedBlock?.type === 'content.image-block';
  const hasFields = !!selectedBlock && ['content.quote-block', 'content.poem', 'content.embed',
    'content.sources', 'content.image-gallery', 'content.image-block'].includes(selectedBlock.type);

  /* Panel polí (a pri obrázku prúžok s alt textom) visí POD vybraným blokom a
     je vysoký. Bez merania prekryl medzeru za blokom aj s tlačidlom „Pridať
     blok" — po vložení videa sa tak nedalo pokračovať ďalším blokom. Meria sa
     skutočná výška, obsah panela sa líši typ od typu. */
  const [underEl, setUnderEl] = useState<HTMLDivElement | null>(null);
  const [underH, setUnderH] = useState(0);
  useLayoutEffect(() => {
    if (!underEl) { setUnderH(0); return; }
    const read = () => setUnderH(underEl.getBoundingClientRect().height);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(underEl);
    return () => ro.disconnect();
  }, [underEl]);
  const underBottom = underEl && selected
    ? selected.top + selected.height + (isImage ? 6 : 10) + underH
    : null;

  /* Zvislá poloha medzery pred blokom `i` (`i === blocks.length` je koniec
     článku). Prázdny blok — čerstvo vložený text alebo video bez adresy —
     nemá žiadny box a teda ani nameraný obdĺžnik; preto sa hľadá najbližší
     zmeraný sused. Predtým sa v takom prípade vracala nula a tlačidlo
     „Pridať blok" skočilo na začiatok článku. */
  const gapY = (i: number): number => {
    const rectAt = (k: number) => (k >= 0 && k < blocks.length ? rects[blocks[k].uid] ?? null : null);
    const before = rectAt(i - 1);
    const after = rectAt(i);

    let y: number | null = null;
    if (before && after) y = (before.top + before.height + after.top) / 2;
    else if (after) y = after.top - 6;
    else if (before) y = before.top + before.height + 6;
    else {
      // Ani jeden sused sa nedá zmerať — drž sa najbližšieho zmeraného bloku.
      for (let k = i - 2; k >= 0 && y === null; k--) {
        const r = rectAt(k);
        if (r) y = r.top + r.height + 6;
      }
      for (let k = i + 1; k < blocks.length && y === null; k++) {
        const r = rectAt(k);
        if (r) y = r.top - 6;
      }
      // Článok nemá zmeraný ani jeden blok (samé prázdne) — pod začiatok textu.
      if (y === null) y = contentBottom();
    }

    // Medzera hneď za vybraným blokom ide pod jeho panel polí, nie pod neho.
    if (underBottom !== null && i === selectedIdx + 1) y = Math.max(y, underBottom + 10);
    return y;
  };

  // Spárovanie posudzuje tá istá funkcia ako web (jedno pravidlo pre oboje).
  const nextBlock = blocks[selectedIdx + 1];
  const pairPossible = isImage && canPair(
    { ...d, __component: selectedBlock!.type, pairWithNext: true },
    nextBlock ? { ...nextBlock.data, __component: nextBlock.type } : null
  );
  const pairProblem = isImage
    ? whyNotPair(
        { ...d, __component: selectedBlock!.type, pairWithNext: true },
        nextBlock ? { ...nextBlock.data, __component: nextBlock.type } : null
      )
    : null;

  /** Šírka textového stĺpca — z nej počíta ImageControls percentá. */
  const columnWidth = rootRef.current?.getBoundingClientRect().width || 668;

  return (
    /* `pointer-events-none` je nutné: globals.css vynucuje pravidlom
       „NUCLEAR OPTION" (riadok 48) `pointer-events: auto !important` na KAŽDÝ
       div, takže samotná vlastnosť v našom štýle neprejde. Trieda má vlastné
       !important pravidlo a je v tomto projekte určená presne na toto. */
    <div className="ed-overlay pointer-events-none" aria-hidden={false}>
      {/* rámik pri prejdení myšou */}
      {/* Do bloku, do ktorého sa píše, sa rám nekreslí: pri prepnutí na
          písanie a späť sa prvok v DOM vymení a rám na jednu snímku skočil
          na starú súradnicu — vyzeralo to ako trhnutie. Rozpísaný blok je aj
          tak označený vlastným prerušovaným rámom editora. */}
      {hoverUid && hoverUid !== selectedUid && hoverUid !== editingUid && rects[hoverUid] && (
        <div className="ed-frame ed-frame-hover pointer-events-none" style={boxStyle(rects[hoverUid])}>
          <span className="ed-frame-tag">{blocks.find((b) => b.uid === hoverUid)?.label}</span>
        </div>
      )}

      {/* rámik výberu + úchyt + lišta */}
      {selected && selectedBlock && selectedUid !== editingUid && (
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

            {isImage && (
              <>
                <span className="ed-toolbar-sep" />
                <button title="Vymeniť obrázok" aria-label="Vymeniť obrázok"
                        onClick={() => onPickMedia(selectedBlock.uid, false)}>
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  className={d.pairWithNext ? 'is-on' : ''}
                  disabled={!pairPossible && !d.pairWithNext}
                  title={pairPossible || d.pairWithNext
                    ? 'Spárovať s nasledujúcim obrázkom'
                    : `Spárovať sa nedá: ${pairProblem}`}
                  aria-label="Spárovať s ďalším"
                  onClick={() => onPatch(selectedBlock.uid, { pairWithNext: !d.pairWithNext })}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                </button>
                <button className={d.showCaption !== false ? 'is-on' : ''}
                        title="Zobraziť popis pod obrázkom" aria-label="Zobraziť popis"
                        onClick={() => onPatch(selectedBlock.uid, { showCaption: d.showCaption === false })}>
                  <Captions className="w-3.5 h-3.5" />
                </button>
                <button className={d.rounded !== false ? 'is-on' : ''}
                        title="Zaoblené rohy" aria-label="Zaoblené rohy"
                        onClick={() => onPatch(selectedBlock.uid, { rounded: d.rounded === false })}>
                  <Square className="w-3.5 h-3.5" />
                </button>
                <button className={d.shadow !== false ? 'is-on' : ''}
                        title="Tieň" aria-label="Tieň"
                        onClick={() => onPatch(selectedBlock.uid, { shadow: d.shadow === false })}>
                  <Sun className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Obrázok: ťahanie na pozíciu a zväčšovanie za roh (Fáza 4). */}
      {selected && selectedBlock && isImage && (
        <ImageControls
          rect={selected}
          columnWidth={columnWidth}
          position={d.position || 'center'}
          width={d.width || '50'}
          onChange={(patch) => onPatch(selectedBlock.uid, patch)}
          rootRef={rootRef}
        />
      )}

      {/* Chýbajúci alternatívny text — článok sa bez neho neuloží.
          IBA UPOZORNENIE, žiadne pole: pole tu bolo neovládané a celý prúžok
          sa skryl hneď po prvom písmene (podmienka „alt je prázdny"), takže
          písanému textu zmizlo miesto pod rukami. Vypĺňa sa v paneli nižšie,
          ktorý ostáva otvorený. */}
      {selected && selectedBlock && isImage && !String(d.alt || '').trim() && (
        <div className="ed-alt" style={{ top: selected.top + selected.height + 6, left: selected.left }}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Chýba popis pre čítačky (alt) — doplňte ho v paneli pod obrázkom.</span>
        </div>
      )}

      {/* Polia ostatných typov blokov (Fáza 5). */}
      {selected && selectedBlock && hasFields && (
        <div ref={setUnderEl} className="ed-fields" style={{ top: selected.top + selected.height + 10, left: 0 }}>
          <BlockFields
            type={selectedBlock.type}
            data={d}
            onPatch={(patch) => onPatch(selectedBlock.uid, patch)}
            onPickMedia={(multiple) => onPickMedia(selectedBlock.uid, multiple)}
          />
        </div>
      )}

      {/* Medzery na vkladanie. Tlačidlá medzi blokmi sa ukazujú pri prejdení
          myšou, ALE posledné je viditeľné vždy — inak po vložení prvého bloku
          nie je ako pokračovať (tenký pruh sa nedá uhádnuť). */}
      {blocks.length > 0 && measured && Array.from({ length: blocks.length + 1 }, (_, i) => {
        const isLast = i === blocks.length;
        return (
        <div key={`gap-${i}`} className={`ed-gap${isLast ? ' is-last' : ''}`} style={{ top: gapY(i) }}>
          <button className="ed-gap-btn" title="Vložiť blok sem" aria-label="Vložiť blok sem"
                  onClick={() => setMenuAt(menuAt === i ? null : i)}>
            <Plus className="w-3.5 h-3.5" />
            {isLast && <span>Pridať blok</span>}
          </button>
          {/* Čiara je len ozdoba — bez `pointer-events-none` by prekryla tlačidlo
              „+" a to by sa nedalo kliknúť (globals.css vynucuje `auto` na
              každý prvok, viď poznámka vyššie). */}
          <span className="ed-gap-line pointer-events-none" />
          {menuAt === i && (
            <BlockPicker
              blockTypes={blockTypes}
              onPick={(type) => { onInsert(type, i); setMenuAt(null); }}
              onClose={() => setMenuAt(null)}
            />
          )}
        </div>
        );
      })}

      {/* čiara, kam blok spadne */}
      {drag && <div className="ed-drop pointer-events-none" style={{ top: gapY(drag.target) }} />}

    </div>
  );
}

function boxStyle(r: Rect): React.CSSProperties {
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}
