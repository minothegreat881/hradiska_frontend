// Komplexná navigačná štruktúra pre Slovanské Hradiská

export interface NavigationItem {
  label: string;
  slug?: string;
  children?: NavigationItem[];
  count?: number;
  description?: string;
}

export const mainNavigation: NavigationItem[] = [
  {
    label: 'Úvod',
    slug: '/',
    children: [
      { label: 'Domovská stránka', slug: '/' },
      { label: 'O projekte', slug: '/about' },
      { label: 'Mapa hradísk', slug: '/mapa', description: 'Interaktívna mapa všetkých lokalít' },
    ]
  },
  {
    label: 'Hradiská',
    slug: '/hradiska',
    children: [
      {
        label: 'Veľká Morava - Slovensko',
        slug: '/hradiska/velka-morava-slovensko',
        count: 18,
        children: [
          { label: 'Nitra - Nitrianske hradisko', slug: '/sites/nitranske-hradisko' },
          { label: 'Bojná - Bojnianske hradisko', slug: '/sites/bojna' },
          { label: 'Devín - Devínske hradisko', slug: '/sites/devin' },
          { label: 'Pobedim - Pobedimské hradisko', slug: '/sites/pobedim' },
          { label: 'Bratislava', slug: '/sites/bratislava' },
          { label: 'Trenčín', slug: '/sites/trencin' },
          { label: 'Zvolen - Môťová', slug: '/sites/zvolen-motova' },
          { label: 'Orava', slug: '/sites/orava' },
          { label: 'Žilina (Závodie, Zástranie)', slug: '/sites/zilina' },
          { label: 'Spišský Štvrtok - Slovenské Mykény', slug: '/sites/spissky-stvrtok' },
          { label: 'Spišské Tomášovce', slug: '/sites/spisske-tomasovce' },
          { label: 'Beckov', slug: '/sites/beckov' },
          { label: 'Moravany nad Váhom', slug: '/sites/moravany-nad-vahom' },
          { label: 'Nitrianska Blatnica', slug: '/sites/nitrianska-blatnica' },
          { label: 'Ducové', slug: '/sites/ducove' },
        ]
      },
      {
        label: 'Veľká Morava - Zahraničie',
        slug: '/hradiska/velka-morava-zahranicie',
        count: 8,
        children: [
          { label: 'Mikulčice / Kopčany (CZ/SK)', slug: '/sites/mikulcice-kopcany' },
          { label: 'Staré Město - Velehrad (CZ)', slug: '/sites/stare-mesto-velehrad' },
          { label: 'Břeclav - Pohansko (CZ)', slug: '/sites/breclav-pohansko' },
          { label: 'Gars - Thunau (AT)', slug: '/sites/gars-thunau' },
          { label: 'Blatnohrad - Pribinovo sídlo (HU)', slug: '/sites/blatnohrad' },
          { label: 'Visegrad (HU)', slug: '/sites/visegrad' },
        ]
      },
      {
        label: 'Keltské hradiská',
        slug: '/hradiska/keltske',
        count: 10,
        children: [
          { label: 'Smolenice - Molpír', slug: '/sites/smolenice-molpir' },
          { label: 'Pohanská - Keltské Oppidum', slug: '/sites/pohanska' },
          { label: 'Havránok - Liptovská Mara', slug: '/sites/havranok' },
          { label: 'Prosné - Keltské obetisko', slug: '/sites/prosne' },
          { label: 'Klapy', slug: '/sites/klapy' },
          { label: 'Braunsberg', slug: '/sites/braunsberg' },
          { label: 'Zemplín', slug: '/sites/zemplin' },
        ]
      },
      {
        label: 'Slovanské hradiská v Európe',
        slug: '/hradiska/slovanske-europa',
        count: 12,
        children: [
          { label: 'Arkona (DE)', slug: '/sites/arkona' },
          { label: 'Gross Raden (DE)', slug: '/sites/gross-raden' },
          { label: 'Wollin - Wolin (DE)', slug: '/sites/wollin' },
          { label: 'Libice (CZ)', slug: '/sites/libice' },
          { label: 'Klučov (CZ)', slug: '/sites/klucov' },
          { label: 'Chotěbuz - Podobora (CZ)', slug: '/sites/chotebuz' },
          { label: 'Biskupin (PL)', slug: '/sites/biskupin' },
          { label: 'Trzcinica (PL)', slug: '/sites/trzcinica' },
          { label: 'Gdansk (PL)', slug: '/sites/gdansk' },
          { label: 'Krakow (PL)', slug: '/sites/krakow' },
          { label: 'Bnin (PL)', slug: '/sites/bnin' },
        ]
      },
    ]
  },
  {
    label: 'Kultúra a História',
    slug: '/kultura',
    children: [
      {
        label: 'Pohanské svätyně',
        slug: '/kultura/pohanske-svatyne',
        count: 6,
        children: [
          { label: 'Slovanské pohanské svätyně', slug: '/category/svatyne' },
          { label: 'Perúnov háj pri Úbreži', slug: '/sites/perunov-haj' },
          { label: 'Bohyňa Lada na hrade Lietava', slug: '/sites/lietava-lada' },
          { label: 'Horné Plachtince - Pohanský vrch', slug: '/sites/horne-plachtince' },
        ]
      },
      {
        label: 'Bohovia a mytológia',
        slug: '/kultura/bohovia',
        children: [
          { label: 'Slovanskí Bohovia v písomných prameňoch', slug: '/blog/slovanski-bohovia' },
          { label: 'Stopy pohanských bohov', slug: '/blog/stopy-bohov' },
        ]
      },
      {
        label: 'Legendy a povesti',
        slug: '/category/povesti',
        count: 2,
        children: [
          { label: 'Súmrak Veľkej Moravy', slug: '/blog/sumrak-velkej-moravy' },
          { label: 'Legenda o Orgoňovej Kýčere', slug: '/blog/orgonova-kycera' },
        ]
      },
      {
        label: 'Vojenstvo a zbrane',
        slug: '/kultura/vojenstvo',
        count: 3,
        children: [
          { label: 'Zbrane Nitranov v časoch Veľkej Moravy', slug: '/blog/zbrane-nitranov' },
          { label: 'Bojová taktika Maďarov a kočovníkov', slug: '/blog/bojova-taktika' },
          { label: 'Vojenstvo na Veľkej Morave', slug: '/blog/vojenstvo-velka-morava' },
        ]
      },
    ]
  },
  {
    label: 'Archeológia',
    slug: '/archeologia',
    children: [
      {
        label: 'Výskumy',
        slug: '/archeologia/vyskumy',
        count: 69,
        description: 'Archeologické výskumy lokalít',
        children: [
          { label: 'Okopanec - Borinka', slug: '/sites/okopanec-borinka' },
          { label: 'Divinka pri Žiline (Veľký vrch)', slug: '/sites/divinka' },
          { label: 'Novohrad (Nógrád)', slug: '/sites/novohrad' },
          { label: 'Rybník - Krivín', slug: '/sites/rybnik-krivin' },
          { label: 'Klátova Nová Ves - Šiance', slug: '/sites/klatova-nova-ves' },
          { label: 'Nezbudská lúčka - Gábrišová', slug: '/sites/nezbudska-lucka' },
          { label: 'Prašník (viac lokalít)', slug: '/sites/prasnik' },
          { label: 'Belušské Slatiny', slug: '/sites/belusske-slatiny' },
          { label: 'Železník (Dolné Orešany)', slug: '/sites/zeleznik' },
          { label: 'Stupné - Žeravica', slug: '/sites/stupne-zeravica' },
          { label: 'Všetky lokality (69)', slug: '/archeologia/vyskumy' },
        ]
      },
      {
        label: 'Nálezy',
        slug: '/archeologia/nalezy',
        description: 'Významné archeologické nálezy'
      },
      {
        label: 'Informačné tabule',
        slug: '/archeologia/info-tabule',
        description: 'Naše informačné tabule na lokalitách'
      },
      {
        label: '3D rekonštrukcie',
        slug: '/archeologia/3d-rekonštrukcie',
        count: 1,
        description: '3D vizualizácie hradísk'
      },
    ]
  },
  {
    label: 'Pramene',
    slug: '/pramene',
    children: [
      {
        label: 'Historické pramene',
        slug: '/pramene/historicke',
        count: 5,
        children: [
          { label: 'Fuldské anály', slug: '/pramene/fuldske-analy' },
          { label: 'Bavorský geograf', slug: '/pramene/bavorsky-geograf' },
          { label: 'Zákonník Veľkej Moravy', slug: '/pramene/zakonnik' },
          { label: 'Spis O Obrátení Bavorov a Korutáncov', slug: '/pramene/obratenie-bavorov' },
          { label: 'Prokopios (6. storočie)', slug: '/pramene/prokopios' },
        ]
      },
      {
        label: 'Vedecké články',
        slug: '/pramene/vedecke',
        count: 13,
        children: [
          { label: 'Články Peter Schreibera', slug: '/pramene/schreiber' },
          { label: 'Články Hany Chorvátovej', slug: '/pramene/chorvatova' },
          { label: 'Štefanovičová: Slovensko v časoch Svätoplukovćich', slug: '/pramene/stefanovicova' },
          { label: 'Všetky články', slug: '/pramene/vedecke' },
        ]
      },
      {
        label: 'Knihy',
        slug: '/pramene/knihy',
        description: 'Odporúčaná literatúra'
      },
    ]
  },
  {
    label: 'Pravek',
    slug: '/pravek',
    children: [
      { label: 'Vráble-Fidvár - mesto z doby bronzovej', slug: '/sites/vrable-fidvar' },
      { label: 'Nižná Myšľa - mesto z doby bronzovej', slug: '/sites/nizna-mysla' },
      { label: 'Mohyly na Slovensku a Európe', slug: '/pravek/mohyly' },
      { label: 'Skýti a ich Kurhany', slug: '/pravek/skyti' },
      { label: 'Nemecká (doba bronzová)', slug: '/sites/nemecka' },
      { label: 'Kamenná industria', slug: '/pravek/kamenna-industria' },
    ]
  },
  {
    label: 'Galéria',
    slug: '/galeria',
    children: [
      { label: 'Fotografie', slug: '/galeria/fotografie' },
      { label: '3D modely', slug: '/galeria/3d-modely' },
      {
        label: 'Výpravy',
        slug: '/galeria/vypravy',
        count: 3,
        children: [
          { label: 'Výprava Arkona 2012', slug: '/galeria/vypravy/arkona-2012' },
          { label: 'Výprava k Vikingom 2013', slug: '/galeria/vypravy/vikingovia-2013' },
          { label: 'Výpravy poľské hradiská', slug: '/galeria/vypravy/polsko' },
        ]
      },
    ]
  },
  {
    label: 'Blog',
    slug: '/blog',
    description: '235 článkov o archeológii a histórii'
  },
];

