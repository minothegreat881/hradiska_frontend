'use client';

/**
 * MAPA HRADÍSK — reliéfna mapa lokalít podľa dizajnu „Terénny atlas".
 * Vznikla v laboratóriu, po odsúhlasení nahradila 3D mapu na domovskej.
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

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../styles/mapa.css';
import { SK_OUTLINE, SK_OUTLINE_BOX, SK_OUTLINE_RANGE } from './mapaObrys';
import { MESTA, MAPA_MESTA_ZOOM } from './mapaMesta';
import { HRANICA_SK } from './mapaHranica';

/* Výrez RENDERU — musí sedieť s BOUNDS_4326 v build_relief.py. Na tento
   výrez sa mapa otvára. */
const BOUNDS: [[number, number], [number, number]] = [[16.79, 47.70], [22.60, 49.65]];
/* Skutočný rozsah KRAJINY (z `sk_boundary.geojson`). Mapa dosadá na tento,
   nie na výrez renderu — ten má okolo krajiny rezervu, takže dosadnutie naň
   nechávalo nad Slovenskom a pod ním pás navyše. Pomer 2,011 : 1 sedí
   s pomerom plátna. */
const SK: [[number, number], [number, number]] = [[16.8332, 47.7314], [22.5657, 49.6138]];
/**
 * Dotykové zariadenie. Rozhoduje IBA o správaní na dotyku; na počítači sa
 * vďaka nemu nemení nič.
 *
 * Testuje sa `pointer: coarse` AJ `hover: none`. Samotné `hover: none`
 * nestačí — časť Androidov hlási `hover: hover`, hoci myš nemajú, a na
 * takom telefóne by celá dotyková vetva ostala vypnutá (mapa by sa neotvorila
 * na celú obrazovku a nefungovalo by nič z toho, čo je pre prst).
 */
const isTouch = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse), (hover: none)').matches ||
    /* Ďalšia poistka: úzke okno je na tomto webe vždy telefón. */
    window.matchMedia('(max-width: 900px)').matches);
/** Pomer strán krajiny v Mercatore — podľa neho sa na telefóne dopočítava,
    o koľko treba pridať, aby krajina plátno vyplnila. */
const COUNTRY_ASPECT = 2.0113;
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
/* `x`,`y` su obrazovkove suradnice pre prve vykreslenie, `lng`,`lat`
   zemepisne — podla nich sa poloha dopocitava v KAZDOM snimku mapy, aby
   znacka pri priblizovani nezaostavala za platnom. */
type Node =
  | { kind: 'one'; x: number; y: number; lng?: number; lat?: number; loc: Loc }
  | { kind: 'many'; x: number; y: number; lng?: number; lat?: number; members: Loc[] };

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
/** Vnútro karty lokality. Kreslí sa na dvoch miestach — nad bodom (počítač)
    a ako spodný pás na celej obrazovke (telefón) — preto stojí samostatne. */
function CardIn({ loc, onClose }: { loc: Loc; onClose: () => void }) {
  return (
  <div className="lmap-card-in">
    <div className="lmap-card-photo">
      {/* Skutocny <img>, nie pozadie: pozadie sa da prebit
          skratkou `background` v kaskade a chybu nie je ako
          zachytit. Takto sa da aj lazy-loadovat. */}
      {loc.cover && (
        <img
          className="lmap-card-img"
          src={`${strapiBase()}${loc.cover}`}
          alt=""
          loading="eager"
          decoding="async"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <span className="lmap-card-veil" aria-hidden="true" />
      <span className="lmap-card-cat">
        <Icon path={(CAT_BY_SLUG[loc.cat] || CATS[0]).icon} size={11} w={2.4} />
        {(CAT_BY_SLUG[loc.cat] || CATS[0]).label}
      </span>
      <button type="button" className="lmap-card-x" onClick={onClose} aria-label="Zavrieť">×</button>
    </div>
    <div className="lmap-card-body">
      <span className="lmap-card-name">{loc.name}</span>
      <span className="lmap-card-coords">{deg(loc.lat, 'N', 'S')} · {deg(loc.lng, 'E', 'W')}</span>
      {loc.excerpt && <p className="lmap-card-desc">{loc.excerpt}</p>}
      <a className="lmap-card-cta" href={`/blog/${loc.slug}`}>
        Čítať článok <span aria-hidden="true">→</span>
      </a>
    </div>
  </div>
  );
}

const PinNode = memo(function PinNode({
  n, hot, openCard, sheet, showPill, canvasW, canvasH, onEnter, onLeave, onToggle, onClose,
}: {
  n: Extract<Node, { kind: 'one' }>;
  hot: boolean; openCard: boolean; sheet: boolean; showPill: boolean;
  canvasW: number; canvasH: number;
  onEnter: (id: string, cat: string) => void;
  onLeave: () => void;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
      <div className="lmap-node pointer-events-none"
           data-lng={n.lng} data-lat={n.lat}
           /* Uzol s otvorenou kartou musí ísť nad ostatné. `transform`
              na uzle vytvára vlastný kontext vrstiev, takže z-index
              karty vnútri sa voči susedným bodom neuplatní — rozhoduje
              z-index uzla. Doteraz stúpal len po kliknutí, takže cez
              kartu otvorenú prejdením presvitali okolité body. */
           style={{ transform: `translate3d(${n.x}px, ${n.y}px, 0)`, zIndex: openCard ? 30 : 3 }}>
      <div className="lmap-pin-wrap pointer-events-none">
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
          <span className="lmap-pill pointer-events-none">
            <span className="lmap-pill-n">{n.loc.name}</span>
            <span className="lmap-pill-c">{(CAT_BY_SLUG[n.loc.cat] || CATS[0]).label}</span>
          </span>
        )}

        {openCard && !sheet && (
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
            <CardIn loc={n.loc} onClose={onClose} />
            <span className="lmap-card-arrow" aria-hidden="true" />
          </div>
        )}
      </div>
      </div>
  );
});

