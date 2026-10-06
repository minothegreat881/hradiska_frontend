# Anglická verzia webu — stav a postup

Merané **6. 10. 2026** proti živej produkcii (`webdesignforhradiskask.vercel.app`,
`188.245.47.29`). Čísla sú z odpovedí servera a z meraní Playwrightom, nie odhady.

Nadväzuje na [METADATA-STAV.md](METADATA-STAV.md): slovenská fáza (metadáta) je
hotová, toto je fáza druhá — preklad.

---

## 1. Čo je hotové

**Rozhranie webu je po anglicky celé** — hlavička, roletka kategórií, lišta
kategórií na stránke článku, pobočný panel (lokalita, kľúčové fakty, časová os,
témy, súvisiace články), zdieľanie, fotogaléria aj svetelný box, diskusia,
nahlásenie príspevku, mapa hradísk, lišta o cookies a päta. Dátumy idú v `en-GB`,
`lang` dokumentu aj tela článku sa prepína.

| časť | kde | ako |
|---|---|---|
| prekladová vrstva | `src/lib/jazyk.ts` | 213 reťazcov; kľúč je **slovenský originál**, takže slovenská vetva ostáva čitateľná v komponente |
| adresa | `src/App.tsx` → `rozdelAdresu()` | `/en/...` zapína angličtinu, `odkaz()` drží odkazy v jazyku stránky |
| obsah článku | Strapi i18n | `?locale=en`, prepínač jazyka v článku, `hreflang` v prerenderovanej hlavičke |
| hľadanie a odporúčanie | `/api/search-index?locale=` | index je na backende **per jazyk**; anglická stránka neodporúča slovenské články |

**Preložené články: 364 / 364** (dokončené 6. 10. 2026)

Preklad bežal v 60 paralelných dávkach cez agenta `prekladatel-hradiska`
(definícia v `~/.claude/agents/`), zapisoval sa `scripts/preklad/zapis-davku.cjs`.
415 062 slov slovenského textu. Pri každom zápise skript overil počet a typy
blokov, obrázky, bibliografiu, popisy fotiek — a že slovenská verzia ostala
nedotknutá.

V sitemape 364 slovenských a 364 anglických adries; každá anglická stránka má
`hreflang sk/en/x-default`, `og:locale=en_GB` a vlastný kanonický odkaz.

**Čo prešlo po prekladoch:**

| priechod | skript | výsledok |
|---|---|---|
| zrkadlenie štruktúry | `preklad/zrkadli-strukturu.cjs` | 364 kontrolovaných, 0 rozídených |
| vnútorné odkazy na anglické adresy | `opravy/odkazy-en.cjs` | 74 odkazov v 68 článkoch |
| zjednotenie mien (Svatopluk, Kyiv) | `opravy/zjednot-mena-en.cjs` | 19 zmien v 11 článkoch |
| slovník | `hradiska-strapi/docs/TERMINOLOGIA-EN.md` §11d | 586 nových termínov |
| nezrovnalosti v slovenčine | `hradiska-strapi/docs/NEZROVNALOSTI-SK.md` | 167 nálezov na redakčnú revíziu |
| slovenské úvodzovky v angličtine | `opravy/uvodzovky-en.cjs` | 528 úvodzoviek v 44 článkoch |
| fotokredity v bloku Zdrojov | `opravy/fotokredity-en.cjs` | 26 kreditov v 24 článkoch |
| rozvrh obrázkov SK vs. EN | `kontrola/rozvrh-obrazkov.cjs` | 1248 / 1248 zhodných |
| slovenské telo v anglickej verzii | `kontrola/slovencina-v-en.mjs` | 14 nájdených, všetky opravené, zostáva 0 |

---

## 2. Postup pri preklade jedného článku

1. **Vytiahni slovenský originál** vrátane blokov:
   `curl -s "http://188.245.47.29/api/blog-posts?filters[slug][$eq]=<slug>&populate[blocks][populate]=*&populate[keyFacts]=*&populate[timeline]=*&populate[quotes]=*&populate[location]=*"`
2. **Napíš preklad** do `hradiska-strapi/scripts/preklad/preklady/<slovenský-slug>.json`
   v tvare `{ "slug": "<sk slug>", "data": { … } }`. `data` má **len prekladané
   polia**: `title`, `slug`, `excerpt`, `metaTitle`, `metaDescription`, `blocks`,
   `keyFacts`, `timeline`, `quotes`. Médiá, kategória, štítky a poloha sú
   zdieľané a skript ich dopĺňa sám — blok s obrázkom teda napíš bez `image`
   a `content.sources` s prázdnym `items`.
   Poradie a typy blokov **musia sedeť** so slovenskou verziou (párujú sa pozične).
