'use client';

/**
 * Fotogaléria webu — všetky fotky z galérií článkov.
 *
 * Nahradila prototyp, ktorý stál na poli `mockGalleryImages` natvrdo v kóde:
 * mal filtre „Fotografie / 3D modely / Výpravy", vyhľadávanie aj prepínač
 * masonry/mriežka, ale nad fotkami, ktoré neexistovali. Reálne fotky žijú
 * v galériách článkov a nijaké také označenie nemajú, takže tie filtre sa
 * nedali naplniť — preto sú preč a ostala mriežka.
 *
 * Prezeranie je TEN ISTÝ svetelný box, aký beží pod článkom (`HistoricalGallery`),
 * nie jeho kópia — popis, reakcie aj komentáre k fotke teda fungujú rovnako
 * a na oboch miestach sa správajú zhodne.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Lightbox, type GalleryImage } from '../components/HistoricalGallery';
import { getGalleryPhotos, type KronikaPhoto } from '../lib/strapi';

/** Koľko článkov sa doťahuje naraz (~100 fotiek na dávku). */
const BATCH = 12;

export function GalleryPage() {
  const [photos, setPhotos] = useState<KronikaPhoto[]>([]);
  const [page, setPage] = useState(0);          // 0 = ešte sa nenačítalo nič
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openAt, setOpenAt] = useState<number | null>(null);
  const loadedRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy || !hasMore) return;
    setBusy(true);
    setError('');
    try {
      const next = page + 1;
      const res = await getGalleryPhotos({ page: next, pageSize: BATCH });
      setPhotos(prev => {
        // Tá istá fotka môže byť v galérii viacerých článkov — v mriežke ju
        // chceme raz, inak by sa v svetelnom boxe opakovala.
        const seen = new Set(prev.map(p => p.url));
        return [...prev, ...res.photos.filter(p => !seen.has(p.url))];
      });
      setPage(next);
      setHasMore(res.hasMore);
    } catch {
      setError('Fotky sa nepodarilo načítať. Skúste to prosím znova.');
    } finally {
      setBusy(false);
    }
  }, [busy, hasMore, page]);

  // Prvá dávka. `loadedRef` bráni dvojitému spusteniu v React StrictMode.
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadMore();
  }, [loadMore]);

  /**
   * Ďalšie dávky sa doťahujú samy, keď sa človek priblíži ku koncu mriežky.
   * Tlačidlo pod ňou ostáva ako záloha pre prípad, že by pozorovateľ nebol
   * k dispozícii (alebo aby sa dalo dotiahnuť aj bez posúvania).
   */
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      entries => { if (entries.some(e => e.isIntersecting)) loadMore(); },
      { rootMargin: '600px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // Podklad pre svetelný box — rovnaký tvar, aký používa galéria v článku.
  const lightboxImages: GalleryImage[] = photos.map(p => ({
    url: p.url,
    alt: p.alt || p.postTitle,
    caption: p.caption || p.postTitle,
    fileId: p.fileId,
  }));

  // Zdieľanie konkrétnej fotky: #foto-N v adrese ju otvorí po načítaní.
  useEffect(() => {
    if (!photos.length || openAt !== null) return;
    const m = window.location.hash.match(/^#foto-(\d+)$/);
    if (!m) return;
    const i = parseInt(m[1], 10) - 1;
    if (i >= 0 && i < photos.length) setOpenAt(i);
  }, [photos.length, openAt]);

  const close = () => {
    setOpenAt(null);
    // Box si do adresy zapisuje #foto-N — po zatvorení ju upraceme.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  return (
    <div className="min-h-screen parchment">
      <style>{`
        .gal-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; }
        .gal-tile { position: relative; display: block; padding: 0; border: none; cursor: pointer;
                    border-radius: 18px; overflow: hidden; aspect-ratio: 4 / 3; background: var(--hr-wash-5);
                    box-shadow: 0 12px 28px -18px rgba(40,26,10,.5); transition: transform .2s ease; }
        .gal-tile:hover { transform: translateY(-4px); }
        .gal-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
        .gal-tile:hover img { transform: scale(1.05); }
        .gal-cap { position: absolute; left: 10px; right: 10px; bottom: 10px; text-align: left;
                   font-family: ui-monospace, monospace; font-size: 11px; color: var(--hr-on-photo-2);
                   background: var(--hr-glass); border-radius: 8px; padding: 4px 9px;
                   overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (prefers-reduced-motion: reduce) {
          .gal-tile, .gal-tile img { transition: none; }
          .gal-tile:hover { transform: none; }
          .gal-tile:hover img { transform: none; }
        }
      `}</style>

      <div className="container" style={{ paddingTop: 34, paddingBottom: 64, maxWidth: 1240 }}>
        {/* Omrvinky */}
        <nav aria-label="Omrvinky" style={{ marginBottom: 16 }}>
          <ol style={{ display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '.03em', color: 'var(--hr-clear-text)' }}>
            <li><a href="/" style={{ color: 'var(--hr-accent)', textDecoration: 'none' }}>Domov</a></li>
            <li aria-hidden="true">›</li>
            <li>Fotogaléria</li>
          </ol>
        </nav>

        <header style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 600, letterSpacing: '.06em', color: 'var(--hr-ink)', margin: 0 }}>
            Fotogaléria
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--hr-body-3)', margin: '10px 0 0' }}>
            Fotografie z hradísk, výprav a nálezov.
          </p>
        </header>

        {error && (
          <div role="alert" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--hr-error-text)', background: 'var(--hr-error-bg)', border: '1px solid var(--hr-error-line)', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="gal-grid">
          {photos.map((p, i) => (
            <button
              key={`${p.fileId ?? p.url}-${i}`}
              type="button"
              className="gal-tile"
              onClick={() => setOpenAt(i)}
              aria-label={`Otvoriť fotku: ${p.caption || p.postTitle}`}
            >
              <img src={p.thumb} alt={p.alt} loading="lazy" decoding="async" />
              <span className="gal-cap">◍ {p.caption || p.postTitle}</span>
            </button>
          ))}
        </div>

        {/* Sem sa doroluje → doťiahne sa ďalšia dávka */}
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
          {busy && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--hr-muted)' }}>
              <Loader2 className="w-4 h-4 animate-spin" /> Načítavam fotky…
            </span>
          )}
          {!busy && hasMore && (
            <button
              type="button"
              onClick={loadMore}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.1em', color: 'var(--hr-on-photo)', background: 'linear-gradient(180deg, var(--hr-accent-soft), var(--hr-accent))', border: 'none', borderRadius: 999, padding: '13px 30px', cursor: 'pointer', boxShadow: '0 10px 24px -10px rgba(154,93,31,.7)' }}
            >
              NAČÍTAŤ ĎALŠIE
            </button>
          )}
          {!busy && !hasMore && photos.length > 0 && (
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--hr-muted-2)' }}>
              To je celá galéria — {photos.length} fotografií.
            </span>
          )}
        </div>
      </div>

      {/* Cez portál do `document.body`, NIE do stromu stránky. Obal `.parchment`
          má `position: relative; z-index: 1`, čím zakladá vlastnú vrstvu —
          svetelný box (z-index 60) by v nej uviazol na úrovni 1 a horná lišta
          (z-50, mimo tejto vrstvy) by ho zhora prekryla. Rovnako to rieši aj
          galéria pod článkom. */}
      {openAt !== null && lightboxImages[openAt] && typeof document !== 'undefined' &&
        createPortal(
          <Lightbox
            images={lightboxImages}
            index={openAt}
            onClose={close}
            onPrev={() => setOpenAt(i => (i === null ? null : (i - 1 + lightboxImages.length) % lightboxImages.length))}
            onNext={() => setOpenAt(i => (i === null ? null : (i + 1) % lightboxImages.length))}
          />,
          document.body,
        )}
    </div>
  );
}

export default GalleryPage;
