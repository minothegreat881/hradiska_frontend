'use client';

/**
 * MAPA HRADÍSK — nová mapa podľa dizajnového handoffu „Terénny atlas".
 * Žije LEN v laboratóriu; produkčná `Slovakia3DReliefMap.tsx` (Three.js) sa
 * nedotýka, aby sa dali postaviť vedľa seba.
 *
 * ČO NAHRÁDZA: 3D reliéf v Three.js — samostatný balík 851 kB, orbit kamera,
 * body ako 3D sprity. Tu je reliéf hotový raster (dlaždice z tvojej pipeline
 * `relief-mapa-sk`), takže z balíka vypadne celý Three.js a zostane MapLibre,
 * ktorý na stránke aj tak už je (mini-mapa v pobočnom stĺpci článku).
 *
 * ODCHÝLKY OD HANDOFFU a prečo:
 *   • KATEGÓRIE ROZLIŠUJE IKONA, NIE FARBA — tak to chce handoff a tak to
 *     zostáva. Naše kategórie sú ale iné (šesť, nie sedem generických), takže
 *     ikony z handoffu sú na ne namapované; farby (dnešná mapa má šesť) sú
 *     zatiaľ preč, všetko je v atramente.
 *   • PÍSMA: handoff žiada Archivo Expanded + IBM Plex Mono z Google Fonts.
 *     Web CDN nepoužíva a má self-hostované Fraunces + Inter, tak nesie
 *     displej Fraunces, rozhranie Inter a technické popisky systémový mono.
 *   • AKCENT: handoff má #8A5A64, šat Pečať má pečatnú červenú. Zjednotené
 *     na šat — dve takmer rovnaké farby vedľa seba vyzerajú ako chyba.
 *   • Rozvrh handoffu je pevný 1720 × 1000 a mobil vôbec nerieši; ľavý panel
 *     sa preto pod 900 px mení na hlavičku nad mapou a legenda ide pod ňu.
 *
 * DÁTA: `search-index` — tie isté články so súradnicami, aké kreslí dnešná
 * mapa (107 v hraniciach SR). Žiadny nový endpoint.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SK_OUTLINE, SK_OUTLINE_BOX, SK_OUTLINE_RANGE } from './skOutline';

/* Výrez RENDERU — musí sedieť s BOUNDS_4326 v build_relief.py. Na tento
   výrez sa mapa otvára. */
const BOUNDS: [[number, number], [number, number]] = [[16.79, 47.70], [22.60, 49.65]];
/* Skutočný rozsah KRAJINY (z `sk_boundary.geojson`). Mapa dosadá na tento,
   nie na výrez renderu — ten má okolo krajiny rezervu, takže dosadnutie naň
   nechávalo nad Slovenskom a pod ním pás navyše. Pomer 2,011 : 1 sedí
   s pomerom plátna. */
const SK: [[number, number], [number, number]] = [[16.8332, 47.7314], [22.5657, 49.6138]];
/* Výrez POHYBU. Reliéf končí na štátnej hranici, ale štrnásť lokalít leží za
   ňou (Mikulčice, Pohansko, Zalavár, Visegrád, Gars-Thunau, Arkona…). Tie sa
   kreslia ako body na papieri mimo krajiny — preto sa mapa dá odtiahnuť až
   po strednú Európu. Kartágo (36,8° N) je jediné, čo sem nepadne; je to
   článok o rímskych pamiatkach v Afrike, nie o hradisku. */
const ROAM: [[number, number], [number, number]] = [[11.5, 45.0], [24.5, 55.6]];
const MIN_Z = 4.4;
const MAX_Z = 12;
/** Od tohto priblíženia dostane bod menovku (handoff: 2,4× z rozsahu 1–10×). */
const PILL_ZOOM = 9.6;
/** Približná výška karty (fotka 130 + telo). Podľa nej sa rozhoduje, na ktorú
    stranu bodu sa karta otvorí, aby ju plátno neorezalo. Musí byť na úrovni
    súboru — číta ju `PinNode`, ktorý stojí mimo tela komponentu. */
const CARD_H = 300;
/** Polomer zhlukovania v obrazovkových bodoch (handoff: 38 px). */
const CLUSTER_PX = 38;

/* Ikony z handoffu, namapované na naše kategórie. Sedem generických tvarov
   handoffu (hradisko, hrad, kláštor, jaskyňa, mohylník, kaštieľ, bojisko)
   pokrýva našich šesť bez dokresľovania. */
