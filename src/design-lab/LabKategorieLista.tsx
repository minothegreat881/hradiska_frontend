'use client';

/**
 * LIŠTA KATEGÓRIÍ na začiatku článku (handoff „Úvod článku – mini dlaždice
 * nad titulnou fotkou", 09/2026).
 *
 * Na domovskej stojí tá istá deviatka ako veľké dlaždice. V článku by dve
 * veľké obrazové plochy nad sebou (dlaždice + titulná fotka) súperili
 * a text by začal až pod okrajom obrazovky — preto je tu len úzka lišta
 * s obrázkom 84 × 56 px a názvom. Počty sa v nej nezobrazujú.
 *
 * Kategória práve otvoreného článku dostane dvojitý prstenec, plné farby
 * a `aria-current="page"`.
 *
 * Skupiny sú spoločné s domovskou — berú sa z vzhľadu webu
 * (`domov.dlazdice`), takže poradie ani názvy sa nemôžu rozísť. Medzi
 * skupinami stojí tichý oddeľovač.
 */

import { t, odkaz } from '../lib/jazyk';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { skupinyDlazdic, obrazokKategorie, zalohaObrazkaKategorie, titulokKategorie, type DlazdicaNaWebe } from '../lib/vzhlad/citaj';
import { textVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka, srcSetObrazka, poziciaObrazka, jeSuborMedii, priChybeVymen } from '../lib/vzhlad/obrazky';
import type { Rozriesene, Vzhlad } from '../lib/vzhlad/typy';

const VELKOSTI: ['thumbnail' | 'small', number][] = [['thumbnail', 245], ['small', 500]];

function Mini({ d, aktivna, vzhlad, rozriesene, znacka }: {
  d: DlazdicaNaWebe; aktivna: boolean; vzhlad: Vzhlad; rozriesene: Rozriesene; znacka?: string;
}) {
  const o = obrazokKategorie(vzhlad, rozriesene, d.slug);
  const src = adresaObrazka(o, 'thumbnail', rozriesene);
  const srcSet = srcSetObrazka(o, VELKOSTI, rozriesene);
  const pozicia = poziciaObrazka(o);
  const zaloha = jeSuborMedii(o) ? zalohaObrazkaKategorie(d.slug) : null;
  const popisok = d.vk ? textVzhladu(d.vk.popisokDlazdice) : titulokKategorie(undefined, rozriesene, d.slug);

  return (
    <a
      className={aktivna ? 'cat-mini is-active' : 'cat-mini'}
      href={odkaz(`/category/${d.slug}`)}
      title={titulokKategorie(d.vk, rozriesene, d.slug)}
      aria-current={aktivna ? 'page' : undefined}
      data-slug={d.slug}
      data-vw={znacka}
    >
      <span className="cat-mini-ram">
        {src && (
          <img
            className="cat-mini-obraz"
            src={src}
            srcSet={srcSet ?? undefined}
            sizes="(max-width: 600px) 96px, (max-width: 1060px) 126px, 156px"
            alt=""
            loading="lazy"
            decoding="async"
            style={pozicia ? { objectPosition: pozicia } : undefined}
            onError={priChybeVymen(zaloha ? {
              src: adresaObrazka(zaloha, 'thumbnail'),
              srcSet: srcSetObrazka(zaloha, VELKOSTI),
            } : null)}
          />
        )}
      </span>
      <span className="cat-mini-nazov">{popisok}</span>
    </a>
  );
}

export function LabKategorieLista({ aktivna, bezZnaciek = false }: {
  aktivna?: string;
  /** Vysúvacia lišta je kópia — v režime úprav nesie značky len lišta v stránke. */
  bezZnaciek?: boolean;
}) {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const skupiny = useMemo(() => skupinyDlazdic(vzhlad, rozriesene), [vzhlad, rozriesene]);
  const pas = useRef<HTMLDivElement>(null);
  const zaciatok = useRef<{ x: number; y: number; posun: number } | null>(null);

  /* Na telefóne sa pás posúva prstom. Prehliadač po rýchlom švihu aj tak
     pošle klik na dlaždicu, na ktorej prst skončil, takže sa stačilo
     rýchlejšie posunúť a stránka odskočila do kategórie.
     Klik sa preto prijme len vtedy, keď ani prst, ani pás medzitým
     nešli nikam: 10 px je bežná tolerancia pre chvenie ruky a posun pásu
     chytí aj zotrvačné dobiehanie, pri ktorom prst stojí. */
  const stlacenie = (e: React.PointerEvent) => {
    zaciatok.current = { x: e.clientX, y: e.clientY, posun: pas.current?.scrollLeft ?? 0 };
  };
  const klik = (e: React.MouseEvent) => {
    const z = zaciatok.current;
    if (!z) return;
    const prstPohol = Math.abs(e.clientX - z.x) > 10 || Math.abs(e.clientY - z.y) > 10;
    const pasPohol = Math.abs((pas.current?.scrollLeft ?? 0) - z.posun) > 2;
    if (prstPohol || pasPohol) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Na úzkom okne sa lišta nezalamuje, ale posúva. Aktívnu dlaždicu treba
  // dorolovať do zorného poľa — `scrollLeft` na samotnom páse, nie
  // `scrollIntoView`, ktorý by potiahol aj celú stránku pod hlavičku.
  useEffect(() => {
    const el = pas.current;
    if (!el || !aktivna) return;
    const cil = el.querySelector<HTMLElement>(`[data-slug="${CSS.escape(aktivna)}"]`);
    if (!cil) return;
    if (el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = Math.max(0, cil.offsetLeft - (el.clientWidth - cil.offsetWidth) / 2);
  }, [aktivna, skupiny]);

  return (
    <nav className="cat-rail" aria-label={t('Kategórie hradísk')}>
      <div className="cat-rail-pas" ref={pas} onPointerDown={stlacenie} onClickCapture={klik}>
        {skupiny.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 && <span className="cat-rail-predel" aria-hidden="true" />}
            {s.polozky.map((d) => (
              <Mini
                key={d.id}
                d={d}
                aktivna={d.slug === aktivna}
                vzhlad={vzhlad}
                rozriesene={rozriesene}
                znacka={upravy && !bezZnaciek ? `lista:${d.slug}` : undefined}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </nav>
  );
}

export default LabKategorieLista;
