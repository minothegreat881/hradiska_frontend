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
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

/* Hranica Slovenska — podľa nej sa rozhoduje, čo je doma. Bez nej by sa do
   výberu dostali aj poľské, maďarské a české mestá pri hranici, lebo obdĺžnik
   okolo Slovenska ich nevyhnutne zahŕňa. */
const HRANICA = 'C:/Users/milan/Desktop/Git-Projects/relief-mapa-sk/data/sk_boundary.geojson';
const prstence = (() => {
  if (!existsSync(HRANICA)) {
    console.error('Nenašiel som hranicu:', HRANICA);
    process.exit(1);
  }
  const g = JSON.parse(readFileSync(HRANICA, 'utf8'));
  const f = (g.features || [g])[0];
  const polygony = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
  return polygony.map(p => p[0]).filter(r => r.length > 40);
})();

/** Leží bod vnútri hranice? Vrhanie lúča cez všetky prstence. */
const doma = (lng, lat) => {
  for (const ring of prstence) {
    let vnutri = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) vnutri = !vnutri;
    }
    if (vnutri) return true;
  }
  return false;
};

/* Overpass býva preťažený a vracia 504. Skúšame viac serverov a viac ráz;
   keď nepochodí ani jeden, prefiltruje sa už stiahnutý zoznam podľa hranice
   (bez siete) — to je presne to, čo tento beh potrebuje. */
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

/* Slovensko s malým presahom / celý výrez pohybu (juh, západ, sever, východ) */
const SK = [47.6, 16.7, 49.7, 22.7];
const OKOLIE = [45.0, 11.5, 55.6, 24.5];

/* Sťahujú sa už len sídla z obdĺžnika okolo Slovenska; presné odsitovanie
   robí hranica nižšie. Zahraničné mestá sa nesťahujú vôbec — na mape rušili
   (Olomouc, Zlín, Užhorod, Miškovec, Bielsko-Biała) a k slovenským hradiskám
   nič nehovoria. */
const q = `[out:json][timeout:300];
node["place"~"^(city|town|village)$"]["name"](${SK.join(',')});
out body;`;

const pop = (t) => {
  const raw = (t.population || '').toString().replace(/[^0-9]/g, '');
  return raw ? parseInt(raw, 10) : 0;
};

const run = async () => {
  console.log('sťahujem z OpenStreetMap…');
  let json = null;
  for (const server of OVERPASS) {
    for (let pokus = 1; pokus <= 2 && !json; pokus++) {
      try {
        const res = await fetch(server, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'hradiska.sk map labels generator (jednorazovo, kontakt cez hradiska.sk)',
          },
          body: 'data=' + encodeURIComponent(q),
        });
        if (res.ok) { json = await res.json(); break; }
        console.log(`  ${server} → ${res.status}, skúšam ďalej`);
      } catch (e) { console.log(`  ${server} → ${e.message}`); }
      await new Promise(r => setTimeout(r, 4000));
    }
    if (json) break;
  }

  if (!json) {
    /* Bez siete: prefiltrovať to, čo už v projekte je. */
    console.log('Overpass nedostupný — filtrujem existujúci zoznam podľa hranice.');
    const stary = readFileSync('src/components/mapaMesta.ts', 'utf8');
    const zaciatok = stary.indexOf('MESTA: Mesto[] = ') + 'MESTA: Mesto[] = '.length;
    const surove = stary.slice(zaciatok).trim().replace(/;$/, '');
    const pole = JSON.parse(surove.replace(/,\s*\]$/, ']'));
    const ostava = pole.filter(m => doma(m.x, m.y));
    console.log(`  ${pole.length} → ${ostava.length} (zahraničné preč)`);
    zapis(ostava);
    return;
  }
  console.log('uzlov:', json.elements.length);

  const inSK = (lat, lng) => lat > SK[0] && lat < SK[2] && lng > SK[1] && lng < SK[3];

  const rows = [];
  for (const e of json.elements) {
    const t = e.tags || {};
    const name = t['name:sk'] || t.name;
    if (!name) continue;
    const p = pop(t);
    /* Nie obdĺžnik, ale skutočná hranica. */
    if (!doma(e.lon, e.lat)) continue;
    const hlavne = t.capital === 'yes';

    /* Obce len tie, ktoré niečo znamenajú v teréne — zvyšok by pri
       priblížení mapu zaplavil. */
    if (t.place === 'village' && p < 700) continue;

    rows.push({ name, lat: +e.lat.toFixed(4), lng: +e.lon.toFixed(4), pop: p, doma, hlavne });
  }

  /* ── Dvojníci ───────────────────────────────────────────────────────── */
  /* Ten istý názov kúsok od seba = jedno miesto zapísané dvakrát. Typicky
     dvojmestá cez rieku: Komárno a maďarský Komárom, ktorý sa po slovensky
     tiež volá Komárno — na mape z toho boli dva popisy vedľa seba. Ostane
     väčší z nich. Rovnaké názvy ĎALEKO od seba sú v poriadku, takých obcí
     máme veľa a sú to naozaj rôzne miesta. */
  const BLIZKO_KM = 30;
  const km = (a, b) => {
    const dy = (a.lat - b.lat) * 111;
    const dx = (a.lng - b.lng) * 111 * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180);
    return Math.hypot(dx, dy);
  };
  const zoradene = [...rows].sort((a, b) => b.pop - a.pop);
  const all = [];
  let zahodene = 0;
  for (const r of zoradene) {
    if (all.some(x => x.name === r.name && km(x, r) < BLIZKO_KM)) { zahodene++; continue; }
    all.push(r);
  }
  console.log('zlúčených dvojníkov:', zahodene);

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

  zapis(out);
};

function zapis(out) {
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
}

run().catch(e => { console.error('ZLYHALO:', e.message); process.exit(1); });
