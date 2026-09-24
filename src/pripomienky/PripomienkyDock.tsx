'use client';

/**
 * Plávajúce tlačidlo, ktoré otvára nástroj na pripomienky.
 *
 * Tlačidlo vidí KAŽDÝ, kto stránku otvorí — web je zatiaľ technický a ľudia,
 * ktorí naň dostanú odkaz, majú vedieť nahlásiť, čo im nesedí. Prihlásený
 * redaktor má navyše zmenu stavu a mazanie; o tom rozhoduje server.
 *
 * Dopredu sa načíta len toto tlačidlo. Samotný nástroj sa dotiahne až po
 * prvom kliknutí (`lazyStale`, aby stará karta po nasadení novej verzie
 * nespadla na chýbajúcom súbore).
 */

import { Suspense, useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { lazyStale } from '../lib/lazyStale';

const Nastroj = lazyStale(() => import('./Nastroj').then((m) => ({ default: m.Nastroj })));

export function PripomienkyDock() {
  const [otvorene, setOtvorene] = useState(false);

  useEffect(() => {
    // Odkaz z administrácie otvorí nástroj rovno.
    if (new URLSearchParams(window.location.search).get('pripomienka')) setOtvorene(true);
  }, []);

  return (
    <>
      {!otvorene && (
        <button className="pr-dock" onClick={() => setOtvorene(true)} title="Pripomienky k tejto stránke">
          <MessageSquarePlus className="w-4 h-4" />
          <span>Pripomienky</span>
        </button>
      )}
      {otvorene && (
        <Suspense fallback={null}>
          <Nastroj onZavri={() => setOtvorene(false)} />
        </Suspense>
      )}
    </>
  );
}

export default PripomienkyDock;
