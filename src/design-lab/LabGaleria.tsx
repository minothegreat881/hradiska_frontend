'use client';

/**
 * Fotoarchív v šate Pečať.
 *
 * PREČO NIE MRIEŽKA ŠTVORCOV. Doterajšia galéria orezávala každú snímku na
 * 4:3. Fotografie z výskumu ale nemajú jeden tvar: pohľad na val je široký,
 * profil sondy vysoký, nález na štvorčekovom papieri takmer štvorec. Orezanie
 * na spoločný pomer z nich robí vzorkovník, nie archív. Tu si každá drží
 * vlastné proporcie a mriežka z toho dostane nepravidelný rytmus, aký má
 * skutočný hárok s kontaktnými kópiami.
 *
 * PREČO ČLENENIE PO ČLÁNKOCH. Nie je to ozdoba: fotky do archívu prichádzajú
 * z článkov o konkrétnych lokalitách a výpravách, takže názov článku je
 * pravdivá informácia o pôvode snímky — a zároveň jediný spôsob, ako sa
 * v tisícke fotografií zorientovať. Rovnaké členenie preto nesie aj filter.
 *
 * ČO SI BERIE Z PRODUKCIE. Načítanie (`getGalleryPhotos`) aj prezeranie
 * (`Lightbox`) sú spoločné s ostrou stránkou — nová je len skladba a šat.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbox, type GalleryImage } from '../components/HistoricalGallery';
import { getGalleryPhotos, type KronikaPhoto } from '../lib/strapi';

const NA_STRANU = 24;
/** Koľko článkov ponúknuť ako filter. Viac by z lišty spravilo zoznam. */
const FILTROV = 8;

