# Vzhľad webu — vrstva, z ktorej web kreslí „prezentáciu“

Stav: fázy F2 (web číta vzhľad) a F3 (prevod dnešného stavu) z plánu úpravy webu z pohľadu webu.
Editor (F4) a klasická úprava (F5) ešte nie sú; backend (`GET /api/vzhlad-webu`) stavia samostatná vetva v `hradiska-strapi`.

## Čo je vzhľad

Všetko, čo je na stránkach prezentácia a predtým bolo napísané napevno v komponentoch:
dlaždice kategórií (skupiny, poradie, popisky, obrázky, počty), úvod domovskej, výzva a „Populárne“,
sekcie domovskej a ich poradie a viditeľnosť, riadky „Ďalší obsah“, činnosť združenia, kronika
(úvodný článok, pripnuté zápisy, obrázok, fotogaléria), „Pridajte sa k nám“, rozdelenie a krátke názvy menu,
päta (stĺpce, odkazy, siete), obrázok, názov, popis, radenie a pripnuté články stránky kategórie.
Obsah článkov do vzhľadu nepatrí.

Tvar údajov je v `src/lib/vzhlad/typy.ts` (identická kópia je v backende, mení sa len spolu).
Texty majú jazyky výslovne `{ sk, en, de, enZo, deZo }`, kategórie a články sa odkazujú cez `documentId`
(`dokument`), fotky cez `id` súboru.

## Súbory

| súbor | čo robí |
|---|---|
| `src/lib/vzhlad/typy.ts` | spoločná definícia (web aj backend) |
| `src/lib/vzhlad/zakladny.ts` | `ZAKLADNY_VZHLAD` — dnešný web zapísaný ako vzhľad, poskladaný z konštánt v `src/data/` |
| `src/lib/vzhlad/nacitaj.ts` | odkiaľ sa vzhľad berie (vložený / základný / API) a tolerantné čítanie |
| `src/lib/vzhlad/citaj.ts` | spoločné čítanie pri vykresľovaní (slug kategórie, článok v jazyku, záznam kategórie, obrázok so zálohou, menu, cieľ odkazu) |
| `src/lib/vzhlad/texty.ts` | `textVzhladu(text, jazyk?)`, krátke názvy menu, tvary počtu |
| `src/lib/vzhlad/obrazky.ts` | obrázok vzhľadu → `src`/`srcSet`/`object-position`, záloha pri chybe načítania |
| `src/lib/vzhlad/VzhladContext.tsx` | `VzhladProvider`, `useVzhlad()`, `useUpravy()` |
| `src/lib/vzhlad/upravy.ts` | značky režimu úprav (`data-vw`, `data-vw-skryte`) |
| `src/lib/vzhlad/UpravitStranku.tsx` | tlačidlo „Upraviť túto stránku“ |
| `src/data/domovska.ts`, `menu.ts`, `pata.ts` | konštanty presťahované z komponentov — zdroj základného vzhľadu |

Konštanty ostávajú v kóde (`data/rozcestnik.ts`, `data/categories.ts`, `data/cinnost.ts` a tri nové súbory vyššie),
komponenty ich však nečítajú priamo — čítajú vzhľad. Presťahovanie do `src/data/` je kvôli balíku:
základný vzhľad je v hlavnom chunku a nesmie ťahať kód komponentov, ktoré sa sťahujú odložene.

## Odkiaľ sa vzhľad berie (poradie)

1. **Prvé kreslenie:** vzhľad vložený do HTML pri builde — `<script type="application/json" id="vzhlad-webu">`
   s celou odpoveďou `OdpovedVzhladu` (`scripts/prerender.mjs`). Keď tam nie je, **základný vzhľad** z kódu.
   Žiadne čakanie na API, žiadne blikanie.
2. **Hneď potom** `GET ${STRAPI_URL}/api/vzhlad-webu` (cez `lib/api-adresa.ts`, obyčajný `fetch`, nie `fetchStrapi`
   — výpadok tohto endpointu nie je chyba stránky a nepíše sa do konzoly). Keď má web vložený vzhľad, posiela
   `If-None-Match: "v<verzia>"` — len na vlastný pôvod (web cez `/strapi`); appka ide na inú doménu a hlavičku
   by musel povoliť CORS backendu, tam si podmienenú požiadavku urobí vyrovnávacia pamäť prehliadača sama.
