'use client';

/**
 * DLAŽDICE KATEGÓRIÍ pod titulkom domovskej stránky.
 *
 * Podľa handoffu „Homepage – hlavička, titulok a dlaždice" (09/2026): päť
 * dlaždíc s TYPMI hradísk, pod nimi oddeľovač „Pramene a tradícia" a štyri
 * dlaždice s prameňmi, tradíciou a svätyňami. Spodný rad má rovnako široké
 * dlaždice ako horný — preto tá počítaná šírka stĺpca, nie `1fr`.
 *
 * Z handoffu sa NEPREBERÁ písmo (DM Serif Display + Manrope z Google Fonts).
 * Fonty webu sú self-hostované kvôli GDPR a celý šat stojí na Fraunces +
 * Inter; dve stránky s iným atramentom by boli horšie než presná zhoda
 * s predlohou. Rovnako sa drží pečatná červená z tokenov (`--l-second-deep`)
 * namiesto `#a3302a` — je to to isté rodisko farby, len naladené na papier.
 *
 * Zoznam kategórií, ich skrátené názvy aj poradie žijú v `data/rozcestnik.ts`,
 * lebo tú istú deviatku vykresľuje aj lišta na stránke článku.
 *
 * Počty pod názvom sa ťahajú zo Strapi (`getCategoryPostCounts`), nie sú
 * napísané natvrdo — číslo v predlohe je stav z jedného dňa. Kým odpoveď
 * nedorazí, riadok s počtom sa nevykreslí; nepodsúva sa nula.
 */

import { useEffect, useState } from 'react';
import { hradiskaCategories, variant } from '../data/categories';
import {
  ROZCESTNIK_TYPY as TYPY,
  ROZCESTNIK_PRAMENE as PRAMENE,
  tvarPoctu,
  zakladStrapi,
  type PolozkaRozcestnika as Polozka,
} from '../data/rozcestnik';
import { getCategoryPostCounts } from '../lib/strapi';

function Dlazdica({ d, pocet, poradie }: { d: Polozka; pocet?: number; poradie: number }) {
  const k = hradiskaCategories.find((c) => c.slug === d.slug);
  if (!k) return null;
  const base = zakladStrapi();

  return (
    <a
      className="lkat-dlazdica"
      href={`/category/${d.slug}`}
      title={k.label}
      style={{ ['--lkat-poradie' as string]: String(poradie) }}
    >
      <span className="lkat-ram">
        <img
          className="lkat-obraz"
          src={`${base}${variant(k.image, 'small')}`}
          srcSet={`${base}${variant(k.image, 'small')} 500w, ${base}${variant(k.image, 'medium')} 750w`}
          sizes="(max-width: 720px) 45vw, 240px"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </span>
      <span className="lkat-text">
        <span className="lkat-nazov">{d.label}</span>
        {typeof pocet === 'number' && pocet > 0 && (
          <span className="lkat-pocet">
            <b>{pocet}</b> {tvarPoctu(pocet, d.tvary)}
          </span>
        )}
      </span>
    </a>
  );
}

export function LabKategorieRychle() {
  const [pocty, setPocty] = useState<Record<string, number>>({});

  useEffect(() => {
    let zrusene = false;
    getCategoryPostCounts([...TYPY, ...PRAMENE].map((d) => d.slug))
      .then((p) => { if (!zrusene) setPocty(p); })
      .catch(() => { /* bez počtov sa dlaždice zobrazia tak či tak */ });
    return () => { zrusene = true; };
  }, []);

  return (
    <nav className="lkat" aria-label="Kategórie hradísk">
      <div className="lkat-rad lkat-rad--typy">
        {TYPY.map((d, i) => (
          <Dlazdica key={d.slug} d={d} pocet={pocty[d.slug]} poradie={i} />
        ))}
      </div>

      <div className="lkat-predel">
        <span aria-hidden="true" />
        Pramene a tradícia
        <span aria-hidden="true" />
      </div>

      <div className="lkat-rad lkat-rad--pramene">
        {PRAMENE.map((d, i) => (
          <Dlazdica key={d.slug} d={d} pocet={pocty[d.slug]} poradie={i + TYPY.length} />
        ))}
      </div>
    </nav>
  );
}

export default LabKategorieRychle;
