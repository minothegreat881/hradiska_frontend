"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { Search, Filter, RotateCcw, Shuffle, X, Mountain, Layers } from 'lucide-react';

const MapLibreMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['hrad', 'hradisko', 'zamok']);
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'terrain' | 'streets'>('satellite');

  const typeColors = {
    hrad: '#e74c3c',
    hradisko: '#f39c12',
    zamok: '#9b59b6'
  };

  const typeLabels = {
    hrad: 'Hrad',
    hradisko: 'Hradisko',
    zamok: 'Zámok'
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Vytvorenie mapy s OSM tiles
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(mapStyle),
      center: [19.5, 48.7], // Stred Slovenska
      zoom: 7,
      pitch: 0,
      bearing: 0,
      antialias: true,
      maxPitch: 85
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);

      if (map.current) {
        // Add 3D terrain
        map.current.addSource('terrainSource', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256
        });

        map.current.setTerrain({
          source: 'terrainSource',
          exaggeration: 1.5
        });

        // Sky
        map.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        addMarkers();
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update terrain when 3D is toggled
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (is3DEnabled) {
      map.current.setTerrain({
        source: 'terrainSource',
        exaggeration: 1.5
      });
      map.current.setPitch(60);
    } else {
      map.current.setTerrain(null);
      map.current.setPitch(0);
    }
  }, [is3DEnabled, mapLoaded]);

  // Update style when changed
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    map.current.setStyle(getMapStyle(mapStyle));

    // Re-add terrain after style change
    map.current.once('styledata', () => {
      if (map.current) {
        map.current.addSource('terrainSource', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256
        });

        if (is3DEnabled) {
          map.current.setTerrain({
            source: 'terrainSource',
            exaggeration: 1.5
          });
        }

        addMarkers();
      }
    });
  }, [mapStyle, mapLoaded]);

  // Get map style configuration
  function getMapStyle(style: 'satellite' | 'terrain' | 'streets') {
    const baseStyle = {
      version: 8 as const,
      sources: {},
      layers: [] as any[],
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
    };

    if (style === 'satellite') {
      return {
        ...baseStyle,
        sources: {
          'satellite': {
            type: 'raster' as const,
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [{
          id: 'satellite',
          type: 'raster' as const,
          source: 'satellite'
        }]
      };
    } else if (style === 'terrain') {
      return {
        ...baseStyle,
        sources: {
          'terrain': {
            type: 'raster' as const,
            tiles: [
              'https://tile.opentopomap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: 'OpenTopoMap'
          }
        },
        layers: [{
          id: 'terrain',
          type: 'raster' as const,
          source: 'terrain'
        }]
      };
    } else {
      return {
        ...baseStyle,
        sources: {
          'osm': {
            type: 'raster' as const,
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [{
          id: 'osm',
          type: 'raster' as const,
          source: 'osm'
        }]
      };
    }
  }

  // Add markers to map
  const addMarkers = () => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const filteredData = hradiskaData.filter(hradisko => {
      const matchesType = selectedTypes.includes(hradisko.type);
      const matchesSearch = hradisko.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           hradisko.kraj.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });

    filteredData.forEach(hradisko => {
      // Create marker element
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '32px';
      el.style.height = '42px';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';

      // Create SVG pin
      el.innerHTML = `
        <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-${hradisko.name.replace(/\s/g, '')}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#shadow-${hradisko.name.replace(/\s/g, '')})">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
                  fill="${typeColors[hradisko.type]}"
                  stroke="${hradisko.unesco ? '#fbbf24' : '#ffffff'}"
                  stroke-width="${hradisko.unesco ? '3' : '2'}"/>
            <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
            ${hradisko.unesco ? '<text x="16" y="20" text-anchor="middle" font-size="14" fill="#fbbf24">★</text>' : ''}
          </g>
        </svg>
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2) translateY(-4px)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="font-family: Georgia, serif; min-width: 200px; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #7d4f1d;">
            ${hradisko.name}
            ${hradisko.unesco ? ' <span style="color: gold;">★</span>' : ''}
          </h3>
          <p style="margin: 4px 0; font-size: 13px; color: #666;">
            <strong>Typ:</strong> ${typeLabels[hradisko.type]}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #666;">
            <strong>Obdobie:</strong> ${hradisko.rok}
          </p>
          <p style="margin: 4px 0; font-size: 13px; color: #666;">
            <strong>Okres:</strong> ${hradisko.okres}
          </p>
        </div>
      `);

      // Create marker
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(hradisko.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        setSelectedHradisko(hradisko);
        if (map.current) {
          map.current.flyTo({
            center: hradisko.coordinates,
            zoom: 13,
            pitch: 60,
            duration: 2000
          });
        }
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

  const toggle3DTerrain = () => {
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
    const hrady = hradiskaData.filter(h => selectedTypes.includes(h.type));
    if (hrady.length === 0 || !map.current) return;

    const random = hrady[Math.floor(Math.random() * hrady.length)];
    setSelectedHradisko(random);

    map.current.flyTo({
      center: random.coordinates,
      zoom: 14,
      pitch: 60,
      duration: 2500
    });
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="relative w-full h-[700px] bg-stone-900 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Header Panel */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-stone-900/95 to-stone-900/80 backdrop-blur-sm border-b border-stone-700/50 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-stone-100 mb-3 flex items-center gap-2">
            🗺️ Interaktívna 3D mapa hradísk Slovenska
            <span className="text-xs text-emerald-400">(MapLibre GL - Open Source)</span>
          </h2>

          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Vyhľadať hradisko, okres alebo kraj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-800/80 border border-stone-700 rounded text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>

              <button
                onClick={() => setMapStyle(mapStyle === 'satellite' ? 'terrain' : mapStyle === 'terrain' ? 'streets' : 'satellite')}
                className="px-4 py-2 bg-stone-800/80 hover:bg-stone-700 border border-stone-700 rounded text-stone-100 flex items-center gap-2 text-sm transition-colors"
                title="Zmeniť štýl mapy"
              >
                <Layers className="w-4 h-4" />
                {mapStyle === 'satellite' ? '🛰️' : mapStyle === 'terrain' ? '🏔️' : '🗺️'}
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 border border-amber-600 rounded text-white flex items-center gap-2 text-sm transition-colors"
                title="Náhodný hrad"
              >
                <Shuffle className="w-4 h-4" />
                Náhodný
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
              <h3 className="text-stone-100 mb-3 text-sm">Filtrovať podľa typu:</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(typeLabels).map(([type, label]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
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
                Zobrazených: {hradiskaData.filter(h =>
                  selectedTypes.includes(h.type) &&
                  (h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   h.kraj.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length} / {hradiskaData.length} lokalít
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/95 backdrop-blur-sm border border-stone-700 rounded p-4 max-w-xs">
        <h3 className="text-stone-100 mb-3 text-sm">Legenda:</h3>
        <div className="space-y-2">
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: typeColors[type as keyof typeof typeColors] }}
              />
              <span className="text-stone-300 text-xs">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-stone-700">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="text-stone-300 text-xs">UNESCO pamiatka</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedHradisko && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-stone-100 mb-1 text-2xl">
                    {selectedHradisko.name}
                    {selectedHradisko.unesco && <span className="text-yellow-400 ml-2">★ UNESCO</span>}
                  </h2>
                  <span
                    className="inline-block px-3 py-1 rounded text-xs text-white"
                    style={{ backgroundColor: typeColors[selectedHradisko.type] }}
                  >
                    {typeLabels[selectedHradisko.type]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHradisko(null)}
                  className="p-2 hover:bg-stone-800 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <p className="text-stone-300 leading-relaxed text-base">
                  {selectedHradisko.description}
                </p>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-800">
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Obdobie vzniku:</p>
                    <p className="text-stone-200">{selectedHradisko.rok}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Súčasný stav:</p>
                    <p className="text-stone-200">{selectedHradisko.stav}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Okres:</p>
                    <p className="text-stone-200">{selectedHradisko.okres}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Kraj:</p>
                    <p className="text-stone-200">{selectedHradisko.kraj}</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Nadmorská výška:</p>
                    <p className="text-stone-200">{selectedHradisko.nadmorskaVyska} m n.m.</p>
                  </div>
                  <div>
                    <p className="text-stone-500 text-xs mb-1">Súradnice:</p>
                    <p className="text-stone-200 text-xs">
                      {selectedHradisko.coordinates[1].toFixed(4)}°N, {selectedHradisko.coordinates[0].toFixed(4)}°E
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="flex-1 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors"
                  >
                    Zavrieť
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Badge */}
      <div className="absolute bottom-4 right-4 z-10 bg-emerald-600/95 backdrop-blur-sm rounded px-3 py-2 shadow-lg">
        <p className="text-white text-xs font-semibold">
          ✨ 3D Mapa
        </p>
        <p className="text-emerald-100 text-xs">
          MapLibre GL (Open Source)
        </p>
      </div>
    </div>
  );
};

export default MapLibreMap;
