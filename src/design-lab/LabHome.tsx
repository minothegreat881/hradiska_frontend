'use client';

/**
 * Domovská stránka. Nahradila pôvodnú `HomePage.tsx`, ktorá je zmazaná.
 *
 * Skladba:
 *
 *   úvod (titulok → dlaždice kategórií → hľadanie) → sekcie v poradí
 *   z vzhľadu webu (dnes mapa → ďalší obsah → činnosť → zápisy z kroniky)
 *
 * Úvod je vždy prvý — dlaždice a hľadanie sú jeho súčasťou a dajú sa len
 * skryť. Sekcie pod ním sa dajú presúvať a skrývať (`domov.sekcie`); typy
 * sekcií sú pevný zoznam, neznámy sa preskočí. „Pridajte sa k nám" vykresľuje
 * `App` hneď za touto stránkou ako samostatný komponent.
 */

import { Fragment, useEffect, useState } from 'react';
import { HeroSearch } from '../components/HeroSearch';
import { InkEffect } from '../components/InkEffect';
import LabAktuality from './LabAktuality';
import { MapaAzKedTreba } from './MapaAzKedTreba';
import { LabCinnost } from './LabCinnost';
import LabKategorieRychle from './LabKategorieRychle';
import LabDalsiObsah from './LabDalsiObsah';
import { anglickeSlugy } from '../lib/strapi';
import { jazyk, poSlovensky, t, odkaz } from '../lib/jazyk';
import { useVzhlad } from '../lib/vzhlad/VzhladContext';
import { clanokVJazyku } from '../lib/vzhlad/citaj';
import { textVzhladu } from '../lib/vzhlad/texty';
import { adresaObrazka } from '../lib/vzhlad/obrazky';
import { vw, vwSkryte } from '../lib/vzhlad/upravy';
import type { SekciaDomov } from '../lib/vzhlad/typy';

export function LabHome() {
  const { vzhlad, rozriesene, upravy } = useVzhlad();
  const { uvod, hladanie } = vzhlad.domov;
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
  const znak = uvod.znak ? adresaObrazka(uvod.znak, 'original', rozriesene) : null;
  const subor = uvod.znak && 'id' in uvod.znak ? rozriesene.subory[String(uvod.znak.id)] : undefined;

  const sekciaDomova = (s: SekciaDomov) => {
    if (!s.viditelna && !upravy) return null;
    const skryte = vwSkryte(upravy, !s.viditelna);
    switch (s.typ) {
      case 'mapa':
        /* Mapa. Tá istá, aká beží v produkcii — po odsúhlasení nahradila 3D
           scénu v Three.js aj na ostrej domovskej. Stojí hneď pod hľadaním,
           lebo odpovedá na tú istú otázku — „kde mám hradisko blízko" — len
           ukázaním namiesto vypísaním.

           Na plátne editora sa mapa NENAČÍTA (1,1 MB a pozorovateľ, ktorý
           v iframe nenabehne) — miesto drží zástupný blok rovnakej výšky. */
        if (upravy) {
          return (
            <section key={s.id} className="relative lhome-mapa" data-vw={`sekcia:${s.id}`} data-vw-skryte={skryte}>
              <div className="vw-mapa-zastup" aria-hidden="true"><span>Mapa</span></div>
            </section>
          );
        }
        return <MapaAzKedTreba key={s.id} className="relative lhome-mapa" />;
      case 'dalsi-obsah':
        /* Kategórie, ktoré nemajú dlaždicu nad mapou — každá s radom
           najnovších (alebo vybraných) článkov. */
        return <LabDalsiObsah key={s.id} sekcia={s} />;
      case 'cinnost':
        /* Činnosť združenia. Tabule a 3D rekonštrukcie sa tu dnes VYNECHÁVAJÚ
           (`naDomovskej`): majú vlastný rad článkov v „Ďalšom obsahu" o kus
           vyššie, takže by na jednej obrazovke stáli dvakrát. Zvyšných päť
           činností sú práve zápisy kroniky, takže blok stojí tesne pred ňou
           a je do nej dverami. */
        return (
          <section key={s.id} className="lhome-cinnost" data-vw={vw(upravy, `sekcia:${s.id}`)} data-vw-skryte={skryte}>
            <LabCinnost naDomovskej />
          </section>
        );
      case 'kronika':
        return <LabAktuality key={s.id} sekcia={s} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen parchment relative" data-vw-upravy={upravy ? '1' : undefined}>
      <InkEffect />

      {/* Titulná časť. Pôvodne tu pod titulkom visela rekonštrukcia hradiska
          v pasparte (handoff „Múzejná tabuľa", návrh 2b). Odišla: odkedy sú
          pod titulkom dlaždice kategórií, bol to druhý veľký obraz v rade
          a odtláčal hľadanie aj mapu pod prehyb. Súbor ostáva — je to
          og:image webu.

          Písmo a farby sú z tokenov webu (Fraunces, pečatná červená), nie
          z handoffu (Playfair Display, #b3402a) — inak by domovská stránka
          mala iný atrament než zvyšok webu a fonty by sa museli ťahať
          z Google CDN, ktoré sme kvôli GDPR zrušili. */}
      <section className="lhero-sekcia">
        {/* Prekrížené kopije z listu maliarky (akvarel, 2026). Kreslí sa
            cez `mix-blend-mode: multiply`, takže biely papier okolo maľby
            splynie s papierovým pozadím stránky a ostanú len farby —
            vyrezávať pozadie by pri akvareli zožralo aj svetlé ťahy.
            Vzhľad môže znak vymeniť (`domov.uvod.znak`); bez neho kopije. */}
        {znak ? (
          <picture className="lhero-znak" data-vw={vw(upravy, 'uvod:znak')}>
            <img src={znak} alt="" aria-hidden="true" width={subor?.width ?? undefined} height={subor?.height ?? undefined} decoding="async" />
          </picture>
        ) : (
          <picture className="lhero-znak" data-vw={vw(upravy, 'uvod:znak')}>
            <source srcSet="/znak_kopije.webp" type="image/webp" />
            <img src="/znak_kopije.png" alt="" aria-hidden="true" width={320} height={183} decoding="async" />
          </picture>
        )}

        <p className="lhero-nadciara" data-vw={vw(upravy, 'uvod:nadtitulok')}>
          <span aria-hidden="true" />
          {textVzhladu(uvod.nadtitulok)}
          <span aria-hidden="true" />
        </p>

        <h1 className="lhero-titul" data-vw={vw(upravy, 'uvod:nadpis')}>{textVzhladu(uvod.nadpis)}</h1>

        {/* Rozcestník kategórií hneď pod titulkom — deväť kresieb, po ktorých
            sa dá vojsť do webu skôr, než návštevník začne čítať. */}
        <LabKategorieRychle />

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
      </section>

      {vzhlad.domov.sekcie.map(sekciaDomova)}
    </div>
  );
}

export default LabHome;
