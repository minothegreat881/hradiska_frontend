# Hradiská.sk ako mobilná aplikácia

Rozbor cesty od dnešného webu k aplikácii v App Store a Google Play, pri
podmienke, ktorá v zadaní zaznela ako prvá: **čo sa zmení na webe, musí sa
objaviť aj v aplikáciách** — bez toho, aby sa čokoľvek robilo dvakrát.

---

## 1. Odporúčanie v jednej vete

Zabaliť dnešný web do natívnej schránky cez **Capacitor**, ponechať jediný
zdroj pravdy (`src/`), natívne schopnosti doplniť ako tenkú vrstvu adaptérov
a nové verzie webu posielať do aplikácií **cez vzduch** (OTA) — takže nasadenie
na Vercel znamená zároveň aktualizáciu aplikácií.

## 2. Prečo práve takto

| cesta | zmena na webe sa prejaví | v obchodoch | verdikt |
|---|---|---|---|
| **Capacitor** (odporúčané) | áno, automaticky | áno | ✅ |
| React Native / Expo | **nie** — druhé rozhranie, druhá práca | áno | ❌ ruší podmienku |
| Webview na živú adresu | áno | **Apple odmieta** (4.2) | ❌ |
| Iba PWA (dnešný stav) | áno | **nie** | ⚠️ základ, nie cieľ |

React Native by znamenalo napísať celé rozhranie druhýkrát a odvtedy každú
zmenu robiť dvakrát. To je presne to, čo zadanie vylučuje.

Aplikáciu, ktorá len načíta `hradiska.sk` do okna prehliadača, Apple zamieta
podľa pravidla 4.2 (*minimum functionality*) — musí vedieť niečo, čo web nevie.

## 3. Čo už je hotové (a je toho dosť)

* **PWA**: manifest, ikony vrátane maskable, skratky, service worker
  (`public/sw.js`, v6) s offline shellom a ponukou „Nainštalovať appku".
* **Upozornenia**: `web-push` na Strapi (`api/push-subscription`), VAPID,
  prihlásenie z prehliadača (`src/lib/push.ts`). Logika oznámení
  (`api/notification`) je hotová — natívny push ju len rozšíri o druhého
  odosielateľa, nič sa neprepisuje.
* **Účty**: registrácia, prihlásenie, obnova hesla a **zrušenie účtu**.
  To posledné App Store vyžaduje od každej aplikácie, kde sa dá účet založiť.
* **Moderácia**: pre-moderácia, upozornenia, mazanie komentárov.
* **Rýchlosť**: po optimalizácii má článok ~1 MB, kategória ~0,5 MB.

## 4. Čo bráni zabaleniu dnes — tri konkrétne veci

### 4.1 Adresa API je na desiatich miestach a viaže sa na doménu webu

Súbory `lib/strapi.ts`, `memberApi.ts`, `profileApi.ts`, `photoApi.ts`,
`push.ts`, `related.ts`, `searchIndex.ts` a komponenty `AccountNavLink.tsx`,
`CommentSection.tsx`, `PhotoDiscussion.tsx` majú každý vlastnú kópiu riadka,
ktorý v produkcii skladá adresu z `window.location.origin` a `/strapi`.

V aplikácii je tým pôvodom `capacitor://localhost`, takže **všetkých desať
volaní by mierilo do prázdna**. Treba ich zjednotiť do jedného modulu ešte
pred zabalením — je to hodina práce a bez nej sa appka nepohne.

Na strane Strapi pribudne do CORS `capacitor://localhost` a `https://localhost`.

### 4.2 Mapové dlaždice sú z Esri a offline sa použiť nesmú

Mapa lokality aj mapa hradísk berú podklad zo servera ArcGIS (Esri World
Imagery). Jeho podmienky zakazujú hromadné sťahovanie a ukladanie dlaždíc,
takže **na offline mapu ich použiť nemôžeme**. Bude treba iný podklad —
vlastné dlaždice z OpenStreetMap na Hetzneri (server už beží) alebo platený
zdroj.

### 4.3 Doména musí byť najprv na svojom mieste

Univerzálne odkazy (klik na `hradiska.sk/blog/…` otvorí appku), zápis do
obchodov, OTA aj upozornenia sa viažu na finálnu doménu. Spúšťať appku skôr,
než web beží na `hradiska.sk`, by znamenalo robiť to dvakrát.

## 5. Ako sa zmeny z webu dostanú do aplikácií

Dve vrstvy, každá na niečo iné.

