# SEO audit a plán prerobenia — hradiska.sk

Stav k **2026-07-21**. Overené proti reálnemu kódu a DB, nie odpísané z dojmu.
Cieľ: dostať web z „pre vyhľadávače takmer neviditeľný" na plnohodnotný obsahový
web s per-article SEO, sociálnymi náhľadmi a rich results.

---

## 1. Verdikt: ~22/100 🔴

Obsah je špička (305 reálnych, hĺbkových článkov), ale **chýba celá technická SEO
vrstva**. Nie je to doladenie — je to dostavba. Výhoda: obsah je hotový, ide o
infraštruktúru + dáta, nie o písanie článkov.

### Tri koreňové príčiny
1. **Čistý client-side SPA, žiadny SSR/prerender.** `index.html` je prázdna
   škrupina, obsah dopĺňa JS až v prehliadači. Sociálne scrapery (FB, Messenger,
   WhatsApp, LinkedIn, Slack, X) **nespúšťajú JS** → každé zdieľanie je prázdne.
   Google JS vykreslí, ale pomalšie a menej spoľahlivo.
2. **`document.title` sa nikdy nemení.** V celom `src/` nie je jediné nastavenie
   titulku/meta. Každá stránka má rovnaký titulok (navyše preklep „Encyclopédia").
3. **SEO polia prázdne v DB.** `metaTitle` 0/305, `metaDescription` 0/305.
   `excerpt` naplnený 302/305 (dá sa použiť ako fallback/základ).

### Čo úplne chýba
meta description · Open Graph/Twitter cards · JSON-LD · sitemap.xml · robots.txt ·
canonical · dynamický `<title>` · pravý 404 (teraz neznáma cesta → domov, HTTP 200).

### Čo funguje ✅
`<html lang="sk">` · viewport · čisté sémantické URL (`/blog/slug`, `/hradiska`) ·
`<h1>` na článku · `alt` na obrázkoch (čiastočne) · silný originálny obsah ·
časť výkonových opráv hotová.

### Hodnotenie po oblastiach
| Oblasť | Skóre |
|---|---|
| Indexovateľnosť (render) | 🔴 1/10 |
| Meta (title/description) | 🔴 1/10 |
| Sociálne zdieľanie (OG) | 🔴 0/10 |
| Štruktúrované dáta | 🔴 0/10 |
| Sitemap / robots | 🔴 0/10 |
| URL & štruktúra | 🟢 8/10 |
| Obsah & nadpisy | 🟢 8/10 |
| Obrázky (alt/rozmery) | 🟡 5/10 |
| Výkon / CWV | 🟡 5/10 (bundle 3,4 MB) |
| Interné prelinkovanie | 🟡 4/10 |

---

## 2. Taktické úlohy (po fázach)

Označenie: `[ ]` čaká · `[~]` rozpracované · `[x]` hotové.

### FÁZA 0 — Základy bez závislostí (rýchle výhry) ✅ HOTOVÉ 2026-07-21
- [x] **T0.1** `public/robots.txt` (Allow /, Disallow /admin+účty+/hladat, odkaz na sitemap)
- [x] **T0.2** `sitemap.xml` — `scripts/gen-sitemap.mjs` (315 URL: 305 článkov +
      10 statických), zdroj `/api/search-index`, beží pred `vite build`, fail-soft
- [x] **T0.3** `index.html`: oprava „Encyclopédia"→„encyklopédia", default meta
      description + Open Graph + Twitter cards + theme-color (fallback pre celý web)

### FÁZA 1 — Render vrstva (P0) — zvolený prerender HLAVIČKY ✅ 2026-07-21
- [x] **T1.1** rozhodnutie: **prerender iba hlavičky** (nie plné SSG) — bez
      server-renderu React komponentov, takže žiadne riziko pádov Cesia/máp/motion.
      Plné SSG (obsah v HTML) ostáva ako neskorší, samostatný krok.
- [x] **T1.2** `scripts/prerender.mjs` — beží po `vite build`, pre každú URL
      (305 článkov + 10 statických) vyrobí dist/<path>/index.html s prepísaným
      `<head>` medzi značkami `seo:start/seo:end` v `index.html`. Telo naďalej JS.
- [ ] **T1.3** (voliteľné) klientsky head-sync pri SPA navigácii (document.title
      + meta) — pre scrapery netreba (majú prerendrované HTML), pre UX bonus.

### FÁZA 2 — Per-article SEO dáta („SEO agent")
- [ ] **T2.1** agent prejde telo každého článku a vygeneruje:
      `metaTitle` (≤60 zn., kľúčové slovo vpredu), `metaDescription` (≤155 zn.,
      z obsahu, lákavá), návrh kľúčových slov
- [ ] **T2.2** zápis do Strapi (bulk, s kontrolou integrity DB po dávkach)
- [ ] **T2.3** pilot na 3–5 článkoch, schválenie formátu, až potom mass-run
- [ ] **T2.4** (voliteľné) pole `ogImage` / potvrdenie coverImage ako OG obrázka

### FÁZA 3 — Render SEO dát ✅ 2026-07-21 (cez prerender hlavičky)
- [x] **T3.1** `<title>` = metaTitle || title; description = metaDescription || excerpt
- [x] **T3.2** Open Graph + Twitter cards (title, description, image=cover, type=article,
      url, locale sk_SK, article:published_time)
- [x] **T3.3** canonical URL na každej stránke
- [x] **T3.4** JSON-LD: `Article` (author, datePublished, image, publisher),
      `BreadcrumbList`, `WebSite`/`Organization`, `LandmarksOrHistoricalBuildings`
      + `GeoCoordinates` pri hradiskách s lokalitou
- search-index rozšírený o metaTitle/metaDescription/author/date/lat/lng (podklad
  pre prerender)

> **Nasadenie:** (1) hosting musí servovať dist/<path>/index.html na danej URL
> (napr. nginx `try_files $uri $uri/ /index.html`) — fyzický súbor vyhráva pred
> SPA fallbackom. (2) `MEDIA_URL` (env pri builde) musí ukazovať tam, kde sa
> servujú `/uploads` obrázky, aby OG obrázky boli absolútne a dostupné.

### FÁZA 5 — Migrácia URL a redirecty (robiť POSLEDNÉ)
- [ ] **T5.1** vygenerovať mapu starých→nových URL. Staré Blogger permalinky
      (`http://www.hradiska.sk/RRRR/MM/slug.html`) sú v Blogger feed exportoch
      v `hradiska-strapi/scripts/blog-migrate/data/`. Nové = `/blog/<slug>`.
- [ ] **T5.2** ⚠️ párovať **podľa obsahu textu, nie len názvu** — viac článkov má
      rovnaký názov lokality (Zvolen-Môťová, Zlatý kôň, Bíňa: kresba/3D/panoráma),
      podľa názvu by sa pomýlili. Nespárované → 301 na kategóriu/domov, nie 404.
- [ ] **T5.3** 301 (trvalé) redirecty na úrovni hostingu/proxy (nginx/Caddy/CF),
      nie v appke. Doména ostáva `hradiska.sk` (potvrdiť).

### FÁZA 4 — Doladenie a odolnosť
- [x] **T4.1** pravý 404 (`NotFoundPage`, neznáma cesta → notfound + noindex)
- [~] **T4.2** BreadcrumbList JSON-LD hotové (prerender); vizuálne breadcrumbs zatiaľ nie
- [x] **T4.3** „súvisiace články" — už existuje (ArticleCard = `<a href="/blog/slug">`,
      ArticlePage sekcia „Ďalšie články z kategórie")
- [x] **T4.4** `loading="lazy"`+`decoding="async"` na obrázky tela a galérie;
      CLS už rieši aspect-ratio box z `block.image.width/height`; obálka eager (LCP)
- [x] **T4.5** hlavný bundle 3,4 MB → **1,69 MB** (gzip 960→483 KB): MapPage a
      GalleryPage sú lazy (mapy sa sťahujú len na /mapa)
- [ ] **T4.6** Google Search Console + reálne meranie (vec používateľa — jeho účet)

---

## 3. FÁZA 1 — rozhodnutie o render vrstve (GATE)

Bez prerenderu OG a spoľahlivé meta **nefungujú**, preto je toto brána pre Fázy 3–4.
Tri cesty:

| Cesta | Ako | Plusy | Mínusy |
|---|---|---|---|
| **A) SSG nad Vite** (`vite-react-ssg` / Vike) **← odporúčam** | Ostáva React kód, pridá sa `<Head>` a build vygeneruje statické HTML pre každú URL | Najmenší zásah, plné SEO, rýchle statické stránky, obsah je aj tak takmer statický | Treba upraviť entry/build, doriešiť dáta počas buildu (fetch z Strapi) |
| **B) Astro** | Prepis frontendu do Astro (React ostrovy) | Najlepšie SEO/CWV, zero-JS default | Väčší prepis, čas |
| **C) SPA + prerender služba** (prerender.io/headless) | Necháme SPA, proxy podsúva botom prerendrované HTML | Bez zmeny appky | Ďalšia infra, krehké, horšie pre CWV, nie pre používateľa |

**Odporúčanie: A (SSG nad Vite).** Obsah sa mení zriedka (archív 305 článkov), React
kód ostáva, build upečie HTML s meta/OG/JSON-LD. Najlepší pomer efekt/riziko.
C zamietam (krehké, nerieši rýchlosť pre používateľa). B iba ak by sme aj tak
prepisovali.

> Toto rozhodnutie mení entry a build appky — spustím ho až po tvojom odsúhlasení.
> Fázy 0 a 2 naň nečakajú a bežia paralelne.

---

## 4. Poznámky k realizácii
- **Base URL** pre sitemap/canonical/OG: `https://hradiska.sk` (konfigurovateľné cez
  env, lokálne fallback). Nasadenie na DigitalOcean → doriešiť, aby `sitemap.xml`
  a `robots.txt` sedeli na koreňovej doméne webu, nie na API doméne.
- Sitemap zdroj = `/api/search-index` (už vracia všetky slugy, kategórie, lokality).
- Integrita DB: po každej dávke zápisu SEO polí kontrola počtu článkov (305).
