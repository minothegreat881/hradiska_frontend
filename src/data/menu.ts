/**
 * HORNÉ MENU — rozdelenie kategórií a krátke názvy. Presťahované z `LabNav`.
 *
 * Komponent ich nečíta priamo: sú zdrojom základného vzhľadu
 * (`lib/vzhlad/zakladny.ts`). Poradie kategórií v menu je ďalej z databázy
 * (`blog-category.order`).
 */

/**
 * Delenie kategórií. Pôvodná lišta ho už používala, len ho nedávala najavo —
 * oba riadky vyzerali rovnako, takže 14 položiek pôsobilo ako stena. Tu každý
 * riadok dostal tichý názov, čím sa z hromady stane štruktúra:
 *   riadok 1 — TYPY HRADÍSK (podľa funkcie sídla)
 *   riadok 2 — ĎALŠÍ OBSAH (pramene, texty, modely, dianie)
 */
export const PRIMARY_SLUGS = [
  'kniezacie-sidla', 'mocenske-centra', 'strazna-funkcia',
  'refugia', 'staroveke-sidla', 'vseobecne-o-hradiskach',
];
// „Ostatné" má 0 článkov — v lište nemá čo robiť (rovnako ako v pôvodnej).
export const EXCLUDE_SLUGS = ['ostatne'];

/**
 * Skrátené názvy PRE LIŠTU. Plné znenie ostáva všade inde — v roletke, na
 * stránke kategórie aj v pätičke; tu ide len o to, aby sa rad zmestil na jeden
 * riadok. „Strážna a hospodárska funkcia" a „Všeobecne o hradiskách" spolu
 * zaberali skoro 200 px, čo stačilo na to, aby posledná kategória vypadla
 * mimo obrazovku bez akéhokoľvek náznaku, že tam ešte niečo je.
 *
 * Kľúč je slug, nie názov — keby sa kategória v Strapi premenovala, skratka
 * sa prestane používať a v lište sa objaví nové plné znenie. To je správne:
 * lepšie dlhý názov než nesprávny.
 */
export const SHORT: Record<string, string> = {
  'strazna-funkcia': 'Strážna funkcia',
  'vseobecne-o-hradiskach': 'Všeobecne',
  'svatyne-a-sakralne-objekty': 'Svätyne',
  'listiny-a-pisomne-zdroje': 'Listiny a pramene',
  '3d-modely': '3D modely',
  'informacne-tabule': 'Tabule',
};
/* Skrátené tvary pre lištu v cudzích jazykoch. Doslovný preklad slovenskej
   skratky („Všeobecne" → „Allgemein") by nedával zmysel, preto má každý
   jazyk vlastnú dvojicu. */
export const SHORT_EN: Record<string, string> = {
  'strazna-funkcia': 'Guard function',
  'listiny-a-pisomne-zdroje': 'Written sources',
  'svatyne-a-sakralne-objekty': 'Sanctuaries',
  'vseobecne-o-hradiskach': 'About hillforts',
  'informacne-tabule': 'Panels',
};
export const SHORT_DE: Record<string, string> = {
  'strazna-funkcia': 'Wachfunktion',
  'listiny-a-pisomne-zdroje': 'Urkunden',
  'svatyne-a-sakralne-objekty': 'Heiligtümer',
  'vseobecne-o-hradiskach': 'Allgemein',
  'informacne-tabule': 'Tafeln',
  'kniezacie-sidla': 'Fürstensitze',
  'mocenske-centra': 'Machtzentren',
  'staroveke-sidla': 'Vorzeit',
};
