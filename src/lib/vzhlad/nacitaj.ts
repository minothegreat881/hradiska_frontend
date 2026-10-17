/**
 * NAČÍTANIE VZHĽADU — odkiaľ ho web berie a ako ho číta.
 *
 * Poradie (plán, časť 6.2):
 *   1. prvé kreslenie: vzhľad VLOŽENÝ do HTML pri builde
 *      (`<script type="application/json" id="vzhlad-webu">`, celé `OdpovedVzhladu`),
 *      inak ZÁKLADNÝ vzhľad z kódu — žiadne čakanie na API, žiadne blikanie;
 *   2. hneď potom `GET /api/vzhlad-webu`; keď príde novšia `verzia`, prekreslí sa.
 *
 * ČÍTANIE JE TOLERANTNÉ. Vzhľad prichádza zo siete a mohol ho uložiť novší
 * backend než tento web pozná, preto sa nikdy neverí tvaru:
 *   • `schema` vyššie než `SCHEMA_VZHLADU` alebo zlý tvar celku → základný,
 *   • zlý tvar jednej časti (päta, menu, …) → tá časť zo základného,
 *   • zlý záznam v zozname (dlaždica, sekcia neznámeho typu, odkaz) → vynechá sa,
 *   • zlý text → text zo základného vzhľadu.
 * Čo závisí od rozriešených údajov a jazyka stránky (zmazaná kategória, článok
 * v jazyku chýba, fotka chýba), rieši až vykresľovanie (`citaj.ts`), lebo jazyk
 * sa na webe mení bez znovunačítania.
 *
 * Nič odtiaľto nevyhodí výnimku — v najhoršom prípade platí základný vzhľad.
 */

import { STRAPI_URL } from '../api-adresa';
import { ZAKLADNY_VZHLAD } from './zakladny';
import {
  SCHEMA_VZHLADU, KLUCE_CINNOSTI, TYPY_SEKCII, VZOR_CESTY, VZOR_CESTY_OBRAZKA,
  type Vzhlad, type Rozriesene, type OdpovedVzhladu, type Text, type TextVolitelny,
  type OdkazKategorie, type OdkazClanku, type Obrazok, type Ciel, type VzhladKategorie,
  type SkupinaDlazdic, type Dlazdica, type Popularne, type RiadokClankov, type SekciaDomov,
  type PolozkaCinnosti, type Domov, type Cinnost, type Menu, type Pata, type PridajteSa,
  type ZoradenieClankov, type DruhSiete, type Subor, type ClanokVJazyku, type Jazyk,
} from './typy';

export type ZdrojVzhladu = 'zakladny' | 'vlozeny' | 'api' | 'zvonka';

export interface StavVzhladu {
  vzhlad: Vzhlad;
  rozriesene: Rozriesene;
  /** Zverejnená verzia (ETag `"v<verzia>"`); základný vzhľad má 0. */
  verzia: number;
  zdroj: ZdrojVzhladu;
}

export const PRAZDNE_ROZRIESENE: Rozriesene = Object.freeze({ subory: {}, kategorie: {}, clanky: {} }) as Rozriesene;

export const ZAKLADNY_STAV: StavVzhladu = {
  vzhlad: ZAKLADNY_VZHLAD,
  rozriesene: PRAZDNE_ROZRIESENE,
  verzia: 0,
  zdroj: 'zakladny',
};

/* ───────────────────────── Drobné kontroly ───────────────────────── */

type Obj = Record<string, unknown>;
const jeObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const jeStr = (x: unknown): x is string => typeof x === 'string';
const pole = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
const bool = (x: unknown, zaloha: boolean): boolean => (typeof x === 'boolean' ? x : zaloha);
const strAleboNull = (x: unknown): string | null => (jeStr(x) ? x : null);
const ID = /^[a-z0-9-]{1,40}$/;

function text(x: unknown): Text | null {
  if (!jeObj(x) || !jeStr(x.sk)) return null;
  return { sk: x.sk, en: strAleboNull(x.en), de: strAleboNull(x.de), enZo: strAleboNull(x.enZo), deZo: strAleboNull(x.deZo) };
}
const textZ = (x: unknown, zaloha: Text): Text => text(x) ?? zaloha;

