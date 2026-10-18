/**
 * PREVOD DNEŠNÉHO STAVU (F3) — zo základného vzhľadu (konštanty v kóde)
 * vyrobí vzhľad v1, ktorý sa dá uložiť ako koncept a zverejniť.
 *
 * Spoločná logika pre skript `scripts/vzhlad/prevod.mjs` (Node, údaje z API
 * a z databázy) aj pre editor vzhľadu v administrácii („Založiť z dnešného
 * webu", údaje z API s prihlásením redaktora). Modul je čistý: nič nesťahuje,
 * všetko dostane vo vstupe.
 *
 * Čo sa mení oproti základnému vzhľadu (`zakladny.ts`):
 *   • kategórie a články dostanú `dokument` (documentId) podľa slugu (sk),
 *   • fotky `/uploads/…` sa nahradia `{ id }` súboru z knižnice médií (podľa
 *     `url`); súbory webu (`/znak_minca.webp`) ostanú ako cesta,
 *   • texty dostanú VÝSLOVNÉ `en`/`de` zo slovníkov — presne to, čo dnes
 *     vracia `t()`; `enZo`/`deZo` = slovenské znenie. Kde slovník preklad
 *     nemá, ostáva `null` (web vtedy ukáže slovenčinu ako dnes a editor to
 *     označí ako chýbajúci preklad),
 *   • `kategorie[].nazov` = názov z databázy (+ en/de cez slovník, ako
 *     `kategoria()`); pribudne záznam aj pre kategórie, ktoré v kóde nie sú,
 *   • `menu.poradie` = dnešné poradie z databázy (tak, ako ho vracia API
 *     a kreslí web),
 *   • `domov.fotogaleria.fotky` = dnešná `domovska-galeria`.
 */

import type { Jazyk, Vzhlad } from './typy';

export interface KategoriaZDb {
  documentId: string;
  slug: string;
  name: string;
  order?: number | null;
}

export interface VstupPrevodu {
  /** Základný vzhľad (`ZAKLADNY_VZHLAD`). */
  zakladny: Vzhlad;
  /** Kategórie z databázy v poradí, v akom ich vracia API (`sort=order:asc`). */
  kategorie: KategoriaZDb[];
  /** Slovenský slug článku → documentId (len články, ktoré v databáze sú). */
  clanky: Map<string, string>;
  /** Cesta `/uploads/…` → id súboru v knižnici médií. */
  subory: Map<string, number>;
  /** Dnešná domovská galéria (id súborov v poradí). */
  fotogaleria: number[];
  /** Preklad zo slovníka pre konkrétny jazyk (`prekladZoSlovnika` z `lib/jazyk.ts`). */
  preklad: (kluc: string, j: Jazyk) => string | null;
}

export interface VysledokPrevodu {
  vzhlad: Vzhlad;
  /** Odkazy, ktoré sa previesť nepodarilo (obrázok ostal cestou, odkaz bez documentId). */
  zvysky: string[];
  /** Kategórie z kódu, ktoré v databáze nie sú (vynechané). */
  chybajuceKategorie: string[];
}

/**
 * Slovenské slugy článkov a cesty obrázkov `/uploads/…`, na ktoré sa odkazuje
 * základný vzhľad — to treba dohľadať v databáze pred prevodom.
 */
export function odkazyZakladneho(z: Vzhlad): { slugyClankov: Set<string>; cestyObrazkov: Set<string> } {
  const slugyClankov = new Set<string>();
  const cestyObrazkov = new Set<string>();
  (function zber(x: unknown) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach(zber); return; }
    for (const [k, v] of Object.entries(x as Record<string, unknown>)) {
      if ((k === 'clanok' || k === 'uvodnyClanok') && v && typeof v === 'object' && 'slug' in v) slugyClankov.add((v as { slug: string }).slug);
      if (k === 'pripnute' || k === 'clanky') {
        for (const c of Array.isArray(v) ? v : []) {
          if (c && typeof c === 'object' && 'slug' in c && !('kategoria' in c)) slugyClankov.add((c as { slug: string }).slug);
        }
      }
      if (v && typeof v === 'object' && typeof (v as { cesta?: unknown }).cesta === 'string' && (v as { cesta: string }).cesta.startsWith('/uploads/')) {
        cestyObrazkov.add((v as { cesta: string }).cesta);
      }
      zber(v);
    }
  })(z);
  return { slugyClankov, cestyObrazkov };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Lubovolny = any;

