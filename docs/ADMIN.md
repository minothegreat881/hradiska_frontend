# Administrácia hradiska.sk — dokumentácia

Stav k 2026-07-20. Popisuje, čo je hotové, ako je to napojené na Strapi a — čo je
najdôležitejšie — **ktoré predpoklady o Strapi API sa ukázali ako nesprávne**.
Všetko nižšie je overené pokusmi proti bežiacemu Strapi 5.31.3, nie odpísané
z dokumentácie.

---

## 1. Kde to beží

| | |
|---|---|
| Adresa | `/admin` v hlavnej frontend aplikácii |
| Načítanie | `lazy()` + `Suspense` — návštevník webu admin nikdy nestiahne |
| Veľkosť | samostatný chunk **472 kB** (149 kB gzip) vrátane TipTapu |
| Dopad na web | žiadny, hlavný bundle ostal 3 388 kB |
| Štýly | scopované pod `.admin` v `globals.css` |

Zdrojáky: `src/admin/`

```
AdminApp.tsx          shell — sidebar, topbar, routovanie
AuthContext.tsx       držanie JWT a používateľa
api/client.ts         jediné miesto pre HTTP + preklad chýb
api/auth.ts           /api/auth/local
api/posts.ts          čítanie článkov
api/savePost.ts       zápis článkov
api/media.ts          knižnica médií
api/tags.ts           štítky
richtext/convert.ts   Strapi Blocks ↔ TipTap
richtext/RichTextEditor.tsx
components/           Panel, MediaPicker, TagPicker, LocationMap, LayoutPreview
screens/              Login, Articles, Editor, Media, Analytics, Stub
```

---

## 2. Účty a oprávnenia

Strapi má **dva oddelené systémy účtov** a zamieňajú sa veľmi ľahko:

| systém | tabuľka | endpoint | na čo |
|---|---|---|---|
| Admin panel | `admin_users` | `/admin/login` | prihlásenie do Strapi UI |
| API používatelia | `up_users` | `/api/auth/local` | **toto používa náš admin** |

Admin účet `hradiskastrapi@gmail.com` sa do našej administrácie prihlásiť
**nedá** — je v inom systéme.

**Vytvorené 2026-07-20:**
- API používateľ `admin@hradiska.sk`, rola `Authenticated`
- 25 povolení pre rolu `Authenticated`: `blog-post` (find/findOne/create/update/delete),
  `blog-category`, `blog-tag` (aj create), `blog-comment`, `aktualita`, `upload`

Povolenia sa zapisovali priamo do `up_permissions` + `up_permissions_role_lnk`,
lebo cez API token sa nastaviť nedajú. **Vyžadujú reštart Strapi**, načítavajú
sa pri štarte.

Rola zámerne **nemá** právo mazať štítky — štítok sa nemá dať odstrániť spod
nôh iným článkom.

### Bezpečnostný kompromis

JWT je uložený v `localStorage`. Strapi nemá refresh tokeny a bez vlastného
servera niet kam token uložiť bezpečnejšie. Riziko je XSS.

**Pred nasadením na verejnú doménu prejsť na proxy**, ktorá drží token na
serveri a klientovi dáva httpOnly cookie. Do tej doby je jedinou ochranou heslo.

---

## 3. Zistenia o Strapi API (dôležité)

### 3.1 Koncepty vs. publikované

```
?status=draft      → draft verzia KAŽDÉHO dokumentu; publishedAt je VŽDY null,
                     aj pri publikovanom článku
?status=published  → len publikované
(bez parametra)    → správa sa ako published
```

**Stav sa preto nedá vyčítať z `publishedAt`.** Keby sme mu verili, celý zoznam
by ukazoval „Koncept". Riešené indexom publikovaných `documentId` (4 dotazy po
5 kB, cache 30 s) — `api/posts.ts → publishedIndex()`.

### 3.2 Zápis: vynechané pole sa zachová, poslané prepíše

Overené pokusom:

```
PUT s {title}                    → blocks ostali (3)
PUT s {blocks:[1 blok]}          → blocks prepísané na 1, ostatné ZMAZANÉ
```

Preto `buildPayload` posiela `blocks` len keď ich má kompletné a po každom
uložení beží `verifyBlockCount()` — nesúlad počtu sa nahlási, nie prehliadne.

Rovnaká logika pri coveri: `undefined` = nechaj, `null` = zmaž.

### 3.3 Tvary, ktoré Strapi prijíma

```jsonc
category   { "set": ["<documentId>"] }
tags       { "set": ["<documentId>", …] }     // prázdne pole = odobrať všetky
coverImage 1234                                // číselné id, NIE objekt z GET-u
blocks     [{ "__component": "content.…", … }] // image tiež ako číselné id
location   { name, latitude, longitude, … }
```

Pri spätnom zápise bloku z GET-u treba **rekurzívne odstrániť `id`** — Strapi
inak vráti „Invalid key id". Vnorené `id` sú aj v `items` zdrojov.
Viď `sanitizeOriginal()` v `savePost.ts`.

### 3.4 Publikovanie

```
PUT /api/blog-posts/<documentId>?status=published   ✅ publikuje
PUT /api/blog-posts/<documentId>?status=draft       ✅ uloží koncept
POST /api/blog-posts/<documentId>/actions/publish   ❌ 405, NEEXISTUJE
```

### 3.5 ⚠️ Zrušenie publikovania sa cez content API NEDÁ

Otestované všetky tri cesty:

