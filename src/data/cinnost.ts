/**
 * ČINNOSŤ ZDRUŽENIA — tematické členenie kroniky.
 *
 * Kronika bola doteraz zoradená len podľa dátumu. Rok je pri nej vecný údaj,
 * ale sám o sebe nepovie, ČO združenie robí: zápis o tabuli na Bojnej leží
 * medzi pozvánkou na festival a výzvou na 2 %. Toto je druhý pohľad na tie
 * isté zápisy — podľa toho, čoho sa týkajú.
 *
 * Členenie je prevzaté z prezentácie združenia („Občianske združenie Hradiská
 * — Činnosť"): informačné tabule, vydávanie kníh, 2 % z daní, 3D
 * rekonštrukcie, archeologické výskumy. Doplnené sú dve, ktoré v kronike
 * tvoria najväčšiu časť zápisov a v prezentácii nie sú: výpravy a podujatia,
 * prednášky a médiá.
 *
 * DVE ČINNOSTI MAJÚ VLASTNÚ KATEGÓRIU. Tabule aj 3D rekonštrukcie nie sú
 * zápisy v kronike, ale samostatné články (13 a 52) — ich dlaždica preto
 * vedie do kategórie, nie do filtra kroniky.
 *
 * ZARAĎUJE SA PODĽA NÁZVU, nie podľa značiek: značky v databáze pri
 * aktualitách prázdne a dopĺňať ich ručne k osemdesiatim zápisom by znamenalo
 * osemdesiat zásahov do obsahu. Vzor sa dá kedykoľvek spresniť a zoznamy
 * `navyse` a `mimo` sú na to, čo sa do vzoru nezmestí. Zápis, ktorý nesadne
 * nikam, nezmizne — ostáva v kronike podľa rokov, tá je stále úplná.
 */

export type KlucCinnosti =
  | 'tabule' | 'publikacie' | 'dane' | 'rekonstrukcie' | 'vyskumy' | 'vypravy' | 'prednasky';

export interface Cinnost {
  kluc: KlucCinnosti;
  /** Slovenský názov; anglický drží prekladová vrstva pod týmto kľúčom. */
  nazov: string;
  popis: string;
  /** Cesta k obrázku v Strapi médiách, alebo súbor webu (`/znak_minca.png`). */
  obrazok: string;
  /** Obrázok je súbor webu, nie médium zo Strapi — nelepí sa pred neho adresa API. */
  vlastny?: boolean;
  /** Keď má činnosť vlastnú kategóriu, dlaždica vedie tam. */
  kategoria?: string;
  /** Zápisy kroniky, ktoré do činnosti patria (hľadá sa v názve aj v slugu). */
  vzor?: RegExp;
  /** Čo vzor nechytí. */
  navyse?: string[];
  /** Čo vzor chytil omylom. */
  mimo?: string[];
}

