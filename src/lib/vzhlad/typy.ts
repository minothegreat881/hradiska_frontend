/**
 * VZHĽAD WEBU — spoločná definícia pre web (FE `src/lib/vzhlad/typy.ts`) aj backend
 * (BE `src/api/vzhlad-webu/typy.ts`). Oba súbory sú IDENTICKÉ; mení sa len spolu
 * (kontroluje to `scripts/vzhlad/porovnaj-typy.mjs` v BE).
 *
 * Vzhľad = všetko, čo je na stránkach „prezentácia“: dlaždice kategórií, ich obrázky
 * a popisky, poradie a skupiny, sekcie domovskej a ich viditeľnosť, riadky článkov,
 * pripnuté zápisy, činnosť združenia, päta, krátke názvy v menu, obrázky a popisy
 * stránok kategórií. Obsah článkov sem NEPATRÍ (ten má editor článkov).
 *
 * Bez Strapi i18n: texty majú jazyky výslovne ({ sk, en, de }). Bez Strapi konceptov:
 * koncept aj zverejnená verzia sú celé JSON v jednom single type (pozri plán, časť 4).
 *
 * Súbor nemá žiadne importy, aby sa dal skopírovať do oboch repozitárov.
 */

export const SCHEMA_VZHLADU = 1 as const;

export type Jazyk = 'sk' | 'en' | 'de';
export const JAZYKY: readonly Jazyk[] = ['sk', 'en', 'de'];

/* ───────────────────────── Texty ───────────────────────── */

/**
 * Text v troch jazykoch. `sk` je povinná. `en`/`de` = výslovný preklad; keď chýba (null
 * alebo ''), web použije preklad zo slovníka `t(sk)` a ak ani ten nie je, slovenčinu.
 * `enZo`/`deZo` = slovenské znenie, z ktorého preklad vznikol. Keď sa `sk` líši od `enZo`,
 * editor ukáže „preklad je k staršiemu zneniu“ (na webe ostáva starý preklad).
 */
export interface Text {
  sk: string;
  en?: string | null;
  de?: string | null;
  enZo?: string | null;
  deZo?: string | null;
}

/** Text, ktorý môže chýbať aj v slovenčine (napr. krátky názov v menu len pre jeden jazyk). */
export interface TextVolitelny {
  sk?: string | null;
  en?: string | null;
  de?: string | null;
  enZo?: string | null;
  deZo?: string | null;
}

/* ───────────────────────── Odkazy na údaje ───────────────────────── */

/**
 * Kategória. `dokument` = documentId v Strapi (stabilný, aj po premenovaní slugu).
 * `slug` = posledný známy slug; server ho pri čítaní vždy prepíše aktuálnym.
 * Základný vzhľad v bundli `dokument` nepozná (null) a odkazuje len slugom.
 */
export interface OdkazKategorie {
  dokument: string | null;
  slug: string;
}

/**
 * Článok. `dokument` = documentId (v Strapi 5 rovnaký vo všetkých jazykoch).
 * `slug` = slovenský slug v čase uloženia (len na čítanie človekom a pre základný vzhľad).
 * Slug v jazyku stránky dodá server v `clanky` odpovede.
 */
export interface OdkazClanku {
  dokument: string | null;
  slug: string;
}

/**
 * Obrázok. Buď súbor z knižnice médií (`id`), alebo cesta (`cesta`):
 *  - `/uploads/…` = súbor Strapi (len základný vzhľad a staré záznamy; varianty sa skladajú predponou),
 *  - `/<súbor>.webp|png|jpg|svg` = súbor webu v `public/` (napr. `/znak_minca.webp`), `vlastny: true`.
 * `pozicia` = výrez (object-position, napr. "50% 40%"); null = stred.
 */
export type Obrazok =
  | { id: number; pozicia?: string | null }
  | { cesta: string; vlastny?: boolean; pozicia?: string | null };

