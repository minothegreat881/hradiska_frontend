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
 * Rozdiel oproti kategórii je jediný a je vecný: aktuality sú zoradené podľa
 * dátumu a členia sa po ROKOCH. Pri kronike združenia je rok podstatná
 * informácia — pri kategórii lokalít by bol ozdoba.
 */

import { useEffect, useMemo, useState } from 'react';
import { ArticleCard } from '../components/ArticleCard';
import { getKronika, type KronikaItem } from '../lib/strapi';
import type { Article } from '../data/mock-data';

const NA_STRANU = 24;

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

export function LabAktualityStranka() {
  const [zaznamy, setZaznamy] = useState<KronikaItem[]>([]);
  const [strana, setStrana] = useState(0);
  const [este, setEste] = useState(true);
  const [busy, setBusy] = useState(false);
  const [chyba, setChyba] = useState('');

  const nacitaj = async (dalsia: number) => {
    setBusy(true);
    try {
      const { items, pagination } = await getKronika({ page: dalsia, pageSize: NA_STRANU, sort: 'novinky' });
      setZaznamy(z => (dalsia === 1 ? items : [...z, ...items]));
      setEste(pagination ? pagination.page < pagination.pageCount : false);
      setStrana(dalsia);
      setChyba('');
    } catch {
      setChyba('Zápisy sa nepodarilo načítať. Skúste to prosím o chvíľu znova.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { void nacitaj(1); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  /* Členenie po rokoch. Pri kronike je rok vecný údaj — hovorí, ako dlho
     združenie pracuje a kedy bolo najviac práce v teréne. */
  const roky = useMemo(() => {
    const m = new Map<string, KronikaItem[]>();
    for (const z of zaznamy) {
      const r = z.datum ? String(new Date(z.datum).getFullYear()) : 'bez dátumu';
      if (!m.has(r)) m.set(r, []);
      m.get(r)!.push(z);
    }
    return [...m.entries()];
  }, [zaznamy]);

  return (
    <div className="lakt">
      <div className="container lakt-in">

        <nav aria-label="Omrvinky" className="lgal-omrvinky">
          <ol>
            <li><a href="/">Domov</a></li>
            <li aria-hidden="true">·</li>
            <li>Kronika združenia</li>
          </ol>
        </nav>

        {/* Hlavička v reči kategórií: značka, názov, podtitul, počet. */}
        <header className="lakt-hlava">
          <span className="lakt-znacka">Kronika</span>
          <h1 className="lakt-titul">Zo života združenia</h1>
          <p className="lakt-lead">
            Výpravy, obnovy tabúľ, prednášky a nálezy.
          </p>
          {zaznamy.length > 0 && (
            <p className="lakt-suhrn">
              <b>{zaznamy.length}</b> zápisov · <b>{roky.length}</b> {roky.length === 1 ? 'rok' : roky.length < 5 ? 'roky' : 'rokov'}
            </p>
          )}
        </header>

        {chyba && <div role="alert" className="lgal-chyba">{chyba}</div>}

        {roky.map(([rok, polozky]) => (
          <section key={rok} className="lakt-rok">
            <div className="lakt-rok-h">
              <h2>{rok}</h2>
              <span className="lakt-rok-n">{String(polozky.length).padStart(2, '0')}</span>
              <span className="lakt-rok-ciara" aria-hidden="true" />
            </div>
            <div className="lakt-mriezka">
              {polozky.map(z => <ArticleCard key={z.documentId} article={naKartu(z)} />)}
            </div>
          </section>
        ))}

        {busy && <p className="lgal-prazdno">Načítavam…</p>}
        {!busy && zaznamy.length === 0 && !chyba && (
          <p className="lgal-prazdno">Zatiaľ tu nie je ani jeden zápis.</p>
        )}

        {este && !busy && (
          <div className="lgal-viac">
            <button type="button" onClick={() => void nacitaj(strana + 1)}>Staršie zápisy</button>
          </div>
        )}
        {!este && zaznamy.length > 0 && <p className="lgal-koniec" aria-hidden="true">— začiatok kroniky —</p>}
      </div>
    </div>
  );
}

export default LabAktualityStranka;