3. Keď príde **novšia `verzia`**, web sa prekreslí. Rovnaká alebo staršia verzia, 304, `data: null`, chyba,
   výpadok alebo nečitateľný tvar → web ostane pri tom, čo má (vložený, inak základný).

Service worker API nekešuje, takže starý vzhľad z neho nepríde.

## Tolerantné čítanie (plán, tabuľka 6.4)

| čo sa stane | čo web urobí |
|---|---|
| API nedostupné, chyba, `data: null` | vložený vzhľad z buildu, inak základný = dnešný web |
| `schema` vyššie než `SCHEMA_VZHLADU`, zlý tvar celku | základný |
| zlý tvar jednej časti (domov, kategórie, činnosť, menu, päta) | tá časť zo základného |
| zlý text | text zo základného vzhľadu |
| fotka chýba v `subory` | obrázok zo základného vzhľadu pre tú kategóriu / činnosť / kroniku |
| fotka sa nenačíta (404) | `onError` vymení adresu za obrázok zo základného (hlavička kategórie je CSS pozadie, overí sa vopred cez `Image()`) |
| kategória nie je v `rozriesene.kategorie` (zmazaná) | dlaždica, lišta, riadok aj odkaz v päte sa ticho vynechajú |
| článok nie je v `rozriesene.clanky` pre jazyk stránky | vynechá sa (populárne, pripnutý, úvodný článok kroniky); riadok „vybrané ručne“ doplní najnovšími |
| neznámy typ sekcie | preskočí sa |
| prázdna skupina dlaždíc (aj po vynechaní zmazaných) | nezobrazí sa ani jej nadpis |

Nič z vrstvy vzhľadu nevyhodí výnimku do Reactu. Overuje to `scripts/vzhlad/test-odolnost.mjs`.

## Texty v jazykoch

`textVzhladu(text)`: výslovný preklad (`en`/`de`) → preklad zo slovníka pod slovenským kľúčom (presne ako `t(sk)`)
→ slovenčina. Základný vzhľad má len `sk`, takže vracia to isté, čo predtým `t()` v komponentoch.

Výnimky:
- **Krátky názov v menu** (`popisokMenu`) sa slovníkom neprekladá — doslovný preklad skratky („Všeobecne“ → „Allgemein“)
  nedáva zmysel. Čo pre jazyk chýba, ostáva celý názov kategórie v tom jazyku.
- **Tvary počtu** pod dlaždicou: sk tri tvary, en/de jeden (výslovný alebo slovník nad tretím tvarom).

## Poradie zdrojov pre kategórie

- **Záznam kategórie** (popisok, obrázok, popis, tvary): vzhľad → základný vzhľad (kód). Záznam, ktorý vo vzhľade nie je,
  sa vezme z kódu.
- **Názov** (nadpis stránky kategórie, menu): `nazov` vo vzhľade → názov z databázy cez slovník (ako dnes) → názov z kódu → slug.
- **Popis na stránke kategórie:** vzhľad (a tým kód) → databáza.
- **Poradie v menu:** z databázy (`blog-category.order`) — zverejnenie vzhľadu ho tam zapíše. Len na plátne editora
  (`upravy`) a pri neprázdnom `menu.poradie` sa kreslí navrhované poradie z konceptu.
- **Vybraná fotogaléria:** verejný web ju berie z databázy (`domovska-galeria`), na plátne editora z konceptu
  (`domov.fotogaleria`).

## Komponenty, ktoré čítajú vzhľad

`LabHome` (úvod, poradie a viditeľnosť sekcií), `LabKategorieRychle` (dlaždice), `LabKategorieLista` a `LabKategorieVysuv`
(lišta, tie isté skupiny), `LabDalsiObsah` (riadky: `najnovsie`/`rucne`, `zoradenie`, `lenSObrazkom`, `pocet`, iný obrázok
na dlaždici), `LabCinnost` (poradie, `viditelna` všade, `naDomovskej` na domovskej), `LabAktuality` (úvodný článok
a pripnuté podľa `dokument`, inak slugu; obrázok; viditeľnosť fotogalérie), `LabJoinUs` (texty, e-mail, prosby;
formulár ostáva), `LabNav` (hlavný riadok, skryté, krátke názvy), `LabFooter` (stĺpce, odkazy, siete),
`pages/CategoryPage` (obrázok, popis, názov, `clanky.zoradenie`, `pripnute`).

Zostáva v kóde: triedenie kroniky podľa činnosti (`data/cinnost.ts`), to, ktorá činnosť vedie do vlastnej kategórie,
popis združenia a služobný riadok päty, ikony sietí, mapa, SEO texty, mega‑ponuka menu (názvy z databázy cez slovník).

