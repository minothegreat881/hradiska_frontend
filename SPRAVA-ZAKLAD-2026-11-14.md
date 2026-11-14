# Správa – hradiská podľa základu a požiadavky klienta (14. 11. 2026)

**Náhľad vetvy:** https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app — otvorí sa priamo
v prehliadači, bez prihlásenia (vetva `zaklad-web`; main a ukážka pre klienta sa nezmenili). Vzhľad z ostrého backendu sa
číta len na čítanie; nové prvky vzhľadu kreslí web zo základu v kóde, kým sa nenasadí backend a nezverejní vzhľad.

---

## 1. Požiadavky K1 – K5

| | stav | posudok podľa základu | pred → po |
|---|---|---|---|
| **K1** „Stredoveké hrádky“ | **nie je** – kategória v Strapi neexistuje (14 kategórií, žiadne štítky); dlaždica = kategória, zapisovať do Strapi nesmiem | patrí do **horného radu** (typy hradísk), nie do spodného ako na náčrte – podobnosť a spoločný región (Gestalt), zoskupenie podľa toho, čo vec je; konflikt zapísaný | pripravené: rad dlaždíc počíta stĺpce z počtu (6 typov v jednom rade); hlavička: rad sa pri 1440 px potichu orezal → „Ďalšie N“ (priority+), zvyšok cez register kategórií |
| **K2** rad odkazov pod hľadaním | hotové, domovská aj pod článkom | jazyk dlaždíc kategórií (mriežka 1264 px, rám 3 : 2, obrázok celý – sú to grafiky s textom); nadpis sekcie chýba (L03.04 – zapísané) | 0 → 5 odkazov, všetky s obrázkom a cieľom, SK/EN/DE s adresami článkov v jazyku |
| **K3** tlačidlá a odkazy pod činnosťou | hotové; 2 z 3 tlačidiel a 2 zo 4 odkazov viditeľné, zvyšok skrytý (chýba cieľ) | tlačidlá = vodorovné karty, hlavné dvojnásobnej šírky; pod článkom 7 dlaždíc činnosti v jednom rade (1440) / 4 + 3 | tlačidiel 0 → 2 (+1 skryté), odkazov 0 → 2 (+2 skryté); činnosť pod článkom 6 + 1 → 7 v rade |
| **K4** zbalená diskusia | hotové: tlačidlo s počtom, rozbalí sa kliknutím, pri `#discussion` / `#k-…` a po odoslaní | počet zo servera, zoznam až po rozbalení | diskusia so 209 komentármi: výška 57 px zbalená; počet 209 (predtým sa načítalo a ukazovalo **len 100** – opravené: všetky strany) |
| **K5** pod článkom ako na domovskej | hotové: hľadanie → rad K2 → mapa → činnosť s K3 | „Mohlo by vás zaujímať“ ide **hneď za článok a diskusiu, pred** blok z domovskej – základ KT.03 (obsah → súvisiace → ďalšie kroky); odchýlka od „hneď za Diskusiou“ je jedna sekcia | index hľadania sa sťahuje až pri prvom hľadaní (nezmenené) |

Spoločne: nový tvar údajov (`VolnyOdkaz`, voliteľné `domov.odkazy`, `cinnost.tlacidla`, `cinnost.odkazy`) v typoch, kontrole,
čítaní, prevode, zozname zmien, základnom vzhľade a editore (plátno: text v 3 jazykoch, obrázok, poradie, skrytie, „+“; panel
a formulár aj cieľ a hlavné tlačidlo). Staršie koncepty editor doplní zo základu pri načítaní. Zlúčenie (`zlucenie.ts`) sa nemení.
Staré verzie webu a appky nový tvar prečítajú bez pádu (test). Konzola bez chýb na všetkých meraných pohľadoch.

**Testy:**

