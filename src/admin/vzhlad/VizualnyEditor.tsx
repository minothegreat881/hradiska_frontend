'use client';

/**
 * VIZUÁLNY EDITOR VZHĽADU — horná lišta, plátno so skutočným webom, pravý panel.
 *
 *   späť · stránka (Domovská · Kategória ▾ · Hlavička a päta) · stav · vrátiť/zopakovať ·
 *   SK · EN · DE · Počítač/Mobil · Prispôsobiť/100 % · panel · Uložiť koncept · Zverejniť · ⋯
 *
 * Klávesy (v administrácii aj v okne plátna): šípky menia výber, Alt+šípky
 * presúvajú, Delete odstráni (s potvrdením), Enter upraví text, Esc zruší
 * výber, Ctrl+Z / Ctrl+Y, Ctrl+S uloží koncept.
 *
 * Telefón a tablet (≤ 1023 px, `lib/mobil.ts`): pravý panel je spodný list
 * (`SpodnyList`), na telefóne je predvolený náhľad Mobil a plátno siaha po
 * okraje obrazovky. Rozvrh lišty rieši `vzhlad-editor.css`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Undo2, Redo2, Monitor, Smartphone, PanelRightClose, PanelRightOpen, MoreHorizontal, Loader2,
  History as HistoryIcon, ExternalLink, RotateCcw, ListTree, X, Eye,
} from 'lucide-react';
import type { Jazyk, Vzhlad } from '../../lib/vzhlad/typy';
import type { CanvasZoom } from '../editor/platno/CanvasFrame';
import { useKoncept, type Stranka } from './stav/KonceptKontext';
import { useEditorUI } from './ui';
import { useAkciePrvkov } from './akcie';
import { Platno, type Zariadenie } from './Platno';
import { najdiPrvok, viditelnePrvky, posunOJedno, type AkciaVrstvy, type UpozornenieNaPlatne } from './Vrstva';
import { opisPrvku, type KontextPrvku } from './prvky';
import { PravyPanel, type UpozorneniePanela } from './PravyPanel';
import { miestoZCesty, nazovStranky } from './cesty';
import { pocetVyhrad, vsetkyTexty, stavPrekladu, jeVyhrada } from './stav/preklady';
import { zmenyVzhladu } from '../../lib/vzhlad/zmeny';
import { indexZaznamu, vycistiNeplatne } from './stav/operacie';
import { zaznamNovejKategorie } from '../../lib/vzhlad/prevod';
import { prekladZoSlovnika } from '../../lib/jazyk';
import { jeTelefon, useSirkaAdministracie } from '../lib/mobil';
import { SpodnyList, type StavListu } from './SpodnyList';

export function VizualnyEditor({ stranka, naStranku, spat, otvorFormular, odrolovat }: {
  stranka: Stranka;
  naStranku: (s: Stranka, vyber?: string | null) => void;
  spat: () => void;
  otvorFormular: () => void;
  /** Žiadosť zvonka (formulár, „Ukázať"): odroluj na prvok, keď sa nakreslí. */
  odrolovat: { nazov: string; id: number } | null;
}) {
  const k = useKoncept();
  const ui = useEditorUI();
  const a = useAkciePrvkov();
  const [jazyk, setJazyk] = useState<Jazyk>('sk');
  /* Na telefóne sa plátno predvolene kreslí ako mobil — tak, ako stránku uvidí návštevník s telefónom. */
  const [zariadenie, setZariadenie] = useState<Zariadenie>(() => (jeTelefon() ? 'mobil' : 'pocitac'));
  const { uzke, telefon } = useSirkaAdministracie();
  const [list, setList] = useState<StavListu>('zbalene');
  /* Pri písaní priamo v stránke list ustúpi, aby bolo vidieť text aj klávesnicu. */
  const onPise = useCallback((pise: boolean) => { if (pise) setList('zbalene'); }, []);
  const menuRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<CanvasZoom>('fit');
  const [panel, setPanel] = useState(true);
  const [menu, setMenu] = useState(false);
  /* Dotyk nemá „odchod myši" — ponuka ⋯ sa na úzkej obrazovke zavrie aj klepnutím mimo nej. */
  useEffect(() => {
    if (!menu || !uzke) return;
    const mimo = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('pointerdown', mimo, true);
    return () => document.removeEventListener('pointerdown', mimo, true);
  }, [menu, uzke]);
  const [pisatTeraz, setPisatTeraz] = useState(0);
  const [doc, setDoc] = useState<Document | null>(null);
  const docRef = useRef<Document | null>(null);
  docRef.current = doc;

  const nahlad = k.nahladVerzie;
  const lenNaCitanie = !!nahlad;
  const vzhlad: Vzhlad | null = nahlad ? nahlad.obsah : k.koncept;
  const rozriesene = nahlad ? { subory: nahlad.subory, kategorie: { ...k.rozriesene.kategorie, ...nahlad.kategorie }, clanky: nahlad.clanky } : k.rozriesene;

  const kontext = useMemo<Omit<KontextPrvku, 'el'> | null>(
    () => (vzhlad ? { v: vzhlad, r: rozriesene, j: jazyk, db: k.kategorieDb, stranka } : null),
    [vzhlad, rozriesene, jazyk, k.kategorieDb, stranka],
  );

  /* Opis vybraného prvku (s prvkom v okne plátna — `data-vw-dokument`). */
  const opisVyberu = kontext && k.vyber ? opisPrvku(k.vyber, { ...kontext, el: doc ? najdiPrvok(doc, k.vyber) : null }) : null;

  /* Odrolovanie na vybraný prvok, keď ho vybral niekto iný než klik (formulár, „Ukázať"). */
  const odrolujNa = useCallback((nazov: string) => {
    let pokusov = 0;
    const skus = () => {
      const d = docRef.current;
      const el = d ? najdiPrvok(d, nazov) : null;
      const ramec = d?.defaultView?.frameElement as HTMLIFrameElement | null;
      if (!el || !ramec) { if (pokusov++ < 30) window.setTimeout(skus, 150); return; }
      const vnutri = el.getBoundingClientRect();
      const vonku = ramec.getBoundingClientRect();
      const mierka = vonku.width / (ramec.offsetWidth || vonku.width);
      const stred = window.scrollY + vonku.top + (vnutri.top + vnutri.height / 2) * mierka - window.innerHeight / 2;
      window.scrollTo({ top: Math.max(0, stred), behavior: 'smooth' });
    };
    skus();
  }, []);
  useEffect(() => { if (odrolovat) odrolujNa(odrolovat.nazov); }, [odrolovat, odrolujNa]);

  /* ── Akcie z vrstvy ── */
  const onAkcia = useCallback((x: AkciaVrstvy) => {
    switch (x.druh) {
      case 'obrazok': void a.zmenObrazok(x.opis); break;
      case 'odstranit': void a.odstran(x.opis); break;
      case 'pridat': void a.pridaj(x.opis); break;
      case 'pripnut': void a.pripni(x.opis); break;
      case 'clanok': ui.upravitClanok(x.dokument); break;
      case 'kategoria': naStranku({ druh: 'kategoria', slug: x.slug }); break;
      case 'text': void a.zmenText(x.opis, x.text, x.jazyk, x.hodnota); break;
      default: break;
    }
  }, [a, ui, naStranku]);

  /* ── Klávesy ── */
  const klaves = useRef<(e: KeyboardEvent) => void>(() => {});
  klaves.current = (e: KeyboardEvent) => {
    if (document.querySelector('.ad-modal-wrap')) return;
    const t = e.target as HTMLElement | null;
    const pise = !!t?.closest?.('input, textarea, select, [contenteditable="true"], [contenteditable="plaintext-only"]');
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 's') { e.preventDefault(); if (!lenNaCitanie) void k.ulozit(); return; }
    if (pise) return;
    if (ctrl && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); if (!lenNaCitanie) k.vratit(); return; }
    if (ctrl && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); if (!lenNaCitanie) k.zopakovat(); return; }
    if (e.key === 'Escape') { k.nastavVyber(null); return; }
    const d = docRef.current;
    if (!d || !kontext) return;
    const sipka = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key);
    if (sipka && e.altKey && opisVyberu && !lenNaCitanie) {
      e.preventDefault();
      const dopredu = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const o = opisVyberu;
      if (!o.zoznam) return;
      k.zmen(`presun: ${o.stitok}`, (v) => { posunOJedno(o, dopredu ? 1 : -1, kontext, v); });
      const c = o.nazov.split(':');
      const z = o.zoznam;
      const n = z.index + (dopredu ? 1 : -1);
      if (c[0] === 'dlazdica' && kontext) {
        const sk = kontext.v.domov.dlazdice.skupiny;
        const si = sk.findIndex((s) => s.id === c[1]);
        if (!dopredu && z.index === 0 && si > 0) k.nastavVyber(`dlazdica:${sk[si - 1].id}:${c[2]}`);
        if (dopredu && z.index === z.dlzka - 1 && si < sk.length - 1) k.nastavVyber(`dlazdica:${sk[si + 1].id}:${c[2]}`);
      } else if ((['popularne', 'kronika'].includes(c[0]) || (c[0] === 'pridajte-sa' && c[1] === 'prosba')) && n >= 0 && n < z.dlzka) {
        k.nastavVyber([...c.slice(0, -1), String(n)].join(':'));
      } else if (c[0] === 'pata' && c[1] === 'odkaz' && n >= 0 && n < z.dlzka) k.nastavVyber(`pata:odkaz:${c[2]}:${n}`);
      return;
    }
    if (sipka) {
      e.preventDefault();
      const prvky = viditelnePrvky(d);
      const i = k.vyber ? prvky.findIndex((el) => el.getAttribute('data-vw') === k.vyber) : -1;
      const dalej = e.key === 'ArrowRight' || e.key === 'ArrowDown';
      const ciel = prvky[i < 0 ? 0 : Math.max(0, Math.min(prvky.length - 1, i + (dalej ? 1 : -1)))];
      const n = ciel?.getAttribute('data-vw');
      if (n) { k.nastavVyber(n); odrolujNa(n); }
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && opisVyberu?.odstranit && !lenNaCitanie) { e.preventDefault(); void a.odstran(opisVyberu); return; }
    if (e.key === 'Enter' && opisVyberu?.texty.length && !lenNaCitanie) { e.preventDefault(); setPisatTeraz((n) => n + 1); }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => klaves.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);
  const onKlaves = useCallback((e: KeyboardEvent) => klaves.current(e), []);

  /* ── Upozornenia ── */
  const { naPlatne, vPaneli } = useMemo(() => {
    const naPlatne = new Map<string, UpozornenieNaPlatne[]>();
    const vPaneli: UpozorneniePanela[] = [];
    if (!vzhlad || lenNaCitanie) return { naPlatne, vPaneli };
    const tu = (s: Stranka) => s.druh === stranka.druh && (s.druh !== 'kategoria' || (stranka.druh === 'kategoria' && s.slug === stranka.slug));
    const chybyTu = k.chybyKlienta.map((c) => ({ c, m: miestoZCesty(c.cesta, vzhlad, rozriesene) })).filter((x) => x.m && tu(x.m.stranka));
    for (const { m } of chybyTu) {
      const n = (doc && m!.nazov && najdiPrvok(doc, m!.nazov)) ? m!.nazov! : m!.obal ?? m!.nazov;
      if (!n) continue;
      const zoz = naPlatne.get(n) ?? [];
      if (!zoz.length) zoz.push({ farba: 'cervena', text: 'neplatný údaj' });
      naPlatne.set(n, zoz);
    }
    if (k.chybyKlienta.length) {
      const neexistuje = k.chybyKlienta.some((c) => /neexistuje|nie je zverejnený|chýba v poradí/.test(c.sprava));
      vPaneli.push({
        farba: 'cervene',
        text: <><b>Kontrola: {k.chybyKlienta.length} {k.chybyKlienta.length === 1 ? 'chyba' : k.chybyKlienta.length < 5 ? 'chyby' : 'chýb'}.</b> {k.chybyKlienta[0].sprava}{chybyTu.length ? '' : ' (na inej stránke)'}</>,
        akcia: neexistuje
          ? { popis: 'Odstrániť neplatné odkazy', vykonaj: () => k.zmen('odstránenie neplatných odkazov', (w) => vycistiNeplatne(w, { kategorie: new Set(k.kategorieDb.map((x) => x.documentId)), clanky: new Set(Object.entries(k.rozriesene.clanky).filter(([, x]) => !!x?.sk).map(([dk]) => dk)), subory: new Set(Object.keys(k.rozriesene.subory).map(Number)) })) }
          : (() => { const m = miestoZCesty(k.chybyKlienta[0].cesta, vzhlad, rozriesene); return m ? { popis: 'Ukázať', vykonaj: () => naStranku(m.stranka, m.nazov ?? m.obal) } : undefined; })(),
      });
    }
    if (jazyk !== 'sk') {
      const n = pocetVyhrad(vzhlad, jazyk);
      if (n) {
        const prvy = vsetkyTexty(vzhlad).find((t) => jeVyhrada(stavPrekladu(t.text, jazyk, t.volitelny)));
        const m = prvy ? miestoZCesty(prvy.cesta, vzhlad, rozriesene) : null;
        vPaneli.push({ farba: 'zlte', text: <>{jazyk.toUpperCase()}: {n} {n === 1 ? 'text bez prekladu alebo so starým prekladom' : 'textov bez prekladu alebo so starým prekladom'} (žltá bodka na plátne).</>, akcia: m ? { popis: 'Ukázať prvý', vykonaj: () => naStranku(m.stranka, m.nazov ?? m.obal) } : undefined });
      }
    }
    const bezZaznamu = k.kategorieDb.filter((d) => indexZaznamu(vzhlad, { dokument: d.documentId, slug: d.slug }, rozriesene) < 0);
    for (const d of bezZaznamu) {
      vPaneli.push({
        farba: 'modre', text: <>Kategória <b>{d.name}</b> je v databáze, ale nemá záznam vo vzhľade (bez vzhľadu).</>,
        akcia: { popis: 'Pridať', vykonaj: () => k.zmen(`záznam vzhľadu ${d.name}`, (w) => { if (indexZaznamu(w, { dokument: d.documentId, slug: d.slug }, k.rozriesene) < 0) w.kategorie.push(zaznamNovejKategorie(d, prekladZoSlovnika) as never); }) },
      });
    }
    if (k.prevzate.length && stranka.druh === 'domov') vPaneli.push({ farba: 'sive', text: <>Pri načítaní sa z databázy prevzalo: {k.prevzate.join(', ')}. Uložte koncept, aby sa to zapísalo.</> });
    return { naPlatne, vPaneli };
  }, [vzhlad, lenNaCitanie, k, rozriesene, stranka, jazyk, doc, naStranku]);

  if (!vzhlad || !kontext) return null;

  const zmien = zmenyVzhladu(k.server?.zverejnene ?? null, k.koncept, k.rozriesene).length;
  const stav = k.neulozene ? { t: 'Neuložené zmeny', c: 'je-neulozene' }
    : !k.server?.zverejnene || zmien ? { t: k.server?.zverejnene ? `Koncept sa líši od webu (${zmien} ${zmien === 1 ? 'zmena' : zmien < 5 ? 'zmeny' : 'zmien'})` : 'Koncept — na webe je zatiaľ vzhľad z kódu', c: 'je-koncept' }
    : { t: 'Zverejnené — koncept je rovnaký ako web', c: '' };
  const bodka = (j: 'en' | 'de') => pocetVyhrad(vzhlad, j) > 0;
  const kategoriaVyber = stranka.druh === 'kategoria' ? stranka.slug : '';

  return (
    <div data-vw-editor className={uzke ? `vw-uzke vw-list-${list}` : undefined}>
      {/* Dva riadky: hore stav a vydanie, dole stránka a zobrazenie plátna. */}
      <div className="ad-editor-head vw-hlava vw-m-hlava">
        <button className="abtn abtn-icon vw-m-spat" onClick={spat} title="Späť" aria-label="Späť"><ArrowLeft className="w-4 h-4" /></button>
        <div className="ad-head-title">
          <div className="ad-head-line"><span className="ad-title"><span className="adm-m-skry">Vzhľad webu · </span>{nazovStranky(stranka, k.kategorieDb)}</span></div>
          <div className={`vw-stav ${stav.c}`} data-vw-stav>
            {k.pracuje ? <><Loader2 className="w-3 h-3 animate-spin" /> {k.pracuje}</> : <><span className="vw-stav-bodka" /> {stav.t}</>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="abtn" onClick={() => void k.ulozit()} disabled={!!k.pracuje || lenNaCitanie || !k.neulozene} data-vw-ulozit title="Uloží koncept (Ctrl+S) — web sa nezmení">{telefon ? 'Uložiť' : 'Uložiť koncept'}</button>
        <button className="abtn abtn-primary" onClick={() => void k.pripravZverejnenie()} disabled={!!k.pracuje || lenNaCitanie} data-vw-zverejnit>Zverejniť</button>
        <div className="vw-menu-wrap" ref={menuRef}>
          <button className="abtn abtn-icon" onClick={() => setMenu((x) => !x)} aria-label="Ďalšie" title="Ďalšie" data-vw-menu><MoreHorizontal className="w-4 h-4" /></button>
          {menu && (
            <div className="vw-menu" onMouseLeave={() => setMenu(false)}>
              <button onClick={() => { setMenu(false); k.otvorDialog({ druh: 'historia' }); }} data-vw-menu-historia><HistoryIcon className="w-4 h-4" /> <span>História<small>zverejnené verzie, pozretie, obnovenie</small></span></button>
              <button onClick={() => { setMenu(false); window.open(stranka.druh === 'kategoria' ? `/category/${stranka.slug}?nahlad=vzhlad` : '/?nahlad=vzhlad', '_blank', 'noopener'); }} data-vw-menu-nahlad>
                <ExternalLink className="w-4 h-4" /> <span>Náhľad v novom okne<small>{k.neulozene ? 'ukáže uložený koncept — najprv uložte' : 'web s uloženým konceptom (len pre vás)'}</small></span>
              </button>
              <button onClick={() => { setMenu(false); otvorFormular(); }} data-vw-menu-formular><ListTree className="w-4 h-4" /> <span>Klasická úprava<small>formulár nad tým istým konceptom</small></span></button>
              <button className="vw-nebezpecne" onClick={() => { setMenu(false); k.otvorDialog({ druh: 'zahodit' }); }} data-vw-menu-zahodit><RotateCcw className="w-4 h-4" /> <span>Zahodiť koncept<small>vráti ho na zverejnený stav</small></span></button>
            </div>
          )}
        </div>
      </div>
      <div className="vw-nastroje">
        <div className="ad-seg vw-stranky" role="group" aria-label="Stránka">
          <button className={stranka.druh === 'domov' ? 'is-on' : ''} onClick={() => naStranku({ druh: 'domov' })} data-vw-stranka="domov">Domovská</button>
          <button className={stranka.druh === 'kategoria' ? 'is-on' : ''} style={{ padding: '0 6px' }} title="Stránka kategórie">
            <select value={kategoriaVyber} onChange={(e) => { if (e.target.value) naStranku({ druh: 'kategoria', slug: e.target.value }); }} data-vw-stranka="kategoria" aria-label="Stránka kategórie">
              <option value="">Kategória ▾</option>
              {k.kategorieDb.map((x) => <option key={x.documentId} value={x.slug}>{x.name}</option>)}
            </select>
          </button>
          <button className={stranka.druh === 'menu' ? 'is-on' : ''} onClick={() => naStranku({ druh: 'menu' })} data-vw-stranka="menu">Hlavička a päta</button>
        </div>
        <div style={{ flex: 1 }} />
        <div className="ad-seg" role="group" aria-label="História zmien">
          <button onClick={k.vratit} disabled={!k.mozeVratit || lenNaCitanie} aria-label="Vrátiť zmenu" title={k.popisVratit ? `Vrátiť: ${k.popisVratit} (Ctrl+Z)` : 'Nie je čo vrátiť'} data-vw-vratit><Undo2 className="w-4 h-4" /></button>
          <button onClick={k.zopakovat} disabled={!k.mozeZopakovat || lenNaCitanie} aria-label="Zopakovať zmenu" title={k.popisZopakovat ? `Znovu: ${k.popisZopakovat} (Ctrl+Y)` : 'Nie je čo zopakovať'} data-vw-zopakovat><Redo2 className="w-4 h-4" /></button>
        </div>
        <div className="ad-seg vw-jazyky" role="group" aria-label="Jazyk plátna">
          {(['sk', 'en', 'de'] as const).map((j) => (
            <button key={j} className={jazyk === j ? 'is-on' : ''} onClick={() => setJazyk(j)} data-vw-jazyk={j}
                    title={j !== 'sk' && bodka(j) ? `${j.toUpperCase()}: niektoré texty nemajú preklad alebo majú starý` : `Plátno v jazyku ${j.toUpperCase()}`}>
              {j.toUpperCase()}{j !== 'sk' && bodka(j) && <span className="vw-jazyk-bodka" />}
            </button>
          ))}
        </div>
        <div className="ad-seg" role="group" aria-label="Zariadenie a zväčšenie">
          <button className={zariadenie === 'pocitac' ? 'is-on' : ''} onClick={() => setZariadenie('pocitac')} aria-label="Počítač" title="Počítač (1440 px)" data-vw-zariadenie="pocitac"><Monitor className="w-4 h-4" /></button>
          <button className={zariadenie === 'mobil' ? 'is-on' : ''} onClick={() => setZariadenie('mobil')} aria-label="Mobil" title="Mobil (390 px)" data-vw-zariadenie="mobil"><Smartphone className="w-4 h-4" /></button>
          <button className={`vw-m-zoom${zoom === 'fit' ? ' is-on' : ''}`} onClick={() => setZoom('fit')} title="Prispôsobiť šírke" data-vw-zoom="fit">Prispôsobiť</button>
          <button className={`vw-m-zoom${zoom === 'full' ? ' is-on' : ''}`} onClick={() => setZoom('full')} title="Skutočná veľkosť" data-vw-zoom="full">100 %</button>
        </div>
        <button className="abtn abtn-icon vw-m-panel" onClick={() => setPanel((x) => !x)} aria-label={panel ? 'Skryť panel' : 'Zobraziť panel'} title={panel ? 'Skryť pravý panel' : 'Zobraziť pravý panel'}>
          {panel ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {k.sprava && (
        <div className={`acard vw-sprava je-${k.sprava.ton}`} role="status" data-vw-sprava>
          <span>{k.sprava.text}</span>
          <button className="abtn abtn-icon" onClick={() => k.nastavSpravu(null)} aria-label="Zavrieť správu"><X className="w-4 h-4" /></button>
        </div>
      )}
      {nahlad && (
        <div className="vw-citanie" data-vw-citanie>
          <Eye className="w-4 h-4" />
          <span style={{ flex: 1 }}>Verzia {nahlad.verzia} zo dňa {nahlad.zverejnene ? new Date(nahlad.zverejnene).toLocaleString('sk-SK') : '—'} ({nahlad.zverejnil ?? '—'}{nahlad.poznamka ? ` · ${nahlad.poznamka}` : ''}) — len na čítanie.</span>
          <button className="abtn" onClick={() => void k.obnovitVerziu(nahlad.verzia)} data-vw-obnovit-z-nahladu>Obnoviť do konceptu</button>
          <button className="abtn" onClick={() => k.nastavNahladVerzie(null)}>Zavrieť</button>
        </div>
      )}

      <div className="vw-telo">
        <div className="vw-platno-stlpec">
          <Platno
            stranka={stranka}
            jazyk={jazyk}
            zariadenie={zariadenie}
            zoom={zoom}
            vzhlad={vzhlad}
            rozriesene={rozriesene}
            kategorieDb={k.kategorieDb}
            vyber={k.vyber}
            onVyber={k.nastavVyber}
            lenNaCitanie={lenNaCitanie}
            onZmena={k.zmen}
            onAkcia={onAkcia}
            onKlaves={onKlaves}
            upozornenia={naPlatne}
            pisatTeraz={pisatTeraz}
            onDokument={setDoc}
            onPise={uzke ? onPise : undefined}
          />
        </div>
        {uzke ? (
          <SpodnyList stav={list} onStav={setList}>
            <PravyPanel stranka={stranka} opis={lenNaCitanie ? null : opisVyberu} jazyk={jazyk} onJazyk={setJazyk}
                        onZrusVyber={() => k.nastavVyber(null)} upozornenia={vPaneli} lenNaCitanie={lenNaCitanie} />
          </SpodnyList>
        ) : panel && (
          <PravyPanel stranka={stranka} opis={lenNaCitanie ? null : opisVyberu} jazyk={jazyk} onJazyk={setJazyk}
                      onZrusVyber={() => k.nastavVyber(null)} upozornenia={vPaneli} lenNaCitanie={lenNaCitanie} />
        )}
      </div>
    </div>
  );
}

export default VizualnyEditor;
