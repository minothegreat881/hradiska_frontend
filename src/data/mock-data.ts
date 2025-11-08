// Mock dáta pre hradiska.sk

export type Period = 'paleolit' | 'mezolit' | 'neolit' | 'eneolit' | 'bronz' | 'zelezna' | 'rimska' | 'slovania' | 'stredovek';
export type Region = 'zapadne' | 'stredne' | 'vychodne' | 'bratislava' | 'kosice';
export type SiteType = 'hradisko' | 'sidlisko' | 'pohrebisko' | 'oppidum' | 'kultove' | 'iné';
export type Category = 'kniezacie-sidla' | 'mocenske-centra' | 'strazna-hospodarska' | 'refugia' | 'staroveke-hradiska' | 'vseobecne' | 'svatyne' | 'povesti' | 'listiny';

export interface Site {
  id: string;
  slug: string;
  name: string;
  period: Period[];
  region: Region;
  type: SiteType;
  category?: Category[];
  district: string;
  coordinates: { lat: number; lng: number };
  description: string;
  findings: string[];
  images: string[];
  bibliography: string[];
  featured?: boolean;
  excavated?: boolean;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
  };
  publishedAt: string;
  readTime: number;
  tags: string[];
  category?: 'vyskum' | 'historia' | 'metodika' | 'aktuality';
  hradiskaCategory?: Category[];
  featured?: boolean;
  keywords?: string[];
  bibliography?: string[];
  images?: { url: string; caption: string; position: number }[];
  quotes?: { text: string; author: string; position: number }[];
}

export const periods: { value: Period; label: string }[] = [
  { value: 'paleolit', label: 'Paleolit' },
  { value: 'mezolit', label: 'Mezolit' },
  { value: 'neolit', label: 'Neolit' },
  { value: 'eneolit', label: 'Eneolit' },
  { value: 'bronz', label: 'Doba bronzová' },
  { value: 'zelezna', label: 'Doba železná' },
  { value: 'rimska', label: 'Rímska doba' },
  { value: 'slovania', label: 'Slovania' },
  { value: 'stredovek', label: 'Stredovek' },
];

export const regions: { value: Region; label: string }[] = [
  { value: 'zapadne', label: 'Západné Slovensko' },
  { value: 'stredne', label: 'Stredné Slovensko' },
  { value: 'vychodne', label: 'Východné Slovensko' },
  { value: 'bratislava', label: 'Bratislava' },
  { value: 'kosice', label: 'Košice' },
];

export const siteTypes: { value: SiteType; label: string }[] = [
  { value: 'hradisko', label: 'Hradisko' },
  { value: 'sidlisko', label: 'Sídlisko' },
  { value: 'pohrebisko', label: 'Pohrebisko' },
  { value: 'oppidum', label: 'Oppidum' },
  { value: 'kultove', label: 'Kultové miesto' },
  { value: 'iné', label: 'Iné' },
];

