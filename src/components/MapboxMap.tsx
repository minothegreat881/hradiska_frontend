"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Hradisko } from '../data/hradiska';
import { Search, Filter, Maximize2, RotateCcw, Mountain, Shuffle, X } from 'lucide-react';

// Mapbox Access Token — set VITE_MAPBOX_TOKEN in .env (or Vercel project env).
// Free token (50k views/mo, no card): https://account.mapbox.com/
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

// ---------- Piny podľa NÁŠHO členenia (funkčné typy hradísk) ----------
const PIN_CREAM = '#F5E9D0';

// Kategórie zladené s webom (data/categories.ts). Každá má farbu + čistý glyf.
type CatSlug =
  | 'kniezacie-sidla' | 'mocenske-centra' | 'strazna-funkcia'
  | 'refugia' | 'staroveke-sidla' | 'svatyne-a-sakralne-objekty';

const CATS: { slug: CatSlug; label: string; color: string }[] = [
  { slug: 'kniezacie-sidla',            label: 'Kniežacie sídla',                color: '#E01E28' }, // výrazná červená
  { slug: 'mocenske-centra',            label: 'Mocenské centrá',                color: '#1A1A1A' }, // čierna
  { slug: 'strazna-funkcia',            label: 'Strážna a hospodárska funkcia',  color: '#1E9B48' }, // zelená
  { slug: 'refugia',                    label: 'Refúgiá',                        color: '#2563EB' }, // modrá
  { slug: 'staroveke-sidla',            label: 'Staroveké sídla',                color: '#E8760C' }, // oranžová
  { slug: 'svatyne-a-sakralne-objekty', label: 'Svätyne a sakrálne objekty',     color: '#7E3FF2' }, // fialová
];
const CAT_COLOR = Object.fromEntries(CATS.map((c) => [c.slug, c.color])) as Record<CatSlug, string>;
const CAT_LABEL = Object.fromEntries(CATS.map((c) => [c.slug, c.label])) as Record<CatSlug, string>;

// Kým nie sú reálne dáta s kategóriou, staré demo-typy premapujeme (v praxi sa
// zatiaľ nevykresľujú — POINTS je prázdne).
const TYPE_TO_CAT: Record<string, CatSlug> = { hrad: 'mocenske-centra', hradisko: 'strazna-funkcia', zamok: 'kniezacie-sidla' };

