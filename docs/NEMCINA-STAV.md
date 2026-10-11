# Nemecká verzia webu — stav a postup

Merané **12. 10. 2026** proti živej produkcii (`webdesignforhradiskask.vercel.app`,
`188.245.47.29`). Čísla sú z odpovedí servera a z meraní Playwrightom, nie odhady.

Nadväzuje na [ANGLICTINA-STAV.md](ANGLICTINA-STAV.md): nemčina je tretí jazyk
a šla rovnakou cestou ako angličtina, len poučenou — čo sa pri angličtine
ukázalo ako pasca, bolo tu ošetrené vopred.

---

## 1. Čo je hotové

**Preložené články: 364 / 364**, všetky publikované. Overené kontrolou, ktorá
číta verejné API: `overených 364 nemeckých článkov · s nálezom 0`.

**Rozhranie je po nemecky celé** — 591 reťazcov v `src/lib/slovnik-de.ts`,
oslovenie v tvare *Sie*. Dátumy idú v `de-DE`, `lang` dokumentu aj tela článku
sa prepína, zásady ochrany údajov a podmienky používania majú vlastné nemecké
znenie s terminológiou DSGVO.

**Nemčina je verejná.** `VEREJNE_JAZYKY = ['sk', 'en', 'de']` v
`src/lib/jazyk.ts`; prepínač v hlavičke cyklí jedným klepnutím
sk → en → de → sk a na stránke článku vedie na jeho vlastnú adresu v cieľovom
jazyku.

| časť | kde | ako |
|---|---|---|
| prekladová vrstva | `src/lib/jazyk.ts`, `src/lib/slovnik-de.ts` | kľúč je **slovenský originál**, takže slovenská vetva ostáva čitateľná v komponente |
| adresa | `src/App.tsx` → `rozdelAdresu()` | `/de/...` zapína nemčinu, `odkaz()` drží odkazy v jazyku stránky |
| obsah článku | Strapi i18n | `?locale=de`, prepínač v článku, `hreflang` v prerenderovanej hlavičke |
| hľadanie a odporúčanie | `/api/search-index?locale=de` | index je per jazyk — nemecká stránka neodporúča slovenské články |

V sitemape je 1103 adries, z toho 364 nemeckých; prerender vyrobil 11
statických + 364 slovenských + 728 cudzojazyčných hlavičiek (en 364, de 364).
Každá nemecká stránka má `hreflang sk/en/de/x-default`, `og:locale=de_DE`
a vlastný kanonický odkaz.

---

## 2. Ako preklad bežal

Agent `prekladatel-hradiska-de` (definícia v `~/.claude/agents/`) dostával
dávky po 6 – 10 článkov; naraz ich bežalo osem až jedenásť. Agent
**nezapisuje do databázy** — píše vstupný súbor do
`hradiska-strapi/scripts/preklad/preklady-de/<slovenský slug>.json` a zápis
robí nadriadený dávkovo:

```
node scripts/preklad/zjednot-cisla-de.mjs --zapis        # zrovná zápis čísel
python  …/limity-de.py <slug…>                           # dĺžkové limity schémy
scp …/preklady-de/<slug>.json root@188.245.47.29:/opt/hradiska/scripts/preklad/preklady-de/
ssh … 'cd /opt/hradiska && node scripts/preklad/zapis-davku.cjs --jazyk=de --zapis'
node scripts/kontrola/nemcina-kontrola.mjs               # jazyková kontrola
```

`zapis-davku.cjs` pri každom článku overí počet a typy blokov, obrázky,
bibliografiu, popisy fotiek — a že slovenská verzia ostala nedotknutá.
Opravený článok sa prepíše s `--znova --len=<slug>`.

---

## 3. Čo z kódu nie je zjavné

**Slovník rozhoduje, nie prekladateľ.** `hradiska-strapi/docs/TERMINOLOGIA-DE.md`
má 650 riadkov tabuliek rozhodnutí. Niekoľko z nich vzniklo až keď dvaja
prekladatelia napísali to isté dvojako; tie sú označené slovom „rozhodnuté":

