'use client';

/**
 * MINI-MAPA LOKALITY v bočnom stĺpci článku.
 *
 * TRI POKUSY, každý na inú chybu:
 *   1. MapLibre naklonená o 60° („3D mapa") — bez popisov, značka sa pri
 *      približovaní plazila po mape, 274 kB knižnice pri každom článku.
 *   2. Rámec z Google Máp — popisy aj značka v poriadku, ale do okienka
 *      veľkého ako dlaň natlačil Google svoje ovládanie a dolný pruh
 *      „Údaje máp · Podmienky · Nahlásiť chybu mapy".
 *   3. Jeden veľký obrázok z Esri `export` — ticho a čisto, LENŽE tú snímku
 *      Esri kreslí až na požiadanie: namerané 1,9 s na mobile a 8,3 s na
 *      počítači. Mapa sa preto „pomaly lúpala" pred očami.
 *
 * TOTO JE ŠTVRTÝ: mozaika z HOTOVÝCH dlaždíc. Tie isté dlaždice, aké ťahá
 * veľká mapa — ležia na CDN predpripravené, takže chodia v desiatkach
 * milisekúnd a nečaká sa na žiadne kreslenie. Skladajú sa dve vrstvy
 * (satelitná snímka a priehľadné popisy obcí, riek a ciest) a doprostred
 * ide naša značka: výrez je na súradnice vycentrovaný, takže značka sedí
 * vždy a nemá sa kam pohnúť.
 *
 * Mozaika sa ukáže NARAZ, až keď sú dlaždice doma — inak by sa mapa
 * skladala po štvorčekoch pred očami.
 */

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

/** Priblíženie. 13 ≈ 12,6 m na pixel u nás — výrez vyjde zhruba 7,5 km. */
const ZOOM = 13;
/** Rozmer výrezu v pixeloch mapy. Pomer strán drží aj rámček v stĺpci. */
const VYREZ = { w: 600, h: 348 };
const DLAZDICA = 256;

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
const SATELIT = `${ESRI}/World_Imagery/MapServer/tile`;
const POPISY = `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile`;

/** Zemepisné súradnice na pixel mapy pri danom priblížení. */
function naPixel(lat: number, lng: number, z: number) {
  const n = DLAZDICA * 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const s = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
  return { x, y };
}

export function MiniMap({ coordinates, locationName }: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const { lat, lng } = coordinates;
  const stred = naPixel(lat, lng, ZOOM);
  /* Ľavý horný roh výrezu v pixeloch mapy — od neho sa počítajú dlaždice. */
  const x0 = stred.x - VYREZ.w / 2;
  const y0 = stred.y - VYREZ.h / 2;

  const odX = Math.floor(x0 / DLAZDICA);
  const doX = Math.floor((x0 + VYREZ.w - 1) / DLAZDICA);
  const odY = Math.floor(y0 / DLAZDICA);
  const doY = Math.floor((y0 + VYREZ.h - 1) / DLAZDICA);

  const dlazdice: { tx: number; ty: number; left: number; top: number }[] = [];
  for (let ty = odY; ty <= doY; ty++) {
    for (let tx = odX; tx <= doX; tx++) {
      dlazdice.push({
        tx, ty,
        /* V percentách, nie v pixeloch — mozaika sa tak zmenší spolu
           s rámčekom a nepotrebuje merať šírku v JavaScripte. */
        left: ((tx * DLAZDICA - x0) / VYREZ.w) * 100,
        top: ((ty * DLAZDICA - y0) / VYREZ.h) * 100,
      });
    }
  }
  const sirka = (DLAZDICA / VYREZ.w) * 100;
  const vyska = (DLAZDICA / VYREZ.h) * 100;

  /* Mozaika sa odkryje, až keď je satelitná vrstva celá — inak sa mapa
     skladá po štvorčekoch. Popisy dosadnú spolu s ňou. */
  const [hotovych, setHotovych] = useState(0);
  const hotovo = hotovych >= dlazdice.length;

  const vonku = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const url = (zaklad: string, t: { tx: number; ty: number }) => `${zaklad}/${ZOOM}/${t.ty}/${t.tx}`;

  return (
    <div>
      <a
        href={vonku}
        target="_blank"
        rel="noopener noreferrer"
        title={`${locationName} — otvoriť v Google Mapách`}
        className={hotovo ? 'lok-mapa je-tu' : 'lok-mapa'}
      >
        <span className="lok-mapa-vrstva">
          {dlazdice.map((t) => (
            <img
              key={`s${t.tx}-${t.ty}`}
              src={url(SATELIT, t)}
              alt=""
              style={{ left: `${t.left}%`, top: `${t.top}%`, width: `${sirka}%`, height: `${vyska}%` }}
              loading="eager" decoding="async" {...{ fetchpriority: 'low' }}
              onLoad={() => setHotovych((n) => n + 1)}
              /* Chýbajúca dlaždica nesmie mapu nechať navždy skrytú. */
              onError={() => setHotovych((n) => n + 1)}
            />
          ))}
        </span>
        <span className="lok-mapa-vrstva lok-mapa-popisy" aria-hidden="true">
          {dlazdice.map((t) => (
            <img
              key={`p${t.tx}-${t.ty}`}
              src={url(POPISY, t)}
              alt=""
              style={{ left: `${t.left}%`, top: `${t.top}%`, width: `${sirka}%`, height: `${vyska}%` }}
              loading="eager" decoding="async" {...{ fetchpriority: 'low' }}
            />
          ))}
        </span>

        {/* Značka. Stojí v strede, lebo naň je výrez vycentrovaný — preto
            nepotrebuje prepočet a nemôže sa rozísť s polohou. */}
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