**Vrstva 1 — obsah.** Články, fotografie, komentáre, kategórie idú zo Strapi
cez API, takže sú v aplikácii **hneď**, bez akéhokoľvek vydania. Toto funguje
od prvého dňa samo.

**Vrstva 2 — samotné rozhranie** (JS, CSS, rozvrh). Aplikácia si nesie
zabalený `dist/`, ale pri každom studenom štarte sa spýta servera, či nie je
novší. Ak je, stiahne ho a pri ďalšom otvorení beží nová verzia.

```
npm run app:sync  →  zip balík webu + app-balik.json (verzia, sha256)
        ↓
scp na Hetzner (/opt/hradiska/public/app/)
        ↓
appka sa pri štarte spýta POST /api/aktualizacia → stiahne → beží z nového
```

Nástroj: **@capgo/capacitor-updater** — otvorený zdroj, hostované na našom
serveri, takže bez mesačných poplatkov a bez posielania údajov o telefónoch
tretej strane (`statsUrl` a `channelUrl` sú prázdne). Platená alternatíva je
Ionic Appflow.

**Ako je to zapojené (od 28. 9. 2026 v prevádzke).**

| kus | kde |
|---|---|
| verzia balíka `1.<RRMMDD>.<HHMM>`, zip, sha256 | `scripts/postav-balik.mjs` → `app-balik/`, popis v `app-balik.json` |
| verzia vstavaného balíka v APK | `capacitor.config.ts` ju číta z `app-balik.json` |
| potvrdenie, že nový balík beží | `notifyAppReady()` v `src/nativne/schranka.ts` |
| odpoveď servera | `POST /api/aktualizacia` v backende (`src/api/aktualizacia/`) |
| popis vydaného balíka na serveri | `/opt/hradiska/public/app/aktualizacia.json` |

Tri veci, na ktorých to stojí a ktoré nie sú zjavné:

1. **Vstavaný balík v APK sa hlási verziou zapísanou pri zostavení.** Bez toho
   by si appka hneď po inštalácii stiahla 45 MB toho istého webu, ktorý už
   v sebe má. Preto `postav-balik.mjs` beží **pred** `cap sync`.
2. **`notifyAppReady()` je poistka, nie formalita.** Keď nový balík do 10 s
   nepotvrdí, že rozhranie stojí, appka sa sama vráti na predošlý funkčný
   balík. Bez toho by jedna pokazená verzia webu odstavila aplikáciu všetkým
   a opraviť by sa to dalo len novým vydaním v obchode.
3. **Adresu balíka zapisuje vydávateľ, nie server.** Appka beží na
   `https://localhost` a Strapi stojí za proxy, takže server svoju verejnú
   adresu nepozná — je v `aktualizacia.json`, ktorý nahrávame spolu so zipom.

Odpoveď „netreba nič" musí mať tvar `{kind:'up_to_date', message, version}`.
Bez `kind` si plugin zapíše neúspech a v telefóne to vyzerá ako chyba siete.

**Čo zip váži.** 45 MB, z toho 21 MB sú mapové dlaždice, ktoré sa nikdy
nemenia. Sťahuje sa len vtedy, keď sa web naozaj zmení, ale sťahuje sa celý.
Ďalší krok (nie dnes): dlaždice vyňať z balíka webu a stiahnuť ich raz
zvlášť do súborov aplikácie — balík by potom mal jednotky MB.

Obidva obchody to dovoľujú: Apple v licencii (3.3.2) povoľuje sťahovanie
interpretovaného kódu, pokiaľ nemení účel aplikácie, Google rovnako. Čo takto
obísť **nejde**, sú natívne veci — nové oprávnenie, nový doplnok, ikona,
cieľová verzia systému. Tie si vyžiadajú vydanie v obchode, čo bude pár ráz
do roka.

## 6. Čo dostane aplikácia navyše oproti webu

Toto nie je zoznam ozdôb. Bez aspoň troch z nich Apple aplikáciu zamietne ako
„iba webstránku".

1. **Hradisko na cestu (offline).** Stiahnuť článok aj s fotografiami a
   výrezom mapy okolo lokality. Hradiská sú v teréne, kde často nie je signál —
   toto je dôvod, prečo by si appku niekto nainštaloval.
2. **Hradiská v okolí cez GPS.** Na webe to už je; natívna poloha je presnejšia
   a nepýta sa pri každom otvorení.
3. **Natívne upozornenia.** Na iPhone web-push funguje len pri appke pridanej
   na plochu; natívne funguje vždy.
4. **Fotoaparát.** Pridať fotografiu z výpravy rovno z telefónu.
5. **Zdieľanie systémovým panelom** namiesto vlastných tlačidiel.
6. **Otvorenie odkazu v aplikácii.** E-mail „nový komentár" otvorí appku na tej
   fotografii, nie prehliadač.

