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
import { DynamicZoneRenderer } from '../../components/DynamicZoneRenderer';
import { getStrapiImageUrl } from '../../lib/strapi';
import { MOBILE_MAX_PX } from './snapping/positionZones';
import { EditorUIContext } from './EditorUIContext';
import { BlockOverlay, type OverlayBlock } from './BlockOverlay';

export type CanvasDevice = 'desktop' | 'mobil';

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
  onKeyDown,
  children,
}: {
  width: number;
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
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const fit = () => setScale(Math.min(1, box.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={boxRef} style={{ width: '100%' }}>
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
  /** Bloky v tvare Strapi + `__uid` editora. */
  blocks: any[];
}

export interface EditorCanvasProps {
  article: CanvasArticle;
  device: CanvasDevice;
  selectedUid?: string | null;
  onSelect?: (uid: string | null) => void;
  onMove?: (uid: string, toIndex: number) => void;
  onDelete?: (uid: string) => void;
  onDuplicate?: (uid: string) => void;
  onInsert?: (type: string, atIndex: number) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
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
  article, device, selectedUid = null, onSelect, onMove, onDelete, onDuplicate, onInsert,
  onKeyDown, blockTypes = [], noShell,
}: EditorCanvasProps) {
  const cover = article.coverImage ? getStrapiImageUrl(article.coverImage) : null;
  const [hoverUid, setHoverUid] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const overlayBlocks: OverlayBlock[] = useMemo(
    () => article.blocks.map((b) => ({
      uid: b.__uid,
      type: b.__component,
      label: LABELS[b.__component] || 'Blok',
    })),
    [article.blocks]
  );

  const ui = useMemo(
    () => ({
      selectedUid,
      hoverUid,
      select: (uid: string | null) => onSelect?.(uid),
      hover: setHoverUid,
    }),
    [selectedUid, hoverUid, onSelect]
  );

  return (
    <CanvasFrame width={device === 'mobil' ? MOBILE_CANVAS_WIDTH : DESKTOP_CANVAS_WIDTH} onKeyDown={onKeyDown}>
      <EditorUIContext.Provider value={ui}>
        {/* `lab` + `data-theme` nesú premenné šatu Pečať, rovnako ako na webe. */}
        <div className="min-h-screen lab" data-theme="pecat" onMouseDown={() => onSelect?.(null)}>
          <div className="lart">
            <header className={cover ? 'lart-hero' : 'lart-hero lart-hero-plain'}>
              {cover && <img className="lart-hero-img" src={cover} alt="" aria-hidden="true" decoding="async" />}
              <div className="lart-hero-veil" aria-hidden="true" />
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
                <div className="p-6 md:p-8">
                  <div className="article-body-wrapper" lang="sk" style={{ maxWidth: 668, margin: '0 auto' }}>
                    {/* Kotva pre vrstvu ovládania. `position: relative` je na nej
                        jedinou odchýlkou od webu a rozvrh nemení. */}
                    <div ref={bodyRef} style={{ position: 'relative' }} onMouseDown={(e) => e.stopPropagation()}>
                      {article.blocks.length > 0 ? (
                        <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                          <DynamicZoneRenderer blocks={article.blocks} editMode={!noShell} />
                        </div>
                      ) : (
                        <p className="lart-empty">Článok zatiaľ nemá žiadny blok. Pridajte prvý tlačidlom „+".</p>
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
                          blockTypes={blockTypes}
                          rootRef={bodyRef}
                        />
                      )}
                    </div>
                    <div className="clear-both" />
                  </div>
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
.ed-gap { position: absolute; left: 0; right: 0; height: 16px; transform: translateY(-8px); }
.ed-gap-btn {
  position: absolute; left: -34px; top: -3px;
  width: 22px; height: 22px; border-radius: 999px;
  border: 1px solid #d8c9ab; background: #fffdf7; color: #8a5316;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; opacity: 0; transition: opacity .12s;
}
.ed-gap:hover .ed-gap-btn, .ed-gap-btn:focus-visible { opacity: 1; }
.ed-gap-line {
  position: absolute; left: 0; right: 0; top: 8px; height: 1px;
  background: rgba(138,83,22,.35); opacity: 0; transition: opacity .12s;
}
.ed-gap:hover .ed-gap-line { opacity: 1; }

.ed-menu {
  position: absolute; left: -34px; top: 22px; z-index: 40;
  width: 210px; background: #fffdf7; border: 1px solid #d8c9ab; border-radius: 10px;
  box-shadow: 0 10px 26px rgba(60,40,15,.2); padding: 5px; pointer-events: auto;
}
.ed-menu-head {
  display: flex; align-items: center; justify-content: space-between;
  font: 600 11px/1.8 Inter, system-ui, sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: #8a795e; padding: 3px 7px 5px;
}
.ed-menu-head button { border: none; background: none; color: #8a795e; cursor: pointer; padding: 0; }
.ed-menu > button[role="menuitem"] {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 8px; border: none; background: none; border-radius: 7px;
  font-size: 13.5px; color: #3b3021; cursor: pointer; text-align: left;
}
.ed-menu > button[role="menuitem"]:hover { background: #f1e6cf; }
.ed-menu-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }

.ed-drop {
  position: absolute; left: -6px; right: -6px; height: 3px; border-radius: 2px;
  background: #8a5316; box-shadow: 0 0 0 3px rgba(138,83,22,.18);
}

@media (max-width: ${MOBILE_MAX_PX}px) {
  .ed-grip, .ed-gap-btn, .ed-menu { left: -28px; }
  .ed-toolbar { top: -34px; }
}
`;
