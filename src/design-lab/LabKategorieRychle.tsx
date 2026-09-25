'use client';

/**
 * DLAŽDICE KATEGÓRIÍ pod titulkom domovskej stránky.
 *
 * Podľa handoffu „Homepage – hlavička, titulok a dlaždice" (09/2026):
 * dlaždice s TYPMI hradísk, pod nimi oddeľovač „Pramene a tradícia" a štyri
 * dlaždice s prameňmi, tradíciou a svätyňami.
 *
 * Predloha mala v hornom rade päť dlaždíc; „Mocenské centrá" z neho na
 * žiadosť odišli, takže sú rady dva po štyroch. Šírka dlaždice sa napriek
 * tomu naďalej počíta z PÄŤSTĹPCOVÉHO radu a rady sa centrujú — inak by
 * dlaždice narástli a celý blok by prestal sedieť s predlohou.
 *
 * Z handoffu sa NEPREBERÁ písmo (DM Serif Display + Manrope z Google Fonts).
 * Fonty webu sú self-hostované kvôli GDPR a celý šat stojí na Fraunces +
 * Inter; dve stránky s iným atramentom by boli horšie než presná zhoda
 * s predlohou. Rovnako sa drží pečatná červená z tokenov (`--l-second-deep`)
 * namiesto `#a3302a` — je to to isté rodisko farby, len naladené na papier.
 *
 * Názvy sú SKRÁTENÉ („Hospodárska", „Legendy", „Svätyne") presne ako
 * v predlohe. Skutočné názvy kategórií v Strapi sa tým nemenia.
 *
 * Počty pod názvom sa ťahajú zo Strapi (`getCategoryPostCounts`), nie sú
 * napísané natvrdo — číslo v predlohe je stav z jedného dňa. Kým odpoveď
 * nedorazí, riadok s počtom sa nevykreslí; nepodsúva sa nula.
 */

import { useEffect, useState } from 'react';
import { hradiskaCategories, variant } from '../data/categories';
import { getCategoryPostCounts } from '../lib/strapi';

/** Skrátený názov a tvary počítaného podstatného mena: 1 / 2–4 / 5 a viac. */
interface Polozka {
  slug: string;
  label: string;
  tvary: [string, string, string];
}

const TYPY: Polozka[] = [
  { slug: 'kniezacie-sidla', label: 'Kniežacie sídla', tvary: ['hradisko', 'hradiská', 'hradísk'] },
  { slug: 'strazna-funkcia', label: 'Hospodárska', tvary: ['hradisko', 'hradiská', 'hradísk'] },
  { slug: 'refugia', label: 'Refúgiá', tvary: ['hradisko', 'hradiská', 'hradísk'] },
  { slug: 'staroveke-sidla', label: 'Staroveké hradiská', tvary: ['hradisko', 'hradiská', 'hradísk'] },
];

const PRAMENE: Polozka[] = [
  { slug: 'listiny-a-pisomne-zdroje', label: 'Listiny a pís. zdroje', tvary: ['prameň', 'pramene', 'prameňov'] },
  { slug: 'vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách', tvary: ['text', 'texty', 'textov'] },
  { slug: 'povesti', label: 'Legendy', tvary: ['povesť', 'povesti', 'povestí'] },
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne', tvary: ['svätyňa', 'svätyne', 'svätýň'] },
];

/** Slovenčina počíta v troch tvaroch: 1 hradisko, 2 hradiská, 5 hradísk. */
function tvarPoctu(n: number, [jedno, malo, vela]: [string, string, string]): string {
  if (n === 1) return jedno;
  if (n >= 2 && n <= 4) return malo;
  return vela;
}

function zakladUrl(): string {
  if (!import.meta.env.PROD) return import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  return typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi';
}

function Dlazdica({ d, pocet, poradie }: { d: Polozka; pocet?: number; poradie: number }) {
  const k = hradiskaCategories.find((c) => c.slug === d.slug);
  if (!k) return null;
  const base = zakladUrl();

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
