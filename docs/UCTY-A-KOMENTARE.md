# Účty, komentáre a lajky — kompletná dokumentácia

Referenčný dokument k vrstve, ktorá umožňuje verejnosti registráciu, komentovanie
článkov aj fotiek, lajkovanie a adminovi moderáciu a správu členov.

Stav: **dokončené 2026-07-20.** Overené proti bežiacemu Strapi 5.31.3.
Všetky tvrdenia nižšie sú odskúšané, nie odpísané z dokumentácie.

---

## 1. Prehľad

```
Návštevník (neprihlásený)   → číta komentáre, nemôže písať ani lajkovať
Člen (rola Member)          → registruje sa, komentuje, lajkuje, maže si vlastné
Admin (rola Authenticated)  → moderuje komentáre, blokuje účty, spravuje obsah
```

Dva oddelené systémy prihlásenia na frontende (rôzne tokeny v `localStorage`):
- **admin** (`src/admin/AuthContext.tsx`, kľúč `hradiska.admin.jwt`)
- **verejnosť** (`src/auth/MemberAuth.tsx`, kľúč `hradiska.member.jwt`)

---

## 2. Účty (Strapi Users & Permissions)

### 2.1 Roly

| id | type | názov | kto |
|---|---|---|---|
| 1 | authenticated | Authenticated | admin / staff |
| 2 | public | Public | neprihlásený |
| 3 | member | **Member** | registrovaný člen |

⚠️ **Kritické:** registrácia priraďuje rolu **Member**, nie Authenticated.
Keby dostávala Authenticated, každý registrovaný by mal právo mazať články.

### 2.2 Registrácia

Nastavenia (`plugin_users-permissions_advanced` v DB):
```
allow_register        = true
default_role          = member       ← nie authenticated!
email_confirmation    = true          ← bez overenia sa neprihlásiš
redirect po overení   = http://localhost:3000/prihlasenie?overeny=1
```

Tok:
```
POST /api/auth/local/register {username, email, password}
  → účet confirmed=false, JWT sa NEVRÁTI
  → e-mail s odkazom na /api/auth/email-confirmation?confirmation=<token>
  → Strapi potvrdí a presmeruje na /prihlasenie?overeny=1
POST /api/auth/local {identifier, password} → JWT (až po potvrdení)
```

### 2.3 Zabudnuté heslo
```
POST /api/auth/forgot-password {email}
  → e-mail s odkazom na /reset-hesla?code=<token> (na FRONTEND)
POST /api/auth/reset-password {code, password, passwordConfirmation}
```

### 2.4 Rozšírenie používateľa

`src/extensions/users-permissions/content-types/user/schema.json` pridáva:
```
displayName     string    ← meno zobrazené pri komentároch
blockedReason   string    ← dôvod blokovania
blockedAt       datetime
```
(`blocked` má Strapi natívne.)

### 2.5 Blokovanie

Admin nastaví `blocked: true`. Strapi potom pri prihlásení odmietne:
*„Your account has been blocked by an administrator."* Odblokovanie vráti prístup.

### 2.6 Zmazanie vlastného účtu (GDPR)

```
DELETE /api/account/me   (vlastný endpoint, len prihlásený)
```
Zmaže LEN volajúceho. Jeho komentáre sa **anonymizujú** na „Zmazaný účet"
(neodstránia sa — diskusie by sa inak rozpadli). Implementácia:
`src/api/account/controllers/account.ts`.

---

## 3. Dátový model

### 3.1 blog-comment (rozšírený)

```
authorName*   string        content*      text
authorEmail   email          status        enum [visible|hidden|spam] def=visible
approved      boolean        likes         integer   ← počítadlo (aj Blogger éra)
editedAt      datetime       inReplyTo     string    ← documentId rodiča (vlákna)
sourceBlogger boolean        originalDate  datetime
post          → blog-post    user          → users-permissions.user (nullable)
```

`status` nahradil rozhodovanie cez `approved`. `approved` a `likes` sa
zachovali kvôli **732 migrovaným Blogger komentárom**.

### 3.2 photo-comment (nová kolekcia)

