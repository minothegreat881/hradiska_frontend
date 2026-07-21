# Session handoff — hradiska.sk

Ak padne session, začni tu. Zachytáva stav k **2026-07-20**, aby sa dalo
pokračovať bez straty kontextu. Všetko nižšie je overené proti bežiacemu
prostrediu, nie odpísané z pamäti.

---

## 0. Rýchly štart (ak nič nebeží)

Dva projekty na `C:\Users\milan\Desktop\Git-Projects\`:

| repo | čo | git remote |
|---|---|---|
| `hradiska-strapi` | backend (Strapi 5.31.3, SQLite) | `hradiska_backend` |
| `Webdesignforhradiskask` | frontend (Vite 6 + React 18) | `hradiska_frontend` |

**Spustenie:**
```bash
# Backend — PRODUKČNÝ režim (nie develop! viď §4)
cd hradiska-strapi && npm start          # → localhost:1337

# Frontend
cd Webdesignforhradiskask && npm run dev  # → localhost:3000
```

Overenie: `curl localhost:1337/_health` → 204, `localhost:3000` → 200.

**Prihlásenia:**
```
Admin web (/admin):  admin@hradiska.sk / Hradiska-Admin-2026!
Testovací člen:      milanhrabkovsky+test@gmail.com / TestHeslo123
Strapi panel:        hradiskastrapi@gmail.com  (iný systém, len na správu Strapi)
```

---

## 1. Čo je v tomto projekte hotové

### 1a. Web (verejný)
- Redizajn: dvojúrovňová navigácia, hero search, kronika aktualít na homepage,
  12 kategórií s obrázkami z vlastných článkov, hero kategórie (5A), sekcia
  „Pridajte sa k nám", pätička (7A)
- Výkonnostné opravy (viď §3)
- Účty pre verejnosť: registrácia/prihlásenie/reset/profil
- Komentáre a lajky na účty (články aj fotky), inline odpovede

### 1b. Admin (`/admin`, lazy chunk)
- Prihlásenie (Strapi JWT), zoznam článkov, editor (metadáta, SEO, cover,
  štítky, lokalita s mapou, bloky, TipTap rich-text), médiá, moderácia
  komentárov, správa členov (blokovanie)
- Analytika je **na mock dátach** — meranie nebeží (viď §6)

### 1c. Backend
- Migrácia blogov (305 článkov) + aktualít — DOKONČENÁ skôr
- E-mail (Gmail SMTP), rola Member, kolekcie photo-comment/reaction,
  bezpečnostné controllery, rate limit, GDPR endpointy

---

## 2. Referenčné dokumenty (v `docs/`)

| súbor | o čom |
|---|---|
| `ADMIN.md` | admin sekcia, napojenie na Strapi, zistené API zvláštnosti |
| `UCTY-A-KOMENTARE.md` | **kompletná** dokumentácia účtov, komentárov, lajkov |
| `KOMENTARE-PLAN.md` | pôvodný plán + priebeh krokov 1–10 |
| `SESSION-HANDOFF.md` | tento súbor |

Backend má vlastnú `scripts/blog-migrate/MIGRATION.md` k migrácii.

---

## 3. Výkonnostné opravy (spravené, nevracať)

| oprava | efekt |
|---|---|
| `getBlogPosts` `populate=*` → coverImage/category/tags | zoznam 2609→135 ms |
| covery v zoznamoch na `medium` variant | −73 % dát |
| logo 5,63 MB → 256 px webp (15,7 KB) | 10 481→65 ms/stránka |
| zrušené postupné odkrývanie kariet (stagger) | 45. dlaždica nečaká 4,5 s |
| strop výšky obrázkov v tele článku | najhorší blok 3417→875 px |
| **Strapi produkčný režim** | CPU 129 %→0 % v nečinnosti (viď §4) |

Logo: `public/logo_slovanske_hradiska_256.{webp,jpg}` — originál 5,63 MB
ostal na disku.

---

## 4. ⚠️ Prevádzkové pasce

### Strapi musí bežať v PRODUKČNOM režime
`npm start`, **nie `npm run develop`**. Dev watcher sleduje `public/uploads`
(24 414 súborov), drží 27 000 handle-ov a žerie **129 % jadra aj v nečinnosti**
(prispievalo k pádom pri slabej batérii). Produkcia: 0 %, RAM 198 MB, štart 3 s.

**Dôsledok:** zmeny v `hradiska-strapi/src` alebo `config` → `npm run build` +
reštart. Zmena schémy (nové pole/kolekcia) → dočasne `npm run develop`, spraviť,
`npm run build`, späť na `npm start`.

### Výkon PC obmedzený schválne
`powercfg`: CPU strop AC=100 %, DC=80 %, **turbo vypnuté** (padalo pri prúdových
špičkách kvôli slabej batérii). Nechať tak, kým nebude nová batéria.

### Nastavenia v DB, NIE v gite
Runtime konfigurácia Strapi sa neverzuje. Pri obnove čistej DB nastaviť znova:
- rola **Member** + jej povolenia
- rozšírené povolenia **Authenticated** (user find/update + komentáre/reakcie)
- registrácia: `default_role=member`, `email_confirmation=true`, redirect URL
- e-mailové šablóny (SK)
- `api::account.account.deleteMe` pre Member
Presný zoznam v `docs/UCTY-A-KOMENTARE.md §5, §8`.

### Media/DB nie sú v gite
`public/uploads` (3,98 GB) a `.tmp/data.db` (23 MB) sú v `.gitignore`.
Git zálohuje len KÓD. Dáta sa zálohujú kópiou (posledná lokálna:
`Git-Projects/hradiska-backup-2026-07-20/`).

---

## 5. Zistené zvláštnosti Strapi 5 API (overené pokusmi)

Toto sú veci, ktoré zdržali a treba ich vedieť:

1. **Koncepty:** `?status=draft` vráti draft verziu KAŽDÉHO dokumentu s
   `publishedAt=null`, aj publikovaného. Stav sa nedá vyčítať z `publishedAt`.
2. **Zápis blokov:** PUT bez poľa ho zachová, PUT s poľom prepíše CELÉ. `blocks`
   sa posielajú kompletné; po uložení kontrola počtu (`verifyBlockCount`).
3. **Publikovanie:** cez `PUT ?status=published`. `/actions/publish` = 405.
4. **Zrušenie publikovania cez API NEEXISTUJE** — `DELETE ?status=published`
   zmaže CELÝ dokument aj koncept. Rieši sa v Strapi paneli.
5. **Upload API** ignoruje `pagination[pageSize]`, bez limitu vráti 7,4 MB;
   stránkuje sa cez `start`/`limit`; `/count` = 404.
6. **Relácie pri create** cez užívateľskú rolu: content-API sanitizácia odmieta
   `post` ako holý documentId („Invalid key post") → zápis cez
   `strapi.documents().create()`, nie `super.create`.
7. **E-mail šablóny sa cachujú pri štarte** — zmena v DB potrebuje reštart.
8. **Public rola si `blog-comment.create` sama obnovuje** pri štarte — controller
   guard (401) je autoritatívny, nie oprávnenie.

---

## 6. Čo zostáva otvorené

### Analytika (admin)
Celá na **vymyslených dátach**. Pred dorobením rozhodnúť zdroj:
Vercel Web Analytics **nemá API** na sťahovanie. Reálne: Umami/Plausible
(self-hosted, majú API) alebo vlastné počítadlo v Strapi. **A meranie zatiaľ
vôbec nebeží** — `@vercel/analytics` nie je nainštalovaný.

### Admin — drobnosti
- Kategórie, Štítky obrazovky sú stuby
- Duplikovanie článku, `⌘K` hľadanie (len škrupina), auto-slug, auto-čas čítania

### Pred ostrým nasadením
- JWT v `localStorage` (člen aj admin) → proxy + httpOnly cookie (XSS)
- Gmail → doménový SMTP `hradiska.sk` + SPF/DKIM (inak spam)
- zmeniť heslá testovacích účtov
- GDPR text v `PrivacyPage` doplniť
- `dist/build/uploads` v backende (4 GB mŕtva kópia z buildu) — dá sa zmazať

### Fotokomentáre
Majú vnorené odpovede aj mazanie vlastného (rovnako ako blog komentáre) —
doplnené 2026-07-21. Meno autora aj príznak „môj" dopočítava controller
(`populate[user]` cez verejné API Strapi zahadzuje).

---

## 7. Stav gitu (2026-07-20)

Oba repo majú **všetko commitnuté**, pracovné stromy čisté.

Frontend HEAD: `a561856` (inline odpovede)
Backend HEAD: `327829a` (rate limit + GDPR)

Frontend `main` a backend `master` boli pushnuté po migrácii; **novšie commity
(admin, účty, komentáre) sú zatiaľ LEN lokálne** — ak treba na GitHub, pushni.

---

## 8. Ako overiť, že celá vrstva účtov funguje

```bash
# prihlásenie člena vráti JWT
curl -X POST localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier":"milanhrabkovsky+test@gmail.com","password":"TestHeslo123"}'

# anonym nekomentuje → 401
curl -X POST localhost:1337/api/blog-comments \
  -H "Content-Type: application/json" \
  -d '{"data":{"content":"x","post":"<docId>"}}'
```

Databáza má byť: 305 článkov, 732 komentárov, 2 účty (admin + test),
0 reactions, 0 photo-comments (ak sa netestovalo).
