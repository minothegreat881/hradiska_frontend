'use client';

/**
 * „ZO ŽIVOTA ZDRUŽENIA" — nový návrh pásu zápisov. Žije LEN v laboratóriu;
 * produkčný `AktualityFeedV2.tsx` sa nedotýka.
 *
 * DÁTA SÚ TIE ISTÉ: `getKronikaAll` / `getKronikaIntro` / `getDomovskaGaleria`
 * — žiadny nový endpoint, žiadny zápis, žiadny token.
 *
 * ČO SA MENÍ OPROTI PRODUKČNEJ:
 *   1. DÁTUM NA KARTE BOL NEČITATEĽNÝ. Bral farbu `--hr-on-photo-3`, ktorá je
 *      v šate namapovaná na tmavý odtieň akcentu — tmavé písmo na tmavom skle.
 *      Opravené v `theme.css` (mapuje sa na svetlú odnož iskry), takže to
 *      sedí vo všetkých témach, nielen tu.
 *   2. PÁS SA DAL LISTOVAŤ IBA POSÚVANÍM. Pribudli šípky a časová os je po
 *      novom ovládací prvok: dá sa do nej kliknúť, potiahnuť ju aj ovládať
 *      klávesnicou, a pri posúvaní ukazuje rok zápisu, na ktorom stojíš.
 *   3. Popiska pod pásom hovorí, čo sa dá robiť, nie čo sa deje.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getBlogPosts, getDomovskaGaleria, getKronikaAll, getKronikaIntro, getKronikaPhotos,
  getStrapiImageUrl, KRONIKA_INTRO_SLUG, KronikaItem, KronikaPhoto, StrapiImage,
} from '../lib/strapi';

const GOLD_GRAD = 'linear-gradient(180deg,var(--hr-accent-soft),var(--hr-accent))';
const GLASS: React.CSSProperties = {
  position: 'absolute', left: 11, right: 11, bottom: 11,
  background: 'var(--hr-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--hr-glass-line)', borderRadius: 17, padding: '13px 16px',
};

/** Šírka karty + medzera — o toľko posunie jedno kliknutie na šípku. */
const CARD_STEP = 300 + 18;

const GALLERY_FALLBACK: { src: string; place?: string }[] = [
  { src: '/articles/bojna/bojna-cover.jpg', place: 'Bojná — Valy' },
  { src: '/medailon-bojna.webp' },
  { src: '/articles/bojna/bojna-od-vychodu.jpg' },
  { src: '/articles/bojna/brana.jpg' },
  { src: '/articles/bojna/bojna-09-reconstruction.jpg' },
];
const GALLERY_TILES = 5;
const FOUNDED_YEAR = 2010;

function pickGallery(pool: KronikaPhoto[], count: number): KronikaPhoto[] {
  if (pool.length <= count) return pool;
  const landscapeIdx = pool.findIndex(p => p.width > p.height * 1.15);
  const hero = pool[landscapeIdx >= 0 ? landscapeIdx : 0];
  const rest = pool.filter(p => p !== hero);
  const step = Math.max(1, Math.floor(rest.length / (count - 1)));
  const picked = [hero];
  for (let i = 0; picked.length < count && i < rest.length; i += step) picked.push(rest[i]);
  return picked;
}

