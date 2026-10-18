'use client';

/**
 * Polia pravého panela a klasickej úpravy — texty so záložkami SK · EN · DE,
 * prepínače, výber kategórie, hľadanie článku, cieľ odkazu, zoznam s úchytmi.
 *
 * Texty sa zapisujú do vzhľadu až pri opustení poľa alebo Enteri (jeden krok
 * v histórii na jedno prepísanie, nie na každé písmeno).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { GripVertical, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Search, Loader2 } from 'lucide-react';
import { useReorder } from '../editor/SideColumnEditor';
import { useAuth } from '../AuthContext';
import { hladajClanky, type NajdenyClanok } from '../api/vzhlad';
import { fileUrl, type MediaFile } from '../api/media';
import { STRAPI_URL } from '../api/client';
import { prekladZoSlovnika } from '../../lib/jazyk';
import { variant } from '../../data/categories';
import type { Jazyk, Text, TextVolitelny, Obrazok, Rozriesene, Ciel } from '../../lib/vzhlad/typy';
import { stavPrekladu, jeVyhrada, POPIS_STAVU } from './stav/preklady';
import type { KategoriaVDb } from './stav/operacie';

export const JAZYKY_PANELA: { j: Jazyk; s: string }[] = [{ j: 'sk', s: 'SK' }, { j: 'en', s: 'EN' }, { j: 'de', s: 'DE' }];

/* ───────────────────────── Text v troch jazykoch ───────────────────────── */

export function TextovePole({
  nazov, text, druh = 'text', limit, zaloha, viacriadkove, onZmena, jazyk, onJazyk, id,
}: {
  nazov: string;
  text: Text | TextVolitelny | string | null | undefined;
  druh?: 'text' | 'volitelny' | 'retazec';
  limit: number;
  /** Čo je na webe, keď text vo vzhľade nie je. */
  zaloha?: string;
  viacriadkove?: boolean;
  onZmena: (j: Jazyk, hodnota: string) => void;
  /** Riadená záložka (pravý panel nasleduje jazyk plátna). */
  jazyk?: Jazyk;
  onJazyk?: (j: Jazyk) => void;
  id?: string;
}) {
  const [vlastny, setVlastny] = useState<Jazyk>('sk');
  const j: Jazyk = druh === 'retazec' ? 'sk' : jazyk ?? vlastny;
  const nastavJ = (x: Jazyk) => { setVlastny(x); onJazyk?.(x); };
  const t = typeof text === 'object' && text ? text as Text : null;
  const hodnota = druh === 'retazec' ? String(text ?? '') : ((t?.[j] as string | null | undefined) ?? '');
  const [koncept, setKoncept] = useState(hodnota);
  const upravuje = useRef(false);
  useEffect(() => { if (!upravuje.current) setKoncept(hodnota); }, [hodnota, j]);

  const sk = t?.sk ?? '';
  const zoSlovnika = j !== 'sk' && sk ? prekladZoSlovnika(sk, j) : null;
  const stav = j !== 'sk' && druh !== 'retazec' ? stavPrekladu(t, j, druh === 'volitelny') : 'ok';
  const placeholder = j === 'sk' ? (zaloha ? `(prázdne = ${zaloha})` : '') : (zoSlovnika || sk || zaloha || '');

  const potvrd = () => {
    upravuje.current = false;
    if (koncept !== hodnota) onZmena(j, koncept);
  };
  const Pole = viacriadkove ? 'textarea' : 'input';
  return (
    <label className="vw-pole" htmlFor={id}>
      <span className="vw-pole-nazov">
        {nazov}
        {stav === 'slovnik' && <span className="vw-stitok-slovnik">zo slovníka</span>}
        {jeVyhrada(stav) && <span className="vw-stitok-vyhrada">{stav === 'chyba' ? 'chýba preklad' : 'starší preklad'}</span>}
        <span className={`vw-pocet${koncept.length >= limit ? ' je-plne' : ''}`}>{koncept.length} / {limit}</span>
      </span>
      {druh !== 'retazec' && (
        <span className="vw-zalozky" role="tablist">
          {JAZYKY_PANELA.map(({ j: x, s }) => {
            const vyhrada = x !== 'sk' && jeVyhrada(stavPrekladu(t, x as 'en' | 'de', druh === 'volitelny'));
            return (
              <button key={x} type="button" role="tab" aria-selected={x === j} className={x === j ? 'is-on' : ''}
                      onClick={(e) => { e.preventDefault(); nastavJ(x); }}>
                {s}{vyhrada && <span className="vw-jazyk-bodka" />}
              </button>
            );
          })}
        </span>
      )}
      <Pole
        id={id}
        className="afld"
        value={koncept}
        placeholder={placeholder}
        maxLength={limit}
        rows={viacriadkove ? 3 : undefined}
        data-vw-pole={`${nazov}|${j}`}
        onChange={(e) => { upravuje.current = true; setKoncept(e.target.value.replace(/[\r\n]+/g, ' ')); }}
        onBlur={potvrd}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
          if (e.key === 'Escape') { upravuje.current = false; setKoncept(hodnota); }
        }}
      />
      {j !== 'sk' && druh !== 'retazec' && (
        <span className={`vw-pomoc${jeVyhrada(stav) ? ' je-vyhrada' : ''}`}>
          <b>SK:</b> {sk || '—'}
          {stav !== 'ok' && <> · {POPIS_STAVU[stav]}</>}
          {stav === 'zastarany' && t?.[`${j}Zo` as 'enZo'] ? <> (preklad bol k „{t[`${j}Zo` as 'enZo']}“)</> : null}
        </span>
      )}
    </label>
  );
}

