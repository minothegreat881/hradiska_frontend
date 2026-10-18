/**
 * PREVOD DNEŠNÉHO STAVU (F3) — zo základného vzhľadu (konštanty v kóde)
 * vyrobí vzhľad v1, ktorý sa dá uložiť do backendu ako koncept a zverejniť.
 *
 * Samotný prevod je v `src/lib/vzhlad/prevod.ts` (ten istý kód používa editor
 * vzhľadu v administrácii, tlačidlo „Založiť z dnešného webu“); tento skript
 * len zbiera údaje a zapisuje výstup.
 *
 * Čo sa mení oproti základnému vzhľadu (`src/lib/vzhlad/zakladny.ts`):
 *   • kategórie a články dostanú `dokument` (documentId) podľa slugu (sk),
 *   • fotky `/uploads/…` sa nahradia `{ id }` súboru z knižnice médií (podľa
 *     `url`); súbory webu (`/znak_minca.webp`) ostanú ako cesta,
 *   • texty dostanú VÝSLOVNÉ `en`/`de` zo slovníkov `lib/jazyk.ts`
 *     a `lib/slovnik-de.ts` — presne to, čo dnes vracia `t()`; `enZo`/`deZo`
 *     = slovenské znenie. Kde slovník preklad nemá, ostáva `null` (web vtedy
 *     ukáže slovenčinu ako dnes a editor to označí ako chýbajúci preklad),
 *   • `kategorie[].nazov` = názov z databázy (+ en/de cez slovník, ako
 *     `kategoria()`); pribudne záznam aj pre kategórie, ktoré v kóde nie sú,
 *   • `menu.poradie` = dnešné poradie z databázy (`order`, pri zhode tak, ako
 *     ich vracia API — tak ich kreslí aj web),
 *   • `domov.fotogaleria.fotky` = dnešná `domovska-galeria`.
 *
 * Zdroje (len čítanie): verejné API referenčného Strapi a kde nestačí
 * (knižnica médií nemá verejné API), jeho SQLite databáza otvorená `readonly`.
 *
 *   node scripts/vzhlad/prevod.mjs [--odpoved] [--api http://localhost:1338] [--db <cesta k data.db>]
 *                                  [--backend-balik <package.json backendu>] [--vystup vzhlad-v1.json]
 *
 * Výstup: scripts/vzhlad/vystup/vzhlad-v1.json, s `--odpoved` aj
 * vzhlad-v1-odpoved.json = celé `OdpovedVzhladu` (vzhľad + rozriešené súbory,
 * kategórie a články) na test zhody, režim 2.
 */
import { createRequire } from 'node:module';
import { nacitajTs } from './ts.mjs';
import { zapis } from './spolocne.mjs';

const a = process.argv.slice(2);
const arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const API = arg('--api', process.env.VZHLAD_BACKEND || 'http://localhost:1338').replace(/\/$/, '');
const DB = arg('--db', 'C:/Users/milan/Desktop/Git-Projects/hradiska-strapi-zaklad/.tmp/data.db');
const ODPOVED = a.includes('--odpoved');
/* Meno výstupu v `vystup/` — test editora si prevod robí do vlastného súboru. */
const VYSTUP = arg('--vystup', 'vzhlad-v1.json');
/* better-sqlite3 je v node_modules backendu (web ho nepotrebuje). */
const BACKEND_BALIK = arg('--backend-balik', 'C:/Users/milan/Desktop/Git-Projects/hradiska-strapi-zaklad/package.json');

const { ZAKLADNY_VZHLAD } = await nacitajTs('src/lib/vzhlad/zakladny.ts');
const { prevedVzhlad, odkazyZakladneho } = await nacitajTs('src/lib/vzhlad/prevod.ts');
const { prekladZoSlovnika } = await nacitajTs('src/lib/jazyk.ts');

async function getJson(cesta) {
  const r = await fetch(`${API}${cesta}`);
  if (!r.ok) throw new Error(`GET ${cesta} → HTTP ${r.status}`);
  return r.json();
}

/* ── Kategórie z databázy (poradie tak, ako ho vracia API a kreslí web) ── */
const kat = (await getJson('/api/blog-categories?sort=order:asc&pagination[pageSize]=100')).data;

/* ── Články a obrázky, na ktoré sa odkazuje základný vzhľad ── */
const { slugyClankov, cestyObrazkov } = odkazyZakladneho(ZAKLADNY_VZHLAD);

const clankySk = new Map();
{
  const q = [...slugyClankov].map((s, i) => `filters[slug][$in][${i}]=${encodeURIComponent(s)}`).join('&');
  const r = await getJson(`/api/blog-posts?${q}&locale=sk&pagination[pageSize]=100&fields[0]=slug&fields[1]=title&populate[coverImage][fields][0]=id`);
  for (const p of r.data) clankySk.set(p.slug, p);
}
const chybajuce = [...slugyClankov].filter((s) => !clankySk.has(s));
if (chybajuce.length) console.warn(`[prevod] články, ktoré v databáze nie sú (ostanú bez documentId): ${chybajuce.join(', ')}`);

