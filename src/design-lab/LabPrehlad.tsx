'use client';

/**
 * Prehľad kategórií — obsah mega-ponuky (PC) a rozbalenej kategórie (telefón).
 *
 * ČO RIEŠI. Roletka pod kategóriou dovtedy vypísala články pod sebou v poradí,
 * v akom prišli z databázy. Pri 41 lokalitách strážnej funkcie to bol stĺpec,
 * v ktorom sa nedalo nič nájsť: človek hľadá „niečo pri nás" alebo „niečo
 * z Veľkej Moravy", nie 27. položku odspodu.
 *
 * ČÍM. Tie isté lokality zoskupené podľa kraja, datovania alebo abecedy.
 * Zoskupenie je jedno pre celý prehľad — kto si raz zvolí kraje, ostane pri
 * nich aj po prepnutí kategórie.
 *
 * ODKIAĽ SÚ ÚDAJE. Kraj, okres a datovanie v databáze neboli. Určili sa
 * z textov článkov (viď `scripts/lokality-zluc.mjs`) a ležia v
 * `src/data/lokality.json`. Kategórie bez lokalít — aktuality, modely,
 * pramene — zoskupovať nemajú čo; tie dostanú iba abecedný zoznam článkov.
 *
 * V prehľade sú VŠETKY články kategórie, nie iba lokality. Čo lokalitou nie
 * je, ide do samostatnej skupiny na koniec — pri povestiach bola inak vidieť
 * jediná, ktorá má súradnice, a zvyšných štrnásť sa dalo nájsť len cez
 * „Zobraziť všetky".
 */

import { useEffect, useMemo, useState } from 'react';
import lokalityData from '../data/lokality.json';
import { getSearchIndex, type IndexDoc } from '../lib/searchIndex';
import type { NavigationItem } from '../data/navigation-structure';

export interface Lokalita {
  slug: string;
  nazov: string;
  kategoria: string;
  kategoriaSlug: string | null;
  miesto: string;
  okres: string | null;
  kraj: string;
  lat: number;
  lng: number;
  datovanie_text: string | null;
  datovanie_skupina: string | null;
}

const LOKALITY = lokalityData as Lokalita[];

export type Zoskupenie = 'kraj' | 'datovanie' | 'az';

/** Kraje v poradí od západu na východ — tak, ako po nich ide oko po mape. */
const KRAJE = [
  'Bratislavský', 'Trnavský', 'Trenčiansky', 'Nitriansky', 'Žilinský',
  'Banskobystrický', 'Prešovský', 'Košický', 'Mimo Slovenska',
];

/** Datovanie chronologicky, nie abecedne — inak by pravek skončil za rímskou. */
const OBDOBIA = [
  'Pravek', 'Doba bronzová', 'Doba halštatská', 'Doba laténska', 'Doba rímska',
  '6.–7. storočie', '8.–9. storočie', '9. storočie', '9.–10. storočie',
  '10.–11. storočie', '11.–13. storočie',
];

const BEZ_UDAJA = 'Bez udania';
/* Články, ktoré nie sú lokality — nemajú kraj ani datovanie. Nezmiznú,
   len idú nabok: v prehľade majú byť VŠETKY články kategórie, nie iba tie,
   ktoré prešli našimi kritériami. */
const OSTATNE = 'Ostatné články';

export interface Skupina {
  nazov: string;
  polozky: { slug: string; nazov: string; meta: string }[];
}

const podlaAbecedy = (a: string, b: string) => a.localeCompare(b, 'sk');

/** Meta riadok položky: okres a datovanie. Keď okres chýba, nastúpi miesto. */
const meta = (l: Lokalita) =>
  [l.okres || l.miesto, l.datovanie_text].filter(Boolean).join(' · ');

/**
 * Rozdelí lokality do skupín. Prázdne skupiny sa nevracajú — číselník má
 * jedenásť období a väčšina kategórií ich naplní tri.
 *
 * `stlpcov` je počet stĺpcov, do ktorých sa zoznam bude sádzať: pri abecede
 * sa podľa neho zoznam rozseká na bloky s rozsahom písmen („B – D"). Na
 * telefóne je stĺpec jeden, takže ostane jediná skupina „A – Z".
 */