export function MapaHradisk() {
  const rootRef = useRef<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  /* Uzly a stav tahania pre trafenie bodu — handlery na plátne su zavesene
     raz a citaju z refov, nie zo zavretej premennej. */
  const nodesRef = useRef<Node[]>([]);
  const draggingRef = useRef(false);
  /** Mapa je v pohybe — vrátane vlastnej animácie po kliknutí na zhluk. */
  const movingRef = useRef(false);
  /** Posledná poloha kurzora, aby sa po dosadnutí dala vyhodnotiť znova. */
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const settleCleanup = useRef<(() => void) | null>(null);
  const resizeCleanup = useRef<(() => void) | null>(null);
  const touchCleanup = useRef<(() => void) | null>(null);
  const fitRef = useRef<((d?: number) => void) | null>(null);
  /* `fitCountry` sa vytvára raz, ale musí vedieť, či je mapa na celej
     obrazovke — cez ref, nech si nezoberie starú hodnotu. */
  const fullRef = useRef(false);
  /** Otvorený bod — číta ho dopočítavanie, ktoré beží mimo vykreslenia. */
  const hoverIdRef = useRef<string | null>(null);
  const moveCleanup = useRef<(() => void) | null>(null);
  const openHoverRef = useRef<((id: string, cat: string) => void) | null>(null);
  const closeHoverRef = useRef<(() => void) | null>(null);
  const clusterRef = useRef<((n: Extract<Node, { kind: 'many' }>) => void) | null>(null);
  const [ready, setReady] = useState(false);
  /* Názvy miest v obrazovkových súradniciach — reliéf sám nemá popisy, takže
     bez nich sa v ňom nedá zorientovať. */
  const [mesta, setMesta] = useState<{ id: number; n: string; x: number; y: number; lng: number; lat: number; r: number }[]>([]);
  /* Podklad: kresba reliéfu alebo satelitná snímka. */
  const [podklad, setPodklad] = useState<'relief' | 'satelit'>('relief');
  const [zoom, setZoom] = useState(MIN_Z);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** Rozbalený vejár: body na (takmer) rovnakom mieste, ktoré zoom neoddelí. */
  const [spider, setSpider] = useState<{ ids: string[]; x: number; y: number } | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  /** Mapa na celú obrazovku — len na dotyku. Vložená mapa uprostred stránky
      sa nikdy neovláda pohodlne: buď berie prst stránke, alebo ho musí pustiť
      a potom sa v nej nedá hýbať. Na celej obrazovke odpadá oboje. */
  const [full, setFull] = useState(false);
  /* Či je to dotykové zariadenie, sa rozhoduje TU a nikde inde. Doteraz to
     hovoril aj kód, aj medzidotaz v CSS — a keď sa nezhodli (Android, ktorý
     tvrdí, že má myš), prekrytie sa nevykreslilo, hoci kód s dotykom rátal. */
  const [touch] = useState(isTouch);
  /* DOČASNÁ DIAGNOSTIKA. Zapína sa `?debug=1` v adrese a vypíše priamo na
     mapu, čo sa pri ťuknutí naozaj deje — bez konzoly sa to z telefónu inak
     zistiť nedá. Až sa príčina nájde, ide to preč. */
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
          /* Satelitná snímka ako druhý podklad. Reliéf ukáže tvar terénu —
             prečo hradisko stojí práve tam — ale nepovie, čo je na tom
             mieste dnes. Snímka to doplní; prepína sa medzi nimi. */
          satelit: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            maxzoom: 18,
            attribution: 'Satelitné snímky: Esri, Maxar, Earthstar Geographics',
          },
          /* Štátna hranica. Na reliéfe ju povie sama kresba — dlaždice končia
             na hranici — ale na snímke nie je vidieť, kde krajina končí. */
          hranica: { type: 'geojson', data: HRANICA_SK },
        },
        layers: [
          { id: 'bg', type: 'background', paint: { 'background-color': 'rgba(0,0,0,0)' } },
          { id: 'relief', type: 'raster', source: 'relief', paint: { 'raster-fade-duration': 120 } },
          { id: 'satelit', type: 'raster', source: 'satelit', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 120 } },
          /* Dve čiary na sebe: tmavá spodná drží čitateľnosť nad svetlými
             poľami, svetlá vrchná nad lesmi. Jedna by sa vždy niekde
             stratila. */
          {
            id: 'hranica-tien', type: 'line', source: 'hranica',
            layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': 'rgba(0,0,0,.55)', 'line-width': 3.4, 'line-blur': 1.2 },
          },
          {
            id: 'hranica', type: 'line', source: 'hranica',
            layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': 'rgba(255,255,255,.92)', 'line-width': 1.3, 'line-dasharray': [4, 2.4] },
          },
        ],
      },
      bounds: SK,
      fitBoundsOptions: { padding: 0 },
      minZoom: MIN_Z,
      maxZoom: MAX_Z,
      maxBounds: ROAM,
      attributionControl: false,
      /* Režim dvoch prstov (`cooperativeGestures`) je PREČ. Bol to on, čo
         držal jednoprstové posúvanie zamknuté: MapLibre pri ňom prvý prst
         zahodí a čaká na druhý. Na celej obrazovke sa mapa má správať ako
         v mapách, ktoré ľudia poznajú — prst posúva, štipnutie približuje.
         Náhľad na stránke rieši priehľadný štít nad plátnom (nižšie), nie
         okliešťovanie mapy; vypínať a zapínať ovládače sa neosvedčilo. */
      /* Bez `alpha` vycisti MapLibre platno do CIERNEJ — odtial cierne okraje
         okolo krajiny. S nim je platno priehladne a presvita cezen papier,
         bodkova mriezka aj vodoznak „SK", presne ako to chce handoff (a ako
         to potrebuju priehladne dlazdice). */
      /* MapLibre pomenúva plátno po anglicky („Map"), hoci stránka je
         slovenská. Čítačka to ohlási v cudzom jazyku uprostred slovenského
         dokumentu. */
      locale: { 'Map.Title': 'Mapa hradísk' },
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
    /* KOLIESKO PRIBLIŽUJE — tak, ako to človek od mapy čaká.
       Chvíľu tu bolo naopak (koliesko posúvalo, priblíženie chcelo Ctrl),
       čo bola zbytočná zvláštnosť. Posúvanie má ťahanie myšou. */
    const el = map.getCanvasContainer();

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
    /* Karta leží MIMO plátna (je vo vrstve s bodmi), takže presun kurzora
       z bodu na kartu znamená pre plátno „odchod myši" — a karta sa zavrela
       skôr, než sa dalo kliknúť na „Čítať článok". Odchod NA KARTU sa preto
       za odchod nepočíta. */
    const onLeave = (e: MouseEvent) => {
      const kam = e.relatedTarget as Element | null;
      if (kam && typeof kam.closest === 'function' && kam.closest('.lmap-card, .lmap-sheet')) return;
      setHotKey(null);
      closeHoverRef.current?.();
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    moveCleanup.current = () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };

    map.on('dragstart', () => { draggingRef.current = true; });
    map.on('dragend', () => { draggingRef.current = false; });
    /* Po dosadnutí sa kurzor nehýbe, ale svet pod ním áno — bod pod ním treba
       vyhodnotiť znova. NIE HNEĎ: `map.stop()` pred každou novou animáciou
       ohlási `moveend`, takže sa medzi dvoma pohybmi kamery na okamih otvorila
       karta a hneď zmizla. Práve to blikanie bolo vidieť pri klikaní do
       zhlukov. Vyhodnotenie sa preto odloží a nový pohyb ho zruší. */
    let settle = 0;
    map.on('movestart', () => {
      movingRef.current = true;
      if (settle) { window.clearTimeout(settle); settle = 0; }
    });
    map.on('moveend', () => {
      movingRef.current = false;
      if (settle) window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        settle = 0;
        if (movingRef.current || !lastPointer.current) return;
        onMove(new MouseEvent('mousemove', {
          clientX: lastPointer.current.x, clientY: lastPointer.current.y,
        }));
      }, 90);
    });
    settleCleanup.current = () => { if (settle) window.clearTimeout(settle); };

    /* Klik: bod otvorí kartu (a na dotyku je to jediná cesta), prázdna mapa
       zavrie.

       ZHLUK SEM NEPATRÍ, hoci to tak dlho bolo. Zhluk je skutočné tlačidlo
       (kvôli `:hover`) a jeho stlačenie preposielam plátnu, aby sa dala mapa
       ťahať aj z neho — lenže MapLibre z toho spraví vlastný klik. Priblíženie
       sa preto spúšťalo DVAKRÁT na jedno kliknutie: dve animácie naraz, každá
       z iného priblíženia. To bol ten zásek pri hlbšom klikaní do zhlukov
       a aj dôvod, prečo „1:1" vyzeralo, že nič nerobí — jeho animáciu tie
       dve prepísali. */
    map.on('click', (ev) => {
      const n = at(ev.originalEvent.clientX, ev.originalEvent.clientY);
      if (!n) { setSelected(null); setSpider(null); setHoverId(null); return; }
      if (n.kind === 'one') { setSelected(prev => (prev === n.loc.id ? null : n.loc.id)); return; }
      /* Na dotyku zhluk prst nezachytáva (viď `mapa.css`), aby sa dala mapa
         ťahať aj cezeň — otvorí ho preto až klik do mapy. Na počítači to má
         na starosti tlačidlo zhluku; keby sa priblížilo aj odtiaľto, bežali
         by dve animácie naraz. */
      if (isTouch()) clusterRef.current?.(n);
    });

    /* Gesto „dvojťuk a potiahnutie = približovanie" je preč. Znelo dobre,
       ale bralo si ťah, ktorý začal do 300 ms po predošlom zdvihnutí prsta —
       teda každý druhý ťah pri posúvaní mapy. Namiesto posunu sa priblížilo
       a mapa pôsobila, že sa do strán hýbať nedá. Priblíženie majú na
       starosti štipnutie dvoma prstami a kroky „+/−".  */

    map.on('load', () => { setReady(true); fitRef.current?.(0); });

    /* Plátno mení rozmer aj bez okna — na telefóne pri skrytí lišty
       prehliadača. MapLibre o tom sám nevie a kreslil by do starých
       rozmerov. */
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(hostRef.current!);
    resizeCleanup.current = () => ro.disconnect();
    mapRef.current = map;
    return () => { moveCleanup.current?.(); settleCleanup.current?.(); resizeCleanup.current?.(); touchCleanup.current?.(); map.remove(); mapRef.current = null; };
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
      if (g.members.length === 1) {
        const m = g.members[0];
        out.push({ kind: 'one', x: m.x, y: m.y, lng: m.loc.lng, lat: m.loc.lat, loc: m.loc });
      } else {
        /* Zhluk drží zemepisný stred svojich členov. Obrazovkové ťažisko by
           sa pri priblížení menilo a zhluk by sa plazil po mape. */
        const lng = g.members.reduce((s, m) => s + m.loc.lng, 0) / g.members.length;
        const lat = g.members.reduce((s, m) => s + m.loc.lat, 0) / g.members.length;
        out.push({ kind: 'many', x: g.x, y: g.y, lng, lat, members: g.members.map(m => m.loc) });
      }
    }
    setNodes(out);

    /* ── Názvy miest ──────────────────────────────────────────────────
       Kreslia sa ako HTML nad plátnom, rovnako ako body. Dôvod: písmo je
       potom to isté, aké nesie zvyšok šatu, a nepotrebujeme k mape dodávať
       osobitné znakové sady (MapLibre by ich na vlastné popisy chcel).

       Poradie je podľa veľkosti mesta a názov sa vykreslí len vtedy, keď
       sa nebije s už vykresleným ani so značkou lokality — tie majú
       prednosť, mapa je predsa o nich. */
    const z = map.getZoom();
    /* Najprv hrubé sito podľa výrezu — premietať vyše dvetisíc obcí pri
       každom posune mapy by bola zbytočná práca; porovnanie dvoch čísel
       je o rád lacnejšie. */
    const w0 = b.getWest(), e0 = b.getEast(), s0 = b.getSouth(), n0 = b.getNorth();
    const kandidati = MESTA
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.x > w0 && m.x < e0 && m.y > s0 && m.y < n0)
      /* Poradové číslo v zozname je jediný spoľahlivý identifikátor popisu.
         Názov ním byť nemôže: dve mestá sa vedia volať rovnako (Komárno na
         oboch brehoch Dunaja), React by ich považoval za jeden a ten istý
         prvok — a staré popisy pri posune mapy nezmizli, len sa hromadili.
         Tak vzniklo pätnásť Komárn roztrúsených po mape. */
      .map(({ m, i }) => { const p = map.project([m.x, m.y]); return { id: i, n: m.n, x: p.x, y: p.y, lng: m.x, lat: m.y, r: m.r }; })
      .filter(m => m.x > 4 && m.y > 4 && m.x < width - 4 && m.y < height - 4)
      .sort((a, b) => a.r - b.r);

    const zabrane: { x: number; y: number; w: number; h: number }[] = out.map(n => ({
      x: n.x - 21, y: n.y - 21, w: 42, h: 42,
    }));
    /* Veľkosť mesta určuje PORADIE, nie zákaz. Keby menšie mestá naskakovali
       až od daného priblíženia, v horách by pri priblížení nezostal na mape
       jediný názov — a práve tam sa človek stratí najviac. Preto: kým ich je
       na obrazovke málo, berie sa aj to menšie. */
    const DOST = 9, NAJVIAC = 34;
    const popisy: typeof kandidati = [];
    for (const m of kandidati) {
      if (popisy.length >= NAJVIAC) break;
      /* Mesto pod svojím priblížením sa pustí len vtedy, keď je mapa
         prázdna — inak by pri pohľade na celú krajinu bola nečitateľná. */
      if (z < (MAPA_MESTA_ZOOM[m.r] ?? 99) && popisy.length >= DOST) continue;
      /* Odhad šírky textu: presné meranie by si vyžiadalo prekreslenie
         každého názvu, a to pri každom posune mapy. Na rozostup stačí. */
      const w = 9 + m.n.length * (m.r === 0 ? 6.6 : 5.6);
      const box = { x: m.x - 4, y: m.y - 8, w, h: 16 };
      const bije = zabrane.some(b =>
        box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y);
      if (bije) continue;
      zabrane.push(box);
      popisy.push(m);
    }
    setMesta(popisy);
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

  /* Každý pohyb kamery najprv zastaví ten predošlý. Bez toho sa animácie
     skladali na seba a posledná vyhrala až po tom, čo predošlé doblikali. */
  const zoomBy = (f: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.easeTo({ zoom: Math.min(MAX_Z, Math.max(MIN_Z, map.getZoom() + f)), duration: 260 });
  };
  /**
   * Dosadnutie na Slovensko.
   *
   * NA POČÍTAČI sa krajina do plátna vmestí — plátno drží jej pomer strán,
   * takže sa presne trafia a nič neostane prázdne.
   *
   * NA TELEFÓNE je plátno vysoké (72 % okna) a krajina široká, takže po
   * vmestení ostane nad ňou a pod ňou mŕtvy pás. Preto sa tam pridá toľko
   * priblíženia, koľko treba na VYPLNENIE plátna; do strán krajina
   * prečnieva a dvoma prstami sa dá posunúť. Počítača sa to netýka.
   */
  const fitCountry = useCallback((duration = 420) => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    const cam = map.cameraForBounds(new maplibregl.LngLatBounds(SK[0], SK[1]), { padding: 0 });
    if (!cam) { map.fitBounds(SK, { padding: 0, duration }); return; }
    /* Vždy sa VMESTIŤ, nikdy nevypĺňať. Vypĺňanie plátna síce odstránilo
       pásy, ale na telefóne pri tom orezalo východ aj západ a ostala len
       stredná časť krajiny. Pásy sa preto riešia inak: plátno je na telefóne
       nižšie (viď `mapa.css`), takže na ne ostane len málo miesta — a to
       málo je papier s mriežkou, teda časť návrhu. */
    let zoom = cam.zoom ?? MIN_Z;
    /* Na celej obrazovke sa naopak VYPĹŇA. Tam je mapa jediné, čo je vidieť,
       takže pásy okolo nej sú len prázdno; radšej krajina prečnieva do strán
       a posúva sa prstom. (V náhľade a na počítači ostáva vmestenie — pásy
       sú tam papier s mriežkou, teda časť návrhu.) */
    if (fullRef.current) {
      const b = map.getCanvas().getBoundingClientRect();
      if (b.width && b.height) zoom += Math.abs(Math.log2((b.width / b.height) / COUNTRY_ASPECT));
    }
    map.easeTo({ center: cam.center, zoom: Math.min(MAX_Z, zoom), duration });
  }, []);
  const reset = () => fitCountry(420);

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
    map.stop();
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
    /* Body vejára stoja na VYMYSLENÝCH miestach — rozostupujú sa do kruhu,
       aby sa dali trafiť. Zemepisnú polohu preto zámerne nedostávajú a
       dopočet v každom snímku sa ich netýka; inak by vejár skolaboval späť
       do jedného bodu. */
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
  useEffect(() => { fitRef.current = fitCountry; }, [fitCountry]);

  /* Kým je mapa cez celú obrazovku, stránka pod ňou sa nesmie posúvať a mapa
     smie brať jeden prst — nie je čo prelistovať. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    fullRef.current = full;
    if (full) {
      document.body.style.overflow = 'hidden';
      /* Otáčanie dvoma prstami len prekáža — mapa má sever hore. Štipnutie
         (dnu = bližšie, von = ďalej) ostáva. */
      map.touchZoomRotate?.disableRotation?.();
      /* Bez tohto sa mapa do strán posúvať NEDÁ. Výrez pohybu je zhruba taký
         široký ako to, čo je pri oddialení vidieť — a keď sa pohľad do
         medzí nezmestí, MapLibre posun jednoducho zamkne. Na celej
         obrazovke preto medze púšťame; návrat zariadi „vyplnenie". */
      map.setMaxBounds(null);
    } else {
      document.body.style.overflow = '';
      map.setMaxBounds(new maplibregl.LngLatBounds(ROAM[0], ROAM[1]));
    }
    /* Plátno zmenilo rozmer — mapa o tom musí vedieť a dosadnúť nanovo. */
    const t = window.setTimeout(() => { map.resize(); fitRef.current?.(0); }, 60);
    return () => window.clearTimeout(t);
  }, [full]);
  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  /* ── Značky sa nesmú triasť ───────────────────────────────────────────
     Body aj názvy sú HTML nad plátnom. Ich polohu doteraz prepočítaval React
     na `move`, teda AŽ POTOM, čo mapa vykreslila snímok — značky tak boli
     stále o jeden snímok pozadu a pri plynulom priblížení to bolo vidieť ako
     chvenie a poskakovanie.

     Teraz sa poloha prepisuje priamo do prvkov v obsluhe `render`, ktorú
     MapLibre volá pre KAŽDÝ snímok. Značka tým sedí na tom istom mieste ako
     to, čo je pod ňou. React ostáva na to, KTORÉ značky existujú (zhlukovanie),
     nie na to, kde sú.

     `useLayoutEffect` pri zmene zoznamu dorovná polohu ešte pred vykreslením
     — inak by nový bod na jeden snímok blikol tam, kde bol pri prepočte. */
  const platnoRef = useRef<HTMLDivElement>(null);
  const zosuladPolohy = useCallback(() => {
    const map = mapRef.current, host = platnoRef.current;
    if (!map || !host) return;
    const uzly = host.querySelectorAll<HTMLElement>('.lmap-node[data-lng], .lmap-mesto[data-lng]');
    for (const el of uzly) {
      const lng = +el.dataset.lng!, lat = +el.dataset.lat!;
      const p = map.project([lng, lat]);
      el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.on('render', zosuladPolohy);
    return () => { map.off('render', zosuladPolohy); };
  }, [ready, zosuladPolohy]);

  useLayoutEffect(zosuladPolohy, [nodes, spiderNodes, mesta, zosuladPolohy]);

  /* Prepnutie podkladu. Satelit má dlaždice do väčšej hĺbky než náš reliéf
     (ten končí na 12), takže sa pri ňom púšťa aj bližšie priblíženie —
     inak by snímka nemala prečo byť. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const sat = podklad === 'satelit';
    map.setLayoutProperty('relief', 'visibility', sat ? 'none' : 'visible');
    map.setLayoutProperty('satelit', 'visibility', sat ? 'visible' : 'none');
    map.setLayoutProperty('hranica-tien', 'visibility', sat ? 'visible' : 'none');
    map.setLayoutProperty('hranica', 'visibility', sat ? 'visible' : 'none');
    map.setMaxZoom(podklad === 'satelit' ? 16 : MAX_Z);
  }, [podklad, ready]);

  const showPills = zoom >= PILL_ZOOM;
  /* Kliknutý bod má prednosť pred tým pod kurzorom — inak by zvýraznenie
     odskočilo hneď, ako sa myš pohne preč. */
  const activeCat = hoverCat ?? (selected ? locs.find(l => l.id === selected)?.cat ?? null : null);
  const all = [...nodes, ...spiderNodes];
  /* Body rozbaleneho vejara sa daju trafit rovnako ako ostatne. */
  useEffect(() => { nodesRef.current = [...nodes, ...spiderNodes]; }, [nodes, spiderNodes]);

  /* Celá obrazovka.

     `position: fixed` sa nemeria voči oknu prehliadača, ale voči najbližšiemu
     rodičovi s `transform`, `filter`, `backdrop-filter`, `perspective`
     alebo `contain` — a takých má stránka niekoľko (atramentová vrstva,
     karty). Mapa sa preto roztiahla len na svojho rodiča a navonok to
     vyzeralo, akoby ťuknutie nespravilo nič.

     Prvý pokus to riešil presunom sekcie pod `<body>`. Lenže tým sa dostala
     MIMO koreňa Reactu — a React počúva udalosti na ňom, takže vnútri mapy
     prestali fungovať všetky obsluhy: krížik, priblíženie, karty bodov.
     (Ťuknutie na otvorenie prežilo len preto, že je natívne.)

     Sekcia preto ostáva tam, kde je, a na čas otvorenia sa tie vlastnosti
     rodičom dočasne vypnú. Po zavretí sa vrátia presne tak, ako boli. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (!full) { document.body.style.overflow = ''; return; }

    const back: { el: HTMLElement; transform: string; filter: string; backdrop: string; perspective: string; contain: string; zIndex: string; isolation: string }[] = [];
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      const boxed = cs.transform !== 'none' || cs.filter !== 'none' || cs.backdropFilter !== 'none'
        || cs.perspective !== 'none' || (cs.contain !== 'none' && !!cs.contain);
      /* Vlastná vrstva rodiča je rovnako zradná: mapa by v nej ostala
         uväznená a skončila by ZA neskoršími časťami stránky — presne to sa
         stalo, keď mapa zmizla za dlaždicami kategórií. */
      const layered = cs.zIndex !== 'auto' || cs.isolation === 'isolate' || cs.mixBlendMode !== 'normal';
      if (!boxed && !layered) continue;
      back.push({
        el: p, transform: p.style.transform, filter: p.style.filter,
        backdrop: p.style.backdropFilter, perspective: p.style.perspective,
        contain: p.style.contain, zIndex: p.style.zIndex, isolation: p.style.isolation,
      });
      p.style.transform = 'none';
      p.style.filter = 'none';
      p.style.backdropFilter = 'none';
      p.style.perspective = 'none';
      p.style.contain = 'none';
      p.style.zIndex = 'auto';
      p.style.isolation = 'auto';
    }
    document.body.style.overflow = 'hidden';
    /* Plátno má iný rozmer, MapLibre to samo nezistí. */
    const t = window.setTimeout(() => mapRef.current?.resize(), 60);

    return () => {
      window.clearTimeout(t);
      back.forEach(b => {
        b.el.style.transform = b.transform;
        b.el.style.filter = b.filter;
        b.el.style.backdropFilter = b.backdrop;
        b.el.style.perspective = b.perspective;
        b.el.style.contain = b.contain;
        b.el.style.zIndex = b.zIndex;
        b.el.style.isolation = b.isolation;
      });
      document.body.style.overflow = '';
      window.setTimeout(() => mapRef.current?.resize(), 60);
    };
  }, [full]);

  /* Otvorenie na telefóne. Poslucháč je natívny a v ZACHYTÁVACEJ fáze na
     koreni sekcie: spustí sa skôr, než sa udalosť dostane k čomukoľvek
     vnútri — k plátnu MapLibre, k bodom aj k prekrytiu. Nemá ho čo „zjesť"
     a nezávisí ani na vrstvách, ani na tom, kam presne prst dopadne. Náhľad
     sa tým celý mení na obrázok, ktorý sa ťuknutím otvorí.

     Predošlé pokusy viedli cez React a cez jeden prvok navrchu — a práve to
     zlyhávalo. */
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !touch || full) return;

    const open = () => {
      /* Mapa je na šírku — na výšku sa z nej vidí pás. Po prechode do
         celoobrazovkového režimu si preto vypýtame otočenie displeja.
         Prehliadač to nemusí povoliť (iPhone to nevie vôbec); vtedy sa nič
         nestane a mapa ostane na výšku. */
      el.requestFullscreen?.()
        .then(() => (screen.orientation as { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
        .catch(() => {});
      setFull(true);
    };

    /* Otvára ŤUKNUTIE, nie akýkoľvek dotyk. Prst, ktorý sa po mape posunie,
       stránku scrolluje — a to musí ostať. Preto si zapamätám, kde a kedy
       dotyk začal, a otvorím až vtedy, keď skončí na tom istom mieste.

       Prečo nestačí `click`: plátno MapLibre volá na dotyku `preventDefault`,
       čím sa ťuknutie nemusí na klik vôbec preložiť. A prečo v ZACHYTÁVACEJ
       fáze: takto sa poslucháč spustí skôr, než sa udalosť dostane
       k čomukoľvek vnútri, takže ho nemá čo pohltiť. */
    let t0 = 0, x0 = 0, y0 = 0, moved = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { moved = true; return; }
      t0 = e.timeStamp; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; moved = false;
    };
    const onMove = (e: TouchEvent) => {
      if (moved || !e.touches.length) return;
      if (Math.abs(e.touches[0].clientX - x0) > 12 || Math.abs(e.touches[0].clientY - y0) > 12) moved = true;
    };
    const onEnd = (e: TouchEvent) => {
      if (moved || e.timeStamp - t0 > 700) return;
      e.stopPropagation();
      open();
    };
    /* Myš na úzkom okne — tam žiadne rozlišovanie netreba. */
    const onClick = (e: Event) => { e.stopPropagation(); open(); };

    el.addEventListener('touchstart', onStart, true);
    el.addEventListener('touchmove', onMove, true);
    el.addEventListener('touchend', onEnd, true);
    el.addEventListener('click', onClick, true);
    return () => {
      el.removeEventListener('touchstart', onStart, true);
      el.removeEventListener('touchmove', onMove, true);
      el.removeEventListener('touchend', onEnd, true);
      el.removeEventListener('click', onClick, true);
    };
  }, [touch, full]);

  /* Ovládače mapy zámerne NEZAPÍNAME ani NEVYPÍNAME. Skúsil som to a bola
     to presne tá zmena, po ktorej sa mapa prestala dať posúvať prstom:
     `dragPan` sa po vypnutí a opätovnom zapnutí nevrátil do pôvodného stavu.
     Náhľad si vystačí s režimom dvoch prstov (jeden prst listuje stránku),
     a na celej obrazovke sa ten režim vypne — viac netreba. */


  const closeCard = useCallback(() => setSelected(null), []);

  const closeFull = useCallback(() => {
    (screen.orientation as { unlock?: () => void })?.unlock?.();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    setFull(false);
  }, []);

  /* Priblíženie na celej obrazovke. Bočný panel je tam skrytý (zaberal by
     mapu), takže krok musí byť po ruke inde. */
  const stepZoom = useCallback((d: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.stop();
    map.easeTo({ zoom: Math.min(MAX_Z, Math.max(MIN_Z, map.getZoom() + d)), duration: 240 });
  }, []);

  /* Odchod z celoobrazovkového režimu tlačidlom „späť" prehliadača. */
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement && full) setFull(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, [full]);

  /* Keby stránka zmizla otvorená, posúvanie tela musí ostať funkčné. */
  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  return (
    <section
      ref={rootRef as React.RefObject<HTMLElement>}
      className={['lmap', full && 'is-full', podklad === 'satelit' && 'is-satelit'].filter(Boolean).join(' ')}
      /* To isté pre celú obrazovku: `position: fixed` v inline štýle sa
         uplatní bez ohľadu na to, či sa medzidotaz na danom telefóne trafí. */
      style={full ? {
        position: 'fixed', inset: 0, zIndex: 4000,
        flexDirection: 'column', flexWrap: 'nowrap',
        height: '100dvh', width: '100vw',
      } : undefined}
    >
      {/* ── Ľavý panel ─────────────────────────────────────────────────── */}
      <div className="lmap-side" style={full ? { display: 'none' } : undefined}>
        <div className="lmap-head">
          <div className="lmap-eyebrow"><span /> Terénny atlas · 02</div>
          <h2 className="lmap-title">Hradiská</h2>
          <div className="lmap-sub">Slovenska</div>
          <p className="lmap-lead">
            Interaktívna mapa lokalít. Kolieskom približujete, ťahaním posúvate —
            zhluky sa priblížením rozpadnú na jednotlivé body. Prejdením po bode
            otvoríte kartu lokality, klikom do mapy ju zavriete.
          </p>
          {outside > 0 && (
            <button type="button" className="lmap-outside" onClick={() => mapRef.current?.fitBounds(ROAM, { padding: 40, duration: 600 })}>
              <span>{outside}</span> lokalít leží za hranicami — ukázať
            </button>
          )}
        </div>

        {/* Podklad. Reliéf ukáže, PREČO hradisko stojí práve tam — ostrožnu,
            sútok, prevýšenie. Snímka ukáže, ČO je na tom mieste dnes. */}
        <div className="lmap-podklad" role="group" aria-label="Podklad mapy">
          {([['relief', 'Reliéf'], ['satelit', 'Satelit']] as const).map(([k, l]) => (
            <button
              key={k}
              type="button"
              className={podklad === k ? 'is-on' : undefined}
              aria-pressed={podklad === k}
              onClick={() => setPodklad(k)}
            >
              {l}
            </button>
          ))}
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
      <div
        className="lmap-canvas"
        onClickCapture={closeOnOutside}
        style={full ? { flex: 1, width: '100%', height: 'auto', aspectRatio: 'auto', maxHeight: 'none', minHeight: 0 } : undefined}
      >
        <div className="lmap-grid pointer-events-none" aria-hidden="true" />
        <div className="lmap-watermark pointer-events-none" aria-hidden="true">SK</div>

        <div ref={hostRef} className="lmap-gl" />

        {/* Náhľad na telefóne: mapa sa neovláda, otvára sa. Prekrytie leží cez
            celé plátno, takže netreba trafiť nič drobné.

            Prečo `div` a nie `button` a prečo aj `onTouchEnd`: pod prekrytím
            je plátno MapLibre, ktoré si na dotyku berie udalosti a bráni
            predvolenému správaniu — ťuknutie sa tak nemuselo preložiť na
            kliknutie a tlačidlo nereagovalo. Ťuknutie preto obsluhujem
            priamo, a `touchend` sa navyše zastaví, aby ho už nikto nedostal. */}
        {touch && !full && (
          /* Štít. Náhľad na stránke sa neovláda — je to obrázok, ktorý sa
             ťuknutím otvorí. Štít pohltí dotyky skôr, než sa dostanú
             k mape, a `touch-action: pan-y` necháva zvislý ťah stránke,
             takže sa cez mapu dá normálne prelistovať. Ťuknutie chytá
             poslucháč na koreni sekcie. */
          <div className="lmap-shield" aria-hidden="true" />
        )}

        {touch && !full && (
          /* Iba nápoveda. Ťuknutie obsluhuje poslucháč na koreni sekcie,
             nie tento prvok — preto nechytá udalosti. */
          <div
            className="lmap-open pointer-events-none"
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, zIndex: 900,
              display: 'grid', placeItems: 'end center', paddingBottom: 16,
              pointerEvents: 'none', background: 'transparent',
            }}
          >
            <span>Ťuknutím otvoríte mapu na celú obrazovku</span>
          </div>
        )}

                {touch && full && (
          <button
            type="button"
            className="lmap-close"
            onPointerDown={closeFull}
            aria-label="Zavrieť mapu"
            style={{
              position: 'absolute', zIndex: 4100,
              top: 'calc(12px + env(safe-area-inset-top))', right: 12,
              width: 44, height: 44, borderRadius: '50%',
              display: 'grid', placeItems: 'center', pointerEvents: 'auto',
              background: 'rgba(20,18,15,.85)', color: '#f3ede1',
              border: '1px solid rgba(255,255,255,.25)', touchAction: 'manipulation',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}

        {touch && full && (
          /* Štipnutie dvoma prstami funguje, ale jednou rukou sa robí zle —
             preto sú tu aj kroky pod palcom. */
          <div
            style={{
              position: 'absolute', zIndex: 4100,
              right: 12, bottom: 'calc(16px + env(safe-area-inset-bottom))',
              display: 'flex', flexDirection: 'column', gap: 1,
              borderRadius: 12, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,.25)', pointerEvents: 'auto',
            }}
          >
            {/* Podklad. Bočný panel je na celej obrazovke skrytý, takže
                prepínač musí byť tu — jedným tlačidlom, nie dvoma. */}
            <button
              type="button"
              aria-label={podklad === 'relief' ? 'Prepnúť na satelitnú snímku' : 'Prepnúť na reliéf'}
              onPointerDown={e => { e.preventDefault(); setPodklad(p => (p === 'relief' ? 'satelit' : 'relief')); }}
              style={{
                width: 48, height: 48, display: 'grid', placeItems: 'center',
                background: 'rgba(20,18,15,.85)', color: '#f3ede1',
                border: 0, borderBottom: '1px solid rgba(243,237,225,.25)',
                font: '600 9px/1.15 var(--mono, monospace)', letterSpacing: '.1em',
                textTransform: 'uppercase', touchAction: 'manipulation', cursor: 'pointer',
              }}
            >
              {podklad === 'relief' ? 'SAT' : 'REL'}
            </button>

            {/* Posuvník: koľko z rozsahu je za tebou a koľko pred tebou, na
                jeden pohľad — a jedným ťahom prejde celý rozsah. */}
            <input
              className="lmap-fz-slider"
              type="range"
              min={MIN_Z} max={MAX_Z} step={0.05}
              value={zoom}
              aria-label="Priblíženie"
              onChange={e => { mapRef.current?.stop(); mapRef.current?.setZoom(Number(e.target.value)); }}
              onPointerDown={e => e.stopPropagation()}
            />
            {([['+', 0.9], ['−', -0.9]] as [string, number][]).map(([sign, d]) => (
              <button
                key={sign}
                type="button"
                aria-label={d > 0 ? 'Priblížiť' : 'Oddialiť'}
                onPointerDown={e => { e.preventDefault(); stepZoom(d); }}
                style={{
                  width: 48, height: 48, display: 'grid', placeItems: 'center',
                  background: 'rgba(20,18,15,.85)', color: '#f3ede1',
                  border: 0, font: '600 22px/1 system-ui, sans-serif',
                  touchAction: 'manipulation', cursor: 'pointer',
                }}
              >
                {sign}
              </button>
            ))}
          </div>
        )}

        {touch && full && selected && (() => {
          const loc = locs.find(l => l.id === selected);
          /* Karta stojí MIMO bodu. V bode je umiestnená cez `transform`,
             a ten z bodu robí rám pre pevnú polohu — karta by z neho dostala
             šírku tridsiatich bodov a zvisla by ako úzky biely prúžok.
             Ako súrodenec plátna sa nemá o čo oprieť a nemá sa kde orezať. */
          return loc ? (
            <div className="lmap-sheet" onClick={e => e.stopPropagation()}>
              <div className="lmap-card">
                <CardIn loc={loc} onClose={closeCard} />
              </div>
              {/* Krížik patrí rohu KARTY. V rámci karty sedí vo fotke, a tá
                  je tu len úzky ľavý stĺpec — tam by prekážal fotke aj
                  palcu. */}
              <button type="button" className="lmap-sheet-x" onClick={closeCard} aria-label="Zavrieť">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ) : null;
        })()}

        {/* Body a zhluky — v obrazovkových súradniciach nad plátnom mapy. */}
        <div className="lmap-overlay pointer-events-none" ref={platnoRef}>
          {/* Názvy miest. Kreslia sa PRED bodmi, takže bod ich vždy prekryje —
              mapa je o lokalitách, mestá sú len pomôcka na zorientovanie. */}
          {mesta.map(m => (
            <span
              key={m.id}
              className={m.r === 0 ? 'lmap-mesto is-velke' : 'lmap-mesto'}
              data-lng={m.lng} data-lat={m.lat}
              style={{ transform: `translate3d(${m.x}px, ${m.y}px, 0)` }}
            >
              <i className="lmap-mesto-b" aria-hidden="true" />
              <b className="lmap-mesto-n">{m.n}</b>
            </span>
          ))}
          {spider && (
            <>
              {spiderNodes.map(n => (
                <span
                  key={'line-' + n.loc.id}
                  className="lmap-spider-line pointer-events-none"
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
            <div key={'c-' + n.members.map(m => m.id).join('|')} className="lmap-node pointer-events-none"
              data-lng={n.lng} data-lat={n.lat}
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
              sheet={touch && full}
              onClose={closeCard}
              showPill={showPills && !spider}
              canvasW={canvasW}
              canvasH={canvasH}
              onEnter={openHover}
              onLeave={closeHoverSoon}
              onToggle={toggleSelected}
            />
          ))}
        </div>

        {/* Popisky z plátna sú preč — súradnice stredu, „Reliéf · Copernicus
            DEM 30 m" aj počítadlo lokalít ležali cez krajinu. Uvedenie
            zdrojov je pod mapou, nie na nej. */}

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
        </div>
      </div>

      {/* Uvedenie zdrojov je licenčná povinnosť, ale nepatrí cez krajinu —
          pod mapou je to poznámka pod obrázkom. */}
      <p className="lmap-attrib">
        {podklad === 'satelit'
          ? 'Satelitné snímky: Esri, Maxar, Earthstar Geographics · Názvy miest: © prispievatelia OpenStreetMap · Hranica: geoBoundaries'
          : 'Reliéf: Copernicus DEM · Rieky a názvy miest: © prispievatelia OpenStreetMap · Hranica: geoBoundaries'}
      </p>
    </section>
  );
}

export default MapaHradisk;