## 7. Prispôsobenie zariadeniam

| vec | čo treba |
|---|---|
| výrez displeja, lišta gest | `env(safe-area-inset-*)` — dnes by lišta „Pripomienky" aj cookie panel sedeli na domovskom prúžku |
| tlačidlo Späť na Androide | napojiť na históriu smerovača, inak appka pri prvom klepnutí skončí |
| stavová lišta | tmavý obsah na krémovej hlavičke |
| úvodná obrazovka | statická, z existujúcej značky |
| klávesnica | posunúť formulár komentára, nech ho neprekryje |
| tablet a iPad | rozvrh dnes končí na 1440 px — preveriť 768–1366 |
| skladacie telefóny | zmena šírky za behu |
| veľké písmo v systéme | rozvrh nesmie praskať |
| tmavý režim | šat ho má, treba zladiť s natívnou schránkou |

## 8. Postup po fázach

| fáza | čo | odhad |
|---|---|---|
| 0 | zjednotiť adresu API, CORS, vylúčiť administráciu z balíka appky | 1 deň |
| 1 | Capacitor, Android, beh na zariadení, tlačidlo Späť, bezpečné okraje | 2–3 dni |
| 2 | univerzálne odkazy, úvodná obrazovka, stavová lišta, klávesnica | 2 dni |
| 3 | natívne upozornenia (FCM + APNs) napojené na dnešnú logiku | 2 dni |
| 4 | offline: článok na cestu + mapové dlaždice z vlastného zdroja | 4–6 dní |
| 5 | iOS, zápis do obchodov, posudky | 3–5 dní + čakanie na posudok |
| 6 | OTA linka z Vercelu na Hetzner | 1–2 dni |

Spolu **zhruba tri až štyri týždne sústredenej práce**, z toho polovica na
offline mapu a na obchody.

## 9. Náklady

* Apple Developer Program — **99 USD ročne** (bez toho sa na iPhone nedá nič)
* Google Play — **25 USD jednorazovo**
* Mac na zostavenie iOS verzie — vlastný, alebo cloudový v CI (~10–30 USD/mes.)
* Mapové dlaždice — 0 €, ak si ich vygenerujeme z OpenStreetMap na Hetzneri;
  inak od ~20 USD/mes. za poskytovateľa
* OTA — 0 € pri vlastnom hostovaní

## 10. Čo môže pokaziť zápis do obchodu

* **Apple 4.2** — „iba webstránka". Poistka: offline, GPS, fotoaparát, push.
* **Obsah od používateľov** — Apple žiada možnosť **nahlásiť príspevok** a
  **blokovať používateľa**. Moderáciu máme, ale tlačidlo „Nahlásiť" v
  komentároch **nie je** a bez neho appka neprejde. Treba doplniť.
* **Štítky o súkromí** — čo appka zbiera (poloha, e-mail, fotografie). Zásady
  ochrany údajov máme, treba ich prepísať do formulára Apple a Google.
* **Vek** — komentáre od používateľov znamenajú vekovú hranicu 12+.
* **Prihlásenie cez Apple** — povinné len vtedy, keď ponúkame prihlásenie cez
  Google alebo Facebook. Máme iba e-mail a heslo, takže sa nás netýka.

## 11. Čo neodporúčam

* **Nepísať appku odznova v React Native.** Zruší to podmienku zo zadania a
  zdvojnásobí každú ďalšiu zmenu.
* **Nedávať do appky administráciu.** Editor článkov je nástroj pre počítač;
  v balíku appky nemá čo robiť a posudzovateľ v obchode by naň narazil.
* **Nespúšťať appku pred doménou.** Univerzálne odkazy, obchody aj OTA sa
  viažu na `hradiska.sk`.
* **Nesľubovať offline mapu na Esri dlaždiciach.** Nedá sa to legálne.

---

## 12. Stav prác (27.–28. 9. 2026)

| fáza | stav |
|---|---|
| 0 — adresa API na jednom mieste, CORS | **hotové a nasadené** |
| 1 — Capacitor, Android, APK | **hotové**, podpísané vydanie 1.1 (`sk.hradiska.app`, 51 MB) |
| 2 — bezpečné okraje, Späť, stavová lišta, odkazy, ikona, úvodná obrazovka | **hotové** |
| požiadavky obchodov — nahlásenie a blokovanie | **hotové a nasadené** |
| 3 — natívne upozornenia | čaká na účet Firebase |
| 4 — offline „hradisko na cestu" | nezačaté (mapové dlaždice už v balíku sú) |
| 5 — iOS a zápis do obchodov | čaká na Mac a na účty |
| 7 — stránka na stiahnutie appky (`/aplikacia`) | **hotové a nasadené** |
| 6 — doručovanie cez vzduch (OTA) | **hotové a nasadené** (viď kapitolu 5) |

