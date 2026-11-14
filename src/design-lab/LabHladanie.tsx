'use client';

import { Fragment, useEffect, useState } from 'react';
import { HeroSearch } from '../components/HeroSearch';
import { anglickeSlugy } from '../lib/strapi';
import { jazyk, poSlovensky, t, odkaz } from '../lib/jazyk';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { clanokVJazyku } from '../lib/vzhlad/citaj';
import { textVzhladu } from '../lib/vzhlad/texty';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';

/**
 * Hľadanie: výzva, pole a populárne hradiská. Na domovskej stojí v úvode pod
 * dlaždicami, pod článkom v bloku „ako na domovskej“ (požiadavka K5) — jedna
 * súčasť, aby sa obe miesta nerozišli.
 */
export function BlokHladania() {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const { hladanie } = vzhlad.domov;
  const j = jazyk();

  /* Ukážkové hradiská pod hľadaním. Článok má v každom jazyku vlastný slug:
     vzhľad z API ho nesie rovno (`rozriesene.clanky`), základný vzhľad pozná
     len slovenský — ten sa dohľadá z dát ako doteraz. Kým odpoveď nepríde,
     odkaz vedie na slovenskú verziu, ktorá existuje vždy. */
  const popularne = hladanie.popularne
    .map((p) => ({ text: p.text, clanok: clanokVJazyku(p.clanok, rozriesene, j) }))
    .filter((p): p is { text: typeof p.text; clanok: NonNullable<typeof p.clanok> } => !!p.clanok);
  const naPreklad = popularne.filter((p) => p.clanok.prelozit).map((p) => p.clanok.slug);
  const klucPrekladu = naPreklad.length ? `${j}|${naPreklad.join('|')}` : '';
  const [preklady, setPreklady] = useState<Record<string, string>>({});
  useEffect(() => {
    if (poSlovensky() || !klucPrekladu) return;
    let zrusene = false;
    anglickeSlugy(klucPrekladu.split('|').slice(1), jazyk())
      .then((m) => { if (!zrusene) setPreklady(m); })
      .catch(() => { /* ostanú slovenské adresy */ });
    return () => { zrusene = true; };
  }, [klucPrekladu]);

  const hladanieVidno = hladanie.viditelne;
  const popularneVidno = hladanie.viditelne && hladanie.popularneViditelne && popularne.length > 0;

  return (
    <>
      {/* Hľadanie potrebuje vetu, inak je to pole bez zadania. „Vo svojom
          okolí" je zároveň jediná výzva, ktorá vedie k mape hneď pod ňou. */}
      {(hladanieVidno || upravy) && (
        <h2 className="lhero-vyzva" data-vw={vw(upravy, 'hladanie:vyzva')} data-vw-skryte={vwSkryte(upravy, !hladanieVidno)}>
          {textVzhladu(hladanie.vyzva)}
        </h2>
      )}

      {(hladanieVidno || upravy) && (
        <div className="lhero-hladanie" data-vw={vw(upravy, 'hladanie:pole')} data-vw-skryte={vwSkryte(upravy, !hladanieVidno)}>
          <HeroSearch />
        </div>
      )}

      {/* Handoff tu chcel „najnavštevovanejšie záznamy". Návštevnosť zatiaľ
          nemeriame, takže je to vybraný zoznam — keď pribudne analytika, dá
          sa nahradiť skutočným poradím. */}
      {(popularneVidno || upravy) && (
        <nav className="lhero-rychle" aria-label={t('Populárne hradiská')} data-vw={vw(upravy, 'popularne')} data-vw-skryte={vwSkryte(upravy, !popularneVidno)}>
          <span className="lhero-rychle-popis">{t('Populárne:')}</span>
          {popularne.map((p, i) => {
            const slug = p.clanok.prelozit ? (preklady[p.clanok.slug] || p.clanok.slug) : p.clanok.slug;
            return (
              <Fragment key={`${i}:${p.clanok.slug}`}>
                {i > 0 && <span aria-hidden="true">·</span>}
                <a href={odkaz(`/blog/${slug}`)} data-vw={vw(upravy, `popularne:${i}`)}>{textVzhladu(p.text)}</a>
              </Fragment>
            );
          })}
        </nav>
      )}
    </>
  );
}

export default BlokHladania;
