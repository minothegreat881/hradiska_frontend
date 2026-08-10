'use client';

import { useEffect, useId, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import {
  ChevronLeft, ChevronRight, X, MapPin, Pin, Calendar,
  Shield, Camera, Share2, Images, ArrowRight,
} from 'lucide-react';
import {
  getAktuality, getStrapiImageUrl,
  getKronika, getKronikaIntro, KRONIKA_INTRO_SLUG,
  StrapiAktualita, AktualitaTyp, StrapiImage, KronikaItem,
} from '../lib/strapi';
import { hradiskaData } from '../data/hradiska';
import { slovakiaBorderDetailed } from '../data/slovakia-border';

// ============================================================================
// Jednotná zlato-hnedá pre VŠETKY odkazy/akcenty (Zobraziť viac, hover atď.)
// ============================================================================
const GOLD = '#7d4f1d';
const GOLD_SOFT = '#a87437';

// ============================================================================
// Typy aktivity – TLMENÉ pastelové chipy (svetlý podklad + tmavý text rovnakého odtieňa)
// ============================================================================
const TYP_META: Record<AktualitaTyp, { label: string; bg: string; fg: string; border: string }> = {
  brigada:        { label: 'Brigáda',          bg: '#E5EFE8', fg: '#2E5C42', border: '#C8DBCB' },
  nova_tabula:    { label: 'Tabuľa',           bg: '#F4E5E8', fg: '#8A3548', border: '#E3C4CB' },
  socha_pamatnik: { label: 'Pamätník',         bg: '#ECE6F4', fg: '#5A3B86', border: '#D6C9E8' },
  podujatie:      { label: 'Podujatie',        bg: '#FAEFD9', fg: '#8C5810', border: '#E8D2A0' },
  vyskum:         { label: 'Výskum',           bg: '#E2EEF2', fg: '#2C6680', border: '#C3D8E0' },
  ine:            { label: 'Iné',              bg: '#EFEAE0', fg: '#5D4E37', border: '#DCD2BF' },
};

const FILTERS: { id: AktualitaTyp | 'all'; label: string }[] = [
  { id: 'all',            label: 'Všetky' },
  { id: 'brigada',        label: 'Brigády' },
  { id: 'nova_tabula',    label: 'Tabule' },
  { id: 'socha_pamatnik', label: 'Sochy' },
  { id: 'podujatie',      label: 'Podujatia' },
  { id: 'vyskum',         label: 'Výskum' },
];

function formatSkDate(iso: string): string {
  const d = new Date(iso);
  const months = ['januára', 'februára', 'marca', 'apríla', 'mája', 'júna', 'júla', 'augusta', 'septembra', 'októbra', 'novembra', 'decembra'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Relatívny dátum – iba ak je príspevok do 14 dní späť
function relativeDateLabel(iso: string): string | null {
  const post = new Date(iso); post.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((now.getTime() - post.getTime()) / (24 * 60 * 60 * 1000));
  if (diff < 0 || diff > 14) return null;
  if (diff === 0) return 'dnes';
  if (diff === 1) return 'včera';
  return `pred ${diff} dňami`;
}

// ============================================================================
// Seed dáta v Strapi obsahujú generické Unsplash fotky, ktoré nesedia s obsahom
// (napr. moskovský chrám pri Bratislavskom hrade). Pre demo ich na frontende
// mapujeme na konkrétne URL: skutočná castle fotka + statická mapa s pinom
// na presných GPS súradniciach hradiska.
// V produkcii (keď združenie nahrá reálne fotky cez Strapi admin) toto
// mapovanie sa nepoužije – reálne fotky majú iné `name`.
// ============================================================================
// Seed dáta v Strapi sú generické stock fotky. Pre demo ich nahradíme dummy
// Picsum obrázkami (random landscape stock). Reálne fotky nahraté cez Strapi
// admin majú iné `name` a override sa neuplatní.
function isSeedPhoto(img: StrapiImage): boolean {
  const n = (img.name || '').toLowerCase();
  return /^(pajstun-brigada|bratislava-tabula|devin-vyskum)-/.test(n);
}

const DUMMY_PHOTOS: Record<string, string> = {
  'pajstun-brigada-1.jpg':   'https://picsum.photos/seed/aktualita-pajstun-1/800/600',
  'pajstun-brigada-2.jpg':   'https://picsum.photos/seed/aktualita-pajstun-2/800/600',
  'bratislava-tabula-1.jpg': 'https://picsum.photos/seed/aktualita-bratislava/800/600',
  'devin-vyskum-1.jpg':      'https://picsum.photos/seed/aktualita-devin-1/800/600',
  'devin-vyskum-2.jpg':      'https://picsum.photos/seed/aktualita-devin-2/800/600',
  'devin-vyskum-3.jpg':      'https://picsum.photos/seed/aktualita-devin-3/800/600',
};
function getDummyPhoto(img: StrapiImage): string | null {
  return DUMMY_PHOTOS[img.name] || null;
}

// ============================================================================
// PhotoPlaceholder – plochá pergamenová plocha s ikonou fotoaparátu
// ============================================================================
function PhotoPlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  // Pozícia (relative/absolute) sa určuje cez className/style od caller-a,
  // tu ju necháme tak. Pre flex-centrovanie Camera ikony stačí display: flex.
  return (
    <div
      className={className}
      style={{
        background: '#f0e6d1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      aria-hidden="true"
    >
      <Camera className="w-7 h-7" style={{ color: '#a89070', opacity: 0.7 }} />
    </div>
  );
}

// ============================================================================
// SafeImg – pri onerror sa prepne na PhotoPlaceholder (nikdy broken image)
// ============================================================================
function SafeImg({ src, alt, className, style }: { src: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [error, setError] = useState(false);
  if (error) {
    return <PhotoPlaceholder className={className} style={style} />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}

// ============================================================================
// Lightbox – fullscreen galéria
// ============================================================================
function Lightbox({ images, startIndex, onClose }: { images: StrapiImage[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const [imgError, setImgError] = useState(false);

  const next = useCallback(() => { setIdx(i => (i + 1) % images.length); setImgError(false); }, [images.length]);
  const prev = useCallback(() => { setIdx(i => (i - 1 + images.length) % images.length); setImgError(false); }, [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const img = images[idx];
  const dummyUrl = getDummyPhoto(img);
  const lightboxSrc = dummyUrl || getStrapiImageUrl(img, 'large');
  const showPlaceholder = imgError;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(20,16,10,0.92)', backdropFilter: 'blur(8px)' }} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-11 h-11 flex items-center justify-center rounded-full"
        style={{ background: 'rgba(15,11,7,0.78)', color: '#faf7f1', border: '1px solid rgba(196,165,116,0.45)' }}
        aria-label="Zavrieť"
      >
        <X className="w-5 h-5" />
      </button>
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(15,11,7,0.78)', color: '#faf7f1', border: '1px solid rgba(196,165,116,0.45)' }}
            aria-label="Predchádzajúce"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(15,11,7,0.78)', color: '#faf7f1', border: '1px solid rgba(196,165,116,0.45)' }}
            aria-label="Nasledujúce"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      {showPlaceholder ? (
        <PhotoPlaceholder
          className="relative rounded-lg shadow-2xl"
          style={{ width: 'min(90vw, 800px)', aspectRatio: '4 / 3' }}
        />
      ) : (
        <img
          src={lightboxSrc}
          alt={img.alternativeText || ''}
          className="relative max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onError={() => setImgError(true)}
          loading="eager"
        />
      )}
      {images.length > 1 && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs"
          style={{ background: 'rgba(15,11,7,0.78)', color: '#e8dcc8', border: '1px solid rgba(196,165,116,0.35)' }}
        >
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PhotoTile – jedna fotka v mriežke; rieši seed/placeholder/onerror
// ŽIADNY vlastný border-radius – tile je hranatý, radius rieši až overflow:hidden
// na celej karte (fotky končia na hrane karty s clip-corner spodku ak je footer)
// ============================================================================
function PhotoTile({ img, idx, style, onOpen, overlay }: {
  img: StrapiImage;
  idx: number;
  style: React.CSSProperties;
  onOpen: (i: number) => void;
  overlay?: React.ReactNode;
}) {
  // Pre seed dáta použijem dummy Picsum URL. Pre reálne fotky nahraté cez Strapi
  // admin → Strapi URL. SafeImg má onerror fallback na placeholder.
  const dummyUrl = getDummyPhoto(img);
  const src = dummyUrl || getStrapiImageUrl(img, 'medium');
  return (
    <button
      onClick={() => onOpen(idx)}
      className="block relative overflow-hidden p-0 m-0"
      style={{ ...style, background: '#f0e6d1', border: 'none' }}
    >
      <SafeImg
        src={src}
        alt={img.alternativeText || ''}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {overlay}
    </button>
  );
}

// ============================================================================
// PhotoGrid – FB mriežka 1 / 2 / 3+, od hrany po hranu karty, gap 2px
// ============================================================================
function PhotoGrid({ fotky, onOpenLightbox }: { fotky: StrapiImage[]; onOpenLightbox: (startIdx: number) => void }) {
  if (fotky.length === 0) return null;

  // 1 fotka – plná šírka karty
  if (fotky.length === 1) {
    return (
      <div style={{ borderTop: '1px solid rgba(196,165,116,0.35)' }}>
        <PhotoTile img={fotky[0]} idx={0} style={{ width: '100%', height: 320 }} onOpen={onOpenLightbox} />
      </div>
    );
  }

  // 2 fotky – 50:50
  if (fotky.length === 2) {
    return (
      <div className="grid grid-cols-2" style={{ gap: 2, borderTop: '1px solid rgba(196,165,116,0.35)' }}>
        {fotky.map((f, i) => (
          <PhotoTile key={f.id} img={f} idx={i} style={{ width: '100%', aspectRatio: '1 / 1' }} onOpen={onOpenLightbox} />
        ))}
      </div>
    );
  }

  // 3+ fotky – prvá veľká hore, dve menšie pod ňou. Posledný tile má +N overlay ak je viac
  const extra = Math.max(0, fotky.length - 3);
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: '1fr 1fr',
        gap: 2,
        borderTop: '1px solid rgba(196,165,116,0.35)',
      }}
    >
      <PhotoTile
        img={fotky[0]} idx={0}
        style={{ gridColumn: '1 / 3', width: '100%', height: 240 }}
        onOpen={onOpenLightbox}
      />
      <PhotoTile
        img={fotky[1]} idx={1}
        style={{ width: '100%', aspectRatio: '1 / 1' }}
        onOpen={onOpenLightbox}
      />
      <PhotoTile
        img={fotky[2]} idx={2}
        style={{ width: '100%', aspectRatio: '1 / 1' }}
        onOpen={onOpenLightbox}
        overlay={extra > 0 ? (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(20,16,10,0.55)', color: '#faf7f1', fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 600 }}
          >
            +{extra}
          </div>
        ) : undefined}
      />
    </div>
  );
}

// ============================================================================
// MiniMap – inline SVG obrys Slovenska s pinom na presných GPS súradniciach.
// Bez závislosti na externom service, 100 % spoľahlivé.
// ============================================================================
const SLOVAKIA_BBOX = { minLon: 16.8, maxLon: 22.6, minLat: 47.7, maxLat: 49.7 };
const MAP_W = 720;
const MAP_H = 248; // pomer SR (5.8°/2.0° = 2.9) → 720/2.9 ≈ 248

const slovakiaPath = (() => {
  const lonSpan = SLOVAKIA_BBOX.maxLon - SLOVAKIA_BBOX.minLon;
  const latSpan = SLOVAKIA_BBOX.maxLat - SLOVAKIA_BBOX.minLat;
  return slovakiaBorderDetailed
    .map(([lon, lat], i) => {
      const x = ((lon - SLOVAKIA_BBOX.minLon) / lonSpan) * MAP_W;
      const y = MAP_H - ((lat - SLOVAKIA_BBOX.minLat) / latSpan) * MAP_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
})();

// LokalitaStrip – kompaktný horizontálny pásik medzi fotkami a akčnou lištou.
// Vľavo mini SVG obrysu SR (66×38) s pinom, v strede názov + okres, vpravo button.
function LokalitaStrip({ coords, name, okres, onClick }: {
  coords: [number, number]; name: string; okres?: string; onClick?: () => void;
}) {
  const [lng, lat] = coords;
  const MINI_W = 66, MINI_H = 38;
  const lonSpan = SLOVAKIA_BBOX.maxLon - SLOVAKIA_BBOX.minLon;
  const latSpan = SLOVAKIA_BBOX.maxLat - SLOVAKIA_BBOX.minLat;
  const pinX = ((lng - SLOVAKIA_BBOX.minLon) / lonSpan) * MAP_W;
  const pinY = MAP_H - ((lat - SLOVAKIA_BBOX.minLat) / latSpan) * MAP_H;
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer text-left"
      style={{
        background: hover ? '#efe2c1' : '#f3e8cc',
        border: 'none',
        borderTop: '1px solid rgba(196,165,116,0.35)',
        height: 62,
        transition: 'background 150ms ease',
      }}
      aria-label={`Otvoriť ${name} na mape`}
    >
      {/* Mini mapa 66×38 */}
      <div
        className="flex-shrink-0 overflow-hidden"
        style={{ width: MINI_W, height: MINI_H, borderRadius: 6, background: '#f7eed8' }}
      >
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style={{ display: 'block' }}>
          <path
            d={slovakiaPath}
            fill="#f0e0bf"
            stroke="#a87437"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Pin – malý, červený */}
          <g transform={`translate(${pinX.toFixed(1)} ${pinY.toFixed(1)})`}>
            <circle cx="0" cy="2" r="4" fill="rgba(0,0,0,0.3)" />
            <circle cx="0" cy="0" r="9" fill="#c44561" stroke="#fff" strokeWidth="3" />
          </g>
        </svg>
      </div>

      {/* Názov + okres */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 500, color: '#2d1810', lineHeight: 1.2 }}
        >
          {name}
        </div>
        {okres && (
          <div
            className="truncate"
            style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#8b7a5e', marginTop: 1 }}
          >
            okres {okres}
          </div>
        )}
      </div>

      {/* "Na mape →" outline button */}
      <span
        className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-md"
        style={{
          background: hover ? '#fff8e6' : 'transparent',
          color: '#7d4f1d',
          border: '1px solid rgba(125,79,29,0.4)',
          fontFamily: 'Georgia, serif',
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          transition: 'background 150ms ease',
        }}
      >
        Na mape →
      </span>
    </button>
  );
}

// ============================================================================
// Cross-page focus na marker mapy
// ============================================================================
function focusHradisko(name: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/') {
    window.dispatchEvent(new CustomEvent('focus-hradisko', { detail: { name } }));
    return;
  }
  sessionStorage.setItem('pending-focus-hradisko', name);
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// ============================================================================
// CeramicDivider – slovanská keramická vlnovka (SVG pattern), zdieľateľná
// ============================================================================
export function CeramicDivider({ color = '#b39a72', maxWidth = 540 }: { color?: string; maxWidth?: number }) {
  const uid = useId();
  const patternId = `ceramic-wave-${uid}`;
  return (
    <div style={{ margin: '12px auto 22px', width: '100%', maxWidth, opacity: 0.9 }} aria-hidden="true">
      <svg width="100%" height="30" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <pattern id={patternId} width="46" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 8 Q11.5 1 23 8 T46 8" fill="none" stroke={color} strokeWidth="1.5" />
            <path d="M0 15 Q11.5 8 23 15 T46 15" fill="none" stroke={color} strokeWidth="1.5" />
            <circle cx="7.5" cy="24" r="1.5" fill={color} />
            <circle cx="19" cy="24" r="1.5" fill={color} />
            <circle cx="30.5" cy="24" r="1.5" fill={color} />
            <circle cx="42" cy="24" r="1.5" fill={color} />
          </pattern>
        </defs>
        <rect width="100%" height="30" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

// ============================================================================
// Vignette – tmavý spodný prechod + voliteľný geotag, nad reálnym <img> (nie
// CSS box-shadow ako v mocku – ten by sa vykreslil pod img elementom).
// ============================================================================
function vignetteOverlay(place: string | undefined, strength: 'strong' | 'soft') {
  const gradient = strength === 'strong'
    ? 'linear-gradient(to top, rgba(18,13,8,.62) 0%, rgba(18,13,8,.25) 40%, transparent 65%)'
    : 'linear-gradient(to top, rgba(18,13,8,.55) 0%, rgba(18,13,8,.18) 38%, transparent 62%)';
  return (
    <>
      <div className="absolute inset-0" style={{ background: gradient, pointerEvents: 'none' }} />
      {place && (
        <span
          className="absolute left-3 bottom-3"
          style={{
            fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#f4ead4',
            background: 'rgba(28,21,16,.55)', borderRadius: 6, padding: '4px 9px',
            pointerEvents: 'none',
          }}
        >
          ◍ {place}
        </span>
      )}
    </>
  );
}

// Typový chip (Cinzel, farebný bod) – zdieľané medzi featured a masonry kartou
function TypeChip({ typ }: { typ: AktualitaTyp }) {
  const t = TYP_META[typ] ?? TYP_META.ine;
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{
        fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '.09em', textTransform: 'uppercase',
        color: t.fg, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 999, padding: '4px 10px',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.fg, flexShrink: 0 }} />
      {t.label}
    </span>
  );
}

// ============================================================================
// KRONIKA – karty nad blog-postami z kategórie `aktuality`
// ============================================================================

/** Pripnutý úvod — široká karta hore. Statická, nezávisí od radenia. */
function KronikaIntro({ item }: { item: KronikaItem }) {
  return (
    <article
      className="aktualita-featured-grid"
      style={{
        background: '#fbf6ea', border: '1px solid #e3d4ad', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 16px 42px -24px rgba(60,40,15,.55)', marginBottom: 26,
      }}
    >
      <div className="relative" style={{ minHeight: 260 }}>
        {item.coverUrl ? (
          <SafeImg
            src={item.coverUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(ellipse at 50% 40%, #f5ecd8 0%, #ece0c4 55%, #ddcba4 100%)',
            }}
          >
            <picture style={{ display: 'contents' }}>
              {/* Priehľadné logo. Predtým tu bolo `logo_slovanske_hradiska_256`,
                  ktoré má svetlosivý podklad bez alfy — `mix-blend-mode: multiply`
                  sivú (na rozdiel od bielej) nezruší, len ňou stmaví pergamen,
                  takže bolo vidno sivý štvorec obrázka. */}
              <source srcSet="/logo_hradiska_small.webp" type="image/webp" />
              <img
                src="/logo_hradiska_small.png"
                alt=""
                style={{ height: '58%', width: 'auto', opacity: 0.92 }}
              />
            </picture>
          </div>
        )}
        <span
          className="absolute pointer-events-none"
          style={{
            top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(28,21,16,.72)', color: '#e9c877', fontFamily: 'var(--font-heading)',
            fontSize: 10, letterSpacing: '.1em', padding: '6px 11px', borderRadius: 999,
          }}
        >
          <span style={{ color: '#c8862f' }}>◆</span>PRIPNUTÉ
        </span>
      </div>

      <div style={{ padding: '22px 24px' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 38, height: 38, background: '#f0e6d1', border: '1px solid rgba(125,79,29,0.25)' }}
            aria-hidden="true"
          >
            <Shield className="w-4.5 h-4.5" style={{ color: GOLD }} />
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: '#2e2213' }}>
              Slovanské hradiská
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: '#8a795e' }}>
              {formatSkDate(item.datum)} · {item.author} · {item.readingTime} min čítania
            </div>
          </div>
        </div>

        <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif)', fontSize: 27, fontWeight: 700, color: '#2e2213', lineHeight: 1.12 }}>
          {item.title}
        </h3>
        {item.excerpt && (
          <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.5, color: '#4a3f2e' }}>
            {item.excerpt}
          </p>
        )}

        <a
          href={`/blog/${item.slug}`}
          style={{
            display: 'inline-block',
            fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.05em', color: '#fbf6ea',
            background: 'linear-gradient(180deg,#c8862f,#9a5d1f)', borderRadius: 999,
            padding: '9px 16px', textDecoration: 'none',
          }}
        >
          Čítať celé →
        </a>
      </div>
    </article>
  );
}

/** Dlaždica kroniky — vizuálne zladená s CategoryCard (obrázok hore, telo pod ním).
 *  Na mobile sa excerpt skryje (.ak-excerpt v globals.css), ostane názov + meta. */
function KronikaCard({ item }: { item: KronikaItem }) {
  return (
    <a href={`/blog/${item.slug}`} className="block h-full group ak-tile" style={{ textDecoration: 'none' }}>
      <article
        className="h-full flex flex-col overflow-hidden"
        style={{
          background: '#fffdf8',
          border: '1px solid rgba(196,165,116,0.4)',
          borderRadius: 12,
          boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
        }}
      >
        {/* FOTKA */}
        <div className="relative overflow-hidden flex-shrink-0" style={{ height: 220 }}>
          {item.coverUrl ? (
            <SafeImg src={item.coverUrl} alt="" className="w-full h-full object-cover ak-cover" />
          ) : (
            <div className="w-full h-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 40%, #f5ecd8 0%, #ece0c4 55%, #ddcba4 100%)' }}>
              <picture style={{ display: 'contents' }}>
                {/* Priehľadné logo — viď poznámku pri prvom zástupnom obrázku vyššie. */}
                <source srcSet="/logo_hradiska_small.webp" type="image/webp" />
                <img src="/logo_hradiska_small.png" alt="" style={{ height: '58%', width: 'auto', opacity: 0.92 }} />
              </picture>
            </div>
          )}
        </div>

        {/* TELO */}
        <div className="flex flex-col flex-1" style={{ padding: 24 }}>
          <div className="flex items-center gap-1.5 flex-wrap" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13, color: '#8a795e', marginBottom: 8 }}>
            <Calendar className="w-3 h-3" />
            <span>{formatSkDate(item.datum)}</span>
            <span aria-hidden="true">·</span>
            <span>{item.author}</span>
            <span aria-hidden="true">·</span>
            <span>{item.readingTime} min čítania</span>
          </div>

          <h3 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 20, fontWeight: 600, color: '#2d1810', lineHeight: 1.25, letterSpacing: '0.02em', margin: '0 0 10px' }}>
            {item.title}
          </h3>

          {item.excerpt && (
            <p className="ak-excerpt" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 14.5, color: '#5d4e37', lineHeight: 1.6, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.excerpt}
            </p>
          )}

          <span className="inline-flex items-center gap-1.5 ak-cta" style={{ marginTop: 'auto', fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13, fontWeight: 500, color: '#7d4f1d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Čítať <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </article>
    </a>
  );
}