export function zoskup(
  lokality: Lokalita[],
  rezim: Zoskupenie,
  stlpcov = 1,
  ostatne: { slug: string; nazov: string; meta: string }[] = [],
): Skupina[] {
  const zoradene = [...lokality].sort((a, b) => podlaAbecedy(a.nazov, b.nazov));

  /* V abecede sa nič nevyčleňuje — písmeno má aj článok bez lokality, takže
     zoznam je jeden a úplný. */
  if (rezim === 'az') {
    const vsetko = [...zoradene.map(naPolozku), ...ostatne]
      .sort((a, b) => podlaAbecedy(a.nazov, b.nazov));
    if (!vsetko.length) return [];
    if (stlpcov <= 1 || vsetko.length < stlpcov * 3) {
      return [{ nazov: 'A – Z', polozky: vsetko }];
    }
    const naBlok = Math.ceil(vsetko.length / stlpcov);
    const von: Skupina[] = [];
    for (let i = 0; i < vsetko.length; i += naBlok) {
      const kus = vsetko.slice(i, i + naBlok);
      const od = pismeno(kus[0].nazov), po = pismeno(kus[kus.length - 1].nazov);
      von.push({ nazov: od === po ? od : `${od} – ${po}`, polozky: kus });
    }
    return von;
  }

  const poradie = rezim === 'kraj' ? KRAJE : OBDOBIA;
  const kluc = (l: Lokalita) =>
    (rezim === 'kraj' ? l.kraj : l.datovanie_skupina) || BEZ_UDAJA;

  const koše = new Map<string, Lokalita[]>();
  for (const l of zoradene) {
    const k = kluc(l);
    if (!koše.has(k)) koše.set(k, []);
    koše.get(k)!.push(l);
  }

  const von: Skupina[] = [];
  for (const nazov of poradie) {
    const kus = koše.get(nazov);
    if (kus?.length) von.push({ nazov, polozky: kus.map(naPolozku) });
  }
  /* „Bez udania" ide vždy na koniec — je to zvyšok, nie obdobie. */
  const zvysok = koše.get(BEZ_UDAJA);
  if (zvysok?.length) von.push({ nazov: BEZ_UDAJA, polozky: zvysok.map(naPolozku) });
  /* A za ním články, ktoré lokalitou nie sú vôbec. */
  if (ostatne.length) {
    von.push({ nazov: OSTATNE, polozky: [...ostatne].sort((a, b) => podlaAbecedy(a.nazov, b.nazov)) });
  }
  return von;
}

/**
 * Všetky články kategórie z vyhľadávacieho registra — vrátane tých, ktoré
 * lokalitami nie sú. Register je jedna požiadavka pre celý web a stránka si
 * ho aj tak sťahuje na hľadanie, takže prehľad nič nestojí navyše.
 *
 * Prečo nie zoznam z navigácie: ten ťahá najviac 50 článkov na kategóriu,
 * takže z 80 aktualít by 30 chýbalo.
 */
export function useClankyKategorie(slug: string) {
  const [vsetky, setVsetky] = useState<IndexDoc[] | null>(null);
  useEffect(() => {
    let zrusene = false;
    getSearchIndex()
      .then(({ bySlug }) => { if (!zrusene) setVsetky([...bySlug.values()]); })
      .catch(() => { if (!zrusene) setVsetky([]); });
    return () => { zrusene = true; };
  }, []);
  return useMemo(() => {
    if (!vsetky) return null;
    return vsetky.filter((d) => d.categorySlug === slug);
  }, [vsetky, slug]);
}

const naPolozku = (l: Lokalita) => ({ slug: `/blog/${l.slug}`, nazov: l.nazov, meta: meta(l) });
const pismeno = (s: string) => (s[0] || '?').toLocaleUpperCase('sk');

/** Lokality kategórie. Kategórie bez lokalít vrátia prázdno a dostanú abecedu. */
export const lokalityKategorie = (slug: string) =>
  LOKALITY.filter((l) => l.kategoriaSlug === slug);

export const pocetLokalit = LOKALITY.length;

/* ══════════════════════════════════════════════════════════════════════════
   PREPÍNAČ ZOSKUPENIA
   ══════════════════════════════════════════════════════════════════════════ */
