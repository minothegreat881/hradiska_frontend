# Admin rozhranie: súčasný stav (22. 9. 2026)

Tento report je podklad k prerobeniu adminu na vizuálny editor, kde správca vidí výsledok a obrázky posúva a zväčšuje priamo myšou. Všetko je overené z kódu a z lokálnej databázy (`hradiska-strapi/.tmp/data.db`). Na jednom mieste je výslovne uvedené, čo sa overiť nedalo.

---

## 1. Dva admini, nie jeden

| | Vlastný admin | Strapi panel |
|---|---|---|
| Adresa | `hradiska.sk/admin` (lokálne `localhost:3001/admin`) | `:1337/admin` |
| Kód | `Webdesignforhradiskask/src/admin/` (35 súborov, ~4 660 riadkov) | súčasť Strapi 5.31 |
| Účty | `up_users`, rola **Authenticated** (dnes 2 účty) | `admin_users` (samostatný systém) |
| Čo sa v ňom edituje | články, médiá, komentáre, členovia | všetko ostatné (aktuality, domovská galéria, kategórie, štítky) a zrušenie publikovania |

Vlastný admin sa načítava lazy, takže bežný návštevník webu ho nikdy nestiahne (`src/App.tsx:30`).

## 2. Obrazovky vlastného adminu

