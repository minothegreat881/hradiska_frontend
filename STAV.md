# STAV – hradiská podľa základu a požiadavky klienta (vetva `zaklad-web`)

Zadanie (14. 11. 2026): tri úlohy za sebou – 1. požiadavky klienta K1 – K5 (Peter, e-mail 14. 11.), 2. celý web podľa základu
(skill zaklad-webov), 3. nálezy z auditu. Poradie platnosti: pravidlá zadávateľa > základ > požiadavky klienta.
Výsledok len na náhľad vetvy, main a ukážku pre klienta (webdesignforhradiskask.vercel.app) nemeniť.

## Kde čo je

- Pracovný strom: `Git-Projects/hradiska-zaklad`, vetva `zaklad-web` z main 207d4d1 (`node_modules` je spojenie na hlavný checkout).
- Backend: `Git-Projects/hradiska-strapi-zaklad`, vetva `zaklad-web` z master 1dfd4bd (pracovný strom, `node_modules` je spojenie);
  zmeny len na vetve, lokálne, na ostrý server nie.
- Merací projekt: `zaklad.projekt.json` (48 stránok: web 30, článok 6, en 6, de 6), pri meraní skryté cookies, výzva appky, pripomienky.
- Merania na snímkach stavby: `Git-Projects/zalohy-hradiska/zaklad-2026-11-14/`
  - `nahlad-server.mjs <dist> <port>` – ako Vercel; `/strapi/*` na backend LEN GET/HEAD (zápis 403);
  - `proxy-len-citanie.mjs 1338` – referenčné Strapi pre testy vzhľadu (`spolocne.mjs` čaká :1338) = ostrý backend LEN GET/HEAD;
  - `kopia-bez-vzhladu.mjs <dist> <cieľ>` – kópia stavby bez vloženého vzhľadu (testy vzhľadu ho podstrkujú cez API);
  - `snimky-k.mjs <adresa> <priečinok>` – snímky a merania K1 – K5 (domovská, dva články, EN, DE; 1440 a 412);
  - `snimka.sh <meno>` – kópia `dist` do `strom-<meno>`; `projekty.mjs` – kópia projektu nad snímkou.
- Stavba: `npm run build` (sitemap → vite → prerender; číta ostrý backend len GET). Pozor: prepíše `public/sitemap.xml`
  (konce riadkov) – necommitovať, ak sa obsah nemení.

## Vzorka článkov (šablóna)

najdlhší titulok `z-stegmann-rajtar-…-2005-2006` · dlhý s galériou `bojna-vyznamne-velkomoravske-centrum` ·
veľká diskusia `nelegalny-detektorizmus-skodi-nasej-historii` (209) · bez titulnej fotky `alexander-ruttkay-o-svatoplukovi-a-nitre` ·
aktuality `vyprava-polske-hradiska-2-…` · poloha a časová os `nitra`.

## Postup

- [x] Vetva, pracovný strom, merací projekt
- [ ] Východisko (úplné meranie) – beží
- [x] Úloha 1: K1 – K5 (web, editor, backend na vetve, testy) – pozri nižšie
- [ ] Úloha 2: posudok, zjednotenie, dávky opráv, overenie
- [ ] Úloha 3: nálezy z auditu 1 – 10, zoznam na rozhodnutie
- [ ] Správa (súbor + chat)

## Úloha 1 – čo je hotové