| test | výsledok |
|---|---|
| `test-volne-odkazy.mjs` (nový, web) | 33 z 33 |
| `vzhlad-volne-odkazy.mjs` (nový, server) | 16 z 16 |
| skúška editora (cielená, lokálny backend vetvy) | 11 z 11 |
| `test-odolnost.mjs` | 19 z 19 (aj na main, obe stavby bez vloženého vzhľadu – inak web podstrčený vzhľad ignoruje) |
| `test-admin-smoke.mjs` | OK, zahodené zápisy 0 |
| `vzhlad-api.mjs` (server) | 223 z 224 – jediné zlyhanie hľadá súbor v `public/uploads`, ktorý pracovný strom vetvy nemá |
| `test-zhoda.mjs` (kategórie, kronika, sk/en/de, 1440/390; hlavička ako zámerná zmena) | pixely 90 z 90, DOM 84 z 90 (kronika: neviditeľný atribút `data-pocet`) – stav po úlohe 1 |
| `test-vykon.mjs` | balík +1,35 kB gzip (strop 15); LCP: rovnaké s vloženým vzhľadom (medián 816 ms), v prostredí testu bez neho +76 ms pri 1440 |
| `test-editor.mjs`, `test-mobil.mjs` | **nespustené** – potrebujú súbor s prístupovými údajmi a fotky v adresári backendu; kopírovať ich nesmiem (nahradila ich cielená skúška editora) |

## 2. Otázky a chýbajúce podklady pre Petra

1. **Kategória „Stredoveké hrádky“** – založiť v administrácii (Kategórie): názov, slug `stredoveke-hradky`, popis, obrázok; potom
   v editore vzhľadu dlaždica do prvého radu, kategória do hlavného radu menu, krátky názov, tvary počtu, EN a DE názov.
2. **Naše ďalšie blogy** – starý panel mal zoznam 4 blogov, nie jeden cieľ, a žiadny obrázok: kam má tlačidlo viesť a aký obrázok.
3. **Archeoskanzeny** a **Odporúčané stránky k dejinám Slovanov** – starý panel mal zoznamy (12 a 16 odkazov); nový web nemá
   stránku, kam by viedol jeden odkaz. Treba článok so zoznamom (texty dodá Peter) alebo jeden cieľ.
4. **Občianske združenie Hradiská** – starý panel viedol na blog hradiska333.blogspot.com; teraz vedie na článok o zásadách
   združenia (logo je v knižnici). Ak chce blog, zmení cieľ v editore.
5. **Jedno meno pre kategóriu** – návrh v `docs/STYL.md` (napr. „Strážna funkcia“ v hlavičke vs. „Hospodárska funkcia“ na dlaždici,
   „Staroveké sídla“ vs. „Staroveké hradiská“, „Refugiá“ vs. „Refúgiá“). Rozhodne Peter, mení sa v editore.
6. **15 vs. 16 rokov** – úvod: „16 rokov činnosti“ (2026 − 2010), kronika: „… zápisov · 15 rokov“ (rokov, v ktorých sú zápisy).
   Návrh: „16 rokov činnosti“ a v kronike „zápisy z 15 rokov“.
7. **Údaje združenia** – v ochrane údajov „IČO, sídlo a registračné číslo sa dopĺňajú“; v päte chýba adresa a IČO (KG.05).
8. **Formulár „Staňte sa spolupracovníkmi“** – teraz pripraví e-mail v poštovom programe. Ak má odosielať sám, treba backend (bod 5).

## 3. Posudok po typoch stránok

Počty pravidiel katalógu (360) na každý typ stránky: splnené / nesplnené / neuplatňuje sa / neviem posúdiť.

| typ stránky | východisko (main) | konečný stav (vetva) |
|---|---|---|
| úvod | 176 / 31 / 100 / 53 | 191 / 21 / 99 / 49 |
| zoznam | 165 / 26 / 129 / 40 | 178 / 22 / 125 / 35 |
| detail | 160 / 29 / 121 / 50 | 177 / 23 / 111 / 49 |
| formulár | 175 / 24 / 113 / 48 | 182 / 17 / 112 / 49 |
| právne | 157 / 22 / 138 / 43 | 166 / 15 / 135 / 44 |
| 404 | 165 / 22 / 136 / 37 | 175 / 14 / 134 / 37 |

Celý posudok s dôkazmi: `docs/POSUDOK.md` (každé pravidlo × typ, dôkaz pri „nesplnené“).

## 4. Zjednotenie (pred → po)

| | rôznych hodnôt / výskytov pred | po |
|---|---|---|
| zaoblenia | 47 / 249 | **10 / 51** (stupnica `--hr-radius-xs/s/m/l/xl/pill`; ostali kruhy 50 %, vlásky, tvary s „/“) |
| farby | 617 / 1072 | 614 / 1020 (49 starých inline farieb článku → tokeny; zvyšok sú najmä definície paliet a prekladová vrstva) |
| veľkosti písma | 86 / 468 | 86 / 476 – **nezjednotené** (menilo by vzhľad); pribudlo pravidlo 16 px pre text tela na mobile |
| odstupy | 137 / 1027 | 132 / 1009 – **nezjednotené**, návrh stupnice v `docs/STYL.md` |

