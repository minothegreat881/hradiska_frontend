/**
 * PREVOD DNEŠNÉHO STAVU (F3) — zo základného vzhľadu (konštanty v kóde)
 * vyrobí vzhľad v1, ktorý sa dá uložiť do backendu ako koncept a zverejniť.
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
/* better-sqlite3 je v node_modules backendu (web ho nepotrebuje). */
const BACKEND_BALIK = arg('--backend-balik', 'C:/Users/milan/Desktop/Git-Projects/hradiska-strapi-zaklad/package.json');

const { ZAKLADNY_VZHLAD } = await nacitajTs('src/lib/vzhlad/zakladny.ts');
const { prekladZoSlovnika } = await nacitajTs('src/lib/jazyk.ts');

async function getJson(cesta) {
  const r = await fetch(`${API}${cesta}`);
  if (!r.ok) throw new Error(`GET ${cesta} → HTTP ${r.status}`);
  return r.json();
}

/* ── Kategórie z databázy (poradie tak, ako ho vracia API a kreslí web) ── */
const kat = (await getJson('/api/blog-categories?sort=order:asc&pagination[pageSize]=100')).data;
const katPodlaSlugu = new Map(kat.map((k) => [k.slug, k]));

/* ── Články, na ktoré sa vzhľad odkazuje (slovenské slugy) ── */
const slugyClankov = new Set();
const cestyObrazkov = new Set();
(function zber(x) {
  if (!x || typeof x !== 'object') return;
  if (Array.isArray(x)) { x.forEach(zber); return; }
  for (const [k, v] of Object.entries(x)) {
    if ((k === 'clanok' || k === 'uvodnyClanok') && v && typeof v === 'object' && 'slug' in v) slugyClankov.add(v.slug);
    if (k === 'pripnute' || k === 'clanky') for (const c of Array.isArray(v) ? v : []) if (c && typeof c === 'object' && 'slug' in c && !('kategoria' in c)) slugyClankov.add(c.slug);
    if (v && typeof v === 'object' && typeof v.cesta === 'string' && v.cesta.startsWith('/uploads/')) cestyObrazkov.add(v.cesta);
    zber(v);
  }
})(ZAKLADNY_VZHLAD);

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

/* ── Prevod ── */
const preklad = (sk, j) => (sk ? prekladZoSlovnika(sk, j) : null);
/** Text so slovenčinou → výslovné en/de zo slovníka (null, keď slovník nemá). */
const text = (t) => {
  if (!t || typeof t.sk !== 'string') return t;
  const en = t.en ?? preklad(t.sk, 'en');
  const de = t.de ?? preklad(t.sk, 'de');
  return { sk: t.sk, en: en ?? null, de: de ?? null, enZo: en != null ? t.sk : null, deZo: de != null ? t.sk : null };
};
/** Krátky názov v menu: slovník sa NEPOUŽÍVA (doslovný preklad skratky nedáva zmysel). */
const textVolitelny = (t) => t && ({
  sk: t.sk ?? null, en: t.en ?? null, de: t.de ?? null,
  enZo: t.en != null ? t.sk ?? null : null, deZo: t.de != null ? t.sk ?? null : null,
});
const odkazKat = (k) => ({ dokument: katPodlaSlugu.get(k.slug)?.documentId ?? null, slug: k.slug });
const odkazCl = (c) => ({ dokument: clankySk.get(c.slug)?.documentId ?? null, slug: c.slug });
const obrazok = (o) => {
  if (!o || !o.cesta || !o.cesta.startsWith('/uploads/')) return o;
  const id = suborPodlaUrl.get(o.cesta);
  return id ? { id, ...(o.pozicia ? { pozicia: o.pozicia } : {}) } : o;
};

