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
 * Skupiny, dlaždice, ich popisky, obrázky aj poradie sú vo VZHĽADE WEBU
 * (`lib/vzhlad/`, `domov.dlazdice`); tie isté skupiny kreslí aj lišta na
 * stránke článku. Bez vzhľadu z API platí základný vzhľad = dnešná deviatka
 * z `data/rozcestnik.ts`.
 *
 * Počty pod názvom sa ťahajú zo Strapi (`getCategoryPostCounts`), nie sú
 * napísané natvrdo — číslo v predlohe je stav z jedného dňa. Kým odpoveď
 * nedorazí, riadok s počtom sa nevykreslí; nepodsúva sa nula.
 */

import { Fragment, useEffect, useMemo, useState } from 'react';
import { getCategoryPostCounts } from '../lib/strapi';
import { odkaz, t } from '../lib/jazyk';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { skupinyDlazdic, obrazokKategorie, zalohaObrazkaKategorie, titulokKategorie, type DlazdicaNaWebe } from '../lib/vzhlad/citaj';
import { textVzhladu, tvarPoctuVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka, srcSetObrazka, poziciaObrazka, jeSuborMedii, priChybeVymen } from '../lib/vzhlad/obrazky';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';
import type { Rozriesene, Vzhlad } from '../lib/vzhlad/typy';

const VELKOSTI: ['small' | 'medium', number][] = [['small', 500], ['medium', 750]];

function Dlazdica({ d, skupina, pocet, vzhlad, rozriesene, upravy }: {
  d: DlazdicaNaWebe; skupina: string; pocet?: number; vzhlad: Vzhlad; rozriesene: Rozriesene; upravy: boolean;
}) {
  const o = obrazokKategorie(vzhlad, rozriesene, d.slug);
  const src = adresaObrazka(o, 'small', rozriesene);
  const srcSet = srcSetObrazka(o, VELKOSTI, rozriesene);
  const pozicia = poziciaObrazka(o);
  const zaloha = jeSuborMedii(o) ? zalohaObrazkaKategorie(d.slug) : null;
  const tvary = d.vk?.tvary;
  const popisok = d.vk ? textVzhladu(d.vk.popisokDlazdice) : titulokKategorie(undefined, rozriesene, d.slug);

  return (
    <a
      className="lkat-dlazdica"
      href={odkaz(`/category/${d.slug}`)}
      title={titulokKategorie(d.vk, rozriesene, d.slug)}
      style={{ ['--lkat-poradie' as string]: String(d.poradie) }}
      data-vw={vw(upravy, `dlazdica:${skupina}:${d.id}`)}
    >
      <span className="lkat-ram">
        {src && (
          <img
            className="lkat-obraz"
            src={src}
            srcSet={srcSet ?? undefined}
            sizes="(max-width: 720px) 45vw, 240px"
            alt=""
            loading="lazy"
            decoding="async"
            style={pozicia ? { objectPosition: pozicia } : undefined}
            onError={priChybeVymen(zaloha ? {
              src: adresaObrazka(zaloha, 'small'),
              srcSet: srcSetObrazka(zaloha, VELKOSTI),
            } : null)}
          />
        )}
      </span>
      <span className="lkat-text">
        <span className="lkat-nazov">{popisok}</span>
        {d.pocet && typeof pocet === 'number' && pocet > 0 && (
          <span className="lkat-pocet">
            {/* Slovenčina počíta v troch tvaroch, angličtina v jednom —
                 v nej stačí množné číslo z tretieho tvaru. */}
            <b>{pocet}</b> {tvary ? tvarPoctuVzhladu(tvary, pocet) : ''}
          </span>
        )}
      </span>
    </a>
  );
}

export function LabKategorieRychle() {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const [pocty, setPocty] = useState<Record<string, number>>({});

  const skupiny = useMemo(() => skupinyDlazdic(vzhlad, rozriesene), [vzhlad, rozriesene]);
  /* Kľúč z množiny slugov — iný vzhľad s tými istými kategóriami nemá
     prečo sťahovať počty znova. */
  const slugy = skupiny.flatMap((s) => s.polozky.map((d) => d.slug));
  const klucSlugov = slugy.join('|');

  useEffect(() => {
    let zrusene = false;
    getCategoryPostCounts(klucSlugov ? klucSlugov.split('|') : [])
      .then((p) => { if (!zrusene) setPocty(p); })
      .catch(() => { /* bez počtov sa dlaždice zobrazia tak či tak */ });
    return () => { zrusene = true; };
  }, [klucSlugov]);

  /* Dlaždice sa dajú skryť celé (`domov.dlazdice.viditelne`), nie vysunúť
     z úvodu. Na plátne editora ostanú nakreslené a označené ako skryté. */
  const viditelne = vzhlad.domov.dlazdice.viditelne;
  if (!viditelne && !upravy) return null;

  return (
    <nav className="lkat" aria-label={t('Kategórie hradísk')} data-vw={vw(upravy, 'dlazdice')} data-vw-skryte={vwSkryte(upravy, !viditelne)}>
      {skupiny.map((s, i) => (
        <Fragment key={s.id}>
          {/* Nadpis oddeľovača nesie len skupina, ktorá ho má — prvá nie. */}
          {i > 0 && s.nadpis && (
            <div className="lkat-predel" data-vw={vw(upravy, `skupina-nadpis:${s.id}`)}>
              <span aria-hidden="true" />
              {textVzhladu(s.nadpis)}
              <span aria-hidden="true" />
            </div>
          )}
          <div className={`lkat-rad lkat-rad--${s.id}`} data-vw={vw(upravy, `skupina:${s.id}`)}>
            {s.polozky.map((d) => (
              <Dlazdica
                key={d.id}
                d={d}
                skupina={s.id}
                pocet={pocty[d.slug]}
                vzhlad={vzhlad}
                rozriesene={rozriesene}
                upravy={upravy}
              />
            ))}
          </div>
        </Fragment>
      ))}
    </nav>
  );
}

export default LabKategorieRychle;
