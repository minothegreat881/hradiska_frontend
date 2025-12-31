"use client";

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { X, Mountain, ZoomIn, ZoomOut, RotateCcw, Shuffle } from 'lucide-react';

// Pre-made map styles with beautiful terrain
const MAP_STYLES = {
  // Stadia Stamen Terrain - beautiful relief style (FREE, no API key needed)
  stamenTerrain: 'https://tiles.stadiamaps.com/styles/stamen_terrain.json',

  // Stadia Outdoors - hiking/outdoor style with relief
  stadiaOutdoors: 'https://tiles.stadiamaps.com/styles/outdoors.json',

  // OpenFreeMap - completely free, no API
  liberty: 'https://tiles.openfreemap.org/styles/liberty',

  // Custom terrain style with hillshade
  customTerrain: {
    version: 8 as const,
    name: 'Slovakia Relief',
    sources: {
      'osm': {
        type: 'raster' as const,
        tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '© OpenTopoMap'
      },
      'hillshade': {
        type: 'raster-dem' as const,
        url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'osm-tiles',
        type: 'raster' as const,
        source: 'osm',
        minzoom: 0,
        maxzoom: 18
      }
    ],
    terrain: {
      source: 'hillshade',
      exaggeration: 1.3
    },
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
  }
};

const SlovakiaReliefMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [mapStyle, setMapStyle] = useState<'terrain' | 'outdoors' | 'topo'>('topo');
  const [is3D, setIs3D] = useState(true);

  const typeColors = {
    hrad: '#dc2626',
    hradisko: '#d97706',
    zamok: '#7c3aed'
  };

  const typeLabels = {
    hrad: 'Hrad',
    hradisko: 'Hradisko',
    zamok: 'Zámok'
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.customTerrain,
      center: [19.5, 48.7],
      zoom: 7.5,
      pitch: is3D ? 45 : 0,
      bearing: 0,
      maxPitch: 85,
      antialias: true
    });

    map.current.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-right');

    map.current.once('idle', () => {
      if (!map.current) return;

      // Add terrain/hillshade only if not already present
      try {
        if (!map.current.getSource('hillshade')) {
          map.current.addSource('hillshade', {
            type: 'raster-dem',
            url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
            tileSize: 256
          });
        }

        if (is3D) {
          map.current.setTerrain({
            source: 'hillshade',
            exaggeration: 1.3
          });
        }

        // Add sky layer if not present
        if (!map.current.getLayer('sky')) {
          map.current.addLayer({
            id: 'sky',
            type: 'sky',
            paint: {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15
            }
          });
        }
      } catch (e) {
        console.warn('Failed to add terrain:', e);
      }

      addMarkers();
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Toggle 3D
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    try {
      if (is3D) {
        if (map.current.getSource('hillshade')) {
          map.current.setTerrain({
            source: 'hillshade',
            exaggeration: 1.3
          });
        }
        map.current.easeTo({ pitch: 45, duration: 1000 });
      } else {
        map.current.setTerrain(null);
        map.current.easeTo({ pitch: 0, duration: 1000 });
      }
    } catch (e) {
      console.warn('Failed to toggle 3D:', e);
    }
  }, [is3D]);

  const addMarkers = () => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    hradiskaData.forEach(hradisko => {
      const el = document.createElement('div');
      el.className = 'hradisko-marker';

      // Create castle/tower SVG icon
      const color = typeColors[hradisko.type];
      el.innerHTML = `
        <svg width="28" height="36" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow-${hradisko.name.replace(/\s/g, '')}" x="-50%" y="-20%" width="200%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.4"/>
            </filter>
          </defs>
          <g filter="url(#shadow-${hradisko.name.replace(/\s/g, '')})">
            <!-- Tower base -->
            <rect x="8" y="12" width="12" height="20" fill="${color}" rx="1"/>
            <!-- Tower roof -->
            <polygon points="14,4 6,14 22,14" fill="${color}"/>
            <!-- Battlements -->
            <rect x="6" y="12" width="4" height="4" fill="${color}"/>
            <rect x="18" y="12" width="4" height="4" fill="${color}"/>
            <!-- Window -->
            <rect x="12" y="18" width="4" height="5" fill="white" opacity="0.7" rx="2"/>
            <!-- Door -->
            <rect x="11" y="26" width="6" height="6" fill="#5c3317" rx="1"/>
            ${hradisko.unesco ? `
              <!-- UNESCO star -->
              <circle cx="22" cy="8" r="5" fill="#fbbf24"/>
              <text x="22" y="11" text-anchor="middle" font-size="8" fill="white">★</text>
            ` : ''}
          </g>
        </svg>
      `;

      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2) translateY(-4px)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new maplibregl.Popup({
        offset: 25,
        closeButton: false,
        className: 'hradisko-popup'
      }).setHTML(`
        <div style="font-family: Georgia, serif; padding: 8px; min-width: 180px;">
          <h3 style="margin: 0 0 6px; font-size: 15px; color: #7d4f1d; font-weight: 600;">
            ${hradisko.name}
            ${hradisko.unesco ? '<span style="color: #fbbf24; margin-left: 4px;">★</span>' : ''}
          </h3>
          <div style="display: flex; gap: 8px; margin-bottom: 6px;">
            <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">
              ${typeLabels[hradisko.type]}
            </span>
          </div>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            ${hradisko.okres} • ${hradisko.nadmorskaVyska}m
          </p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(hradisko.coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedHradisko(hradisko);
        map.current?.flyTo({
          center: hradisko.coordinates,
          zoom: 12,
          pitch: is3D ? 60 : 0,
          duration: 2000
        });
      });

      markersRef.current.push(marker);
    });
  };

  const resetView = () => {
    map.current?.flyTo({
      center: [19.5, 48.7],
      zoom: 7.5,
      pitch: is3D ? 45 : 0,
      bearing: 0,
      duration: 1500
    });
  };

  const randomHrad = () => {
    const random = hradiskaData[Math.floor(Math.random() * hradiskaData.length)];
    setSelectedHradisko(random);
    map.current?.flyTo({
      center: random.coordinates,
      zoom: 13,
      pitch: is3D ? 60 : 0,
      duration: 2000
    });
  };

  const changeStyle = () => {
    if (!map.current) return;

    const styles = ['topo', 'terrain', 'outdoors'] as const;
    const currentIndex = styles.indexOf(mapStyle);
    const nextStyle = styles[(currentIndex + 1) % styles.length];
    setMapStyle(nextStyle);

    let styleUrl: string | object;
    switch (nextStyle) {
      case 'terrain':
        styleUrl = MAP_STYLES.stamenTerrain;
        break;
      case 'outdoors':
        styleUrl = MAP_STYLES.stadiaOutdoors;
        break;
      default:
        styleUrl = MAP_STYLES.customTerrain;
    }

    map.current.setStyle(styleUrl);

    map.current.once('idle', () => {
      try {
        if (map.current && !map.current.getSource('hillshade')) {
          map.current.addSource('hillshade', {
            type: 'raster-dem',
            url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
            tileSize: 256
          });
        }
        if (is3D && map.current) {
          map.current.setTerrain({ source: 'hillshade', exaggeration: 1.3 });
        }
      } catch (e) {
        console.warn('Failed to add terrain after style change:', e);
      }
      addMarkers();
    });
  };

  return (
    <div className="relative w-full h-[700px] bg-stone-900 rounded-xl overflow-hidden border border-stone-700">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-stone-900/90 backdrop-blur-sm rounded-lg p-3 border border-stone-700">
          <h2 className="text-amber-100 text-lg font-serif flex items-center gap-2 mb-2">
            <Mountain className="w-5 h-5 text-amber-500" />
            Mapa hradísk Slovenska
          </h2>
          <p className="text-stone-400 text-xs">
            {hradiskaData.length} lokalít • Relief mapa
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIs3D(!is3D)}
            className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
              is3D ? 'bg-amber-600 text-white' : 'bg-stone-800 text-stone-300'
            }`}
          >
            <Mountain className="w-4 h-4" />
            3D
          </button>

          <button
            onClick={changeStyle}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm"
          >
            {mapStyle === 'topo' ? '🏔️' : mapStyle === 'terrain' ? '🗺️' : '🥾'}
          </button>

          <button
            onClick={randomHrad}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm flex items-center gap-2"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={resetView}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-stone-900/90 backdrop-blur-sm border border-stone-700 rounded-lg p-3">
        <h3 className="text-amber-100 text-xs font-semibold mb-2">Legenda</h3>
        <div className="space-y-1">
          {Object.entries(typeLabels).map(([type, label]) => (
            <div key={type} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: typeColors[type as keyof typeof typeColors] }}
              />
              <span className="text-stone-300 text-xs">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-stone-700">
            <span className="text-yellow-400 text-xs">★</span>
            <span className="text-stone-300 text-xs">UNESCO</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedHradisko && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-amber-100 text-2xl font-serif">
                    {selectedHradisko.name}
                    {selectedHradisko.unesco && <span className="text-yellow-400 ml-2">★</span>}
                  </h2>
                  <span
                    className="inline-block mt-2 px-3 py-1 rounded-full text-xs text-white"
                    style={{ backgroundColor: typeColors[selectedHradisko.type] }}
                  >
                    {typeLabels[selectedHradisko.type]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedHradisko(null)}
                  className="p-2 hover:bg-stone-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              <p className="text-stone-300 leading-relaxed mb-4">
                {selectedHradisko.description}
              </p>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-stone-800 text-sm">
                <div>
                  <p className="text-stone-500 text-xs">Obdobie</p>
                  <p className="text-stone-200">{selectedHradisko.rok}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Stav</p>
                  <p className="text-stone-200">{selectedHradisko.stav}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Okres</p>
                  <p className="text-stone-200">{selectedHradisko.okres}</p>
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Výška</p>
                  <p className="text-stone-200">{selectedHradisko.nadmorskaVyska} m</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedHradisko(null)}
                className="w-full mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
              >
                Zavrieť
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style indicator */}
      <div className="absolute bottom-4 right-4 z-10 bg-stone-900/80 backdrop-blur-sm rounded px-3 py-2">
        <p className="text-stone-400 text-xs">
          {mapStyle === 'topo' ? 'OpenTopoMap' : mapStyle === 'terrain' ? 'Stamen Terrain' : 'Stadia Outdoors'}
        </p>
      </div>
    </div>
  );
};

export default SlovakiaReliefMap;