Fotka nie je entita — viaže sa cez `fileId`.
```
fileId*    integer    ← id v Media Library
content*   text        status   enum [visible|hidden|spam]
user       → user      inReplyTo string       editedAt datetime
```

### 3.3 reaction (nová kolekcia — lajky)

```
targetType*  enum [comment|photo|photo-comment|post]
targetId*    string    ← documentId komentára alebo fileId fotky
user         → user
```
Jedinečnosť dvojice `(user, targetType, targetId)` **stráži controller**
(Strapi zložený unique index nemá).

---

## 4. Bezpečnosť controllerov

Súbory: `src/api/{blog-comment,photo-comment,reaction,account}/controllers/`.

Rozlíšenie staff vs. člen:
```ts
const isStaff = (user) => user?.role?.type === 'authenticated';
```

### Pravidlá (overené)

| akcia | kto smie |
|---|---|
| komentovať (blog aj foto) | **len prihlásený** — controller vráti 401 bez usera |
| upraviť komentár | **len vlastný** (staff hocijaký) |
| zmazať komentár | **len vlastný** (staff hocijaký) |
| meniť `status` (moderácia) | **len staff** |
| lajkovať | **len prihlásený**, dedup, `user` zo servera |
| odlajkovať | **len vlastnú** reakciu |

**Obrana do hĺbky:** komentovanie vyžaduje prihlásenie **priamo v controlleri**
(`if (!user) return ctx.unauthorized()`), nespolieha sa len na oprávnenia roly.
Overené: anonym dostane 401 aj keď pošle `authorName`.

> Pozn.: Public rola má v DB stále `blog-comment.create` (Strapi si default
> pri štarte obnovuje). Nevadí — request síce dorazí do controllera, ten ho
> ale odmietne 401. Autoritatívny guard je controller, nie oprávnenie.

### Kľúčové technické zistenie

