'use client';

/**
 * ČAKANIE — jediný znak načítavania na celom webe.
 *
 * Doteraz mala každá stránka vlastný: niekde točiaci sa kruh z knižnice
 * ikon v hnedej zo starého šatu, inde iba holý text „Načítavam…". Pôsobilo
 * to, ako keby každá stránka patrila inému webu.
 *
 * ČO TU TEDA JE: pôdorys hradiska. Tri sústredné valy, po ktorých obieha
 * oblúk, a uprostred bod — osada. Nie je to ozdoba pre ozdobu: je to jediný
 * tvar, ktorý o tomto webe niečo hovorí a zároveň sa dá nakresliť čiarou,
 * takže je čitateľný aj pri 28 px a nepotrebuje obrázok.
 *
 * Tri valy obiehajú RÔZNOU rýchlosťou a prostredný opačným smerom — inak
 * by sa po chvíli zosynchronizovali a znak by zamrzol na mieste. Farby sú
 * zo šatu (`--l-accent`, `--l-second`), takže sa menia spolu s ním.
 *
 * Kto má v systéme vypnuté animácie, uvidí ten istý pôdorys nehybne —
 * kreslenie sa zastaví, znak ostane celý (viď `theme.css`).
 */

type Velkost = 'male' | 'stredne' | 'velke';

type Props = {
  /** Text pod znakom. Keď chýba, ostáva len pre čítačky obrazovky. */
  text?: string;
  velkost?: Velkost;
  /** Vyplní celú výšku okna — pre načítanie celej stránky. */
  celaVyska?: boolean;
  /** Na tmavom podklade (3D mapa). */
  tmave?: boolean;
  /** Znak a text vedľa seba — do vety, nie na stred stránky. */
  riadok?: boolean;
};

export function Nacitavanie({ text, velkost = 'stredne', celaVyska = false, tmave = false, riadok = false }: Props) {
  const triedy = [
    'lnac',
    `lnac--${velkost}`,
    celaVyska ? 'lnac--cela' : '',
    tmave ? 'lnac--tmave' : '',
    riadok ? 'lnac--riadok' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={triedy} role="status" aria-live="polite">
      <svg className="lnac-znak" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        {/* Palisáda po obvode a celé valy slabo — pôdorys musí byť čitateľný
            aj tam, kde práve nie je oblúk. */}
        <circle className="lnac-palisada" cx="32" cy="32" r="30" />
        <g className="lnac-plan">
          <circle cx="32" cy="32" r="26" />
          <circle cx="32" cy="32" r="18" />
          <circle cx="32" cy="32" r="10" />
        </g>
        <circle className="lnac-val lnac-val--1" cx="32" cy="32" r="26" />
        <circle className="lnac-val lnac-val--2" cx="32" cy="32" r="18" />
        <circle className="lnac-val lnac-val--3" cx="32" cy="32" r="10" />
        <circle className="lnac-srdce" cx="32" cy="32" r="2.6" />
      </svg>
      {/* Keď je text vidieť, nesmie sa zopakovať aj pre čítačku — prečítala
          by ho dvakrát. */}
      {text ? <p className="lnac-text">{text}</p> : <span className="sr-only">{t('Načítavam…')}</span>}
    </div>
  );
}

export default Nacitavanie;