/* ───────────────────────── Drobné polia ───────────────────────── */

export function Prepinac({ popis, hodnota, onZmena, pomoc }: { popis: string; hodnota: boolean; onZmena: (v: boolean) => void; pomoc?: string }) {
  return (
    <div>
      <label className="vw-prepinac">
        <input type="checkbox" checked={hodnota} onChange={(e) => onZmena(e.target.checked)} />
        {popis}
      </label>
      {pomoc && <div className="vw-pomoc">{pomoc}</div>}
    </div>
  );
}

export function Vyber<T extends string | number>({ popis, hodnota, moznosti, onZmena }: {
  popis: string; hodnota: T; moznosti: { h: T; s: string }[]; onZmena: (v: T) => void;
}) {
  return (
    <label className="vw-pole">
      <span className="vw-pole-nazov">{popis}</span>
      <select className="afld" value={String(hodnota)} onChange={(e) => {
        const m = moznosti.find((x) => String(x.h) === e.target.value);
        if (m) onZmena(m.h);
      }}>
        {moznosti.map((m) => <option key={String(m.h)} value={String(m.h)}>{m.s}</option>)}
      </select>
    </label>
  );
}

export function VyberKategorie({ popis, kategorie, hodnota, onZmena, prazdna }: {
  popis: string; kategorie: KategoriaVDb[]; hodnota: string | null; onZmena: (k: KategoriaVDb) => void; prazdna?: string;
}) {
  return (
    <label className="vw-pole">
      <span className="vw-pole-nazov">{popis}</span>
      <select className="afld" value={hodnota ?? ''} onChange={(e) => {
        const k = kategorie.find((x) => x.documentId === e.target.value);
        if (k) onZmena(k);
      }}>
        {(prazdna || !hodnota) && <option value="">{prazdna ?? '— vyberte —'}</option>}
        {kategorie.map((k) => <option key={k.documentId} value={k.documentId}>{k.name} (/{k.slug})</option>)}
      </select>
    </label>
  );
}

/* ───────────────────────── Hľadanie článku ───────────────────────── */

