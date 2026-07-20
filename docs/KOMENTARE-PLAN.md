# Plán: účty pre verejnosť, komentáre a lajky

Stav k 2026-07-20. Cieľ: návštevník sa zaregistruje, overí e-mailom, môže
komentovať články **aj fotografie** a dávať lajky. Admin má nad tým kontrolu —
maže komentáre, blokuje účty, vidí prehľad po článkoch.

## Rozhodnutia používateľa (2026-07-20)

- **E-mail:** Gmail SMTP cez `milanhrabkovsky@gmail.com` (dočasný technický účet,
  App Password). Pri prechode na doménu → SMTP hradiska.sk.
- **Komentáre sa zobrazujú HNEĎ**, bez schvaľovania. Admin ich môže dodatočne
  skryť/označiť ako spam/zmazať.
- **Fotokomentáre** len v galérii v článku (lightbox po kliknutí na fotku).

## Priebeh

- ✅ **Krok 1 — e-mail.** `@strapi/provider-email-nodemailer`, Gmail SMTP v
  `config/plugins.ts`, údaje v `.env`. Odoslanie overené reálnym mailom.
- ✅ **Krok 3 — schéma** (2026-07-20). Aplikované cez dočasný `develop`, dáta
  nedotknuté (305 článkov, 732 komentárov, 5424 súborov):
  - `blog-comment` + `status` [visible|hidden|spam], `editedAt`, `user` relácia
  - nová kolekcia `photo-comment` (fileId, content, status, user, inReplyTo)
  - nová kolekcia `reaction` (targetType, targetId, user) — lajky per účet
  - používateľ + `displayName`, `blockedReason`, `blockedAt` (cez extensions)
  - 732 komentárov zmigrovaných: `approved=true → status=visible`
  - povolenia: Public číta photo-comments/reactions, Authenticated (admin) CRUD
- ✅ **Krok 2 — rola Member + overenie e-mailu** (2026-07-20):
  - nová rola `Member` (type=member) — smie len komentovať a lajkovať
  - `default_role` registrácie prepnutý `authenticated → member`
    (KRITICKÉ: predtým by registrovaný dostal právo mazať články!)
  - `email_confirmation` zapnuté; redirect na `/prihlasenie?overeny=1`
  - Public rola už mala register/login/forgot/reset zapnuté
  - ⚠️ tieto zmeny sú v DB (up_roles, up_permissions, core_store), nie v gite —
    pri obnove čistej DB ich treba nastaviť znova
- ✅ **Krok 4 — bezpečnostné policy „len vlastné"** (2026-07-20):
  - `reaction` controller: lajk len prihlásený, `user` nastaví server,
    dedup (user+targetType+targetId), unlike len vlastný
  - `photo-comment` + `blog-comment`: create len prihlásený (`user` zo servera),
    `status='visible'` (zobrazí sa hneď), update/delete len VLASTNÝ komentár —
    výnimka staff (rola authenticated = admin) moderuje čokoľvek
  - create ide cez `strapi.documents().create()`, nie `super.create` — content-API
    sanitizácia pri užívateľskej role odmieta reláciu ako holý documentId
  - **overené:** člen nevie vytvoriť článok (403) ani zmazať cudzí komentár (403);
    vlastný komentár vytvorí/zmaže; lajk sa deduplikuje
- ⏳ Kroky 5–10 (frontend, admin moderácia, anti-spam) — otvorené.

---

## 0. Východiskový stav (overené)

**Komentáre už existujú a fungujú**

```
732 komentárov, všetky schválené, všetky z Bloggeru (sourceBlogger = true)
1 384 väzieb na články
CommentSection.tsx je zapojená v ArticlePage
vlastné endpointy /like a /unlike v Strapi UŽ SÚ
```

Schéma `blog-comment`:
```
authorName*     string        authorEmail   email
authorProfile   string        content*      text
approved*       boolean=false likes         integer=0
sourceBlogger   boolean       sourceBloggerId string
originalDate    datetime      inReplyTo     string
post            relation → blog-post
```

