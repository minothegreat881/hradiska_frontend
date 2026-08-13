'use client';

/**
 * Domovská stránka v laboratóriu. Vznikla preto, že pás „Zo života združenia"
 * sedí UPROSTRED `HomePage` — kategórie a výzvu stačilo skryť a dokresliť za
 * ňu, ale pás sa takto nahradiť nedá bez toho, aby skončil na konci stránky.
 *
 * PRODUKCIA SA NEDOTÝKA: `HomePage.tsx` ostáva nezmenená a téma `Pôvodná` ju
 * naďalej vykresľuje. Tu je tá istá skladba, len s labovým pásom:
 *
 *   titulná fotografia → searchbar → zápisy z kroniky → mapa
 *
 * Kategórie a „Pridajte sa k nám" nasledujú v `DesignLab` ako samostatné
 * labové komponenty, takže poradie stránky ostáva zachované.
 */

import { HeroSearch } from '../components/HeroSearch';
import { InkEffect } from '../components/InkEffect';
import LabAktuality from './LabAktuality';
import LabMapa from './LabMapa';

export function LabHome() {
  return (
    <div className="min-h-screen parchment relative">
      <InkEffect />

      {/* Hero */}
      <section className="relative" style={{ zIndex: 30 }}>
        <div className="container relative pt-8 md:pt-12 pb-8 md:pb-16">
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: 'var(--hr-frame)' }}>
            <picture>
              <source srcSet="/img_header_hradiska_03.webp" type="image/webp" />
              <img
                src="/img_header_hradiska_03.jpg"
                alt="Slovanské hradiská — pohľad na opevnenie a život na hradisku"
                width={1329}
                height={752}
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto object-contain"
                style={{ display: 'block' }}
              />
            </picture>
          </div>

          <div className="mt-6 md:mt-12 px-4 md:px-2">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-60" aria-hidden="true">
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, var(--hr-line-quiet))' }} />
              <span style={{ color: 'var(--hr-line-quiet)', fontSize: 12, lineHeight: 1 }}>⚜</span>
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, var(--hr-line-quiet), transparent)' }} />
            </div>
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
