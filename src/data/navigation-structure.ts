// Komplexná navigačná štruktúra pre Slovanské Hradiská
// Kategorizácia podľa FUNKCIE hradísk

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
      { label: 'Mapa hradísk', slug: '/mapa', description: 'Interaktívna 3D mapa všetkých lokalít' },
    ]
  },

  // HLAVNÉ TÉMY - funkčné kategórie hradísk
  {
    label: 'Kniežacie sídla',
    slug: '/kniezacie-sidla',
    count: 31,
    description: 'Sídla kniežat a panovníkov',
    children: [
      {
        label: 'Veľkomoravské',
        slug: '/kniezacie-sidla/velkomoravske',
        count: 22,
        children: [
          { label: 'Bojná - Kniežacie centrum', slug: '/sites/bojna', description: 'Významné Veľkomoravské centrum' },
          { label: 'Nitra - Nitrianske hradisko', slug: '/sites/nitranske-hradisko', description: 'Centrum Nitrianskeho kniežatstva' },
          { label: 'Devín - Devínske hradisko', slug: '/sites/devin', description: 'Kniežacie centrum na Dunaji' },
          { label: 'Pobedim - Pribinovo sídlo', slug: '/sites/pobedim', description: 'Pribinovo kniežatstvo' },
          { label: 'Mikulčice / Kopčany', slug: '/sites/mikulcice-kopcany', description: 'Centrum Veľkej Moravy' },
          { label: 'Staré Město - Velehrad (CZ)', slug: '/sites/stare-mesto-velehrad', description: 'Sídlo Rastislava a Svätopluka' },
          { label: 'Blatnohrad (HU)', slug: '/sites/blatnohrad', description: 'Pribinovo sídlo v Panónii' },
        ]
      },
      {
        label: 'Iné obdobia',
        slug: '/kniezacie-sidla/ine',
        count: 9,
        children: [
          { label: 'Bratislava - Hrad', slug: '/sites/bratislava' },
          { label: 'Trenčín - Hrad', slug: '/sites/trencin' },
          { label: 'Orava', slug: '/sites/orava' },
        ]
      },
    ]
  },
  {
    label: 'Mocenské centrá',
    slug: '/mocenske-centra',
    count: 80,
    description: 'Správne a administratívne centrá',
    children: [
      {
        label: 'Veľká Morava',
        slug: '/mocenske-centra/velka-morava',
        count: 45,
        children: [
          { label: 'Pobedim', slug: '/sites/pobedim', description: 'Slovanské hradisko' },
          { label: 'Svätý Jur - Neštich', slug: '/sites/svaty-jur-nestic', description: 'Mocenské centrum' },
          { label: 'Ducové', slug: '/sites/ducove' },
          { label: 'Moravany nad Váhom', slug: '/sites/moravany-nad-vahom' },
          { label: 'Nitrianska Blatnica - Velmožský dvorec', slug: '/sites/nitrianska-blatnica' },
          { label: 'Beckov', slug: '/sites/beckov' },
          { label: 'Všetky lokality (45)', slug: '/mocenske-centra/velka-morava' },
        ]
      },
      {
        label: 'Regionálne centrá',
        slug: '/mocenske-centra/regionalne',
        count: 35,
        children: [
          { label: 'Žilina (Závodie, Zástranie)', slug: '/sites/zilina' },
          { label: 'Zvolen - Môťová', slug: '/sites/zvolen-motova' },
          { label: 'Spišský Štvrtok - Slovenské Mykény', slug: '/sites/spissky-stvrtok' },
          { label: 'Spišské Tomášovce', slug: '/sites/spisske-tomasovce' },
          { label: 'Všetky lokality (35)', slug: '/mocenske-centra/regionalne' },
        ]
      },
    ]
  },
  {
    label: 'Strážna funkcia',
    slug: '/strazna-funkcia',
    count: 34,
    description: 'Stráženie ciest, hraníc a brodov',
    children: [
      {
        label: 'Obchodné cesty',
        slug: '/strazna-funkcia/obchodne-cesty',
        count: 18,
        children: [
          { label: 'Prašník - Hrádok', slug: '/sites/prasnik-hradok', description: 'Stráženie obchodnej cesty' },
          { label: 'Rybník - Krivín', slug: '/sites/rybnik-krivin', description: 'Kontrola cesty' },
          { label: 'Bošáca - Srniansky Háj', slug: '/sites/bosaca', description: 'Priesmyk' },
          { label: 'Všetky lokality (18)', slug: '/strazna-funkcia/obchodne-cesty' },
        ]
      },
      {
        label: 'Pohraničné stráže',
        slug: '/strazna-funkcia/hranice',
        count: 16,
        children: [
          { label: 'Obišovce - Stráža', slug: '/sites/obisovce-straza', description: 'Hraničná stráž' },
          { label: 'Nimnica - Holíš', slug: '/sites/nimnica-holis', description: 'Stráženie brodu' },
          { label: 'Sučany - Skala', slug: '/sites/sucany-skala', description: 'Strážne hradisko' },
          { label: 'Trzcinica (PL)', slug: '/sites/trzcinica', description: 'Karpatská stráž' },
          { label: 'Všetky lokality (16)', slug: '/strazna-funkcia/hranice' },
        ]
      },
    ]
  },
  {
    label: 'Refugiá',
    slug: '/refugia',
    count: 19,
    description: 'Dočasné úkryty a núdzové opevnenia',
    children: [
      { label: 'Šarišské Sokolovce', slug: '/sites/sarisske-sokolovce', description: 'Dočasné opevnenie' },
      { label: 'Veľký Tríbeč', slug: '/sites/velky-tribec', description: 'Refugiálne hradisko' },
      { label: 'Modľatín', slug: '/sites/modlatin', description: 'Úkryt z povestí' },
      { label: 'Hradište a Koscelisko', slug: '/sites/hradiste-koscelisko', description: 'Vysokohorské úkryty' },
      { label: 'Všetky refugiá (19)', slug: '/refugia' },
    ]
  },
  {
    label: 'Staroveke sídla',
    slug: '/staroveke-sidla',
    count: 62,
    description: 'Keltské, praveke a predslovanské',
    children: [
      {
        label: 'Keltské hradiská',
        slug: '/staroveke-sidla/keltske',
        count: 27,
        children: [
          { label: 'Smolenice - Molpír', slug: '/sites/smolenice-molpir', description: 'Keltské oppidum' },
          { label: 'Havránok - Liptovská Mara', slug: '/sites/havranok', description: 'Keltské hradisko' },
          { label: 'Klapy - Keltské hradisko', slug: '/sites/klapy', description: 'Laténske obdobie' },
          { label: 'Prosné - Keltské obetisko', slug: '/sites/prosne', description: 'Kultové miesto' },
          { label: 'Hainburg - Braunsberg', slug: '/sites/braunsberg', description: 'Rakúske oppidum' },
          { label: 'Zemplín', slug: '/sites/zemplin', description: 'Dácke obetisko' },
          { label: 'Pohanská - Oppidum', slug: '/sites/pohanska', description: 'Južná Morava' },
          { label: 'Všetky keltské (27)', slug: '/staroveke-sidla/keltske' },
        ]
      },
      {
        label: 'Pravek a doba bronzová',
        slug: '/staroveke-sidla/pravek',
        count: 35,
        children: [
          { label: 'Vráble-Fidvár', slug: '/sites/vrable-fidvar', description: 'Mesto z doby bronzovej' },
          { label: 'Nižná Myšľa', slug: '/sites/nizna-mysla', description: 'Bronzové mesto' },
          { label: 'Mohyly na Slovensku', slug: '/pravek/mohyly', description: 'Pohrebné mohyly' },
          { label: 'Sitno - Praveké hradisko', slug: '/sites/sitno', description: 'Doba bronzová' },
          { label: 'Otomanská kultúra', slug: '/pravek/otomanska-kultura', description: 'Východné Slovensko' },
          { label: 'Všetky praveke (35)', slug: '/staroveke-sidla/pravek' },
        ]
      },
    ]
  },

  // OSTATNÉ - sekundárne kategórie
  {
    label: 'Ostatné',
    slug: '/ostatne',
    description: 'Archeológia, kultúra, galéria a viac',
    children: [
      {
        label: 'Archeológia',
        slug: '/archeologia',
        description: 'Výskumy, nálezy a objavy',
        children: [
          {
            label: 'Archeologické výskumy',
            slug: '/archeologia/vyskumy',
            count: 97,
            description: 'Terénne výskumy a vykopávky',
            children: [
              { label: 'Okopanec - Borinka', slug: '/sites/okopanec-borinka' },
              { label: 'Divinka pri Žiline', slug: '/sites/divinka', description: 'Veľký vrch' },
              { label: 'Klátova Nová Ves - Šiance', slug: '/sites/klatova-nova-ves' },
              { label: 'Stupné - Žeravica', slug: '/sites/stupne-zeravica' },
              { label: 'Všetky výskumy (97)', slug: '/archeologia/vyskumy' },
            ]
          },
          {
            label: 'Nálezy a artefakty',
            slug: '/archeologia/nalezy',
            count: 28,
            description: 'Významné archeologické nálezy',
            children: [
              { label: 'Keramika', slug: '/archeologia/nalezy/keramika' },
              { label: 'Šperky a ozdoby', slug: '/archeologia/nalezy/sperky' },
              { label: 'Zbrane', slug: '/archeologia/nalezy/zbrane' },
              { label: 'Všetky nálezy (28)', slug: '/archeologia/nalezy' },
            ]
          },
          {
            label: 'Hroby a pohrebiská',
            slug: '/archeologia/hroby',
            count: 13,
            description: 'Pohrebné lokality'
          },
          {
            label: '3D rekonštrukcie',
            slug: '/archeologia/3d-rekonštrukcie',
            count: 20,
            description: 'Vizualizácie hradísk',
            children: [
              { label: 'Bojná - 3D model', slug: '/3d/bojna' },
              { label: 'Mohyla z Palárikova', slug: '/3d/mohyla-palarikovo' },
              { label: 'Pevnosť Nové Zámky', slug: '/3d/nove-zamky' },
              { label: 'Nitrianska Blatnica - Rotunda', slug: '/3d/nitrianska-blatnica' },
              { label: 'Šurany - 3D', slug: '/3d/surany' },
              { label: 'Všetky 3D (20)', slug: '/archeologia/3d-rekonštrukcie' },
            ]
          },
          {
            label: 'Informačné tabule',
            slug: '/archeologia/info-tabule',
            count: 14,
            description: 'Naše tabule na lokalitách'
          },
        ]
      },
      {
        label: 'Kultúra a História',
        slug: '/kultura',
        description: 'Veľká Morava, mytológia, pramene',
        children: [
          {
            label: 'Veľká Morava',
            slug: '/kultura/velka-morava',
            count: 53,
            description: '9. storočie',
            children: [
              { label: 'Svätopluk a jeho ríša', slug: '/blog/svatopluk' },
              { label: 'Pribina - prvý známy knieža', slug: '/blog/pribina' },
              { label: 'Rastislav', slug: '/blog/rastislav' },
              { label: 'Súmrak Veľkej Moravy', slug: '/blog/sumrak-velkej-moravy' },
              { label: 'Všetky články (53)', slug: '/kultura/velka-morava' },
            ]
          },
          {
            label: 'Historické pramene',
            slug: '/kultura/pramene',
            count: 22,
            children: [
              { label: 'Fuldské anály', slug: '/pramene/fuldske-analy' },
              { label: 'Bavorský geograf', slug: '/pramene/bavorsky-geograf' },
              { label: 'Obr átení Bavorov a Korutáncov', slug: '/pramene/obratenie-bavorov' },
              { label: 'Prokopios (6. stor.)', slug: '/pramene/prokopios' },
              { label: 'Všetky pramene (22)', slug: '/kultura/pramene' },
            ]
          },
          {
            label: 'Slovanská mytológia',
            slug: '/kultura/mytologia',
            count: 30,
            children: [
              { label: 'Slovanskí bohovia', slug: '/blog/slovanski-bohovia' },
              { label: 'Stopy pohanských bohov', slug: '/blog/stopy-bohov' },
              { label: 'Legenda o Orgoňovej Kýčere', slug: '/blog/orgonova-kycera' },
              { label: 'Povesti a legendy', slug: '/kultura/povesti' },
              { label: 'Pohanské svätyně', slug: '/kultura/pohanske-svatyne' },
              { label: 'Všetky (30)', slug: '/kultura/mytologia' },
            ]
          },
          {
            label: 'Iné kultúry',
            slug: '/kultura/ine-kultury',
            count: 27,
            children: [
              { label: 'Frankovia a Veľká Morava', slug: '/blog/frankovia' },
              { label: 'Bojová taktika Maďarov', slug: '/blog/bojova-taktika-madarov' },
              { label: 'Vikingovia', slug: '/blog/vikingovia' },
              { label: 'Všetky (27)', slug: '/kultura/ine-kultury' },
            ]
          },
        ]
      },
      {
        label: 'Slovanské hradiská v Európe',
        slug: '/europa',
        count: 27,
        description: 'Zahraničné lokality',
        children: [
          {
            label: 'Poľsko',
            slug: '/europa/polsko',
            count: 11,
            children: [
              { label: 'Biskupin', slug: '/sites/biskupin', description: 'Najznámejšie hradisko' },
              { label: 'Trzcinica', slug: '/sites/trzcinica', description: 'Karpatské hradisko' },
              { label: 'Gdansk', slug: '/sites/gdansk' },
              { label: 'Krakow', slug: '/sites/krakow' },
              { label: 'Bnin', slug: '/sites/bnin' },
              { label: 'Všetky poľské (11)', slug: '/europa/polsko' },
            ]
          },
          {
            label: 'Nemecko',
            slug: '/europa/nemecko',
            count: 8,
            children: [
              { label: 'Arkona', slug: '/sites/arkona', description: 'Slovanská svätyňa' },
              { label: 'Gross Raden', slug: '/sites/gross-raden' },
              { label: 'Wollin - Wolin', slug: '/sites/wollin' },
              { label: 'Všetky nemecké (8)', slug: '/europa/nemecko' },
            ]
          },
          {
            label: 'Česko',
            slug: '/europa/cesko',
            count: 8,
            children: [
              { label: 'Libice', slug: '/sites/libice' },
              { label: 'Klučov', slug: '/sites/klucov' },
              { label: 'Chotěbuz - Podobora', slug: '/sites/chotebuz' },
              { label: 'Všetky české (8)', slug: '/europa/cesko' },
            ]
          },
        ]
      },
      {
        label: 'Galéria a Výpravy',
        slug: '/galeria',
        children: [
          {
            label: 'Expedície',
            slug: '/galeria/vypravy',
            count: 15,
            children: [
              { label: 'Výprava Arkona 2012', slug: '/galeria/vypravy/arkona-2012' },
              { label: 'Výprava k Vikingom 2013', slug: '/galeria/vypravy/vikingovia-2013' },
              { label: 'Výpravy poľské hradiská', slug: '/galeria/vypravy/polsko' },
              { label: 'Plavba rímskou loďou po Dunaji', slug: '/galeria/vypravy/rimska-lod' },
              { label: 'Všetky expedície (15)', slug: '/galeria/vypravy' },
            ]
          },
          {
            label: 'Fotografie',
            slug: '/galeria/fotografie',
            count: 645,
            description: 'Fotogaléria lokalít'
          },
          {
            label: '3D modely',
            slug: '/galeria/3d-modely',
            count: 20,
            description: 'Interaktívne 3D vizualizácie'
          },
        ]
      },
      {
        label: 'Osobnosti',
        slug: '/osobnosti',
        count: 34,
        description: 'Historici a archeológovia',
        children: [
          { label: 'Peter Schreiber - články', slug: '/osobnosti/schreiber' },
          { label: 'Hana Chorvátová - články', slug: '/osobnosti/chorvatova' },
          { label: 'Štefanovičová - Slovensko v časoch Svätoplukovćich', slug: '/osobnosti/stefanovicova' },
          { label: 'Š. Meliš - Stopy pohanských bohov', slug: '/osobnosti/melis' },
          { label: 'Alexander Ruttkay', slug: '/osobnosti/ruttkay' },
          { label: 'Všetci autori (34)', slug: '/osobnosti' },
        ]
      },
      {
        label: 'Publikácie',
        slug: '/publikacie',
        count: 12,
        children: [
          { label: 'Zborník I - O hradiskách', slug: '/publikacie/zbornik-1' },
          { label: 'Zborník II', slug: '/publikacie/zbornik-2' },
          { label: 'Vedecké články', slug: '/publikacie/vedecke' },
          { label: 'Knihy a odporúčaná literatúra', slug: '/publikacie/knihy' },
        ]
      },
      {
        label: 'Podpora',
        slug: '/podpora',
        count: 6,
        children: [
          { label: '2% z dane pre Hradiská', slug: '/podpora/2-percenta' },
          { label: 'Ako nás podporiť', slug: '/podpora' },
          { label: 'Ankety a hlasovanie', slug: '/podpora/ankety' },
        ]
      },
    ]
  },
];