**Čo chýba úplne**
- väzba komentára na **používateľa** (dnes je autor len meno v texte)
- komentáre a lajky pri **fotografiách** (v `HistoricalGallery.tsx` po nich
  ostal len komentár v kóde, UI bolo odstránené)
- **e-mail** — nainštalovaný je len `provider-email-sendmail`, ktorý reálne
  neodosiela; `config/plugins.ts` je prázdny
- `email_confirmation` je **vypnuté**, `allow_register` je zapnuté

⚠️ **Registrácia je teda dnes otvorená a bez overenia.** Ktokoľvek si vie
založiť účet cez `/api/auth/local/register`. To treba ošetriť hneď v kroku 1.

---

## 1. E-mail — bez tohto nefunguje nič

Registrácia s overovacím kódom aj „zabudnuté heslo" stoja a padajú na tom,
či Strapi vie odoslať e-mail. Dnes nevie.

**Voľba providera** (jeden z):

| | výhoda | nevýhoda |
|---|---|---|
| **Resend** | 3 000 mailov/mes. zdarma, jednoduché API | ďalšia služba |
| **SendGrid** | zavedené, štedrý free tier | zložitejšie overenie domény |
| **SMTP** (napr. Websupport) | e-mail z vlastnej domény | treba SMTP údaje |

Odporúčam **Resend** alebo **SMTP na doméne hradiska.sk** — mail od
`info@hradiska.sk` pôsobí dôveryhodnejšie než od cudzej služby.

**Kroky**
1. `npm i @strapi/provider-email-nodemailer` (SMTP) alebo `strapi-provider-email-resend`
2. `config/plugins.ts` — konfigurácia providera, údaje z `.env`
3. `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
4. Overiť odoslanie: `POST /api/auth/forgot-password`
5. Upraviť šablóny (`plugin_users-permissions_email`) — sú v angličtine,
   treba slovenské znenie a odkaz na náš frontend, nie na Strapi

⚠️ **Reply-to a doména:** ak sa maily budú posielať z `hradiska.sk`, treba
nastaviť SPF a DKIM, inak skončia v spame.

---

## 2. Rozšírenie dátového modelu

Vyžaduje **dočasné prepnutie Strapi na `npm run develop`** — v produkčnom
režime sa schéma meniť nedá.

### 2.1 `blog-comment` — doplniť

```
user          relation manyToOne → plugin::users-permissions.user
              (autor ako účet; staré Blogger komentáre ho nemajú → nullable)
status        enum [pending|approved|spam|deleted]  def=pending
              (nahrádza boolean `approved` — potrebujeme rozlíšiť spam
               od nezobrazeného a od zmazaného)
editedAt      datetime
```

`approved` ponechať kvôli 732 existujúcim záznamom a migrovať:
`approved=true → status=approved`.

### 2.2 Nová kolekcia `photo-comment`

Fotografie nie sú samostatná entita — sú to položky v `files` (upload plugin).
Nedá sa na ne priamo naviazať relácia.

**Riešenie:** kolekcia s odkazom na `fileId`.

```
fileId*       integer         ← id v Media Library
content*      text
user*         relation → user
status        enum [pending|approved|spam|deleted]
inReplyTo     string
createdAt     (automaticky)
```

### 2.3 Nová kolekcia `reaction` (lajky)

Lajk musí byť **na používateľa**, inak sa dá klikať donekonečna. Dnešné
`likes: integer` na komentári je len počítadlo bez ochrany.

```
user*         relation → user
targetType*   enum [comment|photo|post|photo-comment]
targetId*     string          ← documentId alebo fileId
createdAt
```

Unikátnosť dvojice `(user, targetType, targetId)` treba strážiť v controlleri —
Strapi zložený unique index priamo neponúka.

### 2.4 Rozšírenie používateľa (`up_users`)

```
displayName   string     ← meno zobrazené pri komentári
blocked       (už existuje v Strapi)
blockedReason string
blockedAt     datetime
```

---

## 3. Registrácia a prihlásenie pre verejnosť

### 3.1 Nastavenia Strapi

*Settings → Users & Permissions → Advanced*:
```
email_confirmation      false → TRUE      ← bez toho je registrácia otvorená
allow_register          true (ponechať)
unique_email            true (ponechať)
default_role            Public? → nová rola „Member"
```

### 3.2 Nová rola `Member`

Nemôže dostať rovnaké práva ako `Authenticated` (tá má dnes create/update/delete
na články!). Treba **samostatnú rolu** len s:
```
blog-comment    find, findOne, create, update (len vlastné), delete (len vlastné)
photo-comment   find, findOne, create, update/delete vlastné
reaction        find, create, delete vlastné
users-permissions.user  me
```

⚠️ **„len vlastné" Strapi sám nezabezpečí** — treba to vynútiť v controlleri
(policy, ktorá porovná `ctx.state.user.id` s vlastníkom záznamu). Bez toho by
ktorýkoľvek člen vedel zmazať cudzí komentár.

### 3.3 Toky

```
Registrácia   POST /api/auth/local/register {username, email, password}
              → Strapi pošle e-mail s odkazom
              → GET /api/auth/email-confirmation?confirmation=<token>
              → presmerovanie na frontend

