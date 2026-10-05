# Anglická verzia webu — stav a postup

Merané **5. 10. 2026** proti živej produkcii (`webdesignforhradiskask.vercel.app`,
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

**Preložené články: 4 / 364**

| slovenský slug | anglický slug |
|---|---|
| `molpir` | `molpir-hallstatt-hillfort-smolenice` |
| `rekomberek-horne-oresany` | `rekomberek-hillfort-horne-oresany` |
| `detva-kalamarka` | `detva-kalamarka-guard-hillfort` |
| `velky-tribec-mohutne-praveke-hradisko` | `velky-tribec-prehistoric-hillfort` |

V sitemape 364 slovenských a 4 anglické adresy; každá anglická stránka má
`hreflang sk/en/x-default`, `og:locale=en_GB` a vlastný kanonický odkaz.

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

- **360 článkov**. Prekladať po dávkach, každý s kontrolou terminológa —
  vrátane `mediaTexts` (pri Detve to je 29 fotiek, pri Veľkom Tríbči 28).
- **Počty článkov v kategóriách** (hlavička, dlaždice) sa berú zo slovenského
  obsahu — anglická hlavička píše „41", hoci po anglicky sú 4 články. Zarovná sa
  to samo s prekladmi; ak to má byť správne hneď, treba `/api/pocty-kategorii`
  rozdeliť podľa jazyka rovnako ako index.
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

## 4. Ako to overiť

- anglických článkov v databáze:
  `curl -s "http://188.245.47.29/api/search-index?bezTextu=1&locale=en" | python -c "import sys,json;print(json.load(sys.stdin)['count'])"`
- zhoda panelov a sekcií SK vs. EN: Playwright — zobrať `.article-sidebar-col h3`
  a `h2` na oboch stránkach a porovnať (takto sa našlo, že v angličtine chýbali
  súvisiace články, lebo index bol slovenský).
- zvyšky slovenčiny na anglickej stránke: prejsť viditeľné textové uzly aj
  `aria-label`, `title`, `alt` a filtrovať slová s diakritikou mimo vlastných
  mien. Takto sa našli popisy pre čítačky v lište kategórií a zdroje mapy.
