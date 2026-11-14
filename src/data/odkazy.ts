/**
 * VOĽNÉ ODKAZY — rad pod hľadaním (K2) a tlačidlá a odkazy pod činnosťou
 * združenia (K3), požiadavka klienta zo 14. 11. 2026. Základný vzhľad ich
 * berie odtiaľto (`lib/vzhlad/zakladny.ts`); redaktor ich mení v editore
 * vzhľadu (obrázok, text v troch jazykoch, cieľ, poradie, skrytie).
 *
 * ODKIAĽ ČO JE. Nič tu nie je vymyslené: ciele a obrázky sú z bočného panela
 * starého webu (www.hradiska.sk, Blogger), staré adresy sú preložené na nové
 * podľa presmerovaní vo `vercel.json` a obrázky sú súbory z knižnice médií
 * Strapi — ten istý obrázok ako v bočnom paneli, alebo titulná fotka cieľového
 * článku, keď pôvodný obrázok v knižnici nie je:
 *
 *   Pôvod Slovanov          panel Image41 → 2016/12/kedy-prisli-slovania-na-slovensko; mapa kultúr (v knižnici novšie vydanie)
 *   Archeologické obdobia   panel Image66 → 2024/11/archeologicke-kultury-na-slovensku; tabuľka kultúr
 *   Občianske združenie     panel Image14 viedol na blog hradiska333.blogspot.com, jeho obrázok v knižnici nie je;
 *                           odkaz vedie na článok o zásadách združenia s jeho logom (rozhodnutie, pozri STAV.md)
 *   Nálezné vo výške 100 %  panel Image37 → 2016/08/ohlasit-archeologicky-nalez-sa-oplati; fotka z tej istej série (IMG_8191)
 *   Detektor                panel Image22 → 2014/02/detektorizmus-skodi-nasej-historii; „zákaz detektorov“
 *   Naša facebooková skupina panel Image6/Image7 → facebook.com/groups/118846781525141; obrázok „facebook“
 *   Informačné tabule       panel Image21 → kategória Informačné tabule; tabula1
 *   Mapy                    panel Image64 „Mapy“ → www.slovia.sk
 *   Knihy                   panel Image50 „Knihy o Slovanoch“ → článok Knihy o Slovanoch
 *
 * Čo sa nenašlo, je SKRYTÉ a bez cieľa (redaktor ho doplní v editore):
 *   Naše ďalšie blogy       panel mal zoznam štyroch blogov (BlogList1), nie jeden cieľ, a žiadny obrázok
 *   Archeoskanzeny          panel mal zoznam 12 odkazov (LinkList4), nový web nemá stránku, kam by viedol jeden odkaz
 *   Odporúčané stránky …    panel mal zoznam 16 odkazov (LinkList1), to isté
 */

export interface VolnyOdkazVKode {
  id: string;
  text: string;
  /** Cesta súboru v knižnici médií (`/uploads/…`); null = bez obrázka. */
  obrazok: string | null;
  ciel:
    | { druh: 'clanok'; slug: string }
    | { druh: 'kategoria'; slug: string }
    | { druh: 'url'; url: string }
    | null;
  viditelny: boolean;
  hlavny?: boolean;
}

/** K2 — rad obrázkových odkazov pod hľadaním. */
export const ODKAZY_POD_HLADANIM: VolnyOdkazVKode[] = [
  {
    id: 'povod-slovanov', text: 'Pôvod Slovanov',
    obrazok: '/uploads/1cf988a7_dbe3_4310_88c4_f807a8f36de5_9746e03163.png',
    ciel: { druh: 'clanok', slug: 'kedy-prisli-slovania-na-slovensko' }, viditelny: true,
  },
  {
    id: 'archeologicke-obdobia', text: 'Archeologické obdobia',
    obrazok: '/uploads/tabulka_d525348ed9.jpg',
    ciel: { druh: 'clanok', slug: 'archeologicke-kultury-na-slovensku-datovanie' }, viditelny: true,
  },
  {
    id: 'obcianske-zdruzenie', text: 'Občianske združenie Hradiská',
    obrazok: '/uploads/14030839_171692423253423_141306167_n_d02ca32314.png',
    ciel: { druh: 'clanok', slug: 'zakladne-zasady-obcianskeho-zdruzenia-hradiska' }, viditelny: true,
  },
  {
    id: 'nalezne', text: 'Nálezné vo výške 100 %',
    obrazok: '/uploads/IMG_8191_bf613f6267.JPG',
    ciel: { druh: 'clanok', slug: 'ohlasit-archeologicky-nalez-sa-oplati-patri-vam-nalezne' }, viditelny: true,
  },
  {
    id: 'detektor', text: 'Detektor',
    obrazok: '/uploads/zakaz_detektorov_3a271b8638.jpg',
    ciel: { druh: 'clanok', slug: 'nelegalny-detektorizmus-skodi-nasej-historii' }, viditelny: true,
  },
];

/** K3 — obrázkové tlačidlá pod dlaždicami činnosti; hlavné sú informačné tabule. */
export const TLACIDLA_CINNOSTI: VolnyOdkazVKode[] = [
  {
    id: 'facebook', text: 'Naša facebooková skupina',
    obrazok: '/uploads/facebook_44b63702fc.jpg',
    ciel: { druh: 'url', url: 'https://www.facebook.com/groups/118846781525141/' }, viditelny: true,
  },
  {
    id: 'tabule', text: 'Informačné tabule',
    obrazok: '/uploads/tabula1_5ac71873cd.jpg',
    ciel: { druh: 'kategoria', slug: 'informacne-tabule' }, viditelny: true, hlavny: true,
  },
  { id: 'blogy', text: 'Naše ďalšie blogy', obrazok: null, ciel: null, viditelny: false },
];

/** K3 — textové odkazy pod tlačidlami. */
export const ODKAZY_CINNOSTI: VolnyOdkazVKode[] = [
  { id: 'mapy', text: 'Mapy', obrazok: null, ciel: { druh: 'url', url: 'https://www.slovia.sk/' }, viditelny: true },
  { id: 'archeoskanzeny', text: 'Archeoskanzeny', obrazok: null, ciel: null, viditelny: false },
  { id: 'knihy', text: 'Knihy', obrazok: null, ciel: { druh: 'clanok', slug: 'knihy-o-slovanoch' }, viditelny: true },
  { id: 'odporucane-stranky', text: 'Odporúčané stránky k dejinám Slovanov', obrazok: null, ciel: null, viditelny: false },
];

/**
 * Súbory, ktoré Strapi nezmenšoval (originál je menší než 500 px), takže
 * zmenšenina `small_…` neexistuje. Platí len pre cesty v základnom vzhľade —
 * súbor z knižnice (`{ id }`) si veľkosti nesie sám.
 */
export const BEZ_ZMENSENIN = new Set([
  '/uploads/facebook_44b63702fc.jpg',
  '/uploads/zakaz_detektorov_3a271b8638.jpg',
]);