/** Prevod základného vzhľadu na vzhľad v1. Poradie kľúčov je zámerne pevné (výstup skriptu sa porovnáva). */
export function prevedVzhlad(vstup: VstupPrevodu): VysledokPrevodu {
  const { kategorie: kat, clanky, subory, fotogaleria: fotkyGalerie } = vstup;
  const katPodlaSlugu = new Map(kat.map((k) => [k.slug, k]));

  const preklad = (sk: string | null | undefined, j: Jazyk) => (sk ? vstup.preklad(sk, j) : null);
  /** Text so slovenčinou → výslovné en/de zo slovníka (null, keď slovník nemá). */
  const text = (t: Lubovolny) => {
    if (!t || typeof t.sk !== 'string') return t;
    const en = t.en ?? preklad(t.sk, 'en');
    const de = t.de ?? preklad(t.sk, 'de');
    return { sk: t.sk, en: en ?? null, de: de ?? null, enZo: en != null ? t.sk : null, deZo: de != null ? t.sk : null };
  };
  /** Krátky názov v menu: slovník sa NEPOUŽÍVA (doslovný preklad skratky nedáva zmysel). */
  const textVolitelny = (t: Lubovolny) => t && ({
    sk: t.sk ?? null, en: t.en ?? null, de: t.de ?? null,
    enZo: t.en != null ? t.sk ?? null : null, deZo: t.de != null ? t.sk ?? null : null,
  });
  const odkazKat = (k: Lubovolny) => ({ dokument: katPodlaSlugu.get(k.slug)?.documentId ?? null, slug: k.slug });
  const odkazCl = (c: Lubovolny) => ({ dokument: clanky.get(c.slug) ?? null, slug: c.slug });
  const obrazok = (o: Lubovolny) => {
    if (!o || !o.cesta || !o.cesta.startsWith('/uploads/')) return o;
    const id = subory.get(o.cesta);
    return id ? { id, ...(o.pozicia ? { pozicia: o.pozicia } : {}) } : o;
  };

  const Z: Lubovolny = structuredClone(vstup.zakladny);
  const d = Z.domov;
  const v1: Lubovolny = {
    schema: Z.schema,
    domov: {
      uvod: { nadtitulok: text(d.uvod.nadtitulok), nadpis: text(d.uvod.nadpis), znak: obrazok(d.uvod.znak) },
      dlazdice: {
        viditelne: d.dlazdice.viditelne,
        skupiny: d.dlazdice.skupiny.map((s: Lubovolny) => ({
          id: s.id, nadpis: s.nadpis ? text(s.nadpis) : null,
          polozky: s.polozky.map((p: Lubovolny) => ({ id: p.id, kategoria: odkazKat(p.kategoria), pocet: p.pocet })),
        })),
      },
      hladanie: {
        viditelne: d.hladanie.viditelne,
        vyzva: text(d.hladanie.vyzva),
        popularneViditelne: d.hladanie.popularneViditelne,
        popularne: d.hladanie.popularne.map((p: Lubovolny) => ({ text: text(p.text), clanok: odkazCl(p.clanok) })),
      },
      sekcie: d.sekcie.map((s: Lubovolny) => {
        if (s.typ === 'dalsi-obsah') {
          return {
            ...s, nadpis: text(s.nadpis),
            riadky: s.riadky.map((r: Lubovolny) => ({
              ...r, kategoria: odkazKat(r.kategoria), nadpis: r.nadpis ? text(r.nadpis) : null,
              clanky: r.clanky.map(odkazCl), obrazky: r.obrazky.map((o: Lubovolny) => ({ clanok: odkazCl(o.clanok), obrazok: obrazok(o.obrazok) })),
            })),
          };
        }
        if (s.typ === 'kronika') {
          return {
            ...s, uvodnyClanok: s.uvodnyClanok ? odkazCl(s.uvodnyClanok) : null,
            pripnute: s.pripnute.map(odkazCl), obrazok: obrazok(s.obrazok),
          };
        }
        return { ...s };
      }),
      fotogaleria: { fotky: fotkyGalerie },
      pridajteSa: {
        ...d.pridajteSa,
        nadtitulok: text(d.pridajteSa.nadtitulok), nadpis: text(d.pridajteSa.nadpis),
        citat: text(d.pridajteSa.citat), uvod: text(d.pridajteSa.uvod),
        prosby: d.pridajteSa.prosby.map((p: Lubovolny) => ({ nadpis: text(p.nadpis), text: text(p.text) })),
      },
    },
    kategorie: [],
    cinnost: {
      nadpis: text(Z.cinnost.nadpis),
      polozky: Z.cinnost.polozky.map((p: Lubovolny) => ({ ...p, nazov: text(p.nazov), popis: text(p.popis), obrazok: obrazok(p.obrazok) })),
    },
    menu: {
      poradie: kat.map((k) => ({ dokument: k.documentId, slug: k.slug })),
      hlavnyRiadok: Z.menu.hlavnyRiadok.map(odkazKat),
      skryte: Z.menu.skryte.map(odkazKat),
    },
    pata: {
      stlpce: Z.pata.stlpce.map((s: Lubovolny) => ({
        ...s, nadpis: text(s.nadpis),
        odkazy: s.odkazy.map((o: Lubovolny) => ({
          text: text(o.text),
          ciel: o.ciel.druh === 'kategoria' ? { druh: 'kategoria', kategoria: odkazKat(o.ciel.kategoria) }
            : o.ciel.druh === 'clanok' ? { druh: 'clanok', clanok: odkazCl(o.ciel.clanok) } : o.ciel,
        })),
      })),
      siete: Z.pata.siete.map((s: Lubovolny) => ({ ...s })),
    },
  };

  /* Záznamy kategórií: z kódu + názov z databázy; kategória, ktorá v kóde nie
     je, dostane záznam len s údajmi z databázy (všetko ostatné „z DB"). */
  const nazovZDb = (k: KategoriaZDb) => {
    const en = preklad(k.name, 'en');
    const de = preklad(k.name, 'de');
    return { sk: k.name, en, de, enZo: en != null ? k.name : null, deZo: de != null ? k.name : null };
  };
  const zKodu = new Map<string, Lubovolny>(Z.kategorie.map((k: Lubovolny) => [k.kategoria.slug, k]));
  for (const k of kat) {
    const z = zKodu.get(k.slug);
    if (z) {
      v1.kategorie.push({
        kategoria: odkazKat(z.kategoria),
        nazov: nazovZDb(k),
        titulok: z.titulok ? text(z.titulok) : null,
        popisokDlazdice: text(z.popisokDlazdice),
        popisokMenu: z.popisokMenu ? textVolitelny(z.popisokMenu) : null,
        popis: z.popis ? text(z.popis) : null,
        obrazok: obrazok(z.obrazok),
        tvary: z.tvary ? { sk: z.tvary.sk, en: preklad(z.tvary.sk[2], 'en'), de: preklad(z.tvary.sk[2], 'de') } : null,
        clanky: { zoradenie: z.clanky.zoradenie, pripnute: z.clanky.pripnute.map(odkazCl) },
      });
    } else {
      v1.kategorie.push(zaznamNovejKategorie(k, vstup.preklad));
    }
  }
  const chybajuceKategorie: string[] = [];
  for (const z of Z.kategorie) if (!katPodlaSlugu.has(z.kategoria.slug)) chybajuceKategorie.push(z.kategoria.slug);

  /* Kontrola: v prevedenom vzhľade nesmie ostať žiadna cesta /uploads ani odkaz bez documentId. */
  const zvysky: string[] = [];
  (function kontrola(x: Lubovolny, cesta: string) {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) { x.forEach((y, i) => kontrola(y, `${cesta}[${i}]`)); return; }
    if (typeof x.cesta === 'string' && x.cesta.startsWith('/uploads/')) zvysky.push(`${cesta}: obrázok ostal cestou`);
    if ('dokument' in x && 'slug' in x && !x.dokument) zvysky.push(`${cesta}: ${x.slug} bez documentId`);
    for (const [k, v] of Object.entries(x)) kontrola(v, cesta ? `${cesta}.${k}` : k);
  })(v1, '');

  return { vzhlad: v1 as Vzhlad, zvysky, chybajuceKategorie };
}

/**
 * Záznam vzhľadu pre kategóriu, ktorá v kóde nie je (pribudla v databáze):
 * popisok = názov, všetko ostatné z databázy. Používa ho prevod aj editor
 * („kategória bez vzhľadu — pridať").
 */
export function zaznamNovejKategorie(k: KategoriaZDb, prekladZo: (kluc: string, j: Jazyk) => string | null) {
  const nazov = () => {
    const en = k.name ? prekladZo(k.name, 'en') : null;
    const de = k.name ? prekladZo(k.name, 'de') : null;
    return { sk: k.name, en, de, enZo: en != null ? k.name : null, deZo: de != null ? k.name : null };
  };
  return {
    kategoria: { dokument: k.documentId, slug: k.slug },
    nazov: nazov(),
    titulok: null,
    popisokDlazdice: nazov(),
    popisokMenu: null,
    popis: null,
    obrazok: null,
    tvary: null,
    clanky: { zoradenie: 'zverejnenie' as const, pripnute: [] },
  };
}
