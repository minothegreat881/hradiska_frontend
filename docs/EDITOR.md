# Vizuálny editor článkov — ako funguje a kde čo je

Editor článku v administrácii (`/admin` → Články → Upraviť) je od septembra 2026
vizuálny: správca vidí článok tak, ako vyzerá na webe, a upravuje ho priamo v ňom.
Starý formulár s kartami blokov už neexistuje.

## Tri zásady, na ktorých to stojí

**1. Jeden renderer.** Plátno používa `components/DynamicZoneRenderer.tsx`
a `components/BlogMedia.tsx` — tie isté, čo kreslia web. Rozdiel robí jediný
prepínač `editMode`. Kópia rendereru neexistuje zámerne: keby bola, editor a web
by sa časom rozišli.

**2. Plátno je vlastné okno (iframe).** Mobilné pravidlá sú v CSS viazané na šírku
okna (`@media (max-width: 767px)`), nie kontajnera. V obyčajnom `div`-e širokom
390 px by sa obrázky stále správali ako na počítači a prepínač Mobil by klamal.
Desktopové plátno kreslí do okna širokého 1440 px a zmenšuje sa CSS mierkou —
typografia webu je v `clamp()` s `vw`, takže v užšom okne by vychádzali iné
veľkosti písma.

**3. Obal bloku nemá box.** `BlockShell` má `display: contents`, takže do rozvrhu
nezasahuje. Všetko ovládanie (rámiky, úchyty, lišty, tlačidlá „+") kreslí
`BlockOverlay` ako absolútne umiestnenú vrstvu nad článkom.

## Súbory

```
src/admin/editor/
  EditorCanvas.tsx       plátno: iframe, portál, mierka, prepínače
  BlockShell.tsx         obal bloku bez boxu; značky data-block-*
  BlockOverlay.tsx       vrstva ovládania: výber, úchyt, lišta, „+", ťahanie
  EditorUIContext.ts     spojenie plátna s obalom bloku
  useRowDrag.ts          preusporiadanie riadkov v pravom paneli
  blocks/
    RichTextInline.tsx   TipTap priamo v stránke + plávajúci panel
    ImageControls.tsx    ťahanie obrázka na zónu, zväčšovanie za roh
    BlockFields.tsx      polia citátu, básne, videa, zdrojov a galérie
  snapping/
    positionZones.ts     pravidlo párovania (`canPair`) + mobilné pravidlo
    widthSteps.ts        kroky šírky 30/40/50/60/100 a prichytávanie
  state/
    useHistory.ts        vrátenie zmien (Ctrl+Z / Ctrl+Y, 100 krokov)
    autosave.ts          záloha rozpísaného článku do prehliadača
```

## Čo editor vie

| Úkon | Ako |
|---|---|
| Vybrať blok | klik |
| Zmeniť poradie | ťahanie za úchyt vľavo, alebo šípky v lište |
| Vložiť blok | „+" medzi blokmi → ponuka 7 typov |
| Duplikovať / zmazať | lišta nad blokom; mazanie sa potvrdzuje |
| Písať text | klik do textu; panel sa objaví pri označení |
| Presunúť obrázok | ťahanie — ukážu sa zóny, pustenie prichytí |
| Zmeniť šírku obrázka | ťahanie za roh, prichytí na 30/40/50/60/100 % |
| Vrátiť zmenu | Ctrl+Z / Ctrl+Y alebo tlačidlá v lište |
| Vidieť mobil | prepínač Počítač / Mobil |
| Písať v skutočnej veľkosti | prepínač Prispôsobiť / 100 % |

## Pravidlá, ktoré sa nesmú porušiť

**Ukladanie prepisuje celé pole blokov.** `PUT` s poľom `blocks` nahradí všetky
bloky, preto sa vždy posielajú všetky naraz a po uložení sa kontroluje ich počet
(`verifyBlockCount`). Podrobnosti sú v hlavičke `admin/api/savePost.ts`.

**Needitovaný text sa ukladá bajt po bajte.** Blok, do ktorého sa síce kliklo, ale
nič sa v ňom nezmenilo, ide späť v pôvodnom JSON zo Strapi. Bez toho by sa
migrovaný obsah pomaly rozpadával prevodmi cez TipTap.

**Schéma Strapi sa nemení.** Pozícia má päť hodnôt a šírka päť krokov; ťahanie je
plynulé len vizuálne, uloží sa vždy povolená hodnota.

**Zrušiť publikovanie cez API nejde** — `DELETE ?status=published` zmaže celý
dokument. Robí sa to v Strapi paneli.

## Čo ostáva otvorené

- `EditorScreen.tsx` má ~900 riadkov a pravý panel s metadátami je stále v ňom.
  Rozdelenie do modulov (napr. `editor/SidePanel.tsx`) je kozmetika, ktorá sa
  neurobila.
- Nadpis a perex sa upravujú v karte nad plátnom, nie priamo v stránke.
- Odrážkový zoznam počas písania nemá guľôčku, ktorú kreslí web (dekoratívny
  `span` v renderi). Po kliknutí mimo vyzerá správne.
- Prázdny popis vo vloženom videu sa pri uložení zmení z `""` na `null`. Robí to
  ukladacia vrstva odjakživa, na weboch sa neprejaví.
- Round-trip test na 50 článkoch nebol dokončený (viď nižšie).

## Testovanie

Pomocné skripty na ovládanie editora z Playwrightu sú v pracovnom priečinku
sedenia, nie v repozitári. Testovací účet s rolou Authenticated je
`editor-test@hradiska.local`, heslo v `.env` (`TEST_ADMIN_PASSWORD`), ktorý je
gitom ignorovaný.

**Pozor na dva spôsoby, ako si dlhý test ublíži:**

1. Prihlasovanie formulárom — Strapi dovolí 15 pokusov za 15 minút. Token sa má
   vydať skriptom cez `strapi.plugin('users-permissions').service('jwt').issue()`
   a vložiť do `localStorage` pod kľúč `hradiska.admin.jwt`.
2. Beh na pozadí s výstupom do konzoly — výstupná rúra sa zaplní a proces sa
   zastaví. Priebeh zapisovať do súboru a každému kroku dať časový strop.
