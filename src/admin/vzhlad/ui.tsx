'use client';

/**
 * Dialógy editora vzhľadu, ktoré sa pýtajú na jednu vec (potvrdenie, článok,
 * kategória, cieľ odkazu, nový názov kategórie, obrázok) — ako sľuby
 * (`await ui.potvrd(…)`). Kreslia sa v dokumente administrácie, nie v okne
 * plátna: plátno je vysoké ako celá stránka a `position: fixed` by tam
 * dialóg odsunulo mimo obrazovky.
 */

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from 'react';
import { Loader2, Upload, Image as ImageIcon, RotateCcw, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { MediaPicker } from '../components/MediaPicker';
import { parsePosition } from '../editor/CoverImage';
import { uploadFiles, fileUrl, type MediaFile } from '../api/media';
import { pouzitieSuboru, type NajdenyClanok, type PouzitieSuboru } from '../api/vzhlad';
import { LIMITY } from '../../lib/vzhlad/typy';
import type { Ciel, Obrazok, Text, Rozriesene } from '../../lib/vzhlad/typy';
import { HladanieClanku, CielOdkazu, adresaNahladu } from './polia';
import type { ObrazokPrvku } from './prvky';
import type { KategoriaVDb } from './stav/operacie';
import type { Stranka } from './stav/KonceptKontext';

export type VysledokObrazka = Obrazok | null | 'povodny' | undefined;

export interface EditorUI {
  potvrd: (o: { nadpis: string; text: ReactNode; tlacidlo: string; nebezpecne?: boolean }) => Promise<boolean>;
  vyberClanok: (o: { nadpis: string; kategoria?: string | null; vylucit?: string[] }) => Promise<NajdenyClanok | null>;
  vyberKategoriu: (o: { nadpis: string; vylucit?: string[] }) => Promise<KategoriaVDb | null>;
  vyberCiel: (o: { nadpis: string }) => Promise<{ text: string; ciel: Ciel } | null>;
  vyberFotku: () => Promise<MediaFile | null>;
  /** Premenovanie kategórie — vyžaduje aj EN a DE. Vráti celý nový názov alebo null. */
  premenuj: (o: { stary: Text | null; novySk: string; zaloha: string }) => Promise<Text | null>;
  /** Výmena obrázka: nový obrázok (`null` = bez obrázka), `'povodny'` = vrátiť pôvodný, `undefined` = zrušené. */
  otvorObrazok: (p: ObrazokPrvku, aktualny: Obrazok | null) => Promise<VysledokObrazka>;
  naPlatne: (stranka: Stranka, nazov: string | null) => void;
  upravitClanok: (dokument: string) => void;
}

const UIKontext = createContext<EditorUI | null>(null);
export const useEditorUI = (): EditorUI => {
  const u = useContext(UIKontext);
  if (!u) throw new Error('useEditorUI musí byť vnútri <EditorUIProvider>');
  return u;
};

type Otvoreny =
  | { druh: 'potvrd'; nadpis: string; text: ReactNode; tlacidlo: string; nebezpecne?: boolean; ok: (b: boolean) => void }
  | { druh: 'clanok'; nadpis: string; kategoria?: string | null; vylucit?: string[]; ok: (c: NajdenyClanok | null) => void }
  | { druh: 'kategoria'; nadpis: string; vylucit?: string[]; ok: (k: KategoriaVDb | null) => void }
  | { druh: 'ciel'; nadpis: string; ok: (c: { text: string; ciel: Ciel } | null) => void }
  | { druh: 'fotka'; ok: (f: MediaFile | null) => void }
  | { druh: 'premenuj'; stary: Text | null; novySk: string; zaloha: string; ok: (t: Text | null) => void }
  | { druh: 'obrazok'; p: ObrazokPrvku; aktualny: Obrazok | null; ok: (o: VysledokObrazka) => void };

export function EditorUIProvider({ children, kategorieDb, rozriesene, naPlatne, upravitClanok, doplnSubor }: {
  children: ReactNode;
  kategorieDb: KategoriaVDb[];
  rozriesene: Rozriesene;
  naPlatne: EditorUI['naPlatne'];
  upravitClanok: EditorUI['upravitClanok'];
  doplnSubor: (f: MediaFile) => void;
}) {
  const [otvoreny, setOtvoreny] = useState<Otvoreny | null>(null);
  const zavri = () => setOtvoreny(null);

  const ui: EditorUI = {
    potvrd: (o) => new Promise((ok) => setOtvoreny({ druh: 'potvrd', ...o, ok })),
    vyberClanok: (o) => new Promise((ok) => setOtvoreny({ druh: 'clanok', ...o, ok })),
    vyberKategoriu: (o) => new Promise((ok) => setOtvoreny({ druh: 'kategoria', ...o, ok })),
    vyberCiel: (o) => new Promise((ok) => setOtvoreny({ druh: 'ciel', ...o, ok })),
    vyberFotku: () => new Promise((ok) => setOtvoreny({ druh: 'fotka', ok })),
    premenuj: (o) => new Promise((ok) => setOtvoreny({ druh: 'premenuj', ...o, ok })),
    otvorObrazok: (p, aktualny) => new Promise((ok) => setOtvoreny({ druh: 'obrazok', p, aktualny, ok })),
    naPlatne,
    upravitClanok,
  };

  return (
    <UIKontext.Provider value={ui}>
      {children}
      {otvoreny?.druh === 'potvrd' && (
        <Okno onZavri={() => { otvoreny.ok(false); zavri(); }} nadpis={otvoreny.nadpis} uzke>
          <div style={{ fontSize: 13.5, color: 'var(--ad-secondary)', lineHeight: 1.55 }}>{otvoreny.text}</div>
          <div className="vw-dialog-tlacidla">
            <button className="abtn" onClick={() => { otvoreny.ok(false); zavri(); }}>Nechať</button>
            <button className={otvoreny.nebezpecne ? 'abtn abtn-danger' : 'abtn abtn-primary'} data-vw-potvrdit
                    onClick={() => { otvoreny.ok(true); zavri(); }}>{otvoreny.tlacidlo}</button>
          </div>
        </Okno>
      )}
      {otvoreny?.druh === 'clanok' && (
        <Okno onZavri={() => { otvoreny.ok(null); zavri(); }} nadpis={otvoreny.nadpis}>
          <p>Vyberajú sa len články zverejnené v slovenčine — iné vzhľad neprijme. Ak má článok anglickú a nemeckú verziu, web ich ukáže v jazyku stránky.</p>
          <HladanieClanku autoFocus kategoria={otvoreny.kategoria} vylucit={otvoreny.vylucit} onVyber={(c) => { otvoreny.ok(c); zavri(); }} />
        </Okno>
      )}
      {otvoreny?.druh === 'kategoria' && (
        <Okno nadpis={otvoreny.nadpis} onZavri={() => { otvoreny.ok(null); zavri(); }}>
          <div className="vw-hladanie-vysledky" style={{ maxHeight: 420 }}>
            {kategorieDb.map((k) => (
              <button key={k.documentId} type="button" disabled={otvoreny.vylucit?.includes(k.documentId)} data-vw-kategoria={k.slug}
                      onClick={() => { otvoreny.ok(k); zavri(); }}>
                <span style={{ flex: 1 }}>{k.name}<small>/{k.slug}</small></span>
              </button>
            ))}
          </div>
        </Okno>
      )}
      {otvoreny?.druh === 'ciel' && <CielDialog o={otvoreny} kategorie={kategorieDb} rozriesene={rozriesene} onZavri={zavri} />}
      {otvoreny?.druh === 'fotka' && (
        <MediaPicker onPick={(f) => { if (f[0]) doplnSubor(f[0]); otvoreny.ok(f[0] ?? null); zavri(); }} onClose={() => { otvoreny.ok(null); zavri(); }} />
      )}
      {otvoreny?.druh === 'premenuj' && <PremenovanieDialog o={otvoreny} onZavri={zavri} />}
      {otvoreny?.druh === 'obrazok' && (
        <ObrazokDialog p={otvoreny.p} terajsi={otvoreny.aktualny} rozriesene={rozriesene} doplnSubor={doplnSubor}
                       onKoniec={(o) => { otvoreny.ok(o); zavri(); }} />
      )}
    </UIKontext.Provider>
  );
}

/* ───────────────────────── Okno ───────────────────────── */

export function Okno({ nadpis, children, onZavri, siroke, uzke }: { nadpis: string; children: ReactNode; onZavri: () => void; siroke?: boolean; uzke?: boolean }) {
  const zavri = useRef(onZavri);
  zavri.current = onZavri;
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); zavri.current(); } };
    document.addEventListener('keydown', esc, true);
    return () => document.removeEventListener('keydown', esc, true);
  }, []);
  return (
    <div className="ad-modal-wrap" onClick={onZavri} style={{ zIndex: 150 }}>
      <div className={`acard vw-dialog${siroke ? ' je-siroky' : ''}`} role="dialog" aria-modal="true" aria-label={nadpis}
           style={uzke ? { width: 'min(460px, 92vw)' } : undefined} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <h2 style={{ flex: 1 }}>{nadpis}</h2>
          <button className="abtn abtn-icon" onClick={onZavri} aria-label="Zavrieť"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CielDialog({ o, kategorie, rozriesene, onZavri }: { o: Extract<Otvoreny, { druh: 'ciel' }>; kategorie: KategoriaVDb[]; rozriesene: Rozriesene; onZavri: () => void }) {
  const [text, setText] = useState('');
  const [ciel, setCiel] = useState<Ciel>(kategorie[0] ? { druh: 'kategoria', kategoria: { dokument: kategorie[0].documentId, slug: kategorie[0].slug } } : { druh: 'cesta', cesta: '/aktuality' });
  return (
    <Okno nadpis={o.nadpis} onZavri={() => { o.ok(null); onZavri(); }}>
      <label className="vw-pole">
        <span className="vw-pole-nazov">Text odkazu (slovensky)</span>
        <input className="afld" value={text} maxLength={LIMITY.nazov} onChange={(e) => setText(e.target.value)} autoFocus data-vw-text-odkazu />
      </label>
      <div style={{ height: 10 }} />
      <CielOdkazu ciel={ciel} onZmena={setCiel} kategorie={kategorie} rozriesene={rozriesene} />
      <div className="vw-dialog-tlacidla">
        <button className="abtn" onClick={() => { o.ok(null); onZavri(); }}>Zrušiť</button>
        <button className="abtn abtn-primary" disabled={!text.trim()} onClick={() => { o.ok({ text: text.trim(), ciel }); onZavri(); }}>Pridať odkaz</button>
      </div>
    </Okno>
  );
}

function PremenovanieDialog({ o, onZavri }: { o: Extract<Otvoreny, { druh: 'premenuj' }>; onZavri: () => void }) {
  const [en, setEn] = useState(o.stary?.en ?? '');
  const [de, setDe] = useState(o.stary?.de ?? '');
  return (
    <Okno nadpis="Premenovanie kategórie" onZavri={() => { o.ok(null); onZavri(); }}>
      <p>
        Slovenský názov sa zmení na <b>„{o.novySk}“</b> (pri zverejnení sa zapíše aj do databázy, takže ho uvidia aj staré verzie webu a appky).
        Anglický a nemecký web by bez nového prekladu stratil názov kategórie — vyplňte ho, prosím, aj v týchto jazykoch.
      </p>
      <label className="vw-pole">
        <span className="vw-pole-nazov">Anglický názov</span>
        <input className="afld" value={en} maxLength={LIMITY.nazov} onChange={(e) => setEn(e.target.value)} autoFocus data-vw-premenovanie="en" />
      </label>
      <div style={{ height: 8 }} />
      <label className="vw-pole">
        <span className="vw-pole-nazov">Nemecký názov</span>
        <input className="afld" value={de} maxLength={LIMITY.nazov} onChange={(e) => setDe(e.target.value)} data-vw-premenovanie="de" />
      </label>
      {o.stary?.en && <div className="vw-pomoc">Doterajšie preklady patria k názvu „{o.stary.enZo || o.stary.sk}“ — skontrolujte, či ešte sedia.</div>}
      <div className="vw-dialog-tlacidla">
        <button className="abtn" onClick={() => { o.ok(null); onZavri(); }}>Zrušiť premenovanie</button>
        <button className="abtn abtn-primary" disabled={!en.trim() || !de.trim()} data-vw-premenovat
                onClick={() => { o.ok({ sk: o.novySk, en: en.trim(), de: de.trim(), enZo: o.novySk, deZo: o.novySk }); onZavri(); }}>
          Premenovať v troch jazykoch
        </button>
      </div>
    </Okno>
  );
}

/* ───────────────────────── Obrázok ───────────────────────── */

/**
 * Výrez ťahaním — ten istý princíp ako titulná fotka článku (`editor/CoverImage`):
 * posun myšou o šírku obrázka = posun výrezu o 100 %. Výsledok je `object-position`
 * v tvare „50% 40%“ (kontrola údajov iný nepustí).
 */
function VyrezObrazka({ src, pozicia, onZmena }: { src: string; pozicia: string; onZmena: (p: string) => void }) {
  const [zivy, setZivy] = useState<string | null>(null);
  const zivyRef = useRef<string | null>(null);
  const [rada, setRada] = useState(false);
  const stlac = (e: RPointerEvent<HTMLImageElement>) => {
    e.preventDefault();
    const box = e.currentTarget.getBoundingClientRect();
    const z = parsePosition(pozicia);
    const x0 = e.clientX, y0 = e.clientY;
    const obmedz = (h: number) => Math.max(0, Math.min(100, h));
    const pohyb = (ev: PointerEvent) => {
      const h = `${Math.round(obmedz(z.x - ((ev.clientX - x0) / box.width) * 100))}% ${Math.round(obmedz(z.y - ((ev.clientY - y0) / box.height) * 100))}%`;
      zivyRef.current = h;
      setZivy(h);
    };
    const pusti = () => {
      document.removeEventListener('pointermove', pohyb);
      document.removeEventListener('pointerup', pusti);
      const h = zivyRef.current;
      zivyRef.current = null;
      setZivy(null);
      if (h) onZmena(h);
    };
    document.addEventListener('pointermove', pohyb);
    document.addEventListener('pointerup', pusti);
  };
  const h = zivy ?? pozicia;
  return (
    <>
      <img src={src} alt="" draggable={false} style={{ objectPosition: h, cursor: 'grab' }} onPointerDown={stlac}
           onMouseEnter={() => setRada(true)} onMouseLeave={() => setRada(false)} />
      {(rada || zivy) && <div className="ed-cover-hint">{zivy ? `Výrez ${h}` : 'Potiahnutím posuniete výrez'}</div>}
    </>
  );
}

const MIESTA: Record<string, string> = { koncept: 'koncept', zverejnene: 'zverejnený vzhľad', historia: 'história' };

function popisMiesta(cesta: string): string {
  return cesta
    .replace(/^domov\.dlazdice\.skupiny\[\d+\]\.polozky\[\d+\]/, 'dlaždica')
    .replace(/^kategorie\[\d+\]\.obrazok/, 'obrázok kategórie')
    .replace(/^domov\.fotogaleria\.fotky\[(\d+)\]/, (_, i) => `vybraná fotogaléria (${Number(i) + 1}.)`)
    .replace(/^cinnost\.polozky\[\d+\]\.obrazok/, 'činnosť združenia')
    .replace(/^domov\.sekcie\[\d+\]\.riadky\[\d+\]\.obrazky\[\d+\]\.obrazok/, 'dlaždica článku v Ďalšom obsahu')
    .replace(/^domov\.sekcie\[\d+\]\.obrazok/, 'kronika')
    .replace(/^domov\.uvod\.znak/, 'znak na domovskej');
}

function ObrazokDialog({ p, terajsi, rozriesene, doplnSubor, onKoniec }: {
  p: ObrazokPrvku; terajsi: Obrazok | null; rozriesene: Rozriesene; doplnSubor: (f: MediaFile) => void;
  onKoniec: (o: VysledokObrazka) => void;
}) {
  const { token } = useAuth();
  const [novy, setNovy] = useState<{ o: Obrazok | null; subor?: MediaFile } | null>(null);
  const [vyberam, setVyberam] = useState(false);
  const [nahrava, setNahrava] = useState(false);
  const [chyba, setChyba] = useState('');
  const [pouzitie, setPouzitie] = useState<PouzitieSuboru | null>(null);
  const [pozicia, setPozicia] = useState<string>(terajsi?.pozicia ?? '50% 50%');
  const vstup = useRef<HTMLInputElement>(null);

  /* Pred výmenou: kde je terajší obrázok ešte použitý. */
  useEffect(() => {
    if (!token || !terajsi || !('id' in terajsi)) return;
    let zrusene = false;
    pouzitieSuboru(token, terajsi.id).then((x) => { if (!zrusene) setPouzitie(x); }).catch(() => {});
    return () => { zrusene = true; };
  }, [token, terajsi]);

  const zobraz = novy ? novy.o : terajsi;
  const adresa = novy?.subor ? fileUrl(novy.subor, 'medium') : adresaNahladu(zobraz, rozriesene, 'medium');

  const vybrane = (f: MediaFile) => {
    doplnSubor(f);
    setNovy({ o: { id: f.id, pozicia: null }, subor: f });
    setPozicia('50% 50%');
  };
  const nahraj = async (zoznam: FileList | null) => {
    if (!zoznam?.length || !token) return;
    setNahrava(true); setChyba('');
    try {
      const [f] = await uploadFiles(token, [zoznam[0]]);
      if (f) vybrane(f);
    } catch (e) {
      setChyba((e as Error)?.message || 'Nahranie zlyhalo.');
    } finally { setNahrava(false); }
  };

  const ostatneMiesta = (pouzitie?.miesta ?? []).filter((m) => m.zdroj !== 'historia');
  const vHistorii = (pouzitie?.miesta ?? []).filter((m) => m.zdroj === 'historia').length;
  const zmenenyVyrez = p.vyrez && pozicia !== (terajsi?.pozicia ?? '50% 50%');
  const vysledok: VysledokObrazka = novy
    ? (novy.o && p.vyrez && pozicia !== '50% 50%' ? { ...novy.o, pozicia } : novy.o)
    : (terajsi && zmenenyVyrez ? { ...terajsi, pozicia } : undefined);

  return (
    <Okno nadpis={p.nazov} onZavri={() => onKoniec(undefined)} siroke>
      {terajsi && 'id' in terajsi && pouzitie && (
        <div className={`vw-upozornenie ${ostatneMiesta.length > 1 || pouzitie.chraneny ? 'je-zlte' : 'je-sive'}`} style={{ marginBottom: 10 }} data-vw-pouzitie>
          <span>
            <b>Kde je terajší obrázok ešte použitý:</b>{' '}
            {ostatneMiesta.length ? ostatneMiesta.map((m) => `${popisMiesta(m.cesta)} (${MIESTA[m.zdroj] ?? m.zdroj})`).join(', ') : 'nikde inde'}
            {vHistorii ? ` · v ${vHistorii} ${vHistorii === 1 ? 'staršej verzii' : 'starších verziách'} histórie` : ''}
            {pouzitie.chraneny ? ' · súbor používajú aj staré verzie webu a appky (z knižnice sa nedá zmazať)' : ''}.
            {' '}Výmena tu zmení obrázok len na tomto mieste — súbor v knižnici ostáva.
          </span>
        </div>
      )}
      {terajsi && 'cesta' in terajsi && (
        <div className="vw-upozornenie je-sive" style={{ marginBottom: 10 }}>
          <span>Terajší obrázok je súbor pôvodného webu ({terajsi.cesta}). Výmena ho zmení len tu.</span>
        </div>
      )}

      <div className="vw-nahlady">
        {p.nahlady.map((n) => (
          <figure key={n.nazov}>
            <div className="vw-vyrez" style={{ aspectRatio: String(n.pomer) }} data-vw-nahlad={n.nazov}>
              {adresa ? (
                p.vyrez ? (
                  <VyrezObrazka src={adresa} pozicia={pozicia} onZmena={setPozicia} />
                ) : (
                  <img src={adresa} alt="" />
                )
              ) : (
                <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 12.5, color: 'var(--ad-muted)' }}>{p.bezObrazka ?? 'bez obrázka'}</span>
              )}
            </div>
            <figcaption>{n.nazov}{p.vyrez && adresa ? ` · výrez ${pozicia}` : ''}</figcaption>
          </figure>
        ))}
      </div>
      {p.vyrez && <div className="vw-pomoc">Výrez nastavíte potiahnutím obrázka v ktoromkoľvek náhľade — platí na počítači aj na mobile.</div>}
      {chyba && <div className="vw-upozornenie je-cervene" style={{ marginTop: 8 }}>{chyba}</div>}

      <div className="vw-dialog-tlacidla" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="abtn" onClick={() => setVyberam(true)} data-vw-z-medii><ImageIcon className="w-4 h-4" /> Vybrať z Médií</button>
          <button className="abtn" onClick={() => vstup.current?.click()} disabled={nahrava} data-vw-nahrat>
            {nahrava ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Nahrať nový
          </button>
          <input ref={vstup} type="file" accept="image/*" hidden data-vw-subor-vstup onChange={(e) => nahraj(e.target.files)} />
          {p.povodny && (
            <button className="abtn" data-vw-vratit-povodny onClick={() => onKoniec('povodny')}>
              <RotateCcw className="w-4 h-4" /> {p.povodny.popis}
            </button>
          )}
          {p.bezObrazka && terajsi && (
            <button className="abtn" onClick={() => setNovy({ o: null })}>Bez obrázka ({p.bezObrazka})</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="abtn" onClick={() => onKoniec(undefined)}>Zrušiť</button>
          <button className="abtn abtn-primary" disabled={vysledok === undefined} data-vw-pouzit-obrazok onClick={() => onKoniec(vysledok)}>
            Použiť
          </button>
        </div>
      </div>
      {vyberam && <MediaPicker onPick={(f) => { if (f[0]) vybrane(f[0]); }} onClose={() => setVyberam(false)} />}
    </Okno>
  );
}