function textVolitelny(x: unknown): TextVolitelny | null {
  if (!jeObj(x)) return null;
  return { sk: strAleboNull(x.sk), en: strAleboNull(x.en), de: strAleboNull(x.de), enZo: strAleboNull(x.enZo), deZo: strAleboNull(x.deZo) };
}

function odkaz(x: unknown): OdkazKategorie | null {
  if (!jeObj(x)) return null;
  const dokument = jeStr(x.dokument) && x.dokument ? x.dokument : null;
  const slug = jeStr(x.slug) ? x.slug : '';
  if (!dokument && !slug) return null;
  return { dokument, slug };
}
const odkazClanku = (x: unknown): OdkazClanku | null => odkaz(x);
const odkazy = (x: unknown): OdkazKategorie[] => pole(x).map(odkaz).filter((o): o is OdkazKategorie => !!o);

function obrazok(x: unknown): Obrazok | null {
  if (!jeObj(x)) return null;
  const pozicia = jeStr(x.pozicia) ? x.pozicia : null;
  if (typeof x.id === 'number' && Number.isInteger(x.id) && x.id > 0) return { id: x.id, pozicia };
  if (jeStr(x.cesta) && VZOR_CESTY_OBRAZKA.test(x.cesta)) {
    return { cesta: x.cesta, vlastny: x.vlastny === true || !x.cesta.startsWith('/uploads/'), pozicia };
  }
  return null;
}

