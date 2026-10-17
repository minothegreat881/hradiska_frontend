/**
 * ZÁKLADNÝ VZHĽAD — dnešný web zapísaný ako vzhľad.
 *
 * Skladá sa z konštánt, ktoré boli predtým rozhádzané po komponentoch
 * (`data/rozcestnik.ts`, `data/categories.ts`, `data/cinnost.ts`,
 * `data/domovska.ts`, `data/menu.ts`, `data/pata.ts`). Konštanty ostávajú
 * v kóde, komponenty ich však nečítajú priamo — čítajú vzhľad.
 *
 * Používa sa ako záchranná sieť (plán, časť 6.1):
 *   • keď API vzhľadu nie je, zlyhá alebo vráti `data: null`,
 *   • po kúskoch, keď vo vzhľade z API niečo chýba (fotka, záznam kategórie).
 * S ním musí web nakresliť BAJT PO BAJTE to isté, čo pred zavedením vzhľadu
 * (test `scripts/vzhlad/test-zhoda.mjs`, režim 1).
 *
 * Zásady zápisu:
 *   • kategórie a články sa odkazujú SLUGOM (`dokument: null`) — bundle
 *     `documentId` nepozná; doplní ho až prevod (`scripts/vzhlad/prevod.mjs`),
 *   • obrázky sú dnešné cesty (`/uploads/…`), súbory webu majú `vlastny: true`,
 *   • texty majú len `sk` — anglické a nemecké znenie dodá slovník cez `t()`
 *     presne tak ako dnes. Výslovné `en`/`de` sú len tam, kde ich dnes kód
 *     nesie mimo slovníka (krátke názvy v menu).
 */

import { hradiskaCategories } from '../../data/categories';
import { ROZCESTNIK_TYPY, ROZCESTNIK_PRAMENE } from '../../data/rozcestnik';
import { CINNOSTI } from '../../data/cinnost';
import {
  UVOD, NADPIS_PRAMENE, VYZVA_HLADANIA, POPULARNE, NADPIS_DALSI_OBSAH, DALSI_OBSAH,
  NADPIS_CINNOSTI, CINNOSTI_MIMO_DOMOVSKEJ, PRIPNUTE_KRONIKY, KRONIKA_INTRO_SLUG,
  KRONIKA_OBRAZOK_KATEGORIE, PRIDAJTE_SA,
} from '../../data/domovska';
import { PRIMARY_SLUGS, EXCLUDE_SLUGS, SHORT, SHORT_EN, SHORT_DE } from '../../data/menu';
import { PATA_KATEGORIE, PATA_CLANKY, PATA_NADPISY, PATA_SIETE } from '../../data/pata';
import {
  SCHEMA_VZHLADU,
  type Vzhlad, type Text, type OdkazKategorie, type OdkazClanku, type Obrazok,
  type VzhladKategorie, type SkupinaDlazdic, type PolozkaCinnosti, type KlucCinnosti,
} from './typy';

const sk = (s: string): Text => ({ sk: s });
const kat = (slug: string): OdkazKategorie => ({ dokument: null, slug });
const cl = (slug: string): OdkazClanku => ({ dokument: null, slug });
/** Súbor Strapi podľa cesty alebo súbor webu (`/znak_minca.webp`). */
const obr = (cesta: string, vlastny?: boolean): Obrazok => (vlastny ? { cesta, vlastny: true } : { cesta });

/** Tvary počtu pod dlaždicou podľa rozcestníka (len deväť kategórií s dlaždicou). */
const TVARY = new Map([...ROZCESTNIK_TYPY, ...ROZCESTNIK_PRAMENE].map((p) => [p.slug, p]));

function zaznamKategorie(c: (typeof hradiskaCategories)[number]): VzhladKategorie {
  const r = TVARY.get(c.slug);
  const menuSk = SHORT[c.slug] ?? null;
  const menuEn = SHORT_EN[c.slug] ?? null;
  const menuDe = SHORT_DE[c.slug] ?? null;
  return {
    kategoria: kat(c.slug),
    /* Celý názov berie web z databázy (tak ako dnes); názov z kódu nastúpi,
       len keď databáza neodpovie — ten je v `titulok`. */
    nazov: null,
    /* Bublina dlaždice a lišty: celý názov z kódu („Strážna a hospodárska
       funkcia"), nie z databázy — tak to dlaždice robili. */
    titulok: sk(c.label),
    /* Kategórie bez dlaždice (3D modely, odborné texty, tabule, aktuality)
       popisok dlaždice dnes nikde neukazujú; je tu celý názov. */
    popisokDlazdice: sk(r ? r.label : c.label),
    popisokMenu: menuSk || menuEn || menuDe ? { sk: menuSk, en: menuEn, de: menuDe } : null,
    popis: sk(c.description),
    obrazok: obr(c.image),
    tvary: r ? { sk: r.tvary } : null,
    clanky: { zoradenie: 'zverejnenie', pripnute: [] },
  };
}