// ============================================================================
// FeaturedPost – široká pripnutá karta hore (varianta 3B)
// ============================================================================
function FeaturedPost({ item, onOpenLightbox }: { item: StrapiAktualita; onOpenLightbox: (start: number) => void }) {
  const fotky = item.fotky ?? [];
  const hradisko = item.hradiskoSlug ? hradiskaData.find(h => h.name === item.hradiskoSlug) : null;
  const [expanded, setExpanded] = useState(false);
  const TEXT_LIMIT = 320;
  const text = item.obsah || '';
  const isLong = text.length > TEXT_LIMIT;
  const visibleText = expanded || !isLong ? text : text.slice(0, TEXT_LIMIT).trimEnd() + '…';

  return (
    <article
      className="aktualita-featured-grid"
      style={{
        background: '#fbf6ea', border: '1px solid #e3d4ad', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 16px 42px -24px rgba(60,40,15,.55)', marginBottom: 26,
      }}
    >
      <div className="relative" style={{ minHeight: 260 }}>
        {fotky.length > 0 ? (
          <PhotoTile img={fotky[0]} idx={0} style={{ width: '100%', height: '100%', minHeight: 260 }} onOpen={onOpenLightbox} />
        ) : (
          <PhotoPlaceholder className="absolute inset-0" />
        )}
        <span
          className="absolute pointer-events-none"
          style={{
            top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(28,21,16,.72)', color: '#e9c877', fontFamily: 'var(--font-heading)',
            fontSize: 10, letterSpacing: '.1em', padding: '6px 11px', borderRadius: 999,
          }}
        >
          <span style={{ color: '#c8862f' }}>◆</span>PRIPNUTÉ
        </span>
        {fotky.length > 0 && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(18,13,8,.68) 0%, rgba(18,13,8,.2) 46%, transparent 70%)' }} />
        )}
        {hradisko && (
          <span
            className="absolute pointer-events-none"
            style={{
              left: 14, bottom: 14, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#f4ead4',
              background: 'rgba(28,21,16,.55)', borderRadius: 6, padding: '4px 9px',
            }}
          >
            ◍ {hradisko.name}
          </span>
        )}
      </div>

      <div style={{ padding: '22px 24px' }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{ width: 38, height: 38, background: '#f0e6d1', border: '1px solid rgba(125,79,29,0.25)' }}
            aria-hidden="true"
          >
            <Shield className="w-4.5 h-4.5" style={{ color: GOLD }} />
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: '#2e2213' }}>Slovanské hradiská</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: '#8a795e' }}>
              {formatSkDate(item.datum)}{hradisko ? ` · ${hradisko.name}` : ''}
            </div>
          </div>
          <div className="flex-1" />
          <TypeChip typ={item.typAktivity} />
        </div>

        <h3 style={{ margin: '0 0 10px', fontFamily: 'var(--font-serif)', fontSize: 27, fontWeight: 700, color: '#2e2213', lineHeight: 1.12 }}>
          {item.nazov}
        </h3>
        {text && (
          <p style={{ margin: '0 0 18px', fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.5, color: '#4a3f2e', whiteSpace: 'pre-line' }}>
            {visibleText}
          </p>
        )}

        <div className="flex items-center gap-2.5 flex-wrap">
          {isLong && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.05em', color: '#fbf6ea',
                background: 'linear-gradient(180deg,#c8862f,#9a5d1f)', border: 'none', borderRadius: 999,
                padding: '9px 16px', cursor: 'pointer',
              }}
            >
              {expanded ? 'Zobraziť menej' : 'Čítať celé →'}
            </button>
          )}
          {hradisko && (
            <button
              onClick={() => focusHradisko(hradisko.name)}
              style={{
                fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.04em', color: '#9a5d1f',
                background: 'transparent', border: '1px solid #d9c69a', borderRadius: 999, padding: '9px 14px', cursor: 'pointer',
              }}
            >
              Na mape
            </button>
          )}
          <div className="flex-1" />
          {fotky.length > 0 && (
            <button
              onClick={() => onOpenLightbox(0)}
              style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: '#8a795e', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Galéria ({fotky.length})
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// MasonryPost – kompaktná karta v 2-stĺpcovej nástenke (varianta 3B)
// ============================================================================
function MasonryPost({ item, onOpenLightbox }: { item: StrapiAktualita; onOpenLightbox: (fotky: StrapiImage[], start: number) => void }) {
  const fotky = item.fotky ?? [];
  const hradisko = item.hradiskoSlug ? hradiskaData.find(h => h.name === item.hradiskoSlug) : null;
  const [expanded, setExpanded] = useState(false);
  const [hoverMap, setHoverMap] = useState(false);
  const open = (start: number) => onOpenLightbox(fotky, start);

  return (
    <article
      className="aktualita-masonry-card"
      style={{
        display: 'inline-block', width: '100%', background: '#fbf6ea', border: '1px solid #e3d4ad',
        borderRadius: 14, boxShadow: '0 12px 32px -22px rgba(60,40,15,.5)', overflow: 'hidden',
        marginBottom: 22, breakInside: 'avoid', transition: 'transform .18s, box-shadow .18s',
      }}
    >
      {fotky.length === 1 && (
        <PhotoTile img={fotky[0]} idx={0} style={{ width: '100%', height: 210 }} onOpen={open} overlay={vignetteOverlay(hradisko?.name, 'strong')} />
      )}
      {fotky.length === 2 && (
        <div className="grid grid-cols-2" style={{ gap: 4 }}>
          {fotky.map((f, i) => (
            <PhotoTile key={f.id} img={f} idx={i} style={{ width: '100%', height: 170 }} onOpen={open} overlay={vignetteOverlay(undefined, 'soft')} />
          ))}
        </div>
      )}
      {fotky.length >= 3 && (
        <PhotoGrid fotky={fotky} onOpenLightbox={(start) => open(start)} />
      )}

      <div style={{ padding: '15px 17px 3px' }}>
        <div className="flex items-center gap-2 mb-2">
          <TypeChip typ={item.typAktivity} />
          <div className="flex-1" />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: '#8a795e' }}>{formatSkDate(item.datum)}</span>
        </div>
        <h3 style={{ margin: '0 0 7px', fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 700, color: '#2e2213', lineHeight: 1.15 }}>
          {item.nazov}
        </h3>
        {item.obsah && (
          <p
            style={{
              margin: 0, fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5, color: '#4a3f2e', whiteSpace: 'pre-line',
              ...(expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
            }}
          >
            {item.obsah}
          </p>
        )}
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: 'none', padding: '4px 0 12px', color: '#9a5d1f', fontFamily: 'var(--font-serif)', fontSize: 16, cursor: 'pointer' }}
        >
          {expanded ? 'Zobraziť menej' : 'Zobraziť viac'}
        </button>
      </div>

      <div
        className="flex items-center gap-2"
        style={{ padding: '10px 17px', borderTop: '1px solid #ece0c2', background: '#f7efdb' }}
      >
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: '#2e2213' }}>
          {hradisko?.name ?? item.hradiskoSlug ?? '—'}
        </span>
        <div className="flex-1" />
        {hradisko && (
          <button
            onClick={() => focusHradisko(hradisko.name)}
            onMouseEnter={() => setHoverMap(true)}
            onMouseLeave={() => setHoverMap(false)}
            style={{
              fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '.04em',
              color: hoverMap ? '#c8862f' : '#9a5d1f', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            Na mape →
          </button>
        )}
      </div>
    </article>
  );
}

