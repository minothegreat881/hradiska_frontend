# Pripomienky — klik na prvok, poznámka

> Nástroj na hlásenie chýb a redakčných poznámok priamo na webe.
> Vznik: 24. 9. 2026.

## Načo to je

Chyby sa predtým opisovali slovami („v článku o Mikulčiciach je niečo zle s galériou")
a hľadalo sa, o ktorý prvok šlo. Teraz sa na prvok klikne a poznámka si sama zapamätá
stránku, prvok aj šírku okna.

Dva druhy v jednom nástroji:
- **chyba** — niečo na webe nefunguje alebo vyzerá zle,
- **obsah** — redakčná poznámka („tu chýba fotka", „prepísať odsek").

## Kto to vidí

**Ktokoľvek, kto má odkaz na stránku** — web je zatiaľ technický, verejnosť naň nechodí
a testeri naň dostávajú odkaz. Hosť smie pripomienku napísať aj čítať; **meniť stav a
mazať smie len redakcia** (rola `authenticated`). Rozhoduje o tom server, nie prehliadač:
PUT/DELETE bez prihlásenia vráti 403 (overené).

Ochrana pred zaplavením: hosť má 10 pripomienok za minútu na IP, prihlásený 20 na účet
(overené: jedenásty zápis hosťa vráti 429). Neprihlásenému sa z autora vracia len
prezývka — `populate` sa mu prepisuje, aby sa cez reláciu nedal vytiahnuť e-mail účtu.

Keby sa web otvoril verejnosti, stačí z `setupPublicPermissions`
(`hradiska-strapi/src/index.ts`) odobrať `api::pripomienka.pripomienka.create` a `.find`;
zvyšok kódu ostáva a nástroj sa vráti len redakcii.

## Ako to funguje

| kde | súbor |
|---|---|
| plávajúce tlačidlo (jediné, čo sa načíta dopredu; vidí ho každý) | `src/pripomienky/PripomienkyDock.tsx` |
| samotný nástroj (lazy — až po kliknutí) | `src/pripomienky/Nastroj.tsx` |
| zapamätanie prvku | `src/pripomienky/kotva.ts` |
| volania na Strapi z webu | `src/pripomienky/api.ts` |
| vzhľad nástroja | `src/styles/pripomienky.css` (tlačidlo `.pr-dock` je v `globals.css`) |
| obrazovka v admine | `src/admin/screens/PripomienkyScreen.tsx` + `src/admin/api/pripomienky.ts` |
| typ obsahu | `hradiska-strapi/src/api/pripomienka/` |
| práva | `hradiska-strapi/src/index.ts` → `setupStaffUserPermissions` |

### Kotva — ako si pripomienka pamätá prvok

Ukladá sa trojica, lebo každá hodnota sama o sebe raz zlyhá:

1. `selektor` — CSS cesta (`body > main > article > p:nth-of-type(3)`), presná, kým sa
   stránka nezmení;
2. `otisokTextu` — prvých 120 znakov textu prvku; keď sa poradie posunie, prvok sa nájde
   podľa neho (overené: po vložení odseku nad cieľ sa špendlík neposunul);
3. `popisPrvku` — ľudský popis („odsek — „Prof. Havlík sa domnieval…""), aby bola
   pripomienka zrozumiteľná aj vtedy, keď prvok na stránke už vôbec nie je.

Poloha kliknutia sa ukladá ako **zlomok** rozmerov prvku (0–1), takže špendlík drží
miesto aj pri inej šírke okna.

### Stavy

`nova` → `riesi-sa` → `hotova` (alebo `zamietnuta`). Hotové a zamietnuté sa na webe už
nekreslia, v administrácii ostávajú ako história. Badge v ponuke počíta len nové.

### Odkaz „na mieste"

`<adresa stránky>?pripomienka=<documentId>` — otvorí stránku, zapne nástroj, odroluje
k pripomienke a otvorí bublinu. Rovnaký vzor ako `?preview=draft` a `?fotoFile=`.

## Pasce, na ktoré si dať pozor

- **`globals.css` vynucuje `pointer-events: auto` na každom `div`** (pravidlo okolo
  r. 48). Čokoľvek, cez čo sa má dať kliknúť na stránku pod vrstvou, musí mať triedu
  `pointer-events-none` — inak zvýraznenie prvku zožerie kliknutie.
- **Tlačidlo je v pravom dolnom rohu, kde sedí aj cookie lišta** (z-index 9999) a ponuka
  inštalácie (9998). Preto má `.pr-dock` z-index 10005; bez toho sa naň nedá kliknúť,
  kým návštevník neodklikne cookies.
- **Štýly nástroja sú v lazy chunku.** Keby `.pr-dock` bolo v `pripomienky.css`, tlačidlo
  by do načítania nástroja vyzeralo neupravené — preto je v `globals.css`.
- **Server prepisuje, čo klient pošle**: `stav` je pri vytvorení vždy `nova`, `user` sa
  berie z tokenu a `zariadenie` sa dopočíta zo šírky okna. Overené: POST s
  `"stav":"hotova"` a cudzím `user` sa uložil ako `nova` a s prihláseným redaktorom.
- **Rate limit** 20 pripomienok za minútu na účet (429).

## Nasadenie

Poradie je dôležité: **najprv backend**, inak nový web posiela na staré Strapi polia,
ktoré nepozná.

```bash
# backend
cd hradiska-strapi && git push
ssh -i ~/.ssh/hetzner_hradiska root@188.245.47.29
cd /opt/hradiska && git pull && NODE_ENV=production npm run build && systemctl restart hradiska
# v logu musí pribudnúť: ✓ staff: api::pripomienka.pripomienka.find …

# frontend
cd Webdesignforhradiskask && npm run build && git push origin main   # Vercel redeployne
```
