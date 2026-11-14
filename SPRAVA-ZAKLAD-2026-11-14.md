Náhľad: https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app — otvorí sa bez prihlásenia (overené: všetkých 5 adries nižšie vráti 200 bez hesla).

# Správa – hradiská: požiadavky K1 – K5 a web podľa základu (14. 11. 2026)

Vetva `zaklad-web` (web aj backend). Nič nie je v `main`, ukážka pre klienta ani ostrý backend sa nezmenili, v Strapi som
nič nezapísal a balík aplikácie som nestaval. Náhľad číta ostrý backend len na čítanie.

## Kde zmeny vidno najlepšie

| | adresa na náhľade | čo pozrieť |
|---|---|---|
| úvod | [/](https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app/) | K2 rad 5 odkazov pod hľadaním; K3 tlačidlá a odkazy pod „Čo združenie robí“; hlavička s „Ďalšie“ pri 1440 px |
| článok s veľkou diskusiou | [/blog/nelegalny-detektorizmus-skodi-nasej-historii](https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app/blog/nelegalny-detektorizmus-skodi-nasej-historii) | K4 zbalená diskusia s počtom 209; K5 pod článkom hľadanie → K2 → mapa → činnosť s K3 |
| kategória | [/category/aktuality](https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app/category/aktuality) | „Zobraziť ďalšie“ (50 → všetkých 80), omrvinky |
| hľadanie | [/hladat?q=devin](https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app/hladat?q=devin) | výsledky zarovnané vľavo, „Načítavam register článkov…“, šípky ↑↓ v roletke |
| neexistujúci článok | [/blog/tento-clanok-neexistuje](https://webdesignforhradiskas-git-118b48-milanhrabkovsky-7010s-projects.vercel.app/blog/tento-clanok-neexistuje) | nadpis, cesty ďalej (úvod, hľadanie, kategórie), `noindex` |

## 1. Požiadavky K1 – K5

| | stav | pred → po |
|---|---|---|
| **K1** „Stredoveké hrádky“ | **nehotové.** Kategória v Strapi nie je a zakladať ju nesmiem. Web je pripravený: rad dlaždíc prepočíta stĺpce sám, hlavička má „Ďalšie“. Presný postup pre administráciu je v `docs/K1-STREDOVEKE-HRADKY.md`. | dlaždica: chýba (čaká na kategóriu); hlavička pri 1440 px: rad sa potichu odrezal za „Staroveké sídla“ → „Ďalšie N“ |
| **K2** rad odkazov pod hľadaním | hotové, na úvode aj pod článkom | 0 → 5 odkazov s obrázkom, SK/EN/DE |
| **K3** tlačidlá a odkazy pod činnosťou | hotové; 1 tlačidlo a 2 odkazy sú skryté, kým Peter nedodá cieľ (otázky 2 – 3) | tlačidlá 0 → 2 (+1 skryté), textové odkazy 0 → 2 (+2 skryté); činnosť pod článkom 6 + 1 → 7 v jednom rade pri 1440 px |
| **K4** zbalená diskusia | hotové; rozbalí sa kliknutím, pri `#discussion` a `#k-…` a po odoslaní komentára | diskusia s 209 komentármi: zbalená 57 px; počet 209 (predtým sa načítalo a ukázalo len 100) |
| **K5** pod článkom ako na úvode | hotové: hľadanie → K2 → mapa → činnosť s K3; „Mohlo by vás zaujímať“ hneď za článkom a diskusiou | register hľadania sa sťahuje až pri prvom hľadaní (nezmenené) |

Všetko sa dá meniť v editore vzhľadu: obrázok, text v 3 jazykoch, cieľ, poradie, skrytie. Nový tvar údajov majú typy,
kontrola, čítanie, prevod, zoznam zmien, základný vzhľad aj editor. Staré verzie webu a appky ho prečítajú bez pádu.

| test | výsledok |
|---|---|
| `test-volne-odkazy.mjs` (nový, web) | 33 z 33 |
| `vzhlad-volne-odkazy.mjs` (nový, server) | 16 z 16 |
| skúška editora (lokálny backend vetvy) | 11 z 11 |
| `test-odolnost.mjs` | 19 z 19 |
| `test-admin-smoke.mjs` | OK, zahodené zápisy 0 |
| `vzhlad-api.mjs` (server) | 223 z 224 (jediné zlyhanie: súbor v `public/uploads`, ktorý pracovný strom nemá) |
| `test-zhoda.mjs` po úlohe 1 | pixely 90 z 90, DOM 84 z 90 (kronika: neviditeľný atribút `data-pocet`) |
| `test-vykon.mjs` | balík +1,35 kB gzip (strop 15), LCP bez zmeny (medián 816 ms) |
| `test-editor.mjs`, `test-mobil.mjs` | **nespustené**, príkazy na spustenie sú v `docs/ODOVZDANIE.md` kap. 5 |

## 2. Úloha 2 – celý web podľa základu

**Meranie** (zaklad-webov, 48 stránok × 1440 / 412 / 320 px = 1680 výsledkov):

| | prešlo | neprešlo | z toho chyby | odporúčania | na posúdenie | neuplatňuje sa | nezmerané |
|---|---|---|---|---|---|---|---|
| východisko (main) | 681 | 617 | 92 | 525 | 13 | 325 | 44 |
| vetva, úplný beh | 880 | 424 | 38 | 386 | 72 | 266 | 38 |

Úplný beh je z času pred vrátením mapy (7d2b63e) a pred bodmi 2b – 2d. Vrátenie mapy vracia jej vlastné nálezy
(kontrast mien miest a zhlukov, fokus bodov) na hodnoty z východiska. Body 2b – 2d sú premerané samostatne (nižšie).

Oproti východisku je 31 výsledkov „horších“ a žiadny z nich nie je zhoršenie webu:
- **28× navštívené odkazy:** pred tým „neuplatňuje sa“, lebo stránka nemala `<main>`. Vzhľad odkazov sa nezmenil.
- **2× kontrast mapy pod veľkou diskusiou:** mapu tam dala požiadavka K5. Nálezy mapy sú rovnaké ako na úvode
  východiska.
- **1× prvá zastávka klávesnice:** chyba nástroja, opravená v bode 2d.

19 skutočných zhoršení, ktoré spôsobila vetva, je opravených v 1305522 a fe1af9a.

**Posudok** (360 pravidiel katalógu na každý typ stránky: splnené / nesplnené / neuplatňuje sa / neviem posúdiť;
celý s dôkazmi v `docs/POSUDOK.md`):

| typ stránky | východisko (main) | vetva |
|---|---|---|
| úvod | 176 / 31 / 100 / 53 | 191 / 21 / 99 / 49 |
| zoznam | 165 / 26 / 129 / 40 | 178 / 22 / 125 / 35 |
| detail | 160 / 29 / 121 / 50 | 177 / 23 / 111 / 49 |
| formulár | 175 / 24 / 113 / 48 | 182 / 17 / 112 / 49 |
| právne | 157 / 22 / 138 / 43 | 166 / 15 / 135 / 44 |
| 404 | 165 / 22 / 136 / 37 | 175 / 14 / 134 / 37 |

**Zjednotenie** (`docs/STYL.md`, premenné `--hr-*`):

| | rôznych hodnôt / výskytov pred | po |
|---|---|---|
| zaoblenia | 47 / 249 | 10 / 51 (stupnica `--hr-radius-xs … pill`) |
| farby | 617 / 1072 | 614 / 1020 (49 starých inline farieb článku → tokeny) |
| veľkosti písma | 86 / 468 | nezjednotené (menilo by vzhľad), len text tela na mobile 16 px |
| odstupy | 137 / 1027 | nezjednotené, návrh stupnice v `docs/STYL.md` |

**Opravené po dávkach plánu (každá vlastný commit):**
- fokus viditeľný a nezakrytý;
- popis poľa hľadania;
- obmedzený pohyb;
- farba odkazov len pre odkazy;
- odkazy v tom istom okne;
- text tela na mobile 16 px;
- kontrast textu (mimo mapy);
- dotykové ciele;
- h1 na neexistujúcom článku.

**Doplnok zo 14. 11. (bod 2):**

| bod | stav | meranie pred → po |
|---|---|---|
| 2a kontrast popiskov mapy | **zrušené** – mapa je na pokyn zadávateľa 1:1 ako main (7d2b63e), nálezy mapy ostávajú, návrh v `docs/STYL.md` | – |
| 2b rozmery obrázkov (90e7fbf) | hotové, vzhľad sa nemení (snímky 0 rozdielnych pixelov) | nálezy 1641 → 48, výsledky neprešlo 48 → 4 (zvyšok: dlaždice mapky polohy) |
| 2c ciele pod 24 px (5325094) | hotové: omrvinky galérie, aktualít a profilu, dve tlačidlá-odkazy v účte, tlačidlá fotiek v galérii článku; ciele vo vete norma vyníma | cieľov pod 24 px: nálezy 258 → 250 + galéria 99 z 99 tlačidiel má šírku stĺpca už pred stiahnutím fotky; rozostup 8 px (odporúčanie, nie norma) len ako návrh |
| 2d prvá zastávka klávesnice | chyba nástroja, opravená v zaklad-webov (30304a7) so skúškou na neutrálnej stránke | KG.02 „prvá zastávka nie je Preskočiť na obsah“: nálezy 4 → 0; skúšky nástroja 68 z 68 |

Po oprave nástroja meria fokus celé poradie Tab od začiatku. Na veľkej diskusii a úvode preto pribudli iné, skutočné
nálezy fokusu: zhluky mapy zakryté štítom mapy, slabší rám pri kategóriách v hlavičke, pole hľadania bez zmeny pri
zameraní. Ostávajú na ďalšiu dávku. Mapa sa nemení.

## 3. Úloha 3 – nálezy z auditu (každý bod vlastný commit)

| bod | stav |
|---|---|
| 1 | hotové: rad hlavičky sa pri 1440 px už neoreže („Ďalšie“); „Aktuality“ sú v mobilnom menu raz |
| 2 | hotové: `<main>`, „Preskočiť na obsah“, prepínač jazyka má meno so skratkou |
| 3 | hotové: mapa stránok bez mŕtvych adries (`/hradiska`, `/kultura`, `/archeologia`, `/pramene`, `/pravek`); 14 kategórií × 3 jazyky s titulkom, popisom a canonical; tlačidlo 404 vedie na kategórie; mapa stránok 1152 adries |
| 4 | hotové: `/en/…` a `/de/…` majú `<html lang>` zo servera |
| 5 | hotové: kategória ukáže všetky články („Zobraziť ďalšie“, Aktuality 80 z 80) |
| 6 | hotové: youtube-nocookie; YouTube, Vimeo, Sketchfab a Facebook sa načítajú až po kliknutí (pred kliknutím 0 požiadaviek na službu); cookie lišta na mobile najviac 45 % okna |
| 7 | hotové: neexistujúci článok má nadpis, cesty ďalej a `noindex` |
| 8 | hotové: `aria-activedescendant`, výsledky vľavo, stav načítania registra |
| 9 | hotové: service worker nepredsťahuje nepoužité písma (Cinzel, Cormorant) |
| 10 | hotové: formulár „Staňte sa spolupracovníkmi“ pripraví e-mail; čo treba na odosielanie zo servera, je v otázke 8 |

Body „len zoznam“ (nemenené) sú v časti „Pred spustením“ a v `docs/STYL.md`.

## 4. Otázky a chýbajúce podklady pre Petra

Text sa dá poslať tak, ako je:

> Peter, k úpravám webu podľa Tvojho e-mailu zo 14. 11. potrebujeme od Teba tieto veci:
>
> 1. **Stredoveké hrádky.** Kategóriu treba najprv založiť v administrácii, postup je pripravený. Potrebujeme:
>    (a) potvrdiť názov „Stredoveké hrádky“ a preklady „Medieval small forts“ / „Mittelalterliche kleine Burgen“;
>    (b) zoznam článkov, ktoré do nej patria – článok môže byť len v jednej kategórii, takže z doterajšej odíde;
>    (c) kresbu na dlaždicu (na šírku 3 : 2, aspoň 1200 × 800 px, v štýle ostatných dlaždíc);
>    (d) 1 – 3 vety úvodu na stránku kategórie.
> 2. **Naše ďalšie blogy.** Starý web mal pri tomto tlačidle zoznam štyroch blogov. Na nové tlačidlo potrebujeme jednu
>    adresu, kam má viesť, a obrázok.
> 3. **Archeoskanzeny a Odporúčané stránky k dejinám Slovanov.** Starý web mal pri nich zoznamy (12 a 16 odkazov). Nový web
>    na zoznam nemá stránku. Navrhujeme z každého urobiť článok so zoznamom (texty a odkazy dodáš Ty), alebo nám povedz
>    jednu adresu, kam majú viesť. Dovtedy sú skryté.
> 4. **Občianske združenie Hradiská.** Odkaz teraz vedie na článok o zásadách združenia (s logom). Ak má viesť na blog
>    hradiska333.blogspot.com ako na starom webe, daj vedieť.
> 5. **Jeden názov pre kategóriu.** Niektoré kategórie majú na rôznych miestach rôzne mená: „Strážna funkcia“ v hlavičke a
>    „Hospodárska funkcia“ na dlaždici, „Staroveké sídla“ a „Staroveké hradiská“, „Refugiá“ a „Refúgiá“. Ktoré mená platia?
> 6. **15 alebo 16 rokov.** Na úvode je „16 rokov činnosti“ (2010 – 2026), v kronike „15 rokov“ (roky, v ktorých sú zápisy).
>    Návrh: na úvode „16 rokov činnosti“, v kronike „zápisy z 15 rokov“. Súhlasíš?
> 7. **Údaje združenia.** Do päty a do ochrany osobných údajov potrebujeme IČO, sídlo, registračné číslo a kontaktnú adresu.
> 8. **Formulár „Staňte sa našimi spolupracovníkmi“.** Teraz pripraví e-mail v poštovom programe návštevníka. Ak má správu
>    odoslať web sám, treba to doplniť na serveri (odosielanie pošty a ochrana pred spamom). Stačí e-mail, alebo to chceš?
> 9. **Meranie návštevnosti.** Chceš na webe štatistiku návštev? Odporúčame nástroj bez cookies (Umami alebo Plausible).

## 5. Pred spustením

- [ ] **Nasadenie v poradí backend → web → editor vzhľadu → appka** (`docs/ODOVZDANIE.md`). Pri každom kroku je tam aj overenie a vrátenie.
- [ ] **K1:** založiť kategóriu a zverejniť vzhľad podľa `docs/K1-STREDOVEKE-HRADKY.md`. Potom znovu nasadiť web, aby kategória bola v mape stránok.
- [ ] **Noindex:** `vercel.json` posiela `X-Robots-Tag: noindex` len na `*.vercel.app`. Na hradiska.sk overiť hlavičku a `robots.txt` (Allow, `Sitemap: https://hradiska.sk/sitemap.xml`).
- [ ] **Doména:** hradiska.sk na Vercel, presmerovanie www ↔ bez www. `SITE_URL` pre prerender a mapu stránok, inak canonical a hreflang mieria na ukážku.
- [ ] **Šifrované spojenie Vercel → backend:** dnes `http://188.245.47.29`. Postup:
  1. doména `api.hradiska.sk`;
  2. TLS proxy na serveri;
  3. `url` v Strapi;
  4. `vercel.json`, `PRERENDER_STRAPI_URL` a `SITEMAP_STRAPI_URL`;
  5. `src/lib/api-adresa.ts` pre appku;
  6. zavrieť port 1337 zvonka.
- [ ] **Neznáme adresy vracajú 200** (SPA). Skutočný 404 by chcel zoznam platných ciest vo `vercel.json`. Neexistujúci článok má aspoň `noindex`.
- [ ] **Skryť tlačidlo Pripomienky** (je verejné len na čas pripomienok).
- [ ] **Presmerovania zo starého webu:** 406 vo `vercel.json`. Overiť najčastejšie adresy zo Search Console a doplniť štítky `/search/label/…`, stránky `/p/…` a feed.
- [ ] **Search Console a Bing:** overiť doménu, odoslať `sitemap.xml` (1152 adries).
- [ ] **E-mail z backendu:** Hetzner blokuje port 465, ísť cez 587 STARTTLS. Overiť registráciu a obnovu hesla na ostrom webe.
- [ ] **Analytika:** súhlas je pripravený, skript nie je zapojený (otázka 9).
- [ ] **Údaje združenia** v päte a v ochrane údajov (otázka 7).
- [ ] **Appka:** API na https, OTA overiť na emulátore `hradiska`.
- [ ] **Záloha DB** pred spustením. Skontrolovať `hradiska-straz.sh` (SK úpravy pretekajúce do EN).
- [ ] **Register hľadania** má 1,2 MB a prvé hľadanie trvá ~4 s. Zapnúť kompresiu na serveri, alebo zmenšiť register.
- [ ] **Výška fotoarchívu na mobile:** galéria je na mobile veľmi dlhá. Návrh: menej skupín rozbalených naraz.
- [ ] **Posledné meranie základom** nad ostrou doménou (`zmeraj`, `kontrola`).

## 6. Čo som rozhodol sám a čo som neurobil

**Rozhodol som sám** (dôvody v `STAV.md`):
- K1 patrí do horného radu (typy hradísk), nie do spodného ako na náčrte.
- Hlavička: „Ďalšie“ (priority+) namiesto orezania.
- K2 v jazyku dlaždíc kategórií, obrázky bez orezu.
- K3 ako vodorovné karty.
- „Občianske združenie“ vedie na článok.
- K5: „Mohlo by vás zaujímať“ pred blokom z úvodu.
- Počet v diskusii zo servera.
- Zdieľanie ostáva v novom okne.
- Formulár → pripravený e-mail.
- Náhľad pred videom bez obrázka zo služby.
- Zjednotenie bez zmeny písma a odstupov.
- Ciele pod 24 px som zväčšil vnútorným odsadením so záporným okrajom, takže sa nič neposunie.
- Návrhy názvov K1 v EN a DE sú podľa slovníkov.

**Neurobil som:**
- **K1:** kategóriu som nezaložil. V Strapi nezapisujem.
- **K2 a K3:** tri skryté položky nemajú cieľ ani obrázok. Nevymýšľal som ich.
- **`test-editor.mjs` a `test-mobil.mjs`** som nespustil. Potrebujú prístupové údaje lokálneho backendu, ktoré nekopírujem. Príkazy sú v `docs/ODOVZDANIE.md`.
- **`test-zhoda.mjs`** som po úlohách 2 a 3 nespustil. Zámerné zmeny menia pixely na každej stránke, overenie robí meranie základom.
- **Nemenil som** navštívené odkazy, veľkosti písma, odstupy, prvú obrazovku, dĺžku riadku a rozostup 8 px medzi cieľmi. Na rozostup 8 px norma pri cieľoch od 24 px nežiada. Všetko je ako návrh v `docs/STYL.md`.
- **Ponechal som ciele pod 24 px v texte vety** („Prihláste sa“, „ochrane osobných údajov“). Norma ich vyníma ako ciele v texte.
- **Mapa je na pokyn zadávateľa vrátená 1:1 do stavu `main`** (7d2b63e): veľká mapa aj mapka polohy v článku. Vrátili sa tým aj opravy základu na mape (kontrast mien miest a zhlukov, viditeľný fokus bodov, podklad zdroja satelitu, zaoblenia). Nálezy mapy ostávajú ako na začiatku, návrh je v `docs/STYL.md`. Mapa pod článkom ostala, je to požiadavka K5.
- **Nič som nezlúčil, nenasadil ani nezmazal.** Mŕtvy kód (72 súborov) a nepoužité závislosti som nechal. Zoznam je v `docs/STYL.md`.

Commity a ich vrátenie: `docs/ODOVZDANIE.md` kap. 7.