// ============================================================================
// AktualitaCard – FB-style single column post
// ============================================================================
export function AktualitaCard({ item }: { item: StrapiAktualita }) {
  const meta = TYP_META[item.typAktivity] ?? TYP_META.ine;
  const fotky = item.fotky ?? [];
  const [lightbox, setLightbox] = useState<{ open: boolean; start: number }>({ open: false, start: 0 });
  const [expanded, setExpanded] = useState(false);

  const hradisko = item.hradiskoSlug
    ? hradiskaData.find(h => h.name === item.hradiskoSlug)
    : null;

  const TEXT_LIMIT = 280; // ~4 riadky pri 15px / line-height 1.5 / max-w-600
  const text = item.obsah || '';
  const isLong = text.length > TEXT_LIMIT;
  const visibleText = expanded || !isLong ? text : text.slice(0, TEXT_LIMIT).trimEnd() + '…';

  const share = async () => {
    const url = `${window.location.origin}/aktuality#aktualita-${item.documentId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Odkaz skopírovaný');
    } catch {
      toast.error('Nepodarilo sa skopírovať odkaz');
    }
  };

  return (
    <>
      <article
        id={`aktualita-${item.documentId}`}
        className="flex flex-col overflow-hidden"
        style={{
          background: '#fffdf8',
          borderRadius: 12,
          border: '1px solid rgba(196,165,116,0.4)',
          boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
        }}
      >
        {/* PRIPNUTÝ INDIKÁTOR – samostatný riadok nad hlavičkou (FB "Pinned post") */}
        {item.zvyraznene && (
          <div
            className="flex items-center gap-1.5 px-4 pt-3"
            style={{ color: GOLD_SOFT, fontSize: 12, fontFamily: 'Georgia, serif' }}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pripnutý príspevok</span>
          </div>
        )}

        {/* HLAVIČKA – FB style: avatar (rovnaký pre všetky) + meno+chip + meta */}
        <header className={`flex items-start gap-3 px-4 ${item.zvyraznene ? 'pt-2' : 'pt-3'}`}>
          {/* Avatar – ROVNAKÝ pre všetky karty: autor = združenie */}
          <div
            className="flex-shrink-0 flex items-center justify-center rounded-full"
            style={{
              width: 40, height: 40,
              background: '#f0e6d1',
              border: '1px solid rgba(125,79,29,0.25)',
            }}
            aria-hidden="true"
          >
            <Shield className="w-5 h-5" style={{ color: GOLD }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Meno + drobný chip */}
            <div className="flex items-center gap-2 flex-wrap leading-tight">
              <span
                style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#2d1810', fontWeight: 500 }}
              >
                Slovanské hradiská
              </span>
            </div>
            {/* Meta riadok – ako FB pod menom */}
            <div
              className="flex items-center gap-1.5 mt-0.5 flex-wrap"
              style={{ color: '#8b7a5e', fontSize: 12, fontFamily: 'Georgia, serif' }}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatSkDate(item.datum)}</span>
              {relativeDateLabel(item.datum) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{relativeDateLabel(item.datum)}</span>
                </>
              )}
              {hradisko && (
                <>
                  <span aria-hidden="true">·</span>
                  <MapPin className="w-3 h-3" />
                  <span>{hradisko.name}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* TITULOK + TEXT */}
        <div className="px-4 pt-3 pb-3">
          <h3
            className="leading-tight font-semibold mb-2"
            style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#2d1810' }}
          >
            {item.nazov}
          </h3>
          {text && (
            <p
              style={{
                color: '#3d3528',
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {visibleText}
              {isLong && (
                <>
                  {' '}
                  <button
                    onClick={() => setExpanded(e => !e)}
                    className="font-medium hover:underline"
                    style={{ color: GOLD, fontFamily: 'Georgia, serif' }}
                  >
                    {expanded ? 'Skryť' : 'Zobraziť viac'}
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* FOTKY – pod textom, od hrany po hranu karty */}
        {fotky.length > 0 && (
          <PhotoGrid fotky={fotky} onOpenLightbox={(start) => setLightbox({ open: true, start })} />
        )}

        {/* LOKALITNÝ PÁSIK – kompaktný, klikateľný, len ak je prepojené hradisko */}
        {hradisko && (
          <LokalitaStrip
            coords={hradisko.coordinates}
            name={hradisko.name}
            okres={hradisko.okres}
            onClick={() => focusHradisko(hradisko.name)}
          />
        )}

        {/* AKČNÁ LIŠTA – Galéria vľavo, Zdieľať vpravo (mapa je teraz v pásiku) */}
        <footer
          className="flex items-stretch"
          style={{ borderTop: '1px solid rgba(196,165,116,0.35)', padding: 4 }}
        >
          {fotky.length > 0 ? (
            <ActionButton
              icon={<Images className="w-4 h-4" />}
              labelFull={`Galéria (${fotky.length})`}
              labelShort={`Galéria`}
              onClick={() => setLightbox({ open: true, start: 0 })}
            />
          ) : (
            <div className="flex-1" />
          )}
          <ActionButton
            icon={<Share2 className="w-4 h-4" />}
            labelFull="Zdieľať"
            labelShort="Zdieľať"
            onClick={share}
          />
        </footer>
      </article>

      <AnimatePresence>
        {lightbox.open && fotky.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Lightbox images={fotky} startIndex={lightbox.start} onClose={() => setLightbox({ open: false, start: 0 })} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Akčný button: rovnaký look pre všetky 3, jednotná hnedá farba, FB-style hover
function ActionButton({ icon, labelFull, labelShort, onClick }: { icon: React.ReactNode; labelFull: string; labelShort: string; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-md"
      style={{
        color: '#5d4e37',
        fontFamily: 'Georgia, serif',
        fontSize: 13,
        fontWeight: 500,
        background: hover ? 'rgba(196,165,116,0.15)' : 'transparent',
        transition: 'background 150ms ease',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span className="hidden sm:inline">{labelFull}</span>
      <span className="sm:hidden">{labelShort}</span>
    </button>
  );
}

// ============================================================================
// Skeleton
// ============================================================================
function AktualitaSkeleton() {
  const shimmer: React.CSSProperties = {
    background: 'linear-gradient(110deg, rgba(196,165,116,0.10) 8%, rgba(196,165,116,0.22) 18%, rgba(196,165,116,0.10) 33%)',
    backgroundSize: '200% 100%',
    animation: 'aktualita-shimmer 1.4s linear infinite',
  };
  return (
    <div
      className="overflow-hidden"
      style={{
        background: '#fffdf8',
        borderRadius: 12,
        border: '1px solid rgba(196,165,116,0.4)',
        boxShadow: '0 1px 2px rgba(70,40,20,0.06)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="w-10 h-10 rounded-full flex-shrink-0" style={shimmer} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-40 rounded" style={shimmer} />
          <div className="h-3 w-32 rounded" style={shimmer} />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        <div className="h-5 w-3/4 rounded" style={shimmer} />
        <div className="h-3 w-full rounded" style={shimmer} />
        <div className="h-3 w-11/12 rounded" style={shimmer} />
      </div>
      <div className="h-48" style={shimmer} />
    </div>
  );
}

// ============================================================================
// AktualityFeed – nástenka (masonry), varianta 3B: featured hore, chipy,
// 2-stĺpcová nástenka s vlastným scrollom
// ============================================================================
export interface AktualityFeedProps {
  initialPageSize?: number;
  showHeader?: boolean;
}

export default function AktualityFeed({ initialPageSize = 20, showHeader = true }: AktualityFeedProps) {
  const [items, setItems] = useState<KronikaItem[]>([]);
  const [intro, setIntro] = useState<KronikaItem | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  // Smer časovej osi. Typové filtre (Brigády/Tabule/…) sú preč — blog-posty
  // pole `typAktivity` nemajú, takže by dva z chipov boli natrvalo prázdne.
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Úvod sa ťahá zvlášť — je najstarší (2010), pri radení „najnovšie" by
  // na prvú stránku nepadol.
  useEffect(() => {
    let cancelled = false;
    getKronikaIntro()
      .then(i => { if (!cancelled) setIntro(i); })
      .catch(() => { /* úvod je ozdoba, bez neho nástenka funguje ďalej */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    setPage(1);
    getKronika({ page: 1, pageSize: initialPageSize, sort })
      .then(({ items, pagination }) => {
        if (cancelled) return;
        setItems(items);
        setHasMore(pagination ? pagination.page < pagination.pageCount : false);
        setState(items.length === 0 ? 'empty' : 'ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Kronika API nedostupná, sekciu skrývam.', err);
        setState('error');
      });
    return () => { cancelled = true; };
  }, [initialPageSize, sort]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { items: more, pagination } = await getKronika({ page: nextPage, pageSize: initialPageSize, sort });
      setItems(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(pagination ? pagination.page < pagination.pageCount : false);
    } catch (e) {
      console.warn('Load more zlyhalo', e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Úvod sa v nástenke neopakuje.
  const masonryItems = useMemo(
    () => items.filter(it => it.slug !== KRONIKA_INTRO_SLUG),
    [items]
  );

  if (state === 'error') return null;

  return (
    <section className="relative" style={{ padding: '48px 16px 64px' }}>
      <div className="relative mx-auto" style={{ maxWidth: 1200 }}>
        {showHeader && (
          <header className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3 opacity-60" aria-hidden="true">
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #c4a574)' }} />
              <span style={{ color: '#c4a574', fontSize: 12, lineHeight: 1 }}>⚜</span>
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, #c4a574, transparent)' }} />
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, color: '#2e2213' }}>
              Aktuality zo života združenia
            </h2>
            <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 19, color: '#8a795e' }}>
              Kronika brigád, podujatí a obnov pamiatok
            </p>
            <CeramicDivider />
          </header>
        )}

        {state === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 22 }}>
            {Array.from({ length: 4 }).map((_, i) => <AktualitaSkeleton key={i} />)}
          </div>
        )}

        {state === 'empty' && (
          <p className="text-center py-10" style={{ color: '#8a795e', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            Zatiaľ tu nie sú žiadne príspevky. Hneď ako vyrazíme do terénu, dáme vedieť ✦
          </p>
        )}

        {state === 'ok' && (
          <>
            {intro && <KronikaIntro item={intro} />}

            {/* Radenie časovej osi namiesto typových filtrov. */}
            <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginBottom: 22 }}>
              {([
                { id: 'desc' as const, label: 'Najnovšie' },
                { id: 'asc' as const, label: 'Od najstaršieho' },
              ]).map((f) => {
                const active = sort === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSort(f.id)}
                    style={{
                      fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.04em',
                      padding: '8px 16px', borderRadius: 999, cursor: 'pointer', transition: 'all .15s',
                      ...(active
                        ? { background: 'linear-gradient(180deg,#c8862f,#9a5d1f)', color: '#fbf6ea', border: '1px solid #9a5d1f' }
                        : { background: '#f6efdd', color: '#5a4a32', border: '1px solid #d9c69a' }),
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {masonryItems.length === 0 ? (
              <p className="text-center py-10" style={{ color: '#8a795e', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
                V tejto kategórii zatiaľ nie sú žiadne príspevky.
              </p>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '32px 28px' }}>
                  {masonryItems.map((item) => (
                    <KronikaCard key={item.documentId} item={item} />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center" style={{ paddingTop: 4, paddingBottom: 14 }}>
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 disabled:opacity-60"
                      style={{
                        background: '#fbf6ea',
                        color: '#5d4e37',
                        border: '1px solid #d9c69a',
                        fontFamily: 'var(--font-serif)',
                        transition: 'background 150ms ease',
                      }}
                    >
                      {loadingMore ? 'Načítavam…' : 'Načítať staršie'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {/* Lightbox tu už nie je — karty kroniky vedú na článok, galéria je na ňom.
          Komponent `Lightbox` ostáva v súbore, používa ho AktualitaCard na /aktuality. */}
    </section>
  );
}