```
DELETE ?status=published              → 204, ale ZMAŽE CELÝ DOKUMENT
                                        vrátane konceptu (overené: v DB
                                        nezostal ani draft riadok)
POST /actions/unpublish               → 405, neexistuje
PUT ?status=draft {publishedAt:null}  → 200, ale článok ostane verejný
```

Funkcia bola **odstránená z adminu**, aby sa nedala omylom zavolať.
Stiahnutie článku z webu sa zatiaľ robí v Strapi paneli
(Content Manager → Unpublish).

### 3.6 Upload API sa správa inak než content API

```
/api/upload/files bez parametrov  → 5 424 súborov naraz = 7,43 MB
pagination[pageSize]              → IGNORUJE sa
start=0&limit=50                  → funguje, 0,06 MB
/api/upload/files/count           → 404, neexistuje
filters[name][$containsi]         → funguje
```

Knižnica preto načítava po dávkach 48 cez `start`/`limit` a namiesto čísel
strán má „Načítať ďalšie" — celkový počet sa lacno zistiť nedá.

---

## 4. Rich-text editor

Strapi ukladá telo ako **Blocks JSON**, nie HTML ani markdown. Editor je TipTap
a medzi nimi je obojsmerný prevod (`richtext/convert.ts`).

### Čo korpus reálne obsahuje

Z 7 704 blokov:

```
bloky   paragraph 6642 · heading level 2 (1084) · list unordered (18)
inline  text 11816 · link 988 · list-item 60
marky   bold 1428 · italic 1094
```

H3, H4, číslované zoznamy, code ani blockquote sa **nevyskytujú ani raz**.
Toolbar ich napriek tomu ponúka (okrem code a blockquote), aby sa dal písať
nový obsah.

### Bezpečnostné pravidlo

**Prevod sa spustí LEN na bloku, ktorého sa používateľ naozaj dotkne.**
Nedotknuté bloky sa ukladajú späť verbatim v pôvodnom JSON (`original`).

Prečo: round-trip cez celý korpus je bajt-identický na 91,4 % a obsahovo
zhodný na 99,4 %. Rozdiely sú výhradne v **poškodených uzloch z migrácie** —
napr. `link` s markami priamo na sebe alebo `link`, ktorý má naraz `children`
aj duplicitnú vlastnosť `text` (jeden taký mal 668 znakov, z toho polovica
bola duplicita). Pri editácii sa znormalizujú, čo je správne — ale nech sa to
deje len tam, kde človek zámerne zasiahol.

**Overené na kópii Bojnej** (83 blokov): úprava jedného bloku nechala
ostatných 82 bajtovo identických.

---

## 5. Čo je hotové

| obrazovka | stav |
|---|---|
| Prihlásenie | ✅ skutočné, JWT, auto-odhlásenie pri 401/403 |
| Zoznam článkov | ✅ 305 zo Strapi, filtre, hľadanie, stránkovanie, mazanie |
| Editor | ✅ metadáta, SEO, cover, štítky, lokalita s mapou, fakty, časová os, bloky |
| Médiá | ✅ upload, výber, mazanie, dávkové načítanie |
| Analytika | ⚠️ **vymyslené dáta** — meranie nebeží, zdroj neurčený |
| Kategórie / Štítky / Komentáre | ⏳ stuby |

### Editor — detail

- názov, excerpt s počítadlom (500), slug s kontrolou jedinečnosti
- autor, čas čítania, pôvodný dátum, featured
- SEO s počítadlami (70/160) a náhľadom vo vyhľadávaní
- cover s výberom z knižnice, možnosť odstrániť
- štítky s napovedaním a vytváraním nových
- lokalita: klik do SVG mapy Slovenska zapíše súradnice
- kľúčové fakty (16 ikon), časová os (7 typov)
- bloky: 7 typov, presúvanie ▲▼, duplikovanie, mazanie, zbaľovanie
- obrázkový blok: 11 polí + živý náhľad rozloženia
- validácia povinných polí, varovanie pri neuložených zmenách

---

## 6. Čo zostáva

**Kategórie, Štítky** — CRUD obrazovky, poradie cez `order`.

**Komentáre a účty pre verejnosť** — samostatný projekt, viď
`docs/KOMENTARE-PLAN.md`.

**Analytika** — treba rozhodnúť zdroj dát. Vercel Web Analytics **nemá API**
na sťahovanie štatistík; reálne možnosti sú Umami/Plausible (self-hosted,
majú API) alebo vlastné počítadlo v Strapi. A hlavne: meranie zatiaľ vôbec
nebeží, `@vercel/analytics` nie je nainštalovaný.

**Drobnosti** — duplikovanie článku, funkčné `⌘K` hľadanie, auto-slug z názvu,
auto-výpočet času čítania.

---

## 7. Prevádzka

**Strapi beží v produkčnom režime** (`npm start`, nie `npm run develop`).

Dôvod: dev watcher sledoval `public/uploads` s 24 414 súbormi, držal 27 317
otvorených handle-ov a žral **129 % jadra aj v nečinnosti**. Po prepnutí:

| | dev | produkcia |
|---|---|---|
| CPU v nečinnosti | 129 % | **0 %** |
| RAM | 1 332 MB | **198 MB** |
| handles | 27 317 | **268** |
| štart | 41,6 s | **3,3 s** |

**Dôsledok:** zmeny v `hradiska-strapi/src` alebo `config` si vyžadujú
`npm run build` + reštart. Pridávanie polí do schémy (Content-Type Builder)
vyžaduje dočasné prepnutie na `npm run develop`.
