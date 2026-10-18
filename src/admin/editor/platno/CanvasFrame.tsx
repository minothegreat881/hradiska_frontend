'use client';

/**
 * Okno plátna (iframe) — spoločné pre editor článkov aj editor vzhľadu webu.
 *
 * Presunuté z `EditorCanvas.tsx` bez zmeny správania (editor článkov ho
 * importuje odtiaľto). Prečo vlastné okno a nie `div`:
 *
 *   • Mobilné pravidlá sú v CSS ako `@media (max-width: 767px)` a tie
 *     reagujú na šírku OKNA, nie na šírku pruhu v admine. V iframe so šírkou
 *     390 px platia rovnaké pravidlá ako na telefóne.
 *   • Typografia webu je v `clamp()` s jednotkou `vw` — veľkosť písma závisí
 *     od šírky okna. Počítačové plátno preto kreslí do okna širokého 1440 px
 *     a celé sa pomerovo zmenší (`zoom: 'fit'`).
 *
 * React beží ako JEDEN strom: obsah okna sa vykresľuje portálom, takže stav,
 * kontexty aj udalosti sú spoločné s adminom (žiadne `postMessage`).
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/** `fit` = zmenšiť na šírku adminu, `full` = skutočná veľkosť + posúvanie do strán. */
export type CanvasZoom = 'fit' | 'full';

// ── iframe ───────────────────────────────────────────────────────────────────

/**
 * Prenesenie štýlov stránky do okna plátna (vrátane HMR pri vývoji).
 *
 * PRIDÁVA A ODOBERÁ PO JEDNOM. Prvá verzia najprv zmazala z hlavičky okna
 * všetky kópie a potom ich nasypala nanovo — a medzi tým bolo plátno na
 * okamih bez štýlov. Stačilo, aby niečo pridalo štýl do hlavičky stránky
 * (TipTap si ich pridáva pri otvorení písania), a celý článok blikol.
 * Pozorovateľ hlavičky sleduje len `childList` a `characterData`, takže
 * značka `data-ed-key` na zdroji ho znova nespustí.
 */
let edStyleSeq = 0;

function syncStyles(target: Document) {
  const head = target.head;
  const zive = new Set<string>();

  document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    const el = node as HTMLElement;
    let key = el.dataset.edKey;
    if (!key) { key = String(++edStyleSeq); el.dataset.edKey = key; }
    zive.add(key);

    const kopia = head.querySelector(`[data-ed-style="${key}"]`) as HTMLElement | null;
    if (!kopia) {
      const nova = el.cloneNode(true) as HTMLElement;
      nova.setAttribute('data-ed-style', key);
      head.appendChild(nova);
    } else if (el.tagName === 'STYLE' && kopia.textContent !== el.textContent) {
      // Vite pri vývoji mení obsah štýlu na mieste — prepíš text, nemaž prvok.
      kopia.textContent = el.textContent;
    }
  });

  head.querySelectorAll('[data-ed-style]').forEach((kopia) => {
    if (!zive.has(kopia.getAttribute('data-ed-style') || '')) kopia.remove();
  });
}

export function CanvasFrame({
  width,
  zoom,
  onKeyDown,
  title = 'Náhľad článku',
  children,
}: {
  width: number;
  zoom: CanvasZoom;
  onKeyDown?: (e: KeyboardEvent) => void;
  /** Titulok okna. Editor článkov ho hľadá podľa „Náhľad článku" — predvolený ostáva. */
  title?: string;
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

    // Zhluk zmien (napr. knižnica pridá naraz viac štýlov) spoj do jedného
    // prenesenia — inak by sa to robilo aj desaťkrát za sebou.
    let cakaSync = 0;
    const styleObserver = new MutationObserver(() => {
      if (cakaSync) return;
      cakaSync = requestAnimationFrame(() => { cakaSync = 0; syncStyles(d); });
    });
    styleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });

    const sizeObserver = new ResizeObserver(() => {
      setHeight(Math.max(240, d.documentElement.scrollHeight));
    });
    sizeObserver.observe(d.documentElement);

    // Klávesy stlačené v okne plátna sa musia dostať k editoru (Ctrl+Z, šípky…).
    const onKey = (e: KeyboardEvent) => keyRef.current?.(e);
    d.addEventListener('keydown', onKey);

    return () => {
      if (cakaSync) cancelAnimationFrame(cakaSync);
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
          title={title}
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

export default CanvasFrame;
