/**
 * JAZYK WEBU — slovenčina, angličtina, nemčina.
 *
 * Web je postavený ako slovenský a texty rozhrania sú v komponentoch napísané
 * natvrdo. Namiesto prestavby na prekladovú knižnicu je tu malá vrstva:
 * jazyk sa určí z adresy (`/en/...`, `/de/...`), drží sa v module a komponenty
 * si pýtajú reťazce cez `t()`. Keď je jazyk slovenský, vracia sa pôvodný
 * slovenský text, takže sa na slovenskej strane nič nemení.
 *
 * Keď preklad do daného jazyka chýba, `t()` vráti slovenský originál. Je to
 * zámer: prázdne miesto by stránku rozbilo a takto je na prvý pohľad vidieť,
 * čo ešte nie je preložené.
 *
 * Preklad OBSAHU (články) rieši Strapi i18n; toto je len rozhranie.
 */

import { DE } from './slovnik-de';

export type Jazyk = 'sk' | 'en' | 'de';

/** Jazyky s vlastnou predponou v adrese. Slovenčina je bez predpony. */
export const JAZYKY: Jazyk[] = ['sk', 'en', 'de'];

/**
 * Jazyky, ktoré PONÚKA prepínač v hlavičke. Nemčina sa rozrába — adresy
 * `/de/...` fungujú a dajú sa otvoriť priamo, ale kým nie sú preložené
 * články, prepínač by návštevníka poslal na prázdny web. Keď bude obsah
 * hotový, pridá sa sem `'de'` a nič iné sa meniť nemusí.
 */
export const VEREJNE_JAZYKY: Jazyk[] = ['sk', 'en'];
const PREDPONY: Record<Exclude<Jazyk, 'sk'>, string> = { en: '/en', de: '/de' };

/** Kód pre `toLocaleDateString` a formátovanie čísel. */
const PROSTREDIE: Record<Jazyk, string> = { sk: 'sk-SK', en: 'en-GB', de: 'de-DE' };

let aktualny: Jazyk = 'sk';

/** Nastaví jazyk — volá `App` pri spracovaní adresy. */
export function nastavJazyk(j: Jazyk): void {
  aktualny = j;
  if (typeof document !== 'undefined') document.documentElement.lang = j;
}

export const jazyk = (): Jazyk => aktualny;
export const poAnglicky = (): boolean => aktualny === 'en';
export const poNemecky = (): boolean => aktualny === 'de';
export const poSlovensky = (): boolean => aktualny === 'sk';
/** Kód prostredia pre dátumy a čísla v jazyku stránky. */
export const narodneProstredie = (j: Jazyk = aktualny): string => PROSTREDIE[j];

/**
 * Z adresy vyberie jazyk a vráti cestu bez predpony.
 * `/en/blog/x` → { jazyk: 'en', cesta: '/blog/x' }
 */
export function rozdelAdresu(path: string): { jazyk: Jazyk; cesta: string } {
  for (const [j, predpona] of Object.entries(PREDPONY) as [Jazyk, string][]) {
    if (path === predpona || path.startsWith(predpona + '/')) {
      return { jazyk: j, cesta: path.slice(predpona.length) || '/' };
    }
  }
  return { jazyk: 'sk', cesta: path };
}

/** Adresa v aktuálnom jazyku: `/blog/x` → `/en/blog/x` pre angličtinu. */
export function odkaz(cesta: string, j: Jazyk = aktualny): string {
  /* Poistka proti dvojitej predpone. Adresa sa miestami skladá v dátach a
     potom ešte raz pri vykreslení; `/en/en/blog/…` nezodpovedá žiadnej ceste
     a skončí na 404 — a hľadá sa to ťažko, lebo časť odkazov funguje. */
  const { cesta: holá } = rozdelAdresu(cesta);
  cesta = holá;
  if (j === 'sk') return cesta;
  const predpona = PREDPONY[j as Exclude<Jazyk, 'sk'>];
  return cesta === '/' ? predpona : `${predpona}${cesta}`;
}

/* ── Prepnutie jazyka ─────────────────────────────────────────────────────
   Väčšinu adries vie prepnúť predpona, lenže článok má v každom jazyku
   vlastný slug (`/blog/devin` ↔ `/en/blog/devin-great-moravian-dowina-hillfort`
   ↔ `/de/blog/devin-grossmaehrischer-burgwall`). Tie adresy pozná len stránka
   článku, preto ich sem ohlási a hlavička si ich vypýta. Čo nie je ohlásené,
   prepne sa predponou.

   Pri dvoch jazykoch stačila jedna premenná („ten druhý"); pri troch je to
   mapa jazyk → adresa. */

let inojazycne: Partial<Record<Jazyk, string>> = {};
const poslucháči = new Set<() => void>();

/** Ohlási adresy tej istej stránky v ostatných jazykoch; `null` ich zruší. */
export function nastavInojazycneOdkazy(mapa: Partial<Record<Jazyk, string>> | null): void {
  const nove = mapa || {};
  const rovnake = JAZYKY.every((j) => inojazycne[j] === nove[j]);
  if (rovnake) return;
  inojazycne = nove;
  poslucháči.forEach((f) => f());
}

/** Spätná kompatibilita: ohlásenie JEDNEJ adresy v druhom jazyku. */
export function nastavDruhyOdkaz(url: string | null): void {
  nastavInojazycneOdkazy(url ? { [rozdelAdresu(url).jazyk]: url } : null);
}

export const dajInojazycnyOdkaz = (j: Jazyk): string | null => inojazycne[j] ?? null;
export const dajDruhyOdkaz = (): string | null => dajInojazycnyOdkaz(druhyJazyk());

/** Prihlásenie na zmenu — pre `useSyncExternalStore` v hlavičke. */
export function sledujDruhyOdkaz(f: () => void): () => void {
  poslucháči.add(f);
  return () => { poslucháči.delete(f); };
}

