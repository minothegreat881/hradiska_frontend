'use client';

/**
 * SPOLOČNÝ STAV EDITORA VZHĽADU — koncept, verzie, uloženie, zverejnenie,
 * história, záloha v prehliadači.
 *
 * Vizuálny editor (plátno) aj klasická úprava (formulár) čítajú a píšu ten
 * istý stav cez `useKoncept()`. Neexistujú dve implementácie ukladania:
 * provider žije nad oboma obrazovkami, takže prepnutie plátno ↔ formulár
 * neuložené zmeny nestratí.
 *
 * Všetky zmeny vzhľadu idú cez `zmen(popis, fn)` → `useHistory` (100 krokov,
 * Ctrl+Z / Ctrl+Y). `fn` dostane hlbokú kópiu a smie ju meniť priamo.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../../AuthContext';
import { useHistory } from '../../editor/state/useHistory';
import { nastavNeulozene, nastavOdkladac, nastavSpravuOdchodu } from '../../editor/state/rozpracovane';
import { StrapiError } from '../../api/client';
import type { MediaFile } from '../../api/media';
import {
  nacitajKoncept, ulozKoncept, zverejnitKoncept, obnovVerziu, kategorieZDb, clankyPodlaSlugu, suboryPodlaCesty,
  kodChyby, chybyKontroly, konfliktyDb, konceptZmeneny,
  type KonceptZmeneny, type NajdenyClanok, type VerziaHistorie,
} from '../../api/vzhlad';
import { prekladZoSlovnika } from '../../../lib/jazyk';
import { ZAKLADNY_VZHLAD } from '../../../lib/vzhlad/zakladny';
import { prevedVzhlad, odkazyZakladneho } from '../../../lib/vzhlad/prevod';
import { skontrolujTvar, skontrolujOdkazy } from '../../../lib/vzhlad/kontrola';
import type { KonfliktDb } from '../../../lib/vzhlad/zlucenie';
import type { Vzhlad, ZakladDb, OdpovedKonceptu, Rozriesene, ChybaVzhladu, Subor } from '../../../lib/vzhlad/typy';
import { kopia, type KategoriaVDb } from './operacie';
import { prevezmiZDb, prevezmiKonflikty, ponechajMoje } from './rebase';

/* ───────────────────────── Typy ───────────────────────── */

export type Stranka = { druh: 'domov' } | { druh: 'kategoria'; slug: string } | { druh: 'menu' };

export type Dialog =
  | { druh: 'konflikt'; detail: KonceptZmeneny }
  | { druh: 'chyby'; chyby: ChybaVzhladu[]; pri: 'ulozenie' | 'zverejnenie' }
  | { druh: 'zverejnit' }
  | { druh: 'konfliktDb'; konflikty: KonfliktDb[]; db: ZakladDb }
  | { druh: 'historia' }
  | { druh: 'obnova'; zaloha: Zaloha }
  | { druh: 'zahodit' };

export interface Zaloha {
  ulozene: number;
  /** verziaKonceptu, z ktorej práca vychádza. */
  zaklad: number;
  koncept: Vzhlad | null;
  zakladDb: ZakladDb | null;
}

export interface Sprava { ton: 'ok' | 'chyba' | 'info'; text: string }

export interface KonceptHodnota {
  stav: 'nacitava' | 'chyba' | 'prazdny' | 'pripraveny';
  chybaNacitania: string | null;
  server: OdpovedKonceptu | null;
  kategorieDb: KategoriaVDb[];
  rozriesene: Rozriesene;
  koncept: Vzhlad | null;
  zakladDb: ZakladDb | null;
  verziaKonceptu: number;
  neulozene: boolean;
  pracuje: string | null;
  sprava: Sprava | null;
  nastavSpravu: (s: Sprava | null) => void;
  /** Čo sa pri načítaní potichu prevzalo z databázy. */
  prevzate: string[];

  zmen: (popis: string, fn: (v: Vzhlad) => void) => void;
  vratit: () => void;
  zopakovat: () => void;
  mozeVratit: boolean;
  mozeZopakovat: boolean;
  popisVratit: string | null;
  popisZopakovat: string | null;

