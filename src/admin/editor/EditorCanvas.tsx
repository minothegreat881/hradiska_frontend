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
 * Šírka textového stĺpca sa musí zhodovať s webom, preto je tu rovnaký reťazec
 * obalov ako v `design-lab/LabArticle.tsx` (`container px-4` → `.lart-card` →
 * `p-6 md:p-8` → stĺpec max. 668 px). Vynechaný je len 12-stĺpcový grid so
 * pobočným stĺpcom: ten drží metadáta, ktoré sa upravujú v pravom paneli, a na
 * šírku textu nemá vplyv (stĺpec je aj tak orezaný na 668 px).
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DynamicZoneRenderer } from '../../components/DynamicZoneRenderer';
import { getStrapiImageUrl } from '../../lib/strapi';
import { MOBILE_MAX_PX } from './snapping/positionZones';

export type CanvasDevice = 'desktop' | 'mobil';

/** Šírka okna, v ktorom plátno kreslí mobilnú podobu. */
export const MOBILE_CANVAS_WIDTH = 390;

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
  children,
}: {
  width: number | '100%';
  children: React.ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [height, setHeight] = useState(600);

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

    return () => {
      styleObserver.disconnect();
      sizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <iframe
        ref={frameRef}
        title="Náhľad článku"
        style={{
          width: typeof width === 'number' ? width : '100%',
          height,
          border: 'none',
          display: 'block',
          margin: '0 auto',
          background: 'var(--l-paper, #f7f4ed)',
          boxShadow: typeof width === 'number' ? '0 0 0 1px var(--ad-line), 0 10px 30px rgba(40,28,10,.13)' : 'none',
          borderRadius: typeof width === 'number' ? 14 : 0,
        }}
      />
      {doc && createPortal(children, doc.body)}
    </>
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
  /** Bloky v tvare Strapi: `{ __component, …polia }`. */
  blocks: any[];
}

export function EditorCanvas({
  article,
  device,
  noShell,
}: {
  article: CanvasArticle;
  device: CanvasDevice;
  /** Len na meranie: vykreslí bloky bez obalu `BlockShell`. */
  noShell?: boolean;
}) {
  const cover = article.coverImage ? getStrapiImageUrl(article.coverImage) : null;

  return (
    <CanvasFrame width={device === 'mobil' ? MOBILE_CANVAS_WIDTH : '100%'}>
      {/* `lab` + `data-theme` nesú premenné šatu Pečať, rovnako ako na webe. */}
      <div className="min-h-screen lab" data-theme="pecat">
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
                  {article.blocks.length > 0 ? (
                    <div className="prose prose-stone max-w-none article-content" style={{ display: 'flow-root' }}>
                      <DynamicZoneRenderer blocks={article.blocks} editMode={!noShell} />
                    </div>
                  ) : (
                    <p className="lart-empty">Článok zatiaľ nemá žiadny blok. Pridajte prvý vľavo dole.</p>
                  )}
                  <div className="clear-both" />
                </div>
              </div>
            </article>
          </section>
        </div>
      </div>
      <style>{canvasCss}</style>
    </CanvasFrame>
  );
}

/* Štýly, ktoré patria LEN plátnu — na web sa nikdy nedostanú, lebo žijú
   v okne plátna. Rámik je `outline`, aby nezaberal miesto a neposúval text. */
const canvasCss = `
.ed-block { position: relative; }
.ed-block:hover { outline: 1.5px dashed var(--hr-accent-soft, #b8792d); outline-offset: 4px; }
.ed-block-tag {
  position: absolute; top: -9px; left: 0; z-index: 5;
  font: 500 10.5px/1.5 Inter, system-ui, sans-serif; letter-spacing: .06em;
  text-transform: uppercase; color: #fff; background: #8a5316;
  padding: 1px 7px; border-radius: 5px; pointer-events: none; opacity: 0;
  transition: opacity .12s;
}
.ed-block:hover > .ed-block-tag { opacity: 1; }
@media (max-width: ${MOBILE_MAX_PX}px) {
  .ed-block:hover { outline-offset: 2px; }
}
`;
