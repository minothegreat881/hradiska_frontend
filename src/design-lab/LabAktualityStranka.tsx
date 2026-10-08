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
import { poSlovensky, poAnglicky, odkaz, t } from '../lib/jazyk';
import { ArticleCard } from '../components/ArticleCard';
import { Nacitavanie } from './Nacitavanie';
import { getKronikaAll, getCategoryPostCounts, type KronikaItem } from '../lib/strapi';
import { CINNOSTI, cinnostZapisu, type KlucCinnosti } from '../data/cinnost';
import { LabCinnost } from './LabCinnost';
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
    /* Skok na ZOZNAM, nie na začiatok stránky. Dlaždice zaberajú na telefóne
       celé okno, takže po výbere témy bolo vidieť zasa len ich a zúžený
       zoznam ostal pod nimi — klepnutie potom vyzeralo, že nič neurobilo.
       Čaká sa na prekreslenie, inak sa meria ešte starý rozvrh. */
    /* Hore na hlavičku: pri zvolenej téme je tam jej názov a hneď pod ním
       články, takže je na prvý pohľad vidieť, kam sa človek dostal. */
    requestAnimationFrame(() => {
      document.querySelector('.lakt-hlava')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const zvolena = CINNOSTI.find((c) => c.kluc === vybrana) || null;

  return (
    <div className="lakt">
      <div className="container lakt-in">

        <nav aria-label="Omrvinky" className="lgal-omrvinky">
          <ol>
            <li><a href={odkaz('/')}>{t('Domov')}</a></li>
            <li aria-hidden="true">·</li>
            {zvolena ? (
              <>
                <li><a href={odkaz('/aktuality')}>{t('Kronika združenia')}</a></li>
                <li aria-hidden="true">·</li>
                <li aria-current="page">{t(zvolena.nazov)}</li>
              </>
            ) : (
              <li aria-current="page">{t('Kronika združenia')}</li>
            )}
          </ol>
        </nav>

        {/* Hlavička v reči kategórií: značka, názov, podtitul, počet. Pri
            zvolenej činnosti hovorí o nej — stránka je vtedy stránkou témy,
            nie kronikou so skrytými zápismi. */}
        <header className="lakt-hlava">
          <span className="lakt-znacka">{zvolena ? t('ČINNOSŤ') : t('KRONIKA')}</span>
          <h1 className="lakt-titul">{zvolena ? t(zvolena.nazov) : t('Zo života združenia')}</h1>
          <p className="lakt-lead">
            {zvolena ? t(zvolena.popis) : t('Výpravy, obnovy tabúľ, prednášky a nálezy.')}
          </p>
          {zvolena ? (
            vybrane.length > 0 && (
              <p className="lakt-suhrn">
                <b>{vybrane.length}</b>{' '}
                {poSlovensky()
                  ? (vybrane.length === 1 ? 'článok' : vybrane.length < 5 ? 'články' : 'článkov')
                  : t(vybrane.length === 1 ? 'článok' : 'článkov')}
                {' · '}
                <a href={odkaz('/aktuality')} onClick={(e) => { e.preventDefault(); prepni(null); }}>
                  {t('Celá kronika')}
                </a>
              </p>
            )
          ) : (
            zaznamy.length > 0 && (
              <p className="lakt-suhrn">
                <b>{zaznamy.length}</b> {t('zápisov')} · <b>{roky.length}</b>{' '}
                {poSlovensky()
                  ? (roky.length === 1 ? 'rok' : roky.length < 5 ? 'roky' : 'rokov')
                  : t(roky.length === 1 ? 'rok' : 'rokov')}
              </p>
            )
          )}
        </header>

        {/* Dlaždice činnosti stoja nad kronikou; pri zvolenej téme idú dole
            pod články — hore je vtedy hlavička témy a hneď za ňou články,
            tak ako na stránke kategórie. */}
        {!zvolena && (
          <LabCinnost
            pocty={pocty}
            poctyKategorii={poctyKategorii}
            vybrana={vybrana}
            onVyber={prepni}
          />
        )}

        {chyba && <div role="alert" className="lgal-chyba">{chyba}</div>}

        {/* ČLÁNKY TÉMY — jedna mriežka pod spoločným nadpisom. Hlavičky rokov
            by z deviatich článkov spravili osem skupín po jednom. */}
        {zvolena ? (
          <div className="lakt-mriezka lakt-mriezka--tema">
            {vybrane.map(z => <ArticleCard key={z.documentId} article={naKartu(z)} stitok={false} />)}
          </div>
        ) : (
          roky.map(([rok, polozky]) => (
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
          ))
        )}

        {/* Prepnutie na inú činnosť — na konci, ako rozcestník. */}
        {zvolena && !busy && (
          <LabCinnost
            pocty={pocty}
            poctyKategorii={poctyKategorii}
            vybrana={vybrana}
            onVyber={prepni}
            tichy
          />
        )}

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
