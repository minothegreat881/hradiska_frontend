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

      {/* Titulná doska.

          NÁZOV UŽ NIE JE V OBRÁZKU. Predtým bol: zlaté 3D písmo a tabuľka
          „WWW.HRADISKA.SK" boli namaľované v JPEGu, takže sa nedali označiť,
          na telefóne sa nezmenšovali, pri prechode na doménu by sa museli
          prekresliť — a `h1` musel byť schovaný len pre čítačky, lebo skutočný
          nadpis stránky bol obrázok.

          Teraz je to živá typografia položená do oparu nad vodou. To miesto
          nie je vybrané od oka: z piatich kandidátskych plôch fotografie má
          najnižší rozptyl jasu (36 oproti 51 v korunách stromov), čiže je to
          jediná časť, kde písmo nesedí raz na svetlom a raz na tmavom.

          Na úzkej obrazovke nadpis z fotky zlieza pod ňu — cez pol obrázka by
          sa nedal prečítať ani s podkladom. */}
      <section className="relative" style={{ zIndex: 30 }}>
        <div className="container relative pt-8 md:pt-12 pb-8 md:pb-16">
          <figure className="lhero">
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

            <figcaption className="lhero-napis">
              <h1 className="lhero-titul">Slovanské<br />hradiská</h1>
              <span className="lhero-ciara" aria-hidden="true" />
              <p className="lhero-podtitul">Encyklopédia hradísk Slovenska</p>
            </figcaption>
          </figure>

          {/* Hľadanie drží šírku dosky. Cez celý obsahový pás sa rozťahovalo
              širšie než fotografia nad ním a obe hrany si prestali odpovedať. */}
          <div className="lhero-hladanie mt-6 md:mt-10 px-4 md:px-2">
            <HeroSearch />
          </div>
        </div>
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
