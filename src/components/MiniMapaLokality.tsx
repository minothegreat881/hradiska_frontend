'use client';

/**
 * MINI-MAPA LOKALITY v bočnom stĺpci článku.
 *
 * ČO TU BOLO PREDTÝM a prečo to je preč: MapLibre so satelitnými dlaždicami
 * z Esri, naklonený o 60° („3D mapa"). Tri problémy naraz —
 *   • snímka bez poriadnych popisov: žiadne obce, cesty ani kóty, takže sa
 *     z nej nedalo vyčítať, KDE to vlastne je;
 *   • značka sa pri približovaní plazila po mape: pri naklonenej kamere
 *     sedí bod v inom mieste obrazovky než jeho zemepisná poloha;
 *   • 274 kB knižnice pri každom otvorení článku.
 *
 * Teraz je tu obyčajná satelitná mapa z Google Máp (`t=h` = snímka
 * s popismi), vložená ako rámec. Značku kreslí sama mapa, takže drží na
 * mieste pri akomkoľvek priblížení, a popisy obcí a ciest sú súčasťou
 * podkladu. Žiadna knižnica sa nesťahuje.
 *
 * POZNÁMKA O SÚKROMÍ: rámec je z domény Google, ktorá tým dostane IP adresu
 * čitateľa. Keby to raz malo prekážať, dá sa pred mapu dať medzikrok
 * „zobraziť mapu" — kód ostáva ten istý, len sa rámec vloží až po kliknutí.
 */

import { ExternalLink } from 'lucide-react';

export function MiniMap({ coordinates, locationName }: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const { lat, lng } = coordinates;
  /* `t=h` je hybrid — satelitná snímka S POPISMI (obce, cesty, kóty).
     Samotné `t=k` je holá snímka, na ktorej sa čitateľ nezorientuje.
     `q=` zároveň postaví značku presne na súradnice. */
  const ramec = `https://maps.google.com/maps?q=${lat},${lng}&t=h&z=14&hl=sk&output=embed`;
  /* Odkaz von vedie na to isté miesto v plnej mape — odtiaľ sa dá spustiť
     navigácia, čo je pri hradisku v teréne to hlavné. */
  const vonku = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div>
      <div
        className="relative w-full rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600 shadow-md"
        style={{ height: 220 }}
      >
        <iframe
          title={`Mapa — ${locationName}`}
          src={ramec}
          width="100%"
          height="100%"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <a
        href={vonku}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
          fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--hr-accent, #a6472a)',
          textDecoration: 'none',
        }}
      >
        Otvoriť v Google Mapách <ExternalLink className="w-3 h-3" aria-hidden="true" />
      </a>
      <p style={{ margin: '6px 0 0', fontFamily: 'var(--mono, monospace)', fontSize: 11, color: 'var(--hr-muted, #7a6b56)' }}>
        {lat.toFixed(5)}° N · {lng.toFixed(5)}° E
      </p>
    </div>
  );
}

export default MiniMap;
