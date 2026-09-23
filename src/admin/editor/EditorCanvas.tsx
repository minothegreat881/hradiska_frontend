'use client';

/**
 * Plátno editora — článok vykreslený PRESNE tak, ako ho vykreslí web.
 *
 * Dve zásady, na ktorých stojí celý vizuálny editor:
 *
 * 1. JEDEN RENDERER. Plátno používa `DynamicZoneRenderer` z webu, len s
 *    `editMode`. Žiadna kópia, inak by sa editor a web časom rozišli.
 *
 * 2. VLASTNÉ OKNO (iframe). Mobilné pravidlá sú v CSS ako `@media
 *    (max-width: 767px)` a tie reagujú na šírku OKNA, nie na šírku pruhu
 *    v admine. Keby plátno bolo obyčajný `div` široký 390 px, obrázky by sa
 *    stále správali ako na počítači a prepínač Mobil by klamal. V iframe so
 *    šírkou 390 px platia rovnaké pravidlá ako na telefóne.
 *
 * React beží ako JEDEN strom: obsah okna sa vykresľuje portálom, takže stav,
 * kontexty aj udalosti sú spoločné s adminom (žiadne `postMessage`).
 *
 * Šírka textového stĺpca sa musí zhodovať s webom, preto je tu rovnaký reťazec
 * obalov ako v `design-lab/LabArticle.tsx` (`container px-4` → `.lart-card` →
 * `p-6 md:p-8` → stĺpec max. 668 px). Vynechaný je len 12-stĺpcový grid so
 * pobočným stĺpcom: ten drží metadáta, ktoré sa upravujú v pravom paneli, a na
 * šírku textu nemá vplyv (stĺpec je aj tak orezaný na 668 px).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DynamicZoneRenderer, hasRealParagraph } from '../../components/DynamicZoneRenderer';
import { getStrapiImageUrl } from '../../lib/strapi';
import { MOBILE_MAX_PX } from './snapping/positionZones';
import { EditorUIContext } from './EditorUIContext';
import { BlockOverlay, type OverlayBlock } from './BlockOverlay';
import { RichTextInline } from './blocks/RichTextInline';
import { BlockPicker } from './blocks/BlockPicker';
import { SideColumnEditor, type Fact, type Event } from './SideColumnEditor';
import { CoverImage } from './CoverImage';

export type CanvasDevice = 'desktop' | 'mobil';
/** `fit` = zmenšiť na šírku adminu, `full` = skutočná veľkosť + posúvanie do strán. */
export type CanvasZoom = 'fit' | 'full';

/** Šírka okna, v ktorom plátno kreslí mobilnú podobu. */
export const MOBILE_CANVAS_WIDTH = 390;

/**
 * Referenčná šírka okna pre počítačové zobrazenie.
 *
 * Plátno NESMIE mať šírku pruhu v admine. Typografia webu je v `clamp()`
 * s jednotkou `vw` (napr. `--text-sm: clamp(0.875rem, 0.825rem + 0.2vw, 1rem)`),
 * takže veľkosť písma závisí od šírky OKNA. V pruhu širokom 970 px vyšiel
 * popis pod obrázkom 15,14 px namiesto 16 px ako na webe pri 1440 px.
 * Plátno preto kreslí do okna širokého 1440 px a celé sa pomerovo zmenší,
 * aby sa zmestilo — rozvrh aj veľkosti tak sedia, mení sa len mierka.
 */
export const DESKTOP_CANVAS_WIDTH = 1440;

// ── iframe ───────────────────────────────────────────────────────────────────

/** Prenesie štýly hlavného dokumentu do okna plátna (vrátane HMR v dev režime). */
function syncStyles(target: Document) {
  const head = target.head;
  head.querySelectorAll('[data-ed-style]').forEach((n) => n.remove());
  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    const copy = node.cloneNode(true) as HTMLElement;
    copy.setAttribute('data-ed-style', '');
    head.appendChild(copy);
  });
}

