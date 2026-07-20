/**
 * Kategórie hradísk pre dlaždice na homepage.
 *
 * Nahrádza pôvodný zoznam v `mock-data.ts`, ktorý mal iba 8 kategórií, Unsplash
 * fotky bez vzťahu k obsahu a — čo bolo horšie — slugy, ktoré nesedeli so Strapi
 * (`strazna-hospodarska` vs. `strazna-funkcia`, `vseobecne` vs.
 * `vseobecne-o-hradiskach`, `svatyne` vs. `svatyne-a-sakralne-objekty` …),
 * takže odkazy `/category/<slug>` viedli na prázdno.
 *
 * `slug` a `label` sedia s kolekciou `blog-category` v Strapi. Počty článkov sa
 * neuvádzajú natvrdo — doťahujú sa naživo, aby nezostarli.
 *
 * `image` je cesta k obrázku v Strapi médiách. Vybraný je zámerne z článku
 * v tej istej kategórii (nie stock) — kritériom bol pomer strán 1,3–2,1
 * a šírka nad 1200 px, aby dlaždica dobre vyzerala.
 *
 * Kategória `ostatne` tu nie je — v Strapi má 0 publikovaných článkov.
 */

export interface HradiskaCategory {
  /** Slug v Strapi — tvorí odkaz /category/<slug>. */
  slug: string;
  label: string;
  description: string;
  /** Kľúč do iconMap v CategoryCard.tsx. */
  icon: string;
  /** Cesta v Strapi médiách; základ URL sa dopĺňa cez VITE_STRAPI_URL. */
  image: string;
}

export const hradiskaCategories: HradiskaCategory[] = [
  {
    slug: 'kniezacie-sidla',
    label: 'Kniežacie sídla',
    description:
      'Sídla veľkomoravských kniežat a vládcov — Nitra, Mikulčice, Blatnohrad. Miesta, kde sa spájala politická moc s hospodárstvom a kde vyrastali prvé kamenné kostoly na našom území.',
    icon: 'crown',
    image: '/uploads/Mikulcice_letecka_rekonstrukcia_hradiska_4a4a44b89e.png',
  },
  {
    slug: 'mocenske-centra',
    label: 'Mocenské centrá',
    description:
      'Správne a vojenské strediská, ktoré držali pod kontrolou celé územné celky. Okrem slovenských lokalít sem patria aj hradiská Slávnikovcov v Čechách a slovanské centrá v dnešnom Nemecku.',
    icon: 'landmark',
    image: '/uploads/Demian_861010d38f.jpg',
  },
  {
    slug: 'strazna-funkcia',
    label: 'Strážna a hospodárska funkcia',
    description:
      'Najpočetnejšia skupina — hradiská, ktoré strážili priesmyky, brody a obchodné cesty alebo slúžili remeslu. Práve tu vidno, ako hustou sieťou bolo územie pokryté.',
    icon: 'shield',
    image: '/uploads/Pla_CC_81nik_6643c66390.jpg',
  },
  {
    slug: 'refugia',
    label: 'Refúgiá',
    description:
      'Útočištné hradiská, kam sa obyvateľstvo sťahovalo v čase nebezpečenstva. Bývajú menšie, ťažko prístupné a bez stôp trvalého osídlenia — obývali sa len keď bolo treba.',
    icon: 'mountain',
    image: '/uploads/L_C2_A3u_CC_88ny_hr_C2_B0b_od_Z_17ca9b2a6a.JPG',
  },
  {
    slug: 'staroveke-sidla',
    label: 'Staroveké sídla',
    description:
      'Opevnené sídla z čias pred príchodom Slovanov — doba bronzová, halštat, keltské oppidá a púchovská kultúra. Mnohé z nich Slovania neskôr osídlili znova.',
    icon: 'columns',
    image: '/uploads/Zlato_1_cc7b1d89aa.jpg',
  },
  {
    slug: 'svatyne-a-sakralne-objekty',
    label: 'Svätyne a sakrálne objekty',
    description:
      'Kultové miesta pohanské aj kresťanské — obetiská, mohylníky, posvätné háje a najstaršie stojace kostoly. Vrátane mytológie a pohrebných zvyklostí Slovanov.',
    icon: 'church',
    image: '/uploads/lupis2_cd92eedea0.png',
  },
  {
    slug: '3d-modely',
    label: '3D modely a rekonštrukcie',
    description:
      'Vizuálne rekonštrukcie hradísk — 3D modely, kresby opevnení a brán, letecké pohľady. Ukazujú, ako miesta pravdepodobne vyzerali, kým z nich ostali len valy.',
    icon: 'landmark',
    image: '/uploads/fortificationfinaledit_9865a40e30.png',
  },
  {
    slug: 'vseobecne-o-hradiskach',
    label: 'Všeobecne o hradiskách',
    description:
      'Články, ktoré sa neviažu na jednu lokalitu — konštrukcia valov, remeslá, vojenstvo, každodenný život a širšie dejinné súvislosti slovanského osídlenia.',
    icon: 'book',
    image: '/uploads/geograf_vyznaceni_merhanos_a55eccde8b.jpg',
  },
  {
    slug: 'listiny-a-pisomne-zdroje',
    label: 'Listiny a písomné zdroje',
    description:
      'Dobové pramene, z ktorých o hradiskách vieme — Fuldské anály, Bavorský geograf, listiny a antickí autori. Texty aj s prekladom a zaradením do kontextu.',
    icon: 'scroll',
    image: '/uploads/vs_CC_8_Cetky_3_typy_f6a4871986.jpg',
  },
  {
    slug: 'odborne-texty',
    label: 'Odborné texty',
    description:
      'Archeologické výskumy, štúdie a state odborníkov — nálezové správy, rozbory lokalít a príspevky, ktoré idú hlbšie než populárny výklad.',
    icon: 'file-text',
    image: '/uploads/Obr01_Salkovsky2_3956177981.jpg',
  },
  {
    slug: 'povesti',
    label: 'Povesti',
    description:
      'Legendy a ústne podania viazané na hradiská — bohovia, zakliate poklady, zaniknuté hrady. Ľudová pamäť miest, ktorá často prežila dlhšie než ich múry.',
    icon: 'book',
    image: '/uploads/voj_map_5246864271.jpg',
  },
  {
    slug: 'aktuality',
    label: 'Aktuality',
    description:
      'Kronika činnosti združenia od roku 2010 — brigády, prednášky, publikácie, výskumy a podujatia. Čo sme robili a čo nás čaká.',
    icon: 'scroll',
    image: '/uploads/Mapa_200_a9dd1593d9.jpg',
  },
];
