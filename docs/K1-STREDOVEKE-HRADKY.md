# K1 – kategória „Stredoveké hrádky“: postup založenia

Web je na novú kategóriu pripravený. Rad dlaždíc počíta stĺpce podľa počtu dlaždíc, takže 7 typov sa zmestí do jedného radu.
Hlavička má pri 1440 px „Ďalšie“, preto sa rad neoreže. Chýba len samotná kategória v databáze a jej vzhľad.
Všetko sa robí v administrácii webu (`/admin`), bez programátora. V Strapi som nič nezaložil.

Návrhy textov nižšie sú podľa záväzných slovníkov (`TERMINOLOGIA-EN.md`, `TERMINOLOGIA-DE.md`: hrádok = *small fort*,
stredoveký hrádok = *die kleine Burg*). Peter ich môže zmeniť.

## 1. Založenie kategórie (administrácia → Kategórie)

1. **Kategórie** v ľavom menu → tlačidlo **Nová kategória**.
2. Polia:

   | pole | hodnota |
   |---|---|
   | Názov | `Stredoveké hrádky` |
   | Adresa | `stredoveke-hradky` (vyplní sa sama z názvu; skontrolovať, že je presne takto – po zverejnení ju už nemeniť, viedli by na ňu odkazy) |
   | Popis | 1 – 3 vety úvodu na stránke kategórie (napíše Peter; bez neho stránka ukáže len nadpis a zoznam) |

3. **Uložiť.** Ukladá sa hneď do databázy, koncept tu nie je.
4. **Poradie:** v zozname kategórií potiahnuť „Stredoveké hrádky“ za posledný typ hradísk („Staroveké sídla“), pred „Všeobecne o hradiskách“.
   Poradie z tohto zoznamu platí pre menu (päta má vlastné odkazy, krok 4.4).

## 2. Priradenie článkov (administrácia → Články)

- Článok má v databáze **práve jednu** kategóriu. Presunom do „Stredovekých hrádkov“ zmizne z doterajšej kategórie
  (napr. zo „Strážnej funkcie“). Zoznam článkov, ktoré sa presunú, určuje Peter.
- **Postup pri každom článku:**
  1. Články → filter kategórie, alebo hľadanie podľa názvu;
  2. otvoriť článok;
  3. pole **Kategória** → „Stredoveké hrádky“;
  4. **Publikovať**.
- **Anglická a nemecká verzia:** Strapi ukladá kategóriu pre každý jazyk článku zvlášť. Po presune treba otvoriť
  `/en/category/stredoveke-hradky` a `/de/category/stredoveke-hradky`. Ak tam článok chýba, zmeniť kategóriu aj
  v anglickej a nemeckej verzii článku. Editor článkov na webe upravuje slovenskú verziu, preto to treba urobiť
  v paneli Strapi: Content Manager → Blog Post → článok → prepínač jazyka EN, potom DE → pole category → Save → Publish.
- Kým kategória nemá ani jeden článok, dlaždica ukáže „0“. Preto články priradiť **pred** krokom 4.

## 3. Čo sa po založení objaví samo

Bez ďalšieho kliknutia, hneď po uložení (web číta kategórie z databázy):

- stránka `/category/stredoveke-hradky` (aj `/en/…` a `/de/…`): nadpis = Názov, úvod = Popis, zoznam článkov;
- hlavička a mobilné menu: kategória v druhom riadku „Ďalší obsah“ (nie medzi typmi hradísk – to je krok 4);
- poradie podľa zoznamu kategórií;
- hľadanie nájde jej články (register hľadania sa po zmene článku obnoví sám, v prehliadači do 5 minút).

**Až po ďalšom nasadení webu** (Vercel zostaví web znova): mapa stránok (`sitemap.xml`), predvyplnený titulok,
popis a canonical pre vyhľadávače. Bez nasadenia stránka funguje, len ju vyhľadávač spozná neskôr.

**Neobjaví sa samo:** dlaždica na domovskej, obrázok, krátky názov v menu, tvary počtu, anglický a nemecký názov
(v EN a DE sa dovtedy ukáže slovenský názov), odkaz v päte.

## 4. Editor vzhľadu (administrácia → Vzhľad webu)

Otvoriť: Kategórie → riadok „Stredoveké hrádky“ → **Vzhľad**, alebo Vzhľad webu → stránka kategórie.

1. **Stránka kategórie „Stredoveké hrádky“** (pravý panel):

   | pole | SK | EN | DE |
   |---|---|---|---|
   | Názov | Stredoveké hrádky | Medieval small forts | Mittelalterliche kleine Burgen |
   | Krátky názov v menu | Hrádky | Small forts | Kleine Burgen |
   | Popisok dlaždice | Stredoveké hrádky | Medieval small forts | Mittelalterliche kleine Burgen |
   | Tvary počtu | hrádok · hrádky · hrádkov | small forts | kleine Burgen |
   | Popis (nepovinné) | prevezme sa z kroku 1 | preklad | preklad |

   **Obrázok:** vybrať z knižnice médií. V knižnici zatiaľ nie je kresba hrádku, Peter ju dodá. Tvar 3 : 2,
   aspoň 1200 × 800 px, kresba v štýle ostatných dlaždíc (sépia, bez textu v obrázku). Bez obrázka ostane dlaždica prázdna.
2. **Domovská stránka → dlaždice → prvý rad („typy hradísk“) → Pridať dlaždicu** → kategória „Stredoveké hrádky“.
   Počet článkov pod popiskom je zapnutý sám. Potiahnuť na koniec radu (za „Staroveké sídla“). Rad sa sám prepočíta
   na 7 stĺpcov.
3. **Hlavička a päta → menu:** potiahnuť „Stredoveké hrádky“ do hlavného riadku (typy hradísk), na koniec.
   Hlavička pri 1440 px ukáže, čo sa zmestí, zvyšok pod „Ďalšie“.
4. **Päta (nepovinné):** stĺpec „Typy hradísk“ → + odkaz → cieľ kategória „Stredoveké hrádky“.
5. **Uložiť** (koncept) → pozrieť náhľad na 1440 a na mobile → **Zverejniť**. Zverejnenie zapíše aj poradie kategórií.

## 5. Overenie

- Domovská stránka: 7 dlaždíc v prvom rade, pod novou počet „N hrádkov“.
- Hlavička: „Hrádky“ v hornom riadku, pri 1440 px „Ďalšie“ podľa šírky.
- Rovnaké tri miesta v `/en/` a `/de/` s anglickým a nemeckým názvom.
- `/category/stredoveke-hradky`: obrázok v hlavičke stránky a všetky presunuté články.
- Vrátenie: Vzhľad webu → História zverejnení → predchádzajúca verzia → Obnoviť do konceptu → Zverejniť.
  Kategóriu s článkami zmazať nejde, najprv treba články presunúť späť.