function formatSkDate(iso: string): string {
  const d = new Date(iso);
  const months = ['januára','februára','marca','apríla','mája','júna','júla','augusta','septembra','októbra','novembra','decembra'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function prefersReduced(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Okrúhla šípka nad pásom. Vypnutá na kraji — nemá kam posúvať. */
function StepButton({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="lakv-step"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Novšie zápisy' : 'Staršie zápisy'}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {dir === 'prev' ? <path d="M19 12H5M11 18l-6-6 6-6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
      </svg>
    </button>
  );
}

export default function LabAktuality() {
  const [items, setItems] = useState<KronikaItem[]>([]);
  const [intro, setIntro] = useState<KronikaItem | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [photos, setPhotos] = useState<KronikaPhoto[]>([]);
  const [curated, setCurated] = useState<StrapiImage[]>([]);
  const [postCount, setPostCount] = useState<number | null>(null);

  /* Poloha v páse: 0 = najnovší zápis, 1 = najstarší. Jedna hodnota živí
     výplň osi, polohu ukazovateľa aj to, ktorá šípka je vypnutá. */
  const [progress, setProgress] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [cursorIdx, setCursorIdx] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getKronikaIntro().then(i => { if (!cancelled) setIntro(i); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /**
   * Počet článkov. Doťahuje sa naživo, aby nezostaral — číslo v štatistike
   * zapísané natvrdo je len otázka času, kedy prestane platiť.
   *
   * Sťahuje sa JEDEN článok (`pageSize: 1`) a číta sa `pagination.total`;
   * celý zoznam by bol pre jedno číslo zbytočný prenos. Keď sa nepodarí,
   * dlaždica ukáže pomlčku — nie výmysel.
   */
  useEffect(() => {
    let cancelled = false;
    getBlogPosts({ pageSize: 1 })
      .then(r => { if (!cancelled) setPostCount(r.pagination?.total ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    let cancelled = false;

    const load = async () => {
      const cur = await getDomovskaGaleria();
      if (cancelled) return;
      if (cur.length) { setCurated(cur); return; }
      try {
        const pool = await getKronikaPhotos();
        if (!cancelled) setPhotos(pool);
      } catch { /* nastúpi statická záloha */ }
    };

    if (typeof IntersectionObserver === 'undefined') { load(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); load(); }
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => { cancelled = true; io.disconnect(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    getKronikaAll('desc')
      .then((all) => {
        if (cancelled) return;
        setItems(all);
        setState(all.length === 0 ? 'empty' : 'ok');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Kronika API nedostupná, sekciu skrývam.', err);
        setState('error');
      });
    return () => { cancelled = true; };
  }, []);

  const stripItems = useMemo(
    () => items.filter(it => it.slug !== KRONIKA_INTRO_SLUG),
    [items]
  );

  /** Jediné miesto, kde sa číta stav pásu — volá sa pri posune aj po načítaní. */
  const readStrip = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
    setEdges({ start: el.scrollLeft <= 2, end: max - el.scrollLeft <= 2 });
    setCursorIdx(Math.round(el.scrollLeft / CARD_STEP));
  }, []);

  useEffect(() => { readStrip(); }, [readStrip, stripItems.length]);

  const step = (dir: -1 | 1) => {
    stripRef.current?.scrollBy({ left: dir * CARD_STEP, behavior: prefersReduced() ? 'auto' : 'smooth' });
  };

  /** Preloží polohu na osi na posun pásu — spoločné pre kliknutie aj ťahanie. */
  const scrubTo = (clientX: number) => {
    const track = trackRef.current;
    const el = stripRef.current;
    if (!track || !el) return;
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    el.scrollTo({ left: p * (el.scrollWidth - el.clientWidth), behavior: 'auto' });
  };

  const onTrackKey = (e: React.KeyboardEvent) => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); el.scrollTo({ left: 0, behavior: 'smooth' }); }
    else if (e.key === 'End') { e.preventDefault(); el.scrollTo({ left: max, behavior: 'smooth' }); }
  };

  const galleryTiles = useMemo(() => {
    if (curated.length) {
      return curated.slice(0, GALLERY_TILES).map(img => ({
        src: getStrapiImageUrl(img, 'medium'),
        full: getStrapiImageUrl(img),
        alt: img.alternativeText || '',
        place: img.caption || '',
        fileId: img.id,
      }));
    }
    if (photos.length) {
      return pickGallery(photos, GALLERY_TILES).map(p => ({
        src: p.thumb,
        full: p.url,
        alt: p.alt || p.postTitle,
        place: p.caption || p.postTitle,
        fileId: p.fileId,
      }));
    }
    return GALLERY_FALLBACK.map(g => ({ src: g.src, full: g.src, alt: '', place: g.place ?? '', fileId: undefined }));
  }, [curated, photos]);

  if (state === 'error' || state === 'empty') return null;

  const yearNewest = stripItems[0] ? new Date(stripItems[0].datum).getFullYear() : new Date().getFullYear();
  const yearOldest = stripItems.length ? new Date(stripItems[stripItems.length - 1].datum).getFullYear() : FOUNDED_YEAR;
  const yearsActive = new Date().getFullYear() - FOUNDED_YEAR;
  const cursorItem = stripItems[Math.min(cursorIdx, Math.max(0, stripItems.length - 1))];
  const cursorYear = cursorItem ? new Date(cursorItem.datum).getFullYear() : yearNewest;
  const osFill = 6 + progress * 94;

  return (
    <section className="lakv" style={{ padding: '64px 0 72px' }}>
      <div className="container" style={{ maxWidth: 1104 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26 }}>
          <div>
            <div className="lakv-kronika">
              <span className="lakv-dot" />
              <span>KRONIKA · {FOUNDED_YEAR} — {new Date().getFullYear()}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 600, letterSpacing: '.06em', color: 'var(--hr-ink)', margin: 0 }}>
              Zo života združenia
            </h2>
          </div>
          <a href="/aktuality" className="lakv-more">CELÁ KRONIKA →</a>
        </div>

        {/* horný rad: logo + pripnutý zápis */}
        <div className="lakv-top" style={{ marginBottom: 30 }}>
          <div className="lakv-logo" style={{ position: 'relative', aspectRatio: '900 / 886', alignSelf: 'start', borderRadius: 30, overflow: 'hidden', border: '1px solid var(--hr-line-soft)', background: 'radial-gradient(ellipse at 50% 38%, var(--hr-wash-1) 0%, var(--hr-wash-2) 55%, var(--hr-wash-3) 100%)', boxShadow: '0 24px 56px -26px rgba(40,26,10,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <picture style={{ display: 'flex', width: '100%', height: '100%' }}>
              <source srcSet="/logo_hradiska_full.webp" type="image/webp" />
              <img src="/logo_hradiska_full.png" alt="Slovanské hradiská" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </picture>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <a href={intro ? `/blog/${intro.slug}` : '/aktuality'} className="lakv-tile lakv-pinned">
              <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 700, color: 'var(--hr-ink)', lineHeight: 1.04, marginBottom: 12, letterSpacing: '-.02em' }}>
                {intro?.title ?? 'Prečo to vlastne robím'}
              </span>
              {intro?.excerpt && (
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 17.5, lineHeight: 1.55, color: 'var(--hr-body)', marginBottom: 10 }}>
                  {intro.excerpt}
                </span>
              )}
              {intro && (
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 14.5, color: 'var(--hr-muted)', marginBottom: 18 }}>
                  {intro.author} · {formatSkDate(intro.datum)} · {intro.readingTime} min čítania
                </span>
              )}
              <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.08em', color: 'var(--hr-surface)', background: GOLD_GRAD, borderRadius: 999, padding: '11px 20px' }}>
                ČÍTAŤ CELÉ <span style={{ fontSize: 14 }}>→</span>
              </span>
            </a>

            <div className="lakv-stats">
              {[
                { n: items.length ? String(items.length) : '—', l: 'zápisov v kronike' },
                { n: String(yearsActive), l: 'rokov činnosti' },
                /* Bolo `52+ hradísk na mape` — počet bodov na mape zapísaný
                   natvrdo v `data/hradiska.ts`, k tomu „+", ktoré z presného
                   čísla robilo odhad. Teraz skutočný počet publikovaných
                   článkov zo Strapi. */
                { n: postCount ? String(postCount) : '—', l: 'článkov na webe' },
              ].map((s, i) => (
                <span key={s.l} className={i === 1 ? 'lakv-stat lakv-stat-mid' : 'lakv-stat'}>
                  <span className="lakv-stat-n">{s.n}</span>
                  <span className="lakv-stat-l">{s.l}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pás zápisov: nadpis + šípky ─────────────────────────────── */}
        <div className="lakv-striphead">
          <span className="lakv-label">ZÁPISY Z AKTIVÍT</span>
          <span className="lakv-hint">listujte šípkami alebo potiahnite os</span>
          <div className="lakv-steps">
            <StepButton dir="prev" disabled={edges.start} onClick={() => step(-1)} />
            <StepButton dir="next" disabled={edges.end} onClick={() => step(1)} />
          </div>
        </div>

        <div
          ref={stripRef}
          onScroll={readStrip}
          className="lakv-strip"
          data-at-start={edges.start ? 'true' : 'false'}
          data-at-end={edges.end ? 'true' : 'false'}
        >
          {stripItems.map(item => (
            <a key={item.documentId} href={`/blog/${item.slug}`} className="lakv-tile lakv-card">
              {item.coverUrl ? (
                <img src={item.coverUrl} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, var(--hr-wash-4) 0%, var(--hr-wash-5) 55%, var(--hr-on-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 96 }}>
                  <picture style={{ display: 'contents' }}>
                    <source srcSet="/logo_hradiska_small.webp" type="image/webp" />
                    <img src="/logo_hradiska_small.png" alt="" aria-hidden="true" loading="lazy" decoding="async" style={{ width: '62%', maxHeight: '100%', objectFit: 'contain', opacity: 0.92 }} />
                  </picture>
                </span>
              )}
              <span style={GLASS}>
                {/* Dátum berie svetlú odnož iskry — na skle musí byť vidieť. */}
                <span className="lakv-date">{formatSkDate(item.datum)} · {item.readingTime} min</span>
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 700, color: 'var(--hr-on-photo)', lineHeight: 1.1 }}>
                  {item.title}
                </span>
              </span>
            </a>
          ))}
        </div>

        {/* ── Časová os ako ovládanie ─────────────────────────────────────
            Nie je to už ukazovateľ, ale posuvník: dá sa do neho kliknúť,
            potiahnuť ho aj ovládať klávesnicou. Pri posúvaní ukazuje rok
            zápisu, na ktorom stojíš — inak sa v osemdesiatich zápisoch
            nedá zorientovať. */}
        <div className="lakv-os">
          <span className="lakv-year">{yearNewest}</span>
          <div
            ref={trackRef}
            className={scrubbing ? 'lakv-track lakv-track-live' : 'lakv-track'}
            role="slider"
            tabIndex={0}
            aria-label="Časová os zápisov"
            aria-valuemin={yearOldest}
            aria-valuemax={yearNewest}
            aria-valuenow={cursorYear}
            aria-valuetext={cursorItem ? `${formatSkDate(cursorItem.datum)} — ${cursorItem.title}` : undefined}
            onKeyDown={onTrackKey}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setScrubbing(true);
              scrubTo(e.clientX);
            }}
            onPointerMove={(e) => { if (scrubbing) scrubTo(e.clientX); }}
            onPointerUp={(e) => { e.currentTarget.releasePointerCapture(e.pointerId); setScrubbing(false); }}
            onPointerCancel={() => setScrubbing(false)}
          >
            <div className="lakv-fill" style={{ width: `${osFill}%` }} />
            <div className="lakv-knob" style={{ left: `${osFill}%` }}>
              <span className="lakv-knob-year">{cursorYear}</span>
            </div>
          </div>
          <span className="lakv-year lakv-year-old">{yearOldest}</span>
        </div>

        {/* vybraná fotogaléria */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <span className="lakv-label">VYBRANÁ FOTOGALÉRIA</span>
          <a href="/galeria" className="lakv-more">CELÁ GALÉRIA →</a>
        </div>
        <div ref={galleryRef} className="lakv-gal">
          {galleryTiles.map((g, i) => (
            <a
              key={g.src}
              href="/galeria"
              className="lakv-tile"
              style={{ position: 'relative', display: 'block', borderRadius: i === 0 ? 26 : 20, overflow: 'hidden', gridColumn: i === 0 ? 'span 2' : undefined, gridRow: i === 0 ? 'span 2' : undefined }}
            >
              <img src={g.src} alt={g.alt} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {g.place && <span className="lakv-place">◍ {g.place}</span>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
