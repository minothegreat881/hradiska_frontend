# Stav metadát pred finalizáciou blogu

Merané **2026-10-05** proti živej produkcii (`/strapi/api/blog-posts`,
`/api/search-index`, `sitemap.xml`, hlavičky stránok). Nič tu nie je odhad —
každé číslo je z odpovede servera. Skripty merania: `$TMPDIR/meta-audit.mjs`,
`vyhodnot*.mjs` (jednorazové, nie sú v repe).

Nadväzuje na [SEO-AUDIT.md](SEO-AUDIT.md) z 21. 7. 2026. Tá dostavba je hotová:
texty metadát sú naplnené na 100 %. Čo ostalo, je **obraz, zaradenie a technický
rozvod** — a dve chyby, ktoré zahadzujú prácu, čo už je spravená.

**Rozsah:** 364 publikovaných článkov (+ 1 testovací koncept, viď §4).

---

## 1. Textové metadáta — hotové ✅

| Pole | Pokrytie | Poznámka |
|---|---|---|
| `metaTitle` | **364 / 364** | medián 49 znakov, max 61 · 1 článok nad 60 · žiadne duplicity |
| `metaDescription` | **364 / 364** | medián 131, max 159 · 0 nad limit · žiadne duplicity · žiadny nie je kópia excerptu |
| `excerpt` | 362 / 364 | chýba: `pekne-sviatky`, `rozhovor-o-hradiskach` |
| dátum, čas čítania | 364 / 364 | |
| autor | 361 / 364 | chýba: `maly-manin`, `sedliacka-dubova-ziar`, `sutovo-ratkovo-hradisko` |
| kategória | 363 / 364 | chýba: `naucny-chodnik-divinka-velky-vrch` |