  nacitajZnova: () => Promise<void>;
  ulozit: () => Promise<boolean>;
  pripravZverejnenie: () => Promise<void>;
  potvrdZverejnenie: (poznamka: string) => Promise<boolean>;
  zalozitZDnesnehoWebu: () => Promise<void>;
  obnovitVerziu: (verzia: number) => Promise<boolean>;
  zahoditKoncept: () => Promise<void>;
  nacitatJehoVerziu: () => Promise<void>;
  prepisatMojou: (detail: KonceptZmeneny) => Promise<void>;
  vyriesitKonfliktDb: (konflikty: KonfliktDb[], db: ZakladDb, ako: 'prevziat' | 'ponechat') => Promise<void>;
  obnovitZalohu: (z: Zaloha) => void;
  zahoditZalohu: () => void;

  doplnSubor: (f: MediaFile) => void;
  doplnClanky: (c: NajdenyClanok[]) => void;

  dialog: Dialog | null;
  otvorDialog: (d: Dialog | null) => void;
  /** Vybraný prvok plátna (`data-vw`). Spoločný — formulár ním otvára prvok na plátne. */
  vyber: string | null;
  nastavVyber: (v: string | null) => void;
  /** Verzia z histórie na pozretie (plátno len na čítanie). */
  nahladVerzie: VerziaHistorie | null;
  nastavNahladVerzie: (v: VerziaHistorie | null) => void;

  chybyKlienta: ChybaVzhladu[];
  chybyServera: ChybaVzhladu[];
}

const Kontext = createContext<KonceptHodnota | null>(null);

export function useKoncept(): KonceptHodnota {
  const k = useContext(Kontext);
  if (!k) throw new Error('useKoncept musí byť vnútri <KonceptProvider>');
  return k;
}

/* ───────────────────────── Záloha v prehliadači ───────────────────────── */

export const KLUC_ZALOHY = 'hradiska.vzhlad.koncept';
const MAX_VEK_ZALOHY = 14 * 24 * 60 * 60 * 1000;

export function citajZalohu(): Zaloha | null {
  try {
    const t = localStorage.getItem(KLUC_ZALOHY);
    if (!t) return null;
    const z = JSON.parse(t) as Zaloha;
    if (!z || typeof z.ulozene !== 'number' || Date.now() - z.ulozene > MAX_VEK_ZALOHY) return null;
    return z;
  } catch {
    return null;
  }
}
function zapisZalohu(z: Zaloha) {
  try { localStorage.setItem(KLUC_ZALOHY, JSON.stringify(z)); } catch { /* plná pamäť — editor ide ďalej */ }
}
function zmazZalohu() {
  try { localStorage.removeItem(KLUC_ZALOHY); } catch { /* nič */ }
}

/* ───────────────────────── Pomocné ───────────────────────── */

const PRAZDNE: Rozriesene = { subory: {}, kategorie: {}, clanky: {} };
const json = (k: Vzhlad | null, z: ZakladDb | null) => JSON.stringify([k, z]);

function zlucRozriesene(o: OdpovedKonceptu | null, kat: KategoriaVDb[], navyse: Rozriesene): Rozriesene {
  const kategorie: Rozriesene['kategorie'] = {};
  for (const k of kat) kategorie[k.documentId] = { slug: k.slug, nazov: k.name, poradie: k.order ?? 100 };
  Object.assign(kategorie, o?.kategorie ?? {});
  return {
    subory: { ...navyse.subory, ...(o?.subory ?? {}) },
    kategorie,
    clanky: { ...navyse.clanky, ...(o?.clanky ?? {}) },
  };
}

const SPRAVA_ODCHODU = [
  'Vo vzhľade webu máte neuložené zmeny — na webe sa neprejavia, kým koncept neuložíte a nezverejníte.',
  '',
  'Odložil som ich do tohto prehliadača: keď sa do editora vzhľadu vrátite, ponúkne ich obnoviť.',
].join(String.fromCharCode(10));

/* ───────────────────────── Provider ───────────────────────── */