function CanvasFrame({
  width,
  zoom,
  onKeyDown,
  children,
}: {
  width: number;
  zoom: CanvasZoom;
  onKeyDown?: (e: KeyboardEvent) => void;
  children: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [height, setHeight] = useState(600);
  const [scale, setScale] = useState(1);
  const keyRef = useRef(onKeyDown);
  keyRef.current = onKeyDown;

  useEffect(() => {
    const frame = frameRef.current;
    const d = frame?.contentDocument;
    if (!d) return;

    // `base` je nutný: bez neho by sa relatívne cesty (fonty z @font-face)
    // hľadali voči about:blank a písmo by spadlo na systémové.
    d.open();
    d.write('<!DOCTYPE html><html lang="sk"><head><base href="/"></head><body></body></html>');
    d.close();
    d.documentElement.dataset.sat = 'pecat';
    d.body.style.margin = '0';
    syncStyles(d);
    setDoc(d);

    const styleObserver = new MutationObserver(() => syncStyles(d));
    styleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });

    const sizeObserver = new ResizeObserver(() => {
      setHeight(Math.max(240, d.documentElement.scrollHeight));
    });
    sizeObserver.observe(d.documentElement);

    // Klávesy stlačené v okne plátna sa musia dostať k editoru (Ctrl+Z, šípky…).
    const onKey = (e: KeyboardEvent) => keyRef.current?.(e);
    d.addEventListener('keydown', onKey);

    return () => {
      styleObserver.disconnect();
      sizeObserver.disconnect();
      d.removeEventListener('keydown', onKey);
    };
  }, []);

  // Zmenšenie na dostupnú šírku. Nikdy sa nezväčšuje nad 1:1.
  // Pri `full` sa nemení nič — plátno ostáva v skutočnej veľkosti a obal
  // sa posúva do strán. Písanie vo Fáze 3 musí ísť v skutočnej veľkosti.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    if (zoom === 'full') { setScale(1); return; }
    const fit = () => setScale(Math.min(1, box.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width, zoom]);

  return (
    <div ref={boxRef} style={{ width: '100%', overflowX: zoom === 'full' ? 'auto' : 'visible' }}>
      <div
        style={{
          width: width * scale,
          height: height * scale,
          margin: '0 auto',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 0 0 1px var(--ad-line), 0 10px 30px rgba(40,28,10,.13)',
        }}
      >
        <iframe
          ref={frameRef}
          title="Náhľad článku"
          style={{
            width,
            // `max-width: 100%` z preflightu by okno orezalo na šírku pruhu
            // v admine a `vw` typografia by potom počítala z nesprávnej šírky.
            maxWidth: 'none',
            height,
            border: 'none',
            display: 'block',
            background: 'var(--l-paper, #f7f4ed)',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        />
      </div>
      {doc && createPortal(children, doc.body)}
    </div>
  );
}

// ── Plátno ───────────────────────────────────────────────────────────────────

export interface CanvasArticle {
  title: string;
  excerpt?: string;
  authorName?: string;
  readingTime?: number;
  /** Médium zo Strapi (objekt z GET-u) alebo null. */
  coverImage?: any | null;
  /** Výrez titulnej fotografie, napr. „center 30%". */
  coverPosition?: string;
  /** Bloky v tvare Strapi + `__uid` editora. */
  blocks: any[];
}

export interface EditorCanvasProps {
  article: CanvasArticle;
  device: CanvasDevice;
  zoom?: CanvasZoom;
  selectedUid?: string | null;
  onSelect?: (uid: string | null) => void;
  onMove?: (uid: string, toIndex: number) => void;
  onDelete?: (uid: string) => void;
  onDuplicate?: (uid: string) => void;
  onInsert?: (type: string, atIndex: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  /** Zmena textu v bloku — ukladá sa do `data.body` a blok sa označí ako upravený. */
  onBodyChange?: (uid: string, body: any[]) => void;
  /** Zmena ktoréhokoľvek poľa bloku (pozícia obrázka, popis, zdroje…). */
  onPatch?: (uid: string, patch: any) => void;
  /** Otvorí knižnicu médií pre blok. */
  onPickMedia?: (uid: string, multiple: boolean) => void;
  /** Pobočný stĺpec — upravuje sa priamo na plátne (nie v pravom paneli). */
  facts?: Fact[];
  timeline?: Event[];
  /** Ťahanie titulnej fotografie mení jej výrez. */
  onCoverPositionChange?: (value: string) => void;
  onFactsChange?: (next: Fact[]) => void;
  onTimelineChange?: (next: Event[]) => void;
  blockTypes?: { id: string; label: string; accent: string }[];
  /** Len na meranie: vykreslí bloky bez obalu `BlockShell`. */
  noShell?: boolean;
}

const LABELS: Record<string, string> = {
  'content.rich-text': 'Text',
  'content.image-block': 'Obrázok',
  'content.quote-block': 'Citát',
  'content.sources': 'Zdroje',
  'content.embed': 'Vložené video',
  'content.poem': 'Báseň',
  'content.image-gallery': 'Galéria',
};

export function EditorCanvas({
  article, device, zoom = 'fit', selectedUid = null, onSelect, onMove, onDelete, onDuplicate, onInsert,
  onKeyDown, onBodyChange, onPatch, onPickMedia, blockTypes = [], noShell,
  facts = [], timeline = [], onFactsChange, onTimelineChange, onCoverPositionChange,
}: EditorCanvasProps) {
  const cover = article.coverImage ? getStrapiImageUrl(article.coverImage) : null;
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const overlayBlocks: OverlayBlock[] = useMemo(
    () => article.blocks.map((b) => ({
      uid: b.__uid,
      type: b.__component,
      label: LABELS[b.__component] || 'Blok',
      data: b,
    })),
    [article.blocks]
  );

  const ui = useMemo(
    () => ({
      selectedUid,
      hoverUid,
      editingUid,
      select: (uid: string | null) => {
        onSelect?.(uid);
        // Klik do textového bloku rovno otvorí písanie; iný blok ho ukončí.
        const b = article.blocks.find((x) => x.__uid === uid);
        setEditingUid(b && b.__component === 'content.rich-text' && onBodyChange ? uid : null);
      },
      hover: setHoverUid,
      renderInline: onBodyChange
        ? (uid: string) => {
            const b = article.blocks.find((x) => x.__uid === uid);
            // Iniciálku má prvý textový blok so skutočným odsekom — to isté
            // pravidlo ako na webe (`hasRealParagraph`), aby sa písmeno počas
            // písania nestratilo ani neobjavilo inde.
            const first = article.blocks.find(hasRealParagraph);
            return (
              <RichTextInline
                key={uid}
                body={b?.body}
                dropCap={!!b && !!first && (first as any).__uid === uid}
                onChange={(next) => onBodyChange(uid, next)}
                onDone={() => setEditingUid(null)}
              />
            );
          }
        : undefined,
    }),
    [selectedUid, hoverUid, editingUid, onSelect, onBodyChange, article.blocks]
  );

  return (
    <CanvasFrame
      width={device === 'mobil' ? MOBILE_CANVAS_WIDTH : DESKTOP_CANVAS_WIDTH}
      zoom={zoom}
      onKeyDown={onKeyDown}
    >
      <EditorUIContext.Provider value={ui}>
        {/* `lab` + `data-theme` nesú premenné šatu Pečať, rovnako ako na webe. */}
        <div className="min-h-screen lab" data-theme="pecat" onMouseDown={() => onSelect?.(null)}>
          <div className="lart">
            <header className={cover ? 'lart-hero' : 'lart-hero lart-hero-plain'}>
              {cover && (
                <CoverImage
                  src={cover}
                  position={article.coverPosition || 'center center'}
                  onChange={onCoverPositionChange}
                />
              )}
              {/* `pointer-events-none`: závoj leží nad fotografiou a bral jej
                  kliknutia, takže sa ťahanie výrezu vôbec nespustilo. Samotná
                  vlastnosť v CSS neprejde — globals.css ju pravidlom „NUCLEAR
                  OPTION" prebíja, trieda má vlastné !important. */}
              <div className="lart-hero-veil pointer-events-none" aria-hidden="true" />
              <div className="lart-hero-in">
                <h1 className="lart-title">{article.title || 'Bez názvu'}</h1>
                {article.excerpt && <p className="lart-excerpt">{article.excerpt}</p>}
                <div className="lart-meta">
                  <span>{article.authorName || 'Hradiská.sk'}</span>
                  <span className="lart-meta-dot" aria-hidden="true" />
                  <span>{article.readingTime || 1} min čítania</span>
                </div>
              </div>
            </header>

            <section className="py-8 md:py-12 container mx-auto px-4 relative z-10">
              <article className="lart-card rounded-xl overflow-hidden">
                {/* 12-stĺpcový grid ako na webe: text v ľavých ôsmich, pobočný
                    stĺpec v pravých štyroch. Bez neho by text sedel v strede
                    karty — na webe je o ~230 px viac vľavo (namerané). */}
                <div className="grid-layout article-grid">
                <div className="p-6 md:p-8 article-main-col">
                  <div className="article-body-wrapper" lang="sk" style={{ maxWidth: 668, margin: '0 auto' }}>
                    {/* Kotva pre vrstvu ovládania. `position: relative` je na nej
                        jedinou odchýlkou od webu a rozvrh nemení. */}
                    <div ref={bodyRef} data-canvas-body style={{ position: 'relative' }} onMouseDown={(e) => e.stopPropagation()}>
                      {article.blocks.length > 0 ? (
                        <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                          <DynamicZoneRenderer blocks={article.blocks} editMode={!noShell} />
                        </div>
                      ) : (
                        /* Prázdny článok: tlačidlá „+" sa kreslia len MEDZI blokmi,
                           takže bez tejto dlaždice by sa nedal vôbec začať. */
                        <BlockPicker
                          variant="empty"
                          blockTypes={blockTypes}
                          onPick={(type) => onInsert?.(type, 0)}
                        />
                      )}

                      {!noShell && onMove && (
                        <BlockOverlay
                          blocks={overlayBlocks}
                          selectedUid={selectedUid}
                          hoverUid={hoverUid}
                          onSelect={(uid) => onSelect?.(uid)}
                          onMove={onMove}
                          onDelete={(uid) => onDelete?.(uid)}
                          onDuplicate={(uid) => onDuplicate?.(uid)}
                          onInsert={(type, at) => onInsert?.(type, at)}
                          onPatch={(uid, patch) => onPatch?.(uid, patch)}
                          onPickMedia={(uid, multiple) => onPickMedia?.(uid, multiple)}
                          blockTypes={blockTypes}
                          rootRef={bodyRef}
                        />
                      )}
                    </div>
                    <div className="clear-both" />
                  </div>
                </div>

                {/* Pobočný stĺpec sa needituje na plátne — drží metadáta
                    z pravého panela. Miesto mu tu ale patrí, inak by text
                    nesedel s webom. */}
                <aside className="article-sidebar-col p-6 md:p-8">
                  {onFactsChange && onTimelineChange ? (
                    <SideColumnEditor
                      facts={facts}
                      timeline={timeline}
                      onFactsChange={onFactsChange}
                      onTimelineChange={onTimelineChange}
                    />
                  ) : (
                    <div className="ed-side-note">
                      <strong>Pobočný stĺpec</strong>
                      <span>Kľúčové fakty, časová os a mapa lokality.</span>
                    </div>
                  )}
                </aside>
                </div>
              </article>
            </section>
          </div>
        </div>
        <style>{canvasCss}</style>
      </EditorUIContext.Provider>
    </CanvasFrame>
  );
}

/* Štýly, ktoré patria LEN plátnu — na web sa nikdy nedostanú, lebo žijú
   v okne plátna. Obal bloku nemá box (`display: contents`), takže všetko
   ovládanie je vo vrstve nad článkom a do rozvrhu nezasahuje. */
const canvasCss = `
.ed-block { display: contents; }

/* Karta článku má na webe skryté pretečenie kvôli zaobleným rohom. V editore
   by orezala ponuku „Vložiť blok" aj lišty blokov pri okraji — tu preto
   pretečenie prepúšťa. Na rozvrh to nemá vplyv. */
.lart-card { overflow: visible !important; }
/* Miesto pod článkom, aby sa ponuka na konci mala kam otvoriť. */
.article-body-wrapper { padding-bottom: 44px; }

/* Písanie priamo v stránke — žiadny rám ani pozadie ako v poli formulára,
   len jemný podklad, aby bolo vidieť, kde sa píše. */
.ed-inline { position: relative; }
.ed-inline .ProseMirror { outline: none; }
.ed-inline .ProseMirror:focus { outline: none; }
.ed-inline::before {
  content: ''; position: absolute; inset: -8px -12px; border-radius: 8px;
  background: rgba(255, 253, 244, .65); box-shadow: 0 0 0 1px rgba(138,83,22,.25);
  pointer-events: none;
}
.ed-inline > * { position: relative; }
/* Prázdny textový blok má na webe nulovú výšku, takže by sa doň nedalo
   kliknúť. V editore mu preto pribudne výzva. Existujúcich článkov sa to
   netýka — v databáze nie je ani jeden prázdny textový blok. */
.ed-inline .ProseMirror p:only-child:empty::after,
.ed-block[data-block-type="content.rich-text"] > div:empty::after {
  content: 'Kliknutím začnite písať…';
  display: block;
  color: #a4957a;
  font-style: italic;
  font-size: 15px;
  padding: 6px 0;
}

.ed-textbar {
  position: absolute; z-index: 45; transform: translateX(-50%);
  display: flex; align-items: center; gap: 1px; padding: 3px;
  background: #2f2418; border-radius: 9px; box-shadow: 0 6px 18px rgba(20,12,4,.35);
}
.ed-textbar button {
  width: 28px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: none; color: #f0e6d2; border-radius: 6px; cursor: pointer;
  pointer-events: auto !important;
}
.ed-textbar button:hover { background: rgba(255,255,255,.14); }
.ed-textbar button.is-on { background: #b8792d; color: #fff; }
.ed-textbar-sep { width: 1px; height: 18px; background: rgba(255,255,255,.18); margin: 0 3px; }

.ed-overlay { position: absolute; inset: 0; z-index: 30; }
/* Tlačidlá musia klikať aj vo vrstve, ktorá sama kliknutia prepúšťa. */
.ed-overlay button { pointer-events: auto !important; font: inherit; }
.ed-frame, .ed-drop { pointer-events: none !important; }

/* Rámik výberu musí byť NAD pruhmi na vkladanie, inak pruh prekryje lištu
   bloku a jej tlačidlá sa nedajú kliknúť (odhalil test Fázy 2). */
.ed-frame {
  position: absolute; border-radius: 6px; pointer-events: none;
  outline-offset: 3px; z-index: 34;
}
.ed-frame-hover { outline: 1.5px dashed rgba(138,83,22,.55); }
.ed-frame-selected { outline: 2px solid #8a5316; }

.ed-frame-tag {
  position: absolute; top: -10px; left: 0;
  font: 500 10.5px/1.6 Inter, system-ui, sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: #fff; background: rgba(138,83,22,.75);
  padding: 1px 7px; border-radius: 5px; white-space: nowrap;
}
.ed-frame-tag-on { background: #8a5316; }

.ed-grip {
  position: absolute; left: -34px; top: 0;
  width: 26px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #d8c9ab; border-radius: 7px; background: #fffdf7; color: #8a5316;
  cursor: grab; touch-action: none;
}
.ed-grip:active { cursor: grabbing; }

.ed-toolbar {
  position: absolute; right: 0; top: -36px; display: flex; gap: 2px;
  background: #fffdf7; border: 1px solid #d8c9ab; border-radius: 8px; padding: 2px;
  box-shadow: 0 4px 12px rgba(60,40,15,.14);
}
.ed-toolbar button {
  width: 28px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border: none; background: none; color: #5b4a2f; border-radius: 6px; cursor: pointer;
}
.ed-toolbar button:hover:not(:disabled) { background: #f1e6cf; }
.ed-toolbar button:disabled { opacity: .35; cursor: not-allowed; }
.ed-toolbar .ed-danger:hover { background: #f6d9d5; color: #8f2a20; }

/* Pruh medzi blokmi musí mať výšku, inak nie je na čo nabehnúť myšou.
   16 px sa zmestí do medzery medzi blokmi (24 px), takže neberie klikanie textu. */
/* Iniciálka počas písania. Vykreslený článok ju robí vloženým span-om;
   v editore to musí spraviť CSS, inak by ProseMirror písal „za" písmeno.
   Rozmery sú odpísané z DynamicZoneRenderer (text-7xl, leading .75). */
.ed-inline.is-first .ProseMirror > p:first-of-type {
  font-family: Georgia, "Times New Roman", serif;
}
.ed-inline.is-first .ProseMirror > p:first-of-type::first-letter {
  float: left;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 4.5rem; font-weight: 700; line-height: .75;
  color: #b45309; margin-top: .1em; margin-right: .75rem;
}

/* Prázdny blok (video bez adresy, báseň bez veršov, galéria bez fotiek…).
   Bez nej sa taký blok nevykreslí vôbec — a čo nie je vidieť, to sa nedá ani
   vybrať, ani vyplniť, ani zmazať. */
.ed-block-empty {
  display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;
  min-height: 96px; padding: 18px 20px; text-align: center;
  border: 1.5px dashed #d8c9ab; border-radius: 12px; background: rgba(255,253,244,.7);
  font-family: Inter, system-ui, sans-serif;
}
.ed-block-empty b { font-size: 14px; font-weight: 600; color: #3b3021; }
.ed-block-empty span { font-size: 12.5px; color: #8a795e; }

.ed-gap { position: absolute; left: 0; right: 0; height: 16px; transform: translateY(-8px); }
/* „+" je v STREDE medzery, nie pri ľavom okraji: tam sedí úchyt vybraného
   bloku a prekrýval by ho (odhalil test vkladania siedmich typov za sebou). */
.ed-gap-btn {
  position: absolute; left: 50%; margin-left: -11px; top: -3px; z-index: 2;
  width: 22px; height: 22px; border-radius: 999px;
  border: 1px solid #d8c9ab; background: #fffdf7; color: #8a5316;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; opacity: 0; transition: opacity .12s;
}
.ed-gap:hover .ed-gap-btn, .ed-gap-btn:focus-visible { opacity: 1; }

/* Posledná medzera je vždy viditeľná a má popis — je to hlavná cesta,
   ako v článku pokračovať. */
.ed-gap.is-last { height: 40px; transform: translateY(2px); }
.ed-gap.is-last .ed-gap-btn {
  opacity: 1; left: 0; margin-left: 0; width: auto; top: 0; height: 32px;
  padding: 0 12px; gap: 6px; border-radius: 8px; border-style: dashed;
  font: 500 13px Inter, system-ui, sans-serif;
}
.ed-gap.is-last .ed-gap-btn:hover { background: var(--ad-active-bg, #fffaf0); border-color: #b8792d; }
.ed-gap.is-last .ed-gap-line { display: none; }
/* Posledné tlačidlo je na konci článku — ponuka sa otvára NAHOR, inak by
   visela na spodnej hrane plátna a musela by ho naťahovať. */
.ed-gap.is-last .ed-menu { left: 0; margin-left: 0; top: auto; bottom: 40px; }
.ed-gap-line {
  position: absolute; left: 0; right: 0; top: 8px; height: 1px; pointer-events: none !important;
  background: rgba(138,83,22,.35); opacity: 0; transition: opacity .12s;
}
.ed-gap:hover .ed-gap-line { opacity: 1; }

.ed-menu {
  position: absolute; left: 50%; margin-left: -105px; top: 22px; z-index: 40;
  width: 210px; background: #fffdf7; border: 1px solid #d8c9ab; border-radius: 10px;
  box-shadow: 0 10px 26px rgba(60,40,15,.2); padding: 5px; pointer-events: auto;
}
.ed-menu-head {
  display: flex; align-items: center; justify-content: space-between;
  font: 600 11px/1.8 Inter, system-ui, sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: #8a795e; padding: 3px 7px 5px;
}
.ed-menu-head button { border: none; background: none; color: #8a795e; cursor: pointer; padding: 0; }
.ed-menu { width: 260px; }
.ed-menu > button[role="menuitem"] {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 7px 8px; border: none; background: none; border-radius: 8px;
  color: #3b3021; cursor: pointer; text-align: left;
}
.ed-menu > button[role="menuitem"]:hover { background: #f1e6cf; }
.ed-menu-icon {
  width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0; color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
}
.ed-menu-text { display: flex; flex-direction: column; line-height: 1.3; min-width: 0; }
.ed-menu-text b { font-size: 13.5px; font-weight: 600; }
.ed-menu-text i { font-size: 11.5px; font-style: normal; color: #8a795e; }

/* Prázdny článok — výber prvého bloku. */
.ed-empty {
  border: 1.5px dashed #d8c9ab; border-radius: 14px; padding: 22px;
  background: rgba(255,253,244,.6); font-family: Inter, system-ui, sans-serif;
}
.ed-empty-head { text-align: center; margin-bottom: 16px; }
.ed-empty-head strong { display: block; font-size: 17px; color: #3b3021; margin-bottom: 4px; }
.ed-empty-head span { font-size: 13px; color: #8a795e; }
.ed-empty-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); gap: 10px;
}
.ed-empty-card {
  display: flex; flex-direction: column; gap: 3px; align-items: flex-start;
  padding: 12px; border: 1px solid #e2d6bc; border-radius: 11px;
  background: #fff; cursor: pointer; text-align: left;
  transition: border-color .12s, box-shadow .12s, transform .12s;
  pointer-events: auto !important;
}
.ed-empty-card:hover {
  border-color: #b8792d; box-shadow: 0 6px 16px rgba(60,40,15,.12); transform: translateY(-1px);
}
.ed-empty-icon {
  width: 30px; height: 30px; border-radius: 9px; color: #fff; margin-bottom: 5px;
  display: inline-flex; align-items: center; justify-content: center;
}
.ed-empty-label { font-size: 13.5px; font-weight: 600; color: #3b3021; }
.ed-empty-hint { font-size: 11.5px; color: #8a795e; line-height: 1.35; }

/* Titulná fotografia — ťahanie výrezu. */
.lart-hero-img { pointer-events: auto !important; }
.lart-hero-img:active { cursor: grabbing !important; }
.ed-cover-hint {
  position: absolute; left: 50%; top: 18px; transform: translateX(-50%);
  z-index: 8; pointer-events: none;
  background: rgba(20,14,6,.82); color: #f4ead6;
  font: 500 12.5px/1.6 Inter, system-ui, sans-serif;
  padding: 4px 12px; border-radius: 8px; white-space: nowrap;
}

/* Vysvetlivka v pobočnom stĺpci — len v editore. */
.ed-side-note {
  border: 1.5px dashed #d8c9ab; border-radius: 10px; padding: 14px 16px;
  font-family: Inter, system-ui, sans-serif; color: #8a795e; background: rgba(255,253,244,.5);
}
.ed-side-note strong { display: block; font-size: 12.5px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 5px; }
.ed-side-note span { font-size: 12.5px; line-height: 1.5; }

/* ── Obrázok myšou (Fáza 4) ─────────────────────────────────────────────── */
.ed-img-move { position: absolute; cursor: grab; pointer-events: auto !important; border-radius: 6px; }
.ed-img-move:active { cursor: grabbing; }
.ed-img-size {
  position: absolute; width: 26px; height: 26px; border-radius: 999px;
  border: 1px solid #8a5316; background: #fffdf7; color: #8a5316;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: nwse-resize; touch-action: none; z-index: 36;
  box-shadow: 0 2px 6px rgba(60,40,15,.25);
}
.ed-img-tag {
  position: absolute; z-index: 38; pointer-events: none;
  font: 600 11.5px/1.7 Inter, system-ui, sans-serif;
  background: #2f2418; color: #f4ead6; padding: 2px 9px; border-radius: 6px;
}
.ed-zones { position: absolute; inset: 0; pointer-events: none; }
.ed-zone {
  position: absolute; border: 1.5px dashed rgba(138,83,22,.45); border-radius: 8px;
  background: rgba(255,247,229,.35);
  font: 500 11px/1.4 Inter, system-ui, sans-serif; color: #8a5316;
  display: flex; align-items: flex-start; justify-content: center; padding-top: 6px;
  transition: background .12s, border-color .12s;
}
.ed-zone.is-on { background: rgba(184,121,45,.22); border-color: #8a5316; border-style: solid; }
.ed-zone-left { left: 0; top: 0; width: 28%; height: 100%; }
.ed-zone-center { left: 30%; top: 26px; width: 40%; height: calc(100% - 26px); }
.ed-zone-full { left: 30%; top: 0; width: 40%; height: 24px; padding-top: 2px; }
.ed-zone-right { right: 0; top: 0; width: 28%; height: 100%; }
.ed-zone-breakout { left: -6%; top: 0; width: 5%; height: 100%; }

.ed-steps { position: absolute; left: 0; right: 0; pointer-events: none; }
.ed-step { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(138,83,22,.35); }
.ed-step.is-on { background: #8a5316; width: 2px; }

.ed-alt {
  position: absolute; z-index: 40; display: flex; align-items: center; gap: 7px;
  background: #8f2a20; color: #fff; padding: 5px 10px; border-radius: 8px;
  font: 500 12.5px/1.5 Inter, system-ui, sans-serif; pointer-events: auto !important;
  box-shadow: 0 4px 12px rgba(80,20,12,.3);
}
.ed-alt input {
  border: none; border-radius: 5px; padding: 3px 7px; font: inherit; width: 220px;
  background: #fff; color: #2f2418;
}

/* ── Polia ostatných blokov (Fáza 5) ────────────────────────────────────── */
.ed-fields { position: absolute; left: 0; width: 100%; z-index: 39; pointer-events: auto !important; }
.edf {
  background: #fffdf7; border: 1px solid #d8c9ab; border-radius: 10px;
  padding: 12px 14px; box-shadow: 0 8px 22px rgba(60,40,15,.16);
  font-family: Inter, system-ui, sans-serif;
}
.edf-head {
  font: 600 11px/1.8 Inter, system-ui, sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: #8a795e; margin-bottom: 8px;
}
.edf-hint { font-size: 11.5px; color: #8a795e; margin: 8px 0 0; line-height: 1.45; }
.edf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.edf-field { display: block; margin-bottom: 9px; }
.edf-field > span { display: block; font-size: 12px; color: #6b5a3f; margin-bottom: 3px; }
.edf-field > span b { color: #8f2a20; }
.edf-field input, .edf-field textarea, .edf-field select {
  width: 100%; border: 1px solid #d8c9ab; border-radius: 7px; padding: 6px 9px;
  font: inherit; font-size: 13.5px; color: #2f2418; background: #fff;
}
.edf-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 8px; }
.edf-item { display: grid; grid-template-columns: 1fr 180px auto; gap: 6px; align-items: start; }
.edf-item textarea, .edf-item input {
  border: 1px solid #d8c9ab; border-radius: 7px; padding: 6px 9px; font: inherit; font-size: 13px;
}
.edf-item-btns { display: flex; gap: 2px; }
.edf-item-btns button, .edf-add {
  border: 1px solid #d8c9ab; background: #fff; color: #5b4a2f;
  border-radius: 7px; padding: 5px 8px; cursor: pointer; font: inherit; font-size: 12.5px;
  display: inline-flex; align-items: center; gap: 5px;
}
.edf-item-btns button:disabled { opacity: .35; cursor: not-allowed; }
.edf-item-btns .edf-danger:hover { background: #f6d9d5; color: #8f2a20; }
.edf-gallery { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.edf-thumb { position: relative; width: 84px; }
.edf-thumb img { width: 84px; height: 62px; object-fit: cover; border-radius: 7px; border: 1px solid #d8c9ab; }
.edf-thumb .edf-item-btns { margin-top: 3px; }

.ed-toolbar-sep { width: 1px; height: 18px; background: #e0d3b6; margin: 0 3px; align-self: center; }
.ed-toolbar button.is-on { background: #8a5316; color: #fff; }

.ed-drop {
  position: absolute; left: -6px; right: -6px; height: 3px; border-radius: 2px;
  background: #8a5316; box-shadow: 0 0 0 3px rgba(138,83,22,.18);
}

@media (max-width: ${MOBILE_MAX_PX}px) {
  .ed-grip { left: -28px; }
  .ed-toolbar { top: -34px; }
}
`;