/** Jazyk, na ktorý prepne jedno klepnutie — cyklí po VEREJNÝCH jazykoch. */
export const druhyJazyk = (j: Jazyk = aktualny): Jazyk => {
  const i = VEREJNE_JAZYKY.indexOf(j);
  /* Z rozrobeného jazyka vedie prepínač späť na slovenčinu. */
  if (i < 0) return VEREJNE_JAZYKY[0];
  return VEREJNE_JAZYKY[(i + 1) % VEREJNE_JAZYKY.length];
};

/** Kam vedie prepínač do konkrétneho jazyka (cesta je bez predpony). */
export function odkazDoJazyka(cesta: string, j: Jazyk): string {
  return dajInojazycnyOdkaz(j) || odkaz(cesta, j);
}

/** Kam vedie prepínač jazyka z danej cesty (bez jazykovej predpony). */
export function odkazDoDruhehoJazyka(cesta: string): string {
  return odkazDoJazyka(cesta, druhyJazyk());
}

/* ── Texty rozhrania ──────────────────────────────────────────────────────
   Kľúč je slovenský originál, aby sa v komponente dalo napísať
   `t('Mohlo by vás zaujímať')` a slovenská vetva ostala čitateľná. */
const EN: Record<string, string> = {
  'ČINNOSŤ': 'WHAT WE DO',
  'Činnosť združenia':
    'What the association does',
  'Čo združenie robí':
    'What the association does',
  'Knihy a zborníky':
    'Books and journals',
  '2 % z daní':
    '2% of your tax',
  '3D rekonštrukcie':
    '3D reconstructions',
  'Archeologické výskumy':
    'Archaeological research',
  'Výpravy a podujatia':
    'Expeditions and events',
  'Prednášky a médiá':
    'Talks and media',
  'Tabule, ktoré združenie vyrobilo a osadilo priamo pri hradiskách.':
    'Panels the association has made and installed at the hillforts themselves.',
  'Dva zborníky „Hradiská — Svedkovia dávnych čias“, kniha Oživená archeológia a časopis Digitálne hradiská.':
    'Two volumes of “Hillforts — Witnesses of Ancient Times”, the book Oživená archeológia and the journal Digitálne hradiská.',
  'Výzvy, z čoho sa platia tabule, výskumy a tlač — a ako sa dá prispieť.':
    'What pays for the panels, the fieldwork and the printing — and how you can chip in.',
  'Ako hradiská vyzerali, kým z nich ostali valy — modely, kresby a letecké pohľady.':
    'What the hillforts looked like before only the ramparts were left — models, drawings and aerial views.',
  'Vlastné výskumy a prieskumy v teréne — od mikrosond po ohlásené nálezy.':
    'The association’s own fieldwork — from micro-trenches to reported finds.',
  'Cesty za hradiskami doma aj v cudzine, plavby, brigády a živá história.':
    'Trips to hillforts at home and abroad, voyages, work parties and living history.',
  'Prednášky v školách a kluboch, podcasty, rozhovory a diskusie.':
    'Talks in schools and clubs, podcasts, interviews and discussions.',
  'zápisov v téme':
    'entries in',
  'Celá kronika':
    'The whole chronicle',
  'Tabule, ktoré združenie vyrobilo a osadilo priamo pri hradiskách — čo je na nich napísané, ako vznikali a kde ich v teréne nájdete.':
    'Panels the association has made and installed at the hillforts themselves — what they say, how they came about and where to find them.',

  'Zrušiť blokovanie': 'Unblock',
  'Neprišiel e-mail? Poslať znova': 'No e-mail? Send it again',
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics · Názvy miest: © prispievatelia OpenStreetMap · Hranica: geoBoundaries': 'Satellite imagery: Esri, Maxar, Earthstar Geographics · Place names: © OpenStreetMap contributors · Border: geoBoundaries',
  'Reliéf: Copernicus DEM · Rieky: © prispievatelia OpenStreetMap · Hranica: geoBoundaries': 'Relief: Copernicus DEM · Rivers: © OpenStreetMap contributors · Border: geoBoundaries',
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics · Názvy miest: © prispievatelia OpenStreetMap': 'Satellite imagery: Esri, Maxar, Earthstar Geographics · Place names: © OpenStreetMap contributors',
  'Časová os zápisov': 'The timeline of the entries',
  'Prázdny odsek': 'An empty paragraph',
  'E-mail overený. Teraz sa môžete prihlásiť.': 'Your e-mail has been verified. You can sign in now.',
  'Heslo musí mať aspoň 6 znakov.': 'The password must be at least 6 characters long.',
  'Pre registráciu je potrebný súhlas so spracovaním údajov.': 'Registration requires consent to the processing of your data.',
  'Účet vytvorený. Poslali sme vám overovací e-mail — kliknite na odkaz v ňom a potom sa prihláste.': 'Your account has been created. We have sent you a verification e-mail — click the link in it and then sign in.',
  'Ak taký e-mail existuje, poslali sme naň odkaz na obnovu hesla.': 'If such an e-mail exists, we have sent a password reset link to it.',
  'Heslo zmenené. Presmerúvam na prihlásenie…': 'The password has been changed. Taking you to the sign-in page…',
  'Niečo sa pokazilo.': 'Something went wrong.',
  'Prihlásenie': 'Sign in',
  'Vitajte späť v komunite': 'Welcome back to the community',
  'Registrácia': 'Registration',
  'Staňte sa členom a zapojte sa do diskusie': 'Become a member and join the discussion',
  'Zabudnuté heslo': 'Forgotten password',
  'Pošleme vám odkaz na obnovu': 'We will send you a reset link',
  'Nové heslo': 'New password',
  'Zadajte nové heslo k svojmu účtu': 'Enter a new password for your account',
  'Meno (zobrazí sa pri komentároch)': 'Name (shown with your comments)',
  'Jano Hradský': 'John Smith',
  'Heslo': 'Password',
  'Súhlasím so spracovaním e-mailu na účely účtu a diskusie. Údaje neposkytujeme tretím stranám. Viac v': 'I agree to my e-mail being processed for the account and the discussion. We do not pass the data to anyone else. More in the',
  'ochrane osobných údajov': 'privacy policy',
  'Moment…': 'One moment…',
  'Poslať odkaz': 'Send the link',
  'Zmeniť heslo': 'Change the password',
  'Nemáte účet?': 'No account yet?',
  'Zaregistrujte sa': 'Register',
  'Zabudli ste heslo?': 'Forgotten your password?',
  'Už máte účet?': 'Already have an account?',
  'Späť na prihlásenie': 'Back to signing in',
  'Overovací e-mail sme poslali znova.': 'We have sent the verification e-mail again.',
  'Keď mi niekto odpovie': 'When someone replies to me',
  'Keď niekto ocení môj príspevok': 'When someone appreciates my contribution',
  'Keď pribudne nový článok': 'When a new article appears',
  'Posielať aj e-mailom': 'Send by e-mail as well',
  'Fotografiu sa nepodarilo nahrať. Skúste JPG alebo PNG.': 'The photograph could not be uploaded. Try JPG or PNG.',
  'Upozornenia v zariadení sú vypnuté.': 'Notifications on this device are switched off.',
  'Upozornenia v zariadení sú zapnuté.': 'Notifications on this device are switched on.',
  'Prehliadač má upozornenia zakázané. Povolíte ich v jeho nastaveniach pre túto stránku.': 'The browser has notifications blocked. You can allow them in its settings for this site.',
  'Upozornenia sa nepodarilo zapnúť.': 'Notifications could not be switched on.',
  'Účet sa nepodarilo zrušiť. Skúste to prosím znova.': 'The account could not be closed. Please try again.',
  'Ako sa podpisujem': 'How I sign myself',
  'Zobrazené meno': 'Display name',
  'Pod týmto menom vás uvidia ostatní pri príspevkoch. E-mail': 'Others will see you under this name with your contributions. Your e-mail',
  'zostáva skrytý.': 'stays hidden.',
  'Fotografia': 'Photograph',
  'Zmeniť fotografiu': 'Change the photograph',
  'Nahrať fotografiu': 'Upload a photograph',
  'Kedy mi dať vedieť': 'When to let me know',
  'Upozorniť priamo v zariadení': 'Notify me on this device',
  'Uložiť zmeny': 'Save the changes',
  'Zablokovaní členovia': 'Blocked members',
  'Nikoho nemáte zablokovaného. Zablokovať člena sa dá pri jeho príspevku, cez „Nahlásiť".': 'You have nobody blocked. A member can be blocked at their contribution, through “Report”.',
  'Príspevky týchto členov sa vám nezobrazujú. Oni o tom nevedia a ostatným sa ich príspevky ukazujú ďalej.': 'The contributions of these members are not shown to you. They do not know about it and other people still see their contributions.',
  'Účet č.': 'Account no.',
  'Zrušenie účtu': 'Closing the account',
  'Zrušiť účet': 'Close the account',
  'Ponechať účet': 'Keep the account',
  'Zmazať natrvalo': 'Delete permanently',
  'Účet sa zmaže natrvalo. Vaše príspevky zostanú v diskusiách podpísané ako': 'The account will be deleted permanently. Your contributions will stay in the discussions signed as',
  'Zmazaný účet': 'Deleted account',
  'Vrátiť sa to nedá.': 'It cannot be undone.',
  'z toho': 'of which',
  'zobrazených': 'shown',
  'lokalita': 'site',
  'lokalitu': 'site',
  'lokalít': 'sites',
  'Kraj': 'Region',
  'Datovanie': 'Dating',
  'Zoskupiť podľa': 'Group by',
  'V tejto kategórii zatiaľ nie sú lokality.': 'There are no sites in this category yet.',
  'Zavrieť prehľad': 'Close the overview',
  'Typy hradísk': 'Types of hillforts',
  'Hľadať hradisko, obec alebo okres': 'Search a hillfort, village or district',
  'Hľadať v kategórii': 'Search within the category',
  'Načítavam zoznam…': 'Loading the list…',
  'Nič sa nenašlo. Skúste obec alebo okres.': 'Nothing found. Try a village or a district.',
  'Prehľad kategórie': 'Overview of the category',
  'Bratislavský': 'Bratislava Region',
  'Trnavský': 'Trnava Region',
  'Trenčiansky': 'Trenčín Region',
  'Nitriansky': 'Nitra Region',
  'Žilinský': 'Žilina Region',
  'Banskobystrický': 'Banská Bystrica Region',
  'Prešovský': 'Prešov Region',
  'Košický': 'Košice Region',
  'Mimo Slovenska': 'Outside Slovakia',
  'Doba bronzová': 'The Bronze Age',
  'Doba laténska': 'The La Tène period',
  'Doba rímska': 'The Roman period',
  '6.–7. storočie': '6th–7th century',
  '8.–9. storočie': '8th–9th century',
  '9. storočie': '9th century',
  '9.–10. storočie': '9th–10th century',
  '10.–11. storočie': '10th–11th century',
  '11.–13. storočie': '11th–13th century',
  'Bez udania': 'Not stated',
  'Ostatné články': 'Other articles',
  'Lokalita bola predmetom systematického archeologického výskumu v priebehu posledných desaťročí. Výskumy priniesli významné poznatky o osídlení v jednotlivých obdobiach a prispeli k pochopeniu kultúrneho vývoja regiónu.': 'The site has been the subject of systematic archaeological excavation over recent decades. The work has brought important insights into the occupation in the individual periods and has contributed to an understanding of the cultural development of the region.',
  'patrí medzi významné archeologické lokality na Slovensku. Nálezy z tejto lokality sú vystavené v múzeách a sú predmetom odborných štúdií. Lokalita prispieva k poznaniu dejín osídlenia a kultúrneho vývoja na našom území.': 'is among the important archaeological sites in Slovakia. Finds from it are displayed in museums and are the subject of specialist studies. The site contributes to our knowledge of the history of occupation and cultural development in this territory.',
  'Zatiaľ žiadny obsah': 'No content yet',
  'V tejto kategórii zatiaľ nemáme pridané žiadne články. Pracujeme na pridávaní nového obsahu.': 'We have not added any articles to this category yet. We are working on new content.',
  'Preskúmať iné kategórie': 'Explore other categories',
  'Fotografia je zmenená.': 'The photograph has been changed.',
  'k fotografii': 'on a photograph',
  'upravené': 'edited',
  'sa ozval': 'got in touch',
  'odpovedal na váš komentár': 'replied to your comment',
  'čitateľov': 'readers',
  'ocenil váš komentár': 'appreciated your comment',
  'ocenil váš komentár k fotografii': 'appreciated your comment on a photograph',
  'Kronika': 'Chronicle',
  'mesiac v kronike': 'month in the chronicle',
  'mesiacov v kronike': 'months in the chronicle',
  'rok v kronike': 'year in the chronicle',
  'rokov v kronike': 'years in the chronicle',
  'Ozvalo sa': 'Replies',
  'Moje príspevky': 'My contributions',
  'Odložené': 'Saved',
  'Moje fotografie': 'My photographs',
  'Nastavenia': 'Settings',
  'príspevkov': 'contributions',
  'Zatiaľ sa nikto neozval. Záznam pribudne, keď niekto odpovie na váš príspevok alebo ho ocení.': 'Nobody has replied yet. An entry will appear here when someone answers your contribution or appreciates it.',
  'pred chvíľou': 'a moment ago',
  'Môj profil': 'My profile',
  'Nastavenia účtu': 'Account settings',
  'Odhlásiť sa': 'Sign out',
  'Vaše príspevky pred zverejnením číta správca.': 'An administrator reads your contributions before they are published.',
  'Časti profilu': 'Parts of the profile',
  'Zatiaľ ste nič nenapísali. Do diskusie sa dá zapojiť pod každým článkom.': 'You have not written anything yet. You can join the discussion under any article.',
  'Zatiaľ ste si nič neodložili. Článok sa odkladá srdcom v jeho hlavičke.': 'You have not saved anything yet. An article is saved with the heart in its header.',
  'Úpravu sa nepodarilo uložiť. Skúste to prosím znova.': 'The change could not be saved. Please try again.',
  'Zmazať tento príspevok? Nedá sa to vrátiť.': 'Delete this contribution? It cannot be undone.',
  'Príspevok sa nepodarilo zmazať. Skúste to prosím znova.': 'The contribution could not be deleted. Please try again.',
  'Zmeny sa nepodarilo uložiť. Skúste to prosím znova.': 'The changes could not be saved. Please try again.',
  'Uložené.': 'Saved.',
  'Odpoveď': 'Reply',
  'Nový článok': 'New article',
  'Otvoriť fotografiu': 'Open the photograph',
  'Zobraziť v diskusii': 'Show in the discussion',
  'Správca': 'Administrator',
  'Znenie príspevku': 'The text of the contribution',
  'Uložiť zmenu': 'Save the change',
  'Upraviť': 'Edit',
  'Poslané ďalej': 'Shared on',
  'čaká na schválenie': 'awaiting approval',
  'nahlásený': 'reported',
  'skrytý': 'hidden',
  'odstránený': 'removed',
  'odpovedal na váš komentár k fotografii': 'replied to your comment on a photograph',
  'upozorňuje na nedodržanie pravidiel diskusie': 'points out that the discussion rules were not kept',
  'pribudol nový článok': 'a new article has appeared',
  'pod článkom': 'under the article',
  'Lokalita nenájdená': 'Site not found',
  'Späť na vyhľadávanie': 'Back to the search',
  'Prehľad': 'Overview',
  'Nálezy': 'Finds',
  'Obrázky': 'Images',
  'Archeologicky skúmané': 'Archaeologically investigated',
  'História výskumu': 'The history of the excavations',
  'Význam lokality': 'The significance of the site',
  'Archeologické nálezy': 'Archaeological finds',
  'Externý odkaz': 'External link',
  'GPS súradnice': 'GPS coordinates',
  'Zemepisná šírka': 'Latitude',
  'Zemepisná dĺžka': 'Longitude',
  'Artefakt objavený počas archeologického výskumu lokality.': 'An artefact discovered during the archaeological excavation of the site.',
  'Články a štúdie': 'Articles and studies',
  'Odborné publikácie a výskum': 'Specialist publications and research',
  'Zobraziť všetky výsledky': 'Show all results',
  'Výpravy, obnovy tabúľ, prednášky a nálezy.': 'Expeditions, panel repairs, talks and finds.',
  'Vybraná': 'Selected',
  'Načítavam administráciu…': 'Loading the administration…',
  'Obrázok sa nepodarilo načítať': 'The image could not be loaded',
  'Populárne hradiská': 'Popular hillforts',
  'Video zatiaľ nemá adresu': 'The video has no address yet',
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics': 'Satellite imagery: Esri, Maxar, Earthstar Geographics',
  'Sídla veľkomoravských kniežat a vládcov — Nitra, Mikulčice, Blatnohrad. Miesta, kde sa spájala politická moc s hospodárstvom a kde vyrastali prvé kamenné kostoly na našom území.': 'The seats of the Great Moravian princes and rulers — Nitra, Mikulčice, Blatnohrad. Places where political power met the economy and where the first stone churches in this territory rose.',
  'Správne a vojenské strediská, ktoré držali pod kontrolou celé územné celky. Okrem slovenských lokalít sem patria aj hradiská Slávnikovcov v Čechách a slovanské centrá v dnešnom Nemecku.': 'Administrative and military centres that held whole territories under control. Besides the Slovak sites, the hillforts of the Slavník dynasty in Bohemia and the Slavic centres in present-day Germany belong here.',
  'Najpočetnejšia skupina — hradiská, ktoré strážili priesmyky, brody a obchodné cesty alebo slúžili remeslu. Práve tu vidno, ako hustou sieťou bolo územie pokryté.': 'The largest group — hillforts that guarded passes, fords and trade routes, or served craft production. It is here that one sees how dense a network covered the territory.',
  'Útočištné hradiská, kam sa obyvateľstvo sťahovalo v čase nebezpečenstva. Bývajú menšie, ťažko prístupné a bez stôp trvalého osídlenia — obývali sa len keď bolo treba.': 'Refuge hillforts, where the population withdrew in times of danger. They tend to be smaller, hard to reach and without traces of permanent occupation — they were lived in only when needed.',
  'Opevnené sídla z čias pred príchodom Slovanov — doba bronzová, halštat, keltské oppidá a púchovská kultúra. Mnohé z nich Slovania neskôr osídlili znova.': 'Fortified sites from the times before the Slavs arrived — the Bronze Age, Hallstatt, Celtic oppida and the Púchov culture. Many of them the Slavs later occupied again.',
  'Dobové pramene, z ktorých o hradiskách vieme — Fuldské anály, Bavorský geograf, listiny a antickí autori. Texty aj s prekladom a zaradením do kontextu.': 'The period sources from which we know about the hillforts — the Annals of Fulda, the Bavarian Geographer, charters and the authors of antiquity. The texts with a translation and their context.',
  'Legendy a ústne podania viazané na hradiská — bohovia, zakliate poklady, zaniknuté hrady. Ľudová pamäť miest, ktorá často prežila dlhšie než ich múry.': 'Legends and oral tradition tied to the hillforts — gods, enchanted treasures, vanished castles. The folk memory of these places, which often outlived their walls.',
  'Kultové miesta pohanské aj kresťanské — obetiská, mohylníky, posvätné háje a najstaršie stojace kostoly. Vrátane mytológie a pohrebných zvyklostí Slovanov.': 'Cult places both pagan and Christian — sacrificial sites, barrow cemeteries, sacred groves and the oldest standing churches. Including the mythology and burial customs of the Slavs.',
  'Články, ktoré sa neviažu na jednu lokalitu — konštrukcia valov, remeslá, vojenstvo, každodenný život a širšie dejinné súvislosti slovanského osídlenia.': 'Articles not tied to a single site — the construction of ramparts, crafts, warfare, everyday life and the wider historical context of Slavic occupation.',
  'Vizuálne rekonštrukcie hradísk — 3D modely, kresby opevnení a brán, letecké pohľady. Ukazujú, ako miesta pravdepodobne vyzerali, kým z nich ostali len valy.': 'Visual reconstructions of the hillforts — 3D models, drawings of defences and gateways, aerial views. They show how the places probably looked while more than ramparts remained of them.',
  'Archeologické výskumy, štúdie a state odborníkov — nálezové správy, rozbory lokalít a príspevky, ktoré idú hlbšie než populárny výklad.': 'Archaeological excavations, studies and papers by specialists — find reports, analyses of sites and contributions that go deeper than a popular account.',
  'Kronika činnosti združenia od roku 2010 — brigády, prednášky, publikácie, výskumy a podujatia. Čo sme robili a čo nás čaká.': 'A chronicle of the association’s work since 2010 — working parties, talks, publications, excavations and events. What we have done and what lies ahead.',
  'Nepodarilo sa načítať články. Skúste to prosím neskôr.': 'The articles could not be loaded. Please try again later.',
  'Návrat na domovskú stránku': 'Back to the home page',
  'Výsledky vyhľadávania': 'Search results',
  'Nič sme nenašli. Skúste iné alebo všeobecnejšie slovo.': 'We found nothing. Try another or a more general word.',
  'Načítavam článok…': 'Loading the article…',
  'Zápisy sa nepodarilo načítať. Skúste to prosím o chvíľu znova.': 'The entries could not be loaded. Please try again in a moment.',
  'bez dátumu': 'no date',
  'Kronika združenia': 'The chronicle of the association',
  'Zatiaľ tu nie je ani jeden zápis.': 'There is not a single entry here yet.',
  'začiatok kroniky': 'the beginning of the chronicle',
  'zápisov': 'entries',
  'rok': 'year',
  'rokov': 'years',
  'Táto stránka sa nenašla': 'This page was not found',
  'Odkaz je možno starý alebo neúplný. Skúste hľadať konkrétne hradisko, alebo sa vráťte na úvod.': 'The link may be old or incomplete. Try searching for a particular hillfort, or go back to the home page.',
  'Na úvod': 'Home page',
  'Vyhľadávanie': 'Search',
  'Stránka sa nenašla (404) — Hradiská.sk': 'Page not found (404) — Hradiska.sk',
  'Pre': 'For',
  'hľadám…': 'searching…',
  'výsledok': 'result',
  'výsledkov': 'results',
  'Zadajte hľadaný výraz v poli vyhľadávania.': 'Type what you are looking for in the search box.',
  'Aplikácia': 'The app',
  'Hradiská vo vrecku': 'Hillforts in your pocket',
  'Celá encyklopédia aj s mapou v aplikácii, ktorú si nainštalujete do telefónu. Obsah je ten istý ako na webe a dopĺňa sa sám.': 'The whole encyclopaedia, map included, in an app you install on your phone. The content is the same as on the site and keeps itself up to date.',
  'verzia': 'version',
  'Stiahnuť aplikáciu': 'Download the app',
  'Aplikácia zatiaľ nie je v Google Play, preto sa telefón pri inštalácii spýta, či súboru veríte — potvrďte': 'The app is not on Google Play yet, so during the installation the phone will ask whether you trust the file — confirm',
  'Inštalovať aj tak': 'Install anyway',
  'Je podpísaná združením a nič iné do telefónu nepridá.': 'It is signed by the association and adds nothing else to your phone.',
  'web na plochu': 'the site on your home screen',
  'Apple dovoľuje inštalovať aplikácie iba cez App Store a my tam ísť nechceme. Na iPhone si preto web pridajte na plochu — otvorí sa na celú obrazovku, s vlastnou ikonou, ako aplikácia:': 'Apple allows apps to be installed only through the App Store, and we do not want to go there. On an iPhone, add the site to your home screen instead — it opens full screen, with its own icon, like an app:',
  'V Safari klepnite na': 'In Safari tap',
  '(štvorček so šípkou nahor).': '(the square with an arrow pointing up).',
  'Vyberte': 'Choose',
  'Pridať na plochu': 'Add to Home Screen',
  'Potvrďte': 'Confirm with',
  'Pridať': 'Add',
  'Čo aplikácia vie navyše': 'What the app can do on top',
  'Funguje aj bez signálu': 'It works without a signal',
  'Mapa hradísk je celá v aplikácii. V teréne, kde nechytá dáta, ju otvoríte rovnako ako doma.': 'The map of the hillforts is entirely inside the app. Out in the field, where there is no data signal, you open it just as you would at home.',
  'Hradiská v okolí': 'Hillforts nearby',
  'Aplikácia vie, kde stojíte, a ukáže, čo máte na dosah.': 'The app knows where you are standing and shows what is within reach.',
  'Upozornenia': 'Notifications',
  'Keď na váš komentár niekto odpovie alebo pribudne nový článok, dozviete sa to hneď.': 'When someone replies to your comment or a new article appears, you hear about it at once.',
  'Bez reklám a sledovania': 'No ads and no tracking',
  'To isté, čo web — nič navyše nezbiera.': 'The same as the site — it collects nothing extra.',
  'Aplikácia sa aktualizuje sama: nové verzie webu si stiahne na pozadí a nabudúce sa otvorí už s nimi — nemusíte na nič klikať ani nič inštalovať znova. Aplikáciu vydáva OZ Hradiská. Na čo natrafíte, napíšte v diskusii pod ktorýmkoľvek článkom — čítame to.': 'The app updates itself: it downloads new versions of the site in the background and opens with them next time — you do not have to click anything or install anything again. The app is published by the Hradiská civic association. Whatever you run into, write about it in the discussion under any article — we read it.',
  'Fotoarchív': 'Photo archive',
  'Zbierka': 'Collection',
  'Snímky z hradísk, výprav a nálezov — tak, ako prišli k jednotlivým článkom.': 'Shots of hillforts, expeditions and finds — just as they came with the individual articles.',
  'fotografií': 'photographs',
  'článok': 'article',
  'článkov': 'articles',
  'Zúžiť podľa článku': 'Narrow down by article',
  'Všetko': 'All',
  'Zatiaľ tu nie je ani jedna fotografia.': 'There is not a single photograph here yet.',
  'Načítať ďalšie': 'Load more',
  'Fotografie sa nepodarilo načítať. Skúste to prosím o chvíľu znova.': 'The photographs could not be loaded. Please try again in a moment.',
  'Omrvinky': 'Breadcrumbs',
  'Kategória nebola nájdená': 'Category not found',
  'Encyklopédia hradísk Slovenska': 'An encyclopaedia of the hillforts of Slovakia',
  'Ďalší obsah': 'More content',
  'KRONIKA': 'CHRONICLE',
  'Zo života združenia': 'From the life of the association',
  'Pramene a tradícia': 'Sources and tradition',
  'hradísk': 'hillforts',
  'prameňov': 'sources',
  'textov': 'texts',
  'povestí': 'legends',
  'svätýň': 'sanctuaries',
  /* Domovská stránka — hľadanie, kronika, galéria a výzva na spoluprácu.
     Dovtedy boli tieto texty napísané natvrdo v komponentoch, takže
     anglická verzia ukazovala slovenskú domovskú stránku. */
  'Nájdi hradisko vo svojom okolí': 'Find a hillfort near you',
  'Populárne:': 'Popular:',
  'Článok': 'Article',
  'Hľadať': 'Search',
  'Hľadám…': 'Searching…',
  'Hľadaj hradiská…': 'Search hillforts…',
  'Hľadaj hradiská, články, kľúčové slová…': 'Search hillforts, articles, keywords…',
  'Vyhľadávanie lokalít a článkov': 'Search for sites and articles',
  'Vymazať vyhľadávanie': 'Clear the search',
  'Nenašli sme nič pre': 'We found nothing for',
  'Novšie zápisy': 'Newer entries',
  'Staršie zápisy': 'Older entries',
  'CELÁ KRONIKA': 'THE WHOLE CHRONICLE',
  'CELÁ GALÉRIA': 'THE WHOLE GALLERY',
  'ZÁPISY Z AKTIVÍT': 'ENTRIES FROM OUR ACTIVITIES',
  'VYBRANÁ FOTOGALÉRIA': 'SELECTED PHOTOGRAPHS',
  'listujte šípkami alebo potiahnite os': 'use the arrows or drag the timeline',
  'ČÍTAŤ CELÉ': 'READ IN FULL',
  'Prečo to vlastne robím': 'Why am I actually doing this',
  'zápisov v kronike': 'entries in the chronicle',
  'rokov činnosti': 'years of activity',
  'článkov na webe': 'articles on the site',
  'Buďme hrdí na naše dejiny': 'Let us take pride in our history',
  'Staňte sa našimi spolupracovníkmi': 'Become one of our contributors',
  'Možno sami neviete, aké poklady vlastníte.': 'You may not even know what treasures you own.',
  'Aj vy sa môžete podieľať na zveľaďovaní našej stránky. Ak máte doma zaujímavé fotografie z hradísk alebo obrázky a fotky nálezov, stačí sa s nami o ne podeliť — každý záber pomáha dopĺňať náš spoločný obraz o dávnej minulosti.': 'You can help us build this site as well. If you have interesting photographs of hillforts at home, or pictures of finds, just share them with us — every shot helps to fill in our shared picture of the distant past.',
  'Pošlite fotky na': 'Send your photos to',
  'Alebo nám napíšte rovno tu': 'Or write to us right here',
  'Ozveme sa vám späť na uvedený e-mail.': 'We will reply to the e-mail address you give.',
  'Vaše meno': 'Your name',
  'Jana Nováková': 'Jane Smith',
  'Vaša správa': 'Your message',
  'Popíšte, čím by ste chceli prispieť…': 'Tell us what you would like to contribute…',
  'Odoslať správu': 'Send the message',
  'Poslať ďalšiu správu': 'Send another message',
  'Ďakujeme!': 'Thank you!',
  'Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími informáciami o spolupráci.': 'We have received your message. We will get back to you as soon as we can with more about working together.',
  'Vaše údaje použijeme len na odpoveď na túto správu. Neposkytujeme ich tretím stranám.': 'We will use your details only to answer this message. We do not pass them on to anyone else.',
  'Meno je povinné': 'Please enter your name',
  'E-mail je povinný': 'Please enter your e-mail',
  'Zadajte platnú adresu': 'Please enter a valid address',
  'Správa nesmie byť prázdna': 'The message cannot be empty',
  'Čo pomôže najviac': 'What helps most',
  'Valy a opevnenia': 'Ramparts and fortifications',
  'Zábery na valy, pozostatky opevnení, budov a podobne — najmä pri hradiskách, na ktorých som ešte nebol a ku ktorým preto nemám žiadne fotky.': 'Shots of ramparts, remains of fortifications, buildings and the like — above all from hillforts I have not visited yet and therefore have no photographs of.',
  'Nálezy v zahraničí': 'Finds abroad',
  'Slovanské nálezy v Maďarsku a Rakúsku — múzeá vo Visegráde, Novohrade, Ostrihome či Zalavári. Šperky, zbrane, črepy a podobne.': 'Slavic finds in Hungary and Austria — the museums at Visegrád, Nógrád, Esztergom or Zalavár. Jewellery, weapons, sherds and the like.',
  'Máte doma nález?': 'Do you have a find at home?',
  'Platí to aj pre náhodných nálezcov, ktorí majú v pivnici či na povale zaujímavé nálezy, na ktoré len sadá prach a s ktorými sa boja oficiálne pochváliť. Urobiť fotku, napísať, kde sa nález našiel, a poslať to na mail sa predsa dá.': 'This goes for chance finders too, who have interesting finds in the cellar or the attic gathering dust and are afraid to report them officially. Taking a photograph, writing down where the find came from and sending it by e-mail is easy enough.',
  'meno@domena.sk': 'name@domain.com',
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
  'Slovensky': 'Slovenčina',
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

  /* Nástroj na pripomienky */
  'Pripomienky': 'Feedback',
  'Pripomienky k tejto stránke': 'Feedback on this page',
  'Pripomienky sa nepodarilo načítať.': 'The feedback could not be loaded.',
  'voľné miesto na stránke': 'empty space on the page',
  'Priveľa pripomienok za chvíľu. Skúste o minútu.': 'Too many notes in a short time. Try again in a minute.',
  'Uloženie zlyhalo.': 'Saving failed.',
  'Zmazať túto pripomienku? Nedá sa to vrátiť.': 'Delete this note? This cannot be undone.',
  'Skopírované do schránky.': 'Copied to the clipboard.',
  'Kopírovanie zlyhalo.': 'Copying failed.',
  'obsah': 'content',
  'chyba': 'bug',
  'Chyba': 'Bug',
  'Obsah': 'Content',
  'hosť': 'guest',
  'Nová': 'New',
  'Rieši sa': 'In progress',
  'Späť na novú': 'Back to new',
  'Hotová': 'Done',
  'Zamietnutá': 'Rejected',
  'Redakcia to už rieši.': 'The editors are already on it.',
  'Čaká na redakciu.': 'Waiting for the editors.',
  'Čo je tu zle alebo čo treba zmeniť?': 'What is wrong here, or what should change?',
  'Ctrl+Enter uloží': 'Ctrl+Enter saves',
  'Ukladám…': 'Saving…',
  'Uložiť': 'Save',
  'Zavrieť nástroj': 'Close the tool',
  'Kliknite na prvok… (Esc zruší)': 'Click an element… (Esc cancels)',
  'Pridať pripomienku na prvok': 'Add a note to an element',
  'Na tejto stránke zatiaľ nič.': 'Nothing on this page yet.',
  'prvok sa na stránke nenašiel': 'the element was not found on the page',
  'Kopírovať pre vývojára': 'Copy for the developer',
  'Všetky v admine': 'All in the admin',
  'Píšete ako hosť — pripomienku uvidí redakcia.': 'You are writing as a guest — the editors will see your note.',

  /* Mapa hradísk */
  'Terénny atlas': 'Field atlas',
  'Slovenska': 'of Slovakia',
  'lokalít leží za hranicami — ukázať': 'sites lie beyond the border — show them',
  'Podklad mapy': 'Map background',
  'Reliéf': 'Relief',
  'Satelit': 'Satellite',
  'Kategórie lokalít': 'Site categories',
  'Zhluk — kliknutím priblížite': 'A cluster — click to zoom in',
  'Zhluk': 'A cluster of',
  'lokalít — priblížiť': 'sites — zoom in',
  'Ťuknutím otvoríte mapu na celú obrazovku': 'Tap to open the map full screen',
  'Zavrieť mapu': 'Close the map',
  'Zavrieť vejár': 'Close the fan',
  'Zobraziť reliéf': 'Show the relief',
  'Zobraziť satelitnú snímku': 'Show the satellite image',
  'Priblíženie': 'Zoom',
  'Priblížiť': 'Zoom in',
  'Oddialiť': 'Zoom out',
  'Kliknutím presuniete pohľad': 'Click to move the view',
  'Posunúť hore': 'Pan up',
  'Posunúť vľavo': 'Pan left',
  'Posunúť vpravo': 'Pan right',
  'Posunúť dole': 'Pan down',
  'Celé Slovensko': 'All of Slovakia',
  'Čítať článok': 'Read the article',
  'Kliknutím zobraziť v galérii': 'Click to view in the gallery',

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
  'Púchovská kultúra': 'The Púchov culture',
  'Doba bronzová a lužická kultúra': 'The Bronze Age and the Lusatian culture',
  'Hradiská v zahraničí': 'Hillforts abroad',
  'Pohanský kult': 'Pagan cult',
  'Náučné chodníky a ochrana pamiatok': 'Educational trails and heritage protection',
  'Kelti a laténska doba': 'The Celts and the La Tène period',
  'Stredovek po Veľkej Morave': 'The Middle Ages after Great Moravia',
  'Kostoly a kresťanstvo': 'Churches and Christianity',
  'Zbrane a vojenstvo': 'Weapons and warfare',
  'Slovania a Samova ríša': "The Slavs and Samo's Empire",
  'Pohrebiská a mohyly': 'Cemeteries and burial mounds',
  'Remeslá, železo a obchod': 'Crafts, iron and trade',
  'Keramika a každodenný život': 'Pottery and everyday life',
  'Praveké osídlenie': 'Prehistoric occupation',
  'Doba rímska a Germáni': 'The Roman period and the Germanic peoples',
  'Avari a starí Maďari': 'The Avars and the Old Hungarians',
  'Šperky a ozdoby': 'Jewellery and ornaments',
  'Doba halštatská': 'The Hallstatt period',
};