export function LabGaleria() {
  const [photos, setPhotos] = useState<KronikaPhoto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openAt, setOpenAt] = useState<number | null>(null);
  /* Filter žije v adrese — dá sa poslať odkazom a späť funguje. */
  const [filter, setFilter] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('z'));

  const nacitaj = useCallback(async (dalsia: number) => {
    setBusy(true);
    try {
      const { photos: nove, hasMore: viac } = await getGalleryPhotos({ page: dalsia, pageSize: NA_STRANU });
      setPhotos(p => (dalsia === 1 ? nove : [...p, ...nove]));
      setHasMore(viac);
      setPage(dalsia);
      setError('');
    } catch {
      setError('Fotografie sa nepodarilo načítať. Skúste to prosím o chvíľu znova.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void nacitaj(1); }, [nacitaj]);

  /* Došahovanie ďalších strán, keď sa človek priblíži ku koncu. Tlačidlo
     ostáva pod tým — bez neho by sa klávesnicou k ďalším fotkám nedalo
     dostať vôbec. */
  const koniec = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = koniec.current;
    if (!el || !hasMore || busy) return;
    const io = new IntersectionObserver(([z]) => { if (z.isIntersecting) void nacitaj(page + 1); }, { rootMargin: '600px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, busy, page, nacitaj]);

  /* Zoskupenie po článkoch v poradí, v akom fotky prišli. */
  const skupiny = useMemo(() => {
    const m = new Map<string, { nazov: string; slug: string; fotky: KronikaPhoto[] }>();
    for (const f of photos) {
      const kluc = f.postSlug || f.postTitle || 'ine';
      if (!m.has(kluc)) m.set(kluc, { nazov: f.postTitle || 'Bez zaradenia', slug: f.postSlug, fotky: [] });
      m.get(kluc)!.fotky.push(f);
    }
    /* Zoradené podľa bohatosti, nie podľa poradia z databázy. Inak archív
       otvára článok s jedinou snímkou a hárok pôsobí prázdno; takto sa
       začína najlepšie zdokumentovanou výpravou, čo je aj pravdivý údaj —
       o tej lokalite máme najviac. */
    return [...m.values()].sort((a, b) => b.fotky.length - a.fotky.length);
  }, [photos]);

  const ponukaFiltrov = useMemo(
    () => [...skupiny].sort((a, b) => b.fotky.length - a.fotky.length).slice(0, FILTROV),
    [skupiny]);

  const zobrazene = filter ? skupiny.filter(s => s.slug === filter) : skupiny;
  /* Lightbox potrebuje plochý zoznam presne v poradí, v akom sa kreslí. */
  const ploche = useMemo(() => zobrazene.flatMap(s => s.fotky), [zobrazene]);
  const doLightboxu: GalleryImage[] = ploche.map(f => ({
    url: f.url, caption: f.caption || f.alt, alt: f.alt, fileId: f.fileId, source: f.postTitle,
  }));

  /* Hlavička skupiny sa lepí POD to, čo je nad ňou. Odstup sa nedá napísať
     natvrdo: v laboratóriu je nad stránkou ešte lišta na prepínanie šiat,
     v produkcii len navigácia, a obe menia výšku podľa šírky okna. Preto sa
     meria. */
  const koren = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const zmeraj = () => {
      let odstup = 0;
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        if (el.contains(koren.current)) continue;
        const cs = getComputedStyle(el);
        if ((cs.position === 'sticky' || cs.position === 'fixed') && el.getBoundingClientRect().top <= 1) {
          odstup = Math.max(odstup, el.getBoundingClientRect().height);
        }
      }
      koren.current?.style.setProperty('--lgal-lep', `${Math.round(odstup)}px`);
    };
    zmeraj();
    window.addEventListener('resize', zmeraj);
    const t = window.setTimeout(zmeraj, 800);
    return () => { window.removeEventListener('resize', zmeraj); window.clearTimeout(t); };
  }, []);

  const prepniFilter = (slug: string | null) => {
    setFilter(slug);
    const u = new URL(window.location.href);
    if (slug) u.searchParams.set('z', slug); else u.searchParams.delete('z');
    window.history.replaceState(null, '', u.toString());
  };

  return (
    <div className="lgal" ref={koren}>
      <div className="container lgal-in">

        <nav aria-label="Omrvinky" className="lgal-omrvinky">
          <ol>
            <li><a href="/">Domov</a></li>
            <li aria-hidden="true">·</li>
            <li>Fotoarchív</li>
          </ol>
        </nav>

        <header className="lgal-hlava">
          <span className="lgal-eyebrow"><span aria-hidden="true" /> Zbierka · 03</span>
          <h1 className="lgal-titul">Fotoarchív</h1>
          <p className="lgal-lead">
            Snímky z hradísk, výprav a nálezov — tak, ako prišli k jednotlivým článkom.
          </p>
          {photos.length > 0 && (
            <p className="lgal-suhrn">
              <b>{photos.length}</b> fotografií · <b>{skupiny.length}</b> {skupiny.length === 1 ? 'článok' : skupiny.length < 5 ? 'články' : 'článkov'}
            </p>
          )}
        </header>

        {ponukaFiltrov.length > 1 && (
          <div className="lgal-filter" role="group" aria-label="Zúžiť podľa článku">
            <button type="button" className={filter ? undefined : 'is-on'} onClick={() => prepniFilter(null)}>
              Všetko
            </button>
            {ponukaFiltrov.map(s => (
              <button
                key={s.slug}
                type="button"
                className={filter === s.slug ? 'is-on' : undefined}
                onClick={() => prepniFilter(s.slug)}
              >
                {s.nazov}<span className="lgal-pocet">{s.fotky.length}</span>
              </button>
            ))}
          </div>
        )}

        {error && <div role="alert" className="lgal-chyba">{error}</div>}

        {zobrazene.map(s => (
          <section key={s.slug} className="lgal-skupina">
            <div className="lgal-skupina-h">
              <h2>{s.nazov}</h2>
              <span className="lgal-skupina-n">{String(s.fotky.length).padStart(2, '0')}</span>
              {s.slug && <a className="lgal-skupina-o" href={`/blog/${s.slug}`}>Čítať článok <span aria-hidden="true">→</span></a>}
            </div>

            <div className="lgal-hark">
              {s.fotky.map((f) => {
                const i = ploche.indexOf(f);
                return (
                  <button
                    key={f.url + i}
                    type="button"
                    className="lgal-plat"
                    onClick={() => setOpenAt(i)}
                    aria-label={`Otvoriť fotografiu${f.caption ? ` — ${f.caption}` : ''}`}
                  >
                    <img
                      src={f.thumb}
                      alt={f.alt || ''}
                      width={f.width || undefined}
                      height={f.height || undefined}
                      loading="lazy"
                      decoding="async"
                      style={{ aspectRatio: f.width && f.height ? `${f.width} / ${f.height}` : '4 / 3' }}
                    />
                    {(f.caption || f.alt) && <span className="lgal-popis">{f.caption || f.alt}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        ))}

        {busy && (
          /* Kostry namiesto točiaceho kolieska — obrazovka si tým udrží tvar
             a nepreskočí, keď fotky doskočia. */
          <div className="lgal-hark" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="lgal-kostra" style={{ aspectRatio: ['4 / 3', '3 / 4', '1 / 1'][i % 3] }} />
            ))}
          </div>
        )}

        {!busy && photos.length === 0 && !error && (
          <p className="lgal-prazdno">Zatiaľ tu nie je ani jedna fotografia.</p>
        )}

        <div ref={koniec} />

        {hasMore && !busy && (
          <div className="lgal-viac">
            <button type="button" onClick={() => void nacitaj(page + 1)}>Načítať ďalšie</button>
          </div>
        )}
        {!hasMore && photos.length > 0 && (
          <p className="lgal-koniec" aria-hidden="true">— koniec zbierky —</p>
        )}
      </div>

      {openAt !== null && doLightboxu[openAt] && (
        <Lightbox
          images={doLightboxu}
          index={openAt}
          onClose={() => setOpenAt(null)}
          onPrev={() => setOpenAt(i => (i === null ? null : (i - 1 + doLightboxu.length) % doLightboxu.length))}
          onNext={() => setOpenAt(i => (i === null ? null : (i + 1) % doLightboxu.length))}
        />
      )}
    </div>
  );
}

export default LabGaleria;