| | čo | kde |
|---|---|---|
| K1 | Kategória „Stredoveké hrádky“ v Strapi NIE JE (14 kategórií, žiadne štítky). Dlaždica = kategória, takže sa nekreslí. Pripravené: rad dlaždíc počíta stĺpce z počtu (6 typov sa zmestí do jedného radu), hlavička má „Ďalšie“ (priority+) – rad sa už neodreže potichu. | `LabKategorieRychle`, `LabNav`, `theme.css` |
| K2 | Rad 5 obrázkových odkazov pod hľadaním, pred mapou (domovská aj pod článkom). Všetkých 5 má cieľ aj obrázok. | `LabOdkazy.tsx` (`RadOdkazov`), `domov.odkazy` |
| K3 | Pod dlaždicami činnosti: 3 tlačidlá (2 viditeľné, „Naše ďalšie blogy“ skryté) a 4 textové odkazy (2 viditeľné). Pod článkom 7 dlaždíc činnosti v jednom rade (1440) / 4 + 3 (stredná šírka). | `TlacidlaCinnosti`, `OdkazyCinnosti`, `cinnost.tlacidla`, `cinnost.odkazy` |
| K4 | Diskusia zbalená, tlačidlo s počtom príspevkov zo servera (`meta.pagination.total`); rozbalí sa kliknutím, sama pri `#discussion` / `#k-…` a po odoslaní komentára či odpovede. Zoznam sa sťahuje až po rozbalení, všetky strany (predtým strop 100 – článok s 209 komentármi ukazoval 100). | `CommentSection.tsx` |
| K5 | Pod článkom: súvisiace → hľadanie (výzva, pole, populárne) → rad K2 → mapa → činnosť s K3. Index hľadania sa sťahuje až pri prvom hľadaní (nezmenené). | `LabArticle.tsx`, `LabHladanie.tsx` |

Nový tvar údajov (`typy.ts`, identický vo FE aj BE): `VolnyOdkaz { id, text, obrazok|null, ciel|null, viditelny, hlavny? }`,
`VolneOdkazy { viditelne, polozky }`; voliteľné polia `domov.odkazy`, `cinnost.tlacidla`, `cinnost.odkazy`; limit 8 odkazov.
Zmenené spolu: typy, kontrola (voliteľné polia, `zbierajOdkazy` – server ich rozrieši a chráni obrázky), čítanie (chýba → základ),
prevod, zoznam zmien, základný vzhľad (`data/odkazy.ts`), editor (plátno: text, obrázok, poradie, skrytie, odstránenie, „+“;
panel a formulár: aj cieľ a hlavné tlačidlo; nový panel „Odkazy pod hľadaním“, v Činnosti „Tlačidlá“ a „Odkazy“).
Zlúčenie (`zlucenie.ts`) sa nemení – voľné odkazy nič nezapisujú do iných typov.
Staršie koncepty: editor pri načítaní doplní chýbajúce zoznamy zo základu (prevedené na documentId a id súborov) a ukáže to ako neuloženú zmenu.

### Odkiaľ sú ciele a obrázky (nič vymyslené)

Bočný panel starého webu (www.hradiska.sk, Blogger) → nové adresy podľa presmerovaní vo `vercel.json` → obrázky z knižnice médií
(porovnané okom so starým panelom, montáž v `zalohy-hradiska/…/porovnanie`, scratchpad):

- Pôvod Slovanov → /blog/kedy-prisli-slovania-na-slovensko · mapa kultúr (súbor 6507, novšie vydanie obrázka z panela)
- Archeologické obdobia → /blog/archeologicke-kultury-na-slovensku-datovanie · tabuľka (5918 = obrázok z panela)
- Občianske združenie Hradiská → /blog/zakladne-zasady-obcianskeho-zdruzenia-hradiska · logo (5008) – ROZHODNUTIE, pozri nižšie
- Nálezné vo výške 100 % → /blog/ohlasit-archeologicky-nalez-sa-oplati-patri-vam-nalezne · mince (5059, tá istá séria ako v paneli)
- Detektor → /blog/nelegalny-detektorizmus-skodi-nasej-historii · „zákaz detektorov“ (4679 = obrázok z panela)
- Naša facebooková skupina → https://www.facebook.com/groups/118846781525141/ · „facebook“ (4741 = obrázok z panela)
- Informačné tabule (hlavné) → kategória informacne-tabule · tabula1 (1987 = obrázok z panela)
- Mapy → https://www.slovia.sk/ (panel „Mapy“, Image64) · Knihy → /blog/knihy-o-slovanoch (panel „Knihy o Slovanoch“)

### Pre Petra – čo chýba (skryté, nič nevymyslené)