function ciel(x: unknown): Ciel | null {
  if (!jeObj(x)) return null;
  switch (x.druh) {
    case 'kategoria': { const k = odkaz(x.kategoria); return k ? { druh: 'kategoria', kategoria: k } : null; }
    case 'clanok': { const c = odkazClanku(x.clanok); return c ? { druh: 'clanok', clanok: c } : null; }
    case 'cesta': return jeStr(x.cesta) && VZOR_CESTY.test(x.cesta) ? { druh: 'cesta', cesta: x.cesta } : null;
    case 'url': return jeStr(x.url) && /^(https:\/\/|mailto:)[^\s"'<>]+$/.test(x.url) ? { druh: 'url', url: x.url } : null;
    default: return null;
  }
}

const ZORADENIA: ZoradenieClankov[] = ['zverejnenie', 'povodny-datum', 'abecedne'];
const zoradenie = (x: unknown): ZoradenieClankov => (ZORADENIA.includes(x as ZoradenieClankov) ? (x as ZoradenieClankov) : 'zverejnenie');

/** Jedinečné id v zozname — druhý výskyt sa vynechá. */
function jedinecne<T extends { id: string }>(zoznam: T[]): T[] {
  const videne = new Set<string>();
  return zoznam.filter((p) => (videne.has(p.id) ? false : (videne.add(p.id), true)));
}

/* ───────────────────────── Časti vzhľadu ───────────────────────── */

function domov(x: unknown, z: Domov): Domov {
  if (!jeObj(x)) return z;
  const uvod = jeObj(x.uvod) ? x.uvod : {};
  const dl = jeObj(x.dlazdice) ? x.dlazdice : null;
  const hl = jeObj(x.hladanie) ? x.hladanie : null;

  const skupiny: SkupinaDlazdic[] = dl && Array.isArray(dl.skupiny)
    ? jedinecne(pole(dl.skupiny).map((s): SkupinaDlazdic | null => {
        if (!jeObj(s) || !jeStr(s.id) || !ID.test(s.id)) return null;
        const polozky = pole(s.polozky).map((p): Dlazdica | null => {
          if (!jeObj(p) || !jeStr(p.id) || !ID.test(p.id)) return null;
          const k = odkaz(p.kategoria);
          return k ? { id: p.id, kategoria: k, pocet: bool(p.pocet, true) } : null;
        }).filter((p): p is Dlazdica => !!p);
        return { id: s.id, nadpis: text(s.nadpis), polozky: jedinecne(polozky) };
      }).filter((s): s is SkupinaDlazdic => !!s))
    : z.dlazdice.skupiny;

  const popularne: Popularne[] = hl && Array.isArray(hl.popularne)
    ? pole(hl.popularne).map((p): Popularne | null => {
        if (!jeObj(p)) return null;
        const t = text(p.text);
        const c = odkazClanku(p.clanok);
        return t && c ? { text: t, clanok: c } : null;
      }).filter((p): p is Popularne => !!p)
    : z.hladanie.popularne;

  const videneTypy = new Set<string>();
  const sekcie: SekciaDomov[] = !Array.isArray(x.sekcie) ? z.sekcie : jedinecne(x.sekcie.map((s): SekciaDomov | null => {
    if (!jeObj(s) || !jeStr(s.id) || !ID.test(s.id)) return null;
    /* Neznámy typ sekcie (novší backend) sa preskočí. Každý typ najviac raz,
       okrem riadkov článkov. */
    if (!TYPY_SEKCII.includes(s.typ as SekciaDomov['typ'])) return null;
    if (s.typ !== 'dalsi-obsah') {
      if (videneTypy.has(s.typ as string)) return null;
      videneTypy.add(s.typ as string);
    }
    const viditelna = bool(s.viditelna, true);
    const zs = z.sekcie.find((q) => q.typ === s.typ);
    switch (s.typ) {
      case 'mapa':
      case 'cinnost':
        return { id: s.id, typ: s.typ, viditelna };
      case 'dalsi-obsah': {
        const zn = zs && zs.typ === 'dalsi-obsah' ? zs.nadpis : { sk: '' };
        const riadky = jedinecne(pole(s.riadky).map((r): RiadokClankov | null => {
          if (!jeObj(r) || !jeStr(r.id) || !ID.test(r.id)) return null;
          const k = odkaz(r.kategoria);
          if (!k) return null;
          const pocet = typeof r.pocet === 'number' && Number.isFinite(r.pocet) ? Math.min(8, Math.max(1, Math.round(r.pocet))) : 4;
          return {
            id: r.id,
            kategoria: k,
            nadpis: text(r.nadpis),
            pocet,
            vyber: r.vyber === 'rucne' ? 'rucne' : 'najnovsie',
            zoradenie: zoradenie(r.zoradenie),
            lenSObrazkom: bool(r.lenSObrazkom, true),
            clanky: pole(r.clanky).map(odkazClanku).filter((c): c is OdkazClanku => !!c),
            obrazky: pole(r.obrazky).map((o) => {
              if (!jeObj(o)) return null;
              const c = odkazClanku(o.clanok);
              const b = obrazok(o.obrazok);
              return c && b ? { clanok: c, obrazok: b } : null;
            }).filter((o): o is { clanok: OdkazClanku; obrazok: Obrazok } => !!o),
          };
        }).filter((r): r is RiadokClankov => !!r));
        return { id: s.id, typ: 'dalsi-obsah', viditelna, nadpis: textZ(s.nadpis, zn), riadky };
      }
      case 'kronika':
        return {
          id: s.id,
          typ: 'kronika',
          viditelna,
          uvodnyClanok: s.uvodnyClanok === null ? null : odkazClanku(s.uvodnyClanok),
          pripnute: pole(s.pripnute).map(odkazClanku).filter((c): c is OdkazClanku => !!c),
          obrazok: s.obrazok === null ? null : obrazok(s.obrazok) ?? (zs && zs.typ === 'kronika' ? zs.obrazok : null),
          fotogaleriaViditelna: bool(s.fotogaleriaViditelna, true),
        };
      default:
        return null;
    }
  }).filter((s): s is SekciaDomov => !!s));

  const fg = jeObj(x.fotogaleria) ? x.fotogaleria : null;
  const fotogaleria = fg
    ? { fotky: pole(fg.fotky).filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0) }
    : null;

  return {
    uvod: {
      nadtitulok: textZ(uvod.nadtitulok, z.uvod.nadtitulok),
      nadpis: textZ(uvod.nadpis, z.uvod.nadpis),
      znak: uvod.znak == null ? null : obrazok(uvod.znak),
    },
    dlazdice: { viditelne: bool(dl?.viditelne, true), skupiny },
    hladanie: {
      viditelne: bool(hl?.viditelne, true),
      vyzva: textZ(hl?.vyzva, z.hladanie.vyzva),
      popularneViditelne: bool(hl?.popularneViditelne, true),
      popularne,
    },
    sekcie,
    fotogaleria,
    pridajteSa: pridajteSa(x.pridajteSa, z.pridajteSa),
  };
}