Dokument štýlu: `docs/STYL.md` (vrstvy farieb, stupnice, inventúra, návrh mien kategórií, čo ostáva).

## 5. Opravené, zostáva, rozhodol som sám

**Opravené (úloha 2, podľa plánu nástroja):**
- **Dávka 1, kritické:** fokus je viditeľný a nezakrytý (Z5.03):
  - pod prilepenou hlavičkou,
  - v páse kroniky,
  - v galérii,
  - na mape,
  - v päte na dotyku.
- **Dávka 2, mechanické:**
  - popis poľa hľadania (Z3.10);
  - obmedzený pohyb (Z10.02);
  - farba odkazov len pre odkazy (L15.01: menovky kroniky, citát, pobočný stĺpec, zdroje citátov);
  - odkazy v tom istom okne (Z1.01; zdieľanie ostáva v novom okne ako výnimka);
  - text tela na mobile 16 px (Z10.03).
- **Dávka 3, kontrast (Z5.03):**
  - menovky, zhluky a ovládanie mapy;
  - zdroj satelitnej mapy;
  - text prázdnej diskusie.
- **Dávka 4:** dotykové ciele (L07.01): malé odkazy aspoň 24 px, na dotyku 44 px; prepínač jazyka 44 × 44.
- **Dávka 5:** neexistujúci článok má h1 (KG.04).

**Úloha 3 (každý bod vlastný commit):**
1. Hlavička: orezaný rad → „Ďalšie“ (v úlohe 1); v mobilnom menu sú „Aktuality“ len raz.
2. Pribudli `<main>` a „Preskočiť na obsah“; názov prepínača jazyka obsahuje skratku.
3. Sitemap a prerender: mŕtve adresy preč, 14 kategórií × 3 jazyky s titulkom, popisom a canonical, aj úvod a statické stránky v EN a DE; tlačidlo 404 nevedie na neexistujúcu `/hradiska`.
4. EN a DE stránky majú `<html lang>` zo servera; `/en/…` a `/de/…` majú jazykové kostry.
5. Kategória ukáže všetky články („Zobraziť ďalšie“, „Zobrazených X z Y“).
6. YouTube ide cez youtube-nocookie; YouTube, Vimeo, Sketchfab a Facebook sa načítajú až po kliknutí na náhľad; cookie lišta na mobile zaberá najviac 45 % okna.
7. Neexistujúci článok má nadpis, cesty ďalej a noindex.
8. Hľadanie:
   - `aria-activedescendant`;
   - výsledky zarovnané vľavo;
   - „Načítavam register článkov…“ počas sťahovania registra.
9. Service worker už nepredsťahuje Cinzel a Cormorant (CACHE v8).
10. Formulár „Staňte sa spolupracovníkmi“ už netvrdí, že správu prijal; pripraví e-mail.

**Meranie (zaklad-webov, 48 stránok × 1440 / 412 / 320 px = 1680 výsledkov):**

| | prešlo | neprešlo | z toho chyby | odporúčania | na posúdenie | neuplatňuje sa | nezmerané |
|---|---|---|---|---|---|---|---|
| východisko (main) | 681 | 617 | 92 | 525 | 13 | 325 | 44 |
| konečný stav (vetva) | 880 | 424 | 38 | 386 | 72 | 266 | 38 |

Neprešlo podľa kontroly (výsledky, pred → po):
- ciele-velkost 96 → 36;
- kontrast-textu 85 → 27;
- pismo-tela 78 → 33;
- nove-okna 48 → 8;
- popis-poli 6 → 0;
- farba-akcie 11 → 6;
- znizeny-pohyb 18 → 14;
- prva-obrazovka 21 → 18;
- jeden-h1 1 → 0;
- fokus 91 → 92 (nálezy 462 → 264);
- bez zmeny: rozostup-cielov 96, dlzka-riadku 11, rozmery-obrazkov 48, typ-pola 1;
- navstivene-odkazy 6 → 34.

Prvé konečné meranie našlo 52 výsledkov horších ako východisko. 19 z nich spôsobila vetva a sú opravené
(1305522, fe1af9a):
- text náhľadu videa bol tmavý na tmavom;
- omrvinky na dotyku posunuli nadpis kategórie pod prvú obrazovku;
- záchranná sieť pri zníženom pohybe vyrábala prechody;
- nemecký titulok mal 69 znakov.

