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
          sizes="(max-width: 600px) 96px, (max-width: 1060px) 126px, 156px"
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
  }, [aktivna]);

  return (
    <nav className="cat-rail" aria-label="Kategórie hradísk">
      <div className="cat-rail-pas" ref={pas} onPointerDown={stlacenie} onClickCapture={klik}>
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
