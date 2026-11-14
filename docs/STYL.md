# Štýl webu Hradiská.sk – tokeny, stupnice, mená

Dokument zjednotenia (úloha 2, 14. 11. 2026). Platí pre verejný web (súbory dosiahnuteľné z `src/main.tsx`
bez administrácie) a jeho CSS (`src/design-lab/theme.css`, `src/styles/globals.css`, `src/styles/mapa.css`).
`src/index.css` je vygenerovaný Tailwind – nemení sa. Mŕtvy kód (súbory, ktoré `main.tsx` nedosiahne) sa
nezjednocoval ani nemazal.

**Pravidlo:** nový štýl ide do `theme.css` cez premenné `--hr-*`. Pevné hodnoty farieb, zaoblení a písma
v komponentoch nepribúdajú.

## Vrstvy farieb

1. **Paleta šatu Pečať** `--l-*` (jediná živá: `:root[data-sat='pecat']` v `theme.css`):

| token | hodnota | použitie |
|---|---|---|
| `--l-paper` / `--l-paper-2` / `--l-card` | #f3ede1 / #e8e0cf / #fffcf6 | podklad, tmavší papier, karta |
| `--l-ink` / `--l-body` | #14161d / #3e414a | nadpisy, text tela |
| `--l-muted` / `--l-muted-2` | #67696e / #6b6860 | tichý text (4,7 : 1 na papieri) |
| `--l-line` / `--l-line-2` | #ded5c2 / #c8bda7 | vlásky, rámy |
| `--l-second` / `--l-second-deep` / `--l-second-light` | #c9483a / #8f2c22 / #eda093 | pečatná červená – **len odkazy a tlačidlá** (L15.01) |
| `--l-accent*`, `--l-dark*`, `--l-on-dark*` | | atrament, tmavé plochy (päta, mapa) |

2. **Sémantické tokeny** `--hr-*` (mapované na `--l-*`): `--hr-bg`, `--hr-surface`, `--hr-surface-3`, `--hr-ink`,
   `--hr-body`, `--hr-muted`, `--hr-line`, `--hr-line-gold`, `--hr-accent`, `--hr-accent-deep`, `--hr-dark`,
   `--hr-on-dark*`, `--hr-shadow-sm/md` … Komponenty používajú tieto.

3. **Prekladová vrstva** v `theme.css` (`.lart [style*='rgb(…)']`) – staré inline farby zlatohnedého šatu
   v komponentoch článku prepisuje na paletu. Zjednotením (nižšie) jej v týchto komponentoch ubudla práca;
   ostáva ako záchrana pre iné staré komponenty (odstrániť až po ich prepise – pozri „Zostáva“).

## Stupnica zaoblení

| token | hodnota | kam | zlúčené pôvodné hodnoty |
|---|---|---|---|
| `--hr-radius-xs` | 4 px | drobné prvky (mriežka, štítky) | 4 – 5 px |
| `--hr-radius-s` | 8 px | tlačidlá, polia, menšie karty | 6 – 9 px |
| `--hr-radius-m` | 12 px | panely, roletky, kartičky | 10 – 13 px |
| `--hr-radius-l` | 16 px | dlaždice činnosti, karty | 14 – 17 px |
| `--hr-radius-xl` | 20 px | dlaždice kategórií a článkov | 18 – 26 px |
| `--hr-radius-pill` | 999 px | pilulky, počty, kruhové tlačidlá | 999, 9999 |
| – | 50 % | kruhy (bodky, avatary) | geometria, ostáva |
| – | 1 – 3 px | vlásky, pásiky | ostávajú |

## Písmo

- Rodiny: `--font-heading` / `--font-serif` = Fraunces, `--font-body` = Inter (vlastné súbory v `/fonts`).
  Georgia v inline štýloch starých komponentov prepisuje prekladová vrstva článku na Fraunces/Inter.
- Text tela na mobile ≥ 16 px (Z10.03): perexy kariet, „Pridajte sa“, aplikácia, právne texty, podtitul prihlásenia.
  Nadčiary (11 – 13 px, verzálky), menovky, dátumy, súradnice a atribúcia mapy nie sú text tela.