### Ako appku postaviť

```
npm run app:android     # na skúšku (debug)
npm run app:vydanie     # podpísané vydanie do telefónov ľudí
```

Oboje postaví web, zoštíhli balík, vyrobí zip pre OTA a zosynchronizuje.
Výsledok je v `android/app/build/outputs/apk/debug/app-debug.apk`,
pri vydaní v `…/apk/release/app-release.apk`.

Číslo verzie je na dvoch miestach — `android/app/build.gradle` (`versionName`,
`versionCode`) a `src/data/aplikacia.ts` (to vidí človek na `/aplikacia`).
Keď si nesedia, `scripts/postav-android.mjs` zostavenie zastaví; keď sa
veľkosť rozíde o viac než 3 MB, upozorní.

### Podpis vydania — bez neho niet aktualizácií

Kľúčenka je **mimo gitu**, na tomto počítači:

```
C:\Users\milan\Android\hradiska-release.keystore        (RSA 4096, alias hradiska)
C:\Users\milan\Android\hradiska-release-heslo.txt        (heslo)
android/keystore.properties                                (cesta a heslo pre Gradle)
```

**Keď sa kľúčenka stratí, appku už nikdy nepôjde aktualizovať** — Android
odmietne inštalovať novú verziu podpísanú iným kľúčom a v Google Play sa
identita balíka nedá zmeniť. Treba ju zálohovať mimo tohto počítača
(odtlačok podpisu je aj v `public/.well-known/assetlinks.json`, takže výmena
kľúča znamená aj zmenu tam).

### Ako vydať novú verziu webu do už nainštalovaných appiek

```
npm run app:sync
scp app-balik/hradiska-web-*.zip app-balik/aktualizacia.json \
    root@188.245.47.29:/opt/hradiska/public/app/
```

Nové APK pri tom netreba — appky si balík stiahnu samé. Overenie:

```
curl -s https://webdesignforhradiskask.vercel.app/strapi/api/aktualizacia
# má vrátiť verziu, adresu zipu a sha256, ktoré sedia s app-balik.json
```

Zip zostáva na serveri, kým naň ukazuje `aktualizacia.json`; starý sa dá
zmazať až vtedy, keď ho už nikto nesťahuje (appky sa hlásia najviac o jeden
balík staré).

Zostavenie potrebuje `ANDROID_HOME` (na tomto počítači je SDK
v `C:\Users\milan\Android\Sdk`) a súbor `android/local.properties`
so `sdk.dir` — ten sa do gitu nedáva, lebo je pre každý počítač iný.

### Čo som pri tom zistil

* **`dist/` má 274 MB**, z toho 202 MB sú zdrojové výškové dáta (`.tif`,
  `.zip`) v `public/heightmaps`. Sú to vstupy pre pythonovské skripty, ktoré
  generujú reliéf; na webe ich nikto nečíta, ale **nasadzujú sa na Vercel**.
  Pre appku ich vynecháva `scripts/priprav-app.mjs`; pre web by stálo za to
  presunúť ich mimo `public/`.
* **Mapové dlaždice si web hostuje sám** (`public/mapa`, 3 152 súborov,
  zoom 10–12). V aplikácii teda mapa hradísk funguje aj bez signálu. Esri
  dlaždice sa používajú len v detailnej mini-mape, tam offline nebude.
* **Komentáre nemali nahlásenie ani blokovanie** — bez oboch by appku App
  Store neprijal. Obe sú hotové aj na webe, vrátane obrazovky v administrácii.

### Čo treba od zadávateľa

1. Účet **Google Play** (25 USD jednorazovo) a **Apple Developer** (99 USD/rok).
2. **Doménu `hradiska.sk`** na svojom mieste — až potom majú zmysel
   univerzálne odkazy, `assetlinks.json` a zápis do obchodov.
3. Rozhodnutie o **názve v obchode**; zatiaľ je nastavené „Hradiská.sk"
   a identifikátor `sk.hradiska.app`.
4. Projekt **Firebase** (zadarmo) pre natívne upozornenia.

---

*Rozbor z 27. 9. 2026. Stav, z ktorého vychádza: PWA v6, Strapi 5 na Hetzneri,
frontend na Verceli, 365 článkov.*