Ďalšie 2 (kontrast kariet kategórie) boli chyba nástroja: kontrast meral aj riadky skryté skrátením na dva riadky.
Je opravená v zaklad-webov so skúškou na neutrálnej stránke.

Ostáva 31 „zhoršení“, ktoré nie sú zhoršením webu:
- **28 × navštívené odkazy:** pred tým „neuplatňuje sa“, lebo stránka nemala `<main>`. Vzhľad odkazov sa nezmenil,
  nástroj ich po pridaní `<main>` prvýkrát zmeral.
- **2 × kontrast mapy pod veľkou diskusiou:** mapu tam presunula požiadavka K5. Popisky mapy mali slabý kontrast
  už na úvode (oprava v ďalšom kroku).
- **1 × prvá zastávka klávesnice pri veľkej diskusii (412 px):** chyba nástroja, opravená až po tomto meraní.

**Zostáva (nesplnené alebo nezmenené, s dôvodom):**
- kontrast „text nad obrázkom“ pri kartách článkov – nástroj meria papierovú textúru ako obrázok (text stojí na papieri pod fotkou),
  na snímkach je kontrast v poriadku → na posúdenie / úprava nástroja,
- rozmery obrázkov (Z7.03, stredná) – width/height chýba pri obrázkoch z dát (potrebuje rozmery z API vo všetkých komponentoch),
- rozostup cieľov a zvyšok dotykových cieľov (mapa, galéria, pobočný stĺpec), prvá obrazovka (dlhý titulok kategórie a článku),
  dĺžka riadku, navštívené odkazy – vzhľad, čaká na rozhodnutie,
- podľa posudku: chýba nadpis radu K2, „Kontakt“ v menu, adresa/IČO v päte, filter v dlhých kategóriách, uloženie rozpísaných
  formulárov, presné potvrdenie mazania, pravidlo hesla vopred, web bez JS (SPA) – v `docs/POSUDOK.md`,
- veľkosti písma a odstupy – nezjednotené (vyššie),
- `typ-pola` (súhlas s e-mailom vyhodnotený ako pole e-mailu) – chyba nástroja, nástroj som nemenil.

**Rozhodol som sám (zapísané v STAV.md):**
- K1 patrí do horného radu;
- „Ďalšie“ v hlavičke (priority+);
- K2 v jazyku dlaždíc kategórií, obrázky bez orezu;
- K3 tlačidlá ako vodorovné karty;
- K2 „Občianske združenie“ vedie na článok, nie na blog;
- K5: súvisiace články pred blokom z domovskej;
- počet v diskusii zo servera;
- zdieľanie v novom okne ostáva;
- zjednotenie bez zmeny písma a odstupov;
- formulár → pripravený e-mail;
- prázdne náhľady pred vloženým obsahom (bez obrázka zo služby).

## 6. Poradie nasadenia

1. **Backend** (`hradiska-strapi`, vetva `zaklad-web` → master): mení sa len `src/api/vzhlad-webu/typy.ts` a `kontrola.ts`
   (+ test). Na serveri:
   - `git pull`;
   - `npm run build` (keď panel padá na pamäť, postup v pamäti „Panel Strapi na serveri padá na pamäť“);
   - reštart služby `hradiska`.
   Overiť:
   - `GET /api/vzhlad-webu` → 200;
   - `node scripts/kontrola/vzhlad-volne-odkazy.mjs` funguje len lokálne, na serveri zápisom netestovať.
   Musí ísť **prvý**: stará kontrola nové polia odmieta.
2. **Web** (`zaklad-web` → main → Vercel). Bez zverejneného nového vzhľadu kreslí K2 a K3 zo základu.
3. **Editor** (súčasť webu):
   - prvé otvorenie doplní nové zoznamy do konceptu (ukáže ich ako neuložené);
   - potom Uložiť a Zverejniť;
   - až potom rozhoduje vzhľad z databázy, aj o EN a DE adresách.
4. **Appka:** nič nestavať. OTA si stiahne nový web; staré balíky nový tvar čítajú bez pádu (test).

## 7. Commity a ako ich vrátiť

Každý commit sa dá vrátiť samostatne: `git revert <hash>`. Hash zistíte cez `git log --oneline origin/main..zaklad-web`. Poradie revertu je od konca.

