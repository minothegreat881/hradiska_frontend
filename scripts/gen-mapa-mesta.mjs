/**
 * Vygeneruje zoznam miest pre popisy na mape.
 *
 * Spúšťa sa RUČNE, nie pri builde — výsledok (`src/components/mapaMesta.ts`)
 * je v projekte, takže stránka za behu na nikom nezávisí:
 *
 *   node scripts/gen-mapa-mesta.mjs
 *
 * Zdroj: OpenStreetMap cez Overpass. Berie sa
 *   - zo Slovenska: mestá aj menšie mestá (`city`, `town`),
 *   - z okolia (kam siaha výrez pohybu): len veľké mestá a hlavné mestá,
 *     nech je podľa čoho umiestniť lokality za hranicou.
 *
 * Názov sa berie slovenský (`name:sk`), keď ho OSM pozná — Viedeň, Budapešť,
 * Krakov. Inak pôvodný.
 */
import { writeFileSync } from 'node:fs';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

/* Slovensko s malým presahom / celý výrez pohybu (juh, západ, sever, východ) */
const SK = [47.6, 16.7, 49.7, 22.7];
const OKOLIE = [45.0, 11.5, 55.6, 24.5];

const q = `[out:json][timeout:300];
(
  node["place"~"^(city|town|village)$"]["name"](${SK.join(',')});
  node["place"="city"]["name"](${OKOLIE.join(',')});
  node["place"="city"]["capital"="yes"]["name"](${OKOLIE.join(',')});
);
out body;`;

const pop = (t) => {
  const raw = (t.population || '').toString().replace(/[^0-9]/g, '');
  return raw ? parseInt(raw, 10) : 0;
};

const run = async () => {
  console.log('sťahujem z OpenStreetMap…');
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'hradiska.sk map labels generator (jednorazovo, kontakt cez hradiska.sk)',
    },
    body: 'data=' + encodeURIComponent(q),
  });
  if (!res.ok) throw new Error('Overpass: ' + res.status);
  const json = await res.json();
  console.log('uzlov:', json.elements.length);

  const inSK = (lat, lng) => lat > SK[0] && lat < SK[2] && lng > SK[1] && lng < SK[3];

  const rows = [];
  for (const e of json.elements) {
    const t = e.tags || {};
    const name = t['name:sk'] || t.name;
    if (!name) continue;
    const p = pop(t);
    const doma = inSK(e.lat, e.lon);
    const hlavne = t.capital === 'yes';

    /* Zo zahraničia len to, čo naozaj pomôže zorientovať sa: hlavné mestá
       a veľkomestá. Inak by bola mapa okolo Slovenska hustejšia než ono. */
    if (!doma && !hlavne && p < 150000) continue;
    /* Obce sa berú len z domu a len tie, ktoré niečo znamenajú v teréne —
       zvyšok by pri priblížení mapu zaplavil. */
    if (doma && t.place === 'village' && p < 700) continue;

    rows.push({ name, lat: +e.lat.toFixed(4), lng: +e.lon.toFixed(4), pop: p, doma, hlavne });
  }

  /* Zhodné názvy z viacerých uzlov (OSM ich občas má) — nechá sa väčší. */
  const byName = new Map();
  for (const r of rows) {
    const k = r.name + '|' + Math.round(r.lat * 4) + '|' + Math.round(r.lng * 4);
    const prev = byName.get(k);
    if (!prev || r.pop > prev.pop) byName.set(k, r);
  }
  const all = [...byName.values()].sort((a, b) => b.pop - a.pop);

  /* Od akého priblíženia sa názov ukáže. Rebríček je podľa veľkosti, aby
     mapa pri oddialení niesla len to najväčšie a pri približovaní pribúdalo. */
  const stupen = (r) => {
    if (r.hlavne || r.pop >= 200000) return 0;   // Bratislava, Košice, Viedeň, Budapešť…
    if (r.pop >= 70000) return 1;                // krajské mestá
    if (r.pop >= 30000) return 2;
    if (r.pop >= 12000) return 3;
    if (r.pop >= 3000) return 4;                 // menšie mestá
    return 5;                                    // obce, až celkom zblízka
  };

  const out = all.map(r => ({ n: r.name, y: r.lat, x: r.lng, r: stupen(r) }));
  const pocty = [0, 1, 2, 3, 4, 5].map(s => out.filter(o => o.r === s).length);
  console.log('miest:', out.length, '· po stupňoch:', pocty.join(' / '));

  const file = `/* VYGENEROVANÉ — needituj ručne.
 * Zdroj: OpenStreetMap (Overpass), © prispievatelia OpenStreetMap, ODbL.
 * Pregeneruje: node scripts/gen-mapa-mesta.mjs
 *
 * \`r\` je stupeň dôležitosti (0 = najväčšie). Podľa neho sa rozhoduje, od
 * akého priblíženia sa názov na mape ukáže — pozri MAPA_MESTA_ZOOM.
 */
export type Mesto = { n: string; y: number; x: number; r: number };

/** Od akého priblíženia sa ukáže ktorý stupeň. */
export const MAPA_MESTA_ZOOM = [0, 6.6, 7.6, 8.6, 9.6, 10.4];

export const MESTA: Mesto[] = ${JSON.stringify(out)
    .replace(/\},\{/g, '},\n  {')
    .replace(/^\[/, '[\n  ')
    .replace(/\]$/, ',\n]')};
`;
  writeFileSync('src/components/mapaMesta.ts', file, 'utf8');
  console.log('zapísané do src/components/mapaMesta.ts');
};

run().catch(e => { console.error('ZLYHALO:', e.message); process.exit(1); });
