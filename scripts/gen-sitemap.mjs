/**
 * Vygeneruje public/sitemap.xml zo všetkých publikovaných článkov.
 *
 * Zdroj = backend /api/search-index (už vracia všetky slugy). Spúšťa sa pred
 * `vite build` (viď package.json). Fail-soft: keď Strapi nebeží, zapíše aspoň
 * statické stránky, aby build nespadol.
 *
 * ENV:
 *   SITE_URL          verejná doména webu (default https://hradiska.sk)
 *   SITEMAP_STRAPI_URL  API backendu (default produkcia na Hetzneri)
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE = (process.env.SITE_URL || 'https://hradiska.sk').replace(/\/$/, '');
// Pri builde na Verceli ziadny localhost nebezi — `VITE_STRAPI_URL` tam nie je
// nastavena a fetch na 1337 padal, takze sa do mapy stranok zapisalo 11 URL
// a ZIADNY clanok. Rovnaka zaloha ako v `prerender.mjs`: backend na Hetzneri.
// `VITE_STRAPI_URL` sa tu UŽ NEPOUŽÍVA: na Verceli je nastavená a mierila inam,
// takže stiahnutie zlyhávalo. Rovnaké poradie ako `prerender.mjs` — ten funguje.
// Lokálne proti vlastnému Strapi: SITEMAP_STRAPI_URL=http://localhost:1337.
const STRAPI = (process.env.SITEMAP_STRAPI_URL || process.env.PRERENDER_STRAPI_URL || 'http://188.245.47.29').replace(/\/$/, '');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');

// Statické cesty webu (verejné, indexovateľné). Bez /admin a účtových ciest.
const STATIC_PATHS = [
  '/', '/galeria', '/aktuality',
  '/hradiska', '/kultura', '/archeologia', '/pramene', '/pravek',
  '/ochrana-osobnych-udajov', '/podmienky-pouzivania', '/aplikacia',
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function urlEntry(path, priority) {
  return `  <url>\n    <loc>${esc(SITE + path)}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const entries = [];
  for (const p of STATIC_PATHS) entries.push(urlEntry(p, p === '/' ? '1.0' : '0.7'));

  let articleCount = 0;
  try {
    const res = await fetch(`${STRAPI}/api/search-index`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    for (const it of json.items || []) {
      if (!it.slug) continue;
      entries.push(urlEntry(`/blog/${it.slug}`, '0.8'));
      articleCount++;
    }
  } catch (e) {
    /* NEPREPISOVAŤ dobrý súbor zlým. Toto sa už raz stalo: na Verceli
       stiahnutie zlyhalo, vetva „fail-soft" prepísala vygenerovanú mapu
       jedenástimi statickými adresami a web mal na produkcii mapu stránok
       bez jediného článku. Keď v repe mapa s článkami je, nechá sa tak. */
    console.warn(`[sitemap] Strapi nedostupný (${e.message}).`);
    if (existsSync(outPath) && readFileSync(outPath, 'utf8').includes('/blog/')) {
      console.warn('[sitemap] Nechávam pôvodnú mapu stránok — má v sebe články.');
      return;
    }
    console.warn('[sitemap] Zapisujem len statické stránky.');
  }

  /* Anglické verzie článkov. Keď ešte nie sú, nič sa nepridá. */
  let anglickych = 0;
  try {
    /* STRÁNKOVAŤ. Strapi má strop `pageSize` 100, takže `500` ticho vráti
       prvú stovku — mapa stránok potom mlčky vynechá zvyšok prekladov. */
    for (let page = 1; page <= 20; page++) {
      const r = await fetch(`${STRAPI}/api/blog-posts?locale=en&pagination[page]=${page}&pagination[pageSize]=100&fields[0]=slug`);
      if (!r.ok) break;
      const j = await r.json();
      const davka = j.data || [];
      for (const p of davka) { entries.push(urlEntry(`/en/blog/${p.slug}`, '0.8')); anglickych++; }
      const celkom = j.meta?.pagination?.total ?? 0;
      if (davka.length < 100 || anglickych >= celkom) break;
    }
  } catch { /* bez angličtiny sa mapa stránok zapíše ďalej */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] zapísané ${entries.length} URL (${articleCount} slovenských + ${anglickych} anglických) → public/sitemap.xml`);
}

main();