export function HladanieClanku({ kategoria, onVyber, vylucit = [], autoFocus }: {
  kategoria?: string | null; onVyber: (c: NajdenyClanok) => void; vylucit?: string[]; autoFocus?: boolean;
}) {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const [vysledky, setVysledky] = useState<NajdenyClanok[]>([]);
  const [nacitava, setNacitava] = useState(false);
  const [lenKategoria, setLenKategoria] = useState(!!kategoria);
  useEffect(() => {
    if (!token) return;
    let zrusene = false;
    setNacitava(true);
    const t = setTimeout(() => {
      hladajClanky(token, q, { kategoria: lenKategoria ? kategoria : null, pocet: 15 })
        .then((v) => { if (!zrusene) setVysledky(v); })
        .catch(() => { if (!zrusene) setVysledky([]); })
        .finally(() => { if (!zrusene) setNacitava(false); });
    }, 250);
    return () => { zrusene = true; clearTimeout(t); };
  }, [token, q, kategoria, lenKategoria]);
  return (
    <div>
      <div style={{ position: 'relative' }}>
        <Search className="w-4 h-4" style={{ position: 'absolute', left: 10, top: 11, color: 'var(--ad-muted)' }} />
        <input className="afld" value={q} autoFocus={autoFocus} onChange={(e) => setQ(e.target.value)} placeholder="Hľadať článok podľa názvu…" style={{ paddingLeft: 32 }} data-vw-hladanie-clanku />
      </div>
      {kategoria && (
        <label className="vw-prepinac" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={lenKategoria} onChange={(e) => setLenKategoria(e.target.checked)} /> len z kategórie /{kategoria}
        </label>
      )}
      <div className="vw-hladanie-vysledky">
        {nacitava && <div className="vw-pomoc"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ display: 'inline' }} /> Hľadám…</div>}
        {!nacitava && !vysledky.length && <div className="vw-pomoc">Nič sa nenašlo.</div>}
        {vysledky.map((c) => (
          <button key={c.dokument} type="button" disabled={vylucit.includes(c.dokument)} onClick={() => onVyber(c)} data-vw-clanok={c.slug}>
            <span style={{ flex: 1, minWidth: 0 }}>
              {c.nazov}
              <small>/{c.kategoria ?? '—'} · {c.datum ? new Date(c.datum).toLocaleDateString('sk-SK') : ''}{c.jazyky.en ? ' · EN' : ''}{c.jazyky.de ? ' · DE' : ''}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Cieľ odkazu ───────────────────────── */

export function CielOdkazu({ ciel, onZmena, kategorie, rozriesene }: {
  ciel: Ciel; onZmena: (c: Ciel) => void; kategorie: KategoriaVDb[]; rozriesene: Rozriesene;
}) {
  const [hladat, setHladat] = useState(false);
  const [cesta, setCesta] = useState(ciel.druh === 'cesta' ? ciel.cesta : ciel.druh === 'url' ? ciel.url : '');
  useEffect(() => { setCesta(ciel.druh === 'cesta' ? ciel.cesta : ciel.druh === 'url' ? ciel.url : ''); }, [ciel]);
  return (
    <div className="vw-pole">
      <Vyber popis="Kam odkaz vedie" hodnota={ciel.druh} onZmena={(d) => {
        if (d === ciel.druh) return;
        if (d === 'kategoria' && kategorie[0]) onZmena({ druh: 'kategoria', kategoria: { dokument: kategorie[0].documentId, slug: kategorie[0].slug } });
        if (d === 'clanok') setHladat(true);
        if (d === 'cesta') onZmena({ druh: 'cesta', cesta: '/aktuality' });
        if (d === 'url') onZmena({ druh: 'url', url: 'https://' });
      }} moznosti={[{ h: 'kategoria', s: 'Kategória' }, { h: 'clanok', s: 'Článok' }, { h: 'cesta', s: 'Stránka webu (cesta)' }, { h: 'url', s: 'Iný web (https://)' }]} />
      {ciel.druh === 'kategoria' && (
        <VyberKategorie popis="Kategória" kategorie={kategorie} hodnota={ciel.kategoria.dokument}
                        onZmena={(k) => onZmena({ druh: 'kategoria', kategoria: { dokument: k.documentId, slug: k.slug } })} />
      )}
      {ciel.druh === 'clanok' && (
        <div className="vw-pomoc"><b>Článok:</b> {(ciel.clanok.dokument && rozriesene.clanky[ciel.clanok.dokument]?.sk?.nazov) || ciel.clanok.slug}{' '}
          <button type="button" className="abtn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setHladat((x) => !x)}>Zmeniť</button>
        </div>
      )}
      {(hladat) && (
        <HladanieClanku onVyber={(c) => { onZmena({ druh: 'clanok', clanok: { dokument: c.dokument, slug: c.slug } }); setHladat(false); }} />
      )}
      {(ciel.druh === 'cesta' || ciel.druh === 'url') && (
        <input className="afld" value={cesta} onChange={(e) => setCesta(e.target.value)}
               onBlur={() => onZmena(ciel.druh === 'cesta' ? { druh: 'cesta', cesta: cesta.trim() } : { druh: 'url', url: cesta.trim() })}
               placeholder={ciel.druh === 'cesta' ? '/aktuality' : 'https://…'} />
      )}
    </div>
  );
}

/* ───────────────────────── Zoznam s úchytmi ───────────────────────── */

export interface PolozkaZoznamu {
  uid: string;
  nazov: ReactNode;
  pod?: ReactNode;
  obrazok?: string | null;
  skryta?: boolean;
  neplatna?: boolean;
}

export function ZoznamPoloziek({ polozky, onPoradie, onSkryt, onOdstranit, onKlik, prazdny, akcie }: {
  polozky: PolozkaZoznamu[];
  onPoradie?: (z: number, na: number) => void;
  onSkryt?: (i: number) => void;
  onOdstranit?: (i: number) => void;
  onKlik?: (i: number) => void;
  prazdny?: string;
  akcie?: (i: number) => ReactNode;
}) {
  const { start, dragUid, over } = useReorder(polozky, (nove) => {
    if (!onPoradie) return;
    const presunuty = nove.findIndex((p, i) => p.uid !== polozky[i]?.uid);
    if (presunuty < 0) return;
    // nájdi, ktorý prvok sa pohol: porovnaj poradie
    for (let z = 0; z < polozky.length; z++) {
      const na = nove.findIndex((p) => p.uid === polozky[z].uid);
      const bezNeho = polozky.filter((_, i) => i !== z).map((p) => p.uid).join('|');
      const noveBez = nove.filter((p) => p.uid !== polozky[z].uid).map((p) => p.uid).join('|');
      if (na !== z && bezNeho === noveBez) { onPoradie(z, na); return; }
    }
  });
  if (!polozky.length) return <div className="vw-pomoc">{prazdny ?? 'Zoznam je prázdny.'}</div>;
  return (
    <div className="vw-zoznam" data-reorder-list>
      {polozky.map((p, i) => (
        <div key={p.uid} data-reorder-item data-vw-polozka={p.uid}
             className={`vw-zoznam-riadok${dragUid === p.uid ? ' is-dragging' : ''}${over === i ? ' is-over' : ''}${p.skryta ? ' je-skryte' : ''}${p.neplatna ? ' je-neplatne' : ''}`}>
          {onPoradie && (
            <button type="button" className="vw-ikona" title="Potiahnutím zmeníte poradie" aria-label="Presunúť" onPointerDown={start(p.uid)} style={{ cursor: 'grab', touchAction: 'none' }}>
              <GripVertical />
            </button>
          )}
          {p.obrazok !== undefined && (p.obrazok ? <img className="vw-mini" src={p.obrazok} alt="" /> : <span className="vw-mini" />)}
          <span className="vw-text" onClick={() => onKlik?.(i)} style={{ cursor: onKlik ? 'pointer' : undefined }}>
            {p.nazov}{p.pod && <small>{p.pod}</small>}
          </span>
          {akcie?.(i)}
          {onPoradie && (
            <>
              <button type="button" className="vw-ikona" title="Vyššie" aria-label="Vyššie" disabled={i === 0} onClick={() => onPoradie(i, i - 1)}><ArrowUp /></button>
              <button type="button" className="vw-ikona" title="Nižšie" aria-label="Nižšie" disabled={i === polozky.length - 1} onClick={() => onPoradie(i, i + 1)}><ArrowDown /></button>
            </>
          )}
          {onSkryt && (
            <button type="button" className="vw-ikona" title={p.skryta ? 'Zobraziť na webe' : 'Skryť na webe'} aria-label={p.skryta ? 'Zobraziť' : 'Skryť'} onClick={() => onSkryt(i)} data-vw-oko={p.uid}>
              {p.skryta ? <EyeOff /> : <Eye />}
            </button>
          )}
          {onOdstranit && (
            <button type="button" className="vw-ikona vw-nebezpecne" title="Odstrániť" aria-label="Odstrániť" onClick={() => onOdstranit(i)}><Trash2 /></button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Obrázok ───────────────────────── */

/** Adresa obrázka vzhľadu pre náhľad v administrácii. */
export function adresaNahladu(o: Obrazok | null | undefined, r: Rozriesene, velkost: 'thumbnail' | 'small' | 'medium' | 'original' = 'small'): string | null {
  if (!o) return null;
  if ('id' in o) {
    const s = r.subory[String(o.id)];
    if (!s) return null;
    const u = velkost === 'original' ? s.url : (s.formats?.[velkost]?.url ?? s.url);
    return u.startsWith('http') ? u : STRAPI_URL + u;
  }
  if (!o.cesta.startsWith('/uploads/')) return o.cesta;
  return STRAPI_URL + (velkost === 'original' ? o.cesta : variant(o.cesta, velkost));
}

export const adresaSuboru = (f: MediaFile) => fileUrl(f, 'small');

export function ObrazokPolozky({ obrazok, rozriesene, popis, onVymenit, bezObrazka }: {
  obrazok: Obrazok | null; rozriesene: Rozriesene; popis: string; onVymenit: () => void; bezObrazka?: string;
}) {
  const u = adresaNahladu(obrazok, rozriesene, 'thumbnail');
  const chyba = obrazok && 'id' in obrazok && !rozriesene.subory[String(obrazok.id)];
  return (
    <div className="vw-pole">
      <span className="vw-pole-nazov">{popis}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {u ? <img className="vw-mini" src={u} alt="" style={{ width: 72, height: 48 }} /> : <span className="vw-mini" style={{ width: 72, height: 48 }} />}
        <div style={{ fontSize: 12.5, color: 'var(--ad-secondary)', flex: 1 }}>
          {chyba ? <span style={{ color: 'var(--ad-danger)' }}>súbor v knižnici chýba</span>
            : obrazok ? ('id' in obrazok ? `súbor č. ${obrazok.id}` : obrazok.cesta) : (bezObrazka ?? 'bez obrázka')}
          {obrazok?.pozicia ? <> · výrez {obrazok.pozicia}</> : null}
        </div>
        <button type="button" className="abtn" onClick={onVymenit} data-vw-vymenit-obrazok>Vymeniť</button>
      </div>
    </div>
  );
}
