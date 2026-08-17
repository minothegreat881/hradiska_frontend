/**
 * Zjednoduší štátnu hranicu Slovenska do podoby, ktorú unesie stránka.
 *
 * Spúšťa sa RUČNE, výsledok (`src/components/mapaHranica.ts`) je v projekte:
 *
 *   node scripts/gen-mapa-hranica.mjs
 *
 * Predloha je z pipeline `relief-mapa-sk` (geoBoundaries, ADM0) a má vyše
 * 41 000 bodov — to je pre kresbu čiary v prehliadači zbytočne veľa. Ramer–
 * Douglas–Peucker nechá tvar a zahodí body, ktoré z neho nič neuberajú.
 *
 * Prečo to vôbec treba: na satelitnej snímke nie je vidieť, kde krajina
 * končí. Na reliéfe to povie sama kresba (dlaždice končia na hranici), na
 * snímke nie.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ZDROJ = process.argv[2]
  || 'C:/Users/milan/Desktop/Git-Projects/relief-mapa-sk/data/sk_boundary.geojson';
/** Tolerancia v stupňoch. ~0,002° je na rovnobežke Slovenska asi 150 m. */
const TOL = 0.002;

/** Ramer–Douglas–Peucker: zahodí body, ktoré ležia takmer na spojnici. */
const zjednodus = (body, tol) => {
  if (body.length < 3) return body;
  let maxD = 0, idx = 0;
  const [ax, ay] = body[0], [bx, by] = body[body.length - 1];
  const dx = bx - ax, dy = by - ay;
  const dlzka = Math.hypot(dx, dy) || 1e-12;
  for (let i = 1; i < body.length - 1; i++) {
    const [x, y] = body[i];
    const d = Math.abs(dy * x - dx * y + bx * ay - by * ax) / dlzka;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= tol) return [body[0], body[body.length - 1]];
  return [
    ...zjednodus(body.slice(0, idx + 1), tol).slice(0, -1),
    ...zjednodus(body.slice(idx), tol),
  ];
};

if (!existsSync(ZDROJ)) {
  console.error('Nenašiel som predlohu:', ZDROJ);
  console.error('Predloha je v projekte relief-mapa-sk (data/sk_boundary.geojson).');
  process.exit(1);
}

const g = JSON.parse(readFileSync(ZDROJ, 'utf8'));
const f = (g.features || [g])[0];
const polygony = f.geometry.type === 'MultiPolygon'
  ? f.geometry.coordinates
  : [f.geometry.coordinates];

const spolu = (a) => (Array.isArray(a[0]) ? a.reduce((s, x) => s + spolu(x), 0) : 1);
console.log('bodov v predlohe:', spolu(f.geometry.coordinates));

/** Prstenec začína a končí v tom istom bode — spojnica prvého a posledného
    má potom nulovú dĺžku a metóda by celý tvar zahodila. Preto sa najprv
    rozdelí v bode najvzdialenejšom od začiatku a zjednodušia sa obe polovice. */
const zjednodusPrstenec = (ring, tol) => {
  const b = ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.slice(0, -1) : ring;
  if (b.length < 4) return b;
  let idx = 0, maxD = -1;
  for (let i = 1; i < b.length; i++) {
    const d = Math.hypot(b[i][0] - b[0][0], b[i][1] - b[0][1]);
    if (d > maxD) { maxD = d; idx = i; }
  }
  const a = zjednodus(b.slice(0, idx + 1), tol);
  const c = zjednodus(b.slice(idx), tol);
  return [...a.slice(0, -1), ...c, b[0]];
};

/* Zaujíma nás len obrys — diery vo vnútri (ak nejaké sú) na čiaru netreba. */
const ciary = polygony
  .map(p => zjednodusPrstenec(p[0].map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]), TOL))
  /* Ostrovčeky z generalizácie preč — hranica je jeden ťah. */
  .filter(c => c.length > 40)
  .sort((a, b) => b.length - a.length);

console.log('čiar:', ciary.length, '· bodov po zjednodušení:', ciary.reduce((s, c) => s + c.length, 0));

const file = `/* VYGENEROVANÉ — needituj ručne.
 * Štátna hranica Slovenska, zjednodušená pre kreslenie v prehliadači.
 * Zdroj: geoBoundaries (ADM0) cez pipeline relief-mapa-sk.
 * Pregeneruje: node scripts/gen-mapa-hranica.mjs
 *
 * Načo: na satelitnej snímke nie je vidieť, kde krajina končí. Na reliéfe to
 * povie sama kresba — dlaždice končia na hranici — na snímke nie.
 */
export const HRANICA_SK: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: { type: 'MultiLineString', coordinates: ${JSON.stringify(ciary)} },
    },
  ],
};
`;
writeFileSync('src/components/mapaHranica.ts', file, 'utf8');
console.log('zapísané do src/components/mapaHranica.ts');