| commit | čo | závislosti pri vrátení |
|---|---|---|
| 5dd3cd9 | merací projekt (zaklad.projekt.json, CLAUDE.md) | – |
| 44f6582 | K1 – K5 (web, editor, tvar údajov) | backend 461521a ostane kompatibilný (polia sú voliteľné) |
| 3e6446d | dávka 1: fokus | – |
| 6af76e1 | dávka 2: mechanické odporúčania | 05aa7a6 je jej doplnok |
| 1671dc6 | dávka 3: kontrast | – |
| 728c843 | úloha 3 bod 2: main, preskočenie, prepínač jazyka | – |
| 0ee3ab3 | úloha 3 bod 7: neexistujúci článok, tlačidlo 404 (aj preklady bodov 2 a 7) | – |
| 460c7c1 | úloha 3 bod 1: „Aktuality“ raz v mobilnom menu | – |
| 3f93661 | úloha 3 bod 4: jazyk dokumentu | – |
| 618f4ad | úloha 3 bod 3: sitemap a prerender | kostry /en a /de z neho používa bod 4 |
| 16de72d | úloha 3 bod 5: „Zobraziť ďalšie“ | – |
| e2ef6d5 | úloha 3 bod 6: vloženia po kliknutí, nocookie, cookie lišta | 56c1e72 je jeho oprava |
| 4d00db6 | úloha 3 bod 8: hľadanie | – |
| 4847b7f | úloha 3 bod 9: service worker | – |
| b4997c6 | úloha 3 bod 10: formulár → e-mail | – |
| d76c728 | zjednotenie: zaoblenia, farby článku, docs/STYL.md | – |
| 05aa7a6 | dávka 2 doplnok: pobočný stĺpec bez farby odkazov | – |
| 1b7e9c6 | dávka 4: dotykové ciele | – |
| 56c1e72 | bod 6 oprava: „Súhlasím / Nesúhlasím“ na mobile | – |
| BE 461521a | backend: tvar voľných odkazov | vrátiť až po vrátení webu 44f6582 |
| BE f5fdbed | backend: test servera | – |

## 8. Čo som neurobil a prečo

- **K1:** dlaždica „Stredoveké hrádky“ na webe nie je. Kategória neexistuje a do ostrého Strapi zapisovať nesmiem.
- **K2/K3:** tri prvky sú skryté a obrázky k ním nie sú dodané (bod 2). Cieľ ani obrázok som nevymýšľal.
- **`test-editor.mjs` a `test-mobil.mjs` nespustené.** Potrebujú `.env.lokalne-vzhlad` a fotky v adresári backendu a kopírovať prístupové údaje nesmiem. Pôvodný backend so svojím súborom by zasa vyžadoval prepnúť jeho checkout na vetvu.
- **`test-zhoda.mjs` po úlohách 2 a 3 nespustený.** Zámerné zmeny (zaoblenia, dotykové ciele, hlavička) menia pixely na každej stránke. Overenie robí konečné meranie a porovnanie.
- **Písmo a odstupy som nezjednotil.** Zmenilo by to vzhľad, ktorý klient schválil. Návrh je v STYL.md.
- **Rozmery obrázkov, rozostupy a prvá obrazovka som neopravil** (bod 5).
- **Nástroj zaklad-webov som nemenil.** Chyby nástroja (`typ-pola`, papier ako obrázok) sú len zapísané.
- **Výstupy merania necommitujem.** Sú v `Git-Projects/zalohy-hradiska/zaklad-2026-11-14/` (projekt-vychodisko, projekt-konecny, k-po, k-nahlad).

## Len zoznam (nemenené)

1. **Nešifrované spojenie Vercel → backend:** `vercel.json` prepisuje `/strapi/*` na `http://188.245.47.29`.
   - **Postup opravy:**
     1. Doména pre API (napr. `api.hradiska.sk`): DNS A → 188.245.47.29.
     2. Na serveri reverzný proxy s TLS pred Strapi (pre iné projekty tam už nejaký beží – použiť ten istý; pri Caddy stačí `api.hradiska.sk { reverse_proxy 127.0.0.1:1337 }` a certifikát si vystaví sám).
     3. Strapi: `url` v `config/server` na `https://api.hradiska.sk`.
     4. `vercel.json`: `"destination": "https://api.hradiska.sk/:path*"`. Rovnako `PRERENDER_STRAPI_URL` a `SITEMAP_STRAPI_URL` (dnes predvolene http).
     5. `src/lib/api-adresa.ts`: `PRODUKCNY_ZAKLAD` pre appku na https.
     6. Firewall: port 1337 zvonka zavrieť; port 80 len na presmerovanie.
     7. Overiť: web, administrácia, appka (stará verzia volá pôvodnú adresu – nechať ju dočasne fungovať).
