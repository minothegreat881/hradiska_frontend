/**
 * ROZCESTNÍK KATEGÓRIÍ — spoločný zoznam pre domovskú aj stránku článku.
 *
 * Domovská ho vykresľuje ako veľké dlaždice (`LabKategorieRychle`), článok
 * ako úzku lištu mini dlaždíc (`LabKategorieLista`). Zoznam je tu raz, aby
 * sa poradie ani názvy nerozišli — handoff to žiada výslovne („nedupľikuj
 * zoznam, použi spoločný zdroj").
 *
 * Názvy sú SKRÁTENÉ oproti Strapi („Hospodárska" namiesto „Strážna
 * a hospodárska funkcia"), aby sa vošli pod obrázok. Skutočné názvy
 * kategórií sa tým nemenia.
 *
 * `tvary` sú tri tvary počítaného podstatného mena pre riadok s počtom
 * („1 prameň / 2 pramene / 5 prameňov"). Lišta na stránke článku počty
 * nezobrazuje, potrebuje ich len domovská.
 */

export interface PolozkaRozcestnika {
  slug: string;
  label: string;
  /** 1 / 2–4 / 5 a viac */
  tvary: [string, string, string];
}

const HRADISKO: [string, string, string] = ['hradisko', 'hradiská', 'hradísk'];

/** Horný rad: typy hradísk. */
export const ROZCESTNIK_TYPY: PolozkaRozcestnika[] = [
  { slug: 'kniezacie-sidla', label: 'Kniežacie sídla', tvary: HRADISKO },
  { slug: 'mocenske-centra', label: 'Mocenské centrá', tvary: HRADISKO },
  { slug: 'strazna-funkcia', label: 'Hospodárska', tvary: HRADISKO },
  { slug: 'refugia', label: 'Refúgiá', tvary: HRADISKO },
  { slug: 'staroveke-sidla', label: 'Staroveké hradiská', tvary: HRADISKO },
];

/** Spodný rad: pramene a tradícia. */
export const ROZCESTNIK_PRAMENE: PolozkaRozcestnika[] = [
  { slug: 'listiny-a-pisomne-zdroje', label: 'Listiny a pís. zdroje', tvary: ['prameň', 'pramene', 'prameňov'] },
  { slug: 'vseobecne-o-hradiskach', label: 'Všeobecne o hradiskách', tvary: ['text', 'texty', 'textov'] },
  { slug: 'povesti', label: 'Povesti', tvary: ['povesť', 'povesti', 'povestí'] },
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne', tvary: ['svätyňa', 'svätyne', 'svätýň'] },
];

/** Slovenčina počíta v troch tvaroch: 1 hradisko, 2 hradiská, 5 hradísk. */
export function tvarPoctu(n: number, [jedno, malo, vela]: [string, string, string]): string {
  if (n === 1) return jedno;
  if (n >= 2 && n <= 4) return malo;
  return vela;
}

/** Základ adries Strapi médií — rovnaký výpočet ako v `lib/strapi.ts`. */
export function zakladStrapi(): string {
  if (!import.meta.env.PROD) return import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
  return typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi';
}