// Kategórie článkov podľa rokov
export const articleYears = [
  { year: 2010, count: 6, label: 'Začiatky projektu' },
  { year: 2011, count: 7, label: 'Rast databázy' },
  { year: 2012, count: 7, label: 'Výpravy a terénne výskumy' },
  { year: 2013, count: 18, label: 'Najprodukovanejší rok' },
  { year: 2014, count: 8, label: 'Stabilné obdobie' },
  { year: 2015, count: 4, label: 'Vedecké publikácie' },
  { year: 2016, count: 9, label: '3D rekonštrukcie' },
  { year: 2017, count: 8, label: 'Dokumentácia lokalít' },
  { year: 2018, count: 5, label: 'Terénna práca' },
  { year: 2019, count: 3, label: 'Archívne spracovanie' },
  { year: 2020, count: 2, label: 'COVID-19 - obmedzená činnosť' },
  { year: 2022, count: 2, label: 'Obnovenie aktivity' },
  { year: 2024, count: 1, label: 'Archeologické kultúry' },
  { year: 2025, count: 2, label: 'Nová webová platforma' },
];

// Štatistiky kategórií - aktualizované podľa novej analýzy
export const categoryStats = [
  // PRIMÁRNE KATEGÓRIE (podľa funkcie hradísk)
  { category: 'Mocenské centrá', count: 80, type: 'primary' },
  { category: 'Staroveke sídla', count: 62, type: 'primary' },
  { category: 'Strážna funkcia', count: 34, type: 'primary' },
  { category: 'Kniežacie sídla', count: 31, type: 'primary' },
  { category: 'Refugiá (úkryty)', count: 19, type: 'primary' },

  // SEKUNDÁRNE KATEGÓRIE
  { category: 'Opevnenia a fortifikácie', count: 130, type: 'secondary' },
  { category: 'Archeologické výskumy', count: 97, type: 'secondary' },
  { category: 'Veľká Morava', count: 53, type: 'secondary' },
  { category: 'Osobnosti', count: 34, type: 'secondary' },
  { category: 'Slovanská mytológia', count: 30, type: 'secondary' },
  { category: 'Artefakty', count: 28, type: 'secondary' },
  { category: 'Iné kultúry', count: 27, type: 'secondary' },
  { category: 'Historické pramene', count: 22, type: 'secondary' },
  { category: '3D rekonštrukcie', count: 20, type: 'secondary' },
  { category: 'Expedície', count: 15, type: 'secondary' },
  { category: 'Informačné tabule', count: 14, type: 'secondary' },
  { category: 'Hroby a pohrebiská', count: 13, type: 'secondary' },
  { category: 'Publikácie', count: 12, type: 'secondary' },
  { category: 'Podpora', count: 6, type: 'secondary' },
  { category: 'Interaktívne prvky', count: 2, type: 'secondary' },
];

// Najdôležitejšie lokality (featured) - aktualizované podľa funkcie
export const featuredSites = [
  // Kniežacie sídla
  'Nitra - Nitrianske hradisko',
  'Bojná - Kniežacie centrum',
  'Devín - Devínske hradisko',
  'Pobedim - Pribinovo sídlo',
  'Mikulčice / Kopčany',

  // Mocenské centrá
  'Svätý Jur - Neštich',
  'Nitrianska Blatnica - Velmožský dvorec',

  // Keltské a praveke
  'Smolenice - Molpír',
  'Havránok - Liptovská Mara',
  'Vráble-Fidvár',

  // Zahraničie
  'Arkona',
  'Biskupin',
];