Kvalita textov je vecná a konkrétna (napr. *„Mikulčice-Kopčany – veľkomoravské
hradisko s 12 kostolmi"* / *„Až 12 kostolov, znaky mestského usporiadania a možné
sídlo prvých Mojmírovcov…"*). Prepisovať ich netreba.

Drobnosti na doladenie: 11 veľmi krátkych `metaTitle` (pod 30 znakov — väčšinou
ankety a „2 % z dane", kde je to v poriadku) a 14 `metaDescription` pod 110
znakov, kde ostáva nevyužité miesto.

---

## 2. Obraz — najväčšia diera 🔴

### 2.1 `og:image` je zmenšenina
`prerender.mjs` berie obrázok zo `search-index`, a ten vracia `formats.small` —
**500 × 332 px**, hoci originál má typicky 2048 × 1360. Platí to pre **297 z 365**
článkov. Odporúčanie pre sociálne náhľady je 1200 × 630; dnes teda Facebook,
LinkedIn aj X dostávajú náhľad v štvrtinovej veľkosti.

Oprava je malá: `search-index` nech vedľa `cover` vracia aj plnú adresu
(`coverUrl` v `src/api/blog-post/controllers/blog-post.ts`), alebo nech si
`prerender.mjs` pýta originál. **174 z 296** titulných fotiek má originál aspoň
1200 px široký, takže oprava sama o sebe zdvihne väčšinu článkov.

### 2.2 Chýbajúce titulné fotky
**68 článkov nemá titulnú fotku** → do `og:image` ide predvolená hlavička webu.
Prevažne Aktuality (42), 3D modely (7), Povesti (7). Žiadna z piatich
lokalitných kategórií nemá dieru — tam je pokrytie 100 %.

**122 z 296** titulných fotiek nemá ani v najväčšom dostupnom formáte 1200 px
(26 z nich je pod 600 px — sú to skeny listín a staré fotografie). Tie sa
nedotiahnu inak než novým obrázkom.

### 2.3 Popisy fotografií
| | počet |
|---|---|
| fotiek v galériách spolu | 4 474 |
| má `alt` aj `caption` | 1 478 |
| z toho `alt` = doslovná kópia `caption` | **1 478 (všetky)** |
| nemá ani jedno | **2 995 (67 %)** |
| galérií bez jediného popisu | 137 z 339 |
| obrázkových blokov v tele | 1 251, bez `alt` **5** (všetky v `havranok-liptovska-mara`) |

Telo článkov je teda v poriadku, galérie nie. Dve veci sa tu miešajú a treba ich
rozlíšiť: `caption` je popis, ktorý vidí čitateľ, `alt` je opis obrazu pre
čítačku a pre vyhľadávanie obrázkov. Dnes je `alt` len kópiou popisu — to je
lepšie než prázdno, ale nevyužíva to ani polovicu potenciálu.

### 2.4 Titulné fotky bez `alt`
**260 z 364** článkov má titulnú fotku bez `alt` (má ho 104). Najhoršie:
Strážna a hospodárska funkcia 36/41, Mocenské centrá 23/29, 3D modely 38/51.

---

## 3. Zaradenie a pobočný stĺpec

| Pole | Pokrytie | Poznámka |
|---|---|---|
| štítky | 218 / 364 | **priemer 0,73 štítka na článok**, 228 rôznych štítkov, najčastejší použitý 12× |
| kľúčové fakty | 289 / 364 | 1 353 faktov spolu |
| časová os | 257 / 364 | 1 401 udalostí spolu |
| galéria | 339 / 364 | |
| blok Zdroje | 199 / 364 | chýba v 165 článkoch |
| lokalita so súradnicami | 115 / 364 | v lokalitných kategóriách chýba len 17 zo 127 |

**Štítky sú rozsypané.** 228 štítkov na 364 článkov, pričom najpoužívanejší je
na 12 článkoch a väčšina na jednom — to nie je systém značiek, to je zoznam
jednorazových nálepiek. Pre prepájanie článkov a tematické zhluky (a teda pre
vyhľadávače) je to dnes takmer bez účinku. Treba slovník ~20–30 štítkov a priradiť
ich naprieč blogom.

**Zdroje** chýbajú v 165 článkoch. V kategóriách Aktuality (67) a 3D modely (48)
to dáva zmysel, ale v Staroveké sídla (11), Všeobecne o hradiskách (8) a Odborné
texty (7) je to strata dôveryhodnosti práve tam, kde na nej záleží najviac.

Súradnice v lokalitných kategóriách sú takmer úplné — vďaka nim ide do hlavičky
`LandmarksOrHistoricalBuildings` s `GeoCoordinates`. Chýba 12× Staroveké sídla,
2× Mocenské centrá, 2× Refugiá, 1× Kniežacie sídla.

---

## 4. Technické chyby, ktoré zahadzujú hotovú prácu 🔴

### 4.1 Mapa stránok neobsahuje ani jeden článok
Živý `sitemap.xml` má **11 adries** — len statické stránky. V repe je pritom
správne vygenerovaný súbor s 376 adresami. Príčina: `gen-sitemap.mjs` siaha po
`SITEMAP_STRAPI_URL || VITE_STRAPI_URL || http://188.245.47.29`, a na Verceli
**`VITE_STRAPI_URL` nastavené je**, takže sa použije ono, stiahnutie zlyhá a
„fail-soft" vetva prepíše dobrý súbor zoznamom bez článkov. `prerender.mjs`
tú istú premennú nepozerá (má vlastnú `PRERENDER_STRAPI_URL`), preto hlavičky
článkov na produkcii fungujú a mapa stránok nie.

Oprava: zrovnať poradie premenných s `prerender.mjs`, a keď stiahnutie zlyhá,
**existujúci súbor nechať tak** namiesto prepísania. Bez toho pôjde web do sveta
s mapou stránok, ktorá o 365 článkoch mlčí.

### 4.2 Testovací koncept má verejnú SEO hlavičku
Článok `dsadsad` so slugom `Nitra-vyskym` je koncept, ale `search-index` vracia
aj koncepty, takže má na produkcii vlastnú stránku s hlavičkou
`<title>Nitra hradiska</title>` a popisom s preklepmi. Zmazať — a zvážiť, či má
`search-index` koncepty vracať vôbec (náhľad konceptu ich beztak ťahá inak).

### 4.3 Čo je naopak v poriadku
`X-Robots-Tag: noindex` na doméne `*.vercel.app` je zámerný a správny, kým web
beží na dočasnej adrese. `robots.txt`, canonical, Open Graph, Twitter karty,
JSON-LD `Article` + `BreadcrumbList` fungujú a sú na mieste.

---

## 5. Poradie prác — fáza 1

1. **Mapa stránok** (§4.1) — jedna oprava skriptu, odomkne indexáciu 365 článkov.
2. **`og:image` v plnej veľkosti** (§2.1) — jedna oprava, dotkne sa 297 článkov.
3. **Zmazať testovací koncept** (§4.2).
4. **`alt` k titulným fotkám** — 260 článkov.
5. **Popisy a `alt` k fotkám v galériách** — 2 995 fotiek bez popisu. Najväčšia
   položka; dá sa robiť po kategóriách a prioritne tam, kde je galéria veľká.
6. **Slovník štítkov** (~20–30) a priradenie naprieč blogom — 146 článkov bez
   štítka, zvyšok preradiť.
7. **Zdroje** do 26 odborných článkov, kde skutočne chýbajú.
8. **Doplniť** 68 titulných fotiek, 75 kľúčových faktov, 107 časových osí,
   17 súradníc, 3 autorov, 1 kategóriu, 2 excerpty.

---

## 6. Čo čaká fázu 2 (preklad do angličtiny) — rozsah

Namerané množstvo:

| | |
|---|---|
| text článkov | **2 835 493 znakov ≈ 420 000 slov** |
| `metaTitle` + `metaDescription` | 728 reťazcov |
| excerpty | 362 |
| kľúčové fakty | 1 353 |
| udalosti časovej osi | 1 401 |
| popisy fotiek | 1 478 dnes (4 474, ak sa fáza 1 dokončí) |
| názvy lokalít | 115 |
| kategórie a štítky | 14 + 228 |

Tri rozhodnutia, ktoré treba spraviť **pred** prvým preloženým slovom:

1. **Kde bude preklad žiť.** Strapi tu nemá nainštalovaný plugin i18n
   (`package.json`: žiadne `@strapi/plugin-i18n`). Buď sa zapne a články dostanú
   anglickú jazykovú verziu, alebo sa vyrobí druhá sada článkov — prvé je
   správne, druhé je neskôr neudržateľné.
2. **Adresy a `hreflang`.** `/en/blog/<slug>` verzus poddoména; k tomu
   `hreflang` páry a canonical na obe strany. Mimo toho sa anglická verzia
   buď neindexuje, alebo si konkuruje so slovenskou.
3. **Rozhranie webu je po slovensky.** Nie sú to len články — celé `src/`
   má texty natvrdo v slovenčine (navigácia, formuláre, hlášky). Anglická
   verzia potrebuje vlastnú vrstvu prekladov rozhrania, inak bude anglický
   článok v slovenskom webe.

Odborná stránka prekladu (archeologické a historické názvoslovie: *hradisko →
hillfort*, *valové opevnenie*, *púchovská kultúra*, *laténska doba*, datovania
s `p. n. l.`) si vyžiada vlastný slovník termínov, inak sa rozíde článok od
článku. Ten slovník je najlacnejšie postaviť hneď na začiatku fázy 2 — rovnako
ako pri metadátach platí, že jednotnosť sa dodatočne dorába najdrahšie.