**S `ZAKLADNY_VZHLAD` kreslí web bajt po bajte ten istý DOM ako pred zavedením vzhľadu** (test zhody, režim 1).

## Režim úprav (pre editor, F4)

Editor obalí plátno vlastným providerom s konceptom:

```tsx
<VzhladProvider hodnota={{ vzhlad: koncept, rozriesene, upravy: true }}>
  <LabHome /> …
</VzhladProvider>
```

Provider s `hodnota` nič nesťahuje; koncept prečíta rovnako tolerantne ako verejný web. V režime úprav:

- prvky dostanú `data-vw="<názov>"` (zoznam nižšie); **mimo režimu úprav nie je v DOM ani jeden `data-vw` atribút**,
- skryté prvky sa nakreslia s `data-vw-skryte="1"` namiesto vynechania (vyšrafované, `theme.css`) — skrytá sekcia,
  skryté dlaždice, hľadanie a populárne, činnosti mimo domovskej, fotogaléria, „Pridajte sa“, skryté kategórie menu,
- mapa sa nenačíta — v tom istom obale `section.lhome-mapa` je zástupný blok `.vw-mapa-zastup` s textom „Mapa“
  (výška ako načítaná mapa: 862 px pri 1440, 650 px pri 390),
- animácie pri vstupe a posune sú vypnuté: koreň stránky (`.parchment` domovskej a kategórie) má `data-vw-upravy="1"`
  (CSS `animation: none`), `motion` nábehy majú `initial={false}`, `ScrollReveal` sa nezjavuje (`EditModeContext`),
- vysúvacia lišta kategórií sa nevysúva a jej kópia lišty značky nenesie.

Na skúšku bez editora je vo vývojovom serveri (`npm run dev`) prepínač `?vzhlad-upravy` — v produkčnom builde nie je.

### Názvy `data-vw` (editor na ne stavia — nemeniť)

| názov | prvok |
|---|---|
| `uvod:nadtitulok`, `uvod:nadpis`, `uvod:znak` | `p.lhero-nadciara`, `h1.lhero-titul`, `picture.lhero-znak` |
| `dlazdice` | `nav.lkat` |
| `skupina:<id>` | `.lkat-rad` |
| `skupina-nadpis:<id>` | `.lkat-predel` |
| `dlazdica:<skupinaId>:<dlazdicaId>` | `a.lkat-dlazdica` |
| `hladanie:vyzva`, `hladanie:pole` | `h2.lhero-vyzva`, `div.lhero-hladanie` |
| `popularne`, `popularne:<index>` | `nav.lhero-rychle`, jeho odkazy |
| `sekcia:<id>` | horný prvok každej sekcie: `section.lhome-mapa`, `section.dob`, `section.lhome-cinnost`, `section.lakv` |
| `dalsi-obsah:nadpis:<sekciaId>` | `.dob-predel` |
| `riadok:<sekciaId>:<riadokId>` | `.dob-kategoria` |
| `riadok-nadpis:<sekciaId>:<riadokId>` | `h2.dob-titul` |
| `riadok-clanok:<sekciaId>:<riadokId>:<index>` | `a.dob-clanok` |
| `cinnost:nadpis`, `cinnost:<kluc>` | `h2` v `.lcin-h`, `.lcin-dlazdica` |
| `kronika:uvod` | `a.lakv-pinned` |
| `kronika:obrazok` | `div.lakv-logo` |
| `kronika:pripnuty:<index>` | prvé karty pásu `a.lakv-card`, ktoré sú pripnuté |
| `kronika:fotogaleria` | `div.lakv-gal` |
| `pridajte-sa` | `section.ljoin` |
| `pridajte-sa:nadtitulok`, `…:nadpis`, `…:citat`, `…:uvod`, `…:email` | nadtitulok, nadpis, citát, úvod, odkaz s e-mailom |
| `pridajte-sa:prosba:<index>` | `article.ljoin-ask` |
| `menu:hlavny`, `menu:dalsi` | rad kategórií v hlavičke (`.lnav-cats-row`), skupiny mobilnej ponuky |
| `menu:<slug>` | `.lnav-cat` (a `.lnav-m-cat` v mobilnej ponuke) |
| `pata:stlpec:<id>` | `.lfoot-col` |
| `pata:odkaz:<stlpecId>:<index>` | odkaz v stĺpci päty |
| `pata:siet:<druh>` | odkaz na sieť v päte |
| `lista:<slug>` | `a.cat-mini` v lište kategórií (na stránke kategórie a článku) |
| `kategoria:obrazok`, `kategoria:nazov`, `kategoria:popis` | `.ch-foto`, `h1.cat-uvod-titul`, `p.cat-uvod-popis` |
| `kategoria:clanok:<index>` | `a.acard` v zozname článkov kategórie |