// Kategórie článkov podľa rokov
export const articleYears = [
  { year: 2010, count: 12, label: 'Začiatky projektu' },
  { year: 2011, count: 18, label: 'Rast databázy' },
  { year: 2012, count: 24, label: 'Výpravy a terénne výskumy' },
  { year: 2013, count: 31, label: 'Medzinárodná spolupráca' },
  { year: 2014, count: 69, label: 'Peak rok - najaktívnejšie obdobie' },
  { year: 2015, count: 22, label: 'Stabilné obdobie' },
  { year: 2016, count: 19, label: 'Vedecké publikácie' },
  { year: 2017, count: 14, label: '3D rekonštrukcie' },
  { year: 2018, count: 8, label: 'Dokumentácia lokalít' },
  { year: 2019, count: 6, label: 'Archívne spracovanie' },
  { year: 2020, count: 3, label: 'COVID-19 - obmedzená činnosť' },
  { year: 2021, count: 4, label: 'Online prednášky' },
  { year: 2024, count: 3, label: 'Obnovenie aktivity' },
  { year: 2025, count: 2, label: 'Nová webová platforma' },
];

// Štatistiky kategórií
export const categoryStats = [
  { category: 'Archeologické lokality', count: 69 },
  { category: 'Veľkomoravské hradiská - Slovensko', count: 18 },
  { category: 'Vedecké články', count: 13 },
  { category: 'Slovanské hradiská - zahraničie', count: 12 },
  { category: 'Keltské hradiská', count: 10 },
  { category: 'Veľkomoravské hradiská - zahraničie', count: 8 },
  { category: 'Pohanské svätyně', count: 6 },
  { category: 'Pravek a doba bronzová', count: 6 },
  { category: 'Historické dokumenty', count: 5 },
  { category: 'Kultúra a umenie', count: 4 },
  { category: 'Vojenstvo a zbrane', count: 3 },
  { category: 'Výpravy', count: 3 },
  { category: 'Legendy', count: 2 },
  { category: '3D rekonštrukcie', count: 1 },
  { category: 'Iné témy', count: 58 },
];

// Najdôležitejšie lokality (featured)
export const featuredSites = [
  'Nitra - Nitrianske hradisko',
  'Bojná - Bojnianske hradisko',
  'Devín - Devínske hradisko',
  'Mikulčice / Kopčany',
  'Staré Město - Velehrad',
  'Smolenice - Molpír',
  'Havránok - Liptovská Mara',
  'Arkona',
  'Biskupin',
  'Vráble-Fidvár',
];
