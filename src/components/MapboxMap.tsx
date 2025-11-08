"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { Search, Filter, Maximize2, RotateCcw, Mountain, Shuffle, X } from 'lucide-react';

// DÔLEŽITÉ: Nahraďte 'YOUR_MAPBOX_TOKEN' vaším skutočným Mapbox API kľúčom
// Získajte ho na: https://account.mapbox.com/access-tokens/
mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';

const MapboxMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupsRef = useRef<mapboxgl.Popup[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['hrad', 'hradisko', 'zamok']);
  const [is3DEnabled, setIs3DEnabled] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [19.5, 48.7], // Stred Slovenska
      zoom: 7,
      pitch: 0,
      bearing: 0,
      antialias: true
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
      
      map.current!.setTerrain({ source: 'mapbox-dem', exaggeration: 1.7 });
      
      // Add sky layer
      map.current!.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15
        }
      });

      addMarkers();
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
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = typeColors[hradisko.type];
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'transform 0.2s';
      
      if (hradisko.unesco) {
        el.style.border = '3px solid gold';
        el.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6)';
      }

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.3)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      }).setHTML(`
        <div style="font-family: system-ui; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">
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
            <strong>Stav:</strong> ${hradisko.stav}
          </p>
          <button 
            onclick="window.showDetailedInfo('${hradisko.name}')"
            style="
              margin-top: 10px;
              padding: 6px 12px;
              background: ${typeColors[hradisko.type]};
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              width: 100%;
            "
          >
            Viac informácií
          </button>
        </div>
      `);

      popupsRef.current.push(popup);

      // Create marker
      const marker = new mapboxgl.Marker({ element: el })
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

  // Global function for detailed info button
  useEffect(() => {
    (window as any).showDetailedInfo = (name: string) => {
      const hradisko = hradiskaData.find(h => h.name === name);
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
    const hrady = hradiskaData.filter(h => selectedTypes.includes(h.type));
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
    <div className="relative w-full h-[700px] bg-stone-900">
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
                type="text"
                placeholder="Vyhľadať hradisko, okres alebo kraj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

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
            <span className="w-4 h-4 rounded-full border-2 border-yellow-400 shadow-lg bg-amber-600" />
            <span className="text-stone-300 text-xs">UNESCO pamiatka</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedHradisko && (
        <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-stone-100 mb-1">
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
                <p className="text-stone-300 leading-relaxed">
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
                    onClick={() => {
                      if (map.current) {
                        map.current.flyTo({
                          center: selectedHradisko.coordinates,
                          zoom: 15,
                          pitch: 65,
                          duration: 2000
                        });
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
                  >
                    Priblížiť na mape
                  </button>
                  <button
                    onClick={() => setSelectedHradisko(null)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors"
                  >
                    Zavrieť
                  </button>
                </div>
              </div>
            </div>
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
