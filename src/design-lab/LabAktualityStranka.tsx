'use client';

/**
 * Aktuality ako STRÁNKA — v tej istej reči ako kategórie.
 *
 * ČO NAHRÁDZA. Doterajšie aktuality boli nástenka v štýle sociálnej siete:
 * avatar združenia, „Zobraziť viac", reakcie, zdieľanie. Encyklopédia takto
 * nehovorí nikde inde a s pečatným šatom to nemá nič spoločné — je to zvyšok
 * konceptu, ktorý sa neujal.
 *
 * ČÍM SA NAHRÁDZA. Presne tým, čo už na webe funguje pre podkategórie:
 * hlavička s názvom a počtom, potom mriežka kariet. Karty sú TIE ISTÉ
 * (`ArticleCard`), aké nesie kategória, takže sa aktuality prestanú tváriť
 * ako iný web a človek v nich hľadá to isté, čo inde.
 *
 * DVA POHĽADY NA TIE ISTÉ ZÁPISY. Podľa rokov — pri kronike je rok vecný
 * údaj, hovorí, ako dlho združenie pracuje a kedy bolo najviac práce
 * v teréne. A podľa ČINNOSTI (`data/cinnost.ts`): rok sám nepovie, čo
 * združenie robí, lebo zápis o tabuli leží medzi pozvánkou na festival
 * a výzvou na 2 %. Dlaždice činností stoja nad kronikou a zúžia ju na jednu
 * tému; voľba žije v adrese (`?cinnost=`), takže sa dá poslať odkazom.
 *
 * Celá kronika sa ťahá naraz (80 zápisov, ~120 kB obálok). Bez toho by
 * počty pri dlaždiciach platili len pre prvú stranu a filter by siahal iba
 * na to, čo je práve načítané.
 */

import { useEffect, useMemo, useState } from 'react';
import { poAnglicky, odkaz, t } from '../lib/jazyk';
import { ArticleCard } from '../components/ArticleCard';
import { Nacitavanie } from './Nacitavanie';
import { getKronikaAll, getCategoryPostCounts, type KronikaItem } from '../lib/strapi';
import { CINNOSTI, cinnostZapisu, type KlucCinnosti } from '../data/cinnost';
import { variant } from '../data/categories';
import { zakladStrapi } from '../data/rozcestnik';
import type { Article } from '../data/mock-data';

/** Zápis z kroniky do tvaru, ktorému rozumie karta článku. */
function naKartu(k: KronikaItem): Article {
  return {
    id: k.documentId,
    slug: k.slug,
    title: k.title,
    excerpt: k.excerpt,
    content: '',
    coverImage: k.coverUrl || '',
    author: { name: k.author, avatar: '' },
    publishedAt: k.datum,
    readTime: k.readingTime,
    tags: [],
    category: 'aktuality',
  };
}

/** Voľba z adresy. Neznámy kľúč sa ticho ignoruje. */
function cinnostZAdresy(): KlucCinnosti | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('cinnost');
  return CINNOSTI.some((c) => c.kluc === v) ? (v as KlucCinnosti) : null;
}