/** Cieľ odkazu (päta, populárne). */
export type Ciel =
  | { druh: 'kategoria'; kategoria: OdkazKategorie }
  | { druh: 'clanok'; clanok: OdkazClanku }
  | { druh: 'cesta'; cesta: string } // cesta webu: '/aktuality', '/galeria', '/aktuality?cinnost=vyskumy' …
  | { druh: 'url'; url: string }; // 'https://…' alebo 'mailto:…'

/* ───────────────────────── Kategórie ───────────────────────── */

export type ZoradenieClankov = 'zverejnenie' | 'povodny-datum' | 'abecedne';

/** Ako sa kategória ukazuje na webe (dlaždice, lišta, menu, stránka kategórie). */
export interface VzhladKategorie {
  kategoria: OdkazKategorie;
  /**
   * Celý názov (nadpis stránky kategórie, menu, päta). null = názov z databázy (`blog-category.name`).
   * `sk` sa pri zverejnení zapíše aj do `blog-category.name` (staré verzie webu ho čítajú).
   */
  nazov: Text | null;
  /** Celý názov v bubline dlaždice (atribút title). null = `nazov`. */
  titulok: Text | null;
  /** Krátky popisok na dlaždici a v lište kategórií. */
  popisokDlazdice: Text;
  /** Krátky názov v hornom menu; čo chýba, ostáva `nazov` v danom jazyku. */
  popisokMenu: TextVolitelny | null;
  /** Popis na stránke kategórie. null = popis z databázy. */
  popis: Text | null;
  /** Obrázok dlaždice, lišty aj hlavičky stránky kategórie. null = bez obrázka. */
  obrazok: Obrazok | null;
  /**
   * Tvary počtu pod dlaždicou: sk = [1, 2–4, 5+] („hradisko, hradiská, hradísk“),
   * en/de = jedno množné číslo. null = počet bez slova.
   */
  tvary: { sk: [string, string, string]; en?: string | null; de?: string | null } | null;
  /** Zoznam článkov na stránke kategórie. */
  clanky: { zoradenie: ZoradenieClankov; pripnute: OdkazClanku[] };
}

/* ───────────────────────── Domovská stránka ───────────────────────── */

export interface Dlazdica {
  /** Jedinečné v rámci celých dlaždíc, [a-z0-9-]{1,40}. */
  id: string;
  kategoria: OdkazKategorie;
  /** Ukázať počet článkov pod popiskom. */
  pocet: boolean;
}

export interface SkupinaDlazdic {
  /** 'typy', 'pramene' alebo vlastné; dáva triedu `lkat-rad--<id>`. */
  id: string;
  /** Nadpis oddeľovača pred skupinou. Prvá skupina ho nemá (null). */
  nadpis: Text | null;
  polozky: Dlazdica[];
}

export interface Popularne {
  text: Text;
  clanok: OdkazClanku;
}

export interface RiadokClankov {
  id: string;
  kategoria: OdkazKategorie;
  /** Nadpis riadku. null = názov kategórie. */
  nadpis: Text | null;
  /** Koľko článkov sa ukáže (1–8). */
  pocet: number;
  /** 'najnovsie' = automaticky podľa `zoradenie`; 'rucne' = `clanky` v tomto poradí (chýbajúce doplní najnovšími). */
  vyber: 'najnovsie' | 'rucne';
  zoradenie: ZoradenieClankov;
  /** Pri 'najnovsie': brať len články s titulnou fotkou (dnes áno). */
  lenSObrazkom: boolean;
  clanky: OdkazClanku[];
  /** Iný obrázok len na tejto dlaždici (obrázok článku sa nemení). */
  obrazky: { clanok: OdkazClanku; obrazok: Obrazok }[];
}

export type SekciaDomov =
  | { id: string; typ: 'mapa'; viditelna: boolean }
  | { id: string; typ: 'dalsi-obsah'; viditelna: boolean; nadpis: Text; riadky: RiadokClankov[] }
  | { id: string; typ: 'cinnost'; viditelna: boolean }
  | {
      id: string;
      typ: 'kronika';
      viditelna: boolean;
      /** Úvodný (pripnutý vľavo) článok kroniky. null = bez neho. */
      uvodnyClanok: OdkazClanku | null;
      /** Zápisy na začiatku pásu, v tomto poradí. */
      pripnute: OdkazClanku[];
      /** Obrázok v ľavom hornom bloku sekcie. */
      obrazok: Obrazok | null;
      fotogaleriaViditelna: boolean;
    };

