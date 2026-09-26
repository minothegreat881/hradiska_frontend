'use client';

/**
 * Mapa, ktorá sa pripojí až vtedy, keď sa k nej čitateľ vydá.
 *
 * Mapa je najdrahšia vec na stránke: knižnica MapLibre (274 kB) a k nej
 * 28–44 dlaždíc podkladu (272–486 kB, namerané). Stojí pod článkom aj pod
 * domovskou, takže veľká časť návštevníkov ju nikdy neuvidí — a predsa ju
 * sťahovali všetci.
 *
 * Prečo nestačí samotný `IntersectionObserver`: hneď po načítaní je telo
 * stránky ešte krátke, kotva sedí pár stoviek pixelov pod okrajom a
 * pozorovateľ sa spustí aj bez toho, aby sa čitateľ pohol. Preto sa čaká na
 * PRVÝ POSUN stránky a až potom sa zapína pozorovateľ s predstihom 400 px.
 * Kto zostane hore, nestiahne nič; kto sa vydá dole, má mapu pripravenú skôr,
 * než k nej dôjde.
 *
 * Miesto si drží prázdna sekcia, takže sa pod ňou nič nepreskupuje.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { lazyStale } from '../lib/lazyStale';

const LabMapa = lazyStale(() => import('./LabMapa'));

export function MapaAzKedTreba({ className = 'lart-mapa' }: { className?: string }) {
  const kotva = useRef<HTMLElement>(null);
  const [zobrazit, setZobrazit] = useState(false);

  useEffect(() => {
    if (zobrazit) return;
    if (typeof IntersectionObserver === 'undefined') { setZobrazit(true); return; }

    let io: IntersectionObserver | null = null;

    const zapniPozorovatela = () => {
      window.removeEventListener('scroll', zapniPozorovatela);
      const el = kotva.current;
      if (!el || io) return;
      io = new IntersectionObserver(
        (zaznamy) => {
          if (zaznamy.some((z) => z.isIntersecting)) {
            setZobrazit(true);
            io?.disconnect();
          }
        },
        { rootMargin: '400px' }
      );
      io.observe(el);
    };

    // Ak stránka už nie je na začiatku (návrat späť, odkaz s kotvou), netreba čakať.
    if (window.scrollY > 0) zapniPozorovatela();
    else window.addEventListener('scroll', zapniPozorovatela, { passive: true, once: true });

    return () => {
      window.removeEventListener('scroll', zapniPozorovatela);
      io?.disconnect();
    };
  }, [zobrazit]);

  return (
    <section className={className} ref={kotva}>
      {zobrazit && (
        <Suspense fallback={null}>
          <LabMapa />
        </Suspense>
      )}
    </section>
  );
}

export default MapaAzKedTreba;
