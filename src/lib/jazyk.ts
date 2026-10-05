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
  'Späť hore': 'Back to top',
  'Listiny a pramene': 'Charters and sources',
  'Zavrieť ponuku': 'Close the menu',
  'Otvoriť ponuku': 'Open the menu',
  'Zobraziť všetky': 'Show all',
  'Načítavam články…': 'Loading articles…',
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
  'Zvyky hradiska (cookies)': 'Hillfort customs (cookies)',
  'Zvyky hradiska': 'Hillfort customs',
  'Súhlasím': 'I agree',
  'Nesúhlasím': 'I disagree',

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
  /* Zdieľanie */
  'Zdieľať na': 'Share on',
  'Kopírovať odkaz': 'Copy link',
  'Skopírované': 'Copied',
  'Odkaz skopírovaný': 'Link copied',
  'Nepodarilo sa skopírovať odkaz': 'The link could not be copied',

  /* Fotogaléria a svetelný box */
  'Fotka z Hradiská.sk': 'Photo from Hradiská.sk',
  'Odkaz na fotku skopírovaný': 'Link to the photo copied',
  'Prehliadač fotky': 'Photo viewer',
  'Zavrieť': 'Close',
  'Zavrieť zväčšenie': 'Close the enlarged view',
  'Zväčšiť fotku': 'Enlarge the photo',
  'Predchádzajúca fotka': 'Previous photo',
  'Nasledujúca fotka': 'Next photo',
  'Zbaliť': 'Show less',
  'Čítať viac': 'Read more',
  'Zobraziť komentáre': 'Show comments',
  'Otvoriť obrázok': 'Open image',
  'Obrázok': 'Image',

  /* Diskusia */
  'Diskusia': 'Discussion',
  'Načítavam komentáre…': 'Loading comments…',
  'Zatiaľ tu nie sú žiadne komentáre. Buďte prvý, kto napíše svoj názor.':
    'There are no comments yet. Be the first to share your thoughts.',
  'Komentovanie tohto článku nie je momentálne dostupné.':
    'Comments on this article are currently unavailable.',
  'Píšete ako': 'You are posting as',
  'Napíšte svoj komentár…': 'Write your comment…',
  'Pridávam…': 'Adding…',
  'Do diskusie sa môžu zapojiť prihlásení členovia.': 'Signed-in members can join the discussion.',
  'Zaregistrovať sa': 'Create an account',
  'Prihláste sa': 'Sign in',
  'z pôvodného blogu': 'from the original blog',
  'Páči sa mi': 'Like',
  'Páči sa': 'Liked',
  'Zrušiť reakciu': 'Remove the like',
  'Odpovedať': 'Reply',
  'Odpovedať na tento komentár': 'Reply to this comment',
  'Odpoveď pre': 'Reply to',
  'Odoslať odpoveď': 'Send the reply',
  'Zrušiť': 'Cancel',
  'Zmazať': 'Delete',
  'Zmazať môj komentár': 'Delete my comment',
  'Zmazať tento komentár?': 'Delete this comment?',
  'Nahlásiť': 'Report',
  'Nahlásiť tento komentár redakcii': 'Report this comment to the editors',
  'Komentovať': 'Comment',
  'Napíš komentár…': 'Write a comment…',
  'Odoslať komentár': 'Send the comment',
  'Buď prvý, kto sa ozve ✦': 'Be the first to speak up ✦',
  'a zapojte sa do diskusie': 'and join the discussion',
  'komentár': 'comment',
  'komentáre': 'comments',
  'komentárov': 'comments',
  'Lajkovať môžu len prihlásení. Prihláste sa.': 'Only signed-in members can like. Please sign in.',
  'Nepodarilo sa zaznamenať lajk.': 'The like could not be recorded.',
  'Nepodarilo sa zrušiť lajk.': 'The like could not be removed.',
  'Komentár pridaný.': 'Comment added.',
  'Komentár zmazaný.': 'Comment deleted.',
  'Nepodarilo sa pridať komentár': 'The comment could not be added',
  'Nepodarilo sa zmazať komentár.': 'The comment could not be deleted.',
  'Odpoveď pridaná.': 'Reply added.',
  'Nepodarilo sa pridať odpoveď.': 'The reply could not be added.',

  /* Nahlásenie príspevku */
  'Nahlásiť príspevok': 'Report this post',
  'Nahlásené': 'Reported',
  'Čo mu vyčítate?': 'What is wrong with it?',
  'Urážka alebo útok na človeka': 'Insult or personal attack',
  'Nevhodný obsah': 'Inappropriate content',
  'Nepravdivé tvrdenie': 'False claim',
  'Iné': 'Other',
  'Chcete niečo doplniť? (nepovinné)': 'Anything to add? (optional)',
  'Napríklad čím presne príspevok prekáža.': 'For example, what exactly is wrong with the post.',
  'Nahlásenie príspevok neskryje — pozrie sa naň redakcia.':
    'Reporting does not hide the post — the editors will look at it.',
  'Odosielam…': 'Sending…',
  'Tento príspevok ste už nahlásili. Redakcia o ňom vie.':
    'You have already reported this post. The editors know about it.',
  'Ďakujeme. Redakcia sa na príspevok pozrie.': 'Thank you. The editors will look at the post.',
  'Nahlásenie sa nepodarilo odoslať. Skúste to prosím o chvíľu.':
    'The report could not be sent. Please try again in a moment.',
  'Zablokovať sa ho nepodarilo — skúste to v nastaveniach účtu.':
    'Blocking failed — please try it in your account settings.',
  'tohto člena': 'this member',
  'Príspevok od': 'A post by',
  'Príspevky od': 'Posts by',
  'vám už nebudeme zobrazovať.': 'will no longer be shown to you.',
  'Príspevky tohto člena vám už nebudeme zobrazovať.':
    "This member's posts will no longer be shown to you.",
  'Zároveň': 'Also',
  'zablokovať — jeho príspevky sa mi prestanú zobrazovať. Zrušiť sa to dá v nastaveniach účtu.':
    'block them — their posts will stop appearing for me. This can be undone in the account settings.',

  /* Mapa lokality */
  'otvoriť v Google Mapách': 'open in Google Maps',

  /* Lišta kategórií a karty. Dlaždice majú skrátené názvy (`data/rozcestnik.ts`),
     preto sú v slovníku zvlášť od plných mien kategórií. */
  'Kategórie hradísk': 'Hillfort categories',
  'Hospodárska funkcia': 'Economic function',
  'Refúgiá': 'Refuges',
  'Staroveké hradiská': 'Ancient hillforts',
  'Listiny a pís. zdroje': 'Charters & sources',
  'Svätyne': 'Sanctuaries',
  'Pramene': 'Sources',
  'Pravek': 'Prehistory',
  'Metodika': 'Methodology',
  'Vybrali sme články súvisiace s touto témou': 'A few more articles on the same topic',
  'Kultúra': 'Culture',
  'Archeológia': 'Archaeology',
  'Výskum': 'Research',
  'História': 'History',

  /* Štítky (témy). Mená sú ustálené podľa docs/TERMINOLOGIA-EN.md. */
  'Veľká Morava': 'Great Moravia',
  'Opevnenie a jeho stavba': 'Fortifications and their construction',
  'Činnosť OZ Hradiská': 'Activities of the Hradiská association',
  'Archeologický výskum a metódy': 'Archaeological excavation and methods',
  'Púchovská kultúra': 'Púchov culture',
  'Doba bronzová a lužická kultúra': 'Bronze Age and Lusatian culture',
  'Hradiská v zahraničí': 'Hillforts abroad',
  'Pohanský kult': 'Pagan cult',
  'Náučné chodníky a ochrana pamiatok': 'Nature trails and heritage protection',
  'Kelti a laténska doba': 'Celts and the La Tène period',
  'Stredovek po Veľkej Morave': 'The Middle Ages after Great Moravia',
  'Kostoly a kresťanstvo': 'Churches and Christianity',
  'Zbrane a vojenstvo': 'Weapons and warfare',
  'Slovania a Samova ríša': "The Slavs and Samo's realm",
  'Pohrebiská a mohyly': 'Cemeteries and burial mounds',
  'Remeslá, železo a obchod': 'Crafts, iron and trade',
  'Keramika a každodenný život': 'Pottery and everyday life',
  'Praveké osídlenie': 'Prehistoric settlement',
  'Doba rímska a Germáni': 'The Roman period and the Germanic peoples',
  'Avari a starí Maďari': 'Avars and early Hungarians',
  'Šperky a ozdoby': 'Jewellery and ornaments',
  'Doba halštatská': 'The Hallstatt period',
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
