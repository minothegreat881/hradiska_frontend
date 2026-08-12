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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/* Výrez renderu — musí sedieť s BOUNDS_4326 v build_relief.py. */
const BOUNDS: [[number, number], [number, number]] = [[16.79, 47.70], [22.60, 49.65]];
const MIN_Z = 5.2;
const MAX_Z = 12;
/** Od tohto priblíženia dostane bod menovku (handoff: 2,4× z rozsahu 1–10×). */
const PILL_ZOOM = 9.6;
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

const Icon = ({ path, size = 13, w = 2.2 }: { path: string; size?: number; w?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
);

const deg = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? pos : neg}`;

/** Základ Strapi — vo vývoji priamo 1337, v produkcii cez proxy `/strapi`. */
const strapiBase = () =>
  import.meta.env.PROD
    ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi')
    : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

export function LabMapa() {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(MIN_Z);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  /** Rozbalený vejár: body na (takmer) rovnakom mieste, ktoré zoom neoddelí. */
  const [spider, setSpider] = useState<{ ids: string[]; x: number; y: number } | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 48.67, lng: 19.70 });

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
            && x.lng >= BOUNDS[0][0] && x.lng <= BOUNDS[1][0]
            && x.lat >= BOUNDS[0][1] && x.lat <= BOUNDS[1][1])
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
      bounds: BOUNDS,
      fitBoundsOptions: { padding: 24 },
      minZoom: MIN_Z,
      maxZoom: MAX_Z,
      maxBounds: [[BOUNDS[0][0] - 1.2, BOUNDS[0][1] - 0.8], [BOUNDS[1][0] + 1.2, BOUNDS[1][1] + 0.8]],
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: true,
    });
    map.touchZoomRotate.disableRotation();
    map.on('load', () => { setReady(true); });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
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
    recompute();
    map.on('move', recompute);
    map.on('resize', recompute);
    return () => { map.off('move', recompute); map.off('resize', recompute); };
  }, [ready, recompute]);

  /* Pohyb mapy zatvára kartu aj vejár — inak by viseli nad prázdnym miestom. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const clear = () => { setSelected(null); setSpider(null); };
    map.on('dragstart', clear);
    map.on('zoomstart', clear);
    return () => { map.off('dragstart', clear); map.off('zoomstart', clear); };
  }, [ready]);

  const zoomBy = (f: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ zoom: Math.min(MAX_Z, Math.max(MIN_Z, map.getZoom() + f)), duration: 260 });
  };
  const reset = () => mapRef.current?.fitBounds(BOUNDS, { padding: 24, duration: 420 });

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

  const showPills = zoom >= PILL_ZOOM;
  const all = [...nodes, ...spiderNodes];

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
            zhluky sa priblížením rozpadnú na jednotlivé body. Kliknutím na bod
            otvoríte kartu lokality.
          </p>
        </div>

        <div className={legendOpen ? 'lmap-legend is-open' : 'lmap-legend'}>
          <button type="button" className="lmap-legend-h" onClick={() => setLegendOpen(v => !v)}>
            Kategórie lokalít <span aria-hidden="true">{legendOpen ? '–' : '+'}</span>
          </button>
          <div className="lmap-legend-body">
            {CATS.map(c => (
              <div className="lmap-legend-row" key={c.slug}>
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
      <div className="lmap-canvas">
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
                    left: spider.x, top: spider.y,
                    width: Math.hypot(n.x - spider.x, n.y - spider.y),
                    transform: `rotate(${Math.atan2(n.y - spider.y, n.x - spider.x)}rad)`,
                  }}
                />
              ))}
              <button type="button" className="lmap-spider-x" style={{ left: spider.x, top: spider.y }}
                      onClick={() => setSpider(null)} aria-label="Zavrieť vejár">×</button>
            </>
          )}

          {all.map(n => n.kind === 'many' ? (
            <button
              type="button"
              key={'c-' + n.members.map(m => m.id).join('|')}
              className="lmap-cluster"
              style={{ left: n.x, top: n.y, ['--core' as any]: `${30 + Math.min(n.members.length, 14) * 1.1}px` }}
              onClick={() => openCluster(n)}
              aria-label={`Zhluk ${n.members.length} lokalít — priblížiť`}
            >
              <span className="lmap-cluster-halo" aria-hidden="true" />
              {Array.from({ length: Math.min(n.members.length, 12) }).map((_, i, arr) => {
                const a = (i / arr.length) * Math.PI * 2 - Math.PI / 2;
                const r = (30 + Math.min(n.members.length, 14) * 1.1) / 2 + 10;
                return <span key={i} className="lmap-orbit" aria-hidden="true"
                             style={{ left: `calc(50% + ${Math.cos(a) * r}px)`, top: `calc(50% + ${Math.sin(a) * r}px)` }} />;
              })}
              <span className="lmap-cluster-core">{n.members.length}</span>
            </button>
          ) : (
            <div key={n.loc.id} className="lmap-pin-wrap" style={{ left: n.x, top: n.y, zIndex: selected === n.loc.id ? 30 : 3 }}>
              <button
                type="button"
                className={selected === n.loc.id ? 'lmap-pin is-selected' : 'lmap-pin'}
                onClick={() => setSelected(s => (s === n.loc.id ? null : n.loc.id))}
                aria-label={n.loc.name}
              >
                <span className="lmap-pin-spec" aria-hidden="true" />
                <Icon path={(CAT_BY_SLUG[n.loc.cat] || CATS[0]).icon} />
              </button>

              {showPills && selected !== n.loc.id && !spider && (
                <span className="lmap-pill">
                  <span className="lmap-pill-n">{n.loc.name}</span>
                  <span className="lmap-pill-c">{(CAT_BY_SLUG[n.loc.cat] || CATS[0]).label}</span>
                </span>
              )}

              {selected === n.loc.id && (
                <div className="lmap-card" onClick={e => e.stopPropagation()}>
                  <div className="lmap-card-in">
                    <div className="lmap-card-photo" style={n.loc.cover ? { backgroundImage: `url(${strapiBase()}${n.loc.cover})` } : undefined}>
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