export type TypSekcie = SekciaDomov['typ'];
export const TYPY_SEKCII: readonly TypSekcie[] = ['mapa', 'dalsi-obsah', 'cinnost', 'kronika'];

export interface PridajteSa {
  viditelna: boolean;
  nadtitulok: Text;
  nadpis: Text;
  citat: Text;
  uvod: Text;
  email: string;
  prosby: { nadpis: Text; text: Text }[];
}

export interface Domov {
  /** Úvod je vždy prvý. Dlaždice a hľadanie sú jeho súčasťou (dajú sa skryť, nie presunúť). */
  uvod: {
    nadtitulok: Text;
    nadpis: Text;
    /** Znak nad nadpisom. null = dnešné prekrížené kopije. */
    znak: Obrazok | null;
  };
  dlazdice: { viditelne: boolean; skupiny: SkupinaDlazdic[] };
  hladanie: {
    viditelne: boolean;
    vyzva: Text;
    popularneViditelne: boolean;
    popularne: Popularne[];
  };
  /** Sekcie medzi úvodom a „Pridajte sa“, v poradí na stránke. Každý typ najviac raz, okrem 'dalsi-obsah'. */
  sekcie: SekciaDomov[];
  /** Vybraná fotogaléria v kronike. Zverejnenie ju zapíše do `domovska-galeria.fotky`. null = nemeniť. */
  fotogaleria: { fotky: number[] } | null;
  /** „Staňte sa našimi spolupracovníkmi“ — vždy posledná. */
  pridajteSa: PridajteSa;
}

/* ───────────────────────── Činnosť združenia ───────────────────────── */

/** Kľúče sú pevné (triedenie kroniky podľa činnosti je v kóde, `data/cinnost.ts`). */
export type KlucCinnosti = 'tabule' | 'publikacie' | 'dane' | 'rekonstrukcie' | 'vyskumy' | 'vypravy' | 'prednasky';
export const KLUCE_CINNOSTI: readonly KlucCinnosti[] = [
  'tabule', 'publikacie', 'dane', 'rekonstrukcie', 'vyskumy', 'vypravy', 'prednasky',
];

export interface PolozkaCinnosti {
  kluc: KlucCinnosti;
  nazov: Text;
  popis: Text;
  obrazok: Obrazok;
  /** Ukázať všade, kde sa činnosť kreslí (domovská, pod článkom, aktuality). */
  viditelna: boolean;
  /** Ukázať aj na domovskej (dnes tabule a 3D rekonštrukcie nie). */
  naDomovskej: boolean;
}

export interface Cinnost {
  nadpis: Text;
  /** Poradie = poradie zobrazenia. Každý kľúč práve raz. */
  polozky: PolozkaCinnosti[];
}

/* ───────────────────────── Menu a päta ───────────────────────── */

export interface Menu {
  /**
   * Poradie všetkých kategórií. Web aj staré verzie čítajú poradie z `blog-category.order`;
   * zverejnenie ho tam zapíše (10, 20, 30 …). Tu je len to, čo editor navrhuje.
   */
  poradie: OdkazKategorie[];
  /** Kategórie v hlavnom riadku menu (dnes 6 „typov hradísk“). */
  hlavnyRiadok: OdkazKategorie[];
  /** Kategórie, ktoré v menu nie sú (dnes `ostatne`). */
  skryte: OdkazKategorie[];
}

export type DruhSiete = 'facebook' | 'instagram' | 'youtube' | 'email';
export const DRUHY_SIETI = ['facebook', 'instagram', 'youtube', 'email'] as const;

export interface Pata {
  stlpce: { id: string; nadpis: Text; odkazy: { text: Text; ciel: Ciel }[] }[];
  siete: { druh: DruhSiete; url: string }[];
}