export const CINNOSTI: Cinnost[] = [
  {
    kluc: 'tabule',
    nazov: 'Informačné tabule',
    popis: 'Tabule, ktoré združenie vyrobilo a osadilo priamo pri hradiskách.',
    obrazok: '/uploads/IMG_0832_88619f3e7d.jpg',
    kategoria: 'informacne-tabule',
  },
  {
    kluc: 'publikacie',
    nazov: 'Knihy a zborníky',
    popis: 'Dva zborníky „Hradiská — Svedkovia dávnych čias“, kniha Oživená archeológia a časopis Digitálne hradiská.',
    obrazok: '/uploads/Obal_396e3d04b6.jpg',
    vzor: /zborn[ií]k|kniha|knihy|kníh|časopis|publikác|vytlačen|volume|proceedings|magazine|booklet|printed|\bbook\b/i,
    /* Cudzie knihy, o ktorých združenie len informovalo alebo ich
       recenzovalo — medzi vlastné publikácie nepatria. */
    mimo: [
      'starosloviensky-slovnik-online', 'old-church-slavonic-dictionary-online',
      'knihy-o-slovanoch', 'books-about-the-slavs',
      'velkomoravske-hradiska', 'velkomoravske-hradiska-new-book',
      'tak-nam-zas-zamlciavaju-dejiny', 'secret-history-of-slovakia-book-review',
      'skryte-poklady', 'hidden-treasures-tvrdosovce-finds',
      'ako-zbierat-starozitnosti', 'how-to-collect-antiquities-kmet-1904',
    ],
  },
  {
    kluc: 'dane',
    nazov: '2 % z daní',
    popis: 'Výzvy, z čoho sa platia tabule, výskumy a tlač — a ako sa dá prispieť.',
    /* Maľovaná minca zo šatu webu. Bannery k jednotlivým rokom sú samý text
       a v dlaždici by z nich ostala len šedá plocha s nečitateľnými vetami. */
    obrazok: '/znak_minca.webp',
    vlastny: true,
    vzor: /(^|[^0-9a-z])2\s*%|z dan[eií]|dvoch percent|of your tax|two-percent/i,
  },
  {
    kluc: 'rekonstrukcie',
    nazov: '3D rekonštrukcie',
    popis: 'Ako hradiská vyzerali, kým z nich ostali valy — modely, kresby a letecké pohľady.',
    obrazok: '/uploads/fortificationfinaledit_9865a40e30.png',
    kategoria: '3d-modely',
  },
  {
    kluc: 'vyskumy',
    nazov: 'Archeologické výskumy',
    popis: 'Vlastné výskumy a prieskumy v teréne — od mikrosond po ohlásené nálezy.',
    obrazok: '/uploads/13131524_10154055304962347_2460571347928045774_o_903e87d6cc.jpg',
    vzor: /výskum|prieskum|nálezy|poklad|objavili|detektorov|excavat|hoard|metal-detector|discovered|\bfinds\b/i,
    /* Texty o ochrane pamiatok, o zbieraní starožitností a ankety o amnestii
       hovoria o cudzom hľadaní, nie o práci združenia. */
    mimo: [
      'nelegalny-detektorizmus-skodi-nasej-historii', 'illegal-metal-detecting-damages-our-history',
      'ako-zbierat-starozitnosti', 'how-to-collect-antiquities-kmet-1904',
      'hladajte-na-hradiskach-poklady', 'hunt-for-treasure-at-hillforts-geocaching',
      'skryte-poklady', 'hidden-treasures-tvrdosovce-finds',
      'ohlasit-archeologicky-nalez-sa-oplati-patri-vam-nalezne', 'reporting-archaeological-find-finders-reward',
      'anketa-2014-jul', 'poll-amnesty-for-archaeological-finds-2014',
      'anketa-2014-maj', 'survey-archaeological-amnesty',
    ],
  },
  {
    kluc: 'vypravy',
    nazov: 'Výpravy a podujatia',
    popis: 'Cesty za hradiskami doma aj v cudzine, plavby, brigády a živá história.',
    obrazok: '/uploads/dron_2_f911c4c569.jpg',
    vzor: /výprav|plavb|putovanie|festival|utgard|živá história|živý starovek|výstava|brigád|ožijú|danuvina|expedition|voyage|sailing|living (history|antiquity)|exhibition|volunteer day|come alive|in search of/i,
    mimo: ['podpalili-archologicky-skanzen', 'arson-at-the-prestavlky-open-air-museum'],
  },
  {
    kluc: 'prednasky',
    nazov: 'Prednášky a médiá',
    popis: 'Prednášky v školách a kluboch, podcasty, rozhovory a diskusie.',
    obrazok: '/uploads/IMG_20210624_092657_be61af7547.jpg',
    vzor: /prednáš|podcast|rozhovor|video|diskusn|anketa|súťaž|lecture|\btalk\b|interview|discussion|\bpoll\b|competition|statement/i,
    /* Slovenské názvy sú stručnejšie než anglické: „Kelti v Malých
       Karpatoch" nepovie, že ide o prednášku, anglický názov áno. Bez
       týchto riadkov by tá istá udalosť mala v každom jazyku inú tému. */
    navyse: [
      'hladanie-bez-hranic-cesko-slovensky-dialog-archeologov-a-detektoristov',
      'searching-without-borders-archaeologists-detectorists-dialogue',
      'kelti-v-malych-karpatoch', 'celts-in-the-lesser-carpathians-lecture',
      'kelti-v-tvrdosovciach', 'celts-lecture-at-tvrdosovce',
      'stanovisko-k-takzvanym-slovansko-arijskym-vedam', 'statement-on-the-slavic-aryan-vedas',
      'anketa-2014-jul', 'poll-amnesty-for-archaeological-finds-2014',
      'anketa-2014-maj', 'survey-archaeological-amnesty',
    ],
  },
];

/** Činnosti, ktoré filtrujú kroniku (ostatné vedú do vlastnej kategórie). */
export const CINNOSTI_KRONIKY = CINNOSTI.filter((c) => !c.kategoria);

/**
 * Poradie ROZHODOVANIA, nie zobrazenia. Dlaždice stoja podľa prezentácie
 * združenia, rozhoduje sa však od najužšieho k najširšiemu: výzva na 2 %
 * z roku 2019 má v anglickej adrese slovo „volume“ (bola spojená s vydaním
 * zborníka) a medzi publikácie nepatrí.
 */
const PORADIE: KlucCinnosti[] = ['dane', 'publikacie', 'vyskumy', 'vypravy', 'prednasky'];

/**
 * Do ktorej činnosti zápis patrí. Prvá zhoda vyhráva. Hľadá sa v názve aj
 * v adrese, a to v jazyku stránky — anglická kronika má vlastné názvy, preto
 * má každá činnosť vzor pre oba jazyky.
 */
export function cinnostZapisu(slug: string, nazov: string): KlucCinnosti | null {
  for (const kluc of PORADIE) {
    const c = CINNOSTI_KRONIKY.find((x) => x.kluc === kluc);
    if (!c) continue;
    if (c.mimo?.includes(slug)) continue;
    if (c.navyse?.includes(slug)) return c.kluc;
    if (c.vzor && (c.vzor.test(nazov) || c.vzor.test(slug))) return c.kluc;
  }
  return null;
}
