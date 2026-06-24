'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import {
  ChevronLeft, ChevronRight, X, MapPin, Pin, Calendar,
  Shield, Camera, Share2, Images,
} from 'lucide-react';
import {
  getAktuality, getStrapiImageUrl,
  StrapiAktualita, AktualitaTyp, StrapiImage,
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
const TYP_META: Record<AktualitaTyp, { label: string; bg: string; fg: string }> = {
  brigada:        { label: 'Brigáda',          bg: '#E5EFE8', fg: '#2E5C42' },
  nova_tabula:    { label: 'Tabuľa',           bg: '#F4E5E8', fg: '#8A3548' },
  socha_pamatnik: { label: 'Pamätník',         bg: '#ECE6F4', fg: '#5A3B86' },
  podujatie:      { label: 'Podujatie',        bg: '#FAEFD9', fg: '#8C5810' },
  vyskum:         { label: 'Výskum',           bg: '#E2EEF2', fg: '#2C6680' },
  ine:            { label: 'Iné',              bg: '#EFEAE0', fg: '#5D4E37' },
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

// Mesačný oddeľovač – mesiac v nominatíve, prvé veľké
const MONTHS_NOM = ['Január', 'Február', 'Marec', 'Apríl', 'Máj', 'Jún', 'Júl', 'August', 'September', 'Október', 'November', 'December'];
function formatMonthLabel(d: Date): string {
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
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
// AktualityFeed – jeden vertikálny stĺpec, max-w 600 px, krémové pozadie
// ============================================================================
// MonthDivider – kronikový mesačný oddeľovač medzi kartami
function MonthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2" aria-hidden="true">
      <div className="flex-1 h-px" style={{ background: 'rgba(196,165,116,0.4)' }} />
      <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: '#a87437', fontWeight: 500, letterSpacing: '0.02em' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(196,165,116,0.4)' }} />
    </div>
  );
}

// Rendering pripnutých (bez mesačnej skupiny) + zvyšok s mesačnými oddeľovačmi
function renderTimeline(items: StrapiAktualita[]): React.ReactNode {
  const nodes: React.ReactNode[] = [];
  const pinned = items.filter(it => it.zvyraznene);
  const regular = items.filter(it => !it.zvyraznene);

  pinned.forEach(it => nodes.push(<AktualitaCard key={it.documentId} item={it} />));

  let lastMonth: string | null = null;
  regular.forEach(it => {
    const d = new Date(it.datum);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthKey !== lastMonth) {
      nodes.push(<MonthDivider key={`month-${monthKey}`} label={formatMonthLabel(d)} />);
      lastMonth = monthKey;
    }
    nodes.push(<AktualitaCard key={it.documentId} item={it} />);
  });

  return nodes;
}

export interface AktualityFeedProps {
  initialPageSize?: number;
  showHeader?: boolean;
}