3. **Zapíš** (skript sa spúšťa tam, kde je databáza — teda na serveri):
   `ssh … 'cd /opt/hradiska && git pull && node scripts/preklad/zapis-preklad.cjs --subor=scripts/preklad/preklady/<slug>.json'`
   — bez `--zapis` je to nasucho, s `--zapis` sa zapisuje. Výpis musí ohlásiť
   `obrázkov x/x · položiek zdrojov y/y` a **`slovenská publikovaná nedotknutá: áno`**.
4. **Dajte to skontrolovať agentovi** `terminolog-hradiska` (jeden článok naraz).
   Terminologické chyby opraví sám, vecné iba oznámi.
5. **Commitni** aj vstupný JSON — agent doň zapisuje svoje opravy.

Štruktúru drží v súlade `scripts/preklad/zrkadli-strukturu.cjs`
(`/usr/local/bin/hradiska-zrkadlenie.sh`, cron každých 10 minút, log
`/var/log/hradiska-zrkadlenie.log`). Keď v slovenskom článku presuniete alebo
zmažete fotku, anglická verzia sa prestaví a preložený text ostane na svojom
mieste. Posledný priechod: `kontrolovaných 4 · rozídených 0 · chýb 0`.

Záväzný slovník je `hradiska-strapi/docs/TERMINOLOGIA-EN.md`. Pravidlá, ktoré
neplatia intuitívne: **názov a perex sa píšu pre anglického čitateľa** (nie
doslovne), **telo sa prekladá verne** a **čísla sa neopravujú** — nezrovnalosť
sa iba nahlási.

---

## 2b. Popisy fotiek — pole `mediaTexts`

Knižnica médií má popis (`caption`) a alt (`alternativeText`) **jeden pre celý
web**, takže anglická galéria stála po slovensky. Článok preto má prekladané
pole `mediaTexts` — repeatable komponent `shared.media-text`:

```json
"mediaTexts": [
  { "mediaId": 3316, "caption": "A sword from Detva…", "alt": "A sword from Detva…" },
  { "mediaId": 3322, "alt": "A beech wood on the crown of the hillfort…" }
]
```

`mediaId` je id súboru v médiách (vidno ho v odpovedi `populate[gallery]`).
Poradie je ľubovoľné, fotka sa páruje podľa id. Pole patrí k `data` vo vstupnom
súbore prekladu, takže sa zapisuje tým istým skriptom.

Na stránke platí toto poradie: **`mediaTexts` → popis preloženého bloku (keď tá
istá fotka stojí aj v tele) → knižnica médií.** Titulná fotografia berie alt
rovnako. V slovenčine je pole prázdne, takže sa na slovenskej strane nič nemení.

**Fotka, ktorá v slovenčine popis ani alt nemá, ho nedostáva ani v angličtine** —
nevymýšľa sa.

---

## 3. Čo zostáva

- **Terminologická kontrola agentom `terminolog-hradiska`: hotových 131 článkov
  z 364.** Ktoré sú hotové, drží `hradiska-strapi/scripts/kontrola/terminologia-hotove.txt`;
  zvyšok sa pustí po dávkach po desiatich. Strojové nálezy generuje
  `scripts/kontrola/terminologia-en.cjs --json=…`, ale agent hľadá aj to, čo
  pravidlá nezachytia.
- **Rozídená štruktúra blokov je vyriešená (6. 10. 2026).** Trinásť vstupných
  súborov malo bloky v inom poradí než slovenčina, pri štyroch nesedeli ani
  počty (pridaný blok s menom autorky, zdvojená bibliografia, obrázok z galérie
  vložený do tela). Na preusporiadanie je `opravy/zrovnaj-bloky.mjs`, a keď
  nesedia ani počty, `opravy/kostra-zo-sk.mjs` poskladá bloky na slovenskej
  kostre a popisy obrázkov vezme z `mediaTexts` podľa id — nie podľa poradia,
  lebo poradie obrázkov sa v preklade líšilo.
- **Po KAŽDOM dávkovom zápise treba znova pustiť `scripts/opravy/odkazy-en.cjs
  --zapis`** — vstupné súbory prekladu majú vnútorné odkazy na slovenské slugy,
  takže zápis prepíše už opravené anglické odkazy späť.
- **Poznámky pod čiarou** v 6 článkoch (komponent Zdrojov nesie autorský text,
  nie bibliografiu) — prekladajú sa zvlášť.
- **Kategórie a štítky nemajú preklad v Strapi** — anglické názvy drží slovník
  v `jazyk.ts` (23 štítkov, 14 kategórií). Keď pribudne nový štítok, treba ho
  doplniť tam, inak sa na anglickej stránke ukáže po slovensky.
- ~~Popis a alt fotografie sú v knižnici médií spoločné pre oba jazyky.~~
  **Vyriešené 5. 10. 2026** poľom `mediaTexts` (viď §2b).
- **Mapa hradísk pod článkom** sa plní zo slovenského registra (všetkých 364
  lokalít) a jej karta odkazuje na **slovenský** článok — v angličtine s
  poznámkou „(in Slovak)". Inak by `/en/blog/<slovenský slug>` skončil na
  „Article not found". Keď bude preložená väčšina článkov, mapa môže ísť na
  anglický index a poznámka vypadne; dovtedy je lepšie ukázať celý register než
  štyri body.
