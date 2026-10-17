'use client';

/**
 * ČINNOSŤ ZDRUŽENIA — dlaždice, ktoré povedia, čo združenie robí.
 *
 * Stoja na dvoch miestach: nad kronikou, kde zároveň zužujú zápisy na jednu
 * tému, a POD KAŽDÝM ČLÁNKOM hneď za mapou a za odporúčaním. V článku sú to
 * obyčajné odkazy — kronika tam nie je, čo by filter zúžil.
 *
 * Prečo pod článkom: človek, ktorý dočítal text o hradisku, je presne ten,
 * komu stojí za to povedať, že tabuľu pri ňom osadilo združenie, že o ňom
 * vyšiel zborník a že sa to platí z 2 % z daní. Inde sa to nedozvie — do
 * kroniky zájde málokto.
 *
 * POČTY sa ukazujú len tam, kde ich netreba osobitne doťahovať (v kronike).
 * V článku by to znamenalo stiahnuť osemdesiat zápisov kvôli siedmim číslam.
 *
 * Poradie, názvy, popisy, obrázky a viditeľnosť sú vo vzhľade webu
 * (`cinnost`); `viditelna` platí všade, `naDomovskej` len na domovskej.
 * Zaraďovanie zápisov kroniky a to, ktorá činnosť vedie do vlastnej
 * kategórie, ostáva v kóde (`data/cinnost.ts`).
 */

import { odkaz, t } from '../lib/jazyk';
import { CINNOSTI, type KlucCinnosti } from '../data/cinnost';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { textVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka, jeSuborMedii, priChybeVymen, poziciaObrazka } from '../lib/vzhlad/obrazky';
import { ZAKLADNY_VZHLAD } from '../lib/vzhlad/zakladny';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';

/** Kam vedie dlaždica činnosti, ktorá má vlastnú kategóriu (tabule, 3D). */
const KATEGORIA_CINNOSTI = new Map(CINNOSTI.filter((c) => c.kategoria).map((c) => [c.kluc, c.kategoria as string]));

export interface LabCinnostProps {
  /** Počty zápisov kroniky podľa témy. Bez nich sa čísla nevykreslia. */
  pocty?: Partial<Record<KlucCinnosti, number>>;
  /** Počty článkov v kategóriách (tabule, 3D rekonštrukcie). */
  poctyKategorii?: Record<string, number>;
  /** Zvolená téma — len tam, kde sa kronika dá zúžiť. */
  vybrana?: KlucCinnosti | null;
  /** Keď chýba, dlaždice sú odkazy do kroniky namiesto prepínačov. */
  onVyber?: (kluc: KlucCinnosti | null) => void;
  /** Nadpis sekcie; v článku je tichší než na stránke kroniky. */
  tichy?: boolean;
  /**
   * Na domovskej: ukázať len činnosti s `naDomovskej`. Dnes tam chýbajú
   * tabule a 3D rekonštrukcie — hneď nad blokom majú v „Ďalšom obsahu" celý
   * rad článkov, takže by na jednej obrazovke stáli dvakrát.
   */
  naDomovskej?: boolean;
}

export function LabCinnost({ pocty, poctyKategorii, vybrana = null, onVyber, tichy = false, naDomovskej = false }: LabCinnostProps) {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const dlazdice = vzhlad.cinnost.polozky
    .map((c) => ({ c, skryta: !c.viditelna || (naDomovskej && !c.naDomovskej) }))
    .filter((x) => upravy || !x.skryta);

  return (
    <section className={tichy ? 'lcin lcin--ticha' : 'lcin'} aria-label={t('Činnosť združenia')}>
      <div className="lcin-h">
        <h2 data-vw={vw(upravy, 'cinnost:nadpis')}>{textVzhladu(vzhlad.cinnost.nadpis)}</h2>
        <span className="lcin-ciara" aria-hidden="true" />
      </div>

      <div className="lcin-rad">
        {dlazdice.map(({ c, skryta }) => {
          const kategoria = KATEGORIA_CINNOSTI.get(c.kluc);
          const pocet = kategoria ? poctyKategorii?.[kategoria] : pocty?.[c.kluc];
          /* Obrázok zo základného vzhľadu nastúpi, keď súbor z médií chýba
             alebo sa nenačíta. */
          const zaloha = ZAKLADNY_VZHLAD.cinnost.polozky.find((z) => z.kluc === c.kluc)?.obrazok ?? null;
          const vlastny = 'cesta' in c.obrazok && !c.obrazok.cesta.startsWith('/uploads/');
          const obrazok = adresaObrazka(c.obrazok, 'small', rozriesene) ?? adresaObrazka(zaloha, 'small');
          const pozicia = poziciaObrazka(c.obrazok);
          const znacky = { 'data-vw': vw(upravy, `cinnost:${c.kluc}`), 'data-vw-skryte': vwSkryte(upravy, skryta) };
          const obsah = (
            <>
              <span className={vlastny ? 'lcin-ram lcin-ram--znak' : 'lcin-ram'}>
                {obrazok && (
                  <img
                    src={obrazok}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={pozicia ? { objectPosition: pozicia } : undefined}
                    onError={priChybeVymen(jeSuborMedii(c.obrazok) ? { src: adresaObrazka(zaloha, 'small') } : null)}
                  />
                )}
              </span>
              <span className="lcin-text">
                <span className="lcin-nazov">{textVzhladu(c.nazov)}</span>
                {typeof pocet === 'number' && pocet > 0 && <span className="lcin-pocet">{pocet}</span>}
              </span>
              <span className="lcin-popis">{textVzhladu(c.popis)}</span>
            </>
          );

          /* Tabule a 3D rekonštrukcie nie sú zápisy kroniky, ale vlastná
             kategória — dlaždica preto vedie vždy tam. */
          if (kategoria) {
            return (
              <a key={c.kluc} className="lcin-dlazdica" href={odkaz(`/category/${kategoria}`)} {...znacky}>{obsah}</a>
            );
          }
          /* Bez `onVyber` niet čo zúžiť — dlaždica vedie do kroniky s témou
             v adrese, takže otvorí presne ten istý výber. */
          if (!onVyber) {
            return (
              <a key={c.kluc} className="lcin-dlazdica" href={odkaz(`/aktuality?cinnost=${c.kluc}`)} {...znacky}>{obsah}</a>
            );
          }
          return (
            <button
              key={c.kluc}
              type="button"
              className={vybrana === c.kluc ? 'lcin-dlazdica is-on' : 'lcin-dlazdica'}
              aria-pressed={vybrana === c.kluc}
              onClick={() => onVyber(vybrana === c.kluc ? null : c.kluc)}
              {...znacky}
            >
              {obsah}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default LabCinnost;