function pridajteSa(x: unknown, z: PridajteSa): PridajteSa {
  if (!jeObj(x)) return z;
  const prosby = pole(x.prosby).map((p) => {
    if (!jeObj(p)) return null;
    const n = text(p.nadpis);
    const t = text(p.text);
    return n && t ? { nadpis: n, text: t } : null;
  }).filter((p): p is { nadpis: Text; text: Text } => !!p);
  return {
    viditelna: bool(x.viditelna, true),
    nadtitulok: textZ(x.nadtitulok, z.nadtitulok),
    nadpis: textZ(x.nadpis, z.nadpis),
    citat: textZ(x.citat, z.citat),
    uvod: textZ(x.uvod, z.uvod),
    email: jeStr(x.email) && /^[^\s@"<>]+@[^\s@"<>]+$/.test(x.email) ? x.email : z.email,
    prosby,
  };
}

function kategorie(x: unknown, z: VzhladKategorie[]): VzhladKategorie[] {
  if (!Array.isArray(x)) return z;
  return x.map((k): VzhladKategorie | null => {
    if (!jeObj(k)) return null;
    const odk = odkaz(k.kategoria);
    const popisok = text(k.popisokDlazdice);
    if (!odk || !popisok) return null;
    const tv = jeObj(k.tvary) ? k.tvary : null;
    const tvarySk = tv && Array.isArray(tv.sk) && tv.sk.length === 3 && tv.sk.every(jeStr) ? (tv.sk as [string, string, string]) : null;
    const cl = jeObj(k.clanky) ? k.clanky : {};
    return {
      kategoria: odk,
      nazov: text(k.nazov),
      titulok: text(k.titulok),
      popisokDlazdice: popisok,
      popisokMenu: textVolitelny(k.popisokMenu),
      popis: text(k.popis),
      obrazok: obrazok(k.obrazok),
      tvary: tvarySk ? { sk: tvarySk, en: strAleboNull(tv!.en), de: strAleboNull(tv!.de) } : null,
      clanky: {
        zoradenie: zoradenie(cl.zoradenie),
        pripnute: pole(cl.pripnute).map(odkazClanku).filter((c): c is OdkazClanku => !!c),
      },
    };
  }).filter((k): k is VzhladKategorie => !!k);
}

function cinnost(x: unknown, z: Cinnost): Cinnost {
  if (!jeObj(x) || !Array.isArray(x.polozky)) return z;
  const videne = new Set<string>();
  const polozky = x.polozky.map((p): PolozkaCinnosti | null => {
    if (!jeObj(p) || !KLUCE_CINNOSTI.includes(p.kluc as PolozkaCinnosti['kluc']) || videne.has(p.kluc as string)) return null;
    videne.add(p.kluc as string);
    const zp = z.polozky.find((q) => q.kluc === p.kluc)!;
    return {
      kluc: p.kluc as PolozkaCinnosti['kluc'],
      nazov: textZ(p.nazov, zp.nazov),
      popis: textZ(p.popis, zp.popis),
      obrazok: obrazok(p.obrazok) ?? zp.obrazok,
      viditelna: bool(p.viditelna, true),
      naDomovskej: bool(p.naDomovskej, zp.naDomovskej),
    };
  }).filter((p): p is PolozkaCinnosti => !!p);
  return { nadpis: textZ(x.nadpis, z.nadpis), polozky };
}