Ďalšie atribúty len v režime úprav: `data-vw-skryte="1"` (prvok je na webe skrytý), `data-vw-upravy="1"` (koreň stránky).

## Tlačidlo „Upraviť túto stránku“

Na verejnom webe, len keď je v `localStorage` kľúč `hradiska.admin.jwt` (ten istý ako náhľad konceptu článku).
Je to odkaz, prihlásenie overí až administrácia: domovská → `/admin#/vzhlad/domov`, kategória →
`/admin#/vzhlad/kategoria/<slug>`, inde → `/admin#/vzhlad/menu`. Trieda `vw-upravit` (vľavo dole), komponent sa
sťahuje odložene — návštevník bez prihlásenia nedostane do stránky nič. Smerovanie `#/vzhlad/…` v administrácii
dorobí editor (F4).

## Vloženie do HTML pri builde

`scripts/prerender.mjs` stiahne `${PRERENDER_STRAPI_URL}/api/vzhlad-webu`. Keď `data` nie je `null`, vloží celú odpoveď
pred `</head>` každej vygenerovanej HTML (aj koreňovej `index.html`, ktorá je zálohou všetkých ostatných ciest) —
`<` ako `<`. Pri chybe, výpadku alebo `data: null` nevloží nič a build pokračuje.

Do appky to prejde samo: `scripts/priprav-app.mjs` kopíruje koreňovú `dist/index.html` a značku appky vkladá hneď
za `<head>`, vzhľad ostáva pred `</head>`. Overené: prerender proti skúšobnému endpointu (`server.mjs --vzhlad`)
→ vzhľad je v `index.html` aj vo všetkých článkoch a po `priprav-app` v `dist-app/index.html` spolu s `__HRADISKA_APP__`.
`priprav-app` po novom vynecháva aj predvykreslené články pod `en/blog` a `de/blog` (appka ich nečíta) — inak by
728 stránok s vloženým vzhľadom zväčšilo balík appky o vyše 40 MB.

Veľkosť: prevedený vzhľad v1 s rozriešenými údajmi má 58 kB (gzip 14 kB) na každú HTML — viac než odhad v pláne
(10–20 kB), lebo texty sú v troch jazykoch a so `enZo`/`deZo`. Ak to bude prekážať, backend môže vo verejnom GET
vynechať `enZo`/`deZo` (web ich nečíta).

## Prevod dnešného stavu (F3)

`node scripts/vzhlad/prevod.mjs [--odpoved]` vyrobí zo základného vzhľadu vzhľad v1:

- kategórie a články dostanú `dokument` (documentId podľa slovenského slugu),
- fotky `/uploads/…` → `{ id }` súboru (podľa `url` v knižnici médií), súbory webu ostanú cestou,
- výslovné `en`/`de` zo slovníkov `lib/jazyk.ts` a `lib/slovnik-de.ts` — to, čo dnes vracia `t()`; `enZo`/`deZo` = sk.
  Kde slovník preklad nemá (mená v „Populárne“), ostáva `null` — web ukáže slovenčinu ako dnes a editor to označí,
- `kategorie[].nazov` = názov z databázy + en/de cez slovník; záznam dostane aj kategória, ktorá v kóde nie je (`ostatne`),
- `menu.poradie` = dnešné poradie z databázy (`order`, pri zhode tak, ako ho vracia API a kreslí web),
- `domov.fotogaleria.fotky` = dnešná `domovska-galeria`.

Zdroj: verejné API referenčného Strapi, knižnica médií (nemá verejné API) z jeho SQLite databázy otvorenej `readonly`.
Výstup `scripts/vzhlad/vystup/vzhlad-v1.json`, s `--odpoved` aj `vzhlad-v1-odpoved.json` (celé `OdpovedVzhladu`
s `subory`, `kategorie`, `clanky`). Do backendu prevod nič nezapisuje — uloženie ako koncept je krok D4 nasadenia.

## Testy (`scripts/vzhlad/`, výstupy v `scripts/vzhlad/vystup/`, nekomitujú sa)