export function LabAktualityStranka() {
  const [zaznamy, setZaznamy] = useState<KronikaItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [chyba, setChyba] = useState('');
  const [vybrana, setVybrana] = useState<KlucCinnosti | null>(cinnostZAdresy);
  /* Počty pri dlaždiciach, ktoré vedú do vlastnej kategórie (tabule, 3D). */
  const [poctyKategorii, setPoctyKategorii] = useState<Record<string, number>>({});

  useEffect(() => {
    let zrusene = false;
    getKronikaAll('desc')
      .then((items) => { if (!zrusene) { setZaznamy(items); setChyba(''); } })
      .catch(() => { if (!zrusene) setChyba(t('Zápisy sa nepodarilo načítať. Skúste to prosím o chvíľu znova.')); })
      .finally(() => { if (!zrusene) setBusy(false); });

    const sKategoriou = CINNOSTI.map((c) => c.kategoria).filter((s): s is string => !!s);
    getCategoryPostCounts(sKategoriou)
      .then((p) => { if (!zrusene) setPoctyKategorii(p); })
      .catch(() => { /* dlaždica ostane bez čísla, nie s nulou */ });

    /* Tlačidlo „späť" musí prepnúť aj výber činnosti — je v adrese. */
    const naSpat = () => setVybrana(cinnostZAdresy());
    window.addEventListener('popstate', naSpat);
    return () => { zrusene = true; window.removeEventListener('popstate', naSpat); };
  }, []);

  /* Zaradenie sa počíta raz pre celú kroniku — nie pri každom prekreslení
     mriežky. */
  const temy = useMemo(() => {
    const m = new Map<string, KlucCinnosti | null>();
    for (const z of zaznamy) m.set(z.slug, cinnostZapisu(z.slug, z.title));
    return m;
  }, [zaznamy]);

  const pocty = useMemo(() => {
    const p: Partial<Record<KlucCinnosti, number>> = {};
    for (const k of temy.values()) if (k) p[k] = (p[k] || 0) + 1;
    return p;
  }, [temy]);

  const vybrane = useMemo(
    () => (vybrana ? zaznamy.filter((z) => temy.get(z.slug) === vybrana) : zaznamy),
    [zaznamy, temy, vybrana]);

  const roky = useMemo(() => {
    const m = new Map<string, KronikaItem[]>();
    for (const z of vybrane) {
      const r = z.datum ? String(new Date(z.datum).getFullYear()) : t('bez dátumu');
      if (!m.has(r)) m.set(r, []);
      m.get(r)!.push(z);
    }
    return [...m.entries()];
  }, [vybrane]);

  const prepni = (k: KlucCinnosti | null) => {
    setVybrana(k);
    const u = new URL(window.location.href);
    if (k) u.searchParams.set('cinnost', k); else u.searchParams.delete('cinnost');
    window.history.pushState(null, '', u.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const zvolena = CINNOSTI.find((c) => c.kluc === vybrana) || null;
  const zaklad = zakladStrapi();

  return (
    <div className="lakt">
      <div className="container lakt-in">

        <nav aria-label="Omrvinky" className="lgal-omrvinky">
          <ol>
            <li><a href={odkaz('/')}>{t('Domov')}</a></li>
            <li aria-hidden="true">·</li>
            <li>{t('Kronika združenia')}</li>
          </ol>
        </nav>

        {/* Hlavička v reči kategórií: značka, názov, podtitul, počet. */}
        <header className="lakt-hlava">
          <span className="lakt-znacka">{t('KRONIKA')}</span>
          <h1 className="lakt-titul">{t('Zo života združenia')}</h1>
          <p className="lakt-lead">
            {t('Výpravy, obnovy tabúľ, prednášky a nálezy.')}
          </p>
          {zaznamy.length > 0 && (
            <p className="lakt-suhrn">
              <b>{zaznamy.length}</b> {t('zápisov')} · <b>{roky.length}</b>{' '}
              {poAnglicky()
                ? t(roky.length === 1 ? 'rok' : 'rokov')
                : (roky.length === 1 ? 'rok' : roky.length < 5 ? 'roky' : 'rokov')}
            </p>
          )}
        </header>

        {/* ── Činnosť združenia ──────────────────────────────────────────
            Dlaždice nad kronikou. Tie, čo majú vlastnú kategóriu, vedú do
            nej; ostatné zúžia kroniku pod sebou. */}
        <section className="lcin" aria-label={t('Činnosť združenia')}>
          <div className="lcin-h">
            <h2>{t('Čo združenie robí')}</h2>
            <span className="lcin-ciara" aria-hidden="true" />
          </div>
          <div className="lcin-rad">
            {CINNOSTI.map((c) => {
              const pocet = c.kategoria ? poctyKategorii[c.kategoria] : pocty[c.kluc];
              const obrazok = c.vlastny ? c.obrazok : `${zaklad}${variant(c.obrazok, 'small')}`;
              const obsah = (
                <>
                  <span className={c.vlastny ? 'lcin-ram lcin-ram--znak' : 'lcin-ram'}>
                    <img src={obrazok} alt="" loading="lazy" decoding="async" />
                  </span>
                  <span className="lcin-text">
                    <span className="lcin-nazov">{t(c.nazov)}</span>
                    {typeof pocet === 'number' && pocet > 0 && <span className="lcin-pocet">{pocet}</span>}
                  </span>
                  <span className="lcin-popis">{t(c.popis)}</span>
                </>
              );
              /* Tabule a 3D rekonštrukcie nie sú zápisy kroniky, ale vlastná
                 kategória — dlaždica preto vedie tam, nie do filtra. */
              return c.kategoria ? (
                <a key={c.kluc} className="lcin-dlazdica" href={odkaz(`/category/${c.kategoria}`)}>{obsah}</a>
              ) : (
                <button
                  key={c.kluc}
                  type="button"
                  className={vybrana === c.kluc ? 'lcin-dlazdica is-on' : 'lcin-dlazdica'}
                  aria-pressed={vybrana === c.kluc}
                  onClick={() => prepni(vybrana === c.kluc ? null : c.kluc)}
                >
                  {obsah}
                </button>
              );
            })}
          </div>
        </section>

        {zvolena && (
          <div className="lcin-vyber">
            <p>
              <b>{vybrane.length}</b>{' '}
              {t('zápisov v téme')} <b>{t(zvolena.nazov)}</b>
            </p>
            <button type="button" onClick={() => prepni(null)}>{t('Celá kronika')} ×</button>
          </div>
        )}

        {chyba && <div role="alert" className="lgal-chyba">{chyba}</div>}

        {roky.map(([rok, polozky]) => (
          <section key={rok} className="lakt-rok">
            <div className="lakt-rok-h">
              <h2>{rok}</h2>
              <span className="lakt-rok-n">{String(polozky.length).padStart(2, '0')}</span>
              <span className="lakt-rok-ciara" aria-hidden="true" />
            </div>
            <div className="lakt-mriezka">
              {polozky.map(z => <ArticleCard key={z.documentId} article={naKartu(z)} stitok={false} />)}
            </div>
          </section>
        ))}

        {busy && <Nacitavanie text={t('Načítavam…')} />}
        {!busy && zaznamy.length === 0 && !chyba && (
          <p className="lgal-prazdno">{t('Zatiaľ tu nie je ani jeden zápis.')}</p>
        )}
        {!busy && zaznamy.length > 0 && !vybrana && (
          <p className="lgal-koniec" aria-hidden="true">— {t('začiatok kroniky')} —</p>
        )}
      </div>
    </div>
  );
}

export default LabAktualityStranka;