function menu(x: unknown, z: Menu): Menu {
  if (!jeObj(x)) return z;
  return { poradie: odkazy(x.poradie), hlavnyRiadok: odkazy(x.hlavnyRiadok), skryte: odkazy(x.skryte) };
}

const SIETE: DruhSiete[] = ['facebook', 'instagram', 'youtube', 'email'];

function pata(x: unknown, z: Pata): Pata {
  if (!jeObj(x) || !Array.isArray(x.stlpce)) return z;
  const stlpce = jedinecne(x.stlpce.map((s) => {
    if (!jeObj(s) || !jeStr(s.id) || !ID.test(s.id)) return null;
    const nadpis = text(s.nadpis);
    if (!nadpis) return null;
    const odk = pole(s.odkazy).map((o) => {
      if (!jeObj(o)) return null;
      const t = text(o.text);
      const c = ciel(o.ciel);
      return t && c ? { text: t, ciel: c } : null;
    }).filter((o): o is { text: Text; ciel: Ciel } => !!o);
    return { id: s.id, nadpis, odkazy: odk };
  }).filter((s): s is Pata['stlpce'][number] => !!s));
  const siete = pole(x.siete).map((s) => {
    if (!jeObj(s) || !SIETE.includes(s.druh as DruhSiete) || !jeStr(s.url)) return null;
    if (!/^(https:\/\/|mailto:)[^\s"'<>]+$/.test(s.url)) return null;
    return { druh: s.druh as DruhSiete, url: s.url };
  }).filter((s): s is Pata['siete'][number] => !!s);
  return { stlpce, siete };
}

/**
 * Vyčistený vzhľad, alebo `null`, keď mu web nerozumie (iná `schema`, zlý
 * tvar celku). Volajúci vtedy použije základný.
 */
export function ocistiVzhlad(x: unknown): Vzhlad | null {
  try {
    if (!jeObj(x)) return null;
    /* Vyššiu schému starý web nečíta — nevie, čo sa v nej zmenilo. */
    if (x.schema !== SCHEMA_VZHLADU) return null;
    if (!jeObj(x.domov)) return null;
    const z = ZAKLADNY_VZHLAD;
    return {
      schema: SCHEMA_VZHLADU,
      domov: domov(x.domov, z.domov),
      kategorie: kategorie(x.kategorie, z.kategorie),
      cinnost: cinnost(x.cinnost, z.cinnost),
      menu: menu(x.menu, z.menu),
      pata: pata(x.pata, z.pata),
    };
  } catch {
    return null;
  }
}

/* ───────────────────────── Rozriešené údaje ───────────────────────── */

function ocistiRozriesene(x: Obj): Rozriesene {
  const subory: Record<string, Subor> = {};
  if (jeObj(x.subory)) {
    for (const [id, s] of Object.entries(x.subory)) {
      if (!jeObj(s) || !jeStr(s.url)) continue;
      const formats: Subor['formats'] = {};
      if (jeObj(s.formats)) {
        for (const v of ['thumbnail', 'small', 'medium', 'large'] as const) {
          const f = (s.formats as Obj)[v];
          if (jeObj(f) && jeStr(f.url)) formats[v] = { url: f.url, width: Number(f.width) || 0, height: Number(f.height) || 0 };
        }
      }
      subory[id] = {
        id: Number(s.id) || Number(id),
        url: s.url,
        width: typeof s.width === 'number' ? s.width : null,
        height: typeof s.height === 'number' ? s.height : null,
        alt: strAleboNull(s.alt),
        formats,
      };
    }
  }
  const kat: Rozriesene['kategorie'] = {};
  if (jeObj(x.kategorie)) {
    for (const [d, k] of Object.entries(x.kategorie)) {
      if (jeObj(k) && jeStr(k.slug)) kat[d] = { slug: k.slug, nazov: jeStr(k.nazov) ? k.nazov : '', poradie: typeof k.poradie === 'number' ? k.poradie : 100 };
    }
  }
  const clanky: Rozriesene['clanky'] = {};
  if (jeObj(x.clanky)) {
    for (const [d, c] of Object.entries(x.clanky)) {
      if (!jeObj(c)) continue;
      const vJazykoch: Partial<Record<Jazyk, ClanokVJazyku>> = {};
      for (const j of ['sk', 'en', 'de'] as const) {
        const v = c[j];
        if (jeObj(v) && jeStr(v.slug) && v.slug) {
          vJazykoch[j] = { slug: v.slug, nazov: jeStr(v.nazov) ? v.nazov : '', obrazok: typeof v.obrazok === 'number' ? v.obrazok : null };
        }
      }
      clanky[d] = vJazykoch;
    }
  }
  return { subory, kategorie: kat, clanky };
}

/**
 * Odpoveď API (alebo vložená v HTML) → stav. `null`, keď vzhľad nie je
 * zverejnený (`data: null`) alebo mu web nerozumie.
 */
export function precitajOdpoved(x: unknown, zdroj: ZdrojVzhladu): StavVzhladu | null {
  try {
    if (!jeObj(x) || !jeObj(x.data)) return null;
    const vzhlad = ocistiVzhlad(x.data);
    if (!vzhlad) return null;
    const verzia = typeof x.verzia === 'number' && Number.isFinite(x.verzia) ? x.verzia : 0;
    return { vzhlad, rozriesene: ocistiRozriesene(x), verzia, zdroj };
  } catch {
    return null;
  }
}

/* ───────────────────────── Odkiaľ ───────────────────────── */

/** Id značky, do ktorej build vkladá vzhľad (`scripts/prerender.mjs`). */
export const ID_VLOZENEHO = 'vzhlad-webu';

/** Vzhľad vložený do HTML pri builde, alebo `null`. */
export function vlozenyVzhlad(): StavVzhladu | null {
  try {
    if (typeof document === 'undefined') return null;
    const el = document.getElementById(ID_VLOZENEHO);
    if (!el || !el.textContent) return null;
    return precitajOdpoved(JSON.parse(el.textContent) as OdpovedVzhladu, 'vlozeny');
  } catch {
    return null;
  }
}

/** Stav na prvé kreslenie: vložený, inak základný. */
export function uvodnyStav(): StavVzhladu {
  return vlozenyVzhlad() ?? ZAKLADNY_STAV;
}

/**
 * Stiahne zverejnený vzhľad. Vráti:
 *   • nový stav, keď prišla NOVŠIA verzia, než je `znamaVerzia`,
 *   • `null` vo všetkých ostatných prípadoch (rovnaká verzia, 304, `data: null`,
 *     chyba, výpadok, nečitateľný tvar) — web vtedy ostane pri tom, čo má.
 *
 * Volá sa obyčajný `fetch`, nie `fetchStrapi`: ten pri chybe píše do konzoly
 * a pri 5xx opakuje — výpadok tohto endpointu nie je chyba stránky.
 */
export async function stiahniVzhlad(znamaVerzia: number, signal?: AbortSignal): Promise<StavVzhladu | null> {
  try {
    if (typeof fetch === 'undefined') return null;
    const adresa = `${STRAPI_URL}/api/vzhlad-webu`;
    const headers: Record<string, string> = {};
    /* `If-None-Match` len na vlastný pôvod (web cez `/strapi`). V appke ide
       požiadavka na inú doménu a hlavičku by musel povoliť CORS backendu —
       tam si podmienenú požiadavku spraví vyrovnávacia pamäť prehliadača sama. */
    if (znamaVerzia > 0 && typeof window !== 'undefined') {
      try {
        if (new URL(adresa, window.location.href).origin === window.location.origin) headers['If-None-Match'] = `"v${znamaVerzia}"`;
      } catch { /* bez hlavičky */ }
    }
    const res = await fetch(adresa, { headers, signal });
    if (res.status === 304 || !res.ok) return null;
    const stav = precitajOdpoved(await res.json(), 'api');
    if (!stav || stav.verzia <= znamaVerzia) return null;
    return stav;
  } catch {
    return null;
  }
}