1. **Kategória „Stredoveké hrádky“** – v Strapi nie je. Postup: v administrácii Kategórie pridať kategóriu (názov, slug
   `stredoveke-hradky`, popis, obrázok), potom v editore vzhľadu: dlaždica do prvého radu (typy hradísk), kategória do hlavného
   radu menu, krátky názov a tvary počtu, EN a DE názov. Rozhodnutie o rade nižšie.
2. **Naše ďalšie blogy** (tlačidlo) – starý panel mal zoznam štyroch blogov (fanziny, história Marikovej, Slováci v Uhorsku,
   múzeum Janech), nie jeden cieľ, a žiadny obrázok. Treba: kam má tlačidlo viesť (napr. článok so zoznamom blogov) a obrázok.
3. **Archeoskanzeny** (textový odkaz) – panel mal zoznam 12 skanzenov s odkazmi; nový web nemá stránku, kam by viedol jeden odkaz.
   Treba: článok so zoznamom (texty dodá Peter) alebo jeden cieľ.
4. **Odporúčané stránky k dejinám Slovanov** (textový odkaz) – to isté, panel mal 16 odkazov.
5. **Občianske združenie Hradiská** – starý panel viedol na blog hradiska333.blogspot.com (jeho obrázok v knižnici nie je);
   odkaz teraz vedie na článok o zásadách združenia. Ak chce blog, zmení cieľ v editore jedným klikom.
6. **Pôvod Slovanov a Nálezné** – v knižnici je novšie vydanie mapy (6507) a fotka z tej istej série (IMG_8191, panel mal IMG_8190).

## Rozhodnutia a konflikty

(zapisujú sa priebežne)

- Mŕtva cesta `/sites/<slug>` (SiteDetailPage nad mock dátami) – žiadny živý odkaz na ňu nevedie; nemeria sa, ide do zoznamu mŕtveho kódu.
- „Prevziať dobré vizuálne prvky zo ZaPA“ (pokyn Milana) len tam, kde nejde o zmenu rozloženia, písma ani farebnosti
  (vzhľad hradísk klient schválil): správanie (mobilné menu, hľadanie, prístupnosť), nie vzhľad.
- **K1 – rad: horný (typy hradísk), nie spodný ako na náčrte.** Stredoveké hrádky sú typ sídla; základ (Gestalt: podobnosť
  a spoločný región, Jakobov zákon – zoskupenie podľa toho, čo vec je) ich radí k typom hradísk, nie k „Pramene a tradícia“
  (texty, povesti, listiny). Konflikt s náčrtom zapísaný; minimálna zmena: rad typov počíta stĺpce z počtu.
- **K1/hlavička – priority+.** Pri 1440 px sa rad odrezal za „Staroveké sídla“ (posuvník skrytý, koniec radu sa dal len uhádnuť).
  Teraz: čo sa celé nezmestí, je za tlačidlom „Ďalšie N“ hneď za poslednou viditeľnou kategóriou; otvorí register kategórií
  (mega-ponuka s celým zoznamom). Pri 1440 sú v rade 4 + „Ďalšie 2“ (predtým 5 celé + odrezok). Na plátne editora bez zmeny.
- **K2/K3 – vzhľad.** Rad K2 stojí hneď pod dlaždicami kategórií, preto ich jazykom (mriežka 1264 px / 5 stĺpcov, rám 3 : 2
  na karte, názov Inter 700 v strede); obrázky sú grafiky s textom (logo, tabuľka, značka) → `contain`, nič sa neoreže.
  Tlačidlá K3 sú vodorovné karty (obrázok vľavo, názov vpravo), hlavné dvojnásobnej šírky. Textové odkazy podčiarknuté, cieľ 44 px.
- **K2 Občianske združenie** – cieľ článok o zásadách združenia (na webe, s logom v knižnici), nie blog z panela (obrázok
  v knižnici nie je). Peter môže zmeniť (bod 5 vyššie).