export const categories: { value: Category; label: string; description: string; icon: string; image: string }[] = [
  { 
    value: 'kniezacie-sidla', 
    label: 'Kniežacie sídla', 
    description: 'Mocenské centrá veľkomoravských panovníkov – hradiská, ktoré predstavovali politické, hospodárske a vojenské sídla elít', 
    icon: 'castle',
    image: 'https://images.unsplash.com/photo-1626880700245-0fe6ffa47742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGNhc3RsZSUyMHJ1aW5zfGVufDF8fHx8MTc2MjEwOTE2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'mocenske-centra', 
    label: 'Mocenské centrá', 
    description: 'Správne a administratívne centrá územných celkov', 
    icon: '🏛️',
    image: 'https://images.unsplash.com/photo-1613552568445-7d357eb359c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwZm9ydHJlc3N8ZW58MXx8fHwxNzYyMTkzOTc3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'strazna-hospodarska', 
    label: 'Strážna a hospodárska funkcia', 
    description: 'Hradiská slúžiace na obranu a kontrolu obchodných ciest', 
    icon: '🛡️',
    image: 'https://images.unsplash.com/photo-1660070442600-1d4cda83acce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBzdG9uZSUyMHdhbGxzfGVufDF8fHx8MTc2MjE5Mzk3N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'refugia', 
    label: 'Refúgiá', 
    description: 'Úkrytové hradiská pre obyvateľstvo v čase ohrozenia', 
    icon: '🏔️',
    image: 'https://images.unsplash.com/photo-1682404709961-957eb3311817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGZvcnRyZXNzfGVufDF8fHx8MTc2MjE5Mzk3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'staroveke-hradiska', 
    label: 'Staroveké hradiská', 
    description: 'Hradiská z pravekého a starovekého obdobia', 
    icon: '🗿',
    image: 'https://images.unsplash.com/photo-1722837766894-ab72c7ed8507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMHNpdGV8ZW58MXx8fHwxNzYyMTkzOTc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'vseobecne', 
    label: 'Všeobecne o hradiskách', 
    description: 'Základné informácie o hradiskách a ich výskume', 
    icon: '📚',
    image: 'https://images.unsplash.com/photo-1632038585992-fecf8a0cf59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpY2FsJTIwYm9va3xlbnwxfHx8fDE3NjIxOTM5Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'svatyne', 
    label: 'Svätyne', 
    description: 'Kultové a sakrálne miesta, pohanské i kresťanské', 
    icon: '⛪',
    image: 'https://images.unsplash.com/photo-1528476733407-5d17ee55208e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwY2h1cmNofGVufDF8fHx8MTc2MjE5Mzk3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'povesti', 
    label: 'Povesti', 
    description: 'Legendy a povesti spojené s hradiskami', 
    icon: '📖',
    image: 'https://images.unsplash.com/photo-1632038585992-fecf8a0cf59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpY2FsJTIwYm9va3xlbnwxfHx8fDE3NjIxOTM5Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  { 
    value: 'listiny', 
    label: 'Listiny', 
    description: 'Historické dokumenty a písomné pramene', 
    icon: '📜',
    image: 'https://images.unsplash.com/photo-1506513083865-434a8a207e11?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbGQlMjBtYW51c2NyaXB0fGVufDF8fHx8MTc2MjE5Mzk3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
];

export const mockSites: Site[] = [
  {
    id: '1',
    slug: 'devin',
    name: 'Devín',
    period: ['slovania', 'stredovek', 'rimska'],
    region: 'bratislava',
    type: 'hradisko',
    category: ['strazna-hospodarska', 'mocenske-centra'],
    district: 'Bratislava IV',
    coordinates: { lat: 48.1735, lng: 16.9783 },
    description: 'Hradisko Devín patrí k najvýznamnejším archeologickým lokalitám na Slovensku. Strategická poloha na sútoku Dunaja a Moravy predurčila jeho úlohu strážcu obchodných ciest. Archeologické výskumy odhalili kontinuitu osídlenia od neolitu po stredovek.',
    findings: [
      'Slovanská keramika z 9. storočia',
      'Rímske mince a militárie',
      'Veľkomoravské šperky',
      'Stredoveká bronzová zvonica',
      'Keltské oppidum - bronzové fibuly',
    ],
    images: [],
    bibliography: [
      'Pieta, K. (2008): Keltské osídlenie Slovenska. SAV, Nitra.',
      'Bialeková, D. (1990): Devín - Hrad. Slovník pamiatok. Bratislava.',
      'Plachá, V., Hlavicová, J. (2003): Devín - Veľkomoravské hradisko. Archaeologia Slovaca Monographiae.',
    ],
    featured: true,
    excavated: true,
  },
  {
    id: '2',
    slug: 'bratislavsky-hrad',
    name: 'Bratislavský hrad',
    period: ['rimska', 'slovania', 'stredovek'],
    region: 'bratislava',
    type: 'hradisko',
    category: ['kniezacie-sidla', 'mocenske-centra'],
    district: 'Bratislava I',
    coordinates: { lat: 48.1422, lng: 17.1000 },
    description: 'Bratislavský hrad dominuje panoráme hlavného mesta už od praveku. Jeho poloha na strategickom brehe Dunaja priťahovala osídlencov už v mladšej dobe kamennej. V dobe rímskej tu stála pohraničná stanica, neskôr významné veľkomoravské hradisko.',
    findings: [
      'Lineárna keramika (neolit)',
      'Rímske stavebné zvyšky',
      'Veľkomoravské opevnenie',
      'Stredoveká gotická architektúra',
    ],
    images: [],
    bibliography: [
      'Štefanovičová, T. (1995): Bratislavský hrad v 6.-8. storočí. In: Slovenská archeológia 43.',
      'Holčík, Š. (1978): Rímske stavby na Bratislavskom hrade. Zborník SNM.',
    ],
    featured: true,
    excavated: true,
  },
  {
    id: '3',
    slug: 'nitriansky-hrad',
    name: 'Nitriansky hrad',
    period: ['slovania', 'stredovek'],
    region: 'stredne',
    type: 'hradisko',
    category: ['kniezacie-sidla', 'svatyne'],
    district: 'Nitra',
    coordinates: { lat: 48.3167, lng: 18.0833 },
    description: 'Sídlo nitrianskeho kniežaťa Pribinu a najstaršie centrum kresťanstva na území Slovenska. Archeologické nálezy dokumentujú bohaté veľkomoravské osídlenie s kamennou architektúrou. V roku 828 tu bol vysvätený prvý kresťanský kostol.',
    findings: [
      'Veľkomoravské rotundy',
      'Zlaté náušnice so zrniečkovaním',
      'Slovanská hrnčiarska pec',
      'Románska krypta sv. Emeráma',
    ],
    images: [],
    bibliography: [
      'Chropovský, B. (1991): Nitra, hradný vrch v 6.-12. storočí. Štúdia o hradisku.',
      'Fusek, G. (1994): Slovensko vo včasnostredovekom období. Nitra.',
    ],
    excavated: true,
  },
  {
    id: '4',
    slug: 'spis',
    name: 'Spišský hrad',
    period: ['stredovek'],
    region: 'vychodne',
    type: 'hradisko',
    category: ['strazna-hospodarska', 'mocenske-centra'],
    district: 'Spišské Podhradie',
    coordinates: { lat: 48.9989, lng: 20.7681 },
    description: 'Jeden z najväčších hradných komplexov v strednej Európe. Archeologické výskumy potvrdili stredoveké osídlenie už v 12. storočí. Hrad bol súčasťou kráľovského majetku a strážil obchodné cesty do Poľska.',
    findings: [
      'Stredoveká keramika 12.-15. storočia',
      'Kovové nástroje a zbrane',
      'Architektonické články - gotika',
      'Renesančné kachle',
    ],
    images: [],
    bibliography: [
      'Plaček, M., Bóna, M. (2007): Encyklopédia slovenských hradov. Bratislava.',
    ],
  },
  {
    id: '5',
    slug: 'bojná',
    name: 'Bojná - Valy',
    period: ['slovania'],
    region: 'stredne',
    type: 'hradisko',
    category: ['kniezacie-sidla', 'strazna-hospodarska'],
    district: 'Topoľčany',
    coordinates: { lat: 48.6167, lng: 18.1667 },
    description: 'Rozsiahle hradisko s tromi opevnenými areálmi zo 9.-10. storočia. Nálezy elitných predmetov svedčia o vysokom spoločenskom postavení obyvateľov. Lokalita zrejme slúžila ako správne centrum a sídlo kniežaťa.',
    findings: [
      'Zlaté a strieborné ostrôžky',
      'Franské meče a sekerky',
      'Kostrové pohrebisko s militáriami',
      'Byzantské mince',
      'Bronzové karolínske opasky',
    ],
    images: [],
    bibliography: [
      'Pieta, K., Robak, Z. (2017): Bojná - Hospodárske a mocenské centrum Nitrianskeho kniežatstva. Nitra.',
    ],
    featured: true,
    excavated: true,
  },
  {
    id: '6',
    slug: 'pobedim',
    name: 'Pobedim',
    region: 'stredne',
    period: ['neolit'],
    type: 'sidlisko',
    category: ['staroveke-hradiska'],
    district: 'Piešťany',
    coordinates: { lat: 48.6000, lng: 17.8500 },
    description: 'Významné neolitické sídlisko kultúry s lineárnou keramikou. Výskumy odhalili komplexné sídliskové štruktúry vrátane dlhých domov a zásobných jám.',
    findings: [
      'Lineárna keramika',
      'Kamenné sekery a nástroje',
      'Zvyšky dlhých domov',
      'Obilné zrná (pšenica, jačmeň)',
    ],
    images: [],
    bibliography: [
      'Pavúk, J. (1980): Pobedim - neolitické sídlisko. Slovenská archeológia.',
    ],
  },
  {
    id: '7',
    slug: 'luzianky',
    name: 'Lužianky',
    period: ['bronz'],
    region: 'stredne',
    type: 'pohrebisko',
    category: ['staroveke-hradiska'],
    district: 'Nitra',
    coordinates: { lat: 48.3167, lng: 18.2667 },
    description: 'Rozsiahle pohrebisko zo staršej doby bronzovej (2200-1600 pred n.l.). Objavené boli desiatky kostrových hrobov s bohatými nálezmi bronzových predmetov.',
    findings: [
      'Bronzové dýky a sekery',
      'Zlato - náušnice a závesky',
      'Keramické nádoby',
      'Jantárové korále',
    ],
    images: [],
    bibliography: [
      'Bátora, J. (2000): Das Gräberfeld von Jelšovce. Kiel.',
    ],
  },
  {
    id: '8',
    slug: 'havranok',
    name: 'Havránok',
    period: ['zelezna'],
    region: 'stredne',
    type: 'kultove',
    category: ['staroveke-hradiska', 'svatyne'],
    district: 'Liptovský Mikuláš',
    coordinates: { lat: 49.0833, lng: 19.6167 },
    description: 'Keltské opevnené sídlisko a kultové miesto s výnimočnými nálezmi. Lokalita bola obývaná púchovskou kultúrou v mladšej dobe železnej. V skalnej štrbine bolo objavené kultové ohnisko.',
    findings: [
      'Grafitová keramika',
      'Železné nástroje a zbrane',
      'Kultové predmety - hlinené figuríny',
      'Skalné ohnisko s popolom',
    ],
    images: [],
    bibliography: [
      'Pieta, K. (1996): Havránok - Keltská osada. Martin.',
    ],
  },
  {
    id: '9',
    slug: 'zobor',
    name: 'Zobor',
    period: ['slovania', 'stredovek'],
    region: 'stredne',
    type: 'kultove',
    category: ['svatyne', 'povesti'],
    district: 'Nitra',
    coordinates: { lat: 48.3333, lng: 18.0667 },
    description: 'Hora Zobor nad Nitrou je spojená s legendou o sv. Svoradovi a Benediktovi. Archeologické nálezy potvrdzujú existenciu kláštora a pútneho miesta už v 11. storočí.',
    findings: [
      'Základy románskeho kostola',
      'Stredoveká mincová schránka',
      'Mníšske cely',
      'Náhrobné kamene',
    ],
    images: [],
    bibliography: [
      'Ruttkay, M. (2002): Zobor - kláštor pustovníkov. Nitra.',
    ],
  },
  {
    id: '10',
    slug: 'straze',
    name: 'Stráže',
    period: ['slovania'],
    region: 'vychodne',
    type: 'hradisko',
    category: ['refugia', 'strazna-hospodarska'],
    district: 'Michalovce',
    coordinates: { lat: 48.7500, lng: 21.9167 },
    description: 'Slovanské hradisko-refúgium s mohutným opevnením. Slúžilo ako úkryt pre obyvateľstvo okolitých sídlisk v časoch nebezpečenstva.',
    findings: [
      'Slovanská keramika 8.-9. storočia',
      'Zvyšky valovej hradby',
      'Ohniská a zásobné jamy',
      'Železné nástroje',
    ],
    images: [],
    bibliography: [
      'Fusek, G. (1991): Slovanské hradiská na východnom Slovensku.',
    ],
  },
];

export const mockArticles: Article[] = [
  {
    id: '1',
    slug: 'velka-morava-nove-objavy',
    title: 'Veľká Morava: Nové objavy v Bojnej menia pohľad na históriu',
    excerpt: 'Najnovšie výskumy na hradisku Bojná-Valy priniesli senzačné nálezy elitných predmetov z 9. storočia. Zlaté ostrôžky a franské meče potvrdzujúce kontakty s karolínskou ríšou.',
    content: `Archeologický výskum na lokalite Bojná-Valy v Nitrianskom kraji priniesol v posledných rokoch revolučné nálezy, ktoré významne menia náš pohľad na Veľkú Moravu a jej spoločenské elity.

## Hradisko s tromi opevneniami

Bojná predstavuje rozsiahly hradiskový komplex pozostávajúci z troch opevnených areálov. Celková rozloha presahuje 60 hektárov, čo z neho robí jedno z najväčších veľkomoravských hradísk. Poloha hradiska na strategickom mieste umožňovala kontrolu dôležitých obchodných ciest vedúcich údolím Nitry.

[IMAGE:0]

Výskumy ukázali, že hradisko bolo zaľudnené v 9. storočí a pravdepodobne slúžilo ako sídlo miestnej elity. Mohutné opevnenie tvoria zemné valy zosilnené drevenou konštrukciou a priekopami.

## Elitné nálezy

Medzi najvýznamnejšie objavy patria predmety, ktoré jednoznačne poukazujú na vysoký sociálny status obyvateľov hradiska:

- **Zlaté ostrôžky** – vzácny doklad jazdectva vyššej spoločenskej vrstvy
- **Franské meče** – importované zbrane z Karolínskej ríše s damaskovanou čepeľou
- **Byzantské mince** – solidus solidi zo 7.-8. storočia, dôkaz diaľkového obchodu
- **Bronzové karolínske opasky** – prestížne predmety elít s charakteristickou výzdobou
- **Strieborné náušnice** – šperky byzantine typu

[QUOTE:0]

[IMAGE:1]

## Význam pre históriu

Lokalita Bojná prepisuje predstavy o veľkomoravskej spoločnosti. Množstvo militárií, jazdeckých súprav a importovaných predmetov svedčí o prítomnosti profesionálnej vojenskej elity a intenzívnych kontaktoch s karolínskym západom.

Zaujímavé je aj geografické rozloženie nálezov – koncentrácia elitných predmetov v hornej časti hradiska naznačuje existenciu rezidenčnej zóny šľachty oddelenú od obytných priestorov bežného obyvateľstva.

[QUOTE:1]

## Metódy výskumu

Pri výskume sa používajú najmodernejšie metódy vrátane geofyzikálneho prieskumu, ktorý umožňuje nedeštruktívne mapovanie podpovrchových štruktúr. Radiokarbónové datovanie organických materiálov poskytuje presné chronologické údaje.

Výskumy pokračujú a každoročne prinášajú nové poznatky o život veľkomoravskej spoločnosti. Bojná zostáva jednou z kľúčových lokalít pre pochopenie vzostupu a rozkvetu Veľkej Moravy v 9. storočí.`,
    coverImage: 'https://images.unsplash.com/photo-1603939815245-7a8a07c79931?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGFyY2hhZW9sb2d5JTIwZXhjYXZhdGlvbnxlbnwxfHx8fDE3NjIxNzA2NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'Dr. Mária Novotná',
      avatar: '',
    },
    publishedAt: '2024-10-15',
    readTime: 8,
    tags: ['výskum', 'militárie', '9. storočie', 'archeologické nálezy'],
    category: 'vyskum',
    hradiskaCategory: ['kniezacie-sidla', 'vseobecne'],
    featured: true,
    keywords: [
      'Veľká Morava',
      'Bojná-Valy',
      'archeologický výskum',
      'zlaté ostrôžky',
      'franské meče',
      'karolínska ríša',
      'veľkomoravská šľachta',
      '9. storočie',
      'militárie',
      'byzantské mince'
    ],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1595433707802-6b2626ef1c91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        caption: 'Pohľad na hradisko Bojná-Valy s výrazným opevnením',
        position: 0
      },
      {
        url: 'https://images.unsplash.com/photo-1594223515878-1e2c4d5d8e23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
        caption: 'Replika zlatých ostrôžok nájdených v Bojnej, 9. storočie',
        position: 1
      }
    ],
    quotes: [
      {
        text: 'Nálezy z Bojnej dokazujú, že veľkomoravská šľachta disponovala hmotnou kultúrou porovnateľnou s karolínskou aristokraciou.',
        author: 'prof. Karol Pieta, Archeologický ústav SAV',
        position: 0
      },
      {
        text: 'Bojná predstavuje jeden z najdôležitejších archeologických projektov na Slovensku. Každá sezóna prináša nové objavy, ktoré prepisujú učebnice dejepisu.',
        author: 'Dr. Alexander Ruttkay, vedúci výskumu',
        position: 1
      }
    ],
    bibliography: [
      'Pieta, K., Robak, Z. (2017): Bojná – mocenské a christianizačné centrum Nitrianskeho kniežatstva. Bratislava: VEDA.',
      'Ruttkay, A. (2015): Frühmittelalterliche gesellschaftliche Eliten an der mittleren Donau. In: Archäologisches Korrespondenzblatt 45, s. 515-532.',
      'Turčan, V. (2012): Poznámky k hradisku v Bojnej. In: Slovenská archeológia 60, s. 153-178.',
      'Robak, Z. (2013): The Origins and the Collapse of the Great Moravian Empire. Leiden: Brill Academic Publishers.',
      'Fusek, G., Bednár, P. (2018): Chronológia veľkomoravských hradísk na Slovensku. Nitra: Archeologický ústav SAV.'
    ]
  },
  {
    id: '2',
    slug: 'metody-datovanie-archeologickych-nalezov',
    title: 'Moderné metódy datovania archeologických nálezov',
    excerpt: 'Radiokarbónová metóda, dendrochronológia a termoluminiscencia umožňujú presné datovanie artefaktov. Prehľad najpoužívanejších techník v slovenskej archeológii.',
    content: `# Moderné metódy datovania archeologických nálezov

Presné datovanie nálezov je kľúčové pre pochopenie dejín. V súčasnosti máme k dispozícii množstvo vedeckých metód.

## Radiokarbónová metóda (C14)

Najpoužívanejšia metóda pre organické materiály. Založená na rozpade rádiouhlíka s polčasom rozpadu 5730 rokov.

**Použitie:**
- Drevo, uhlie, kosti
- Rozsah: 50 000 rokov
- Presnosť: ±30-50 rokov

## Dendrochronológia

Datovanie podľa letokruhov stromov. Najspoľahlivejšia metóda s presnosťou na jeden rok.

## Termoluminiscencia

Použitie pre keramiku a vypálené materiály. Určuje čas posledného výpalu.

---

Kombinácia viacerých metód poskytuje najpresnejšie výsledky.`,
    coverImage: 'https://images.unsplash.com/photo-1612773085209-476549690cd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMHNjaWVuY2UlMjBsYWJvcmF0b3J5fGVufDF8fHx8MTc2MjIwMDc4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'Mgr. Peter Kovács',
      avatar: '',
    },
    publishedAt: '2024-09-22',
    readTime: 6,
    tags: ['metodika', 'datovanie', 'výskum'],
    category: 'metodika',
  },
  {
    id: '3',
    slug: 'devin-prehliadka-sezona-2024',
    title: 'Devín: Sprístupnená nová prehliadková trasa',
    excerpt: 'Hradisko Devín otvára novú archeologickú lokalitu pre verejnosť. Návštevníci môžu vidieť autentické slovanské valy a výsledky posledných výskumov.',
    content: `# Devín: Sprístupnená nová prehliadková trasa

Národná kultúrna pamiatka Devín otvára pre verejnosť novú archeologickú lokalitu.

## Čo uvidíte

- Rekonštruované slovanské valy z 9. storočia
- Archeologické sondáže in-situ
- Interaktívne panely s AR vizualizáciami
- Výhľad na sútok Dunaja a Moravy

## Praktické informácie

**Otváracie hodiny:** Apríl-október, 10:00-18:00  
**Vstupné:** 6€ dospelí, 3€ deti  
**Sprievodcovské prehliadky:** So, Ne 14:00

Tešíme sa na vašu návštevu!`,
    coverImage: 'https://images.unsplash.com/photo-1636668151697-6a1d7c988a71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN0bGUlMjBydWlucyUyMGZvcnRpZmljYXRpb258ZW58MXx8fHwxNzYyMjAwNzg5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'Ing. Jana Horváthová',
      avatar: '',
    },
    publishedAt: '2024-11-01',
    readTime: 3,
    tags: ['Devín', 'aktuality', 'verejnosť'],
    category: 'aktuality',
    hradiskaCategory: ['strazna-hospodarska', 'povesti'],
    featured: true,
  },
  {
    id: '4',
    slug: 'slovania-mytus-a-realita',
    title: 'Slovania na našom území: Mýtus a realita',
    excerpt: 'Príchod Slovanov v 6. storočí znamenal zásadný zlom. Archeologické nálezy však ukazujú kontinuitu s predchádzajúcim obyvateľstvom. Ako to bolo naozaj?',
    content: `# Slovania na našom území: Mýtus a realita

Otázka príchodu Slovanov patrí k najdiskutovanejším témam slovenskej archeológie.

## Tradičný pohľad

Tradične sa hovorí o "príchode Slovanov" v 6. storočí n.l. Tento pohľad vychádza z písomných prameňov (Prokopios, Jordanes).

## Archeologická realita

Archeologické výskumy však ukazujú zložitejší obraz:

- **Kontinuita osídlenia** – mnohé lokality boli osídlené aj pred 6. storočím
- **Postupná slavizácia** – zmena kultúry nebola náhla
- **Zmiešané obyvateľstvo** – spolužitie rôznych etník

## Pražský typ keramiky

Charakteristická slovanská keramika sa objavuje v 6. storočí, no jej výroba mohla byť preberaná aj neslovansk ými skupinami.

Dnešný konsenzus: Slovania priniesli jazyk a kultúrne vzorce, ale došlo k miešaniu s pôvodným obyvateľstvom.`,
    coverImage: 'https://images.unsplash.com/photo-1758092320133-cd36eea79f46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwc2xhdmljJTIwYXJ0aWZhY3RzfGVufDF8fHx8MTc2MjIwMDc4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'Doc. PhDr. Martin Furman, PhD.',
      avatar: '',
    },
    publishedAt: '2024-08-10',
    readTime: 10,
    tags: ['Slovania', 'etnogenéza', 'historia'],
    category: 'historia',
    hradiskaCategory: ['vseobecne', 'listiny'],
  },
  {
    id: '5',
    slug: 'refugia-uloha-a-vyznam',
    title: 'Refúgiá: Úkryt v časoch nebezpečenstva',
    excerpt: 'Hradiská-refúgiá slúžili ako dočasné úkryty pre obyvateľstvo. Ich rozloženie a charakter odhaľuje organizáciu slovanskej spoločnosti.',
    content: `# Refúgiá: Úkryt v časoch nebezpečenstva

Refúgiá predstavujú špecifický typ hradísk, ktoré neslúžili na trvalé osídlenie, ale ako dočasné úkryty.

## Charakteristické znaky

- **Veľká rozloha** – priestor pre mnoho ľudí a dobytka
- **Strategická poloha** – ťažko dostupné miesta
- **Minimum nálezov** – dôkaz krátkodobého pobytu
- **Mocné opevnenie** – ochrana pred nepriateľom

## Historický kontext

V období Veľkej Moravy sa refúgiá používali pri maďarských vpádoch. Obyvatelia okolitých sídlisk sa sem uchyľovali so svojím majetkom a dobytkom.

## Významné refúgiá

- **Pohanská** (okr. Břeclav) – najväčšie známe refúgium
- **Stráže** (okr. Michalovce) – východoslovenské refúgium
- **Žiar** (okr. Žiar nad Hronom) – stredoslovenské

Výskum refúgií pomáha pochopiť organizáciu obrany v slovanskom období.`,
    coverImage: 'https://images.unsplash.com/photo-1754310652304-6e68ca751dbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpZXZhbCUyMGhpbGxmb3J0fGVufDF8fHx8MTc2MjIwMDc4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'PhDr. Ján Dekan, CSc.',
      avatar: '',
    },
    publishedAt: '2024-07-20',
    readTime: 6,
    tags: ['refúgiá', 'obrana', 'hradiská'],
    category: 'vyskum',
    hradiskaCategory: ['refugia', 'vseobecne'],
  },
  {
    id: '6',
    slug: 'svatyne-a-kultove-miesta',
    title: 'Pohanské svätyne a kresťanské kostoly',
    excerpt: 'Archeologické výskumy odhaľujú kontinuitu medzi pohansk ými kultovými miestami a kresťanskými chrámami. Príklad synkretizmu v dejinách Slovenska.',
    content: `# Pohanské svätyne a kresťanské kostoly

Mnohé kresťanské kostoly boli postavené na miestach starších pohanských svätýň.

## Pohanské svätyne

Slovania uctievali bohov na výšinných miestach:

- **Skalné útvary** – prirodzené svätyne
- **Posvätné háje** – prírodné chrámy
- **Studničky** – kultu vody

## Christianizácia

S príchodom kresťanstva sa tieto miesta často christianizovali:

- Postavenie kaplniek a kostolov
- Zasvätenie sv. Jurajovi (boh hromu Perun)
- Prechod pútí na kresťanské sviatky

## Archeologické dôkazy

- **Havránok** – keltská svätyňa s ohniskami
- **Zobor** – pustovnícky kláštor na posvätnom vrchu
- **Devín** – pokračovanie kultového miesta

Toto je typický príklad kultúrnej kontinuity v dejinách.`,
    coverImage: 'https://images.unsplash.com/photo-1762008219710-374f93bef58d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwc2FjcmVkJTIwcGxhY2V8ZW58MXx8fHwxNzYyMjAwNzkwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    author: {
      name: 'Mgr. Eva Benková',
      avatar: '',
    },
    publishedAt: '2024-06-15',
    readTime: 7,
    tags: ['svätyne', 'náboženstvo', 'christianizácia'],
    category: 'historia',
    hradiskaCategory: ['svatyne', 'povesti'],
  },
  {
    id: '7',
    slug: 'listiny-o-hradiskach',
    title: 'Stredoveké listiny a ich význam pre výskum hradísk',
    excerpt: 'Písomné pramene dopĺňajú archeologické nálezy. Listiny z 11.-14. storočia poskytujú cenné informácie o hradiskách a ich obyvateľoch.',
    content: `# Stredoveké listiny a ich význam pre výskum hradísk

Písomné pramene sú neoceniteľným zdrojom informácií o hradiskách.

## Typy listín

**Zakladacie listiny** – kláštory, mestá
- Zobor (1111) – najstaršia zmienka o kláštore
- Spišská Kapitula (1209) – majetky kanonikov

**Darovacie listiny** – panovnícke dary
- Informácie o vlastníkoch hradov
- Hranice majetkov

**Súdne spory** – majetkové konflikty
- Presné opisy lokalít
- Mená majiteľov

## Význam pre archeológiu

Listiny pomáhajú:
- Datovať archeologické nálezy
- Identifikovať historické osobnosti
- Rekonštruovať historický kontext

## Príklady

Nitrianske hradisko: "Pribina enim dux Nitrensis" - Pribina, nitrianski knieža (828)

Kombinácia archeologického a historického výskumu prináša komplexný obraz minulosti.`,
    coverImage: '',
    author: {
      name: 'Prof. PhDr. Dušan Třeštík, DrSc.',
      avatar: '',
    },
    publishedAt: '2024-05-10',
    readTime: 9,
    tags: ['listiny', 'písomné pramene', 'diplomatika'],
    category: 'metodika',
    hradiskaCategory: ['listiny', 'vseobecne'],
  },
];

// Helper funkcie pre filtrovanie
export function filterSites(
  sites: Site[],
  filters: {
    period?: Period[];
    region?: Region[];
    type?: SiteType[];
    search?: string;
  }
): Site[] {
  return sites.filter((site) => {
    if (filters.period && filters.period.length > 0) {
      if (!site.period.some((p) => filters.period!.includes(p))) return false;
    }
    if (filters.region && filters.region.length > 0) {
      if (!filters.region.includes(site.region)) return false;
    }
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(site.type)) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        site.name.toLowerCase().includes(searchLower) ||
        site.description.toLowerCase().includes(searchLower) ||
        site.district.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });
}

export function filterArticles(
  articles: Article[],
  filters: {
    category?: string;
    tags?: string[];
    search?: string;
  }
): Article[] {
  return articles.filter((article) => {
    if (filters.category && article.category !== filters.category) return false;
    if (filters.tags && filters.tags.length > 0) {
      if (!article.tags.some((t) => filters.tags!.includes(t))) return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });
}