export default function AktualityFeed({ initialPageSize = 4, showHeader = true }: AktualityFeedProps) {
  const [items, setItems] = useState<StrapiAktualita[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [activeFilter, setActiveFilter] = useState<AktualitaTyp | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // JS-driven viewport check (Tailwind responsive triedy zlyhávajú za istých okolností)
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const showOrnaments = viewportWidth >= 1280;

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getAktuality({ page: 1, pageSize: initialPageSize })
      .then(({ items, pagination }) => {
        if (cancelled) return;
        setItems(items);
        setHasMore(pagination ? pagination.page < pagination.pageCount : false);
        setState(items.length === 0 ? 'empty' : 'ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Aktuality API nedostupné, sekciu skrývam.', err);
        setState('error');
      });
    return () => { cancelled = true; };
  }, [initialPageSize]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { items: more, pagination } = await getAktuality({ page: nextPage, pageSize: initialPageSize });
      setItems(prev => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(pagination ? pagination.page < pagination.pageCount : false);
    } catch (e) {
      console.warn('Load more zlyhalo', e);
    } finally {
      setLoadingMore(false);
    }
  };

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return items;
    return items.filter(it => it.typAktivity === activeFilter);
  }, [items, activeFilter]);

  if (state === 'error') return null;

  return (
    <section
      className="relative"
      style={{
        backgroundColor: '#f7f1e3', // krémový pergament – konzistentne s palettou stránky
        paddingTop: 56,
        paddingBottom: 64,
        zIndex: 20,
        overflowX: 'clip', // zabraňuje horizontálnemu scrollu ale nepoškodzuje sticky/absolute children
      }}
    >
      {/* DEKORATÍVNE ORNAMENTY – JS-driven render, viewport>=1024 px.
          PERF: <picture> načíta WebP (~70 KB, 1400px) namiesto pôvodného PNG (5.6 MB, 2304px).
          PNG ostáva ako fallback pre prehliadače bez WebP podpory + ako záloha pri obnove. */}
      {showOrnaments && (
        <>
          {/* Ľavý ornament – clip-path orezáva dekoratívny rámik z PNG */}
          <picture>
            <source srcSet="/ornament-keramika.webp" type="image/webp" />
            <img
              src="/ornament-keramika.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                left: 'calc((50% - 300px - 420px) / 2)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 420,
                height: 'auto',
                opacity: 0.5,
                zIndex: 1,
                pointerEvents: 'none',
                // Orezanie rámika: vrchný 8%, pravý 6%, spodný 12%, ľavý 6%
                clipPath: 'inset(8% 6% 12% 6%)',
              }}
            />
          </picture>
          <picture>
            <source srcSet="/ornament-keramika.webp" type="image/webp" />
            <img
              src="/ornament-keramika.png"
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute',
                right: 'calc((50% - 300px - 420px) / 2)',
                top: '50%',
                transform: 'translateY(-50%) scaleX(-1)',
                width: 420,
                height: 'auto',
                opacity: 0.5,
                zIndex: 1,
                pointerEvents: 'none',
                clipPath: 'inset(8% 6% 12% 6%)',
              }}
            />
          </picture>
        </>
      )}

      {/* JEDEN vertikálny stĺpec max 600px, vycentrovaný */}
      <div className="relative mx-auto px-4" style={{ maxWidth: 600 }}>
        {showHeader && (
          <header className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3 opacity-60" aria-hidden="true">
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #c4a574)' }} />
              <span style={{ color: '#c4a574', fontSize: 12, lineHeight: 1 }}>⚜</span>
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, #c4a574, transparent)' }} />
            </div>
            <h2
              className="font-semibold tracking-wide"
              style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(22px, 3vw, 28px)', color: '#2d1810', letterSpacing: '0.03em' }}
            >
              Aktuality zo života združenia
            </h2>
            <p className="mt-2 text-sm" style={{ color: '#7a6b56', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Kronika brigád, podujatí a obnov pamiatok
            </p>
          </header>
        )}

        {/* OBSAH FEEDU – vertikálny stĺpec, karty pod sebou s 16px medzerou */}
        {state === 'loading' && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => <AktualitaSkeleton key={i} />)}
          </div>
        )}

        {state === 'empty' && (
          <p className="text-center py-10" style={{ color: '#7a6b56', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Zatiaľ tu nie sú žiadne príspevky. Hneď ako vyrazíme do terénu, dáme vedieť ✦
          </p>
        )}

        {state === 'ok' && filtered.length === 0 && (
          <p className="text-center py-10" style={{ color: '#7a6b56', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            V tejto kategórii zatiaľ nie sú žiadne príspevky.
          </p>
        )}

        {state === 'ok' && filtered.length > 0 && (
          <div
            className="aktuality-list space-y-4"
            style={{
              display: 'block',
              height: 'min(820px, 78vh)',
              overflowY: 'scroll',
              paddingTop: 4,
              paddingRight: 8,
              paddingBottom: 4,
              scrollbarGutter: 'stable',
            }}
          >
            {renderTimeline(filtered)}
          </div>
        )}

        {/* STARŠIE AKTUALITY */}
        {state === 'ok' && hasMore && activeFilter === 'all' && (
          <div className="text-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 disabled:opacity-60"
              style={{
                background: '#fffdf8',
                color: '#5d4e37',
                border: '1px solid rgba(125,79,29,0.3)',
                fontFamily: 'Georgia, serif',
                transition: 'background 150ms ease',
              }}
            >
              {loadingMore ? 'Načítavam…' : 'Staršie aktuality'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
