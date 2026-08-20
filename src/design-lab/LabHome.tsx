'use client';

/**
 * Domovská stránka. Nahradila pôvodnú `HomePage.tsx`, ktorá je zmazaná.
 *
 * Skladba:
 *
 *   titulná fotografia → searchbar → zápisy z kroniky → mapa
 *
 * Kategórie a „Pridajte sa k nám" vykresľuje `App` hneď za ňou ako
 * samostatné komponenty, takže poradie stránky ostáva zachované.
 */

import { HeroSearch } from '../components/HeroSearch';
import { InkEffect } from '../components/InkEffect';
import LabAktuality from './LabAktuality';
import LabMapa from './LabMapa';

export function LabHome() {
  return (
    <div className="min-h-screen parchment relative">
      <InkEffect />

      {/* Titulná časť podľa handoffu „Múzejná tabuľa" (návrh 2b).

          Oproti variantu 2a je titulok NAD obrazom a snímka nemá cez seba
          nič — žiadny text, žiadny závoj, žiadne vysvetlené pole. Obraz je
          v pasparte s popiskou, teda presne tak, ako visí obrazová príloha
          v múzeu. Web je encyklopédia, takže tomuto rozvrhnutiu rozumie lepšie
          než banneru s nápisom cez fotografiu.

          Vedľajší zisk je technický: v centrovanom stĺpci s bočným odsadením
          96 px a paspartou 14 px vychádza obraz pri návrhovej šírke na
          ~1220 px, čo je presne rozlíšenie predlohy (1217). Nikde sa neťahá
          nahor, takže ostáva ostrý.

          Písmo a farby sú z tokenov webu (Fraunces, pečatná červená), nie
          z handoffu (Playfair Display, #b3402a) — inak by domovská stránka
          mala iný atrament než zvyšok webu a fonty by sa museli ťahať
          z Google CDN, ktoré sme kvôli GDPR zrušili. */}
      <section className="lhero-sekcia">
        <p className="lhero-nadciara">
          <span aria-hidden="true" />
          Encyklopédia hradísk Slovenska
          <span aria-hidden="true" />
        </p>

        <h1 className="lhero-titul">Slovanské hradiská</h1>

        <figure className="lhero-tabula">
          {/* Pasparta je vlastný prvok, popiska leží POD ňou na papieri —
              tak, ako visí obrazová príloha pod rámom, nie v ňom. `figure`
              obopína oboje, aby popiska ostala viazaná na obraz aj pre
              čítačky. */}
          <div className="lhero-ram">
            <picture>
              <source srcSet="/img_header_hradiska_04.webp" type="image/webp" />
              <img
                src="/img_header_hradiska_04.jpg"
                alt="Rekonštrukcia slovanského hradiska: opevnená akropola nad riekou, pod ňou podhradie s obydliami za palisádou"
                width={1217}
                height={761}
                fetchPriority="high"
                decoding="async"
                className="lhero-obraz"
              />
            </picture>
          </div>
        </figure>

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

      <LabAktuality />

      {/* Mapa. Tá istá, aká beží v produkcii — po odsúhlasení nahradila 3D
          scénu v Three.js aj na ostrej domovskej. */}
      <section className="relative" style={{ zIndex: 5 }}>
        <LabMapa />
      </section>
    </div>
  );
}

export default LabHome;
