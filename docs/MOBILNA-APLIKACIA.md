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
git push  →  Vercel postaví web  →  CI zabalí dist/  →  nahrá na Hetzner
                                              ↓
              aplikácia pri štarte zistí novšiu verziu a prevezme ju
```

Nástroj: **@capgo/capacitor-updater** — otvorený zdroj, dá sa hostovať na
vlastnom serveri, takže bez mesačných poplatkov. Platená alternatíva je
Ionic Appflow.

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

*Rozbor z 27. 9. 2026. Stav, z ktorého vychádza: PWA v6, Strapi 5 na Hetzneri,
frontend na Verceli, 365 článkov.*
