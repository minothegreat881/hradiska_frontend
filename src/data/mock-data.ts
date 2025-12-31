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
  gallery?: { url: string; caption: string; alt?: string }[];
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
    id: '101',
    slug: 'bojna-vyznamne-velkomoravske-centrum',
    title: 'Bojná - Významné Veľkomoravské centrum',
    excerpt: 'Bojná I. – Valy je včasno stredoveká lokalita, ktorá vznikla pravdepodobne na prelome 8. a 9. storočia. Leží v pohorí Považský Inovec a predstavuje jedno z najvýznamnejších veľkomoravských hradísk s mimoriadnymi nálezmi plakiet, zvonov a militárií.',
    content: `Bojná I. –Valy, ako sa vlastne táto včasno stredoveká lokalita nazýva, vznikla pravdepodobne na prelome 8. a 9. storočia, či v prvých decéniach 9. storočia. Leží v pohorí Považský Inovec na skalnom výbežku hlavného masívu vo výške 390-430 m.n.m. V strednej dobe hradištnej bolo toto pohorie popretkávané mnohými komunikáciami, ktoré predstavovali najvhodnejšie spojenie medzi Ponitrím a Považím. Dôležitosť daných priechodov podtrhuje veľké množstvo lokalít z danej doby na oboch stranách Považského Inovca. V Nitriansku sú to okrem Bojnej I. i Bojná II. A III., Marhát, Úhrad či Nitrianska Blatnica –Jurko. Na Považskej strane leží Pobedim, Ducové a Hrádok. Všetky lokality sú navzájom ľahko dosiahnuteľné v krátkom časovom intervale.

Pohľad na hradisko od východu (Naj)

Pohľad na Bojnú a okolie z vrchu Marhát (Naj)

Keď sa k vyššie spomenutým faktom pridá husté osídlenie nielen na akropole  a predhradí, ale i mimo opevnení, spolu so zaujímavými nálezmi, ktorým sa budeme venovať nižšie, a výsledkami monntálnej archeológie, ktorá objavila vyťažené ložiská železnej rudy, rôzne lomy i ťažobné jamy, je celkom opodstatnené zaradiť Bojnú I. medzi významné lokality nielen v rámci Nitrianskeho kniežactva, ale aj v rámci celej Veľkomoravskej ríše. Ako uvádzajú najnovšie interpretácie archeológov (

PhDr. Karol Pieta, DrSc., Vedecká cukráreň, 27. 10. 2009), Bojnú možno na základe posledných výskumov označiť za rozsiahlu  aglomeráciu, zahrňujúcu nie len hradisko Bojná I, ale aj  Bojná II, III a najnovšie aj Bojná IV, ktorú Karol Pieta uvádza v spomínanej vedeckej diskusii. Svojím spôsobom by sa dala Bojná prirovnať k Mikulčiciam, a to z toho pohľadu, že k jej zániku došlo podobne náhlym spôsobom, ale najmä - na rozdiel od mnohých ďalších lokalít na Slovensku, kde na základoch hradiska neskôr vznikali stredoveké mestá a tým sa postupne zničili pôvodné zástavby, či vzácne predmety, Bojná bola jednou z mála lokalít, kde po zániku už  nepokračovalo trvalé osídlenie a zničené hradisko postupne upadlo do zabudnutia aj so všetkým bohatstvom, ktoré sa tam v čase náhleho zániku nachádzalo. Z tohto dôvodu Je teda Bojná, podobne ako Mikulčice, Pompeje a podobne úžasným zdrojom poznania pre dnešnú archeológiu. Škoda je len, že skôr ako sa spamätali archeológovia, objavili Bojnú rôzni hľadači pokladov, ktorí bezpochyby spôsobili veľké škody tým, že sa zmocnili najzaujímavejších nálezov. Na druhej strane však treba povedať, že napr. slávne pozlátené plakety boli nájdené práve takýmto hľadačom, ktorý  plakety odovzdal.

[IMAGE:0]

Hradisko je obličkového tvaru, os pozdĺžna je dlhá cca 600m a osi priečne majú od 200 po 300 metrov. Celková plocha akropole i s predhradím činí skoro 14 ha. Okolo celého areálu sa vinie veľmi dobre zachovaný val, ktorý dosahuje na vnútornej strane výšku 3-5 m a z vonkajšej až 10m, pričom jeho základňa je široká asi 18,5 m. Hlavný

[IMAGE:1]

val je zbudovaný roštovou konštrukciou a z vonkajšej strany vyložený nasucho kladenou kamennou plentou.

Pred valom je predsunutá

, tento spôsob fortifikácie sa ešte raz opakuje v menšom prevedení okolo hradiska a na západe je ešte jeden val. Celkovo bolo opevneniu na západnej strane venované omnoho viac času a i ostatné hradiská v nitrianskej časti majú v západných častiach zosilnenú fortifikáciu. Je jasné, že obyvatelia Ponitria očakávali útok od Váhu, ako potencionálny nepriateľ prichádza do úvahy Moravské kniežatstvo, avšak rovnako sa mohlo jednať aj o iný významný Slovanský kmeň z Považia, napr. sídliaci na Divinke pri Žiline. Hlavná línia valu je prerušená v dvoch naproti stojacich bránach, ktoré sú umiestnené na pozdĺžnej ose hradiska. Obe sú kliešťovitého tvaru , čiže sú zalomené dnu do areálu. Týmito bránami viedla cez hradisko cesta. Obdobne bol usporiadaný vo svojich počiatkoch i Pražský hrad. Zvláštne, neobvyklé umiestnenie brán na pozdĺžnej osi hradiska a zároveň na ceste z Ponitria na Považie nasvedčuje tomu, že Bojná mala zrejme okrem iného aj funkciu akejsi Mýtnej stanice - každý (predovšetkým kupci) kto chcel prejsť cez tento dôležitý horský priechod, nemohol obísť Bojnú, musel sa tu zastaviť, zaplatiť a zároveň mal priestor na ponúknutie svojho tovaru, či zakúpenie iného.

[IMAGE:2]

Podľa správy z výskumu hradiska

[IMAGE:3]

z roku 2008, sa v strednej časti vnútorného areálu hradiska odkryli

zahĺbené i nadzemné obytné objekty s kamennými a hlinenými pecami a výrobné dielne, ale aj veľká stavba s kamennou podmurovkou

. Podľa výsledkov sondáže bolo

predhradie chránené širokou priekopou vyhĺbenou do skalného podložia a valom s roštovou vnútornou konštrukciou a prednou kamennou plentou.

bol prerezaný vo východnej časti hradiska, kde jeho profil bol vysoký od podložia 530 cm.

[IMAGE:4]

Jeho jadro bolo prekladané drevenými roštami, ktoré z oboch strán držali rady stĺpov spojených prúteným výpletom

. Čelná časť nad vonkajšou priekopou bola vybudovaná zrubovou technikou. Zvnútra konštrukcie boli zrubové komory. Vo viacerých z nich sa našli hromadné nálezy. Obe stavebné fázy valu boli zničené požiarom.  Počas výskumu sa našlo množstvo keramiky a 800 inventárnych čísiel predmetov. K významným nálezom patrí srdce ďalšieho zvona, pozlátené bronzové kovania, početné ostrohy a viaceré fragmenty krúžkového panciera.

V roku 2008 boli v stredovej časti hradiska odkryté obytné zahĺbené i nadzemné objekty s kamennými či hlinenými pecami. Rovnako sa našli výrobné dielne a veľká stavba s kamennou podmurovkou.

. Prvé z nich patrí do obdobia

Pribinovho kniežatstva,

[IMAGE:5]

teda začiatku 9. storočia. V tomto období Bojná pravdepodobne zaznamenala najväčší rozmach a zároveň bola prvý raz zničená. Druhý raz hradisko spustošili začiatkom 10. storočia

útoky staromaďarských vojsk.

Presnejšie datovanie sa získalo pomocou dendrochronológie, pričom podľa Karola Pietu, jeden z trámov, ktorý tvoril okraj komory hradby bol pomocou dendrochronológie datovaný do roku 894 - tzn. v roku, kedy zomrel kráľ Svätopluk a na Veľkomoravský stolec nastúpil jeho syn Svätopluk II. Z uvedeného je teda zrejmé, že v roku 894 došlo v Bojnej k novým opevňovacím prácam, kedy zrejme staré trámy, ktoré v tom čase už mali niekoľko desaťročí a možno teda predpokladať, že neboli v dobrom stave, boli nahradené novými, čím sa zlepšila obranyschopnosť hradiska. Kedy presne došlo k druhému zničeniu hradiska sa zatiaľ nevie, možno iba predpokladať, že to mohlo byť po bitke pri Bratislave roku 906. Keďže  zánikovej vrstve sa okrem staromaďarských šípov nachádza aj množstvo nemaďarských, toto môže viesť k domnienke, že už v tomto čase maďarské vojská spolupracovali s niektorými domácimi veliteľmi, resp. vojskami. Môže to byť odraz vnútornej nestability Veľkej Moravy po smrti silného panovníka, kedy niektorí veľmoži zrejme nemali záujem na ďalšej existencii centrálnej moci a spájali sa aj s lúpeživými nájazdníkmi za účelom jej rozbitia.    Celková doba trvania hradiska bola zatiaľ ustálená na 120 rokov.

Z lokality Bojná – Valy I. pochádza 5 depotov, súbor plakiet, zvon a množstvo drobnejších nálezov. Veľká časť z nich patrí do blatnicko- mikulčického horizontu.

Helma zrejme slovanského bojovníka z Bojnej a časť krúžkového závesu z helmy. Tento európsky unikát ukradol z hradiska detektorista a následne predal na aukcii. Slovensko tak prišlo o mimoriadne cenný artefakt z dávnej slovanskej histórie. Za informácie ktoré povedú k vypátraniu helmy ponúkame odmenu vo výške niekoľko stoviek Eur. (foto z knihy K.Pieta a kol.: Bojná 2)

[IMAGE:6]

Našlo sa 6 plakiet z pozlátenej mede s rôznym stupňom zachovalosti a zopár nezaradených úlomkov, pravdepodobne z týchto plakiet. Ďalej 3 pásikavé obruby rovnako z pozlátenej mede, spojené do kruhu z jedného kusu plechu, alebo z 2 či viacerých častí. Dva z nich sú celé, tretí sa zachoval vo fragmente. Pri pokuse o rekonštrukciu usporiadania plakiet a obrúb sa vychádzalo z ich počtu, vzájomnej závislosti jednotlivých artefaktov s dôrazom na symetriu a významovú hierarchiu.

Plakety majú dvojaký tvar a veľkosť. Našli sa 4 kruhové s priemerom 150 mm, 2 majú tvar rovnoramenného krížu a priemer 133 mm. Kruhové plakety 1,2 a 3 sú lemované obrubou zdobenou striedavo prázdnymi a bodkovaním vyplnenými trojuholníkmi, plaketa 4 sa od nich odlišuje lemovaním v podobe línie polkruhových oblúkov. Okraje plakiet v tvare kríža sú ukončené dvojitými pásmi perličkového puncovania.

[IMAGE:7]

Jednou z dôležitých otázok je funkcia troch kruhových obrúb, z ktorých dva celé exempláre boli odovzdané spolu s plaketami a neúplný tretí exemplár, pozostávajúci z troch fragmentov, sa našiel pri revíznom výskume na mieste dávnejšieho nálezu. Jednou z možností je, že celé kruhy rovnakého typu mohli predstavovať obrubu oboch krížových plakiet. Nie je to však isté. Mohli totiž predstavovať i rám iných obrazcov, ktoré sa nezachovali a dokonca mohli byť aj z organického materiálu, napr. textilu. Podľa tejto rekonštrukcie by pôvodný súbor mohol pozostávať zo siedmych plakiet.

Podstatná časť obruby 3 sa našla počas výskumu priamo na mieste nálezu, zrejme ešte v polohe in situ celého súboru. Zostáva predmetom ďalších úvaha kombinácií, či táto tretia obruba bola použitá rovnako ako druhé dve – na orámovanie ďalších, alebo zdôrazňovala význam jednej z kruhových plakiet, ako jej druhé, vonkajšie orámovanie. Preto sa čiastočne od dvoch kompletných rámikov odlišuje, mohla byť aj súčasťou ďalšej možno centrálnej siedmej plakety, ktorá v depote nebola, prípadne sa nezachovala. Karol Pieta a Alexander Ruttkay sa prikláňajú k téze o 7 plaketách, z ktorých 3 boli obopnuté kruhovými obrubami. Siedma plaketa by mala byť centrálnou a zobrazovať Krista. Súbor bol pravdepodobne súčasťou prenosného oltára altare portabile. V takýchto skrinkách sa uchovávali buď liturgické predmety, alebo ostatky svätých. Občas skrinka obsahovala jedno i druhé spoločne. Tieto prenosné oltáre boli zdobené obyčajne výjavmi z evanjelií a anjelmi, či inými posvätnými bytosťami. Odborníci odhadujú jeho veľkosť minimálne na300x600x300 (mm). Veľmi zaujímavým objavom sú písmená na dvoch nižšie spomenutých plaketách. Patria do sféry latinského západného kresťanstva, avšak na písmenách môžeme pobadať grécky vplyv.

Datovanie plakiet je nepriame, zakladá sa na datácii ostatných nálezov z Bojnej I. ktoré náležia do počiatku prvej polovice 9.stor. Skupina nemeckých bádateľov, ktorá sa podujala zrekonštruovať prenosný oltár, sa ustálila na datovaní medzi rokmi 780 a 820 n.l.

[IMAGE:8]

Plakety sú kruhové a krížové. Kruhové pravdepodobne tvorili akúsi obrubu tým krížovým.

[IMAGE:9]

Na danej plakete sa nachádza postava muža s hlavou en face, ktorá má na pozadí útvar pripomínajúci maltézsky kríž. Postava má v pravom uhle zdvihnutú ľavú ruku. Spod lakťa vytŕča pravdepodobne perie. Na pravej strane ruka absentuje, zato je však vidno celé krídlo. Postava je odetá v suknici. Pod ľavou rukou sa nachádzajú latinské písmená SVAVM Pravdepodobne sa jedná o Krista s krídlami, tzv Christus-Engel. Tento typ postavy vznikol asi redukciou anjelov pôvodne stojacich po jej bokoch.

Jedna z možností vizualizácie oltárika (K. Pieta)

Zobrazuje stojacu mužskú postavu so zdvihnutými rukami. V ľavej drží predmet v v tvare písmena T s rozšírenou základňou. V pozadí rúk si opäť môžeme všimnúť trojice pier, predstavujúcich krídla. Táto osoba by mohol byť sv. Anton Pustovník, pretože spomínaný predmet tvaru T môže byť Antonský kríž v kombinácii s zvončekom, čo sú atribúty tohto svätca. Práve sv. Anton stojí na počiatku kresťanských pútnických tradícií a vzniku kláštorných komunít.

Značne poškodená plaketa má v centrálnej časti symetricky umiestnenú postavu muža opäť v pozícii en face. Ruky má zložené na hrudi a nad plecami roztvorené krídla. Po ľavom boku má postava latinské písmená ...NDE

[IMAGE:10]

Najviac poškodená plaketa. Od ostatných kruhových plakiet sa líši, tým, že obruba nie je vyplnená trojuholníkmi, ale oblúčikmi. Postava en face, ruky sú pozdvihnuté v adoračnom geste. Krídla sú zložené pod rukami.

Prakticky v celku zachovaná plaketa. V strede je zobrazená mužská postava s mierne pozdvihnutou hlavou, z ktorej na oboch stranách dohora smerujú zaoblené vlasy, či plamene. Na hrudi má postava buďto ruky zopäté v modlitbe, alebo je to plastrón, čiže dvojitá náprsenka. Roztiahnuté krídla vychádzajú priamo z pliec.

Zobrazuje vzpriamenú postavu. Má dva páry krídel, z toho jeden pár zložený na hrudi a druhý po pravej strane trupu. Ruky má rozpažené so stúpajúcou tendenciou. Súbor dopĺňajú 3 obruby so šírkou 19- 20 mm a priemerom 190-192 mm. Výzdoba pozostáva z striedajúcich sa trojuholníkov, rovnako ako na kruhových plaketách.

Zvon bol objavený v severovýchodnej časti hradiska. Je zachovaný, ako jeden celok ak nerátame železné srdce, ktoré sa našlo v tesnej blízkosti zvonu. Výška zvona je 160 mm, vonkajší priemer úderového venca je 192 mm a hrúbka steny od 2-6 mm. Hmotnosť je 2180g. Srdce meria na dĺžku 170 mm a váži 200g. Zvonová zliatina obsahuje valný podiel medi doplnenej o cín, olovo, železo a striebro.

[IMAGE:11]

V areáli hradiska sa našli ešte 2 fragmenty z plášťa zvona a druhé srdce .. Po metalografických analýzach sa zistilo, že fragmenty pochádzajú z 3 rôznych zvonov. Vhodné analógie k zachovanému zvonu sa nachádzajú najmä v Taliansku( Canino, Vatikán) a Nemecku (Verden, Oldenburg- srdce zachovaného zvona z Bojnej je typologicky zhodné so srdcom tohto zvona) Talianske zvony sú datované k prelomu 8. a 9. storočia a nemecké na začiatok 9 stor. Otázka prečo boli 2 zvony úplne rozbité môže súvisieť s možnými náboženskými konfliktmi starého pohanského náboženstva s nastupujúcim kresťanstvom. Zvony mohli byť v rámci takéhoto konfliktu symbolicky zničené. Možnosť  akéhosi pohanského povstania by mohla byť aj jednou z príčin prvého zničenia hradiska v časoch Pribinu - či hradisko zničili vojská Mojmíra zatiaľ nevieme s istotou povedať.

[IMAGE:12]

Keďže v okolí Bojnej sa nachádzajú sakrálne stavby( rotundy v Ducovom a Nitrianskej Blatnici sú proporčne veľmi podobné kostolu 6 v Mikulčiciach) s pôvodom v adriatickej oblasti, uvažuje sa o misijnej ceste práve z tejto oblasti. Túto domnienku môže potvrdiť i fakt, že v roku 796 sa konala synoda priamo vo vnútrozemí Frankami porazených Avarov, niekde „na brehoch Dunaja", a jej cieľom bolo pripraviť program christianizácie, danej oblasti čím sa otvorila cesta i do Ponitria hlavne pre bavorských a aquilejských misionárov.

Z ostatných nálezov určite stojí za zmienku bronzové pozlátené nákončie, ktoré je vyhotovené technikou vruborezu . Zaujímavosťou určite je, skoro identické nákončie sa našlo v pohrebnej výbave muža z Modrej pri Velehrade. Je dôležité si uvedomiť, z včasného stredoveku nepoznáme, okrem tohto prípadu, dve ani len podobné predmety tohto typu s vruborezou výzdobou. Preto je, možné že obe nákončia pochádzajú z jednej dielne, či dokonca od jedného majstra.

Najpočetnejšie sú stavebné prvky, ako sú skoby, klince, háky. Ďalej sa tu našlo 201 sekerovitých hrivien v jednom depote a v blízkom okolí hradiska tiež približne rovnaký počet. Rovnako sa tu vyskytuje množstvo nožov, sekier, dlát,pílok,poriezov, lyžicovitých vrtákov, železné kovania vedierok a jedna reťaz zložená z 21 ohniviek, tieto premety ukazujú na vcelku rozvinutú remeselnú výrobu. Vyššie spomenutú ťažbu železa a jeho spracovanie i inú metalurgickú činnosť potvrdzuje množstvo trosky, bronzových zliatkov, kováčskeho odpadu a špecializované nástroje pre túto činnosť.

Dokladom poľnohospodárstva sú 2 typy kosákov ( zaoblený predlžený typ a typ s krátkym nožovitým ostrím), otky, čeriesla, motyky, radlice a krájadlá. Z militárií sa našli romboidné šípky s tŕňom, v menšom zastúpení sú šípy so spätnými háčikmi a dlhou tulajkou, sekery, krížové kovania, a botka z kopije. Slovania však pravdepodobne konce kopijí týmto spôsobom nechránili, čiže môže ísť o import. Z konského postroja sa našli zubadlá, strmene a ostrohy. Jedna z ostrôh je tauzovaná zlatom. Najnovším objavom sú viaceré fragmenty krúžkových zbrojí. Tiež sa našlo množstvo kovových súčastí kroja, ako už spomínané nákončie, či kovanie kovania a pracky. Mnohé sú pozlátené, či tauzované striebrom. Pravdepodobne dokladom obchodu sú dve bronzové závažia

Na lokalite Bojná I. -Valy prebieha systematický výskum, nejedná sa iba o náhodné sondy.  Ciele výskumu zhrnul vedúci výskumu Karol Pieta z Archeologického ústav Slovenskej akadémie vied v Nitre. „Kde je misia, tam je aj kostol. Mohol však byť aj drevený a vtedy by sa nemusel zachovať" Predpokladá, že okrem toho nájdu domy, výrobné dielne, cintoríny a azda aj stavby palácového typu. Pieta zdôraznil, že opevnenie je mimoriadne veľké, preto bude výskum technicky aj finančne náročný.

[IMAGE:13]

"Archeologický výskum v Bojnej v okrese Topoľčany bude pokračovať aj v ďalších rokoch. Slovenská akadémia vied vyčlenila vo svojom rozpočte financie na terénny výskum na tento rok. Na roky 2012, 2013 a 2014 sa archeológom podarilo získať peniaze v rámci projektu, ktorý schválila Agentúra na podporu výskumu a vývoja. Dotácia je zároveň určená aj na výskumy ďalších významných nálezísk zo včasného stredoveku ako sú Bíňa, Pobedim či Majcichov.

Výskum na Bojnej sa spravidla začína v júni a trvá do neskorej jesene. „V tomto roku plánujeme ukončiť výskum veľkého opevnenia hradiska, ktorý je veľmi dôležitý pre presné časové zaradenie náleziska a pre poznanie stavebných techník z deviateho a začiatku desiateho storočia," povedal pre agentúru SITA vedúci výskumu Karol Pieta z Archeologického ústavu SAV v Nitre. Svoju pozornosť archeológovia zamerajú aj na slovanské mohyly, ktorých sa tu doteraz podarilo nájsť päť. Zatiaľ preskúmali len najväčšiu z nich s priemerom 15 metrov. „Žiaľ, ide zrejme len o symbolický hrob a navyše bol aj vykradnutý. Je však veľmi zaujímavý z hľadiska pohrebných rituálov," uviedol Pieta. V mohyle sa našli zvyšky pohrebnej hranice, pohrebnej hostiny, zvieracie kosti a zbrane. Pravdepodobne tu symbolicky pochovali bojovníka, ktorý padol mimo Bojnej.

[IMAGE:14]

Najzaujímavejším vlaňajším nálezom bolo koncové kovanie pošvy meča, bohato zdobené striebrom. Znázornené sú na ňom vzlietajúce sokoly. „Je to nález, ku ktorému sa zatiaľ nepodarilo nájsť žiadnu paralelu a bezpečne demonštruje prítomnosť najvyššej spoločenskej vrstvy tej doby," poukázal Pieta. V minulej výskumnej sezóne sa archeológom zároveň podarilo spresniť systém urbanizmu osady, ktorá sa nachádzala vo vnútri hradiska. V jej strede sa našli dva rozmerné objekty, z ktorých sa zachovali podmurovky základov. Svojou veľkosťou i nálezmi v ich blízkosti sa dajú jednoznačne spájať s prítomnosťou spoločenskej elity, skonštatoval Pieta. Osadu tvorili dvorce, ktoré pozostávali zo zemníc a nadzemných hospodárskych stavieb. Zemnice sú typické slovanské obydlia s kamennou pieckou, vytesané do podložnej skaly. Najlepšie zachované objekty chcú vedci v budúcnosti prezentovať verejnosti."

V bezprostrednej blízkosti hradiska Valy sa nachádzajú ďalšie 2 hradiská, označované ako Bojná II a Bojná III. Pieta k hradisku Bojná II okrem iného uvádza:

"Vyvýšenina „Hradisko" (335 m n. m.) v severnej časti katastra obce Bojná, okr. Topoľčany, kontroluje úžinu údolia riečky Bojnianka, pozdĺž ktorej viedla stará, dnes sotva využívaná cesta medzi Považím a Ponitrím cez pohorie Považský Inovec. Sondážami získané materiály potvrdili osídlenie z konca staršej doby rímskej, z doby sťahovania národov a zo včasného stredoveku, pravdepodobne z počiatku 9. storočia. V teréne je pomerne dobre viditeľný zložitý systém opevnenia, ktoré dopĺňa prirodzenú ochranu tohto miesta - strmé zrázy na západnej a južnej strane a hlbokú strž na severovýchode lokality (obr. 2). Valový násyp prebiehajúci po obvode plošiny je najvyšší oproti ľahko prístupnej šiji na severe. Fortifikácia je v tejto časti výrazná, tvorí ju línia zdvojenej sústavy valu a priekopy. Tu je tiež vchod do areálu, prechádzajúci kolmo na opevnenie. Jeho dnešná šírka (nevieme či pôvodná alebo recentne rozšírená) je cca 3 m. Smerom na západ opevnenie pokračuje len 25-30 m a nadväzuje naň línia, ktorá sa končí nad strmým svahom kopca. Vonkajší val v týchto miestach dosahuje výšku 3-3,5 m. Ďalej od vchodu - smerom na východ línia obvodového opevnenia spolu so svahom mierne klesá a za-táča sa smerom na juhovýchod. Z tohto obvodového opevnenia kolmo severným smerom vybieha ďalší val s priekopou na západnej strane, dlhý približne 85 m. Tak sa vytvorilo opevnené predhradie.V bode spojenia oboch valov je v teréne vidno malé zvýšenie, ktoré evokuje existenciu veže.

[IMAGE:15]

Na Hradisku sa okrem keramiky našlo viacero ojedinelých mincí, spony a ataša bronzovej kanvice. Dva denáre Marka Aurélia i ďalšie predmety patria jednoznačne do druhej polovice 2. storočia. V tejto dobe, kedy na území Slovenska žili Germáni, a ktorá približne zodpovedá obdobiu tzv. markomanských vojen, sa v severnej časti Karpatskej kotliny objavuje celý rad výšinných sídlisk, pravdepodobne refúgií, a to na území švábskeho osídlenia na západnom a strednom Slovensku, ako aj na starých a nefunkčných hradiskách zanikajúcej púchovskej kultúry na severe nášho územia (Pieta 1994). Predpokladáme, že Hradisko, podobne ako mnohé iné polohy, slúžilo v nepokojných časoch druhej polovice 2. storočia ako výšinné sídlisko - refúgium na ochranu miestnych komunít z husto osídleného považského regiónu v okolí Pobedima alebo z dosiaľ neidentifikovanej sídliskovej zóny v priľahlej časti povodia Nitry.V Bojnej II sú najviac zastúpené nálezy z doby sťahovania národov. Rozptýlené boli vo vnútri, ale aj mimo plochy opevnenia.

Bojná II (http://hiking.sk/hk/ga/30367/hradisko_na_hradisku.html)

Na hradisku sa našiel aj vzácny depot mincí, ktorý pozostával z pätnástich ošúchaných bronzových mincí s koncovou razbou Valentiniá-na I. Takéto hromadné nálezy sú charakteristické pre staršiu fázu sťahovania národov v severnej časti stredného Podunajska, kde zrejme staré mince nahradzovali chýbajúce obeživo. Zaujímavým novým prvkom v danom prostredí sú zlomky kovových súčastí rímskych či federátnych vojenských opaskov - pracky so zvieracími hlavičkami a ozdobné kovania. Sú dokladom stykov tejto okrajovej podhorskej oblasti s provinciami a hlavne s limitným územím v záverečnej etape rímskej správy. Pre určenie konca osídlenia má význam bronzová oblúková spona s tromi lúčmi na polkruhovitej záhlavnej doštičke, ktorú môžeme spoľahlivo datovať do druhej polovice 5. storočia. Niektoré nálezy dokazujú stopy prítomnosti vyššej spoločenskej vrstvy. Výšinné sídliská sú charakteristickým fenoménom počiatku sťahovania národov, a to v pridunajskej oblasti s neskorosvébskym osídlením, ako aj na severe Slovenska s osídlením severokarpatskej skupiny. Len v poslednej dobe sa objavili aj lokality, ktoré evidentne existovali aj okolo polovice 5. storočia. Podľa ojedinelých nálezov sa niektoré z nich využívali aj na konci 5. a na začiatku 6. storočia. Dobrým príkladom je prezentované sídlisko Bojná II. Doterajšie slovanské nálezy z polohy Bojná II nie sú početné, avšak v menšej miere predsa len sú zastúpené. Opevnenie v Bojnej II, s výraznou dvojitou hradbou na severnej strane, nebolo dosiaľ datované. Môžeme však predpokladať, že muselo byť postavené, prípadne obnovené či prebudované vo včasnom stredoveku, kedy poloha plnila hlavne vojensko-strážnu funkciu. Systém zdvojených pásiem priekop s valmi sa opakuje aj v prípade oboch ďalších evidentne včasnostredovekých fortifikácií v Bojnej."

[IMAGE:16]

Foto hradiska Bojná II (autor - Ľubomír Červený):

Ostatné fotografie hradiska Bojná III od autora Ľubomíra Červeného si môžete pozrieť v tomto

[IMAGE:17]

K. Pieta poznatky k tretiemu hradisku zhrnul nasledovne:

"Medzi Hradskou dolinou s hradiskom Bojná I a údolím Bojnianky leží nízky horský chrbát, ktorý tvorí súčasť rozsiahlejšieho masívu - Zihľavníka. Na mieste jeho obojstranného zúženia bolo vybudované v teréne pomerne málo zreteľné zemné opevnenie, vytvárajúce zložitý systém priekop a valov. Na severe, na juhu a na východe sú násypy s priekopami viditeľné len miestami a ich celý priebeh nebol dosiaľ bezpečne zistený a zameraný Na západnej strane (podobne ako v prípade Bojnej I) bol areál opevnený dvojitou líniou priekop a valov, s dvomi priechodmi cez obe fortifikačné pásma. Dnešná lesná cesta prechádza stredom priečne cez návršie vedených valov priechodom, ktorý bol zrejme urobený v novej dobe. Horský chrbát sa dodnes využíva ako pohodlná lesná cesta bez veľkých výškových rozdielov. Je preto pravdepodobné, že aj v minulosti sa táto komunikácia využívala (možnože hlavne v zimných mesiacoch, keď boli doliny ťažko priechodné). Opevnenie III, podobne ako v prípade Bojnej I a II, vzniklo kvôli kontrole viacerých línií tej istej diaľkovej cesty. Fortifikácia nebola dosiaľ skúmaná a pre datovanie máme k dispozícií len nie veľmi početné nálezy z vnútornej plochy hradiska. Ide poväčšine o včasnostredovekú keramiku a železné predmety bez možnosti presnejšieho časového zaradenia. Približne v strede areálu bola pri sondáži preskúmaná jama s výraznou keramikou približne z 8.-9. storočia. V súbore železných predmetov prevládajú malé nože, klince, stavebné kovania a zlomky kľúčov. Chýbajú stopy výroby. Zbrane zastupuje malá sekerka, hroty šípov so spätnými krídelkami a malý fragment drôtenej košele s veľkými nitovanými očkami. Na nálezisku sa podarilo získať len relatívne malý počet nálezov. Ich zloženie zdôrazňuje skôr vojenský než sídliskový ráz lokality. Stavebné dielo bolo asi zhotovené narýchlo a využívalo sa len krátkodobo. Hradiská I a III mali priechodný charakter. Postavené boli zhruba na rovnakom teréne - na horskom chrbte, v polohe, ktorá v predchádzajúcich obdobiach nebola vyhľadávaná pre obranné účely. Zdá sa, že v prípadoch oboch týchto hradísk bola spoločným motívom ich vybudovania kontrola cesty, ktorá cez hradiská prechádzala. Je to zvláštny fenomén, ktorý si iste zaslúži väčšiu pozornosť pri podrobnejšom vyhodnotení celého sídliskového areálu. V porovnaní s veľkým hradiskom I, so skutočne mimoriadnym opevnením, plnili podľa súčasného stavu výskumu obe malé včasnostredoveké fortifikácie Bojná II a III len vedľajšie, ale nepochybne dôležité úlohy obrany širšieho priestoru tejto časti východného predhoria Považského Inovca a strategicky podporovali bezpečnosť zázemia centrálneho hradiska. Pravdepodobne neboli dlhodobo osídlené. Smer potenciálne¬ho útoku z považskej strany cez pohorie je jasný podľa zdvojených opevnení na Valoch i na Žihľavníku. V tomto smere sa ako vysvetlenie ponúka potreba zaistenia Nitrianska proti historicky doloženému útoku z moravskej strany (konflikt Mojmíra s Pribinom).

[IMAGE:18]

Foto hradiska Bojná III (autor - Ľubomír Červený):

Ostatné fotografie hradiska Bojná III od autora Ľubomíra Červeného si môžete pozrieť v tomto

Bude v Bojnej Archeoskanzen?

[IMAGE:19]

Pridávam veľmi zaujímavú tlačovú správu:

(06.08.2011; www.aktuality.sk; Regióny, 15.15, s.  ; TASR)

Výsledky archeologických výskumov na veľmožskom hradisku v Bojnej si v  budúcnosti budú môcť vlastnoručne ohmatať aj návštevníci obce alebo  samotnej lokality. Archeológovia tu chcú spoločne s obecným úradom  vybudovať repliky slovanských obydlí a archeoskanzen, v ktorom metódami  experimentálnej archeológie vybudujú časť veľkomoravskej osady.

"Chceme pripraviť niektoré už preskúmané plochy s veľmi príťažlivými  pôvodnými stavbami na sprístupnenie pre verejnosť. Chceme tiež  zrekonštruovať jeden zo slovanských domov. Malo by ísť o taký bežný  štandardný slovanský dom, zemnicu.

Boli to malé domčeky, v pôdoryse veľké zhruba tri krát tri metre, ktoré  pozostávali z veľkého kamenného kozuba a ležoviska. Ľudia prežívali  väčšinu času vonku, kde sa vykonávali aj bežné domáce práce, a v  chalupách sa len varilo a spalo," vysvetlil vedúci archeologického  výskumu na hradisku v Bojnej Karol Pieta. Ako konštatoval, vedci mali  šťastie v tom, že základy viacerých domov zostali aj po viac ako tisíc  rokoch dobre zachované spolu so zariadením, ktoré v nich kedysi bolo.

[IMAGE:20]

"To znamená, že pri peci sme našli stáť nádoby, v kúte bola opretá  sekera, v druhom kúte bol konský postroj a podobne. Takže máme celý rad  takýchto zaujímavých detailov. Našli sme obruče z dreveného súdka, takže  vieme, že tam stál, aj keď už nezistíme, či v ňom bolo pivo, voda alebo  medovina," povedal Pieta. V prvej fáze chcú archeológovia vybudovať  rekonštrukciu typickej slovanskej chatrče. Tá bude stáť priamo v areáli  hradiska. "Ten domček bude otvorený a bude prístupný.

Bude spravený tak, že keď tam niekto prípadne aj prespí, tak sa svet  nezrúti. Nebudeme tam preto inštalovať nejaké vzácnejšie predmety,"  vysvetlil. Vybudovanie archeoskanzenu je už podľa jeho slov podstatne  zložitejší zámer. Stáť by mal v blízkosti Ranča pod Babicou a obec už  podľa slov jej starostu Jozefa Vanča hľadá vhodný pozemok.

Na postavenie skanzenu je už potrebné stavebné povolenie a dostatok  finančných prostriedkov. Tie chcú Archeologický ústav SAV v Nitre a obec  Bojná získať z eurofondov. "Archeopark si už vyžaduje infraštruktúru,  infocentrum a určitú koordináciu. Aspoň hrubé rysy tohto projektu by sme  chceli mať hotové do jesene.

V takýchto parkoch alebo skanzenoch sa obvykle prezentuje povedzme celá  osada, kde by boli nielen obytné domy, ale aj dielne, hospodárske  staviská, kostol, hroby. Jednoducho všetko tak, aby ľudia mali  všestrannú predstavu, ako sa na Bojnej žilo. Kde by na zvoničke visel  známy bojniansky zvon a kde by sa aj priamo prezentovali tie nálezy,  ktoré sa na Bojnej našli. Či už poľnohospodárske nástroje, remeselnícke  nástroje, pluhy, kosy a všetky tie predmety, ktoré Slovania potrebovali v  bežnom živote," povedal Pieta.

Držme palce, aby aj na Slovensku konečne vznikol plnohodnotný archeoskanzen z obdobia Veľkej Moravy.

[IMAGE:21]

Pieta K., Ruttkay A., Ruttkay M .:2006, Bojná, Hospodárske a politické centrum Nitrianskeho kniežactva, Nitra

Pieta K.: 2007 ,Bojná – nové nálezy k počiatkom slovenských dejín. Nitra

Ruttkayiová.: 2007, Bojná - neznáme centrum Nitrianskeho kniežatstva, Múzeum 2007/2, Bratislava

http://www.pohanstvi.net/inde.php?menu=slovani_bojna

časť zhoreného trámu z hradby

[IMAGE:22]

poklad sekerovitých hrivien

poľnohospodárske nástroje

časť čepele meča a nákončie z pošvy

Nádherné luxusné nákončie pošvy meča

fragmenty vzácneho krúžkového brnenia svedčia o pobyte najbohatšej šľachty na hradisku

[IMAGE:23]

časť konského postroja

luxusná pozlátená prevlečka a ostroha

pôvodne trojcípe kovanie zo závesu meča

veľká vzácnosť - kovanie na uzavretie knihy

lunicové závesky - dôkazy pohanskej viery našich predkov

[IMAGE:24]

údajne najstaršia slovanská ostroha u nás

hrnčiarske značky zrejme vychádzajú z pohanskej symboliky

Kľúče na otváranie vchodových dverí

vstupná brána na hradisko

v reze valom viditeľné prepálené drevo

mohutné valy obopínajú celé hradisko

množstvo roztrúseného kamenia zrejme svedčí o čiastočne kamených stavbách

Prvý zrekonštruovaný slovanský zrub na hradisku

verme že takýchto skvelých rekonštrukcií bude mnoho

detail na závoru dverí - práve tu sa používali tie zvláštne tvarované kľúče, ktoré sú odfotené vyššie

dom mal aj poschodie s oknom

brána na opačnej strane hradiska

zrekonštruovaná časť čela hradby

detailný pohľad na rekonštrukciu valu

rekonštruovaný val z vnútornej strany`,
    coverImage: '/articles/bojna/bojna-cover.jpg',
    author: {
      name: 'Archeologický tím',
      avatar: '',
    },
    publishedAt: '2010-05-15',
    readTime: 15,
    tags: ['Veľká Morava', 'opevnenia', 'Považský Inovec', '9. storočie'],
    category: 'historia',
    hradiskaCategory: ['mocenske-centra', 'kniezacie-sidla'],
    featured: false,
    keywords: [
      'Bojná',
      'Veľká Morava',
      'hradisko',
      'Považský Inovec',
      'Nitrianske kniežatstvo',
      'opevnenie',
      'val',
      'archeológia',
      '8. storočie',
      '9. storočie'
    ],
    images: [
      { url: '/articles/bojna/bojna-00-other.jpg', caption: 'Hradisko Bojná - celkový pohľad', position: 0 },
      { url: '/articles/bojna/bojna-01-other.jpg', caption: 'Hradisko Bojná v rannej hmle', position: 1 },
      { url: '/articles/bojna/bojna-02-landscape.jpg', caption: 'Pohľad na hradisko z východnej strany', position: 2 },
      { url: '/articles/bojna/bojna-03-other.jpg', caption: 'Pohľad na hradisko z vrchu Marhát', position: 3 },
      { url: '/articles/bojna/bojna-04-entrance.jpg', caption: 'Vstupná časť hradiska s viditeľným opevnením', position: 4 },
      { url: '/articles/bojna/bojna-05-other.jpg', caption: 'Panoráma hradiska a okolia', position: 5 },
      { url: '/articles/bojna/bojna-06-gate.jpg', caption: 'Rekonštruovaná brána hradiska Bojná', position: 6 },
      { url: '/articles/bojna/bojna-07-other.jpg', caption: 'Detail opevnenia hradiska', position: 7 },
      { url: '/articles/bojna/bojna-08-fortification.jpg', caption: 'Fortifikačný val hradiska', position: 8 },
      { url: '/articles/bojna/bojna-09-reconstruction.jpg', caption: 'Počítačová rekonštrukcia hradiska', position: 9 },
      { url: '/articles/bojna/bojna-10-other.jpg', caption: 'Detail opevnenia a valu', position: 10 },
      { url: '/articles/bojna/bojna-11-other.jpg', caption: 'Archeologický výskum hradiska', position: 11 },
      { url: '/articles/bojna/bojna-12-map.jpg', caption: 'Mapa hradiska s vyznačením dôležitých objektov', position: 12 },
      { url: '/articles/bojna/bojna-13-other.jpg', caption: 'Detail archeologického nálezu', position: 13 },
      { url: '/articles/bojna/bojna-14-findings.jpg', caption: 'Plakety a iné nálezy z hradiska', position: 14 },
      { url: '/articles/bojna/bojna-15-map.jpg', caption: 'Plán hradiska s rozložením nálezov', position: 15 },
      { url: '/articles/bojna/bojna-18-findings.jpg', caption: 'Putá a nákončia z Bojnej', position: 16 },
      { url: '/articles/bojna/bojna-22-map.jpg', caption: 'Archeologická mapa lokality', position: 17 },
      { url: '/articles/bojna/bojna-28-map.jpg', caption: 'Pôdorys hradiska s fortifikáciou', position: 18 },
      { url: '/articles/bojna/bojna-cover.jpg', caption: 'Hradisko Bojná - pohľad na opevnenie', position: 19 },
      { url: '/articles/bojna/bojna-od-vychodu.jpg', caption: 'Pohľad na hradisko Bojná od východu', position: 20 },
      { url: '/articles/bojna/bojna-panorama.jpg', caption: 'Panoramatický pohľad na hradisko s okolím', position: 21 },
      { url: '/articles/bojna/bojna-pocitacova-rekonstrukcia.jpg', caption: 'Počítačová rekonštrukcia hradiska Bojná I. - Valy', position: 22 },
      { url: '/articles/bojna/bojna-rano.jpg', caption: 'Brieždenie nad hradiskom Bojná v ranných hodinách', position: 23 },
      { url: '/articles/bojna/bojna-vstup.jpg', caption: 'Vstup do hradiska Bojná s viditeľným valom', position: 24 },
      { url: '/articles/bojna/brana.jpg', caption: 'Rekonštrukcia vstupnej brány hradiska', position: 25 },
      { url: '/articles/bojna/mapa-hradisko.jpg', caption: 'Mapa lokalizácie hradiska Bojná I. v Považskom Inovci', position: 26 },
      { url: '/articles/bojna/mapa-nalezy.jpg', caption: 'Mapa hradiska s vyznačením najvýznamnejších nálezov', position: 27 },
      { url: '/articles/bojna/nalez-1.jpg', caption: 'Archeologické nálezy z hradiska', position: 28 },
      { url: '/articles/bojna/plaketa-detail.jpg', caption: 'Detail krížovej plakety so zobrazením anjelskej postavy', position: 29 },
      { url: '/articles/bojna/plakety.jpg', caption: 'Pozlátené bronzové plakety z prenosného oltára', position: 30 },
    ],
    quotes: [
      {
        text: 'Bojnú možno na základe posledných výskumov označiť za rozsiahlu aglomeráciu, zahrňujúcu nie len hradisko Bojná I, ale aj Bojná II, III a najnovšie aj Bojná IV.',
        author: 'PhDr. Karol Pieta, DrSc., Vedecká cukráreň 2009',
        position: 0
      }
    ],
    bibliography: [
      'Pieta, K. (2009): Bojná ako rozsiahla aglomerácia. In: Vedecká cukráreň, 27. 10. 2009.',
      'Pieta, K., Robak, Z. (2017): Bojná – mocenské a christianizačné centrum Nitrianskeho kniežatstva. Bratislava: VEDA.'
    ],
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1626880700245-0fe6ffa47742?w=800',
        caption: 'Hradisko Bojná - celkový pohľad na opevnenie z obdobia Veľkej Moravy',
        alt: 'Pohľad na hradisko Bojná'
      },
      {
        url: 'https://images.unsplash.com/photo-1613552568445-7d357eb359c6?w=800',
        caption: 'Archeologický výskum odkryl pozostatky mohutného opevnenia',
        alt: 'Archeologické vykopávky'
      },
      {
        url: 'https://images.unsplash.com/photo-1660070442600-1d4cda83acce?w=800',
        caption: 'Kamenné múry svedčiace o vysokej úrovni fortifikačného staviteľstva',
        alt: 'Kamenné múry hradiska'
      },
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
        caption: 'Replika slovanského obydlia na hradisku Bojná',
        alt: 'Replika slovanského domu'
      },
      {
        url: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800',
        caption: 'Pozlátené bronzové plakety - unikátny nález z 9. storočia',
        alt: 'Archeologické nálezy - plakety'
      },
      {
        url: 'https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=800',
        caption: 'Krajina Považského Inovca s hradiskami Veľkej Moravy',
        alt: 'Krajina okolo Bojnej'
      },
      {
        url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800',
        caption: 'Rekonštrukcia vstupnej brány hradiska',
        alt: 'Brána hradiska'
      },
      {
        url: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=800',
        caption: 'Archeologický tím pri práci na lokalite Bojná-Valy',
        alt: 'Archeologický výskum'
      }
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