2. **Neznáme adresy vracajú 200** (SPA, prepis `/(.*)` → index.html). Neexistujúci článok má teraz noindex.
   - Skutočný 404 by vyžadoval v `vercel.json` zoznam platných ciest (`/`, `/blog/:slug`, `/category/:slug`, `/galeria`, …) a vlastnú stránku 404.
   - Neexistujúci slug článku by aj tak vracal 200 (overenie je až v prehliadači).
3. **Register hľadania 1,2 MB a prvé hľadanie ~4 s.** Sťahuje sa pri prvom zameraní poľa a roletka to už hovorí.
   - Návrh: kompresia na serveri (Strapi/Caddy gzip/brotli, dnes HTTP bez kompresie cez proxy) a menší register (bez celých textov),
   - alebo hľadanie na serveri.
4. **Jedno meno pre kategóriu:** návrh v `docs/STYL.md`, rozhodne Peter.
5. **15 vs. 16 rokov v kronike:** bod 2.6.
6. **Výška fotoarchívu na mobile:** galéria je na mobile veľmi dlhá. Návrh: menej skupín rozbalených naraz alebo „Zobraziť ďalšie“. Nemenené.
7. **Mŕtvy kód a nepoužité závislosti:**
   - 72 súborov v `src/` nedosiahnuteľných z `main.tsx`, napríklad:
     - `components/ui/*` (shadcn),
     - staré mapy (Cesium, Mapbox, Slovakia3D…),
     - `TwoTierNav`, `MegaMenu`, `JoinUs`, `AktualityFeed*`, `pages/SearchPage`.
   - Kandidáti nepoužitých závislostí vo webe:
     - mapy a 3D: `mapbox-gl`, `three`, `@react-three/fiber`, `@react-three/drei`;
     - `lightgallery`, `react-responsive-masonry`;
     - `clsx`, `tailwind-merge` (len v mŕtvych ui súboroch).
   - Capacitor balíky slúžia appke, `tailwindcss` stavbe CSS, `@tiptap/pm` administrácii – tie ostávajú.
   - Nič som nemazal.

## Pred spustením (deň D)

- [ ] **Noindex:** `vercel.json` posiela `X-Robots-Tag: noindex, nofollow` len pre hosty `*.vercel.app`, na vlastnej doméne zmizne sám. Overiť hlavičku na hradiska.sk a `robots.txt` (Allow /, doplniť `Sitemap: https://hradiska.sk/sitemap.xml`).
- [ ] **Doména:**
  - hradiska.sk na Vercel (DNS, presmerovanie www ↔ bez www);
  - `SITE_URL` pre prerender a sitemap (dnes predvolene webdesignforhradiskask.vercel.app → canonical a hreflang by mierili na ukážku).
- [ ] **Šifrované spojenie na backend** (zoznam, bod 1). Bez neho ide prihlásenie a komentáre cez HTTP medzi Vercelom a serverom.
- [ ] **Skryť tlačidlo Pripomienky** (`PripomienkyDock` – verejné zámerne, len na čas pripomienok).
- [ ] **Presmerovania zo starého webu:** 406 v `vercel.json` (Blogger `/rrrr/mm/slug.html` → `/blog/…`). Overiť top adresy zo starej analytiky / Search Console a doplniť chýbajúce (štítky `/search/label/…`, stránky `/p/…`, feed).
- [ ] **Backend nasadiť pred webom** (sekcia 6), potom v editore uložiť a zverejniť vzhľad. Po zverejnení skontrolovať EN a DE adresy v K2/K3.
- [ ] **Search Console:** overiť doménu, odoslať `sitemap.xml` (1152 adries); Bing Webmaster.
- [ ] **E-mail:** odosielanie z backendu (pamäť: Hetzner blokuje 465 → 587 STARTTLS); overiť registráciu a obnovu hesla na ostrom.
- [ ] **Analytika:** súhlas je pripravený (`consent.ts`), skript nie je zapojený – rozhodnúť, či a ktorý (Umami/Plausible).
- [ ] **Údaje združenia** v ochrane údajov a v päte (IČO, sídlo, kontakt).
- [ ] **Appka:** API na https, OTA overiť na emulátore `hradiska`.
- [ ] **Záloha DB** pred spustením, kontrola `hradiska-straz.sh` (SK úpravy pretekajúce do EN).
- [ ] **Posledné meranie základom** nad ostrou doménou (`zmeraj`, `kontrola`) a test zhody proti náhľadu.
