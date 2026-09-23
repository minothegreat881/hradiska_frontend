# Administrácia hradiska.sk — podklad pre vizuálnu prerobku

## O čo ide

Hradiská.sk je encyklopédia slovanských hradísk (364 článkov, 28 592 obrázkov).
Obsah beží na Strapi 5, web je React + Vite. **Administrácia je vlastná**, nie
Strapi panel — píše do Strapi cez API. Používa ju **jeden netechnický správca**,
autor obsahu. Všetko je po slovensky a tak to musí ostať.

Vizuál webu je „papierový": teplá béžová, hnedo-jantárové akcenty, historické
pätkové písma. Administrácia to jemne kopíruje, ale je strohejšia a používa Inter.

## Rám aplikácie

- **Bočná lišta 232 px**, tmavý zvislý prechod, logo + „ADMINISTRÁCIA",
  tri skupiny odkazov s ikonami a číselnými odznakmi (reálne počty z API):
  - **Obsah** — Články, Editor, Médiá
  - **Organizácia** — Kategórie, Štítky, Komentáre, Používatelia
  - **Prehľady** — Analytika
  - dole meno prihláseného (klik = Môj profil) a odhlásenie
- **Horná lišta** (prilepená): omrvinky „Admin / …", vpravo hľadanie s ⌘K
  a odkaz „Zobraziť web"
- **Obsah** na béžovom podklade, karty sú svetlejšie

## Obrazovky a ich stav

| Obrazovka | Stav |
|---|---|
| Články — zoznam, hľadanie, filtre, mazanie | funguje |
| **Editor článku** | prerobený na vizuálny (viď nižšie) |
| Médiá — mriežka, nahrávanie, mazanie (48 na stránku) | funguje |
| Komentáre — stavy Čaká/Viditeľný/Skrytý/Spam, odpoveď, varovanie | funguje |
| Používatelia — blokovanie, mazanie | funguje |
| Môj profil — e-mail, heslo | funguje |
| **Analytika** | **čísla sú vymyslené, natvrdo v kóde** (`admin/data.ts`) |
| **Kategórie, Štítky** | **iba zástupný text, obrazovky neexistujú** |
| Hľadanie ⌘K | okno sa otvorí, pole nič nerobí |

## Editor článku (čerstvo prerobený)

Vizuálny editor: v strede je **plátno** — článok vykreslený presne tak, ako
vyzerá na webe (rovnaký renderer, vlastné okno, mierka podľa priestoru).
Klikne sa do textu a píše sa priamo v stránke; obrázok sa ťahá myšou na pozíciu
a zväčšuje za roh. Bloky sa presúvajú za úchyt, medzi nimi je „+" na vloženie.

Vpravo je **panel s údajmi článku, 330 px**, prilepený, so zbaliteľnými sekciami:
Publikovanie, Titulná fotografia, Zaradenie, SEO, Lokalita na mape, Kľúčové
fakty, Časová os. Dá sa skryť, vtedy je plátno takmer v skutočnej veľkosti.

## Čo najviac bolí (prosím riešiť ako prvé)

**1. Kľúčové fakty a časová os sa nedajú normálne vyplniť.** Každá položka je
jeden stlačený riadok v paneli širokom 330 px:

- fakt = úchyt + rozbaľovacie menu ikony (92 px) + pole „Popis" + pole „Hodnota" + krížik
  → na dve textové polia zostáva po ~70 px, text sa nezmestí ani z polovice
- udalosť = úchyt + rok (68 px) + „Udalosť" + typ (104 px) + krížik
  → pole na popis udalosti v rozhraní **vôbec nie je**, hoci schéma ho má

Tieto dva zoznamy sú pritom obsahovo dôležité — zobrazujú sa v pobočnom stĺpci
článku. Potrebujú viac priestoru: napríklad karta na položku s poľami pod sebou,
alebo úprava v širšom okne, alebo presun z úzkeho panela inam.

**2. Panel je celkovo úzky** — sedem sekcií v 330 px, veľa zbaľovania a hľadania.

**3. Analytika je atrapa.** Buď ju napojiť na reálne dáta, alebo navrhnúť poctivý
prázdny stav, nech nikoho nemýlia vymyslené čísla.

**4. Kategórie a Štítky** treba navrhnúť od nuly (kategórií je 14, štítky voľné).

## Technické mantinely

- **Nie je Tailwind build.** `src/index.css` je predgenerovaný výstup Tailwindu
  uložený v repozitári; nové utility triedy nevzniknú. Štýly písať ako bežné CSS
  pod prefix `.admin` v `src/styles/globals.css`, alebo inline.
- Farby cez premenné `--ad-*`: `--ad-app` #f4efe3 (podklad), `--ad-card` #fdfbf4,
  `--ad-surface` #faf5e8, `--ad-text`, `--ad-secondary`, `--ad-muted`,
  `--ad-amber-mid/-deep` (akcent), `--ad-danger`, `--ad-line`, `--ad-field-border`,
  a `--ad-side-*` pre bočnú lištu.
- Hotové triedy, ktoré sa oplatí zachovať: `.acard`, `.abtn`, `.abtn-primary`,
  `.abtn-danger`, `.abtn-icon`, `.afld` (pole), `.achip`, `.apanel`, `.ad-seg`
  (prepínač), `.ad-nav`, `.ad-badge`.
- Ikony **lucide-react**, písmo **Inter**, React 18.
- Administrácia sa načítava lazy (~569 kB), verejný web ju nesťahuje — na jej
  veľkosti až tak nezáleží, na prehľadnosti áno.
- V `globals.css` je pravidlo „NUCLEAR OPTION", ktoré vynucuje
  `pointer-events: auto !important` na každý `div`. Ak má niečo prepúšťať
  kliknutia, potrebuje triedu `pointer-events-none`.

## Čo od dizajnu chceme

Moderné, prehľadné, pokojné. Menej stlačených riadkov, viac dýchania. Formuláre,
do ktorých sa dá naozaj písať. Jasná hierarchia medzi „obsah článku" (plátno)
a „údaje o článku" (panel). Zachovať papierovú paletu webu, aby administrácia
a web vyzerali ako jedna vec.
