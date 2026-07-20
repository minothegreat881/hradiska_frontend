'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Share2,
  Maximize2,
  Minimize2,
  Facebook,
  Linkedin,
  Mail,
  Link2,
  Twitter,
} from 'lucide-react';
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

// =============================================================================
// LIGHTBOX — Facebook-style: image stage + info panel s likes/komentármi/share
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
  const [fullscreen, setFullscreen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Keyboard navigation + scroll-lock bez reflowu gridu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (shareOpen) {
          setShareOpen(false);
          return;
        }
        if (fullscreen) {
          setFullscreen(false);
          return;
        }
        onClose();
      }
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    const prevPaddingRight = html.style.paddingRight;
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      html.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      html.style.paddingRight = prevPaddingRight;
    };
  }, [onClose, onPrev, onNext, fullscreen, shareOpen]);

  // Preload susedov
  useEffect(() => {
    const preload = (i: number) => {
      const img = images[i];
      if (!img) return;
      const el = new Image();
      el.src = img.url;
    };
    preload(index + 1);
    preload(index - 1);
  }, [index, images]);

  // Pri zmene fotky zatvor share popup
  useEffect(() => {
    setShareOpen(false);
  }, [index]);

  const current = images[index];
  if (!current) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.href}#photo-${index + 1}`);
      toast.success('Odkaz na fotku skopírovaný');
      setShareOpen(false);
    } catch {
      toast.error('Nepodarilo sa skopírovať');
    }
  };

  const shareTitle = encodeURIComponent(current.caption || current.alt || 'Fotka z Hradiska.sk');
  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');
  const shareLinks = [
    {
      name: 'Facebook',
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: 'X',
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
    },
    {
      name: 'LinkedIn',
      Icon: Linkedin,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareTitle}`,
    },
    {
      name: 'E-mail',
      Icon: Mail,
      href: `mailto:?subject=${shareTitle}&body=${shareUrl}`,
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 lightbox-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'rgba(15,10,5,0.94)',
        display: 'flex',
      }}
      onClick={onClose}
    >
      {/* ===================== IMAGE STAGE ===================== */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="lightbox-stage"
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 80px',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {/* Top-right stage controls: fullscreen + (mobil) close */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={() => setFullscreen((v) => !v)}
            aria-label={fullscreen ? 'Zobraziť panel' : 'Maximalizovať'}
            title={fullscreen ? 'Zobraziť panel' : 'Maximalizovať (skryť panel)'}
            style={iconButtonStyle}
            onMouseEnter={onIconHoverIn}
            onMouseLeave={onIconHoverOut}
          >
            {fullscreen ? (
              <Minimize2 style={{ width: 18, height: 18 }} />
            ) : (
              <Maximize2 style={{ width: 18, height: 18 }} />
            )}
          </button>
          {/* Mobilný close — zobrazený keď je panel pod fotkou */}
          <button
            onClick={onClose}
            aria-label="Zavrieť"
            className="lightbox-close-mobile"
            style={{ ...iconButtonStyle, display: 'none' }}
            onMouseEnter={onIconHoverIn}
            onMouseLeave={onIconHoverOut}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Prev */}
        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Predchádzajúci"
            style={{ ...navArrowStyle, left: 16 }}
            onMouseEnter={onIconHoverIn}
            onMouseLeave={onIconHoverOut}
          >
            <ChevronLeft style={{ width: 24, height: 24 }} />
          </button>
        )}

        {/* Next */}
        {index < images.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Nasledujúci"
            style={{ ...navArrowStyle, right: 16 }}
            onMouseEnter={onIconHoverIn}
            onMouseLeave={onIconHoverOut}
          >
            <ChevronRight style={{ width: 24, height: 24 }} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={current.url}
            alt={current.alt || `Obrázok ${index + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              maxWidth: '100%',
              maxHeight: 'calc(100vh - 80px)',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        </AnimatePresence>
      </div>

      {/* ===================== INFO PANEL ===================== */}
      {!fullscreen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="lightbox-panel"
          style={{
            width: 400,
            background: '#fffdf8',
            borderLeft: '1px solid rgba(196,165,116,0.4)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(196,165,116,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div style={avatarStyle('H')}>H</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#2d1810',
                  margin: 0,
                }}
              >
                Hradiská.sk
              </p>
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  color: '#7a6b56',
                  margin: '2px 0 0',
                }}
              >
                Fotogaléria · {index + 1} / {images.length}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Zavrieť"
              style={iconButtonLightStyle}
              onMouseEnter={onLightIconHoverIn}
              onMouseLeave={onLightIconHoverOut}
            >
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          {/* Caption + autor/zdroj — scrollovateľná stredná časť */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {current.caption && (
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: '#2d2418',
                  margin: 0,
                }}
              >
                {current.caption}
              </p>
            )}

            {(current.author || current.source) && (
              <div
                style={{
                  paddingTop: 12,
                  borderTop: '1px dashed rgba(168,116,55,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {current.author && (
                  <p style={metaStyle}>Foto: {current.author}</p>
                )}
                {current.source && (
                  <p style={metaStyle}>Zdroj: {current.source}</p>
                )}
              </div>
            )}

            {/* Action bar — Zdieľať */}
            <div
              style={{
                display: 'flex',
                paddingTop: 8,
                borderTop: '1px solid rgba(196,165,116,0.3)',
                position: 'relative',
              }}
            >
              <ActionButton
                Icon={Share2}
                label="Zdieľať"
                onClick={() => setShareOpen((v) => !v)}
                active={shareOpen}
              />

              {/* Share popup */}
              {shareOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 6,
                    background: '#fffdf8',
                    border: '1px solid rgba(196,165,116,0.5)',
                    borderRadius: 10,
                    padding: 10,
                    boxShadow: '0 8px 24px rgba(70,40,20,0.15)',
                    display: 'flex',
                    gap: 6,
                    zIndex: 20,
                  }}
                >
                  {shareLinks.map(({ name, Icon, href }) => (
                    <a
                      key={name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={name}
                      aria-label={`Zdieľať na ${name}`}
                      style={sharePillStyle}
                      onMouseEnter={onSharePillHoverIn}
                      onMouseLeave={onSharePillHoverOut}
                    >
                      <Icon style={{ width: 16, height: 16 }} />
                    </a>
                  ))}
                  <button
                    type="button"
                    onClick={copyLink}
                    title="Kopírovať odkaz"
                    aria-label="Kopírovať odkaz"
                    style={{ ...sharePillStyle, cursor: 'pointer' }}
                    onMouseEnter={onSharePillHoverIn}
                    onMouseLeave={onSharePillHoverOut}
                  >
                    <Link2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              )}
            </div>

            {/* Lajky + komentáre k fotke (len ak má fileId zo Strapi) */}
            {current.fileId != null && (
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(196,165,116,0.3)' }}>
                <PhotoDiscussion fileId={current.fileId} />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// SHARED STYLES + HELPERS
// =============================================================================

const iconButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 9999,
  border: '1px solid rgba(196,165,116,0.4)',
  background: 'rgba(255,253,248,0.1)',
  color: '#f0e8dc',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const iconButtonLightStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9999,
  border: '1px solid rgba(196,165,116,0.4)',
  background: 'transparent',
  color: '#2d2418',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s',
  flexShrink: 0,
};

const navArrowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 10,
  width: 48,
  height: 48,
  borderRadius: 9999,
  border: '1px solid rgba(196,165,116,0.4)',
  background: 'rgba(255,253,248,0.1)',
  color: '#f0e8dc',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const metaStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 12,
  color: '#7a6b56',
  margin: 0,
};

const sharePillStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 9999,
  border: '1px solid #a87437',
  background: 'transparent',
  color: '#3a2a1a',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s, color 0.2s',
  textDecoration: 'none',
};

function avatarStyle(letter: string, size = 36): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 9999,
    background: 'linear-gradient(135deg, #a87437 0%, #7d4f1d 100%)',
    color: '#fffdf8',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Georgia, serif',
    fontSize: Math.round(size * 0.4),
    fontWeight: 600,
    flexShrink: 0,
  };
}

const onIconHoverIn = (e: React.MouseEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.background = 'rgba(255,253,248,0.2)';
};
const onIconHoverOut = (e: React.MouseEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.background = 'rgba(255,253,248,0.1)';
};
const onLightIconHoverIn = (e: React.MouseEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.background = 'rgba(196,165,116,0.15)';
};
const onLightIconHoverOut = (e: React.MouseEvent<HTMLElement>) => {
  (e.currentTarget as HTMLElement).style.background = 'transparent';
};
const onSharePillHoverIn = (e: React.MouseEvent<HTMLElement>) => {
  const el = e.currentTarget as HTMLElement;
  el.style.background = '#a87437';
  el.style.color = '#fffdf8';
};
const onSharePillHoverOut = (e: React.MouseEvent<HTMLElement>) => {
  const el = e.currentTarget as HTMLElement;
  el.style.background = 'transparent';
  el.style.color = '#3a2a1a';
};

