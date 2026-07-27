'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Maximize2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PhotoDiscussion } from './PhotoDiscussion';

export interface GalleryImage {
  url: string;
  caption?: string;
  alt?: string;
  author?: string;
  source?: string;
  /** id súboru v Strapi Media Library — na to sa viažu komentáre a lajky k fotke. */
  fileId?: number;
}

interface HistoricalGalleryProps {
  images: GalleryImage[];
  title?: string;
}

const headerBtnStyle: React.CSSProperties = {
  flexShrink: 0, width: 34, height: 34, borderRadius: 999,
  border: '1px solid var(--pl-field)', background: 'transparent', color: 'var(--pl-title)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  transition: 'border-color 0.2s',
};

// =============================================================================
// LIGHTBOX — FB-style príspevok: hlavička → popis → fotka → reakcie/komentáre.
// Mobil = jednostĺpcová karta, desktop (≥900px) = 2 stĺpce (fotka vľavo, panel vpravo).
// =============================================================================
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const current = images[index];

  // Klávesnica (Esc / ←/→) + zámok scrollu pozadia + úvodný focus na ✕
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { if (zoom) { setZoom(false); return; } onClose(); }
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext, zoom]);

  // Prefetch susedných fotiek (±1)
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const im = images[i];
      if (im) { const el = new Image(); el.src = im.url; }
    });
  }, [index, images]);

  // Deep-link: index fotky v URL (#foto-N) — funguje späť aj zdieľanie konkrétnej fotky
  useEffect(() => {
    window.history.replaceState(null, '', `#foto-${index + 1}`);
  }, [index]);

  if (!current) return null;

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#foto-${index + 1}`;
    const title = current.caption || current.alt || 'Fotka z Hradiská.sk';
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title, url }); return; } catch { /* používateľ zrušil */ }
    }
    try { await navigator.clipboard.writeText(url); toast.success('Odkaz na fotku skopírovaný'); }
    catch { toast.error('Nepodarilo sa skopírovať odkaz'); }
  };

  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) { if (dx > 0) onPrev(); else onNext(); }
  };

  return (
    <motion.div
      className="pl-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Prehliadač fotky"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
      onClick={onClose}
    >
      <div className="pl-card" onClick={(e) => e.stopPropagation()}>
        {/* Hlavička — NAD fotkou, nič ju neprekrýva. Jedno ✕. */}
        <div
          className="pl-header"
          style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderBottom: '1px solid var(--pl-border-soft)' }}
        >
          <span className="pl-avatar-h" aria-hidden="true">H</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--pl-title)' }}>
              Hradiská.sk
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13.5, color: 'var(--pl-muted-2)' }}>
              Fotogaléria · {index + 1} / {images.length} · <span aria-hidden="true">🌐</span>
            </div>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Zavrieť"
            className="pl-focusable"
            style={headerBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pl-amber)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pl-field)'; }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Popis fotky — pri fotke (nie odtrhnutý dole) */}
        {(current.caption || current.author || current.source) && (
          <div className="pl-text" style={{ padding: '12px 15px 13px', borderBottom: '1px solid var(--pl-border-soft)' }}>
            {current.caption && (
              <p style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.45, color: 'var(--pl-body)' }}>
                {current.caption}
              </p>
            )}
            {(current.author || current.source) && (
              <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-serif)', fontSize: 13.5, color: 'var(--pl-muted-2)' }}>
                {[current.author && `Foto: ${current.author}`, current.source && `Zdroj: ${current.source}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* Fotka — mobil cover (fixná výška, nepresahuje), desktop contain */}
        <div className="pl-photo" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {index > 0 && (
            <button className="pl-navb pl-focusable" style={{ left: 10 }} onClick={onPrev} aria-label="Predchádzajúca fotka">
              <ChevronLeft style={{ width: 22, height: 22 }} />
            </button>
          )}
          {index < images.length - 1 && (
            <button className="pl-navb pl-focusable" style={{ right: 10 }} onClick={onNext} aria-label="Nasledujúca fotka">
              <ChevronRight style={{ width: 22, height: 22 }} />
            </button>
          )}
          <span className="pl-pill" style={{ top: 10, right: 10 }} aria-live="polite">
            {index + 1} / {images.length}
          </span>
          <button className="pl-corner pl-focusable" style={{ right: 10, bottom: 10 }} onClick={() => setZoom(true)} aria-label="Zväčšiť fotku">
            <Maximize2 style={{ width: 18, height: 18 }} />
          </button>
          {/* Rozmazané pozadie (rovnaká fotka) — FB-style letterbox pre portrét */}
          <img className="pl-photo-blur" src={current.url} alt="" aria-hidden="true" />
          <AnimatePresence mode="wait">
            <motion.img
              className="pl-photo-img"
              key={index}
              src={current.url}
              alt={current.caption || current.alt || `Fotka ${index + 1}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.15 }}
            />
          </AnimatePresence>
        </div>

        {/* Reakcie + akčná lišta + komentáre + vstup (ak fotka má fileId zo Strapi) */}
        {current.fileId != null ? (
          <PhotoDiscussion fileId={current.fileId} onShare={share} />
        ) : (
          <div
            className="pl-discuss"
            style={{ display: 'flex', padding: '4px 10px', margin: '0 5px', borderTop: '1px solid var(--pl-border-soft)' }}
          >
            <button className="pl-act pl-focusable" onClick={share}>
              <Share2 style={{ width: 18, height: 18 }} /> Zdieľať
            </button>
          </div>
        )}
      </div>

      {/* Zväčšenie na celú obrazovku (celá fotka, contain) — s navigáciou */}
      {zoom && (
        <div
          onClick={(e) => { e.stopPropagation(); setZoom(false); }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(5,4,2,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}
        >
          {index > 0 && (
            <button className="pl-navb pl-focusable" style={{ left: 12 }} onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Predchádzajúca fotka">
              <ChevronLeft style={{ width: 22, height: 22 }} />
            </button>
          )}
          {index < images.length - 1 && (
            <button className="pl-navb pl-focusable" style={{ right: 12 }} onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Nasledujúca fotka">
              <ChevronRight style={{ width: 22, height: 22 }} />
            </button>
          )}
          <button className="pl-corner pl-focusable" style={{ top: 14, right: 14 }} onClick={(e) => { e.stopPropagation(); setZoom(false); }} aria-label="Zavrieť zväčšenie">
            <X style={{ width: 18, height: 18 }} />
          </button>
          <span className="pl-pill" style={{ bottom: 16, left: '50%', transform: 'translateX(-50%)' }} aria-live="polite">
            {index + 1} / {images.length}
          </span>
          <img
            src={current.url}
            alt={current.caption || current.alt || ''}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', cursor: 'default' }}
          />
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// MAIN GALLERY
// =============================================================================

export function HistoricalGallery({ images, title = 'Fotogaléria' }: HistoricalGalleryProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);
  // Kam vrátiť focus po zatvorení (miniatúra, z ktorej sa otvorilo)
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((idx: number, trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setModalIndex(idx);
  }, []);

  // Otvorenie cez event (inline obrázky v tele článku)
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ imageUrl: string }>).detail;
      const idx = images.findIndex(
        (img) =>
          img.url === detail.imageUrl ||
          img.url.includes(detail.imageUrl) ||
          detail.imageUrl.includes(img.url),
      );
      open(idx !== -1 ? idx : 0);
    };
    window.addEventListener('openGalleryModal', onOpen as EventListener);
    return () => window.removeEventListener('openGalleryModal', onOpen as EventListener);
  }, [images, open]);

  // Deep-link pri načítaní stránky: #foto-N otvorí danú fotku
  useEffect(() => {
    const m = window.location.hash.match(/^#foto-(\d+)$/);
    if (m) {
      const i = parseInt(m[1], 10) - 1;
      if (i >= 0 && i < images.length) setModalIndex(i);
    }
    // len raz pri mount-e
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setModalIndex(null);
    // Vyčisti #foto-N z URL
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    // Vráť focus na miniatúru
    triggerRef.current?.focus?.();
  }, []);

  const prev = useCallback(() => setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i)), []);
  const next = useCallback(
    () => setModalIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i)),
    [images.length],
  );

  if (!images || images.length === 0) return null;

  return (
    <section id="photo-gallery" style={{ marginTop: 48, marginBottom: 48, scrollMarginTop: 32 }}>
      {/* Nadpis sekcie */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 22, fontWeight: 600, color: '#2d1810', margin: 0 }}>
          {title}
        </h2>
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 24, height: 24, padding: '0 8px', borderRadius: 9999,
            background: '#a87437', color: '#fffdf8', fontFamily: 'Georgia, serif', fontSize: 12, fontWeight: 600,
          }}
        >
          {images.length}
        </span>
      </div>
      <hr style={{ height: 1, background: 'linear-gradient(90deg, #c4a574 0%, rgba(196,165,116,0) 100%)', margin: '8px 0 24px', border: 0 }} />

      {/* Grid miniatúr */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {images.map((image, idx) => (
          <button
            type="button"
            key={image.url || idx}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); open(idx, e.currentTarget); }}
            aria-label={image.alt || image.caption || `Otvoriť obrázok ${idx + 1}`}
            style={{ background: 'transparent', border: 0, padding: 0, cursor: 'zoom-in', display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left', font: 'inherit', color: 'inherit' }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 8, border: '1px solid rgba(196,165,116,0.4)', pointerEvents: 'none' }}>
              <ImageWithFallback
                src={image.url}
                alt={image.alt || image.caption || `Obrázok ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              />
            </div>
            {image.caption && (
              <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13, lineHeight: 1.5, color: '#7a6b56', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', pointerEvents: 'none' }}>
                {image.caption}
              </p>
            )}
          </button>
        ))}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {modalIndex !== null && (
              <Lightbox images={images} index={modalIndex} onClose={close} onPrev={prev} onNext={next} />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </section>
  );
}

export type { HistoricalGalleryProps };