export function KonceptProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const historia = useHistory<Vzhlad | null>(null);
  const koncept = historia.state;

  const [stav, setStav] = useState<KonceptHodnota['stav']>('nacitava');
  const [chybaNacitania, setChybaNacitania] = useState<string | null>(null);
  const [server, setServer] = useState<OdpovedKonceptu | null>(null);
  const [kategorieDb, setKategorieDb] = useState<KategoriaVDb[]>([]);
  const [navyse, setNavyse] = useState<Rozriesene>(PRAZDNE);
  const [zakladDb, setZakladDb] = useState<ZakladDb | null>(null);
  const [verziaKonceptu, setVerziaKonceptu] = useState(0);
  const [ulozeny, setUlozeny] = useState<string>(json(null, null));
  const [pracuje, setPracuje] = useState<string | null>(null);
  const [sprava, nastavSpravu] = useState<Sprava | null>(null);
  const [prevzate, setPrevzate] = useState<string[]>([]);
  const [dialog, otvorDialog] = useState<Dialog | null>(null);
  const [vyber, nastavVyber] = useState<string | null>(null);
  const [nahladVerzie, nastavNahladVerzie] = useState<VerziaHistorie | null>(null);
  const [chybyServera, setChybyServera] = useState<ChybaVzhladu[]>([]);

  const rozriesene = useMemo(() => zlucRozriesene(server, kategorieDb, navyse), [server, kategorieDb, navyse]);
  const neulozene = stav === 'pripraveny' && json(koncept, zakladDb) !== ulozeny;

  /* Najnovšie hodnoty pre asynchrónne akcie (inak by čítali stav spred ich začiatku). */
  const r = useRef({ koncept, zakladDb, verziaKonceptu, server, kategorieDb, neulozene, token });
  r.current = { koncept, zakladDb, verziaKonceptu, server, kategorieDb, neulozene, token };

  /* ── Načítanie ── */
  const nacitaj = useCallback(async (ponukniZalohu: boolean) => {
    const tok = r.current.token;
    if (!tok) return;
    setStav('nacitava');
    setChybaNacitania(null);
    try {
      const [o, kat] = await Promise.all([nacitajKoncept(tok), kategorieZDb(tok)]);
      setServer(o);
      setKategorieDb(kat);
      setVerziaKonceptu(o.verziaKonceptu);
      setChybyServera([]);
      const zaklad = o.koncept ?? o.zverejnene ?? null;
      if (!zaklad) {
        historia.reset(null);
        setZakladDb(null);
        setUlozeny(json(null, null));
        setPrevzate([]);
        setStav('prazdny');
        return;
      }
      const zakladServera = o.koncept ? o.zakladDb : o.db;
      const rb = prevezmiZDb(zaklad, zakladServera, o.db, kat);
      historia.reset(rb.koncept);
      setZakladDb(rb.zakladDb);
      /* Prevzatie hodnôt z DB, ktoré zmenilo koncept, treba uložiť — nech ho
         redaktor vidí ako neuložené (inak by server dostal starý koncept). */
      const zmenilKoncept = JSON.stringify(rb.koncept) !== JSON.stringify(zaklad);
      setUlozeny(o.koncept && !zmenilKoncept ? json(rb.koncept, rb.zakladDb) : json(o.koncept, o.zakladDb));
      setPrevzate(rb.prevzate);
      setStav('pripraveny');
      if (ponukniZalohu) {
        const z = citajZalohu();
        if (z && JSON.stringify(z.koncept) !== JSON.stringify(rb.koncept)) otvorDialog({ druh: 'obnova', zaloha: z });
        else if (z) zmazZalohu();
      }
    } catch (e) {
      setChybaNacitania((e as Error)?.message || 'Vzhľad sa nepodarilo načítať.');
      setStav('chyba');
    }
  }, [historia]);

  useEffect(() => { if (token) void nacitaj(true); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  /** Po uložení: nové rozriešené údaje a údaje o verzii, koncept ostáva. */
  const obnovMeta = useCallback(async () => {
    const tok = r.current.token;
    if (!tok) return;
    try {
      const o = await nacitajKoncept(tok);
      setServer(o);
      setVerziaKonceptu(o.verziaKonceptu);
    } catch { /* údaje o verzii sa obnovia pri ďalšom načítaní */ }
  }, []);

  /* ── Zmeny ── */
  const zmen = useCallback((popis: string, fn: (v: Vzhlad) => void) => {
    historia.set((prev) => {
      if (!prev) return prev;
      const k = kopia(prev);
      fn(k);
      return JSON.stringify(k) === JSON.stringify(prev) ? prev : k;
    }, popis);
  }, [historia]);

  /* ── Záloha každých 5 s, otázka pri odchode ── */
  const zalohaRef = useRef<() => void>(() => {});
  zalohaRef.current = () => {
    const c = r.current;
    if (!c.neulozene) return;
    zapisZalohu({ ulozene: Date.now(), zaklad: c.verziaKonceptu, koncept: c.koncept, zakladDb: c.zakladDb });
  };
  useEffect(() => {
    if (!neulozene) return;
    zalohaRef.current();
    const t = window.setInterval(() => zalohaRef.current(), 5000);
    return () => { window.clearInterval(t); zalohaRef.current(); };
  }, [neulozene]);
  useEffect(() => {
    nastavNeulozene(neulozene);
    nastavSpravuOdchodu(neulozene ? SPRAVA_ODCHODU : null);
    nastavOdkladac(() => zalohaRef.current());
    return () => { nastavNeulozene(false); nastavSpravuOdchodu(null); nastavOdkladac(null); };
  }, [neulozene]);
  useEffect(() => {
    if (!neulozene) return;
    const varuj = (e: BeforeUnloadEvent) => {
      zalohaRef.current();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', varuj);
    return () => window.removeEventListener('beforeunload', varuj);
  }, [neulozene]);

  /* ── Uloženie ── */
  const spracujChybu = useCallback((e: unknown, pri: 'ulozenie' | 'zverejnenie'): void => {
    const konf = konceptZmeneny(e);
    if (konf) { otvorDialog({ druh: 'konflikt', detail: konf }); return; }
    if (kodChyby(e) === 'konflikt-db') {
      const { konflikty, db } = konfliktyDb(e);
      if (db) { otvorDialog({ druh: 'konfliktDb', konflikty, db }); return; }
    }
    const chyby = chybyKontroly(e);
    if ((e as StrapiError)?.status === 400 && chyby.length) {
      setChybyServera(chyby);
      otvorDialog({ druh: 'chyby', chyby, pri });
      return;
    }
    nastavSpravu({ ton: 'chyba', text: (e as Error)?.message || 'Operácia zlyhala.' });
  }, []);

  const ulozitS = useCallback(async (zaklad: number): Promise<boolean> => {
    const c = r.current;
    if (!c.token) return false;
    setPracuje('Ukladám koncept…');
    try {
      const odp = await ulozKoncept(c.token, { zaklad, data: c.koncept, zakladDb: c.koncept ? c.zakladDb : null });
      setVerziaKonceptu(odp.verziaKonceptu);
      r.current.verziaKonceptu = odp.verziaKonceptu;
      setUlozeny(json(c.koncept, c.zakladDb));
      setChybyServera([]);
      zmazZalohu();
      nastavSpravu({ ton: 'ok', text: 'Koncept je uložený. Na webe sa prejaví až po zverejnení.' });
      await obnovMeta();
      return true;
    } catch (e) {
      spracujChybu(e, 'ulozenie');
      return false;
    } finally {
      setPracuje(null);
    }
  }, [obnovMeta, spracujChybu]);

  const ulozit = useCallback(() => ulozitS(r.current.verziaKonceptu), [ulozitS]);

  const pripravZverejnenie = useCallback(async () => {
    if (r.current.neulozene) {
      const ok = await ulozit();
      if (!ok) return;
    }
    otvorDialog({ druh: 'zverejnit' });
  }, [ulozit]);

  const potvrdZverejnenie = useCallback(async (poznamka: string): Promise<boolean> => {
    const c = r.current;
    if (!c.token) return false;
    setPracuje('Zverejňujem…');
    try {
      const odp = await zverejnitKoncept(c.token, { zaklad: c.verziaKonceptu, ...(poznamka.trim() ? { poznamka: poznamka.trim() } : {}) });
      setZakladDb(odp.zakladDb);
      setUlozeny(json(c.koncept, odp.zakladDb));
      zmazZalohu();
      otvorDialog(null);
      nastavSpravu({ ton: 'ok', text: `Zverejnené — na webe je verzia ${odp.verziaZverejnena}.${odp.zapisy.length ? ` Do databázy sa zapísalo ${odp.zapisy.length} ${odp.zapisy.length === 1 ? 'údaj' : odp.zapisy.length < 5 ? 'údaje' : 'údajov'} (poradie, názvy, galéria).` : ''}` });
      await obnovMeta();
      return true;
    } catch (e) {
      spracujChybu(e, 'zverejnenie');
      return false;
    } finally {
      setPracuje(null);
    }
  }, [obnovMeta, spracujChybu]);

  /* ── Konflikty ── */
  const nacitatJehoVerziu = useCallback(async () => {
    zmazZalohu();
    otvorDialog(null);
    await nacitaj(false);
    nastavSpravu({ ton: 'info', text: 'Načítaný koncept, ktorý uložil iný redaktor. Vaše zmeny sa zahodili.' });
  }, [nacitaj]);

  const prepisatMojou = useCallback(async (detail: KonceptZmeneny) => {
    otvorDialog(null);
    await ulozitS(detail.verziaKonceptu);
  }, [ulozitS]);

  const vyriesitKonfliktDb = useCallback(async (konflikty: KonfliktDb[], db: ZakladDb, ako: 'prevziat' | 'ponechat') => {
    const c = r.current;
    const druhy = new Set(konflikty.map((k) => k.druh));
    const kategorie = new Set(konflikty.map((k) => k.kategoria).filter((x): x is string => !!x));
    if (ako === 'prevziat' && c.koncept) {
      const v = prevezmiKonflikty(c.koncept, c.zakladDb, db, c.kategorieDb, druhy, kategorie);
      historia.set(v.koncept, 'prevzatie hodnôt z databázy');
      setZakladDb(v.zakladDb);
      r.current = { ...r.current, koncept: v.koncept, zakladDb: v.zakladDb, neulozene: true };
    } else {
      const z = ponechajMoje(c.zakladDb, db, druhy, kategorie);
      setZakladDb(z);
      r.current = { ...r.current, zakladDb: z, neulozene: true };
    }
    otvorDialog(null);
    const ok = await ulozitS(r.current.verziaKonceptu);
    if (ok) otvorDialog({ druh: 'zverejnit' });
  }, [historia, ulozitS]);

  /* ── Založenie, obnovenie, zahodenie ── */
  const zalozitZDnesnehoWebu = useCallback(async () => {
    const tok = r.current.token;
    if (!tok) return;
    setPracuje('Zakladám vzhľad z dnešného webu…');
    try {
      const { slugyClankov, cestyObrazkov } = odkazyZakladneho(ZAKLADNY_VZHLAD);
      const [o, kat, clanky, subory] = await Promise.all([
        nacitajKoncept(tok), kategorieZDb(tok), clankyPodlaSlugu(tok, [...slugyClankov]), suboryPodlaCesty(tok, [...cestyObrazkov]),
      ]);
      const { vzhlad, zvysky } = prevedVzhlad({
        zakladny: ZAKLADNY_VZHLAD,
        kategorie: kat.map((k) => ({ documentId: k.documentId, slug: k.slug, name: k.name, order: k.order })),
        clanky: new Map(clanky.map((c) => [c.slug, c.dokument])),
        subory,
        fotogaleria: o.db.fotogaleria,
        preklad: prekladZoSlovnika,
      });
      await ulozKoncept(tok, { zaklad: o.verziaKonceptu, data: vzhlad, zakladDb: o.db });
      zmazZalohu();
      await nacitaj(false);
      nastavSpravu({
        ton: zvysky.length ? 'info' : 'ok',
        text: zvysky.length
          ? `Vzhľad je založený ako koncept, ${zvysky.length} odkazov sa nepodarilo previesť (ostali podľa slugu alebo cesty).`
          : 'Vzhľad je založený z dnešného webu ako koncept. Web sa zmení až po zverejnení.',
      });
    } catch (e) {
      spracujChybu(e, 'ulozenie');
    } finally {
      setPracuje(null);
    }
  }, [nacitaj, spracujChybu]);

  const obnovitVerziu = useCallback(async (verzia: number): Promise<boolean> => {
    const c = r.current;
    if (!c.token) return false;
    setPracuje(`Obnovujem verziu ${verzia}…`);
    try {
      await obnovVerziu(c.token, verzia, c.verziaKonceptu);
      zmazZalohu();
      nastavNahladVerzie(null);
      otvorDialog(null);
      await nacitaj(false);
      nastavSpravu({ ton: 'ok', text: `Verzia ${verzia} je obnovená do konceptu. Na webe sa prejaví až po zverejnení.` });
      return true;
    } catch (e) {
      spracujChybu(e, 'ulozenie');
      return false;
    } finally {
      setPracuje(null);
    }
  }, [nacitaj, spracujChybu]);

  const zahoditKoncept = useCallback(async () => {
    const c = r.current;
    if (!c.token || !c.server) return;
    setPracuje('Vraciam koncept na zverejnený stav…');
    try {
      const data = c.server.zverejnene ?? null;
      await ulozKoncept(c.token, { zaklad: c.verziaKonceptu, data, zakladDb: data ? c.server.db : null });
      zmazZalohu();
      otvorDialog(null);
      await nacitaj(false);
      nastavSpravu({ ton: 'ok', text: data ? 'Koncept je vrátený na zverejnený stav.' : 'Koncept je prázdny — nič zverejnené zatiaľ nie je.' });
    } catch (e) {
      spracujChybu(e, 'ulozenie');
    } finally {
      setPracuje(null);
    }
  }, [nacitaj, spracujChybu]);

  const obnovitZalohu = useCallback((z: Zaloha) => {
    historia.reset(z.koncept);
    setZakladDb(z.zakladDb);
    setVerziaKonceptu(z.zaklad);
    otvorDialog(null);
    nastavSpravu({ ton: 'info', text: 'Rozpracované zmeny z prehliadača sú obnovené. Uložte koncept, aby sa nestratili.' });
  }, [historia]);

  const zahoditZalohu = useCallback(() => { zmazZalohu(); otvorDialog(null); }, []);

  /* ── Doplnenie rozriešených údajov o to, čo editor práve vybral ── */
  const doplnSubor = useCallback((f: MediaFile) => {
    const formats: Subor['formats'] = {};
    for (const v of ['thumbnail', 'small', 'medium', 'large'] as const) {
      const x = f.formats?.[v];
      if (x?.url) formats[v] = { url: x.url, width: x.width, height: x.height };
    }
    setNavyse((n) => ({ ...n, subory: { ...n.subory, [String(f.id)]: { id: f.id, url: f.url, width: f.width, height: f.height, alt: f.alternativeText, formats } } }));
  }, []);
  const doplnClanky = useCallback((c: NajdenyClanok[]) => {
    if (!c.length) return;
    setNavyse((n) => {
      const clanky = { ...n.clanky };
      for (const x of c) clanky[x.dokument] = { ...(clanky[x.dokument] ?? {}), ...x.jazyky };
      return { ...n, clanky };
    });
  }, []);

  /* ── Kontrola v editore (tá istá ako na serveri) ── */
  const chybyKlienta = useMemo(() => {
    if (!koncept) return [];
    const tvar = skontrolujTvar(koncept);
    const odkazy = skontrolujOdkazy(koncept, {
      kategorie: new Set(kategorieDb.map((k) => k.documentId)),
      clanky: new Set(Object.entries(rozriesene.clanky).filter(([, v]) => !!v?.sk).map(([d]) => d)),
      subory: new Set(Object.keys(rozriesene.subory).map(Number)),
    });
    return [...tvar, ...odkazy];
  }, [koncept, kategorieDb, rozriesene]);

  const hodnota: KonceptHodnota = {
    stav, chybaNacitania, server, kategorieDb, rozriesene, koncept, zakladDb, verziaKonceptu, neulozene,
    pracuje, sprava, nastavSpravu, prevzate,
    zmen,
    vratit: historia.undo, zopakovat: historia.redo,
    mozeVratit: historia.canUndo, mozeZopakovat: historia.canRedo,
    popisVratit: historia.undoLabel, popisZopakovat: historia.redoLabel,
    nacitajZnova: () => nacitaj(false),
    ulozit, pripravZverejnenie, potvrdZverejnenie, zalozitZDnesnehoWebu, obnovitVerziu, zahoditKoncept,
    nacitatJehoVerziu, prepisatMojou, vyriesitKonfliktDb, obnovitZalohu, zahoditZalohu,
    doplnSubor, doplnClanky,
    dialog, otvorDialog, vyber, nastavVyber, nahladVerzie, nastavNahladVerzie,
    chybyKlienta, chybyServera,
  };
  void user;
  return <Kontext.Provider value={hodnota}>{children}</Kontext.Provider>;
}