/** Text rozhrania. V slovenčine vracia kľúč, v angličtine jeho preklad. */
const SLOVNIKY: Partial<Record<Jazyk, Record<string, string>>> = { en: EN, de: DE };

export function t(kluc: string): string {
  if (aktualny === 'sk') return kluc;
  return SLOVNIKY[aktualny]?.[kluc] ?? kluc;
}

/** Názov kategórie v jazyku stránky. Keď preklad nie je, vráti pôvodný. */
export const kategoria = (meno: string | undefined | null): string => (meno ? t(meno) : '');

/** Dátum v jazyku stránky. */
export function datum(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(narodneProstredie(), { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Datovanie lokalít ─────────────────────────────────────────────────────
   Hodnoty z `lokality.json`: buď storočie („9.–10. stor.", „2. st. pred n. l."),
   alebo pomenované obdobie („doba halštatská"). Prekladá sa jazyk, ČÍSLA
   ostávajú tak, ako ich určil autor. Čo sa netrafí do vzoru ani do slovníka,
   vráti sa nezmenené — radšej slovenský tvar než vymyslený anglický. */
const OBDOBIA: Record<string, string> = {
  'pravek': 'prehistory',
  'doba bronzová': 'the Bronze Age',
  'doba halštatská': 'the Hallstatt period',
  'halštat': 'Hallstatt period',
  'doba laténska': 'the La Tène period',
  'neskorý latén': 'late La Tène period',
  'koniec laténu': 'end of the La Tène period',
  'doba rímska': 'the Roman period',
  'laténska–rímska': 'La Tène–Roman',
  'bronzová–laténska': 'Bronze Age–La Tène',
  'd. bronzová/latén': 'Bronze Age / La Tène',
  'púchovská kultúra': 'Púchov culture',
  'stredný eneolit': 'Middle Eneolithic',
  'vrcholný stredovek': 'High Middle Ages',
  'po Veľkej Morave': 'after Great Moravia',
  'prelom letopočtov': 'turn of the era',
  'prelom letopočtu': 'turn of the era',
};

/** 1 → 1st, 2 → 2nd, 3 → 3rd, 11 → 11th … */
function radova(n: number): string {
  const des = n % 100;
  if (des >= 11 && des <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;
}

export function datovanie(text: string | null | undefined): string {
  if (!text) return '';
  if (aktualny === 'sk') return text;

  const holy = text.trim();
  const zoSlovnika = OBDOBIA[holy.toLowerCase()] ?? OBDOBIA[holy];
  if (zoSlovnika) return zoSlovnika;

  /* „9. stor.", „9.–10. stor.", „1. stor. n. l.", „2. st. pred n. l.",
     „6. stor. pred Kr." — pomlčka môže byť spojovník aj dlhá a skratka
     storočia sa v údajoch píše aj „st.", aj „stor.". */
  const m = holy.match(/^(\d+)\.(?:\s*[–-]\s*(\d+)\.)?\s*st(?:or)?\.?\s*(pred n\. l\.|pred Kr\.|n\. l\.|po Kr\.)?$/i);
  if (m) {
    const [, od, do_, era] = m;
    const pred = era ? /pred/.test(era) : false;
    const koniec = pred ? ' BC' : (era ? ' AD' : '');
    return do_
      ? `${radova(+od)}–${radova(+do_)} centuries${koniec}`
      : `${radova(+od)} century${koniec}`;
  }

  return text;
}
