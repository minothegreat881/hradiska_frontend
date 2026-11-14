'use client';

/**
 * VOĽNÉ ODKAZY — obrázok, text a cieľ (požiadavka klienta K2, K3; 14. 11. 2026).
 *
 *   • `RadOdkazov`        — rad obrázkových odkazov pod hľadaním (`domov.odkazy`),
 *                           na domovskej aj pod článkom,
 *   • `TlacidlaCinnosti`  — obrázkové tlačidlá pod dlaždicami činnosti
 *                           (`cinnost.tlacidla`); hlavné je väčšie,
 *   • `OdkazyCinnosti`    — textové odkazy pod nimi (`cinnost.odkazy`).
 *
 * Odkaz sa nenakreslí, keď je skrytý, nemá cieľ, cieľ v jazyku stránky
 * neexistuje alebo (obrázkový) nemá obrázok. V režime úprav sa nakreslí
 * aj tak — označený ako skrytý —, aby ho redaktor videl a doplnil.
 *
 * Odkazy otvárajú stránku v tom istom okne (základ Z1.01), aj keď vedú mimo
 * webu. Článok zo základného vzhľadu pozná len slovenský slug — adresa
 * v cudzom jazyku sa dohľadá ako pri populárnych (`anglickeSlugy`); kým
 * odpoveď nepríde, odkaz vedie na slovenskú verziu, ktorá existuje vždy.
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { anglickeSlugy } from '../lib/strapi';
import { jazyk, odkaz, t } from '../lib/jazyk';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { adresaCiela, clanokVJazyku } from '../lib/vzhlad/citaj';
import { textVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka, poziciaObrazka, priChybeVymen } from '../lib/vzhlad/obrazky';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';
import { BEZ_ZMENSENIN } from '../data/odkazy';
import type { VolneOdkazy, VolnyOdkaz, Obrazok, Rozriesene, Jazyk } from '../lib/vzhlad/typy';

export interface OdkazNaWebe {
  o: VolnyOdkaz;
  /** Adresa v jazyku stránky; null = cieľ chýba (len v režime úprav). */
  href: string | null;
  /** Obrázok pre `<img>`; null = bez obrázka. */
  src: string | null;
  /** Záložná adresa obrázka, keď sa zmenšenina nenačíta. */
  zaloha: string | null;
  pozicia: string | undefined;
  /** Na webe skrytý (len v režime úprav sa vôbec kreslí). */
  skryty: boolean;
}

/** Veľkosť obrázka: súbor bez zmenšenín (cesta v základnom vzhľade) sa berie celý. */
function src(o: Obrazok | null, r: Rozriesene): { src: string | null; zaloha: string | null } {
  if (!o) return { src: null, zaloha: null };
  const maly = 'cesta' in o && BEZ_ZMENSENIN.has(o.cesta);
  const s = adresaObrazka(o, maly ? 'original' : 'small', r);
  const orig = adresaObrazka(o, 'original', r);
  return { src: s, zaloha: orig && orig !== s ? orig : null };
}

/**
 * Odkazy zoznamu, ako sa nakreslia. `sObrazkom`: obrázkový odkaz bez obrázka
 * sa na webe vynechá. Mimo režimu úprav vráti len viditeľné a úplné.
 */
export function useVolneOdkazy(zoznam: VolneOdkazy | undefined, sObrazkom: boolean): { odkazy: OdkazNaWebe[]; viditelne: boolean } {
  const { rozriesene, upravy } = useVzhlad();
  const j: Jazyk = jazyk();
  const polozky = zoznam?.polozky ?? [];

  /* Články zo základného vzhľadu (len slovenský slug) — preklad adresy. */
  const naPreklad = polozky
    .map((o) => (o.ciel?.druh === 'clanok' ? clanokVJazyku(o.ciel.clanok, rozriesene, j) : null))
    .filter((c): c is NonNullable<typeof c> => !!c && c.prelozit)
    .map((c) => c.slug);
  const klucPrekladu = j !== 'sk' && naPreklad.length ? `${j}|${naPreklad.join('|')}` : '';
  const [preklady, setPreklady] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!klucPrekladu) return;
    let zrusene = false;
    const [jz, ...slugy] = klucPrekladu.split('|');
    anglickeSlugy(slugy, jz as Jazyk)
      .then((m) => { if (!zrusene) setPreklady(m); })
      .catch(() => { /* ostanú slovenské adresy */ });
    return () => { zrusene = true; };
  }, [klucPrekladu]);

  const odkazy = useMemo(() => polozky.map((o): OdkazNaWebe => {
    let href: string | null = null;
    if (o.ciel?.druh === 'clanok') {
      const c = clanokVJazyku(o.ciel.clanok, rozriesene, j);
      if (c) href = c.prelozit ? (preklady[c.slug] ? odkaz(`/blog/${preklady[c.slug]}`, j) : odkaz(`/blog/${c.slug}`, 'sk')) : odkaz(`/blog/${c.slug}`, j);
    } else if (o.ciel) {
      href = adresaCiela(o.ciel, rozriesene, j);
    }
    const obr = src(o.obrazok, rozriesene);
    const skryty = !o.viditelny || !href || (sObrazkom && !obr.src);
    return { o, href, src: obr.src, zaloha: obr.zaloha, pozicia: poziciaObrazka(o.obrazok), skryty };
  }).filter((x) => upravy || !x.skryty), [polozky, rozriesene, j, preklady, sObrazkom, upravy]);

  return { odkazy, viditelne: zoznam?.viditelne !== false };
}