function ActionButton({
  Icon,
  label,
  onClick,
  active = false,
  iconStyle,
}: {
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  iconStyle?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 6px',
        border: 0,
        borderRadius: 8,
        background: active ? 'rgba(196,165,116,0.15)' : 'transparent',
        color: active ? '#7d4f1d' : '#3a2a1a',
        cursor: 'pointer',
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontWeight: 600,
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(196,165,116,0.1)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <Icon style={{ width: 16, height: 16, ...iconStyle }} />
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// MAIN GALLERY
// =============================================================================

export function HistoricalGallery({ images, title = 'Fotogaléria' }: HistoricalGalleryProps) {
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ imageUrl: string }>).detail;
      const idx = images.findIndex(
        (img) =>
          img.url === detail.imageUrl ||
          img.url.includes(detail.imageUrl) ||
          detail.imageUrl.includes(img.url),
      );
      setModalIndex(idx !== -1 ? idx : 0);
    };
    window.addEventListener('openGalleryModal', onOpen as EventListener);
    return () => window.removeEventListener('openGalleryModal', onOpen as EventListener);
  }, [images]);

  const close = useCallback(() => setModalIndex(null), []);
  const prev = useCallback(
    () => setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    [],
  );
  const next = useCallback(
    () => setModalIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i)),
    [images.length],
  );

  if (!images || images.length === 0) return null;

  return (
    <section id="photo-gallery" style={{ marginTop: 48, marginBottom: 48, scrollMarginTop: 32 }}>
      {/* Nadpis sekcie */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h2
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            fontWeight: 600,
            color: '#2d1810',
            margin: 0,
          }}
        >
          {title}
        </h2>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 24,
            height: 24,
            padding: '0 8px',
            borderRadius: 9999,
            background: '#a87437',
            color: '#fffdf8',
            fontFamily: 'Georgia, serif',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {images.length}
        </span>
      </div>
      <hr
        style={{
          height: 1,
          background: 'linear-gradient(90deg, #c4a574 0%, rgba(196,165,116,0) 100%)',
          margin: '8px 0 24px',
          border: 0,
        }}
      />

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {images.map((image, idx) => (
          <button
            type="button"
            key={image.url || idx}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[Gallery] click on tile', idx, image.url);
              setModalIndex(idx);
            }}
            aria-label={image.alt || image.caption || `Otvoriť obrázok ${idx + 1}`}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'zoom-in',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              textAlign: 'left',
              font: 'inherit',
              color: 'inherit',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: 8,
                border: '1px solid rgba(196,165,116,0.4)',
                pointerEvents: 'none',
              }}
            >
              <ImageWithFallback
                src={image.url}
                alt={image.alt || image.caption || `Obrázok ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                style={{ pointerEvents: 'none' }}
              />
            </div>
            {image.caption && (
              <p
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: '#7a6b56',
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  pointerEvents: 'none',
                }}
              >
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
              <Lightbox
                images={images}
                index={modalIndex}
                onClose={close}
                onPrev={prev}
                onNext={next}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}

      {/* Mobile / panel breakpoint */}
      <style>{`
        @media (max-width: 768px) {
          .lightbox-root {
            flex-direction: column !important;
          }
          .lightbox-stage {
            padding: 16px !important;
            max-height: 55vh;
          }
          .lightbox-panel {
            width: 100% !important;
            border-left: 0 !important;
            border-top: 1px solid rgba(196,165,116,0.4);
            max-height: 45vh;
          }
          .lightbox-close-mobile {
            display: inline-flex !important;
          }
        }
      `}</style>
    </section>
  );
}

export type { HistoricalGalleryProps };