const Z = structuredClone(ZAKLADNY_VZHLAD);
const d = Z.domov;
const v1 = {
  schema: Z.schema,
  domov: {
    uvod: { nadtitulok: text(d.uvod.nadtitulok), nadpis: text(d.uvod.nadpis), znak: obrazok(d.uvod.znak) },
    dlazdice: {
      viditelne: d.dlazdice.viditelne,
      skupiny: d.dlazdice.skupiny.map((s) => ({
        id: s.id, nadpis: s.nadpis ? text(s.nadpis) : null,
        polozky: s.polozky.map((p) => ({ id: p.id, kategoria: odkazKat(p.kategoria), pocet: p.pocet })),
      })),
    },
    hladanie: {
      viditelne: d.hladanie.viditelne,
      vyzva: text(d.hladanie.vyzva),
      popularneViditelne: d.hladanie.popularneViditelne,
      popularne: d.hladanie.popularne.map((p) => ({ text: text(p.text), clanok: odkazCl(p.clanok) })),
    },
    sekcie: d.sekcie.map((s) => {
      if (s.typ === 'dalsi-obsah') {
        return {
          ...s, nadpis: text(s.nadpis),
          riadky: s.riadky.map((r) => ({
            ...r, kategoria: odkazKat(r.kategoria), nadpis: r.nadpis ? text(r.nadpis) : null,
            clanky: r.clanky.map(odkazCl), obrazky: r.obrazky.map((o) => ({ clanok: odkazCl(o.clanok), obrazok: obrazok(o.obrazok) })),
          })),
        };
      }
      if (s.typ === 'kronika') {
        return {
          ...s, uvodnyClanok: s.uvodnyClanok ? odkazCl(s.uvodnyClanok) : null,
          pripnute: s.pripnute.map(odkazCl), obrazok: obrazok(s.obrazok),
        };
      }
      return { ...s };
    }),
    fotogaleria: { fotky: fotkyGalerie },
    pridajteSa: {
      ...d.pridajteSa,
      nadtitulok: text(d.pridajteSa.nadtitulok), nadpis: text(d.pridajteSa.nadpis),
      citat: text(d.pridajteSa.citat), uvod: text(d.pridajteSa.uvod),
      prosby: d.pridajteSa.prosby.map((p) => ({ nadpis: text(p.nadpis), text: text(p.text) })),
    },
  },
  kategorie: [],
  cinnost: {
    nadpis: text(Z.cinnost.nadpis),
    polozky: Z.cinnost.polozky.map((p) => ({ ...p, nazov: text(p.nazov), popis: text(p.popis), obrazok: obrazok(p.obrazok) })),
  },
  menu: {
    poradie: kat.map((k) => ({ dokument: k.documentId, slug: k.slug })),
    hlavnyRiadok: Z.menu.hlavnyRiadok.map(odkazKat),
    skryte: Z.menu.skryte.map(odkazKat),
  },
  pata: {
    stlpce: Z.pata.stlpce.map((s) => ({
      ...s, nadpis: text(s.nadpis),
      odkazy: s.odkazy.map((o) => ({
        text: text(o.text),
        ciel: o.ciel.druh === 'kategoria' ? { druh: 'kategoria', kategoria: odkazKat(o.ciel.kategoria) }
          : o.ciel.druh === 'clanok' ? { druh: 'clanok', clanok: odkazCl(o.ciel.clanok) } : o.ciel,
      })),
    })),
    siete: Z.pata.siete.map((s) => ({ ...s })),
  },
};

/* Záznamy kategórií: z kódu + názov z databázy; kategória, ktorá v kóde nie
   je, dostane záznam len s údajmi z databázy (všetko ostatné „z DB"). */
const nazovZDb = (k) => {
  const en = preklad(k.name, 'en');
  const de = preklad(k.name, 'de');
  return { sk: k.name, en, de, enZo: en != null ? k.name : null, deZo: de != null ? k.name : null };
};
const zKodu = new Map(Z.kategorie.map((k) => [k.kategoria.slug, k]));
for (const k of kat) {
  const z = zKodu.get(k.slug);
  if (z) {
    v1.kategorie.push({
      kategoria: odkazKat(z.kategoria),
      nazov: nazovZDb(k),
      titulok: z.titulok ? text(z.titulok) : null,
      popisokDlazdice: text(z.popisokDlazdice),
      popisokMenu: z.popisokMenu ? textVolitelny(z.popisokMenu) : null,
      popis: z.popis ? text(z.popis) : null,
      obrazok: obrazok(z.obrazok),
      tvary: z.tvary ? { sk: z.tvary.sk, en: preklad(z.tvary.sk[2], 'en'), de: preklad(z.tvary.sk[2], 'de') } : null,
      clanky: { zoradenie: z.clanky.zoradenie, pripnute: z.clanky.pripnute.map(odkazCl) },
    });
  } else {
    v1.kategorie.push({
      kategoria: { dokument: k.documentId, slug: k.slug },
      nazov: nazovZDb(k),
      titulok: null,
      popisokDlazdice: nazovZDb(k),
      popisokMenu: null,
      popis: null,
      obrazok: null,
      tvary: null,
      clanky: { zoradenie: 'zverejnenie', pripnute: [] },
    });
  }
}
for (const z of Z.kategorie) if (!katPodlaSlugu.has(z.kategoria.slug)) console.warn(`[prevod] kategória ${z.kategoria.slug} z kódu v databáze nie je — vynechaná`);

/* Kontrola: v prevedenom vzhľade nesmie ostať žiadna cesta /uploads ani odkaz bez documentId. */
const zvysky = [];
(function kontrola(x, cesta) {
  if (!x || typeof x !== 'object') return;
  if (Array.isArray(x)) { x.forEach((y, i) => kontrola(y, `${cesta}[${i}]`)); return; }
  if (typeof x.cesta === 'string' && x.cesta.startsWith('/uploads/')) zvysky.push(`${cesta}: obrázok ostal cestou`);
  if ('dokument' in x && 'slug' in x && !x.dokument) zvysky.push(`${cesta}: ${x.slug} bez documentId`);
  for (const [k, v] of Object.entries(x)) kontrola(v, cesta ? `${cesta}.${k}` : k);
})(v1, '');

zapis('vzhlad-v1.json', v1);
console.log(`[prevod] vystup/vzhlad-v1.json: ${v1.kategorie.length} kategórií, ${slugyClankov.size} článkov, ${suborPodlaUrl.size} fotiek → id, galéria ${fotkyGalerie.length} fotiek`);
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