const CATS: { slug: string; label: string; icon: string }[] = [
  { slug: 'kniezacie-sidla', label: 'Kniežacie sídla', icon: 'M7 20V6h2v2h2V6h2v2h2V6h2v14M10 20v-4h4v4' },
  { slug: 'mocenske-centra', label: 'Mocenské centrá', icon: 'M4 20V10l8-5 8 5v10M10 20v-5h4v5' },
  { slug: 'strazna-funkcia', label: 'Strážna a hospodárska funkcia', icon: 'M3 19h18M6 19l2-7h8l2 7M10 12V8m4 4V8' },
  { slug: 'refugia', label: 'Refúgiá', icon: 'M4 19v-5a8 8 0 0 1 16 0v5M9 19v-3a3 3 0 0 1 6 0v3' },
  { slug: 'staroveke-sidla', label: 'Staroveké sídla', icon: 'M3 19h18M6 19a6 6 0 0 1 12 0' },
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne a sakrálne objekty', icon: 'M12 4v16M8 8h8M7 20h10' },
];
const CAT_BY_SLUG = Object.fromEntries(CATS.map(c => [c.slug, c]));

interface Loc {
  id: string;
  name: string;
  slug: string;
  cat: string;
  lat: number;
  lng: number;
  excerpt: string;
  cover: string | null;
}

/** Bod alebo zhluk v obrazovkových súradniciach. */
type Node =
  | { kind: 'one'; x: number; y: number; loc: Loc }
  | { kind: 'many'; x: number; y: number; members: Loc[] };

/** Kľúč uzla — bod má id článku, zhluk zoznam svojich členov. */
const keyOf = (n: Node) => n.kind === 'one' ? n.loc.id : 'c-' + n.members.map(m => m.id).join('|');
/** Dosah trafenia v bodoch: bod má 30 px, jadro zhluku rastie s počtom. */
const hitR = (n: Node) => n.kind === 'one' ? 19 : (30 + Math.min(n.members.length, 14) * 1.1) / 2 + 6;

const Icon = ({ path, size = 13, w = 2.2 }: { path: string; size?: number; w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
);

/** Mercator y v stupňoch — tá istá projekcia, v akej je obrys navigátora. */
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2)) * 180 / Math.PI;

const deg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

/** Základ Strapi — vo vývoji priamo 1337, v produkcii cez proxy `/strapi`. */
const strapiBase = () =>
  import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi')
    : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

/**
 * Jeden bod. Vlastný komponent so `memo` zámerne: pri stovke bodov (najviac
 * priblížený pohľad) sa inak pri každom prejdení myšou prekresľovali všetky
 * naraz — a to bolo to sekanie. Takto sa prekreslia len tie dva, ktorým sa
 * stav naozaj zmenil.
 */
