/**
 * Prerender hlavičky (head) pre každú URL.
 *
 * Beží PO `vite build`. Nič nerenderuje z React komponentov (žiadny server-render
 * → žiadne riziko pádov Cesia/máp/motion). Iba vezme hotový dist/index.html
 * (SPA škrupinu) a pre každú URL z nej vyrobí kópiu s prepísaným <head>
 * (title, description, canonical, Open Graph, Twitter, JSON-LD) medzi značkami
 * seo:start/seo:end. Telo sa naďalej načíta JS-kom ako doteraz.
 *
 * Výstup: dist/blog/<slug>/index.html + dist/<static>/index.html.
 * Statické hostingy servujú tieto súbory na príslušných URL; SPA fallback ostáva
 * pre klientsku navigáciu.
 *
 * ENV: SITE_URL (default https://hradiska.sk), VITE_STRAPI_URL (build-fetch),
 *      MEDIA_URL (základ pre OG obrázky, default SITE_URL).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const SITE = (process.env.SITE_URL || 'https://hradiska.sk').replace(/\/$/, '');
const STRAPI = (process.env.VITE_STRAPI_URL || 'http://localhost:1337').replace(/\/$/, '');
const MEDIA = (process.env.MEDIA_URL || SITE).replace(/\/$/, '');
const DEFAULT_OG = `${SITE}/img_header_hradiska_02.png`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, '..', 'dist');
const shell = readFileSync(join(dist, 'index.html'), 'utf8');

const START = '<!--seo:start-->';
const END = '<!--seo:end-->';
if (!shell.includes(START) || !shell.includes(END)) {
  console.error('[prerender] V dist/index.html chýbajú značky seo:start/seo:end — preskakujem.');
  process.exit(0);
}
const before = shell.slice(0, shell.indexOf(START) + START.length);
const after = shell.slice(shell.indexOf(END));

const escAttr = (s) => String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escText = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const ORG = { '@type': 'Organization', name: 'Hradiská.sk', url: SITE + '/', logo: `${SITE}/logo_slovanske_hradiska_256.jpg` };

function buildHead({ title, description, canonical, ogType = 'website', image = DEFAULT_OG, publishedTime, ld = [] }) {
  const lines = [
    `<title>${escText(title)}</title>`,
    `<meta name="description" content="${escAttr(description)}" />`,
    `<link rel="canonical" href="${escAttr(canonical)}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:site_name" content="Hradiská.sk" />`,
    `<meta property="og:locale" content="sk_SK" />`,
    `<meta property="og:title" content="${escAttr(title)}" />`,
    `<meta property="og:description" content="${escAttr(description)}" />`,
    `<meta property="og:url" content="${escAttr(canonical)}" />`,
    `<meta property="og:image" content="${escAttr(image)}" />`,
  ];
  if (publishedTime) lines.push(`<meta property="article:published_time" content="${escAttr(publishedTime)}" />`);
  lines.push(
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escAttr(title)}" />`,
    `<meta name="twitter:description" content="${escAttr(description)}" />`,
    `<meta name="twitter:image" content="${escAttr(image)}" />`,
  );
  for (const o of ld) lines.push(jsonld(o));
  return lines.join('\n      ');
}

function writePage(urlPath, head) {
  const html = before + '\n      ' + head + '\n      ' + after;
  const dir = urlPath === '/' ? dist : join(dist, urlPath.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

// ── Statické stránky ─────────────────────────────────────────────────────────
const STATIC = [
  { path: '/', title: 'Hradiská.sk — encyklopédia slovanských hradísk na Slovensku', description: 'Encyklopédia slovanských a pravekých hradísk na Slovensku — dejiny, archeológia, lokality a pramene. Vyše 300 článkov o hradiskách, ich obyvateľoch a nálezoch.' },
  { path: '/hradiska', title: 'Hradiská na Slovensku — prehľad lokalít', description: 'Prehľad slovanských, keltských a pravekých hradísk na Slovensku — mocenské centrá, strážne hradiská, refugiá a ich dejiny.' },
  { path: '/kultura', title: 'Kultúra a život na hradiskách', description: 'Kultúra, remeslá, šperky, viera a každodenný život obyvateľov hradísk od praveku po včasný stredovek.' },
  { path: '/archeologia', title: 'Archeológia hradísk a nálezov', description: 'Archeologické výskumy, nálezy a odborné texty o hradiskách na Slovensku a v okolitých krajinách.' },
  { path: '/pramene', title: 'Písomné pramene a listiny', description: 'Dobové listiny, kroniky a písomné pramene k dejinám Veľkej Moravy, Nitrianskeho kniežatstva a Slovanov.' },
  { path: '/pravek', title: 'Praveké hradiská a kultúry', description: 'Praveké hradiská na Slovensku — lužická, púchovská, otomanská a ďalšie kultúry doby bronzovej a železnej.' },
  { path: '/mapa', title: 'Mapa hradísk Slovenska', description: 'Interaktívna mapa hradísk Slovanov, Keltov a iných kultúr na území Slovenska.' },
  { path: '/galeria', title: 'Galéria hradísk a nálezov', description: 'Fotogaléria hradísk, archeologických nálezov, kresieb a 3D rekonštrukcií z dielne Hradiska.sk.' },
  { path: '/aktuality', title: 'Aktuality — kronika OZ Hradiská', description: 'Aktuality, podujatia a činnosť Občianskeho združenia Hradiská pri objavovaní a ochrane hradísk.' },
  { path: '/about', title: 'O projekte Hradiská.sk', description: 'O projekte a Občianskom združení Hradiská venovanom slovanským hradiskám na Slovensku a v zahraničí.' },
  { path: '/ochrana-osobnych-udajov', title: 'Ochrana osobných údajov — Hradiská.sk', description: 'Zásady spracovania osobných údajov (GDPR) — kontá, komentáre, cookies, práva dotknutých osôb.' },
  { path: '/podmienky-pouzivania', title: 'Podmienky používania — Hradiská.sk', description: 'Podmienky používania webu Hradiská.sk — obsah a autorské práva, kontá, komentáre a zodpovednosť.' },
];

for (const s of STATIC) {
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Hradiská.sk', url: SITE + '/', publisher: ORG };
  // Sitelinks searchbox — len na domovskej stránke (Google očakáva WebSite+SearchAction na root).
  if (s.path === '/') {
    website.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: SITE + '/hladat?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    };
  }
  writePage(s.path, buildHead({
    title: s.title, description: s.description, canonical: SITE + s.path,
    ld: [website],
  }));
}

// ── Články ───────────────────────────────────────────────────────────────────
async function main() {
  let items = [];
  try {
    const res = await fetch(`${STRAPI}/api/search-index`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    items = (await res.json()).items || [];
  } catch (e) {
    console.warn(`[prerender] Strapi nedostupný (${e.message}) — prerenderujem len statické stránky.`);
    return;
  }

  let n = 0;
  for (const a of items) {
    if (!a.slug) continue;
    const canonical = `${SITE}/blog/${a.slug}`;
    const title = a.metaTitle || a.title;
    const description = a.metaDescription || a.excerpt || '';
    const image = a.cover ? (a.cover.startsWith('http') ? a.cover : MEDIA + a.cover) : DEFAULT_OG;

    const article = {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: a.title, description, image, inLanguage: 'sk',
      author: { '@type': 'Person', name: a.author || 'Hradiská' },
      publisher: ORG, mainEntityOfPage: canonical,
    };
    if (a.date) article.datePublished = a.date;

    // Breadcrumb zosúladený s vizuálnymi omrvinkami na stránke: Domov › Kategória › Článok.
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Domov', item: SITE + '/' }];
    if (a.categorySlug && a.categoryName) {
      crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: a.categoryName, item: `${SITE}/category/${a.categorySlug}` });
    }
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name: a.title, item: canonical });
    const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs };

    const ld = [article, breadcrumb];
    if (a.hasLocation && a.lat != null && a.lng != null) {
      ld.push({
        '@context': 'https://schema.org', '@type': 'LandmarksOrHistoricalBuildings',
        name: a.place || a.title, url: canonical,
        geo: { '@type': 'GeoCoordinates', latitude: a.lat, longitude: a.lng },
      });
    }

    writePage(`/blog/${a.slug}`, buildHead({ title, description, canonical, ogType: 'article', image, publishedTime: a.date, ld }));
    n++;
  }
  console.log(`[prerender] hlavičky: ${STATIC.length} statických + ${n} článkov`);
}

main();