| vec | rozhodnutie | prečo |
|---|---|---|
| akropola | **die Hauptburg** aj v praveku | *Akropolis* ostáva antike; jeden web, jeden termín |
| praveké podhradie | **die Siedlung unterhalb der Burg** | *Suburbium* je stredoveké, *Vorburg* by tvrdilo, že to bola časť opevnenia |
| rondel | **die Kreisgrabenanlage** | *Rondell* malo len jeden starší článok |
| zemnica | **das Grubenhaus** | tvar *Grubenhütte* mal jeden článok proti dvadsiatim štyrom |
| sekeromlat | **die Hammeraxt** | |
| oravská skupina | **die Orava-Gruppe** | skupina sa menuje podľa lokality v domácom tvare (ako *Púchov-Kultur*); *Arwa* ostáva krajine a hradu |

**Kontrola má menovité výnimky, nie vypnuté pravidlá.**
`scripts/kontrola/nemcina-kontrola.mjs` hľadá slovenčinu a angličtinu
v nemeckom texte, zakázané termíny a anglický zápis čísel. Šesť článkov má
v `VYNIMKY` zapísaný jeden konkrétny nález, ktorý je pri nich planý — dobový
citát (Janšák písal o „akropole", tabuľa v Traismauer o „slowakischen Fürsten
Pribina"), anglický názov citovanej knihy, a skutoční Slovinci tam, kde
pravidlo čaká Slovanov.

**Čísla.** Nemčina delí tisíce bodkou až od piatich cifier (`35.000`, ale
`2000 Jahre`) — chráni to aj letopočty pred `1.663`. Zarovnáva to
`zjednot-cisla-de.mjs`. Dekády môžu byť `1950er Jahre` aj `fünfziger Jahre`;
musí byť len jasné storočie.

**Dĺžkové limity sa overujú PRED zápisom.** Nemecká veta je dlhšia než
slovenská, takže popis fotky (500) alebo `alt` (255) vedia limit prekročiť —
a Strapi potom vráti len „2 errors occurred" bez toho, kde to je. Jeden článok
na tom padol (popis 531 znakov) a text sa musel zhutniť.

**Čo sa neopravovalo.** `hradiska-strapi/docs/NEZROVNALOSTI-SK.md` má 263
záznamov, z toho asi 96 pribudlo pri nemčine — protichodné čísla, nedokončené
vety, zlé datovania, dve priezviská pre tých istých ľudí. **Ani jedno nebolo
v preklade opravené**; rozhoduje o nich autor.

---

## 4. Dve miesta, ktoré počítali s dvoma jazykmi

Obe vyšli najavo až pri zverejnení nemčiny a sú opravené v
`src/design-lab/LabArticle.tsx`. Pri pridávaní štvrtého jazyka tam pozrieť
prvé:

1. **Záchrana pre adresu so slovenským slugom** mala predponu napísanú
   natvrdo (`/en/blog/...`), takže `/de/blog/molpir` presmerovala na
   `/en/blog/<nemecký slug>` — dvojicu, ktorá neexistuje ani v jednom jazyku.
   Predponu teraz skladá `odkaz()` z aktuálneho jazyka.
2. **Stránka článku ohlasovala prepínaču JEDNU „druhú" adresu**, vybranú cez
   `find(locale !== aktuálny)`. Pri troch jazykoch to bola lotéria podľa
   poradia z API — prepínač do nemčiny mohol dostať anglickú adresu. Ohlasuje
   sa celá mapa jazyk → adresa (`nastavInojazycneOdkazy`), ktorú `jazyk.ts`
   už podporoval.

---

## 5. Overovacie príkazy

```bash
# koľko článkov má nemeckú verziu (verejné API, teda publikované)
curl -s 'http://188.245.47.29/api/blog-posts?locale=de&pagination[pageSize]=1' \
  | python -c "import sys,json; print(json.load(sys.stdin)['meta']['pagination']['total'])"

# jazyková kontrola všetkých nemeckých článkov
node hradiska-strapi/scripts/kontrola/nemcina-kontrola.mjs          # len nálezy
node hradiska-strapi/scripts/kontrola/nemcina-kontrola.mjs --vsetko # aj čisté

# ktoré hotové súbory ešte nie sú v databáze (porovnáva sa cez slovenský documentId)
node …/scratchpad/_status-de.mjs
```

Pozor: **Strapi orezáva `pagination[pageSize]` na 100** — každý hromadný
skript musí stránkovať, inak pokryje len prvú stovku.
