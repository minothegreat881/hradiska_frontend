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
 * Zoznam je spoločný s domovskou (`data/rozcestnik.ts`) — poradie ani názvy
 * sa nemôžu rozísť.
 */

import { useEffect, useRef } from 'react';
import { hradiskaCategories, variant } from '../data/categories';
import { ROZCESTNIK_TYPY, ROZCESTNIK_PRAMENE, zakladStrapi } from '../data/rozcestnik';

function Mini({ slug, label, aktivna }: { slug: string; label: string; aktivna: boolean }) {
  const k = hradiskaCategories.find((c) => c.slug === slug);
  if (!k) return null;
  const base = zakladStrapi();

  return (
    <a
      className={aktivna ? 'cat-mini is-active' : 'cat-mini'}
      href={`/category/${slug}`}
      title={k.label}
      aria-current={aktivna ? 'page' : undefined}
      data-slug={slug}
    >
      <span className="cat-mini-ram">
        <img
          className="cat-mini-obraz"
          src={`${base}${variant(k.image, 'thumbnail')}`}
          srcSet={`${base}${variant(k.image, 'thumbnail')} 245w, ${base}${variant(k.image, 'small')} 500w`}
          sizes="120px"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="cat-mini-nazov">{label}</span>
    </a>
  );
}

export function LabKategorieLista({ aktivna }: { aktivna?: string }) {
  const pas = useRef<HTMLDivElement>(null);

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
  }, [aktivna]);

  return (
    <nav className="cat-rail" aria-label="Kategórie hradísk">
      <div className="cat-rail-pas" ref={pas}>
        {ROZCESTNIK_TYPY.map((p) => (
          <Mini key={p.slug} slug={p.slug} label={p.label} aktivna={p.slug === aktivna} />
        ))}

        <span className="cat-rail-predel" aria-hidden="true" />

        {ROZCESTNIK_PRAMENE.map((p) => (
          <Mini key={p.slug} slug={p.slug} label={p.label} aktivna={p.slug === aktivna} />
        ))}
      </div>
    </nav>
  );
}

export default LabKategorieLista;