Zápis komentára ide cez `strapi.documents().create()`, **nie `super.create`** —
content-API sanitizácia pri užívateľskej role odmieta reláciu `post` ako holý
documentId („Invalid key post"). Document service ju prijme.

### Anti-spam

Rate limit v create controlleri: **max 5 komentárov za minútu na účet** → 429.
Platí pre blog aj foto komentáre.

### Lajky a počítadlo

Blog komentáre majú `likes` counter (obsahuje aj Blogger lajky). Reakcia je
zdroj pravdy o TOM, KTO lajkol; zobrazený počet číta frontend z `likes`. Preto
reaction controller pri `targetType=comment` posunie counter o ±1. Fotky
counter nemajú — počet sa ráta priamo z reakcií.

---

## 5. Oprávnenia rolí (aktuálny stav)

### Member (id 3)
```
api::account.account.deleteMe
api::blog-comment.blog-comment.{create,update,delete}
api::photo-comment.photo-comment.{create,update,delete}
api::reaction.reaction.{find,create,delete}
plugin::users-permissions.user.me
```

### Authenticated / admin (id 1) — navyše k obsahu
```
plugin::users-permissions.user.{find,findOne,update,me}   ← správa členov
api::blog-comment.blog-comment.{find,findOne,create,update,delete}
api::photo-comment.photo-comment.{find,findOne,create,update,delete}
api::reaction.reaction.{find,findOne,create,delete}
+ blog-post, blog-category, blog-tag, aktualita CRUD (obsah)
```

### Public (id 2)
```
auth.{register,callback,forgotPassword,resetPassword,emailConfirmation,
      sendEmailConfirmation,connect}
*.find / *.findOne pre čítanie obsahu a komentárov
photo-comment.{find,findOne}, reaction.find
```

---

## 6. Frontend

### Verejnosť
| súbor | čo |
|---|---|
| `src/lib/memberApi.ts` | register/login/me/forgot/reset/deleteMyAccount |
| `src/auth/MemberAuth.tsx` | kontext prihlásenia člena, token v localStorage |
| `src/pages/AccountPage.tsx` | login/register/forgot/reset/profil (1 komponent) |
| `src/components/TwoTierNav.tsx` | odkaz na účet/profil v navigácii |

Cesty: `/prihlasenie` `/registracia` `/zabudnute-heslo` `/reset-hesla` `/profil`.

### Komentáre a lajky
| súbor | čo |
|---|---|
| `src/components/CommentSection.tsx` | diskusia pod článkom (prestavaná na účty) |
| `src/lib/photoApi.ts` | foto-komentáre + lajky fotky |
| `src/components/PhotoDiscussion.tsx` | panel v lightboxe galérie |
| `src/components/HistoricalGallery.tsx` | `GalleryImage.fileId`, vloženie panelu |

Neprihlásený vidí komentáre + výzvu prihlásiť sa. Prihlásený píše pod menom
účtu, komentár sa zobrazí **hneď** (žiadne schvaľovanie).

### Admin
| súbor | čo |
|---|---|
| `src/admin/api/comments.ts` | list (staff vidí všetky statusy), počty, status, delete |
| `src/admin/screens/CommentsScreen.tsx` | moderácia — filtre, skryť/spam/zmazať |
| `src/admin/api/users.ts` | zoznam členov, block/unblock |
| `src/admin/screens/UsersScreen.tsx` | správa členov, blokovanie s dôvodom |

---

## 7. E-mail

Provider `@strapi/provider-email-nodemailer`, Gmail SMTP.
Konfigurácia `config/plugins.ts` (len `env()` odkazy), údaje v `.env`:
```
SMTP_HOST=smtp.gmail.com  SMTP_PORT=465  SMTP_SECURE=true
SMTP_USER=milanhrabkovsky@gmail.com
SMTP_PASS=<Gmail App Password>          ← len v .env, nikdy v gite
EMAIL_FROM / EMAIL_REPLY_TO = milanhrabkovsky@gmail.com
```

⚠️ **Dočasné.** Gmail App Password vyžaduje 2FA. Gmail zvládne stovky mailov
denne (na testovanie stačí). Pri prechode na doménu → SMTP `hradiska.sk`
(alebo Resend), inak maily z `@gmail.com` posielané aplikáciou padajú do spamu.

Šablóny (v DB, slovenské): `reset_password` vedie na frontend `/reset-hesla`,
`email_confirmation` na Strapi endpoint (potvrdí + presmeruje na web).

---

## 8. Prevádzka a obnova

**Strapi beží v produkčnom režime** (`npm start`). Dev watcher nad
`public/uploads` (24 tisíc súborov) žral 129 % jadra. Dôsledok: zmeny v
`src`/`config` si vyžadujú `npm run build` + reštart; zmena schémy vyžaduje
dočasné `npm run develop`.

### ⚠️ Nastavenia v DB, nie v gite — pri obnove čistej DB nastaviť znova

Toto **nie je** vo verzii (je to runtime konfigurácia Strapi):
- rola **Member** + jej povolenia (viď §5)
- rozšírené povolenia **Authenticated** (user find/update, komentáre, reakcie)
- registrácia: `default_role=member`, `email_confirmation=true`, redirect URL
- odobratie/ponechanie Public `blog-comment.create` (controller je guard)
- e-mailové šablóny (SK, správne URL)
- `api::account.account.deleteMe` pre rolu Member

Schéma (kolekcie, polia) **je** v gite ako `schema.json` súbory a aplikuje sa
cez `npm run develop`.

### Zálohy
Pred každou zmenou schémy/DB sa robí kópia `.tmp/data.db`. Migrácia
732 existujúcich komentárov: `approved=true → status=visible`.

---

## 9. Testovací účet

```
člen:  milanhrabkovsky+test@gmail.com  /  TestHeslo123
admin: admin@hradiska.sk               /  Hradiska-Admin-2026!
```
(Heslá zmeniť pred ostrým nasadením.)

---

## 10. Čo zostáva pred ostrým nasadením

- **JWT v localStorage** (člen aj admin) — pred verejnou doménou prejsť na
  httpOnly cookie cez proxy (riziko XSS)
- **Gmail → doménový SMTP** + SPF/DKIM (inak spam)
- **captcha** pri registrácii, ak sa objaví spam nad rámec rate limitu
- **GDPR text** v `PrivacyPage` doplniť o to, čo sa zbiera (e-mail) a prečo
- heslá testovacích účtov zmeniť/zmazať