Prostredie: dnešný web = build z `main` vo worktree `../hradiska-web-zaklad`, nový web = build z vetvy, oba s
`PRERENDER_STRAPI_URL=http://localhost:1338 SITEMAP_STRAPI_URL=http://localhost:1338`, servírované ako na Verceli
(`server.mjs`: `/strapi/*` → backend, súbor alebo priečinok s `index.html` z `dist`, inak `index.html`).
Po builde vrátiť `git checkout public/sitemap.xml`.

| skript | čo overí |
|---|---|
| `test-zhoda.mjs [--rezim 1,2,2v]` | DOM tela a pixely snímky dnešného a nového webu: domovská, všetky kategórie, článok, `/aktuality`; sk/en/de; 1440 a 390. Režim 1 bez vzhľadu z API, režim 2 s v1 z API, režim 2v s v1 vloženým do HTML. `--samo` porovná dnešný web so sebou (stálosť merania). |
| `test-odolnost.mjs` | prípady z tabuľky 6.4 |
| `test-vykon.mjs` | hlavný balík gzip (strop +15 kB) a LCP domovskej (Performance API, 3 behy, medián) |
| `test-admin-smoke.mjs` | administrácia sa načíta a editor otvorí článok; referenčné Strapi smie dostať len GET, preto je relácia podstrčená (`users/me`), ostatné GET idú do Strapi bez tokenu a každý zápis sa zahodí |
| `snimky-upravy.mjs` | snímky domovskej v režime úprav (1440, 390) a zoznam značiek `data-vw` |
| `prevod.mjs` | prevod F3 |

Akceptované rozdiely v teste zhody (režim 2 a 2v), nič iné:
1. **EN a DE domovská, kronika:** úvodný článok a pripnuté zápisy sa začnú zobrazovať správne (predtým sa hľadali podľa
   slovenského slugu a v cudzom jazyku sa nenašli; úvodný článok tým zároveň vypadne z pásu zápisov a s pásom sa
   posunie časová os). Test porovná zvyšok stránky (DOM aj pixely, so zakrytou úvodnou dlaždicou, pásom a osou)
   a zvlášť overí, že úvodná dlaždica vedie na článok v jazyku stránky a pás začína pripnutými.
2. **Adresa obrázka z `formats` namiesto skladanej cesty** (ten istý súbor) — pri dnešných súboroch sú obe adresy
   zhodné (všetky majú zmenšeniny), takže sa toto pravidlo neuplatnilo.

## Výsledky (17. 10. 2026, FE vetva `vzhlad-webu`, referenčné Strapi s kópiou ostrej DB)

| test | výsledok |
|---|---|
| `test-zhoda.mjs` režim 1 (bez vzhľadu z API) | rovnaké 102 z 102 (17 stránok × sk/en/de × 1440/390; DOM aj pixely, tolerancia nula) |
| `test-zhoda.mjs` režim 2 (v1 z API) | rovnaké 102 z 102, z toho 4 s akceptovaným rozdielom kroniky (en/de domovská, 1440 a 390) |
| `test-zhoda.mjs` režim 2v (v1 vložený v HTML) | rovnaké 102 z 102, z toho tie isté 4 |
| `test-odolnost.mjs` | 19 z 19 |
| `test-vykon.mjs` | hlavný balík gzip 98,97 → 108,27 kB (+9,30 kB, strop +15); LCP domovskej (5 behov, medián) 1440: 644 → 532 ms, 390: 448 → 456 ms (v tolerancii) |
| `test-admin-smoke.mjs` | administrácia sa načíta, editor otvorí článok, 0 zápisov |
| `snimky-upravy.mjs` | 91 značiek `data-vw` na domovskej, skryté prvky označené, zástupca mapy 862 / 650 px, mapa sa nenačíta |

Na verejnom webe nie je v DOM ani jeden `data-vw` (overuje test zhody na všetkých 306 pohľadoch). Jediná nová sieťová
chyba v režime 1 je `404 /strapi/api/vzhlad-webu` — referenčný backend endpoint ešte nemá; po nasadení backendu
vráti `{ data: null }`.

Normalizácie merania (rovnako pre dnešný aj nový web): pôvod stránky v adresách (iné porty), obsah sekcie mapy,
snímanie, kým dve snímky po sebe nie sú rovnaké, odložené obrázky stiahnuté pred zachytením DOM, nenačítané obrázky
(v lokálnej kópii médií chýba pár súborov) na snímke skryté. `--samo` (dnešný web proti sebe) dáva zhodu.