// Jednoduchá „bodka" — farebný kruh s krémovým okrajom a jemným halo.
// Rozlíšenie kategórie ide cez VÝRAZNÉ farby (viď CATS).
function catShape(cat: CatSlug, px: number, pulse = false): string {
  const c = CAT_COLOR[cat];
  const halo = `<circle cx="12" cy="12" r="10.6" fill="${c}" opacity="${pulse ? 0.24 : 0.16}"${pulse ? ' class="mdot-halo"' : ''}/>`;
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" style="overflow:visible; display:block; filter: drop-shadow(0 1px 2px rgba(0,0,0,.5));">
      ${halo}
      <circle cx="12" cy="12" r="6.6" fill="${c}" stroke="${PIN_CREAM}" stroke-width="2"/>
      <circle cx="9.7" cy="9.7" r="1.8" fill="#ffffff" opacity="0.4"/>
    </svg>
  `;
}

function makePinSvg(cat: CatSlug): string { return catShape(cat, 30); }
function makeMiniPinSvg(cat: CatSlug): string { return catShape(cat, 20, true); }

const MapboxMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(CATS.map((c) => c.slug));
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // ZATIAĽ BEZ REÁLNYCH BODOV — kým nebudú hradiská so súradnicami + kategóriou.
  // Legenda a filter fungujú (ukazujú naše členenie a nové ikony), mapa je bez pinov.
  const POINTS: Hradisko[] = [];

  // Kategória lokality (kým dáta nemajú vlastnú kategóriu, mapujeme zo starého typu).
  const catOf = (h: Hradisko): CatSlug => TYPE_TO_CAT[h.type] || 'staroveke-sidla';

  // Farby a labely podľa nášho členenia (popup, detail, filter, legenda)
  const typeColors = CAT_COLOR;
  const typeLabels = CAT_LABEL;

  // Mini ikony pre legendu / detail karty
  const svgIcons = Object.fromEntries(CATS.map((c) => [c.slug, makeMiniPinSvg(c.slug)])) as Record<CatSlug, string>;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [19.5, 48.7], // Stred Slovenska
      zoom: 7.5,
      pitch: 45,
      bearing: 17.5,
      antialias: true
    });
    
    map.current.on('style.load', () => {
      map.current!.setConfigProperty('basemap', 'lightPreset', 'night');
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add 3D terrain
      map.current!.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      
      map.current!.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
      
      // Add sky layer for atmospheric effects
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      // Add atmospheric fog
      map.current!.setFog({
        'range': [0.5, 10],
        'color': 'white',
        'horizon-blend': 0.05
      });

      addMarkers();
      
      // Animate camera on load
      map.current!.flyTo({
          zoom: 8,
          pitch: 60,
          bearing: 0,
          duration: 3000,
          essential: true
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers to map
  const addMarkers = () => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    popupsRef.current.forEach(popup => popup.remove());
    popupsRef.current = [];

    const filteredData = POINTS.filter(hradisko => {
      const matchesType = selectedTypes.includes(catOf(hradisko));
      const matchesSearch = hradisko.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.kraj.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    filteredData.forEach(hradisko => {
      // Create marker element – vintage pin so špičkou na presnej polohe
      const el = document.createElement('div');
      el.className = 'castle-pin';
      el.innerHTML = makePinSvg(catOf(hradisko));
      el.style.width = '36px';
      el.style.height = '48px';
      el.style.cursor = 'pointer';
      el.style.transformOrigin = '50% 50%'; // bodka sa kotví stredom
      el.style.transition = 'transform 180ms ease-out, filter 180ms ease-out';
      el.style.willChange = 'transform';
      const baseShadow = 'drop-shadow(0 3px 3px rgba(0,0,0,0.45))';
      const hoverShadow = hradisko.unesco
        ? 'drop-shadow(0 6px 7px rgba(0,0,0,0.55)) drop-shadow(0 0 4px rgba(232,197,110,0.65))'
        : 'drop-shadow(0 6px 7px rgba(0,0,0,0.55)) drop-shadow(0 0 4px rgba(245,233,208,0.55))';
      el.style.filter = baseShadow;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.12)';
        el.style.filter = hoverShadow;
        el.style.zIndex = '5';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.filter = baseShadow;
        el.style.zIndex = '';
      });

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 35,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="font-family: system-ui; min-width: 220px; background-color: rgba(12, 10, 29, 0.85); color: #f0f0f0; border-radius: 8px; padding: 12px; border: 1px solid ${typeColors[catOf(hradisko)]}; backdrop-filter: blur(5px);">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: white;">
            ${hradisko.name}
            ${hradisko.unesco ? ' <span style="color: gold; font-size: 20px;">★</span>' : ''}
          </h3>
          <p style="margin: 4px 0; font-size: 13px; color: #ccc;">
            <strong>Typ:</strong> ${typeLabels[catOf(hradisko)]}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #ccc;">
            <strong>Obdobie:</strong> ${hradisko.rok}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #ccc;">
            <strong>Stav:</strong> ${hradisko.stav}
          </p>
          <button 
            onclick="window.showDetailedInfo('${hradisko.name}')"
            style="
              margin-top: 12px;
              padding: 8px 12px;
              background: ${typeColors[catOf(hradisko)]};
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
              width: 100%;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='${typeColors[catOf(hradisko)]}cc'"
            onmouseout="this.style.backgroundColor='${typeColors[catOf(hradisko)]}'"
          >
            Viac informácií
          </button>
        </div>
      `);

      popupsRef.current.push(popup);

      // Create marker – anchor 'bottom' aby špička pinu presne ukazovala na lokalitu
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(hradisko.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        setSelectedHradisko(hradisko);
        map.current!.flyTo({
          center: hradisko.coordinates,
          zoom: 13,
          pitch: 60,
          duration: 2000
        });
      });

      markersRef.current.push(marker);
    });
  };

  // Update markers when filters change
  useEffect(() => {
    if (mapLoaded) {
      addMarkers();
    }
  }, [selectedTypes, searchQuery, mapLoaded]);

  // Hide all markers and popups when detail is open
  useEffect(() => {
    if (selectedHradisko) {
      // Hide all markers
      markersRef.current.forEach(marker => {
        marker.getElement().style.display = 'none';
      });
      // Close all popups
      popupsRef.current.forEach(popup => {
        popup.remove();
      });
    } else {
      // Show all markers
      markersRef.current.forEach(marker => {
        marker.getElement().style.display = 'flex';
      });
    }
  }, [selectedHradisko]);

  // Global function for detailed info button
  useEffect(() => {
    (window as any).showDetailedInfo = (name: string) => {
      const hradisko = POINTS.find(h => h.name === name);
      if (hradisko) {
        setSelectedHradisko(hradisko);
      }
    };

    return () => {
      delete (window as any).showDetailedInfo;
    };
  }, []);

  const toggle3DTerrain = () => {
    if (!map.current) return;
    
    if (is3DEnabled) {
      map.current.setTerrain(null);
      map.current.setPitch(0);
    } else {
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.7 });
      map.current.setPitch(60);
    }
    setIs3DEnabled(!is3DEnabled);
  };

  const resetView = () => {
    if (!map.current) return;
    map.current.flyTo({
      center: [19.5, 48.7],
      zoom: 7,
      pitch: 0,
      bearing: 0,
      duration: 1500
    });
  };

  const randomHrad = () => {
    const hrady = POINTS.filter(h => selectedTypes.includes(catOf(h)));
    if (hrady.length === 0) return;
    
    const random = hrady[Math.floor(Math.random() * hrady.length)];
    setSelectedHradisko(random);
    
    if (map.current) {
      map.current.flyTo({
        center: random.coordinates,
        zoom: 14,
        pitch: 60,
        duration: 2500
      });
    }
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[600px] bg-stone-900">
      {/* Header Panel */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-stone-900/95 to-stone-900/80 backdrop-blur-sm border-b border-stone-700/50 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-stone-100 mb-3">
            Interaktívna 3D mapa hradísk Slovenska
          </h2>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="mapbox-search"
                name="mapbox-search"
                type="text"
                placeholder="Vyhľadať hradisko, okres alebo kraj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Vyhľadať hradisko, okres alebo kraj"
                className="w-full pl-10 pr-4 py-2 bg-stone-800/80 border border-stone-700 rounded text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              
              <button
                onClick={toggle3DTerrain}
                className={`px-4 py-2 border rounded flex items-center gap-2 text-sm transition-colors ${
                  is3DEnabled 
                    ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white' 
                    : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-100'
                }`}
              >
                <Mountain className="w-4 h-4" />
                3D
              </button>
              
              <button
                onClick={randomHrad}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
                title="Náhodný hrad"
              >
                <Shuffle className="w-4 h-4" />
              </button>
              
              <button
                onClick={resetView}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
                title="Reset pohľadu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-3 p-4 bg-stone-800/90 border border-stone-700 rounded">
              <h3 className="text-stone-100 mb-3 text-sm">Filtrovať podľa kategórie:</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(typeLabels).map(([type, label]) => (
                  <label key={type} htmlFor={`mapbox-filter-${type}`} className="flex items-center gap-2 cursor-pointer">
                    <input
                      id={`mapbox-filter-${type}`}
                      name={`mapbox-filter-${type}`}
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                      aria-label={`Filtrovať: ${label}`}
                      className="w-4 h-4 rounded border-stone-600 text-amber-600 focus:ring-amber-600 focus:ring-offset-stone-900"
                    />
                    <span className="flex items-center gap-2 text-stone-200 text-sm">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: typeColors[type as keyof typeof typeColors] }}
                      />
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-stone-700 text-xs text-stone-400">
                Zobrazených: {POINTS.filter(h =>
                  selectedTypes.includes(catOf(h)) &&
                  (h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.kraj.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length} / {POINTS.length} lokalít
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/85 backdrop-blur-md border border-amber-900/40 rounded-lg p-4 max-w-xs shadow-2xl">
        <h3 className="text-amber-100 mb-3 text-sm font-semibold tracking-wide" style={{ fontFamily: 'Georgia, serif' }}>Kategórie hradísk</h3>
        <div className="space-y-2">
          {CATS.map(({ slug, label }) => (
            <div key={slug} className="flex items-center gap-3">
              <div className="w-7 h-9 flex items-end justify-center">
                <div dangerouslySetInnerHTML={{ __html: makeMiniPinSvg(slug) }} />
              </div>
              <span className="text-stone-200 text-xs">{label}</span>
            </div>
          ))}
          <div className="mt-3 pt-3 border-t border-amber-900/30 text-stone-400 text-[11px] italic leading-snug">
            Lokality sa dopĺňajú — mapa čoskoro ožije bodmi jednotlivých hradísk.
          </div>
        </div>
      </div>

      {/* Detail Card - Parchment style overlay with historical motifs */}
      {selectedHradisko && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Solid overlay - completely opaque */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: '#1a1714' }}
            onClick={() => setSelectedHradisko(null)}
          />

          {/* Card - parchment style - larger with decorations */}
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(to bottom, #f9f6f0, #f5f1e8, #ebe5d8)',
              border: '3px solid #c4a574'
            }}
          >
            {/* Top decorative border with pattern */}
            <div className="h-3 flex items-center justify-center" style={{ backgroundColor: '#c4a574' }}>
              <div className="flex gap-4">
                <span style={{ color: '#8b6914' }}>◆</span>
                <span style={{ color: '#8b6914' }}>❖</span>
                <span style={{ color: '#8b6914' }}>◆</span>
              </div>
            </div>

            {/* Corner ornaments */}
            <div className="absolute top-6 left-6 text-3xl opacity-20" style={{ color: '#8b7355' }}>❧</div>
            <div className="absolute top-6 right-6 text-3xl opacity-20" style={{ color: '#8b7355', transform: 'scaleX(-1)' }}>❧</div>

            <div className="p-10 flex gap-8 items-start">
              {/* Left: Photo - larger */}
              <div className="flex-shrink-0 mt-4">
                <div
                  className="relative rounded-xl overflow-hidden shadow-xl"
                  style={{ width: '280px', height: '280px', border: '4px solid #c4a574' }}
                >
                  {selectedHradisko.fotka ? (
                    <img
                      src={selectedHradisko.fotka}
                      alt={selectedHradisko.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: '#e8dcc8' }}
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: '#f5f1e8',
                          border: `3px solid ${typeColors[catOf(selectedHradisko)]}`
                        }}
                      >
                        <div dangerouslySetInnerHTML={{ __html: svgIcons[catOf(selectedHradisko)] }} />
                      </div>
                    </div>
                  )}
                  {/* Type badge */}
                  <div
                    className="absolute bottom-0 left-0 right-0 py-2 text-center text-sm text-white font-bold uppercase tracking-wider"
                    style={{ backgroundColor: typeColors[catOf(selectedHradisko)] }}
                  >
                    {typeLabels[catOf(selectedHradisko)]}
                  </div>
                </div>

                {/* Decorative element under photo */}
                <div className="text-center mt-3" style={{ color: '#c4a574' }}>
                  ═══════════
                </div>
              </div>

              {/* Right: Info */}
              <div className="flex-1 min-w-0">
                {/* Header with ornament */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ color: '#c4a574', fontSize: '20px' }}>⚜</span>
                      <h3
                        className="font-bold text-4xl"
                        style={{ color: '#2d1810', fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {selectedHradisko.name}
                      </h3>
                      <span style={{ color: '#c4a574', fontSize: '20px' }}>⚜</span>
                    </div>
                    {selectedHradisko.unesco && (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 rounded-lg text-sm text-stone-900 font-bold uppercase">
                        ★ UNESCO Pamiatka
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="p-2 hover:bg-amber-100 rounded-full transition-colors"
                  >
                    <X className="w-7 h-7" style={{ color: '#5d4e37' }} />
                  </button>
                </div>

                {/* Decorative divider */}
                <div className="flex items-center gap-2 mb-5" style={{ color: '#c4a574' }}>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }}></div>
                  <span>✦</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: '#c4a574' }}></div>
                </div>

                {/* Description if available */}
                {selectedHradisko.description && (
                  <p
                    className="mb-5 text-base leading-relaxed"
                    style={{ color: '#4a3f35', fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
                  >
                    "{selectedHradisko.description.substring(0, 150)}..."
                  </p>
                )}

                {/* Info grid - larger with ornate styling */}
                <div
                  className="grid grid-cols-2 gap-5 mb-6 p-5 rounded-xl relative"
                  style={{ backgroundColor: 'rgba(194, 164, 118, 0.2)', border: '2px solid #c4a574' }}
                >
                  {/* Corner decorations */}
                  <span className="absolute -top-2 -left-2 text-lg" style={{ color: '#c4a574' }}>┌</span>
                  <span className="absolute -top-2 -right-2 text-lg" style={{ color: '#c4a574' }}>┐</span>
                  <span className="absolute -bottom-2 -left-2 text-lg" style={{ color: '#c4a574' }}>└</span>
                  <span className="absolute -bottom-2 -right-2 text-lg" style={{ color: '#c4a574' }}>┘</span>

                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>⏳ Obdobie</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.rok}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>📜 Stav</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.stav}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>📍 Okres</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.okres || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#8b7355' }}>⛰️ Nadmorská výška</span>
                    <p className="font-semibold text-xl" style={{ color: '#2d1810' }}>{selectedHradisko.nadmorskaVyska} m n.m.</p>
                  </div>
                </div>

                {/* Actions - larger buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      if (map.current) {
                        map.current.flyTo({
                          center: selectedHradisko.coordinates,
                          zoom: 15,
                          pitch: 65,
                          duration: 2000
                        });
                      }
                      setSelectedHradisko(null);
                    }}
                    className="flex-1 px-6 py-3.5 text-white rounded-xl font-semibold transition-colors text-lg"
                    style={{ backgroundColor: '#7d4f1d' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5e3c16'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7d4f1d'}
                  >
                    🗺️ Priblížiť na mape
                  </button>
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="px-6 py-3.5 rounded-xl font-semibold transition-colors text-lg"
                    style={{ backgroundColor: '#e8dcc8', color: '#5d4e37', border: '2px solid #c4a574' }}
                  >
                    Zavrieť
                  </button>
                </div>

                {/* Google Maps link - moved lower */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      window.open(`https://www.google.com/maps?q=${selectedHradisko.coordinates[1]},${selectedHradisko.coordinates[0]}`, '_blank');
                    }}
                    className="text-sm underline transition-colors"
                    style={{ color: '#7d4f1d' }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#5e3c16'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#7d4f1d'}
                  >
                    📍 Otvoriť v Google Maps →
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom decorative border with pattern */}
            <div className="h-3 flex items-center justify-center" style={{ backgroundColor: '#c4a574' }}>
              <div className="flex gap-4">
                <span style={{ color: '#8b6914' }}>◆</span>
                <span style={{ color: '#8b6914' }}>❖</span>
                <span style={{ color: '#8b6914' }}>◆</span>
              </div>
            </div>

            {/* Bottom corner ornaments */}
            <div className="absolute bottom-6 left-6 text-3xl opacity-20" style={{ color: '#8b7355', transform: 'rotate(180deg)' }}>❧</div>
            <div className="absolute bottom-6 right-6 text-3xl opacity-20" style={{ color: '#8b7355', transform: 'rotate(180deg) scaleX(-1)' }}>❧</div>
          </div>
        </div>
      )}

      {/* Warning if no token */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-900 z-30">
          <div className="text-center p-8 max-w-md">
            <h3 className="text-amber-600 mb-4">Mapbox API kľúč nie je nastavený</h3>
            <p className="text-stone-300 text-sm mb-4">
              Pre zobrazenie mapy je potrebné nastaviť Mapbox API kľúč v súbore MapboxMap.tsx
            </p>
            <p className="text-stone-400 text-xs">
              Získajte kľúč na: <br />
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 hover:text-amber-500"
              >
                https://account.mapbox.com/access-tokens/
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