/* ───────────────────────── Celý vzhľad ───────────────────────── */

export interface Vzhlad {
  schema: typeof SCHEMA_VZHLADU;
  domov: Domov;
  kategorie: VzhladKategorie[];
  cinnost: Cinnost;
  menu: Menu;
  pata: Pata;
}

/* ───────────────────────── Odpovede API ───────────────────────── */

export interface Subor {
  id: number;
  url: string;
  width: number | null;
  height: number | null;
  alt: string | null;
  formats: Partial<Record<'thumbnail' | 'small' | 'medium' | 'large', { url: string; width: number; height: number }>>;
}

export interface ClanokVJazyku {
  slug: string;
  nazov: string;
  /** id titulnej fotky (je v `subory`) alebo null. */
  obrazok: number | null;
}

/** Údaje, ktoré server k vzhľadu doplní, aby web nemusel nič dohľadávať. */
export interface Rozriesene {
  subory: Record<string, Subor>;
  /** documentId → aktuálny slug, názov z DB a poradie z DB. */
  kategorie: Record<string, { slug: string; nazov: string; poradie: number }>;
  /** documentId → článok v jednotlivých jazykoch (len zverejnené). */
  clanky: Record<string, Partial<Record<Jazyk, ClanokVJazyku>>>;
}

/** GET /api/vzhlad-webu */
export interface OdpovedVzhladu extends Rozriesene {
  data: Vzhlad | null;
  verzia: number;
}

/** Hodnoty v databáze, z ktorých koncept vychádzal (trojcestné zlúčenie pri zverejnení). */
export interface ZakladDb {
  /** documentId → blog-category.order */
  poradie: Record<string, number>;
  /** documentId → blog-category.name */
  nazvy: Record<string, string>;
  /** domovska-galeria.fotky (id súborov v poradí) */
  fotogaleria: number[];
}

/** GET /api/vzhlad-webu/koncept */
export interface OdpovedKonceptu extends Rozriesene {
  koncept: Vzhlad | null;
  zakladDb: ZakladDb | null;
  zverejnene: Vzhlad | null;
  verziaKonceptu: number;
  verziaZverejnena: number;
  konceptUpravil: string | null;
  konceptUpravene: string | null;
  zverejnilKto: string | null;
  zverejneneKedy: string | null;
  /** Aktuálne hodnoty v DB (na porovnanie so `zakladDb`). */
  db: ZakladDb;
}

/** Chyba kontroly: cesta k poľu (napr. "domov.dlazdice.skupiny[1].polozky[0].kategoria") a správa po slovensky. */
export interface ChybaVzhladu {
  cesta: string;
  sprava: string;
}

/* ───────────────────────── Limity (server aj editor) ───────────────────────── */

export const LIMITY = {
  popisokDlazdice: 40,
  popisokMenu: 40,
  nazov: 100,
  nadpis: 120,
  popis: 500,
  textKratky: 200, // citát, prosba – nadpis
  textDlhy: 1000, // úvod „Pridajte sa“, text prosby
  email: 120,
  url: 500,
  skupinDlazdic: 4,
  dlazdicVSkupine: 12,
  riadkovClankov: 8,
  clankovVRiadku: 8,
  pripnutych: 8,
  popularnych: 6,
  fotiekGalerie: 12,
  stlpcovPaty: 4,
  odkazovVStlpci: 12,
  prosieb: 6,
  historia: 100,
} as const;

/** Povolené id položiek. */
export const VZOR_ID = /^[a-z0-9-]{1,40}$/;
/** Povolené cesty webu v odkazoch. Nie `//…` — prehliadač by to bral ako adresu iného webu. */
export const VZOR_CESTY = /^\/(?!\/)[a-z0-9\-/]*(\?[a-z0-9=&\-]*)?$/;
/** Povolené cesty obrázkov (súbory Strapi alebo súbory webu v koreni). */
export const VZOR_CESTY_OBRAZKA = /^(\/uploads\/[A-Za-z0-9_.\-]+|\/[A-Za-z0-9_.\-]+\.(webp|png|jpg|jpeg|svg))$/;
