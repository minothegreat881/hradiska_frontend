'use client';

/**
 * Plávajúce tlačidlo, ktoré otvára nástroj na pripomienky.
 *
 * Toto je JEDINÉ, čo sa načíta dopredu — a aj to len vtedy, keď je
 * v prehliadači uložené prihlásenie do administrácie. Bežný čitateľ nestiahne
 * ani tlačidlo, ani nástroj. O skutočných právach rozhoduje server: keby si
 * niekto kľúč do prehliadača podvrhol, Strapi mu vráti 403 a panel ostane
 * prázdny (písať sa aj tak nedá).
 *
 * Samotný nástroj sa dotiahne až po prvom kliknutí (`lazyStale`, aby stará
 * karta po nasadení novej verzie nespadla na chýbajúcom súbore).
 */

import { Suspense, useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { lazyStale } from '../lib/lazyStale';
import { adminToken } from './api';

const Nastroj = lazyStale(() => import('./Nastroj').then((m) => ({ default: m.Nastroj })));

export function PripomienkyDock() {
  const [jeRedaktor, setJeRedaktor] = useState(false);
  const [otvorene, setOtvorene] = useState(false);

  useEffect(() => {
    // Lacná kontrola bez volania na server: je vôbec uložený admin token?
    setJeRedaktor(!!adminToken());
    // Odkaz z administrácie otvorí nástroj rovno.
    if (new URLSearchParams(window.location.search).get('pripomienka')) setOtvorene(true);
  }, []);

  if (!jeRedaktor) return null;

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