function skupina(id: string, nadpis: Text | null, polozky: { slug: string }[]): SkupinaDlazdic {
  return { id, nadpis, polozky: polozky.map((p) => ({ id: p.slug, kategoria: kat(p.slug), pocet: true })) };
}

const obrazokKroniky = hradiskaCategories.find((c) => c.slug === KRONIKA_OBRAZOK_KATEGORIE)?.image;

export const ZAKLADNY_VZHLAD: Vzhlad = {
  schema: SCHEMA_VZHLADU,
  domov: {
    uvod: {
      nadtitulok: sk(UVOD.nadtitulok),
      nadpis: sk(UVOD.nadpis),
      znak: null,
    },
    dlazdice: {
      viditelne: true,
      skupiny: [
        skupina('typy', null, ROZCESTNIK_TYPY),
        skupina('pramene', sk(NADPIS_PRAMENE), ROZCESTNIK_PRAMENE),
      ],
    },
    hladanie: {
      viditelne: true,
      vyzva: sk(VYZVA_HLADANIA),
      popularneViditelne: true,
      /* Mená hradísk sa dnes neprekladajú (nejdú cez `t()`); v slovníku nie sú,
         takže `t()` by ich vrátil nezmenené — výsledok je ten istý. */
      popularne: POPULARNE.map((p) => ({ text: sk(p.text), clanok: cl(p.slug) })),
    },
    sekcie: [
      { id: 'mapa', typ: 'mapa', viditelna: true },
      {
        id: 'dalsi-obsah',
        typ: 'dalsi-obsah',
        viditelna: true,
        nadpis: sk(NADPIS_DALSI_OBSAH),
        riadky: DALSI_OBSAH.map((k) => ({
          id: k.slug,
          kategoria: kat(k.slug),
          /* Nadpis výslovne: „3D modely" je kratší než celý názov kategórie
             a riadok ho tak mal vždy. */
          nadpis: sk(k.label),
          pocet: 4,
          vyber: 'najnovsie',
          zoradenie: 'zverejnenie',
          lenSObrazkom: true,
          clanky: [],
          obrazky: [],
        })),
      },
      { id: 'cinnost', typ: 'cinnost', viditelna: true },
      {
        id: 'kronika',
        typ: 'kronika',
        viditelna: true,
        uvodnyClanok: cl(KRONIKA_INTRO_SLUG),
        pripnute: PRIPNUTE_KRONIKY.map(cl),
        obrazok: obrazokKroniky ? obr(obrazokKroniky) : null,
        fotogaleriaViditelna: true,
      },
    ],
    fotogaleria: null,
    pridajteSa: {
      viditelna: true,
      nadtitulok: sk(PRIDAJTE_SA.nadtitulok),
      nadpis: sk(PRIDAJTE_SA.nadpis),
      citat: sk(PRIDAJTE_SA.citat),
      uvod: sk(PRIDAJTE_SA.uvod),
      email: PRIDAJTE_SA.email,
      prosby: PRIDAJTE_SA.prosby.map((p) => ({ nadpis: sk(p.nadpis), text: sk(p.text) })),
    },
  },
  kategorie: hradiskaCategories.map(zaznamKategorie),
  cinnost: {
    nadpis: sk(NADPIS_CINNOSTI),
    polozky: CINNOSTI.map((c): PolozkaCinnosti => ({
      kluc: c.kluc as KlucCinnosti,
      nazov: sk(c.nazov),
      popis: sk(c.popis),
      obrazok: obr(c.obrazok, c.vlastny),
      viditelna: true,
      naDomovskej: !CINNOSTI_MIMO_DOMOVSKEJ.includes(c.kluc),
    })),
  },
  menu: {
    /* Poradie menu je z databázy (`order`); prázdne = nemeniť. */
    poradie: [],
    hlavnyRiadok: PRIMARY_SLUGS.map(kat),
    skryte: EXCLUDE_SLUGS.map(kat),
  },
  pata: {
    stlpce: [
      {
        id: 'kategorie',
        nadpis: sk(PATA_NADPISY.kategorie),
        odkazy: PATA_KATEGORIE.map((l) => ({ text: sk(l.label), ciel: { druh: 'kategoria' as const, kategoria: kat(l.slug) } })),
      },
      {
        id: 'clanky',
        nadpis: sk(PATA_NADPISY.clanky),
        odkazy: PATA_CLANKY.map((l) => ({ text: sk(l.label), ciel: { druh: 'kategoria' as const, kategoria: kat(l.slug) } })),
      },
    ],
    siete: PATA_SIETE.map((s) => ({ druh: s.druh, url: s.url })),
  },
};

export default ZAKLADNY_VZHLAD;
