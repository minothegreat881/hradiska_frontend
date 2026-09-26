'use client';

/**
 * Domovská stránka. Nahradila pôvodnú `HomePage.tsx`, ktorá je zmazaná.
 *
 * Skladba:
 *
 *   titulok → dlaždice kategórií → hľadanie → mapa → ďalší obsah →
 *   zápisy z kroniky
 *
 * Kategórie a „Pridajte sa k nám" vykresľuje `App` hneď za ňou ako
 * samostatné komponenty, takže poradie stránky ostáva zachované.
 */

import { HeroSearch } from '../components/HeroSearch';
import { InkEffect } from '../components/InkEffect';
import LabAktuality from './LabAktuality';
import { MapaAzKedTreba } from './MapaAzKedTreba';
import LabKategorieRychle from './LabKategorieRychle';
import LabDalsiObsah from './LabDalsiObsah';

export function LabHome() {
  return (
    <div className="min-h-screen parchment relative">
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
            vyrezávať pozadie by pri akvareli zožralo aj svetlé ťahy. */}
        <picture className="lhero-znak">
          <source srcSet="/znak_kopije.webp" type="image/webp" />
          <img src="/znak_kopije.png" alt="" aria-hidden="true" width={320} height={183} decoding="async" />
        </picture>

        <p className="lhero-nadciara">
          <span aria-hidden="true" />
          Encyklopédia hradísk Slovenska
          <span aria-hidden="true" />
        </p>

        <h1 className="lhero-titul">Slovanské hradiská</h1>

        {/* Rozcestník kategórií hneď pod titulkom — deväť kresieb, po ktorých
            sa dá vojsť do webu skôr, než návštevník začne čítať. */}
        <LabKategorieRychle />

        {/* Hľadanie potrebuje vetu, inak je to pole bez zadania. „Vo svojom
            okolí" je zároveň jediná výzva, ktorá vedie k mape hneď pod ňou. */}
        <h2 className="lhero-vyzva">Nájdi hradisko vo svojom okolí</h2>

        <div className="lhero-hladanie">
          <HeroSearch />
        </div>

        {/* Handoff tu chcel „najnavštevovanejšie záznamy". Návštevnosť zatiaľ
            nemeriame, takže je to vybraný zoznam — keď pribudne analytika, dá
            sa nahradiť skutočným poradím. */}
        <nav className="lhero-rychle" aria-label="Populárne hradiská">
          <span className="lhero-rychle-popis">Populárne:</span>
          <a href="/blog/bojna-vyznamne-velkomoravske-centrum">Bojná</a>
          <span aria-hidden="true">·</span>
          <a href="/blog/devin">Devín</a>
          <span aria-hidden="true">·</span>
          <a href="/blog/molpir">Molpír</a>
        </nav>
      </section>

      {/* Mapa. Tá istá, aká beží v produkcii — po odsúhlasení nahradila 3D
          scénu v Three.js aj na ostrej domovskej. Stojí hneď pod hľadaním,
          lebo odpovedá na tú istú otázku — „kde mám hradisko blízko" — len
          ukázaním namiesto vypísaním. */}
      <MapaAzKedTreba className="relative lhome-mapa" />

      {/* Kategórie, ktoré nemajú dlaždicu nad mapou — každá s radom štyroch
          najnovších článkov. */}
      <LabDalsiObsah />

      <LabAktuality />
    </div>
  );
}

export default LabHome;