/** Obrázok odkazu; keď sa súbor z knižnice nenačíta, nastúpi originál. */
function ObrazokOdkazu({ x, trieda }: { x: OdkazNaWebe; trieda: string }) {
  return (
    <span className={trieda}>
      {x.src && (
        <img
          src={x.src}
          alt=""
          loading="lazy"
          decoding="async"
          style={x.pozicia ? { objectPosition: x.pozicia } : undefined}
          onError={priChybeVymen(x.zaloha ? { src: x.zaloha } : null)}
        />
      )}
    </span>
  );
}

/* ───────────────────────── K2: rad pod hľadaním ───────────────────────── */

export function RadOdkazov({ trieda }: { trieda?: string }) {
  const { vzhlad, upravy } = useVzhlad();
  const { odkazy, viditelne } = useVolneOdkazy(vzhlad.domov.odkazy, true);
  if ((!viditelne || !odkazy.length) && !upravy) return null;
  return (
    <nav
      className={trieda ? `lodk ${trieda}` : 'lodk'}
      aria-label={t('Užitočné odkazy')}
      data-vw={vw(upravy, 'odkazy')}
      data-vw-skryte={vwSkryte(upravy, !viditelne)}
    >
      <ul className="lodk-rad" style={{ '--lodk-n': odkazy.length, '--lodk-s': Math.max(5, odkazy.length) } as CSSProperties}>
        {odkazy.map((x) => (
          <li key={x.o.id}>
            <a
              className="lodk-polozka"
              href={x.href ?? undefined}
              data-vw={vw(upravy, `odkaz:${x.o.id}`)}
              data-vw-skryte={vwSkryte(upravy, x.skryty)}
            >
              <ObrazokOdkazu x={x} trieda="lodk-ram" />
              <span className="lodk-text">{textVzhladu(x.o.text)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ───────────────────────── K3: pod činnosťou ───────────────────────── */

export function TlacidlaCinnosti() {
  const { vzhlad, upravy } = useVzhlad();
  const { odkazy, viditelne } = useVolneOdkazy(vzhlad.cinnost.tlacidla, true);
  if ((!viditelne || !odkazy.length) && !upravy) return null;
  return (
    <ul
      className="lcin-tlacidla"
      data-pocet={odkazy.length}
      data-vw={vw(upravy, 'tlacidla')}
      data-vw-skryte={vwSkryte(upravy, !viditelne)}
    >
      {odkazy.map((x) => (
        <li key={x.o.id} className={x.o.hlavny ? 'is-hlavne' : undefined}>
          <a
            className="lcin-tlacidlo"
            href={x.href ?? undefined}
            data-vw={vw(upravy, `tlacidlo:${x.o.id}`)}
            data-vw-skryte={vwSkryte(upravy, x.skryty)}
          >
            <ObrazokOdkazu x={x} trieda="lcin-tlacidlo-ram" />
            <span className="lcin-tlacidlo-text">{textVzhladu(x.o.text)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function OdkazyCinnosti() {
  const { vzhlad, upravy } = useVzhlad();
  const { odkazy, viditelne } = useVolneOdkazy(vzhlad.cinnost.odkazy, false);
  if ((!viditelne || !odkazy.length) && !upravy) return null;
  return (
    <ul
      className="lcin-odkazy"
      aria-label={t('Ďalšie odkazy')}
      data-vw={vw(upravy, 'odkazy-cinnosti')}
      data-vw-skryte={vwSkryte(upravy, !viditelne)}
    >
      {odkazy.map((x) => (
        <li key={x.o.id}>
          <a
            href={x.href ?? undefined}
            data-vw={vw(upravy, `odkaz-cinnosti:${x.o.id}`)}
            data-vw-skryte={vwSkryte(upravy, x.skryty)}
          >
            {textVzhladu(x.o.text)}
          </a>
        </li>
      ))}
    </ul>
  );
}