- **Komentáre čitateľov** ostávajú v jazyku, v ktorom boli napísané — to je
  správne, nie chyba.

---

## 3b. Čo sa pokazilo a čo to drží (6. 10. 2026)

**Zrkadlenie štruktúry prepisovalo anglické telo slovenským.** Cron
`/usr/local/bin/hradiska-zrkadlenie.sh` (každých 10 minút) spúšťa
`preklad/zrkadli-strukturu.cjs`. Ten blok, ktorý v angličtine náprotivok nemal,
vyplnil slovenským textom a publikoval — štrnásť článkov tak malo anglický slug
a slovenský obsah (napr. `thousand-year-old-slavic-hillforts`,
`tollense-bronze-age-battle`, `stefanovicova-slovakia-in-the-time-of-svatopluk`).
Bloky bez náprotivka vznikali tam, kde sa štruktúra vstupného súboru rozišla so
slovenčinou, takže ich dávkový zapisovač odmietal a zrkadlenie malo voľné pole.

Čo to odteraz drží:
- poistka v `zrkadli-strukturu.cjs`: keď by hoci **jediný** textový blok ostal po
  slovensky, článok sa preskočí a nahlási (predtým sa tolerovali dva);
- `kontrola/slovencina-v-en.mjs` prejde všetky anglické články a počíta slovenské
  funkčné slová na tisíc slov, po blokoch — bibliografia v bloku Zdrojov je
  slovenská zámerne a vo výpise sa dá rozoznať podľa typu bloku;
- `opravy/zrovnaj-bloky.mjs` nasucho overí, že štruktúra všetkých 364 vstupných
  súborov sedí so slovenčinou.

**Pozor na obmedzenie počtu požiadaviek.** Pri 364 dotazoch na produkčné API
začne web vracať 429 a skript, ktorý to nekontroluje, články ticho preskočí —
prvá kontrola štruktúry takto ohlásila „0 rozídených", pričom rozídené boli tri.
Každý hromadný skript preto pri 429 čaká a skúša znova a vypisuje, **koľko
článkov naozaj overil**.

---

## 3c. Poradie dokončenia (6. 10. 2026)

Terminologické dávky prepisujú tie isté vstupné súbory, takže hromadné opravy
idú až po nich — inak si navzájom prepíšu zmeny. Poradie:

1. dobehnúť terminologické dávky (po desiatich, zoznam hotových v
   `scripts/kontrola/terminologia-hotove.txt`);
2. `node scripts/kontrola/rozvrh-suborov.mjs --oprav` — rozvrh obrázkov vo
   vstupných súboroch na slovenské hodnoty. **Zapisovač berie `width`, `position`
   a ostatné polia rozvrhu zo vstupného súboru, nie zo slovenčiny** (zo
   slovenčiny dopĺňa len `image` a bibliografiu), takže čo si prekladateľ vymyslel,
   to sa aj zapíše. Teraz je rozdielov 33 v trinástich článkoch;
3. `node scripts/opravy/rozsahy-en.mjs --zapis` — číselné rozsahy a percentá
   bez medzier (§11e);
4. commit, push, `git pull` na serveri;
5. `node scripts/preklad/zapis-davku.cjs --zapis --znova` — celý blog znova;
6. `odkazy-en.cjs --zapis`, `uvodzovky-en.cjs --zapis`, `fotokredity-en.cjs --zapis`
   (v tomto poradí, vždy po zápise) a `systemctl restart hradiska`;
7. kontroly: `kontrola/slovencina-v-en.mjs` (má byť 0 článkov so slovenským
   telom mimo bibliografie), `kontrola/rozvrh-obrazkov.cjs`,
   `kontrola/terminologia-en.cjs` (tvrdé porušenia 0), `opravy/zrovnaj-bloky.mjs`
   nasucho (0 rozídených);
8. nový build Vercelu — prerenderované hlavičky a sitemap si ťahajú titulky
   z databázy pri builde, takže bez builduu zostanú staré.

---

## 4. Ako to overiť

- anglických článkov v databáze:
  `curl -s "http://188.245.47.29/api/search-index?bezTextu=1&locale=en" | python -c "import sys,json;print(json.load(sys.stdin)['count'])"`
- zhoda panelov a sekcií SK vs. EN: Playwright — zobrať `.article-sidebar-col h3`
  a `h2` na oboch stránkach a porovnať (takto sa našlo, že v angličtine chýbali
  súvisiace články, lebo index bol slovenský).
- zvyšky slovenčiny na anglickej stránke: prejsť viditeľné textové uzly aj
  `aria-label`, `title`, `alt` a filtrovať slová s diakritikou mimo vlastných
  mien. Takto sa našli popisy pre čítačky v lište kategórií a zdroje mapy.
