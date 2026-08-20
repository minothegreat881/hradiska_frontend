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
 */

import { useMemo, useState } from 'react';
import lokalityData from '../data/lokality.json';
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
export function zoskup(lokality: Lokalita[], rezim: Zoskupenie, stlpcov = 1): Skupina[] {
  const zoradene = [...lokality].sort((a, b) => podlaAbecedy(a.nazov, b.nazov));

  if (rezim === 'az') {
    if (stlpcov <= 1 || zoradene.length < stlpcov * 3) {
      return zoradene.length ? [{ nazov: 'A – Z', polozky: zoradene.map(naPolozku) }] : [];
    }
    const naBlok = Math.ceil(zoradene.length / stlpcov);
    const von: Skupina[] = [];
    for (let i = 0; i < zoradene.length; i += naBlok) {
      const kus = zoradene.slice(i, i + naBlok);
      const od = pismeno(kus[0].nazov), po = pismeno(kus[kus.length - 1].nazov);
      von.push({ nazov: od === po ? od : `${od} – ${po}`, polozky: kus.map(naPolozku) });
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
  return von;
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
  /* Kategórie bez lokalít (aktuality, modely, pramene) nemajú kraj ani
     datovanie — zoskupovať sa v nich nedá a prepínač by klamal. */
  const maLokality = lokality.length > 0;

  const filtrovane = useMemo(() => {
    const q = hladane.trim().toLocaleLowerCase('sk');
    if (!q) return lokality;
    return lokality.filter((l) =>
      [l.nazov, l.miesto, l.okres, l.kraj, l.datovanie_text]
        .some((v) => (v || '').toLocaleLowerCase('sk').includes(q)));
  }, [lokality, hladane]);

  const skupiny = useMemo(() => {
    if (maLokality) return zoskup(filtrovane, zoskupenie, 3);
    const clanky = (aktivna.children ?? []).map((c) => ({
      slug: c.slug ?? '#', nazov: c.label, meta: '',
    })).sort((a, b) => podlaAbecedy(a.nazov, b.nazov));
    return clanky.length ? [{ nazov: 'A – Z', polozky: clanky }] : [];
  }, [maLokality, filtrovane, zoskupenie, aktivna]);

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
              {maLokality ? `${lokality.length} lokalít` : `${(aktivna.children ?? []).length} článkov`}
              {hladane.trim() && ` · zobrazených ${zobrazenych}`}
            </p>
          </div>
          {maLokality && (
            <>
              <input
                className="lprh-hladat"
                type="search"
                value={hladane}
                onChange={(e) => setHladane(e.target.value)}
                placeholder="Hľadať hradisko, obec alebo okres"
                aria-label="Hľadať v kategórii"
              />
              <Prepinac hodnota={zoskupenie} onZmena={onZoskupenie} />
            </>
          )}
        </header>

        <div className="lprh-telo">
          {hladane.trim() && !zobrazenych
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
