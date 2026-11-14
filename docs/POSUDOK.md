# Posudok webu podľa základu – po typoch stránok

Katalóg: 360 pravidiel × 6 typov stránok (úvod, zoznam, detail, formulár, právne, 404; projekt nemá typ kontakt a potvrdenie).
Merané pravidlá (59, pokrytie úplné alebo čiastočné) sú z výsledkov nástroja zaklad-webov (48 stránok × 1440/412/320 px);
čiastočne merané sú „splnené“ len v zmeranej časti. Ostatných 301 pravidiel som posúdil z kódu a snímok (`posudenie.mjs`);
„neviem posúdiť“ = treba ľudí, údaje alebo rozhodnutie klienta. Dôkaz je pri každom „nesplnené“.

## Počty po typoch stránok

| typ | východisko (main): splnené / nesplnené / neuplatňuje sa / neviem | konečný stav (vetva) |
|---|---|---|
| úvod | 176 / 31 / 100 / 53 | 191 / 21 / 99 / 49 |
| zoznam | 165 / 26 / 129 / 40 | 178 / 22 / 125 / 35 |
| detail | 160 / 29 / 121 / 50 | 177 / 23 / 111 / 49 |
| formulár | 175 / 24 / 113 / 48 | 182 / 17 / 112 / 49 |
| právne | 157 / 22 / 138 / 43 | 166 / 15 / 135 / 44 |
| 404 | 165 / 22 / 136 / 37 | 175 / 14 / 134 / 37 |

## Nesplnené v konečnom stave (s dôkazom)

