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
 * `image` je cesta k obrázku v Strapi médiách.
 *
 * Sedem kategórií má od 09/2026 vlastnú KRESBU (akvarel, jednotná šírka
 * 1400 px). „Svätyne" a „Všeobecne o hradiskách" na kresbu ešte čakajú —
 * dovtedy majú fotku z článku a v zozname stoja hneď za kreslenými, aby sa
 * dali vymeniť bez ďalšieho presúvania. Zvyšné tri majú fotku z článku
 * v tej istej kategórii (nie stock).
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

/**
 * Cesta k zmenšenine, ktorú Strapi vyrobil pri nahratí (`small_`, `medium_`,
 * `large_`, `thumbnail_`). Predpona sa lepí pred názov súboru, nie pred celú
 * cestu — `/uploads/Foo.jpg` → `/uploads/small_Foo.jpg`.
 *
 * Dlaždica má 363 × 220 px, originály majú 1280–3183 px a spolu 7,6 MB. Kým sa
 * stiahli, ostávali karty prázdne — pri studenej pamäti prehliadača aj desiatky
 * sekúnd. So `small_`/`medium_` je to 1,2–2,7 MB.
 */
export function variant(path: string, size: 'thumbnail' | 'small' | 'medium' | 'large'): string {
  return path.replace(/([^/]+)$/, `${size}_$1`);
}

export const hradiskaCategories: HradiskaCategory[] = [
  /* ── Kreslené dlaždice (akvarel, 2026) ─────────────────────────────── */
  {
    slug: 'kniezacie-sidla',
    label: 'Kniežacie sídla',
    description:
      'Sídla veľkomoravských kniežat a vládcov — Nitra, Mikulčice, Blatnohrad. Miesta, kde sa spájala politická moc s hospodárstvom a kde vyrastali prvé kamenné kostoly na našom území.',
    icon: 'crown',
    image: '/uploads/kategoria_kniezacie_sidla_b900d05db2.jpg',
  },
  {
    slug: 'mocenske-centra',
    label: 'Mocenské centrá',
    description:
      'Správne a vojenské strediská, ktoré držali pod kontrolou celé územné celky. Okrem slovenských lokalít sem patria aj hradiská Slávnikovcov v Čechách a slovanské centrá v dnešnom Nemecku.',
    icon: 'landmark',
    image: '/uploads/kategoria_mocenske_centra_b88d7fc015.jpg',
  },
  {
    slug: 'strazna-funkcia',
    label: 'Strážna a hospodárska funkcia',
    description:
      'Najpočetnejšia skupina — hradiská, ktoré strážili priesmyky, brody a obchodné cesty alebo slúžili remeslu. Práve tu vidno, ako hustou sieťou bolo územie pokryté.',
    icon: 'shield',
    image: '/uploads/kategoria_strazna_a_hospodarska_funkcia_e1e876fe12.jpg',
  },
  {
    slug: 'refugia',
    label: 'Refúgiá',
    description:
      'Útočištné hradiská, kam sa obyvateľstvo sťahovalo v čase nebezpečenstva. Bývajú menšie, ťažko prístupné a bez stôp trvalého osídlenia — obývali sa len keď bolo treba.',
    icon: 'mountain',
    image: '/uploads/kategoria_refugium_023d7282bb.jpg',
  },
  {
    slug: 'staroveke-sidla',
    label: 'Staroveké sídla',
    description:
      'Opevnené sídla z čias pred príchodom Slovanov — doba bronzová, halštat, keltské oppidá a púchovská kultúra. Mnohé z nich Slovania neskôr osídlili znova.',
    icon: 'columns',
    image: '/uploads/kategoria_staroveke_hradiska_66d3ee4853.jpg',
  },
  {
    slug: 'listiny-a-pisomne-zdroje',
    label: 'Listiny a písomné zdroje',
    description:
      'Dobové pramene, z ktorých o hradiskách vieme — Fuldské anály, Bavorský geograf, listiny a antickí autori. Texty aj s prekladom a zaradením do kontextu.',
    icon: 'scroll',
    image: '/uploads/kategoria_listiny_83b01519cc.jpg',
  },
  {
    slug: 'povesti',
    label: 'Povesti',
    description:
      'Legendy a ústne podania viazané na hradiská — bohovia, zakliate poklady, zaniknuté hrady. Ľudová pamäť miest, ktorá často prežila dlhšie než ich múry.',
    icon: 'book',
    image: '/uploads/kategoria_povesti_648825b6bb.jpg',
  },

  /* ── Čakajú na kresbu ──────────────────────────────────────────────
     Zatiaľ majú fotku z článku. Keď kresby prídu, nahradí sa obrázok
     a tieto dve dlaždice patria hore k ostatným kresleným. */
  {
    slug: 'svatyne-a-sakralne-objekty',
    label: 'Svätyne a sakrálne objekty',
    description:
      'Kultové miesta pohanské aj kresťanské — obetiská, mohylníky, posvätné háje a najstaršie stojace kostoly. Vrátane mytológie a pohrebných zvyklostí Slovanov.',
    icon: 'church',
    image: '/uploads/lupis2_cd92eedea0.png',
  },
  {
    slug: 'vseobecne-o-hradiskach',
    label: 'Všeobecne o hradiskách',
    description:
      'Články, ktoré sa neviažu na jednu lokalitu — konštrukcia valov, remeslá, vojenstvo, každodenný život a širšie dejinné súvislosti slovanského osídlenia.',
    icon: 'book',
    image: '/uploads/geograf_vyznaceni_merhanos_a55eccde8b.jpg',
  },

  /* ── Fotky z článkov ──────────────────────────────────────────────── */
  {
    slug: '3d-modely',
    label: '3D modely a rekonštrukcie',
    description:
      'Vizuálne rekonštrukcie hradísk — 3D modely, kresby opevnení a brán, letecké pohľady. Ukazujú, ako miesta pravdepodobne vyzerali, kým z nich ostali len valy.',
    icon: 'landmark',
    image: '/uploads/fortificationfinaledit_9865a40e30.png',
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
    slug: 'aktuality',
    label: 'Aktuality',
    description:
      'Kronika činnosti združenia od roku 2010 — brigády, prednášky, publikácie, výskumy a podujatia. Čo sme robili a čo nás čaká.',
    icon: 'scroll',
    image: '/uploads/Mapa_200_a9dd1593d9.jpg',
  },
];