- **K5 – „Mohlo by vás zaujímať“ hneď za článkom a diskusiou, blok „ako na domovskej“ až za ním.** Základ KT.03 (kostra detailu:
  obsah → súvisiace → ďalšie kroky). Konflikt s „hneď za Diskusiou“ zapísaný; odchýlka je jedna sekcia.
- **K4 – počet** zo servera, kým je diskusia zbalená (1 malá požiadavka); po rozbalení počet z načítaného stromu (bez zablokovaných).
- **Odkazy mimo webu** (Facebook, slovia.sk) sa otvárajú v tom istom okne (základ Z1.01).
- **Testy vzhľadu – prostredie.** Referenčné Strapi :1338 = proxy na ostrý backend len na čítanie. Ostrý build má vložený vzhľad
  v3, takže web podstrčený vzhľad s nižšou verziou ignoruje; test odolnosti preto beží nad kópiou stavby bez vloženého vzhľadu
  (tak bežal pôvodne). Na `main` aj na vetve: 19 z 19.

## Úloha 1 – testy a merania

| test | výsledok |
|---|---|
| `test-volne-odkazy.mjs` (nový) | 33 z 33 (vrátane: starý web z `main` nový tvar prečíta bez pádu, stará kontrola ho odmietne) |
| `test-odolnost.mjs` | 19 z 19 (vetva aj `main`, stavby bez vloženého vzhľadu) |
| `test-admin-smoke.mjs` | OK, zahodené zápisy 0 |
| `test-vykon.mjs` | balík +1,35 kB gzip (strop 15). LCP 390: lepšie. LCP 1440 v prostredí testu (bez vloženého vzhľadu) +76 ms – h1 sa kreslí až po vzhľade z API; s vloženým vzhľadom (ako na produkcii) medián 816 ms oboje (5 behov). |
| `test-zhoda.mjs --rezim 1 --zamerne .lnav-cats` (kategórie, kronika) | beží |
| typová kontrola (tsc, dočasný tsconfig mimo repa) | 32 chýb ako na `main`, žiadna nová |

Merania K (`zalohy-hradiska/zaklad-2026-11-14/k-po/merania.json`), pred → po:
- K2: odkazov pod hľadaním 0 → 5 (všetky s obrázkom a cieľom, aj EN/DE); šírka stránky 1440/412 bez vodorovného posunu.
- K3: tlačidiel 0 → 2 viditeľné (+1 skryté), textových odkazov 0 → 2 (+2 skryté); dlaždice činnosti pod článkom 6 + 1 → 7 v jednom rade (1440).
- K4: výška diskusie pod článkom so 209 komentármi: zbalená 57 px; počet 209 (predtým sa načítalo a ukazovalo 100).
- K5: výška článku `nelegalny-detektorizmus…` 1440: zbalená diskusia skrátila stránku; blok hľadanie + K2 + mapa + činnosť je pod súvisiacimi.
- Konzola bez chýb na všetkých 10 pohľadoch.

## Nasadenie úlohy 1 (poradie)

1. **Backend** (`hradiska-strapi`, vetva `zaklad-web` → master → server): mení sa len `src/api/vzhlad-webu/typy.ts` a `kontrola.ts`.
   Na serveri: `git pull`, `npm run build` (TS + admin; ak admin padá na pamäť, postup v pamäti „Panel Strapi na serveri padá na pamäť“),
   reštart služby `hradiska`. Overiť: `GET /api/vzhlad-webu` 200; editor uloží koncept s novými poliami.
   Starý web a appka nový tvar prečítajú (test), stará kontrola ho odmietne – preto backend PRVÝ.
2. **Web** (`zaklad-web` → main → Vercel). Bez zverejneného nového vzhľadu web kreslí K2/K3 zo základu v kóde (`data/odkazy.ts`).
3. **Editor** je súčasť webu (nasadí sa s ním). Prvé otvorenie editora doplní nové zoznamy do konceptu → Uložiť → Zverejniť
   (až potom rozhoduje vzhľad z DB, aj o EN/DE adresách článkov).
4. **Appka**: nič nestavať; OTA si stiahne nový web, staré balíky nový tvar čítajú bez pádu.
