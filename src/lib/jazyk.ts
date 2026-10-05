/**
 * JAZYK WEBU — slovenčina a angličtina.
 *
 * Web je postavený ako slovenský a texty rozhrania sú v komponentoch napísané
 * natvrdo. Namiesto prestavby na prekladovú knižnicu je tu malá vrstva:
 * jazyk sa určí z adresy (`/en/...`), drží sa v module a komponenty si pýtajú
 * reťazce cez `t()`. Keď je jazyk slovenský, vracia sa pôvodný slovenský text,
 * takže sa na slovenskej strane nič nemení.
 *
 * Preklad OBSAHU (články) rieši Strapi i18n; toto je len rozhranie.
 */

export type Jazyk = 'sk' | 'en';

let aktualny: Jazyk = 'sk';

/** Nastaví jazyk — volá `App` pri spracovaní adresy. */
export function nastavJazyk(j: Jazyk): void {
  aktualny = j;
  if (typeof document !== 'undefined') document.documentElement.lang = j;
}

export const jazyk = (): Jazyk => aktualny;
export const poAnglicky = (): boolean => aktualny === 'en';

/**
 * Z adresy vyberie jazyk a vráti cestu bez predpony.
 * `/en/blog/x` → { jazyk: 'en', cesta: '/blog/x' }
 */
export function rozdelAdresu(path: string): { jazyk: Jazyk; cesta: string } {
  if (path === '/en' || path.startsWith('/en/')) {
    return { jazyk: 'en', cesta: path.slice(3) || '/' };
  }
  return { jazyk: 'sk', cesta: path };
}

/** Adresa v aktuálnom jazyku: `/blog/x` → `/en/blog/x` pre angličtinu. */
export function odkaz(cesta: string, j: Jazyk = aktualny): string {
  if (j === 'sk') return cesta;
  return cesta === '/' ? '/en' : `/en${cesta}`;
}

/* ── Texty rozhrania ──────────────────────────────────────────────────────
   Kľúč je slovenský originál, aby sa v komponente dalo napísať
   `t('Mohlo by vás zaujímať')` a slovenská vetva ostala čitateľná. */
const EN: Record<string, string> = {
  'Domov': 'Home',
  'Mohlo by vás zaujímať': 'You might also like',
  'Článok sa nenašiel.': 'Article not found.',
  'Obsah článku zatiaľ nebol pridaný.': 'The article has no content yet.',
  'min čítania': 'min read',
  'Kľúčové fakty': 'Key facts',
  'Časová os': 'Timeline',
  'Lokalita': 'Location',
  'Súvisiace články': 'Related articles',
  'Témy': 'Topics',
  'Kategórie': 'Categories',
  'Články': 'Articles',
  'Zdieľať': 'Share',
  'Zdieľať článok': 'Share this article',
  'Komentáre': 'Comments',
  'Pridať komentár': 'Add a comment',
  'Skryť komentáre': 'Hide comments',
  'Galéria': 'Gallery',
  'Fotogaléria': 'Photo gallery',
  'Zdroje a literatúra': 'Sources and literature',
  'Otvoriť v Google Mapách': 'Open in Google Maps',
  'Načítavam…': 'Loading…',
  'Slovensky': 'Slovensky',
  'English': 'English',

  /* Hlavička a päta */
  'Hradiská': 'Hillforts',
  'Aktuality': 'News',
  'Prihlásiť sa': 'Sign in',
  'Účet': 'Account',
  'Ponuka': 'Menu',
  'Hradiská — domov': 'Hillforts — home',
  'Zatiaľ bez článkov.': 'No articles yet.',
  'Slovanské hradiská': 'Slavic hillforts',
  'Aplikácia do telefónu': 'Mobile app',
  'Ochrana osobných údajov': 'Privacy policy',
  'Podmienky používania': 'Terms of use',

  /* Lišta o cookies */
  'Stoj! Kto tam?': 'Halt! Who goes there?',
  'Prijať ako hosť': 'Enter as a guest',
  'Otočiť koňa': 'Turn the horse around',
  'Prijať všetko': 'Accept all',
  'Uložiť voľbu': 'Save choice',
  'Nevyhnutné': 'Essential',
  'Analytické': 'Analytics',
  'VŽDY ZAPNUTÉ': 'ALWAYS ON',
  'Žiadne rabovanie, sľubujeme!': 'No pillaging, we promise!',
  'STRÁŽ': 'GUARD',
  'Zvyky hradiska (nastavenia)': 'Hillfort customs (settings)',

  /* Kategórie — ustálené anglické názvy; v Strapi preklad zatiaľ nemajú */
  'Kniežacie sídla': 'Princely seats',
  'Mocenské centrá': 'Centres of power',
  'Strážna a hospodárska funkcia': 'Guard and economic function',
  'Refugiá': 'Refuges',
  'Staroveké sídla': 'Ancient settlements',
  'Všeobecne o hradiskách': 'About hillforts',
  'Svätyne a sakrálne objekty': 'Sanctuaries and sacred sites',
  'Povesti': 'Legends',
  'Listiny a písomné zdroje': 'Charters and written sources',
  'Odborné texty': 'Academic papers',
  '3D modely': '3D models',
  'Informačné tabule': 'Information panels',
  'Ostatné': 'Other',
};

/** Text rozhrania. V slovenčine vracia kľúč, v angličtine jeho preklad. */
export function t(kluc: string): string {
  if (aktualny === 'sk') return kluc;
  return EN[kluc] ?? kluc;
}

/** Názov kategórie v jazyku stránky. Keď preklad nie je, vráti pôvodný. */
export const kategoria = (meno: string | undefined | null): string => (meno ? t(meno) : '');

/** Dátum v jazyku stránky. */
export function datum(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return aktualny === 'en'
    ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : d.toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' });
}