| pravidlo | závažnosť | typy | dôkaz |
|---|---|---|---|
| L02.03 | stredná | zoznam | kategória s 80 článkami nemá zúženie (filter, radenie, hľadanie v kategórii) |
| L03.02 | stredná | zoznam, detail, právne | 3× p.cat-uvod-popis – 76 znakov v typickom riadku (kat-strazna-funkcia @ 1440) |
| L03.04 | stredná | úvod | rad odkazov pod hľadaním (K2) nemá viditeľný nadpis, len aria-label |
| L05.03 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | ikony sietí v päte a ikony zdieľania pri článku sú bez slova (len aria-label) |
| L07.01 | vysoká | úvod, zoznam, detail, formulár | 81× #site-search – 257 × 32 CSS px (uvod @ 412) |
| L14.01 | stredná | úvod, zoznam, detail, formulár, právne, 404 | odstupy nemajú stupnicu: 132 rôznych hodnôt (docs/STYL.md – návrh, nezjednotené) |
| L15.01 | vysoká | detail | 84× div.only-desktop-1024:nth-of-type(1) > div:nth-of-type(2) >  – neklikateľný text má farbu odkazov rgb(143, 44, 34) (cl-titulok @ 1440) |
| L22.03 | vysoká | formulár | 1× label:nth-of-type(4) > input – type="checkbox" (registracia @ 1440) |
| L24.04 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | web je SPA – bez JavaScriptu sa obsah nevykreslí (prerender píše len hlavičku) |
| L26.01 | nízka | úvod, zoznam, detail, formulár, právne, 404 | v hlavnom menu nie je „Kontakt“ (posledná položka) |
| L29.01 | stredná | úvod, zoznam, detail, právne, 404 | 3× div.lkat-rad.lkat-rad--typy:nth-of-type(1) > a.lkat-dlazdica – po návšteve cieľa vyzerá odkaz rovnako (uvod @ 1440) |
| L30.02 | vysoká | úvod, detail | rozpísaný komentár a správa „Pridajte sa“ sa po obnovení stránky stratia |
| Z1.01 | vysoká | detail | 64× div.lart-topshare > div > div:nth-of-type(2) > div > a:nth-o – target="_blank" (cl-titulok @ 1440) |
| Z2.04 | stredná | zoznam | kategórie nad 12 článkov bez filtra a radenia |
| Z2.08 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | ikony sietí v päte a zdieľania pri článku bez slova |
| Z3.08 | kritická | úvod, detail, formulár | vyplnené polia (Pridajte sa, komentár, prihlásenie/registrácia) neprežijú obnovenie stránky |
| Z4.01 | stredná | úvod, zoznam, detail, formulár, právne, 404 | odstupy bez stupnice (132 hodnôt) – návrh v docs/STYL.md |
| Z5.03 | kritická | úvod, zoznam, detail | 75× div.lmap-watermark.pointer-events-none:nth-of-type(2) – 1.00 : 1 na najhoršom mieste pod textom (priemer okna 190×317 px, text nad obrázkom) (uvod @ 1440) |
| Z5.07 | nízka | úvod, zoznam, detail, formulár, právne, 404 | v menu nie je „Kontakt“ |
| Z5.09 | vysoká | detail, formulár | mazanie komentára / príspevku cez window.confirm s tlačidlami OK/Zrušiť, nie s presným textom akcie |
| Z6.02 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | 238× button.is-on:nth-of-type(1) – 2 px (uvod @ 412) |
| Z7.03 | stredná | úvod, zoznam, detail, formulár, právne, 404 | 234× span.lnav-mark:nth-of-type(1) > picture > img – bez width a height a bez aspect-ratio (uvod @ 1440) |
| Z8.01 | vysoká | zoznam, detail | 6× h1.cat-uvod-titul – nadpis 827 – 937 px, prvá obrazovka má 900 px (fotky 10 %, nadpis 5 %, text 1 %, ovládacie (kat-strazna-funkcia @ 1440) |
| Z9.05 | stredná | formulár | pravidlo hesla (aspoň 6 znakov) sa ukáže až ako chyba po odoslaní |
| Z10.02 | kritická | zoznam | 14× section.relative.overflow-hidden:nth-of-type(1) > div.contai – pri prefers-reduced-motion: reduce stále beží „“ (Animation) (kat-kniezacie-sidla @ 1440) |
| Z10.03 | vysoká | úvod, zoznam, detail, právne | 12× p.lhero-nadciara – 11 px (uvod @ 412) |
| Z10.05 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | bez JavaScriptu web nefunguje (SPA); odkazy sú odkazy, formuláre vyžadujú JS |
| KG.02 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | 6× div.lmap-node.pointer-events-none:nth-of-type(33) > button.l – prvá zastávka je „2“ (uvod @ 1440) |
| KG.05 | vysoká | úvod, zoznam, detail, formulár, právne, 404 | päta: chýba adresa a IČO (aj v ochrane údajov „sa dopĺňajú“), telefón |
| KT.01 | vysoká | úvod | úvod nemá vetu „čo to je a pre koho“; ciest je 9 dlaždíc + 5 odkazov namiesto 3 – 5 |
| KT.02 | stredná | zoznam | zoznam bez filtra pri vyše 12 položkách (inak nadpis, karty, „Zobraziť ďalšie“ áno) |
| KT.07 | vysoká | 404 | 404: vysvetlenie, hľadanie a sekcie áno, kontakt chýba |
| ZD.02 | vysoká | úvod | úvod na mobile: v prvej obrazovke nie je kontakt ako samostatný prvok |

## Všetky pravidlá (konečný stav)

S = splnené, X = nesplnené, N = neuplatňuje sa, ? = neviem posúdiť; M = merané nástrojom.

| pravidlo | záv. | M | úvod | zoznam | detail | formulár | právne | 404 |
|---|---|---|---|---|---|---|---|---|
| L01.01 | s |  | S | S | S | S | S | S |
| L01.02 | s |  | N | S | N | S | N | N |
| L01.03 | v |  | S | S | S | S | S | S |
| L01.04 | s |  | N | N | N | N | N | N |
| L01.05 | n |  | S | S | S | S | S | S |
| L02.01 | v |  | ? | S | S | S | N | S |
| L02.02 | s |  | N | N | N | N | N | N |
| L02.03 | s |  | N | X | N | N | N | N |
| L02.04 | s |  | N | N | N | N | N | N |
| L02.05 | s |  | S | S | S | S | S | S |
| L02.06 | s |  | S | S | S | S | S | S |
| L02.07 | n |  | ? | N | N | N | N | N |
| L02.08 | s |  | N | N | N | N | N | N |
| L03.01 | s |  | S | S | ? | S | S | S |
| L03.02 | s | M | S | X | X | N | X | N |
| L03.03 | s |  | N | N | N | N | N | N |
| L03.04 | s |  | X | S | S | S | S | S |
| L03.05 | n |  | S | S | S | S | S | S |
| L03.06 | s |  | N | N | N | N | N | N |
| L04.01 | v |  | S | S | S | S | S | S |
| L04.02 | k |  | S | S | S | S | S | S |
| L04.03 | k |  | N | N | N | N | N | N |
| L04.04 | s |  | S | S | S | S | S | S |
| L04.05 | s |  | S | S | S | S | S | S |
| L04.06 | k |  | S | S | S | S | S | S |
| L05.01 | s |  | ? | ? | ? | ? | ? | ? |
| L05.02 | s | M | S | S | ? | N | N | N |
| L05.03 | v |  | X | X | X | X | X | X |
| L05.04 | v |  | S | S | S | S | S | S |
| L05.05 | s |  | S | S | S | S | S | S |
| L05.06 | v | M | S | N | N | S | N | N |
| L05.07 | s |  | S | S | S | S | S | S |
| L05.08 | s |  | N | N | N | N | N | N |
| L05.09 | v | M | S | S | S | S | S | S |
| L05.10 | v | M | ? | S | S | S | ? | S |
| L05.11 | v |  | S | S | S | S | S | S |
| L05.12 | s |  | ? | ? | ? | ? | ? | ? |
| L06.01 | v |  | S | S | S | S | S | S |
| L06.02 | v |  | ? | ? | ? | ? | ? | ? |
| L06.03 | v | M | ? | ? | ? | ? | ? | ? |
| L06.04 | s |  | S | S | S | S | S | S |
| L06.05 | n |  | N | N | S | N | N | N |
| L06.06 | v |  | S | S | S | S | S | S |
| L06.07 | s | M | ? | ? | ? | ? | ? | ? |
| L07.01 | v | M | X | X | X | X | S | S |
| L07.02 | v | M | ? | ? | ? | ? | ? | ? |
| L07.03 | v |  | S | S | S | S | S | S |
| L07.04 | v |  | S | S | S | S | S | S |
| L07.05 | v | M | S | S | S | S | S | S |
| L07.06 | n |  | S | S | S | S | S | S |
| L07.07 | v |  | S | S | S | S | S | S |
| L07.08 | s | M | S | S | S | S | S | S |
| L07.09 | s |  | S | S | S | S | S | S |
| L07.10 | s | M | S | S | S | S | S | S |
| L08.01 | v | M | S | S | S | S | S | S |
| L08.02 | s |  | S | S | S | S | S | S |
| L08.03 | v |  | N | N | N | N | N | N |
| L08.04 | v |  | ? | ? | ? | ? | ? | ? |
| L08.05 | n |  | N | N | N | N | N | N |
| L08.06 | s |  | S | S | S | S | S | S |
| L08.07 | k |  | S | S | S | S | S | S |
| L09.01 | s |  | N | N | N | N | N | N |
| L09.02 | s |  | N | N | N | N | N | N |
| L09.03 | s |  | N | N | N | N | N | N |
| L09.04 | n |  | N | N | N | N | N | N |
| L09.05 | s |  | S | N | N | ? | N | N |
| L09.06 | v |  | N | N | N | N | N | N |
| L10.01 | s |  | S | S | S | S | S | S |
| L10.02 | s |  | N | N | N | N | N | N |
| L10.03 | s |  | ? | N | N | N | N | N |
| L10.04 | v |  | N | N | N | N | N | N |
| L10.05 | n |  | N | N | N | N | N | N |
| L10.06 | s |  | N | N | N | N | N | N |
| L11.01 | v |  | S | S | S | S | S | S |
| L11.02 | s |  | S | S | S | S | S | S |
| L11.03 | v |  | S | S | S | S | S | S |
| L11.04 | s |  | N | N | N | N | N | N |
| L12.01 | n |  | S | S | S | S | S | S |
| L12.02 | s |  | S | S | S | S | S | S |
| L12.03 | s |  | S | S | S | S | S | S |
| L12.04 | n |  | S | S | S | S | S | S |
| L12.05 | s |  | S | S | S | S | S | S |
| L12.06 | n |  | N | N | N | N | N | N |
| L12.07 | n |  | S | S | S | S | S | S |
| L12.08 | s |  | S | S | S | S | S | S |
| L12.09 | v | M | ? | S | ? | S | ? | S |
| L13.01 | n |  | S | S | S | S | S | S |
| L13.02 | n |  | S | S | S | S | S | S |
| L13.03 | n |  | S | S | S | S | S | S |
| L13.04 | n |  | S | S | S | S | S | S |
| L13.05 | n |  | S | S | S | S | S | S |
| L13.06 | n |  | N | N | N | N | N | N |
| L13.07 | v | M | ? | S | ? | S | ? | S |
| L14.01 | s |  | X | X | X | X | X | X |
| L14.02 | s |  | ? | ? | ? | ? | ? | ? |
| L14.03 | s |  | ? | N | N | ? | N | N |
| L14.04 | v |  | S | S | S | S | S | S |
| L14.05 | n |  | S | S | S | S | S | S |
| L14.06 | s |  | S | S | S | S | S | S |
| L14.07 | n |  | S | S | S | S | S | S |
| L14.08 | n |  | S | S | S | S | S | S |
| L15.01 | v | M | S | S | X | S | S | S |
| L15.02 | v |  | S | S | S | S | S | S |
| L15.03 | s |  | S | S | S | S | S | S |
| L15.04 | s |  | ? | ? | ? | ? | ? | ? |
| L15.05 | v |  | S | S | S | S | S | S |
| L15.06 | s |  | ? | ? | ? | ? | ? | ? |
| L15.07 | s |  | ? | S | S | S | S | S |
| L15.08 | v |  | S | S | S | S | ? | S |
| L16.01 | n |  | N | N | S | N | N | N |
| L16.02 | s |  | N | N | N | N | N | N |
| L16.03 | n |  | S | N | S | N | N | N |
| L16.04 | n |  | S | N | S | N | N | N |
| L16.05 | n |  | S | S | S | S | S | S |
| L17.01 | v |  | S | S | S | S | S | S |
| L17.02 | s | M | S | N | S | N | N | N |
| L17.03 | v |  | S | S | ? | S | S | S |
| L17.04 | k |  | N | N | N | N | N | N |
| L17.05 | s |  | N | N | N | N | N | N |
| L17.06 | s |  | ? | ? | ? | ? | ? | ? |
| L17.07 | s |  | S | S | S | S | S | S |
| L17.08 | s |  | ? | ? | ? | ? | ? | ? |
| L17.09 | s |  | S | S | S | S | S | S |
| L18.01 | v |  | S | S | S | S | S | S |
| L18.02 | s |  | N | N | N | N | N | N |
| L18.03 | s |  | N | N | ? | N | N | N |
| L18.04 | n |  | S | S | S | S | S | S |
| L18.05 | s |  | N | N | N | N | N | N |
| L19.01 | s |  | S | S | S | S | S | S |
| L19.02 | s |  | S | S | S | S | S | S |
| L19.03 | s |  | ? | ? | ? | ? | ? | ? |
| L19.04 | s |  | ? | ? | ? | ? | ? | ? |
| L19.05 | n |  | S | S | S | S | S | S |
| L19.06 | k |  | S | S | S | S | S | S |
| L19.07 | s |  | ? | ? | ? | ? | ? | ? |
| L20.01 | v | M | S | S | S | S | S | S |
| L20.02 | s |  | S | S | S | S | S | S |
| L20.03 | s |  | N | N | N | N | N | N |
| L20.04 | v |  | S | S | S | S | S | S |
| L20.05 | n |  | N | N | N | N | N | N |
| L21.01 | v |  | ? | ? | ? | ? | ? | ? |
| L21.02 | s |  | N | N | N | N | N | N |
| L21.03 | s |  | S | S | S | S | S | S |
| L21.04 | s |  | S | S | S | S | S | S |
| L21.05 | k |  | S | S | S | S | S | S |
| L22.01 | s |  | N | N | N | N | N | N |
| L22.02 | v |  | S | N | N | S | N | N |
| L22.03 | v | M | S | N | N | X | N | N |
| L22.04 | s |  | N | N | N | N | N | N |
| L22.05 | n |  | N | N | N | N | N | N |
| L23.01 | v |  | S | N | N | ? | N | N |
| L23.02 | n |  | N | N | N | N | N | N |
| L23.03 | v |  | S | S | S | S | S | S |
| L23.04 | v |  | N | N | N | N | N | S |
| L23.05 | k |  | S | N | N | ? | N | N |
| L23.06 | v |  | S | S | S | S | S | S |
| L23.07 | s |  | S | S | S | S | S | S |
| L23.08 | s |  | N | N | N | N | N | N |
| L23.09 | s |  | N | N | N | N | N | N |
| L23.10 | n |  | N | N | N | N | N | N |
| L24.01 | v |  | N | N | N | N | N | N |
| L24.02 | k |  | N | N | N | ? | N | N |
| L24.03 | v |  | S | N | N | ? | N | N |
| L24.04 | v |  | X | X | X | X | X | X |
| L24.05 | s |  | S | S | S | S | S | S |
| L24.06 | k | M | S | S | ? | ? | ? | ? |
| L24.07 | v |  | N | N | N | N | N | N |
| L24.08 | s |  | N | N | N | N | N | N |
| L24.09 | s |  | N | N | N | N | N | N |
| L24.10 | s |  | N | N | N | N | N | N |
| L25.01 | v |  | S | S | S | S | S | S |
| L25.02 | v |  | S | S | S | S | S | S |
| L25.03 | s |  | N | N | N | N | N | N |
| L25.04 | v |  | S | S | S | S | S | S |
| L25.05 | v |  | ? | N | N | ? | N | N |
| L25.06 | v | M | S | S | S | S | S | S |
| L25.07 | s | M | S | S | ? | N | N | N |
| L25.08 | v |  | N | N | N | N | N | N |
| L26.01 | n |  | X | X | X | X | X | X |
| L26.02 | n |  | N | N | N | N | N | N |
| L26.03 | s |  | S | S | S | S | S | S |
| L26.04 | s |  | S | S | S | S | S | S |
| L26.05 | s |  | S | S | S | S | S | S |
| L27.01 | s |  | S | S | S | S | S | S |
| L27.02 | s | M | S | N | N | S | N | N |
| L27.03 | s |  | S | S | S | S | S | S |
| L27.04 | s |  | N | N | N | N | N | N |
| L27.05 | s |  | N | N | N | N | N | N |
| L27.06 | n |  | N | N | N | N | N | N |
| L27.07 | v |  | S | S | S | S | S | S |
| L27.08 | v |  | N | N | N | N | N | N |
| L27.09 | k |  | N | N | N | N | N | N |
| L27.10 | s |  | S | S | S | S | S | S |
| L27.11 | v |  | S | S | S | S | S | S |
| L27.12 | v |  | S | S | S | S | S | S |
| L27.13 | s |  | N | N | N | N | N | N |
| L28.01 | v |  | ? | ? | ? | ? | ? | ? |
| L28.02 | k |  | ? | ? | ? | ? | ? | ? |
| L28.03 | k | M | ? | S | ? | S | ? | S |
| L28.04 | v | M | S | S | ? | N | N | N |
| L28.05 | v |  | S | S | S | S | S | S |
| L28.06 | n |  | S | S | S | S | S | S |
| L29.01 | s | M | X | X | X | N | X | X |
| L29.02 | v |  | N | N | N | N | N | N |
| L29.03 | s |  | N | N | N | N | N | N |
| L29.04 | s |  | S | S | S | S | S | S |
| L29.05 | s | M | S | N | S | S | N | N |
| L29.06 | s |  | S | S | S | S | S | S |
| L29.07 | s |  | N | N | N | N | N | N |
| L29.08 | n |  | N | N | N | N | N | N |
| L29.09 | v |  | N | N | N | N | N | N |
| L29.10 | v |  | N | N | N | N | N | N |
| L30.01 | s |  | S | S | S | S | S | S |
| L30.02 | v |  | X | N | X | N | N | N |
| L30.03 | n |  | N | N | N | N | N | N |
| L30.04 | n |  | N | N | N | N | N | N |
| L30.05 | k |  | S | S | S | S | S | S |
| Z1.01 | v | M | S | S | X | S | S | S |
| Z1.02 | v |  | S | S | S | S | S | S |
| Z1.03 | s |  | S | S | S | S | S | S |
| Z1.04 | v |  | S | S | S | S | S | S |
| Z1.05 | s | M | S | N | S | N | N | N |
| Z1.06 | v |  | ? | ? | ? | ? | ? | ? |
| Z2.01 | s |  | ? | ? | ? | ? | ? | ? |
| Z2.02 | v |  | ? | ? | ? | ? | ? | ? |
| Z2.03 | s |  | N | N | N | N | N | N |
| Z2.04 | s |  | N | X | N | N | N | N |
| Z2.05 | s |  | S | S | S | S | S | S |
| Z2.06 | v |  | S | S | S | S | S | S |
| Z2.07 | s |  | N | N | N | N | N | N |
| Z2.08 | v |  | X | X | X | X | X | X |
| Z2.09 | s | M | S | S | ? | N | N | N |
| Z2.10 | s |  | ? | ? | ? | ? | ? | ? |
| Z3.01 | v |  | S | N | N | S | N | N |
| Z3.02 | v | M | S | N | N | ? | N | N |
| Z3.03 | v |  | N | N | N | N | N | N |
| Z3.04 | k |  | N | N | N | ? | N | N |
| Z3.05 | s |  | N | N | N | N | N | N |
| Z3.06 | v |  | N | N | N | N | N | N |
| Z3.07 | s |  | N | N | N | N | N | N |
| Z3.08 | k |  | X | N | X | X | N | N |
| Z3.09 | v | M | S | S | S | S | S | S |
| Z3.10 | k | M | S | N | S | S | N | N |
| Z3.11 | s |  | S | S | S | S | S | S |
| Z3.12 | s |  | N | N | N | N | N | N |
| Z3.13 | v |  | S | S | S | S | S | S |
| Z3.14 | v |  | N | N | N | N | N | N |
| Z3.15 | k |  | N | N | N | N | N | N |
| Z3.16 | s |  | N | N | N | N | N | N |
| Z3.17 | v |  | S | S | S | S | S | S |
| Z3.18 | v |  | S | S | S | S | S | S |
| Z3.19 | v |  | N | N | N | N | N | N |
| Z4.01 | s |  | X | X | X | X | X | X |
| Z4.02 | s |  | ? | ? | ? | ? | ? | ? |
| Z4.03 | s |  | ? | N | N | ? | N | N |
| Z4.04 | n |  | S | S | S | S | S | S |
| Z4.05 | s |  | S | S | S | S | S | S |
| Z4.06 | s |  | S | S | S | S | S | S |
| Z4.07 | s |  | S | S | S | S | S | S |
| Z4.08 | v | M | S | S | S | S | S | S |
| Z4.09 | s |  | ? | ? | ? | ? | ? | ? |
| Z4.10 | n |  | S | S | S | S | S | S |
| Z4.11 | s | M | S | S | S | N | S | N |
| Z4.12 | n |  | N | N | S | N | N | N |
| Z4.13 | s |  | S | S | S | S | S | S |
| Z4.14 | v | M | ? | S | ? | S | ? | S |
| Z4.15 | n |  | S | S | S | S | S | S |
| Z5.01 | v |  | ? | ? | ? | ? | ? | ? |
| Z5.02 | k |  | ? | ? | ? | ? | ? | ? |
| Z5.03 | k | M | X | X | X | ? | ? | ? |
| Z5.04 | v | M | ? | S | ? | S | ? | S |
| Z5.05 | n |  | S | S | S | S | S | S |
| Z5.06 | v |  | S | S | S | S | S | S |
| Z5.07 | n |  | X | X | X | X | X | X |
| Z5.08 | v |  | S | S | S | S | S | S |
| Z5.09 | v |  | N | N | X | X | N | N |
| Z6.01 | v | M | S | S | S | S | S | S |
| Z6.02 | v | M | X | X | X | X | X | X |
| Z6.03 | s | M | S | N | S | S | N | N |
| Z6.04 | v |  | S | S | S | S | S | S |
| Z6.05 | v |  | S | S | S | S | S | S |
| Z6.06 | v | M | S | S | S | S | S | S |
| Z6.07 | v |  | S | S | S | S | S | S |
| Z6.08 | s |  | S | S | S | S | S | S |
| Z7.01 | v |  | ? | ? | ? | ? | ? | ? |
| Z7.02 | v | M | ? | ? | ? | ? | ? | ? |
| Z7.03 | s | M | X | X | X | X | X | X |
| Z7.04 | s |  | S | S | S | S | S | S |
| Z7.05 | n |  | N | N | S | N | N | N |
| Z7.06 | s |  | S | S | S | S | S | S |
| Z7.07 | v | M | S | S | S | S | S | S |
| Z7.08 | s |  | S | S | S | S | S | S |
| Z7.09 | v |  | S | S | S | S | S | S |
| Z7.10 | s |  | S | S | S | S | S | S |
| Z8.01 | v | M | S | X | X | S | S | S |
| Z8.02 | s |  | S | S | S | S | S | S |
| Z8.03 | n |  | ? | ? | ? | ? | ? | ? |
| Z8.04 | n |  | S | S | S | S | S | S |
| Z8.05 | s |  | N | N | N | N | N | N |
| Z9.01 | s |  | N | N | N | N | N | N |
| Z9.02 | s |  | N | N | N | N | N | N |
| Z9.03 | v |  | S | N | N | ? | N | N |
| Z9.04 | v |  | N | N | N | N | N | S |
| Z9.05 | s |  | N | N | N | X | N | N |
| Z9.06 | s |  | S | S | S | S | S | S |
| Z9.07 | v |  | S | S | S | S | S | S |
| Z9.08 | n |  | N | N | N | N | N | N |
| Z9.09 | s |  | N | N | N | N | N | N |
| Z9.10 | s |  | N | N | N | N | N | N |
| Z10.01 | k | M | S | S | S | S | S | S |
| Z10.02 | k | M | S | X | ? | N | N | N |
| Z10.03 | v | M | X | X | X | S | X | S |
| Z10.04 | s |  | S | S | S | S | S | S |
| Z10.05 | v |  | X | X | X | X | X | X |
| Z10.06 | v |  | S | S | S | S | S | S |
| Z10.07 | s |  | S | S | S | S | S | S |
| Z10.08 | s |  | S | S | S | S | S | S |
| Z10.09 | s |  | ? | ? | ? | ? | ? | ? |
| Z10.10 | s |  | ? | ? | ? | ? | ? | ? |
| ZP.01 | v |  | ? | ? | ? | ? | ? | ? |
| ZP.02 | s |  | S | S | S | S | S | S |
| ZP.03 | s |  | N | N | N | N | N | N |
| ZP.04 | s |  | S | S | S | S | S | S |
| ZP.05 | k |  | S | S | S | S | S | S |
| ZE.01 | k |  | S | S | S | S | S | S |
| ZE.02 | k |  | S | S | S | S | S | S |
| ZE.03 | v |  | S | S | S | S | S | S |
| ZE.04 | k |  | S | S | S | S | S | S |
| ZE.05 | s |  | S | S | S | S | S | S |
| KG.01 | v | M | S | S | S | S | S | S |
| KG.02 | v | M | X | X | X | X | X | X |
| KG.03 | v | M | S | N | S | N | N | N |
| KG.04 | v | M | S | S | S | S | S | S |
| KG.05 | v |  | X | X | X | X | X | X |
| KG.06 | k | M | S | S | S | S | S | S |
| KT.01 | v |  | X | N | N | N | N | N |
| KT.02 | s |  | N | X | N | N | N | N |
| KT.03 | s | M | S | S | S | S | S | S |
| KT.04 | v | M | S | N | S | S | N | N |
| KT.05 | v | M | S | N | S | S | N | N |
| KT.06 | v |  | N | N | N | N | N | N |
| KT.07 | v |  | N | N | N | N | N | X |
| KT.08 | v |  | N | N | N | N | S | N |
| KS.01 | v | M | ? | ? | ? | ? | ? | ? |
| KS.02 | s |  | N | S | S | N | N | N |
| KS.03 | s |  | ? | N | N | ? | N | N |
| PP.01 | s |  | N | N | N | N | N | N |
| PP.02 | s |  | N | N | N | N | N | N |
| PP.03 | s |  | N | N | N | N | N | N |
| PP.04 | v |  | S | S | S | S | S | S |
| ZD.01 | v | M | S | S | S | S | S | S |
| ZD.02 | v |  | X | N | N | N | N | N |
| ZD.03 | v |  | S | S | S | S | S | S |
| ZD.04 | v |  | S | S | S | S | S | S |
| ZD.05 | v |  | S | S | S | S | S | S |
| ZD.06 | v |  | S | S | S | S | S | S |
| ZD.07 | v |  | S | S | S | S | S | S |
| ZD.08 | n |  | ? | ? | ? | ? | ? | ? |
| ZD.09 | v |  | ? | ? | ? | ? | ? | ? |
| ZD.10 | k |  | S | S | S | S | S | S |