- Veľkosti písma **nezjednotené** (86 rôznych hodnôt – pozri inventúru): zlúčenie by menilo vzhľad
  a zadanie znie „zjednocuj, neprerábaj“. Návrh stupnice na neskôr: 11 · 12 · 13 · 14 · 16 · 18 · 22 · 28 · 36 px
  a `clamp()` pre nadpisy.

## Odstupy

**Nezjednotené** (132 rôznych hodnôt). Návrh: stupnica 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 px; prevod
pri ďalšej väčšej úprave rozloženia, nie mechanicky (menil by rozostupy na každej stránke).

## Inventúra pevných hodnôt (pred → po zjednotení)

Súbory dosiahnuteľné z `main.tsx` bez administrácie + ich CSS. „Pevné“ = hodnota, nie `var(…)`.
Farby zahŕňajú aj definície paliet (aj nepoužívaných laboratórnych šiat v `theme.css`) a selektory prekladovej vrstvy.

| | pred | po |
|---|---|---|
| farby (rôznych / výskytov) | 617 / 1072 | 614 / 1020 |
| zaoblenia | 47 / 249 | 10 / 51 |
| veľkosti písma | 86 / 468 | 86 / 476 (+ pravidlá 16 px na mobile) |
| odstupy (margin, padding, gap) | 137 / 1027 | 132 / 1009 |

Zmeny farieb: 49 starých inline farieb v komponentoch článku (`CommentSection`, `ArticleSidebar`,
`DynamicZoneRenderer`, `QuoteBlock`, `HistoricalGallery`, `PhotoDiscussion`, `SocialShare`) → tokeny podľa
prekladovej vrstvy (#2d2418 → `--hr-ink`, #7a6b56 → `--hr-muted`, #fffdf8 → `--hr-surface` …). Text, na ktorý sa
nedá kliknúť, je v `--hr-ink`, nie v pečatnej červenej (L15.01).

## Jedno meno pre jednu kategóriu – NÁVRH (rozhodne Peter)

Dnes má kategória až štyri mená podľa miesta. Návrh: celý názov v nadpise, v roletke a v päte; jeden krátky
názov všade, kde je málo miesta (lišta, dlaždica, mobilné menu).

| slug | databáza (celý) | hlavička (krátky) | dlaždica | päta | **návrh krátkeho** |
|---|---|---|---|---|---|
| kniezacie-sidla | Kniežacie sídla | = | = | = | Kniežacie sídla |
| mocenske-centra | Mocenské centrá | = | = | = | Mocenské centrá |
| strazna-funkcia | Strážna a hospodárska funkcia | Strážna funkcia | **Hospodárska funkcia** | – | **Strážne hradiská** alebo „Strážna funkcia“ |
| refugia | Refugiá | = | **Refúgiá** | – | jedno písanie: Refúgiá / Refugiá |
| staroveke-sidla | Staroveké sídla | = | **Staroveké hradiská** | – | jedno z dvoch |
| vseobecne-o-hradiskach | Všeobecne o hradiskách | Všeobecne | = | = | Všeobecne o hradiskách |
| svatyne-a-sakralne-objekty | Svätyne a sakrálne objekty | Svätyne | Svätyne | Svätyne | Svätyne |
| listiny-a-pisomne-zdroje | Listiny a písomné zdroje | Listiny a pramene | **Listiny a pís. zdroje** | Listiny a pramene | Listiny a pramene |
| informacne-tabule | Informačné tabule | Tabule | – | – | Informačné tabule |

Zmena je v editore vzhľadu (krátky názov v menu, popisok dlaždice, názov) – bez zásahu do kódu.

## Zostáva (nezjednotené, s dôvodom)

- Veľkosti písma a odstupy – menili by vzhľad (vyššie).
- Prekladová vrstva `.lart [style*=…]` a staré inline farby v ďalších komponentoch (`AccountPage`, `AccountNavLink`,
  `MapaHradisk`, cookie lišta `--ck-*`) – zjednotiť pri ich prepise; cookie lišta má vlastnú paletu pergamenu.
- Palety nepoužívaných laboratórnych šiat v `theme.css` (ďalšie bloky `--l-*`) – mŕtvy kód, nemaže sa bez rozhodnutia.