Prihlásenie   POST /api/auth/local {identifier, password} → JWT

Zabudnuté     POST /api/auth/forgot-password {email}
heslo         → e-mail s odkazom na /reset-hesla?code=…
              → POST /api/auth/reset-password {code, password, passwordConfirmation}
```

**Frontend potrebuje nové stránky:** `/registracia`, `/prihlasenie`,
`/overenie`, `/zabudnute-heslo`, `/reset-hesla`, `/profil`.

⚠️ Strapi posiela v maile odkaz na **svoju** adresu. Treba prestaviť
`Settings → Advanced → Redirection URL` na náš frontend.

---

## 4. Komentáre na frontende

### 4.1 Prestavba `CommentSection.tsx`

Dnes je to formulár s menom a e-mailom. Po zmene:
- neprihlásený vidí komentáre + výzvu „Prihláste sa a zapojte sa do diskusie"
- prihlásený píše pod svojím účtom (`displayName`), meno nezadáva
- vlastný komentár môže upraviť a zmazať
- lajk pri komentári (raz na účet, prepínateľný)
- odpovede cez `inReplyTo` (pole už existuje, len sa nepoužíva)

### 4.2 Fotografie — vrátiť lajky a komentáre

`HistoricalGallery.tsx` má v lightboxe pripravené miesto (komentár v kóde
spomína „info panel s likes/komentármi/share"), UI bolo odstránené.

Vrátiť ako bočný panel lightboxu:
- počet lajkov + tlačidlo
- zoznam komentárov k fotke (`photo-comment` podľa `fileId`)
- pole na napísanie (len pre prihlásených)

**Kde všade sa fotky zobrazujú:** `HistoricalGallery` (galéria v článku),
`GalleryPage`, lightbox v `AktualityFeed`. Rozhodnúť, či komentáre pribudnú
všade alebo len v galérii článku.

---

## 5. Admin — moderácia

### 5.1 Obrazovka Komentáre

- filtre: **čaká na schválenie / schválené / spam / zmazané**, podľa článku,
  podľa používateľa, fulltext
- akcie: schváliť, označiť ako spam, zmazať, odpovedať ako združenie
- hromadné operácie (vybrať viac a schváliť naraz)
- pri každom komentári: článok, autor (odkaz na účet), dátum, počet lajkov

### 5.2 Prehľad po článkoch

Tabuľka článkov so stĺpcami: názov · počet komentárov · **čaká na schválenie** ·
posledný komentár. Kliknutím filter na daný článok.

Zoznam článkov v admine už má stĺpec s počtom — doplniť „z toho nevybavených".

### 5.3 Obrazovka Používatelia

- zoznam registrovaných: meno, e-mail, dátum registrácie, počet komentárov, stav
- akcie: **zablokovať** (Strapi `blocked=true` — okamžite zabráni prihláseniu),
  odblokovať, zmazať účet
- pri blokovaní zapísať dôvod (`blockedReason`) a dátum
- rozhodnúť: **zmazať účet = zmazať jeho komentáre?** Odporúčam nie —
  anonymizovať autora a komentáre nechať, inak sa rozpadnú diskusie

### 5.4 Fotokomentáre

Samostatná záložka alebo spoločný zoznam s prepínačom „Články / Fotografie".

---

## 6. Veci, ktoré si nespomenul, ale budú treba

**Ochrana proti spamu.** Otvorená registrácia + komentáre = boti do týždňa.
Minimum: rate limiting na `/api/auth/local/register` a na vytvorenie komentára
(napr. max 5/hod. na účet), honeypot pole vo formulári. Zvážiť hCaptcha.

**GDPR.** Registráciou zbierame e-mail. Treba súhlas pri registrácii, odkaz na
ochranu údajov (stránka už existuje), a možnosť **zmazať si účet**. Doplniť do
`PrivacyPage`, čo sa zbiera a prečo.

**Notifikácie.** Chce združenie mail pri novom komentári? A autor komentára
pri odpovedi? Ak áno, treba to naplánovať — inak nikto nezistí, že niečo čaká.

**Moderácia pred zverejnením.** Rozhodnúť: komentár sa zobrazí hneď, alebo až
po schválení? Dnešné `approved` default `false` znamená **až po schválení** —
to je bezpečnejšie, ale niekto to musí denne sledovať.

**732 existujúcich komentárov** nemá účet ani e-mail (`authorName = "Anonymous"`).
Ostanú ako sú, len bez možnosti lajkovať a odpovedať pod účtom.

**Zobrazovanie mena.** Reálne meno, prezývka, alebo oboje? Ak prezývka, treba
kontrolu jedinečnosti a slušnosti.

**Blokovaný používateľ a jeho komentáre.** Skryť spätne, alebo nechať? Odporúčam
nechať a skryť až tie, ktoré sú problémové — inak zmiznú aj slušné príspevky.

---

## 7. Poradie prác

| # | krok | odhad | blokuje |
|---|---|---|---|
| 1 | **E-mail provider + šablóny** | 2–3 h | všetko ostatné |
| 2 | Zapnúť `email_confirmation`, rola `Member` | 1 h | registráciu |
| 3 | Schéma: `blog-comment.user/status`, `photo-comment`, `reaction` | 2 h | — |
| 4 | Policy „len vlastné" v controlleroch | 2–3 h | bezpečnosť |
| 5 | Frontend: registrácia, prihlásenie, reset hesla, profil | 5–6 h | — |
| 6 | Prestavba `CommentSection` na účty + lajky | 4–5 h | 5 |
| 7 | Fotokomentáre a lajky v lightboxe | 4–5 h | 3, 5 |
| 8 | Admin: moderácia komentárov | 4–5 h | 3 |
| 9 | Admin: používatelia a blokovanie | 3–4 h | 3 |
| 10 | Anti-spam, rate limiting, GDPR texty | 3–4 h | 5 |

**Spolu zhruba 30–40 hodín.** Prvý použiteľný stav je po kroku 6 — vtedy sa dá
registrovať a komentovať články. Fotky a admin moderácia sú ďalšie vrstvy.

---

## 8. Riziká

**Produkčný režim Strapi.** Kroky 2 a 3 menia schému → nutné prepnúť na
`npm run develop`, spraviť zmeny, `npm run build`, vrátiť späť.

**Rola `Authenticated` je dnes silná.** Má create/update/delete na články.
Verejní členovia **nesmú** dostať túto rolu — preto samostatná `Member`.
Ak by sa to popletlo, ktorýkoľvek registrovaný by mohol mazať články.

**„Len vlastné" nie je automatické.** Strapi dá právo na `update`/`delete`
plošne. Bez policy v controlleri by člen mohol upraviť cudzí komentár.
Toto je najpravdepodobnejšie miesto na bezpečnostnú dieru.

**E-maily v spame.** Bez SPF/DKIM na doméne skončí overovací kód v spame a
používateľ sa nezaregistruje. Otestovať na Gmail, Outlook aj Seznam.
