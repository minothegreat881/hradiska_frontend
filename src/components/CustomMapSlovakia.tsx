"use client";

import { useEffect, useRef, useState } from 'react';
import { hradiskaData, Hradisko } from '../data/hradiska';
import { Search, Filter, RotateCcw, Shuffle, X, MapPin, ZoomIn, ZoomOut } from 'lucide-react';

const CustomMapSlovakia = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['hrad', 'hradisko', 'zamok']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHradisko, setSelectedHradisko] = useState<Hradisko | null>(null);
  const [hoveredHradisko, setHoveredHradisko] = useState<Hradisko | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  // Slovakia bounds: roughly 16.8°E to 22.6°E, 47.7°N to 49.6°N
  const slovakiaBounds = {
    minLng: 16.8,
    maxLng: 22.6,
    minLat: 47.7,
    maxLat: 49.6
  };

  const mapWidth = 800;
  const mapHeight = 600;

  // Convert GPS coordinates to pixel position
  const coordsToPixels = (lng: number, lat: number) => {
    const x = ((lng - slovakiaBounds.minLng) / (slovakiaBounds.maxLng - slovakiaBounds.minLng)) * mapWidth;
    const y = mapHeight - ((lat - slovakiaBounds.minLat) / (slovakiaBounds.maxLat - slovakiaBounds.minLat)) * mapHeight;
    return { x, y };
  };

  const filteredData = hradiskaData.filter(hradisko => {
    const matchesType = selectedTypes.includes(hradisko.type);
    const matchesSearch = hradisko.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hradisko.okres.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         hradisko.kraj.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 0.3, 3));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };

  const randomHrad = () => {
    const hrady = filteredData;
    if (hrady.length === 0) return;
    
    const random = hrady[Math.floor(Math.random() * hrady.length)];
    setSelectedHradisko(random);
    
    // Center on the selected hradisko
    const { x, y } = coordsToPixels(random.coordinates[0], random.coordinates[1]);
    const centerX = (mapRef.current?.clientWidth || mapWidth) / 2;
    const centerY = (mapRef.current?.clientHeight || mapHeight) / 2;
    
    setPan({
      x: centerX - x * zoom,
      y: centerY - y * zoom
    });
    setZoom(2);
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
      {/* Header Panel */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-stone-900/95 to-stone-900/80 backdrop-blur-sm border-b border-stone-700/50 p-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-stone-100 mb-3">
            Interaktívna mapa hradísk Slovenska
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
                Zobrazených: {filteredData.length} / {hradiskaData.length} lokalít
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1756478054877-3556f34c8652?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbG92YWtpYSUyMG1hcCUyMHRvcG9ncmFwaGljfGVufDF8fHx8MTc2MjI0NDM0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Dark overlay for better marker visibility */}
        <div className="absolute inset-0 bg-stone-900/60" />
        
        {/* SVG for markers */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(217, 119, 6, 0.1)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Markers */}
          {filteredData.map((hradisko, index) => {
            const { x, y } = coordsToPixels(hradisko.coordinates[0], hradisko.coordinates[1]);
            const isHovered = hoveredHradisko?.name === hradisko.name;
            const isSelected = selectedHradisko?.name === hradisko.name;
            
            return (
              <g key={index}>
                {/* Marker circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 12 : isHovered ? 10 : 8}
                  fill={typeColors[hradisko.type]}
                  stroke={hradisko.unesco ? '#fbbf24' : '#ffffff'}
                  strokeWidth={hradisko.unesco ? 3 : 2}
                  className="pointer-events-auto cursor-pointer transition-all"
                  style={{
                    filter: isHovered || isSelected ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setHoveredHradisko(hradisko);
                  }}
                  onMouseLeave={() => setHoveredHradisko(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedHradisko(hradisko);
                  }}
                />
                
                {/* Pin icon for selected */}
                {isSelected && (
                  <text
                    x={x}
                    y={y - 18}
                    textAnchor="middle"
                    fill="#fbbf24"
                    className="text-xs pointer-events-none"
                  >
                    📍
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredHradisko && !selectedHradisko && (
          <div 
            className="absolute pointer-events-none z-20 bg-stone-900/95 border border-amber-600/50 rounded-lg p-3 shadow-xl"
            style={{
              left: `${coordsToPixels(hoveredHradisko.coordinates[0], hoveredHradisko.coordinates[1]).x * zoom + pan.x + 20}px`,
              top: `${coordsToPixels(hoveredHradisko.coordinates[0], hoveredHradisko.coordinates[1]).y * zoom + pan.y - 20}px`,
              transform: 'translateY(-100%)'
            }}
          >
            <h4 className="text-amber-100 mb-1">
              {hoveredHradisko.name}
              {hoveredHradisko.unesco && <span className="text-yellow-400 ml-1">★</span>}
            </h4>
            <p className="text-stone-400 text-xs">{typeLabels[hoveredHradisko.type]}</p>
            <p className="text-stone-400 text-xs">{hoveredHradisko.okres}, {hoveredHradisko.kraj}</p>
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="p-3 bg-stone-900/95 hover:bg-stone-800 border border-stone-700 rounded text-stone-100 transition-colors shadow-lg"
          title="Priblížiť"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="p-3 bg-stone-900/95 hover:bg-stone-800 border border-stone-700 rounded text-stone-100 transition-colors shadow-lg"
          title="Oddialiť"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
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
            <span className="w-4 h-4 rounded-full border-2 border-yellow-400 shadow-lg bg-amber-600" />
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
                      const { x, y } = coordsToPixels(selectedHradisko.coordinates[0], selectedHradisko.coordinates[1]);
                      const centerX = (mapRef.current?.clientWidth || mapWidth) / 2;
                      const centerY = (mapRef.current?.clientHeight || mapHeight) / 2;
                      
                      setPan({
                        x: centerX - x * 2,
                        y: centerY - y * 2
                      });
                      setZoom(2);
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
    </div>
  );
};

export default CustomMapSlovakia;