export function Prepinac({ hodnota, onZmena, celeSirky }: {
  hodnota: Zoskupenie; onZmena: (z: Zoskupenie) => void; celeSirky?: boolean;
}) {
  const volby: [Zoskupenie, string][] = [['kraj', 'Kraj'], ['datovanie', 'Datovanie'], ['az', 'A–Z']];
  return (
    <div className={celeSirky ? 'lprh-prepinac je-siroky' : 'lprh-prepinac'} role="group" aria-label="Zoskupiť podľa">
      {volby.map(([k, l]) => (
        <button
          key={k}
          type="button"
          className={hodnota === k ? 'is-on' : undefined}
          aria-pressed={hodnota === k}
          onClick={() => onZmena(k)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ZOZNAM SKUPÍN
   ══════════════════════════════════════════════════════════════════════════ */
export function Skupiny({ skupiny, mobil, onOdkaz }: {
  skupiny: Skupina[]; mobil?: boolean; onOdkaz?: () => void;
}) {
  if (!skupiny.length) return <p className="lprh-prazdno">V tejto kategórii zatiaľ nie sú lokality.</p>;
  return (
    <>
      {skupiny.map((s) => (
        <section key={s.nazov} className="lprh-skupina">
          <div className="lprh-skupina-h">
            <span>{s.nazov}</span>
            <span className="lprh-skupina-n">{s.polozky.length}</span>
          </div>
          <ul className="lprh-zoznam">
            {s.polozky.map((p) => (
              <li key={p.slug}>
                <a href={p.slug} onClick={onOdkaz}>
                  {mobil && <span className="lprh-bodka" aria-hidden="true" />}
                  <span className="lprh-nazov">{p.nazov}</span>
                  {p.meta && <span className="lprh-meta">{p.meta}</span>}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MEGA-PONUKA (PC)
   ══════════════════════════════════════════════════════════════════════════ */
export function MegaPonuka({ kategorie, aktivna, onKategoria, onZavri, zoskupenie, onZoskupenie }: {
  kategorie: { primarne: NavigationItem[]; dalsie: NavigationItem[] };
  aktivna: NavigationItem;
  onKategoria: (c: NavigationItem) => void;
  onZavri: () => void;
  zoskupenie: Zoskupenie;
  onZoskupenie: (z: Zoskupenie) => void;
}) {
  const [hladane, setHladane] = useState('');
  const slug = (aktivna.slug || '').replace('/category/', '').replace(/^\//, '');
  const lokality = lokalityKategorie(slug);
  const clanky = useClankyKategorie(slug);
  /* Prepínač má zmysel len tam, kde je čo zoskupovať. Kategórie bez jedinej
     lokality — modely, pramene — dostanú rovno abecedu; prepínač by v nich
     ponúkal kraj, ktorý nikto nemá. */
  const maLokality = lokality.length > 0;
  const rezim: Zoskupenie = maLokality ? zoskupenie : 'az';

  /* Články, ktoré lokalitou nie sú. V prehľade majú byť VŠETKY články
     kategórie — pri povestiach bola vidieť jediná, ktorá má súradnice,
     a zvyšných štrnásť sa dalo nájsť len cez „Zobraziť všetky". */
  const ostatne = useMemo(() => {
    if (!clanky) return [];
    const jeLokalita = new Set(lokality.map((l) => l.slug));
    return clanky
      .filter((c) => !jeLokalita.has(c.slug))
      .map((c) => ({ slug: `/blog/${c.slug}`, nazov: c.title, meta: '' }));
  }, [clanky, lokality]);

  const zhoda = (text: string) => {
    const q = hladane.trim().toLocaleLowerCase('sk');
    return !q || text.toLocaleLowerCase('sk').includes(q);
  };
  const filtrovane = useMemo(
    () => lokality.filter((l) => zhoda([l.nazov, l.miesto, l.okres, l.kraj, l.datovanie_text].filter(Boolean).join(' '))),
    [lokality, hladane]);
  const filtrovaneOstatne = useMemo(
    () => ostatne.filter((o) => zhoda(o.nazov)), [ostatne, hladane]);

  const skupiny = useMemo(
    () => zoskup(filtrovane, rezim, 3, filtrovaneOstatne),
    [filtrovane, rezim, filtrovaneOstatne]);

  const zobrazenych = skupiny.reduce((n, s) => n + s.polozky.length, 0);

  return (
    <div className="lprh" role="dialog" aria-label={`Prehľad kategórie ${aktivna.label}`}>
      <nav className="lprh-register" aria-label="Kategórie">
        {([['Typy hradísk', kategorie.primarne], ['Ďalší obsah', kategorie.dalsie]] as const).map(([nadpis, zoznam]) => (
          <div key={nadpis}>
            <p className="lprh-register-h">{nadpis}</p>
            {zoznam.map((c) => (
              <button
                key={c.label}
                type="button"
                className={c.label === aktivna.label ? 'is-on' : undefined}
                aria-current={c.label === aktivna.label ? 'true' : undefined}
                onClick={() => onKategoria(c)}
              >
                <span>{c.label}</span>
                {typeof c.count === 'number' && c.count > 0 && <span className="lprh-pocet">{c.count}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="lprh-hlavne">
        <header className="lprh-hlava">
          <div>
            <h2>{aktivna.label}</h2>
            <p className="lprh-suhrn">
              {clanky === null ? 'Načítavam…' : `${clanky.length} článkov`}
              {maLokality && ` · z toho ${lokality.length} lokalít`}
              {hladane.trim() && ` · zobrazených ${zobrazenych}`}
            </p>
          </div>
          <input
            className="lprh-hladat"
            type="search"
            value={hladane}
            onChange={(e) => setHladane(e.target.value)}
            placeholder={maLokality ? 'Hľadať hradisko, obec alebo okres' : 'Hľadať v kategórii'}
            aria-label="Hľadať v kategórii"
          />
          {maLokality && <Prepinac hodnota={zoskupenie} onZmena={onZoskupenie} />}
        </header>

        <div className="lprh-telo">
          {clanky === null
            ? <p className="lprh-prazdno">Načítavam zoznam…</p>
            : hladane.trim() && !zobrazenych
              ? <p className="lprh-prazdno">Nič sa nenašlo. Skúste obec alebo okres.</p>
              : <Skupiny skupiny={skupiny} onOdkaz={onZavri} />}
        </div>

        <footer className="lprh-pata">
          {aktivna.slug && (
            <a href={aktivna.slug} onClick={onZavri}>
              Zobraziť všetky{typeof aktivna.count === 'number' ? ` (${aktivna.count})` : ''} <span aria-hidden="true">→</span>
            </a>
          )}
          <span>{pocetLokalit} lokalít v {kategorie.primarne.length} kategóriách</span>
        </footer>
      </div>
    </div>
  );
}

export default MegaPonuka;