/* Ten istý článok v každom jazyku (documentId je spoločný). */
const clankyVJazykoch = {};
for (const j of ['sk', 'en', 'de']) {
  const dok = [...clankySk.values()].map((p) => p.documentId);
  if (!dok.length) break;
  const q = dok.map((d, i) => `filters[documentId][$in][${i}]=${d}`).join('&');
  const r = await getJson(`/api/blog-posts?${q}&locale=${j}&pagination[pageSize]=100&fields[0]=slug&fields[1]=title&populate[coverImage][fields][0]=id`);
  for (const p of r.data) {
    (clankyVJazykoch[p.documentId] ||= {})[j] = { slug: p.slug, nazov: p.title, obrazok: p.coverImage?.id ?? null };
  }
}

/* ── Súbory podľa cesty (knižnica médií nemá verejné API → DB len na čítanie) ── */
const require = createRequire(BACKEND_BALIK);
const Database = require('better-sqlite3');
const db = new Database(DB, { readonly: true, fileMustExist: true });
const suborPodlaUrl = new Map();
for (const url of cestyObrazkov) {
  const r = db.prepare('SELECT id FROM files WHERE url = ?').all(url);
  if (r.length !== 1) console.warn(`[prevod] súbor ${url}: ${r.length} záznamov — ${r.length ? 'beriem prvý' : 'ostáva cesta'}`);
  if (r.length) suborPodlaUrl.set(url, r[0].id);
}

/* ── Fotogaléria domovskej ── */
const galeria = (await getJson('/api/domovska-galeria?populate=fotky')).data;
const fotkyGalerie = (galeria?.fotky || []).map((f) => f.id);

/* ── Prevod (spoločná logika s editorom: src/lib/vzhlad/prevod.ts) ── */
const { vzhlad: v1, zvysky, chybajuceKategorie } = prevedVzhlad({
  zakladny: ZAKLADNY_VZHLAD,
  kategorie: kat,
  clanky: new Map([...clankySk].map(([slug, p]) => [slug, p.documentId])),
  subory: suborPodlaUrl,
  fotogaleria: fotkyGalerie,
  preklad: prekladZoSlovnika,
});
for (const slug of chybajuceKategorie) console.warn(`[prevod] kategória ${slug} z kódu v databáze nie je — vynechaná`);

zapis(VYSTUP, v1);
console.log(`[prevod] vystup/${VYSTUP}: ${v1.kategorie.length} kategórií, ${slugyClankov.size} článkov, ${suborPodlaUrl.size} fotiek → id, galéria ${fotkyGalerie.length} fotiek`);
if (zvysky.length) console.warn(`[prevod] POZOR, ${zvysky.length} neprevedených odkazov:\n  ${zvysky.join('\n  ')}`);

if (ODPOVED) {
  /* Rozriešené údaje tak, ako ich má vracať GET /api/vzhlad-webu. */
  const idSuborov = new Set();
  (function zberId(x, kluc) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach((y) => zberId(y, kluc)); return; }
    if (typeof x.id === 'number' && kluc !== 'kategorie' && Object.keys(x).every((k) => k === 'id' || k === 'pozicia')) idSuborov.add(x.id);
    for (const [k, v] of Object.entries(x)) zberId(v, k);
  })(v1, '');
  for (const id of fotkyGalerie) idSuborov.add(id);
  for (const vJ of Object.values(clankyVJazykoch)) for (const c of Object.values(vJ)) if (c.obrazok) idSuborov.add(c.obrazok);

  const subory = {};
  const dotaz = db.prepare('SELECT id, url, width, height, alternative_text AS alt, formats FROM files WHERE id = ?');
  for (const id of idSuborov) {
    const r = dotaz.get(id);
    if (!r) { console.warn(`[prevod] súbor ${id} v databáze nie je`); continue; }
    const f = JSON.parse(r.formats || '{}');
    const formats = {};
    for (const v of ['thumbnail', 'small', 'medium', 'large']) if (f[v]?.url) formats[v] = { url: f[v].url, width: f[v].width, height: f[v].height };
    subory[id] = { id: r.id, url: r.url, width: r.width ?? null, height: r.height ?? null, alt: r.alt ?? null, formats };
  }
  const kategorie = Object.fromEntries(kat.map((k) => [k.documentId, { slug: k.slug, nazov: k.name, poradie: k.order ?? 100 }]));
  const odpoved = { data: v1, verzia: 1, subory, kategorie, clanky: clankyVJazykoch };
  zapis('vzhlad-v1-odpoved.json', odpoved);
  console.log(`[prevod] vystup/vzhlad-v1-odpoved.json: ${Object.keys(subory).length} súborov, ${Object.keys(kategorie).length} kategórií, ${Object.keys(clankyVJazykoch).length} článkov (${(JSON.stringify(odpoved).length / 1024).toFixed(1)} kB)`);
}
db.close();
