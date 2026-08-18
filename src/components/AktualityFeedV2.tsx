'use client';

/**
 * AktualityFeed v2 — „Zo života združenia" podľa schváleného návrhu 3a.
 *
 * Vedľa pôvodného `AktualityFeed.tsx`, nie namiesto neho. Ten súbor totiž
 * exportuje aj `AktualitaCard`, ktorú používa stránka `/aktuality` na
 * vykreslenie kolekcie `aktualita` (záznamy pridávané z administrácie) —
 * prepísanie by ju zhodilo. Prepnutie späť = jeden import v `HomePage.tsx`.
 *
 * Dátový kontrakt je nezmenený: `getKronika` / `getKronikaIntro` / `KronikaItem`,
 * teda blog-posty v kategórii `aktuality`. Žiadny nový endpoint, žiadny zápis,
 * žiadny token — len tie isté verejné GET-y cez `/strapi` proxy ako doteraz.
 *
 * Layout:
 *   [logo združenia]  [pripnutý zápis „Prečo to vlastne robím" + štatistiky]
 *   [horizontálny pás zápisov z aktivít + časová os prepojená so scrollom]
 *   [vybraná fotogaléria]
 *   [Načítať staršie]
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getDomovskaGaleria, getKronikaAll, getKronikaIntro, getKronikaPhotos, getStrapiImageUrl,
  KRONIKA_INTRO_SLUG, KronikaItem, KronikaPhoto, StrapiImage,
} from '../lib/strapi';
import { hradiskaData } from '../data/hradiska';


const GOLD_GRAD = 'linear-gradient(180deg,var(--hr-accent-soft),var(--hr-accent))';
const GLASS: React.CSSProperties = {
  position: 'absolute', left: 11, right: 11, bottom: 11,
  background: 'var(--hr-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid var(--hr-glass-line)', borderRadius: 17, padding: '13px 16px',
};

/**
 * Záložná fotogaléria z `public/` — použije sa, len keď sa fotky zo Strapi
 * nepodarí načítať. Nech sekcia nikdy nezíva prázdnym miestom.
 */
const GALLERY_FALLBACK: { src: string; place?: string }[] = [
  { src: '/articles/bojna/bojna-cover.jpg', place: 'Bojná — Valy' },
  { src: '/medailon-bojna.webp' },
  { src: '/articles/bojna/bojna-od-vychodu.jpg' },
  { src: '/articles/bojna/brana.jpg' },
  { src: '/articles/bojna/bojna-09-reconstruction.jpg' },
];
const GALLERY_TILES = 5;
const FOUNDED_YEAR = 2010;

/**
 * Vyberie fotky do mriežky. Prvá dlaždica je veľká (2×2), preto na ňu ide
 * fotka na šírku; zvyšok sa rozloží rovnomerne cez celý zásobník, aby nešli
 * všetky z jedného článku.
 */
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

export interface AktualityFeedProps {
  /** Ponechané kvôli rozhraniu pôvodného feedu; v2 ťahá kroniku celú naraz. */
  initialPageSize?: number;
  showHeader?: boolean;
}

