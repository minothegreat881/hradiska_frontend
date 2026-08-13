/**
 * Vygeneruje public/sitemap.xml zo všetkých publikovaných článkov.
 *
 * Zdroj = backend /api/search-index (už vracia všetky slugy). Spúšťa sa pred
 * `vite build` (viď package.json). Fail-soft: keď Strapi nebeží, zapíše aspoň
 * statické stránky, aby build nespadol.
 *
 * ENV:
 *   SITE_URL          verejná doména webu (default https://hradiska.sk)
 *   VITE_STRAPI_URL   API backendu (default http://localhost:1337)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE = (process.env.SITE_URL || 'https://hradiska.sk').replace(/\/$/, '');
// Pri builde na Verceli ziadny localhost nebezi — `VITE_STRAPI_URL` tam nie je
// nastavena a fetch na 1337 padal, takze sa do mapy stranok zapisalo 11 URL
// a ZIADNY clanok. Rovnaka zaloha ako v `prerender.mjs`: backend na Hetzneri.
// Prepisatelne cez SITEMAP_STRAPI_URL (lokalne staci VITE_STRAPI_URL).
const STRAPI = (process.env.SITEMAP_STRAPI_URL || process.env.VITE_STRAPI_URL || 'http://188.245.47.29').replace(/\/$/, '');

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml');

// Statické cesty webu (verejné, indexovateľné). Bez /admin a účtových ciest.
const STATIC_PATHS = [
  '/', '/galeria', '/aktuality', '/about',
  '/hradiska', '/kultura', '/archeologia', '/pramene', '/pravek',
  '/ochrana-osobnych-udajov', '/podmienky-pouzivania',
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
    console.warn(`[sitemap] Strapi nedostupný (${e.message}) — zapisujem len statické stránky.`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, xml, 'utf8');
  console.log(`[sitemap] zapísané ${entries.length} URL (${articleCount} článkov) → public/sitemap.xml`);
}

main();