| Obrazovka | Stav | Zdroj |
|---|---|---|
| Články: zoznam, filtre, mazanie | ✅ funguje nad API | `screens/ArticlesScreen.tsx` |
| Editor článku | ✅ funguje, ale je to **formulár, nie náhľad** (pozri kap. 3) | `screens/EditorScreen.tsx` (744 r.) |
| Médiá: nahrať, zmazať, prehliadať | ✅ | `screens/MediaScreen.tsx` |
| Komentáre: moderácia, odpoveď, varovanie | ✅ | `screens/CommentsScreen.tsx` |
| Používatelia: blokovať, zmazať | ✅ | `screens/UsersScreen.tsx` |
| Môj profil: e-mail, heslo | ✅ | `screens/ProfileScreen.tsx` |
| Kategórie, Štítky | ❌ iba zástupný text („StubScreen") | `AdminApp.tsx:229–231` |
| Analytika | ❌ **celá je vymyslená**: čísla sú natvrdo v `admin/data.ts` (STAT_TILES, CHART_DAYS…) | `screens/AnalyticsScreen.tsx:5` |
| Rýchle hľadanie ⌘K | ❌ okno sa otvorí, ale pole nič nerobí | `AdminApp.tsx:248` |

## 3. Ako funguje editor článku

### Rozloženie
- **Ľavý stĺpec:** názov, perex a potom zoznam **kariet blokov**. Každá karta je formulár, nie vykreslený obsah.
- **Pravý stĺpec (sticky):** slug, autor, dátum, cover, kategória, štítky, SEO (s náhľadom vo vyhľadávaní Google), lokalita (mapa na kliknutie), kľúčové fakty a časová os.

### Dátový model (Strapi)
Článok je `api::blog-post` a jeho telo je **dynamická zóna `blocks`** so 7 typmi komponentov (`hradiska-strapi/src/components/content/`):

| Blok | Počet v DB* | Dá sa v adminu upraviť? |
|---|---|---|
| `rich-text` | 8 466 | ✅ TipTap editor (tučné, kurzíva, odkaz, zoznamy, H2–H4) |
| `image-block` | 2 484 | ✅ formulár + schematický náhľad |
| `sources` | 398 | ❌ iba posunúť alebo zmazať |
| `quote-block` | 220 | ✅ |
| `embed` | 150 | ❌ iba posunúť alebo zmazať |
| `poem` | 28 | ❌ iba posunúť alebo zmazať |
| `image-gallery` | 2 | ❌ iba posunúť alebo zmazať |

\* Riadky v DB vrátane konceptu aj publikovanej verzie (364 článkov). Pri needitovateľných blokoch sa zobrazí text „Polia pre … doplníme podľa schémy pri napojení" (`EditorScreen.tsx:598`). Pri uložení sa tieto bloky neporušia, iba sa nedajú meniť.

Okrem blokov má článok ešte polia `gallery` a `quotes`, ktoré editor vôbec neukazuje. Neposiela ich, takže ich Strapi ponechá.

### Ako sa dnes „umiestňuje" obrázok
Obrázok nemá voľné súradnice ani voľnú veľkosť. Má **enumy** (`image-block.json`):

- `position`: left / right / center / full / breakout
- `width`: 30 / 40 / 50 / 60 / 100 (%)
- `aspectRatio`: 3:2, 16:9, … auto
- `objectPosition` (výrez), `pairWithNext`, `showCaption`, `rounded`, `shadow`

V editore sú to tri `<select>`y a štyri checkboxy schované pod „Rozšírené nastavenia". Vedľa je `LayoutPreview`, čo je **schéma** (sivé čiary namiesto textu, zlatý obdĺžnik namiesto obrázka), nie skutočný obrázok v skutočnom texte (`components/LayoutPreview.tsx`).

Z reálnych dát: `aspectRatio` je pri **všetkých 2 484** obrázkoch `auto` a `objectPosition` pri všetkých `center center`. Tieto polia teda existujú, ale nikto ich nepoužil. Najčastejšie kombinácie sú right/40 (580), left/40 (430) a center/60 (418).

### Poradie blokov
- Bloky sa presúvajú iba šípkami ▲▼ o jedno miesto (`EditorScreen.tsx:572`).
- Ikona „úchytu" pri kľúčových faktoch a časovej osi je iba dekorácia. Tieto položky sa preusporiadať **vôbec nedajú** (`:500`, `:528`).
- „Duplikovať" vloží kópiu na **koniec** článku, nie hneď pod originál (`:361`).

### Ukladanie (najcitlivejšia časť)
`api/savePost.ts`. Pravidlá, ktoré sú v kóde zdokumentované ako overené pokusom:

1. **PUT s poľom `blocks` prepíše celé pole.** Preto sa vždy posielajú všetky bloky naraz a po uložení sa kontroluje ich počet (`verifyBlockCount`).
2. **Needitovaný rich-text sa vracia bajt po bajte** (`original`), aby sa migrovaný obsah nemusel prevádzať cez TipTap. Komentár v `RichTextEditor.tsx` uvádza zhodu round-tripu 91,4 % bajtovo a 99,4 % obsahovo. To som nemeral, preberám to z komentára.
3. Strapi pri zápise odmieta `id` komponentov a médiá chce ako číselné id. Rieši to `sanitizeOriginal`.
4. Publikuje sa cez `PUT ?status=published`. **Zrušiť publikovanie cez API sa nedá:** `DELETE ?status=published` zmaže celý dokument. Robí sa to v Strapi paneli.
5. Pred uložením sa kontroluje, či je slug voľný, a spúšťa sa validácia: každý obrázok musí mať alt text. V DB je **6 obrázkov bez altu**, takže tie články sa v adminu nedajú uložiť, kým ho niekto nedoplní.

### Autentifikácia
- Prihlásenie cez `POST /api/auth/local` a JWT sa uloží do `localStorage` (`AuthContext.tsx`). Pri 401/403 nasleduje automatické odhlásenie (`api/client.ts`).
- Registrácia má `default_role: member`. Rola **Member** má iba `upload` a na články nemá žiadne právo. Zapisovať smie len **Authenticated** (staff). Overené v tabuľke `up_permissions`, čiže registrovaný člen sa do editora článkov nedostane.

## 4. Rozpory medzi adminom a webom

Tieto rozpory sú hlavný dôvod, prečo admin nevie povedať, ako článok naozaj vyzerá. Pri prerábke treba mať **jeden renderer** pre web aj editor.

1. **„Náhľad" neukazuje koncept.** Tlačidlo otvorí `/blog/<slug>` (`EditorScreen.tsx:302`). Web si však článok načítava bez `status=draft` (`lib/strapi.ts:252`), takže vidno poslednú **publikovanú** verziu. Neuložené zmeny ani nový koncept sa v náhľade neobjavia.
2. **Spárovanie obrázkov:** schéma v adminu ukáže dva obrázky vedľa seba vždy, keď je zaškrtnuté „Spárovať s ďalším" (`LayoutPreview.tsx:59`). Web ich spáruje len vtedy, keď je ďalší blok tiež obrázok **a** pozície sú left+right (`DynamicZoneRenderer.tsx:789`). Pri center+center admin ukáže pár, ale web nie.
3. **Šírka centrovaného obrázka nesedí s percentami.** Web neprekladá šírku na %, ale na Tailwind triedy `max-w-xs/sm/md/lg` (`BlogMedia.tsx:418`). Triedy **`max-w-sm` a `max-w-lg` v CSS vôbec nie sú**: `index.css` je predgenerovaný výstup Tailwindu bez build pluginu a overil som, že nie sú ani v zostavenom `dist/assets/*.css`. Centrované obrázky so šírkou 40 % (10 ks) a **60 % (418 ks)** sa preto podľa kódu vykreslia bez obmedzenia šírky, na celý stĺpec. Vizuálne v prehliadači som to neoveroval.
4. **Na mobile** sa všetky plávajúce obrázky zmenia na blok s max. 400 px (`styles/globals.css:1596`). Schéma v adminu mobil vôbec nerieši.
5. Zbalená karta rich-textu vypisuje `String(pole)`, teda „[object Object]…", lebo `body` je pole uzlov, nie text (`EditorScreen.tsx:726`).

## 5. Čo z toho vyplýva pre vizuálny editor

- **Obmedzenia dátového modelu:** poloha a veľkosť obrázka sú dnes 5 × 5 pevných hodnôt. Voľné ťahanie myšou má dve možnosti:
  - buď **prichytávanie na tieto hodnoty**, čo nevyžaduje zmenu schémy a 2 484 existujúcich obrázkov ostane platných,
  - alebo nové polia (napr. šírka v %, výrez), čo znamená zmenu schémy aj rendereru a migráciu.
- **Renderer je znovupoužiteľný:** `DynamicZoneRenderer` a `BlogMedia` už vedia vykresliť všetkých 7 typov blokov. Editor ich môže použiť priamo, takže sa náhľad a web nerozídu.
- **Pravidlo „PUT prepíše všetky bloky" ostáva.** Vizuálny editor musí stále posielať kompletné pole blokov a ponechať ochranu needitovaného rich-textu.
- **Pred prerábkou treba opraviť rozpory z kap. 4.** Inak by editor verne ukazoval chybné správanie webu (najmä šírky 40/60).
- **Chýbajú polia** pre sources, embed, poem a gallery, reálne poradie faktov a časovej osi a náhľad konceptu (web by musel vedieť načítať `status=draft` s tokenom).