export default function AktualityFeedV2({ showHeader = true }: AktualityFeedProps) {
  const [items, setItems] = useState<KronikaItem[]>([]);
  const [intro, setIntro] = useState<KronikaItem | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'empty' | 'error'>('loading');
  const [photos, setPhotos] = useState<KronikaPhoto[]>([]);
  const [curated, setCurated] = useState<StrapiImage[]>([]);
  const [osFill, setOsFill] = useState(6); // % — poloha ukazovateľa časovej osi
  const stripRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getKronikaIntro().then(i => { if (!cancelled) setIntro(i); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  /**
   * Fotky do galérie sa ťahajú až keď sa k nej blížiš. Metadáta galérií sú
   * objemné (~280 kB) a galéria je na spodku sekcie — načítať ich hneď pri
   * otvorení domovskej stránky by bolo platenie za niečo, čo väčšina
   * návštevníkov ani neuvidí. Zlyhanie nie je fatálne: nastúpi statická záloha.
   */
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    let cancelled = false;

    /**
     * Poradie zdrojov:
     *   1. kurátorská galéria zo Strapi (single-type `domovska-galeria`) —
     *      správca určil, ktoré fotky a v akom poradí,
     *   2. automatický výber z galérií článkov, kým je kurátorská prázdna.
     */
    const load = async () => {
      const curated = await getDomovskaGaleria();
      if (cancelled) return;
      if (curated.length) { setCurated(curated); return; }
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

  // Celá kronika naraz — pás sa listuje posúvaním, nie tlačidlom.
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

  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOsFill(6 + (max > 0 ? el.scrollLeft / max : 0) * 94);
  };

  // Pripnutý úvod je hore vo vlastnej dlaždici — v páse sa nesmie zopakovať.
  const stripItems = useMemo(
    () => items.filter(it => it.slug !== KRONIKA_INTRO_SLUG),
    [items]
  );

  /**
   * Dlaždice galérie. `src` je náhľad do mriežky, `full` ide do svetelného boxu
   * (originál, nie zmenšenina). `fileId` viaže fotku na komentáre a lajky —
   * bez neho by sa panel v boxe otvoril, ale nemal by sa čoho chytiť.
   *
   * Poradie zdrojov: kurátorská galéria zo Strapi → automatický výber z článkov
   * → statická záloha z `public/`.
   */
  const galleryTiles = useMemo(() => {
    if (curated.length) {
      // Poradie z admina sa rešpektuje; režú sa až prebytočné fotky.
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

  return (
    <section className="akv2" style={{ padding: '64px 0 72px' }}>
      <style>{`
        .akv2 .akv2-top { display: grid; grid-template-columns: 1fr 1.3fr; gap: 22px; }
        .akv2 .akv2-strip { scrollbar-width: none; }
        .akv2 .akv2-strip::-webkit-scrollbar { display: none; }
        .akv2 a { text-decoration: none; }
        .akv2 .akv2-tile { transition: transform .2s ease; }
        .akv2 .akv2-tile:hover { transform: translateY(-4px); }
        .akv2 .akv2-tile img { transition: transform .5s ease; }
        .akv2 .akv2-tile:hover img { transform: scale(1.05); }
        @media (max-width: 860px) {
          .akv2 .akv2-top { grid-template-columns: 1fr; }
          /* Výšku neurčujeme — pomer strán loga platí aj tu. Strop je proti tomu,
             aby na širokom mobile v landscape zabral rám celú obrazovku. */
          .akv2 .akv2-logo { max-height: 68vh; }
          .akv2 .akv2-gal { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .akv2 .akv2-tile, .akv2 .akv2-tile img { transition: none; }
          .akv2 .akv2-tile:hover { transform: none; }
          .akv2 .akv2-tile:hover img { transform: none; }
        }
      `}</style>

      <div className="container" style={{ maxWidth: 1104 }}>
        {showHeader && (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 26 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,134,47,.12)', border: '1px solid rgba(200,134,47,.3)', borderRadius: 999, padding: '7px 16px', marginBottom: 16 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--hr-accent-soft)' }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.22em', color: 'var(--hr-accent)', whiteSpace: 'nowrap' }}>
                  KRONIKA · {FOUNDED_YEAR} — {new Date().getFullYear()}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 3.6vw, 40px)', fontWeight: 600, letterSpacing: '.06em', color: 'var(--hr-ink)', margin: 0 }}>
                Zo života združenia
              </h2>
            </div>
            <a href="/aktuality" style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.06em', color: 'var(--hr-accent-deep)', borderBottom: '1px solid var(--hr-line-quiet)', paddingBottom: 4, whiteSpace: 'nowrap' }}>
              CELÁ KRONIKA →
            </a>
          </div>
        )}

        {/* horný rad: logo + pripnutý zápis */}
        <div className="akv2-top" style={{ marginBottom: 30 }}>
          {/* Pomer dlaždice = pomer loga (900 × 886). Predtým tu bola pevná výška
              500 px, takže do stĺpca širokého ~470 px sa vošiel štvorcový obrázok
              len na šírku a hore aj dole ostal mŕtvy pás ~44 px — logo v ňom
              plávalo. S `aspect-ratio` sedí rám na obrázok pri každej šírke. */}
          <div className="akv2-logo" style={{ position: 'relative', aspectRatio: '900 / 886', alignSelf: 'start', borderRadius: 30, overflow: 'hidden', border: '1px solid var(--hr-line-soft)', background: 'radial-gradient(ellipse at 50% 38%, var(--hr-wash-1) 0%, var(--hr-wash-2) 55%, var(--hr-wash-3) 100%)', boxShadow: '0 24px 56px -26px rgba(40,26,10,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Logo má odstránený podklad (priehľadné .webp/.png). Predloha bola
                render na SVETLOSIVOM podklade (#ececec–#f2f2f2) — ten sa cez
                `mix-blend-mode: multiply` nezrušil ako biela, ale pergamen stmavil,
                takže bolo vidno sivý štvorec obrázka. Podklad je preto odstránený
                priamo v súbore (zaplavové vyplnenie od okrajov, mäkký tieň pod
                vežou ostal polopriehľadný). Žiadny blend-mode už netreba.
                Bez `padding` — pomer dlaždice sa rovná pomeru loga, takže obrázok
                sadne presne na okraje a nikde nevznikne hrana. */}
            <picture style={{ display: 'flex', width: '100%', height: '100%' }}>
              <source srcSet="/logo_hradiska_full.webp" type="image/webp" />
              <img
                src="/logo_hradiska_full.png"
                alt="Slovanské hradiská"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </picture>
          </div>

          {/* Bez pevnej výšky — riadok mriežky teraz udáva logo (jeho pomer strán)
              a tento stĺpec sa doň roztiahne sám (grid `align-items: stretch`),
              takže oba stĺpce končia v rovnakej výške pri každej šírke okna. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <a
              href={intro ? `/blog/${intro.slug}` : '/aktuality'}
              className="akv2-tile"
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, minHeight: 0, borderRadius: 26, overflow: 'hidden', background: 'linear-gradient(160deg, var(--hr-wash-6), var(--hr-wash-7))', border: '1px solid var(--hr-line-soft)', boxShadow: 'inset 0 0 0 6px rgba(255,253,248,.55), inset 0 0 0 7px var(--hr-line), 0 16px 36px -20px rgba(40,26,10,.45)', padding: '30px 36px' }}
            >
              <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--hr-ink-3)', lineHeight: 1.04, marginBottom: 12 }}>
                {intro?.title ?? 'Prečo to vlastne robím'}
              </span>
              {intro?.excerpt && (
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 17.5, fontStyle: 'italic', lineHeight: 1.5, color: 'var(--hr-body)', marginBottom: 10 }}>
                  „{intro.excerpt}“
                </span>
              )}
              {intro && (
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 14.5, color: 'var(--hr-muted)', marginBottom: 18 }}>
                  {intro.author} · {formatSkDate(intro.datum)} · {intro.readingTime} min čítania
                </span>
              )}
              <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '.08em', color: 'var(--hr-surface)', background: GOLD_GRAD, borderRadius: 999, padding: '11px 20px', boxShadow: '0 10px 24px -10px rgba(154,93,31,.7)' }}>
                ČÍTAŤ CELÉ <span style={{ fontSize: 14 }}>→</span>
              </span>
            </a>

            <div style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'var(--hr-surface)', border: '1px solid var(--hr-line)', borderRadius: 22, boxShadow: '0 10px 28px -18px rgba(60,40,15,.3)', padding: '18px 10px 16px' }}>
              {[
                { n: items.length ? String(items.length) : '—', l: 'zápisov v kronike' },
                { n: String(yearsActive), l: 'rokov činnosti' },
                { n: `${hradiskaData.length}+`, l: 'hradísk na mape' },
              ].map((s, i) => (
                <span key={s.l} style={{ textAlign: 'center', borderLeft: i === 1 ? '1px solid var(--hr-line)' : 'none', borderRight: i === 1 ? '1px solid var(--hr-line)' : 'none' }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 27, fontWeight: 600, color: 'var(--hr-accent)', lineHeight: 1 }}>{s.n}</span>
                  <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 13.5, fontStyle: 'italic', color: 'var(--hr-body-3)', marginTop: 5 }}>{s.l}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* pás zápisov z aktivít */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '.2em', color: 'var(--hr-accent)' }}>ZÁPISY Z AKTIVÍT</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--hr-muted-2)' }}>potiahnite doprava — os sa posúva s vami</span>
        </div>
        <div ref={stripRef} onScroll={onStripScroll} className="akv2-strip" style={{ display: 'flex', gap: 18, overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', padding: '6px 2px 18px' }}>
          {stripItems.map(item => (
            <a key={item.documentId} href={`/blog/${item.slug}`} className="akv2-tile" style={{ scrollSnapAlign: 'start', flex: '0 0 300px', position: 'relative', display: 'block', height: 300, borderRadius: 26, overflow: 'hidden', boxShadow: '0 16px 36px -20px rgba(40,26,10,.5)' }}>
              {item.coverUrl ? (
                <img src={item.coverUrl} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                /* 42 z 80 zápisov kroniky obálku nemá (staršie oznamy — 2 % z daní,
                   ankety, pozvánky). Namiesto prázdneho pergamenu tam ide logo.
                   `paddingBottom` drží logo nad sklenenou pätkou s názvom, aby sa
                   nápis v logu neprekrýval s titulkom zápisu. */
                <span style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, var(--hr-wash-4) 0%, var(--hr-wash-5) 55%, var(--hr-on-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 96 }}>
                  <picture style={{ display: 'contents' }}>
                    <source srcSet="/logo_hradiska_small.webp" type="image/webp" />
                    <img
                      src="/logo_hradiska_small.png"
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      style={{ width: '62%', maxHeight: '100%', objectFit: 'contain', opacity: 0.92 }}
                    />
                  </picture>
                </span>
              )}
              <span style={GLASS}>
                <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '.12em', color: 'var(--hr-on-photo-3)', marginBottom: 4, textTransform: 'uppercase' }}>
                  {formatSkDate(item.datum)} · {item.readingTime} min
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 19, fontWeight: 700, color: 'var(--hr-on-photo)', lineHeight: 1.1 }}>
                  {item.title}
                </span>
              </span>
            </a>
          ))}
        </div>

        {/* časová os prepojená so scrollom */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0 36px' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--hr-accent-deep)', flexShrink: 0, marginRight: 20 }}>{yearNewest}</span>
          <div style={{ flex: 1, position: 'relative', height: 6, borderRadius: 999, background: 'var(--hr-accent-border)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(90deg,var(--hr-accent-soft),var(--hr-accent-deep))', width: `${osFill}%`, transition: 'width .12s linear' }} />
            <div style={{ position: 'absolute', top: '50%', left: `${osFill}%`, transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: 999, background: 'var(--hr-surface)', border: '2px solid var(--hr-accent-soft)', boxShadow: '0 4px 10px rgba(60,40,15,.3)', transition: 'left .12s linear' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--hr-muted-2)', flexShrink: 0, marginLeft: 20 }}>{yearOldest}</span>
        </div>

        {/* vybraná fotogaléria */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '.2em', color: 'var(--hr-accent)' }}>VYBRANÁ FOTOGALÉRIA</span>
          <a href="/galeria" style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '.06em', color: 'var(--hr-accent-deep)', borderBottom: '1px solid var(--hr-line-quiet)', paddingBottom: 3, whiteSpace: 'nowrap' }}>CELÁ GALÉRIA →</a>
        </div>
        <div ref={galleryRef} className="akv2-gal" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 158, gap: 14 }}>
          {/* Ukážka vedie do galérie — samotné prezeranie fotiek patrí tam,
              nie na domovskú stránku. */}
          {galleryTiles.map((g, i) => (
            <a
              key={g.src}
              href="/galeria"
              className="akv2-tile"
              style={{ position: 'relative', display: 'block', borderRadius: i === 0 ? 26 : 20, overflow: 'hidden', boxShadow: '0 12px 28px -18px rgba(40,26,10,.5)', gridColumn: i === 0 ? 'span 2' : undefined, gridRow: i === 0 ? 'span 2' : undefined }}
            >
              <img src={g.src} alt={g.alt} loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {g.place && (
                <span style={{ position: 'absolute', left: 14, right: 14, bottom: 12, fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--hr-on-photo-2)', background: 'rgba(28,21,16,.55)', borderRadius: 8, padding: '4px 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', display: 'block' }}>◍ {g.place}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
