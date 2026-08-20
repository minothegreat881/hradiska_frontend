/**
 * Zlúči výsledky agentov do jedného zoznamu lokalít a SKONTROLUJE ich.
 *
 * Agentom sa neverí na slovo. Kontroluje sa:
 *   1. či sedí počet a či sa žiadny slug nestratil ani nezdvojil,
 *   2. či sú `kraj` a `datovanie_skupina` z číselníka,
 *   3. či `datovanie_zdroj` NAOZAJ stojí v texte článku — to je poistka proti
 *      vymyslenému datovaniu, kvôli ktorej sa to pole vôbec pýtalo,
 *   4. či sa kraj nebije so súradnicami: bod v mnohouholníku proti hranici
 *      Slovenska rozhodne, či lokalita je alebo nie je „Mimo Slovenska".
 *
 *   node scripts/lokality-zluc.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const KAM = process.env.CLAUDE_JOB_DIR + '/tmp/lokality';

const KRAJE = ['Bratislavský', 'Trnavský', 'Trenčiansky', 'Nitriansky', 'Žilinský',
  'Banskobystrický', 'Prešovský', 'Košický', 'Mimo Slovenska'];
const SKUPINY = ['Pravek', 'Doba bronzová', 'Doba halštatská', 'Doba laténska', 'Doba rímska',
  '6.–7. storočie', '8.–9. storočie', '9. storočie', '9.–10. storočie',
  '10.–11. storočie', '11.–13. storočie'];

/* Bod v mnohouholníku — vystreľovanie lúča. Tá istá metóda, akou mapa
   rozhoduje, ktoré lokality ležia za hranicami. */
const hranica = JSON.parse(readFileSync('public/geo/slovakia_border.json', 'utf8'));
const prstenec = (hranica.geometry || hranica).coordinates[0];
function vSlovensku(lng, lat) {
  let dnu = false;
  for (let i = 0, j = prstenec.length - 1; i < prstenec.length; j = i++) {
    const [xi, yi] = prstenec[i], [xj, yj] = prstenec[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) dnu = !dnu;
  }
  return dnu;
}

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

const vstupy = new Map();
for (const f of readdirSync(KAM).filter((f) => /^davka-\d+\.json$/.test(f))) {
  for (const z of JSON.parse(readFileSync(`${KAM}/${f}`, 'utf8'))) vstupy.set(z.slug, z);
}

const vysledky = [];
const chybajuce = [];
for (const f of readdirSync(KAM).filter((f) => /^davka-\d+\.json$/.test(f))) {
  const von = f.replace('.json', '.vysledok.json');
  try { vysledky.push(...JSON.parse(readFileSync(`${KAM}/${von}`, 'utf8'))); }
  catch { chybajuce.push(von); }
}
if (chybajuce.length) console.log(`⚠ chýbajú výstupy: ${chybajuce.join(', ')}`);

const chyby = [];
const hotove = [];
const videne = new Set();

for (const v of vysledky) {
  const vstup = vstupy.get(v.slug);
  if (!vstup) { chyby.push(`neznámy slug: ${v.slug}`); continue; }
  if (videne.has(v.slug)) { chyby.push(`zdvojený slug: ${v.slug}`); continue; }
  videne.add(v.slug);

  if (!KRAJE.includes(v.kraj)) chyby.push(`${v.slug}: kraj mimo číselníka — „${v.kraj}"`);
  if (v.datovanie_skupina && !SKUPINY.includes(v.datovanie_skupina)) {
    chyby.push(`${v.slug}: skupina mimo číselníka — „${v.datovanie_skupina}"`);
  }
  if (v.datovanie_skupina && !v.datovanie_text) chyby.push(`${v.slug}: skupina bez krátkeho tvaru`);

  /* Poistka proti vymyslenému datovaniu.
     Doklad sa smie skladať z dvoch viet spojených výpustkou — vtedy sa
     overuje každá časť zvlášť. Pôvodná kontrola žiadala súvislý úsek
     a hlásila ako výmysel aj poctivý citát s vynechávkou. */
  if (v.datovanie_zdroj) {
    const casti = String(v.datovanie_zdroj).split(/…|\.\.\./).map(norm).filter((c) => c.length > 12);
    const text = norm(vstup.text);
    const chyba = casti.find((c) => !text.includes(c));
    if (chyba) chyby.push(`${v.slug}: doklad datovania NIE JE v texte článku — „${chyba.slice(0, 70)}…"`);
  } else if (v.datovanie_skupina) {
    chyby.push(`${v.slug}: datovanie bez dokladu`);
  }

  /* Kraj proti súradniciam.
     Hranica má 202 bodov, je zjednodušená — pri pohraničných lokalitách sa
     mýli o kilometre (Devín ležal „mimo" o 6,7 km). Preto tolerancia:
     rozpor sa hlási, až keď je bod od hranice ďalej než 15 km. Na skutočne
     zahraničné lokality to stačí, tie sú desiatky až stovky kilometrov preč. */
  const dnu = vSlovensku(vstup.lng, vstup.lat);
  const kmOdHranice = Math.min(...prstenec.map(([x, y]) =>
    Math.hypot((x - vstup.lng) * 73, (y - vstup.lat) * 111)));
  if (kmOdHranice > 15) {
    if (dnu && v.kraj === 'Mimo Slovenska') chyby.push(`${v.slug}: súradnice ležia na Slovensku (${kmOdHranice.toFixed(0)} km od hranice), ale kraj hovorí „Mimo Slovenska"`);
    if (!dnu && v.kraj !== 'Mimo Slovenska') chyby.push(`${v.slug}: súradnice ležia mimo Slovenska (${kmOdHranice.toFixed(0)} km od hranice), ale kraj hovorí „${v.kraj}"`);
  }

  hotove.push({
    slug: v.slug, nazov: vstup.nazov,
    kategoria: vstup.kategoria, kategoriaSlug: vstup.kategoriaSlug || null,
    miesto: vstup.miesto, okres: v.okres || null, kraj: v.kraj,
    lat: vstup.lat, lng: vstup.lng,
    datovanie_text: v.datovanie_text || null,
    datovanie_skupina: v.datovanie_skupina || null,
  });
}

for (const s of vstupy.keys()) if (!videne.has(s)) chyby.push(`chýba vo výsledkoch: ${s}`);

hotove.sort((a, b) => a.nazov.localeCompare(b.nazov, 'sk'));

console.log(`\nlokalít: ${hotove.length} z ${vstupy.size}`);
const sDatom = hotove.filter((x) => x.datovanie_skupina).length;
console.log(`s doloženým datovaním: ${sDatom} (${Math.round(sDatom / hotove.length * 100) || 0} %)`);
const poKrajoch = {};
for (const x of hotove) poKrajoch[x.kraj] = (poKrajoch[x.kraj] || 0) + 1;
console.log('po krajoch:', Object.entries(poKrajoch).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
const poSkupinach = {};
for (const x of hotove) if (x.datovanie_skupina) poSkupinach[x.datovanie_skupina] = (poSkupinach[x.datovanie_skupina] || 0) + 1;
console.log('po datovaní:', Object.entries(poSkupinach).map(([k, v]) => `${k} ${v}`).join(' · ') || '—');

if (chyby.length) {
  console.log(`\n✘ nálezy kontroly (${chyby.length}):`);
  for (const c of chyby) console.log('  ' + c);
} else console.log('\n✔ kontrola bez nálezov');

writeFileSync('src/data/lokality.json', JSON.stringify(hotove, null, 1) + '\n', 'utf8');
console.log('\nzapísané: src/data/lokality.json');