const PinNode = memo(function PinNode({
  n, hot, openCard, showPill, canvasW, canvasH, onEnter, onLeave, onToggle,
}: {
  n: Extract<Node, { kind: 'one' }>;
  hot: boolean; openCard: boolean; showPill: boolean;
  canvasW: number; canvasH: number;
  onEnter: (id: string, cat: string) => void;
  onLeave: () => void;
  onToggle: (id: string) => void;
}) {
  return (
      <div className="lmap-node"
           /* Uzol s otvorenou kartou musí ísť nad ostatné. `transform`
              na uzle vytvára vlastný kontext vrstiev, takže z-index
              karty vnútri sa voči susedným bodom neuplatní — rozhoduje
              z-index uzla. Doteraz stúpal len po kliknutí, takže cez
              kartu otvorenú prejdením presvitali okolité body. */
           style={{ transform: `translate3d(${n.x}px, ${n.y}px, 0)`, zIndex: openCard ? 30 : 3 }}>
      <div className="lmap-pin-wrap">
        <button
          type="button"
          className={(openCard || hot) ? 'lmap-pin is-hot' : 'lmap-pin'}
          /* Klik ostáva kvôli dotyku — na telefóne `hover` neexistuje. */
          onClick={() => onToggle(n.loc.id)}
          onMouseEnter={() => onEnter(n.loc.id, n.loc.cat)}
          onMouseLeave={onLeave}
          onFocus={() => onEnter(n.loc.id, n.loc.cat)}
          onBlur={onLeave}
          aria-label={n.loc.name}
        >
          <span className="lmap-pin-spec" aria-hidden="true" />
          <Icon path={(CAT_BY_SLUG[n.loc.cat] || CATS[0]).icon} />
        </button>

        {showPill && !openCard && (
          <span className="lmap-pill">
            <span className="lmap-pill-n">{n.loc.name}</span>
            <span className="lmap-pill-c">{(CAT_BY_SLUG[n.loc.cat] || CATS[0]).label}</span>
          </span>
        )}

        {openCard && (
          /* Karta sa otvara nad bodom. Pri bodoch pri hornej hrane by ju
             platno orezalo (a nad platnom je hlavicka stranky), tak sa
             preklopi pod bod; pri okrajoch sa posunie dovnutra. */
          <div
            className={'lmap-card'
              /* Nad bodom karta potrebuje CARD_H + odstup. Ked sa tam
                 nezmesti a dole je viac miesta, preklopi sa pod bod —
                 inak by ju platno (`overflow: hidden`) orezalo. Prah
                 bol predtym 200 px, teda menej, nez je karta vysoka. */
              + (n.y < CARD_H + 48 && (canvasH - n.y) > n.y ? ' is-below' : '')
              + (n.x < 140 ? ' is-right' : n.x > canvasW - 140 ? ' is-left' : '')}
            onClick={e => e.stopPropagation()}
            onMouseEnter={() => onEnter(n.loc.id, n.loc.cat)}
            onMouseLeave={onLeave}
          >
            <div className="lmap-card-in">
              <div className="lmap-card-photo">
                {/* Skutocny <img>, nie pozadie: pozadie sa da prebit
                    skratkou `background` v kaskade a chybu nie je ako
                    zachytit. Takto sa da aj lazy-loadovat. */}
                {n.loc.cover && (
                  <img
                    className="lmap-card-img"
                    src={`${strapiBase()}${n.loc.cover}`}
                    alt=""
                    loading="eager"
                    decoding="async"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="lmap-card-veil" aria-hidden="true" />
                <span className="lmap-card-cat">
                  <Icon path={(CAT_BY_SLUG[n.loc.cat] || CATS[0]).icon} size={11} w={2.4} />
                  {(CAT_BY_SLUG[n.loc.cat] || CATS[0]).label}
                </span>
                <button type="button" className="lmap-card-x" onClick={() => setSelected(null)} aria-label="Zavrieť">×</button>
              </div>
              <div className="lmap-card-body">
                <span className="lmap-card-name">{n.loc.name}</span>
                <span className="lmap-card-coords">{deg(n.loc.lat, 'N', 'S')} · {deg(n.loc.lng, 'E', 'W')}</span>
                {n.loc.excerpt && <p className="lmap-card-desc">{n.loc.excerpt}</p>}
                <a className="lmap-card-cta" href={`/blog/${n.loc.slug}`}>
                  Čítať článok <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
            <span className="lmap-card-arrow" aria-hidden="true" />
          </div>
        )}
      </div>
      </div>
  );
});

export function LabMapa() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const wheelCleanup = useRef<(() => void) | null>(null);
  /* Uzly a stav tahania pre trafenie bodu — handlery na plátne su zavesene
     raz a citaju z refov, nie zo zavretej premennej. */
  const nodesRef = useRef<Node[]>([]);
  const draggingRef = useRef(false);
  /** Mapa je v pohybe — vrátane vlastnej animácie po kliknutí na zhluk. */
  const movingRef = useRef(false);
  /** Posledná poloha kurzora, aby sa po dosadnutí dala vyhodnotiť znova. */
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  /** Otvorený bod — číta ho dopočítavanie, ktoré beží mimo vykreslenia. */
  const hoverIdRef = useRef<string | null>(null);
  const moveCleanup = useRef<(() => void) | null>(null);
  const openHoverRef = useRef<((id: string, cat: string) => void) | null>(null);
  const closeHoverRef = useRef<(() => void) | null>(null);
  const clusterRef = useRef<((n: Extract<Node, { kind: 'many' }>) => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(MIN_Z);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** Rozbalený vejár: body na (takmer) rovnakom mieste, ktoré zoom neoddelí. */
  const [spider, setSpider] = useState<{ ids: string[]; x: number; y: number } | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  /** Uzol pod kurzorom (id bodu alebo kľúč zhluku) — nahrádza `:hover`,
      lebo body samy myš už nezachytávajú. */
  const [hotKey, setHotKey] = useState<string | null>(null);
  /** Kategória bodu pod kurzorom — zvýrazní sa v legende, nech je jasné,
      čo je čo. Ikona sama o sebe to na malej ploche nepovie. */
  const [hoverCat, setHoverCat] = useState<string | null>(null);
  /** Bod, nad ktorým je kurzor — karta sa otvára prejdením, nie klikom.
      Zatvára sa s krátkym odkladom, aby sa dalo prejsť z bodu do karty
      (medzi nimi je medzera a bez odkladu by karta zmizla pod rukou). */
  const [hoverId, setHoverId] = useState<string | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 48.67, lng: 19.70 });
  /** Obdĺžnik aktuálneho pohľadu v súradniciach navigátora (0–100 %). */
  const [view, setView] = useState({ l: 0, t: 0, w: 100, h: 100 });

  /* ── Dáta ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const STRAPI = strapiBase();
    const inCats = new Set(CATS.map(c => c.slug));
    fetch(`${STRAPI}/api/search-index`)
      .then(r => r.json())
      .then(j => {
        const out: Loc[] = (j.items || [])
          .filter((x: any) => x.hasLocation && typeof x.lat === 'number' && typeof x.lng === 'number'
            && inCats.has(x.categorySlug)
            && x.lng >= ROAM[0][0] && x.lng <= ROAM[1][0]
            && x.lat >= ROAM[0][1] && x.lat <= ROAM[1][1])
          .map((x: any) => ({
            id: x.slug, name: x.place || x.title, slug: x.slug, cat: x.categorySlug,
            lat: x.lat, lng: x.lng, excerpt: x.excerpt || '', cover: x.cover || null,
          }));
        setLocs(out);
      })
      .catch(() => { /* mapa funguje aj bez bodov */ });
  }, []);

  /* ── Mapa ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: hostRef.current,
      style: {
        version: 8,
        sources: {
          relief: {
            type: 'raster',
            // Dlaždice z pipeline `relief-mapa-sk`, prekonvertované do WebP
            // s priehľadným pozadím — papier a bodková mriežka pod nimi
            // presvitajú presne tak, ako to chce handoff.
            tiles: [`${window.location.origin}/mapa/{z}/{x}/{y}.webp`],
            tileSize: 256,
            minzoom: 6,
            maxzoom: 12,
            bounds: [BOUNDS[0][0], BOUNDS[0][1], BOUNDS[1][0], BOUNDS[1][1]],
            attribution: 'Reliéf: Copernicus DEM · Rieky: © prispievatelia OpenStreetMap · Hranica: geoBoundaries',
          },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': 'rgba(0,0,0,0)' } },
          { id: 'relief', type: 'raster', source: 'relief', paint: { 'raster-fade-duration': 120 } },
        ],
      },
      bounds: SK,
      fitBoundsOptions: { padding: 0 },
      minZoom: MIN_Z,
      maxZoom: MAX_Z,
      maxBounds: ROAM,
      attributionControl: false,
      /* Bez `alpha` vycisti MapLibre platno do CIERNEJ — odtial cierne okraje
         okolo krajiny. S nim je platno priehladne a presvita cezen papier,
         bodkova mriezka aj vodoznak „SK", presne ako to chce handoff (a ako
         to potrebuju priehladne dlazdice). */
      canvasContextAttributes: { alpha: true, antialias: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    map.touchZoomRotate.disableRotation();

    /* POHYB MYSOU. Predvolene koliesko priblizuje — lenze v priblizenom
       reliefe je castejsie treba posunut nabok nez zoomovat, a dvoma prstami
       na trackpade je posun prirodzeny pohyb. Koliesko preto POSUVA (aj
       doprava/dolava cez `deltaX` alebo Shift), priblizuje az Ctrl/⌘. */
    map.scrollZoom.disable();
    const el = map.getCanvasContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        map.zoomTo(
          Math.min(MAX_Z, Math.max(MIN_Z, map.getZoom() - e.deltaY * 0.01)),
          { around: map.unproject([e.offsetX, e.offsetY]), duration: 0 }
        );
        return;
      }
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      map.panBy([dx, dy], { duration: 0 }, { originalEvent: e });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    wheelCleanup.current = () => el.removeEventListener('wheel', onWheel);

    /* KTO JE POD KURZOROM sa dopočíta z polôh uzlov, body samy myš
       nezachytávajú. Dovtedy platilo opačné: bod bol tlačidlo, takže mapa
       o stlačení nad ním nevedela a ťahanie začaté na bode neposunulo mapu.
       Pri stovke bodov v priblíženom pohľade sa tak mapa nedala posúvať
       skoro nikde — a presne to bolo na manévrovaní zlé. */
    const at = (cx: number, cy: number): Node | null => {
      const r = el.getBoundingClientRect();
      const x = cx - r.left, y = cy - r.top;
      /* OTVORENÝ BOD MÁ PREDNOSŤ, kým z neho kurzor naozaj neodíde.
         Predtým vyhrával najbližší — a tam, kde sú body nahustené (Hatné,
         Prosné, Dolná Mariková), stačilo pohnúť myšou o pár bodov a karta
         preskočila na suseda. Každý preskok znamená novú kartu s novou
         fotkou, a to je to sekanie. Dosah otvoreného bodu je navyše o osem
         bodov väčší, než aký potreboval na otvorenie. */
      const open = nodesRef.current.find(
        n => n.kind === 'one' && n.loc.id === hoverIdRef.current
      );
      if (open && Math.hypot(open.x - x, open.y - y) < hitR(open) + 8) return open;

      let best: Node | null = null, bestD = Infinity;
      for (const n of nodesRef.current) {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < hitR(n) && d < bestD) { best = n; bestD = d; }
      }
      return best;
    };

    const onMove = (e: MouseEvent) => {
      /* Kým sa mapa hýbe (aj vlastnou animáciou po kliknutí na zhluk), body
         pod kurzorom sa menia každý snímok — a s nimi aj karta, ktorá sa
         otvára a zatvára. To je ten zásek. Počas pohybu sa preto nehľadá
         nič; hneď po dosadnutí sa dopočíta poloha kurzora nanovo. */
      if (draggingRef.current || movingRef.current) return;
      const n = at(e.clientX, e.clientY);
      lastPointer.current = { x: e.clientX, y: e.clientY };
      if (!n) { setHotKey(null); closeHoverRef.current?.(); el.style.cursor = ''; return; }
      lastPointer.current = { x: e.clientX, y: e.clientY };
      el.style.cursor = n.kind === 'one' ? 'pointer' : 'zoom-in';
      setHotKey(keyOf(n));
      if (n.kind === 'one') openHoverRef.current?.(n.loc.id, n.loc.cat);
      else closeHoverRef.current?.();
    };
    const onLeave = () => { setHotKey(null); closeHoverRef.current?.(); };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    moveCleanup.current = () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };

    map.on('dragstart', () => { draggingRef.current = true; });
    map.on('dragend', () => { draggingRef.current = false; });
    map.on('movestart', () => { movingRef.current = true; });
    map.on('moveend', () => {
      movingRef.current = false;
      /* Po dosadnutí sa kurzor nehýbe, ale svet pod ním áno — inak by bod
         pod kurzorom ostal nezvýraznený, kým človek nehne myšou. */
      if (lastPointer.current) onMove(new MouseEvent('mousemove', {
        clientX: lastPointer.current.x, clientY: lastPointer.current.y,
      }));
    });

    /* Klik: bod otvorí kartu (a na dotyku je to jediná cesta), zhluk priblíži,
       prázdna mapa zavrie. */
    map.on('click', (ev) => {
      const n = at(ev.originalEvent.clientX, ev.originalEvent.clientY);
      if (!n) { setSelected(null); setSpider(null); setHoverId(null); return; }
      if (n.kind === 'one') setSelected(prev => (prev === n.loc.id ? null : n.loc.id));
      else clusterRef.current?.(n);
    });

    map.on('load', () => { setReady(true); });
    mapRef.current = map;
    return () => { wheelCleanup.current?.(); moveCleanup.current?.(); map.remove(); mapRef.current = null; };
  }, []);

  /* ── Zhlukovanie ──────────────────────────────────────────────────────
     Prepočítava sa pri každom pohybe mapy, v OBRAZOVKOVÝCH súradniciach —
     zhluky sa tým rozpadajú priblížením samy, bez druhého zdroja pravdy.
     Postup je z handoffu: bod ide do prvej skupiny, ktorej ťažisko je bližšie
     než prah; ťažisko sa priebežne aktualizuje. */
  const recompute = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    setZoom(map.getZoom());
    const c = map.getCenter();
    setCenter({ lat: c.lat, lng: c.lng });

    /* Navigátor: kam sa pozerám v rámci Slovenska. Rovnaká projekcia ako
       obrys, takže stačí lineárny prepočet rozsahu. */
    const b = map.getBounds();
    const R = SK_OUTLINE_RANGE;
    const fx = (lng: number) => ((lng - R.x0) / (R.x1 - R.x0)) * 100;
    const fy = (lat: number) => ((R.y1 - mercY(lat)) / (R.y1 - R.y0)) * 100;
    const l = fx(b.getWest()), r = fx(b.getEast());
    const t = fy(b.getNorth()), bo = fy(b.getSouth());
    setView({
      l: Math.max(-40, l), t: Math.max(-40, t),
      w: Math.min(180, r - l), h: Math.min(180, bo - t),
    });

    const skip = new Set(spider ? spider.ids : []);
    const pts = locs
      .filter(l => !skip.has(l.id))
      .map(l => {
        const p = map.project([l.lng, l.lat]);
        return { loc: l, x: p.x, y: p.y };
      });

    const groups: { x: number; y: number; members: typeof pts }[] = [];
    for (const p of pts) {
      const g = groups.find(g => Math.hypot(g.x - p.x, g.y - p.y) < CLUSTER_PX);
      if (g) {
        g.members.push(p);
        g.x = g.members.reduce((s, m) => s + m.x, 0) / g.members.length;
        g.y = g.members.reduce((s, m) => s + m.y, 0) / g.members.length;
      } else {
        groups.push({ x: p.x, y: p.y, members: [p] });
      }
    }

    const { width, height } = map.getCanvas().getBoundingClientRect();
    const out: Node[] = [];
    for (const g of groups) {
      if (g.x < -60 || g.y < -60 || g.x > width + 60 || g.y > height + 60) continue;
      if (g.members.length === 1) out.push({ kind: 'one', x: g.members[0].x, y: g.members[0].y, loc: g.members[0].loc });
      else out.push({ kind: 'many', x: g.x, y: g.y, members: g.members.map(m => m.loc) });
    }
    setNodes(out);
  }, [locs, spider]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    /* MapLibre vysiela `move` niekolkokrat za snimok. Bez tohto sa pri kazdom
       z nich prepocital cely zhluk a prekreslili vsetky body — posuvanie sa
       tym menilo na zapas. Takto sa prepocita najviac raz za snimok. */
    let raf = 0;
    const onMove = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; recompute(); });
    };
    recompute();
    map.on('move', onMove);
    map.on('resize', onMove);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      map.off('move', onMove);
      map.off('resize', onMove);
    };
  }, [ready, recompute]);

  /* Pohyb mapy zatvára kartu aj vejár — inak by viseli nad prázdnym miestom. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const clear = () => { setSelected(null); setSpider(null); setHoverId(null); };
    map.on('dragstart', clear);
    map.on('zoomstart', clear);
    return () => { map.off('dragstart', clear); map.off('zoomstart', clear); };
  }, [ready]);

  const zoomBy = (f: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: Math.min(MAX_Z, Math.max(MIN_Z, map.getZoom() + f)), duration: 260 });
  };
  const reset = () => mapRef.current?.fitBounds(SK, { padding: 0, duration: 420 });

  /** Posun o tretinu obrazovky — šípky sú presnejšie než ťahanie prstom. */
  const pan = (dx: number, dy: number) => {
    const map = mapRef.current;
    if (!map) return;
    const { width, height } = map.getCanvas().getBoundingClientRect();
    map.panBy([dx * width * 0.34, dy * height * 0.34], { duration: 280 });
  };

  /** Klik do navigátora prenesie pohľad na to miesto. */
  const jump = (e: React.MouseEvent<HTMLDivElement>) => {
    const map = mapRef.current;
    if (!map) return;
    const r = e.currentTarget.getBoundingClientRect();
    const R = SK_OUTLINE_RANGE;
    const lng = R.x0 + ((e.clientX - r.left) / r.width) * (R.x1 - R.x0);
    const my = R.y1 - ((e.clientY - r.top) / r.height) * (R.y1 - R.y0);
    const lat = (2 * Math.atan(Math.exp(my * Math.PI / 180)) - Math.PI / 2) * 180 / Math.PI;
    map.easeTo({ center: [lng, lat], duration: 420 });
  };

  /** Klik na zhluk: priblížiť. Keď ani najväčšie priblíženie body neoddelí
      (sedia prakticky na sebe), rozbalí sa vejár — inak by sa doň nedalo
      kliknúť nikdy. */
  const openCluster = (n: Extract<Node, { kind: 'many' }>) => {
    const map = mapRef.current;
    if (!map) return;
    // Najvacsi odstup clenov v obrazovkovych bodoch pri SUCASNOM priblizeni;
    // pri kazdom dalsom stupni sa zdvojnasobi. Ked ani na maxime nebudu od
    // seba aspon 46 px, zoom ich neoddeli a otvara sa vejar.
    const pts = n.members.map(m => map.project([m.lng, m.lat]));
    let spreadPx = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        spreadPx = Math.max(spreadPx, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
    const pxAtMax = spreadPx * Math.pow(2, MAX_Z - map.getZoom());
    if (pxAtMax < 46) {
      setSpider({ ids: n.members.map(m => m.id), x: n.x, y: n.y });
      return;
    }
    map.easeTo({
      center: [
        n.members.reduce((s, m) => s + m.lng, 0) / n.members.length,
        n.members.reduce((s, m) => s + m.lat, 0) / n.members.length,
      ],
      zoom: Math.min(MAX_Z, map.getZoom() + 1.6),
      duration: 420,
    });
  };

  /* Lokality za hranicou. Reliéf tam nie je, body áno — nech je o nich vedieť
     aj vtedy, keď sa mapa otvorí na Slovensku a sú mimo obrazovky. */
  const outside = useMemo(
    () => locs.filter(l => l.lng < BOUNDS[0][0] || l.lng > BOUNDS[1][0]
      || l.lat < BOUNDS[0][1] || l.lat > BOUNDS[1][1]).length,
    [locs]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of locs) c[l.cat] = (c[l.cat] || 0) + 1;
    return c;
  }, [locs]);

  const spiderNodes: Node[] = useMemo(() => {
    if (!spider) return [];
    const members = locs.filter(l => spider.ids.includes(l.id));
    const r = 58 + members.length * 4;
    return members.map((loc, i) => {
      const a = (i / members.length) * Math.PI * 2 - Math.PI / 2;
      return { kind: 'one' as const, x: spider.x + Math.cos(a) * r, y: spider.y + Math.sin(a) * r, loc };
    });
  }, [spider, locs]);

  const canvasBox = mapRef.current?.getCanvas().getBoundingClientRect();
  const canvasW = canvasBox?.width ?? 1200;
  const canvasH = canvasBox?.height ?? 700;

  /** Klik mimo bodu, karty a ovládania = zavrieť. */
  const closeOnOutside = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest?.('.lmap-pin, .lmap-card, .lmap-cluster, .lmap-spider-x, .lmap-zoom')) return;
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setSelected(null);
    setSpider(null);
    setHoverId(null);
    setHoverCat(null);
  };

  /* Stála totožnosť obsluh — bez nej by `memo` na bode nemalo zmysel a body
     by sa prekresľovali všetky, ako predtým. */
  const openHover = useCallback((id: string, cat: string) => {
    if (hoverTimer.current) { window.clearTimeout(hoverTimer.current); hoverTimer.current = null; }
    setHoverId(id); setHoverCat(cat);
  }, []);
  const closeHoverSoon = useCallback(() => {
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      setHoverId(null); setHoverCat(null); hoverTimer.current = null;
    }, 160);
  }, []);
  const toggleSelected = useCallback((id: string) => {
    setSelected(prev => (prev === id ? null : id));
  }, []);
  useEffect(() => () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); }, []);

  /* Handlery na plátne su zavesene raz pri vzniku mapy, tak citaju funkcie
     cez refy — inak by drzali prvu verziu so starymi datami. */
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { hoverIdRef.current = hoverId; }, [hoverId]);
  useEffect(() => { openHoverRef.current = openHover; closeHoverRef.current = closeHoverSoon; });
  useEffect(() => { clusterRef.current = openCluster; });

  const showPills = zoom >= PILL_ZOOM;
  /* Kliknutý bod má prednosť pred tým pod kurzorom — inak by zvýraznenie
     odskočilo hneď, ako sa myš pohne preč. */
  const activeCat = hoverCat ?? (selected ? locs.find(l => l.id === selected)?.cat ?? null : null);
  const all = [...nodes, ...spiderNodes];
  /* Body rozbaleneho vejara sa daju trafit rovnako ako ostatne. */
  useEffect(() => { nodesRef.current = [...nodes, ...spiderNodes]; }, [nodes, spiderNodes]);

  return (
    <section className="lmap">
      {/* ── Ľavý panel ─────────────────────────────────────────────────── */}
      <div className="lmap-side">
        <div className="lmap-head">
          <div className="lmap-eyebrow"><span /> Terénny atlas · 02</div>
          <h2 className="lmap-title">Hradiská</h2>
          <div className="lmap-sub">Slovenska</div>
          <p className="lmap-lead">
            Interaktívna mapa lokalít. Skrolovaním približujete, ťahaním posúvate —
            zhluky sa priblížením rozpadnú na jednotlivé body. Prejdením po bode
            otvoríte kartu lokality, klikom do mapy ju zavriete.
          </p>
          {outside > 0 && (
            <button type="button" className="lmap-outside" onClick={() => mapRef.current?.fitBounds(ROAM, { padding: 40, duration: 600 })}>
              <span>{outside}</span> lokalít leží za hranicami — ukázať
            </button>
          )}
        </div>

        <div className={legendOpen ? 'lmap-legend is-open' : 'lmap-legend'}>
          <button type="button" className="lmap-legend-h" onClick={() => setLegendOpen(v => !v)}>
            Kategórie lokalít <span aria-hidden="true">{legendOpen ? '–' : '+'}</span>
          </button>
          <div className="lmap-legend-body">
            {CATS.map(c => (
              <div className={activeCat === c.slug ? 'lmap-legend-row is-active' : 'lmap-legend-row'} key={c.slug}>
                <span className="lmap-glass"><Icon path={c.icon} size={13} w={2} /></span>
                <span className="lmap-legend-name">{c.label}</span>
                <span className="lmap-legend-n">{String(counts[c.slug] || 0).padStart(2, '0')}</span>
              </div>
            ))}
            <div className="lmap-legend-row lmap-legend-cluster">
              <span className="lmap-glass lmap-glass-n">9</span>
              <span className="lmap-legend-name">Zhluk — kliknutím priblížite</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Plátno ─────────────────────────────────────────────────────── */}
      {/* Zatvorenie karty klikom KAMKOĽVEK mimo bodu. Nestačí `map.on('click')`:
          MapLibre ohlási klik len z vlastného plátna, takže klik do mriežky,
          vodoznaku či HUD-u by kartu nechal otvorenú a jedinou cestou von by
          ostal krížik. Toto beží na úrovni DOM v zachytávacej fáze, takže
          zabera vsade — okrem samotného bodu, karty a ovládania. */}
      <div className="lmap-canvas" onClickCapture={closeOnOutside}>
        <div className="lmap-grid" aria-hidden="true" />
        <div className="lmap-watermark" aria-hidden="true">SK</div>

        <div ref={hostRef} className="lmap-gl" />

        {/* Body a zhluky — v obrazovkových súradniciach nad plátnom mapy. */}
        <div className="lmap-overlay">
          {spider && (
            <>
              {spiderNodes.map(n => (
                <span
                  key={'line-' + n.loc.id}
                  className="lmap-spider-line"
                  style={{
                    width: Math.hypot(n.x - spider.x, n.y - spider.y),
                    transform: `translate3d(${spider.x}px, ${spider.y}px, 0) rotate(${Math.atan2(n.y - spider.y, n.x - spider.x)}rad)`,
                  }}
                />
              ))}
              <button type="button" className="lmap-spider-x" style={{ transform: `translate3d(${spider.x}px, ${spider.y}px, 0) translate(-50%, -50%)` }}
                      onClick={() => setSpider(null)} aria-label="Zavrieť vejár">×</button>
            </>
          )}

          {all.map(n => n.kind === 'many' ? (
            <div key={'c-' + n.members.map(m => m.id).join('|')} className="lmap-node"
                 style={{ transform: `translate3d(${n.x}px, ${n.y}px, 0)` }}>
            <button
              type="button"
              className={hotKey === 'c-' + n.members.map(m => m.id).join('|') ? 'lmap-cluster is-hot' : 'lmap-cluster'}
              style={{ ['--core' as any]: `${30 + Math.min(n.members.length, 14) * 1.1}px` }}
              /* Zhluk zachytava mys kvoli `:hover`. Aby sa z neho dala mapa
                 aj tahat, stlacenie sa preposle platnu mapy. */
              onMouseDown={e => {
                mapRef.current?.getCanvas().dispatchEvent(new MouseEvent('mousedown', {
                  clientX: e.clientX, clientY: e.clientY, bubbles: true, cancelable: true, button: 0, buttons: 1,
                }));
              }}
              onClick={() => openCluster(n)}
              aria-label={`Zhluk ${n.members.length} lokalít — priblížiť`}
            >
              {/* Obežné bodky (jedna = jedna lokalita) z handoffu sú preč —
                  pri desiatkach bodov robili z mapy čierne machule a počet
                  v jadre povie to isté zrozumiteľnejšie. */}
              <span className="lmap-cluster-halo" aria-hidden="true" />
              <span className="lmap-cluster-core">{n.members.length}</span>
            </button>
            </div>
          ) : (
            <PinNode
              key={n.loc.id}
              n={n}
              hot={hotKey === n.loc.id}
              openCard={selected === n.loc.id || hoverId === n.loc.id}
              showPill={showPills && !spider}
              canvasW={canvasW}
              canvasH={canvasH}
              onEnter={openHover}
              onLeave={closeHoverSoon}
              onToggle={toggleSelected}
            />
          ))}
        </div>

        {/* HUD — technické popisky, nezachytávajú kliknutia. */}
        <div className="lmap-hud lmap-hud-tl" aria-hidden="true">
          <span>{deg(center.lat, 'N', 'S')}</span><span className="lmap-plus">+</span><span>{deg(center.lng, 'E', 'W')}</span>
        </div>
        <div className="lmap-hud lmap-hud-tr" aria-hidden="true">
          <span>Reliéf · Copernicus DEM 30 m</span><span className="lmap-sq" />
        </div>
        <div className="lmap-hud lmap-hud-bl" aria-hidden="true">
          <span className="lmap-count">{String(locs.length).padStart(2, '0')}</span>
          <span className="lmap-count-l">Zmapované<br />lokality</span>
        </div>

        <div className="lmap-zoom">
          {/* Navigátor — kde v rámci Slovenska práve som. Klik prenesie pohľad,
              krížik posúva o tretinu obrazovky. Bez toho sa v priblíženom
              reliéfe bez popisov nedá zorientovať. */}
          <div className="lmap-locator" onClick={jump} title="Kliknutím presuniete pohľad">
            <svg viewBox={`0 0 ${SK_OUTLINE_BOX.w} ${SK_OUTLINE_BOX.h}`} aria-hidden="true">
              <path d={SK_OUTLINE} />
            </svg>
            <span
              className="lmap-locator-view"
              style={{ left: `${view.l}%`, top: `${view.t}%`, width: `${view.w}%`, height: `${view.h}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="lmap-pad">
            <button type="button" className="lmap-pad-u" onClick={() => pan(0, -1)} aria-label="Posunúť hore">▲</button>
            <button type="button" className="lmap-pad-l" onClick={() => pan(-1, 0)} aria-label="Posunúť vľavo">◀</button>
            <button type="button" className="lmap-pad-c" onClick={reset} aria-label="Celé Slovensko">✛</button>
            <button type="button" className="lmap-pad-r" onClick={() => pan(1, 0)} aria-label="Posunúť vpravo">▶</button>
            <button type="button" className="lmap-pad-d" onClick={() => pan(0, 1)} aria-label="Posunúť dole">▼</button>
          </div>

          <div className="lmap-zoom-box">
            <button type="button" onClick={() => zoomBy(1)} aria-label="Priblížiť">+</button>
            <button type="button" onClick={() => zoomBy(-1)} aria-label="Oddialiť">−</button>
            <button type="button" onClick={reset} aria-label="Celé Slovensko" className="lmap-zoom-reset">1:1</button>
          </div>
          <span className="lmap-zoom-v">zoom {(zoom).toFixed(1)}</span>
        </div>

        <div className="lmap-attrib">
          Reliéf: Copernicus DEM · Rieky: © prispievatelia OpenStreetMap · Hranica: geoBoundaries
        </div>
      </div>
    </section>
  );
}

export default LabMapa;
