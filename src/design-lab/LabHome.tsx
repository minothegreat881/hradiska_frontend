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

      {/* Titulná časť podľa handoffu „Celé hradisko" (návrh 2a).

          Skladba je prevzatá: ilustrácia cez celú šírku a NEOREZANÁ, titulok
          vpravo hore na svetlom poli obrazu, hľadanie preložené cez spodnú
          hranu snímky a pod ním riadok populárnych odkazov.

          DVE VECI SÚ INAK, ZÁMERNE:

          1. Svetlé pole pod titulkom nie je vyretušované do fotografie, ale
             kreslené v CSS. Predloha z handoffu má pravú polovicu vybielenú
             natrvalo — val aj hradba tam stratili kresbu. Takto sa dá hustota
             hmly kedykoľvek doladiť a fotografia ostane nedotknutá.

          2. Písmo a farby sú z tokenov webu (Fraunces, pečatná červená), nie
             z handoffu (Playfair Display, #b3402a). Handoff opisuje vlastnú
             paletu; keby sme ju vzali len sem, domovská stránka by mala iný
             atrament než zvyšok webu — a fonty by sa museli ťahať z Google
             CDN, ktoré sme kvôli GDPR zámerne zrušili.

          Rozmery, odsadenia a pomery sú z handoffu prepočítané na návrhovú
          šírku 1440 px: titulok 92/1440 = 6,4vw, odsadenie 56 px a 64 px,
          linka 64 × 3 px, prekrytie hľadania −36 px. */}
      <section className="lhero-sekcia">
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

        {/* Hľadanie sedí na spodnej hrane snímky, nie pod ňou — tým sa obraz
            a nástroj čítajú ako jeden celok. */}
        <div className="lhero-hladanie">
          <HeroSearch />
        </div>

        {/* Handoff tu chcel „najnavštevovanejšie záznamy". Návštevnosť zatiaľ
            nemeriame, takže je to vybraný zoznam — štyri lokality, ktoré má
            zmysel ponúknuť ako prvé. Keď pribudne analytika, dá sa nahradiť
            skutočným poradím. */
        }
        <nav className="lhero-rychle" aria-label="Populárne hradiská">
          <span className="lhero-rychle-popis">Populárne:</span>
          <a href="/blog/bojna-vyznamne-velkomoravske-centrum">Bojná</a>
          <span aria-hidden="true">·</span>
          <a href="/blog/devin">Devín</a>
          <span aria-hidden="true">·</span>
          <a href="/blog/molpir">Molpír</a>
          <span aria-hidden="true">·</span>
          <a href="/blog/pobedim">Pobedim</a>
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
