'use client';

/**
 * MINI-MAPA LOKALITY v bočnom stĺpci článku.
 *
 * DVA POKUSY PREDTÝM, oba zle:
 *   1. MapLibre naklonená o 60° („3D mapa") — snímka bez popisov, značka sa
 *      pri približovaní plazila po mape (naklonená kamera) a 274 kB knižnice
 *      pri každom článku.
 *   2. Rámec z Google Máp — popisy aj značka boli v poriadku, ale do malého
 *      okienka Google natlačil svoje ovládanie: šípky, lupy, tlačidlo
 *      „Otvoriť v Mapách" a dole pruh „Údaje máp · Podmienky · Nahlásiť
 *      chybu mapy". Z mapky veľkej ako dlaň tak bola zmes gombíkov a jediné,
 *      čo na nej nebolo vidieť, bola krajina. Orezať sa to nedá — uvedenie
 *      zdroja musí v rámci ostať.
 *
 * TOTO JE TRETÍ, A NAJTICHŠÍ: jeden statický obrázok. Satelitná snímka
 * s vrstvou popisov (obce, rieky, cesty) a NAŠA značka presne v strede —
 * obrázok je na súradnice vycentrovaný, takže značka sedí vždy a nemá sa
 * kam pohnúť. Žiadne gombíky, žiadny rámec, žiadna knižnica. Kto chce
 * mapu ovládať, klikne — otvorí sa v Google Mapách, kde na to je miesto.
 *
 * Výrez je 8 km široký: dosť na to, aby boli v ňom susedné obce (teda
 * „kde to je"), a dosť blízko, aby bolo vidieť samotný kopec.
 */

import { ExternalLink } from 'lucide-react';

/** Šírka výrezu v metroch. Dosť na susedné obce, dosť blízko na samotný kopec. */
const SIRKA_M = 8000;
/** Snímka sa pýta väčšia, než je plocha v paneli — kvôli jemným displejom. */
const SNIMKA = { w: 1000, h: 580 };
/**
 * Popisy sa pýtajú MALÉ, zhruba v tej veľkosti, v akej sa aj zobrazia.
 * Dôvod: Esri kreslí názvy pevnou veľkosťou v pixeloch obrázka. Keby sa
 * vykreslili do tisícpixelovej snímky a tá sa potom stlačila na 378 px
 * v paneli, z desaťbodového písma ostanú štyri body a nikto ich neprečíta
 * (presne to bolo na prvom pokuse vidieť). Takto vyjdú v prirodzenej
 * veľkosti; snímka pod nimi ostáva ostrá, lebo tá sa sťahuje veľká.
 */
const POPISY = { w: 400, h: 232 };

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';

/** Zemepisné súradnice na metre vo Web Mercatore — v tom počíta aj Esri. */
function naMercator(lat: number, lng: number) {
  const x = (lng * 20037508.34) / 180;
  const y = (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) * (20037508.34 / 180);
  return { x, y };
}

export function MiniMap({ coordinates, locationName }: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const { lat, lng } = coordinates;
  const { x, y } = naMercator(lat, lng);
  const dx = SIRKA_M / 2;
  const dy = (dx * SNIMKA.h) / SNIMKA.w;
  /* Ten istý výrez pre obe vrstvy — tým sa prekryjú presne na seba,
     aj keď má každá iný počet pixelov. */
  const vyrez = `bbox=${x - dx},${y - dy},${x + dx},${y + dy}&bboxSR=3857&imageSR=3857&f=image`;

  const snimka = `${ESRI}/World_Imagery/MapServer/export?${vyrez}&size=${SNIMKA.w},${SNIMKA.h}&format=jpg`;
  /* Priehľadná vrstva s názvami obcí, riek a ciest. Bez nej je snímka pekná,
     ale nemá sa podľa čoho orientovať. */
  const popisy = `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/export?${vyrez}&size=${POPISY.w},${POPISY.h}&format=png32&transparent=true`;
  const vonku = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div>
      <a
        href={vonku}
        target="_blank"
        rel="noopener noreferrer"
        title={`${locationName} — otvoriť v Google Mapách`}
        className="lok-mapa"
      >
        <img className="lok-mapa-snimka" src={snimka} alt={`Satelitná snímka okolia — ${locationName}`} width={SNIMKA.w} height={SNIMKA.h} loading="lazy" decoding="async" />
        <img className="lok-mapa-popisy" src={popisy} alt="" aria-hidden="true" width={POPISY.w} height={POPISY.h} loading="lazy" decoding="async" />
        {/* Značka. Stojí v strede obrázka, lebo naň je mapa vycentrovaná —
            preto nepotrebuje prepočet a nemôže sa rozísť s polohou. */}
        <span className="lok-mapa-znacka" aria-hidden="true">
          <svg width="26" height="34" viewBox="0 0 26 34">
            <path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z"
                  fill="var(--hr-accent, #a6472a)" stroke="#fff" strokeWidth="2" />
            <circle cx="13" cy="13" r="4.6" fill="#fff" />
          </svg>
        </span>
        <span className="lok-mapa-zdroj">Esri · Maxar</span>
      </a>
      <span className="lok-mapa-odkaz">
        <a href={vonku} target="_blank" rel="noopener noreferrer">
          Otvoriť v Google Mapách <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </a>
      </span>
    </div>
  );
}

export default MiniMap;
