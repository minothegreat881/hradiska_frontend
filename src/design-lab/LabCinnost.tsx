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
 * Členenie, obrázky aj zaraďovanie zápisov žijú v `data/cinnost.ts`.
 */

import { odkaz, t } from '../lib/jazyk';
import { CINNOSTI, type KlucCinnosti } from '../data/cinnost';
import { variant } from '../data/categories';
import { zakladStrapi } from '../data/rozcestnik';

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
   * Dlaždice, ktoré sa na danom mieste nemajú ukázať. Na domovskej sú to
   * tabule a 3D rekonštrukcie: hneď nad blokom majú v „Ďalšom obsahu" celý
   * rad článkov, takže by na jednej obrazovke stáli dvakrát.
   */
  vynechaj?: KlucCinnosti[];
}

export function LabCinnost({ pocty, poctyKategorii, vybrana = null, onVyber, tichy = false, vynechaj }: LabCinnostProps) {
  const zaklad = zakladStrapi();
  const dlazdice = vynechaj?.length ? CINNOSTI.filter((c) => !vynechaj.includes(c.kluc)) : CINNOSTI;

  return (
    <section className={tichy ? 'lcin lcin--ticha' : 'lcin'} aria-label={t('Činnosť združenia')}>
      <div className="lcin-h">
        <h2>{t('Čo združenie robí')}</h2>
        <span className="lcin-ciara" aria-hidden="true" />
      </div>

      <div className="lcin-rad">
        {dlazdice.map((c) => {
          const pocet = c.kategoria ? poctyKategorii?.[c.kategoria] : pocty?.[c.kluc];
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
             kategória — dlaždica preto vedie vždy tam. */
          if (c.kategoria) {
            return (
              <a key={c.kluc} className="lcin-dlazdica" href={odkaz(`/category/${c.kategoria}`)}>{obsah}</a>
            );
          }
          /* Bez `onVyber` niet čo zúžiť — dlaždica vedie do kroniky s témou
             v adrese, takže otvorí presne ten istý výber. */
          if (!onVyber) {
            return (
              <a key={c.kluc} className="lcin-dlazdica" href={odkaz(`/aktuality?cinnost=${c.kluc}`)}>{obsah}</a>
            );
          }
          return (
            <button
              key={c.kluc}
              type="button"
              className={vybrana === c.kluc ? 'lcin-dlazdica is-on' : 'lcin-dlazdica'}
              aria-pressed={vybrana === c.kluc}
              onClick={() => onVyber(vybrana === c.kluc ? null : c.kluc)}
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
