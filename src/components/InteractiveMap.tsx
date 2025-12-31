'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Filter, X, Crown, Sword, Shield, Church, Mountain, BookOpen, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

// Site types with icons
const siteTypes = [
  { id: 'velka-morava', label: 'Veľká Morava', icon: Crown, color: '#d97706' },
  { id: 'keltske', label: 'Keltské', icon: Sword, color: '#059669' },
  { id: 'slovanske', label: 'Slovanské', icon: Shield, color: '#dc2626' },
  { id: 'svatyne', label: 'Svätyne', icon: Church, color: '#7c3aed' },
  { id: 'refugia', label: 'Refúgiá', icon: Mountain, color: '#0891b2' },
  { id: 'ostatne', label: 'Ostatné', icon: BookOpen, color: '#ca8a04' },
];

// Mock data for fortified sites with coordinates
const mockSites = [
  { id: 1, name: 'Devín', lat: 48.1733, lng: 16.9789, type: 'velka-morava', description: 'Významné hradisko na sútoku Dunaja a Moravy' },
  { id: 2, name: 'Bratislava - hradný vrch', lat: 48.1426, lng: 17.1000, type: 'velka-morava', description: 'Pravdepodobné sídlo nitrianskeho kniežaťa' },
  { id: 3, name: 'Pobedim', lat: 48.3431, lng: 18.4294, type: 'keltske', description: 'Keltské oppidium zo staršej doby železnej' },
  { id: 4, name: 'Havránok', lat: 49.1381, lng: 19.5500, type: 'keltske', description: 'Keltské hradisko s kultovým miestom' },
  { id: 5, name: 'Bojná', lat: 48.6500, lng: 18.1833, type: 'velka-morava', description: 'Významné militárne centrum Veľkej Moravy' },
  { id: 6, name: 'Ducové', lat: 48.8000, lng: 17.6667, type: 'slovanske', description: 'Slovanské hradisko z 9. storočia' },
  { id: 7, name: 'Nitrianska Blatnica', lat: 48.8500, lng: 18.2000, type: 'refugia', description: 'Útočiskové hradisko' },
  { id: 8, name: 'Smolenice-Molpír', lat: 48.5167, lng: 17.4333, type: 'keltske', description: 'Rozsiahle keltské oppidium' },
  { id: 9, name: 'Pohanská', lat: 48.8000, lng: 16.9167, type: 'velka-morava', description: 'Jeden z najdôležitejších archeologických lokalít Veľkej Moravy' },
  { id: 10, name: 'Zemplín', lat: 48.8833, lng: 21.9000, type: 'slovanske', description: 'Významné slovanské hradisko východného Slovenska' },
  { id: 11, name: 'Majcichov', lat: 48.3500, lng: 17.8000, type: 'slovanske', description: 'Slovanské hradisko s importovanou keramikou' },
  { id: 12, name: 'Spišské Tomášovce', lat: 48.9667, lng: 20.5333, type: 'svatyne', description: 'Kultové miesto s unikátnymi nálezmi' },
];

// Slovakia bounds
const SLOVAKIA_BOUNDS = {
  minLat: 47.7,
  maxLat: 49.6,
  minLng: 16.8,
  maxLng: 22.6,
};

// Convert lat/lng to canvas coordinates
function latLngToPoint(lat: number, lng: number, width: number, height: number, zoom: number, panX: number, panY: number) {
  const x = ((lng - SLOVAKIA_BOUNDS.minLng) / (SLOVAKIA_BOUNDS.maxLng - SLOVAKIA_BOUNDS.minLng)) * width;
  const y = ((SLOVAKIA_BOUNDS.maxLat - lat) / (SLOVAKIA_BOUNDS.maxLat - SLOVAKIA_BOUNDS.minLat)) * height;
  
  return {
    x: (x * zoom) + panX,
    y: (y * zoom) + panY
  };
}

export function InteractiveMap() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(siteTypes.map(t => t.id));
  const [showFilters, setShowFilters] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSite, setHoveredSite] = useState<typeof mockSites[0] | null>(null);
  const [selectedSite, setSelectedSite] = useState<typeof mockSites[0] | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (mapRef.current) {
        setMapSize({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const filteredSites = mockSites.filter(site => selectedTypes.includes(site.type));

  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter(t => t !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const selectAll = () => {
    setSelectedTypes(siteTypes.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTypes([]);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
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

  const handleSiteClick = (site: typeof mockSites[0]) => {
    setSelectedSite(selectedSite?.id === site.id ? null : site);
  };

  return (
    <div className="w-full bg-stone-100 dark:bg-stone-900 relative">
      {/* Section Header */}
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 
            className="text-amber-950 dark:text-amber-100 mb-4 uppercase tracking-wide relative inline-block" 
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.15em',
              borderBottom: '2px solid',
              borderColor: 'rgb(120 53 15 / 0.3)',
              paddingBottom: '0.5rem',
            }}
          >
            Interaktívna Mapa Hradísk
          </h2>
          <p 
            className="text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mt-4" 
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic'
            }}
          >
            Preskúmajte archeologické lokality na interaktívnej mape Slovenska
          </p>
        </motion.div>
      </div>

      {/* Map Container */}
      <div className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-900/30"
        >
          {/* Controls */}
          <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomIn}
              className="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-lg border-2 border-amber-600/30 hover:border-amber-600/60 transition-colors"
            >
              <ZoomIn className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleZoomOut}
              className="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-lg border-2 border-amber-600/30 hover:border-amber-600/60 transition-colors"
            >
              <ZoomOut className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleResetView}
              className="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-lg border-2 border-amber-600/30 hover:border-amber-600/60 transition-colors"
            >
              <Maximize2 className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </motion.button>
          </div>

          {/* Filter Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="absolute top-4 right-4 z-[1000] bg-white dark:bg-stone-800 rounded-xl px-4 py-3 shadow-lg border-2 border-amber-600/30 flex items-center gap-2 hover:border-amber-600/60 transition-colors"
          >
            <Filter className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            <span className="text-sm text-stone-700 dark:text-stone-300" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
              Filtre ({selectedTypes.length}/{siteTypes.length})
            </span>
          </motion.button>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-4 right-4 z-[1001] bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-2xl border-4 border-amber-900/30 w-80"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-amber-900 dark:text-amber-100 uppercase tracking-wide" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    letterSpacing: '0.1em'
                  }}>
                    Typy Hradísk
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={selectAll}
                    className="flex-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    Všetky
                  </button>
                  <button
                    onClick={deselectAll}
                    className="flex-1 px-3 py-1.5 bg-stone-300 dark:bg-stone-600 text-stone-700 dark:text-stone-200 rounded-lg text-sm hover:bg-stone-400 dark:hover:bg-stone-500 transition-colors"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    Žiadne
                  </button>
                </div>

                {/* Type Checkboxes */}
                <div className="space-y-3">
                  {siteTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedTypes.includes(type.id);
                    
                    return (
                      <motion.button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-600/50'
                            : 'bg-stone-50 dark:bg-stone-700 border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-600 border-amber-600'
                              : 'bg-white dark:bg-stone-600 border-stone-400'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <Icon className="w-5 h-5" style={{ color: type.color }} />
                        <span className="text-sm text-stone-700 dark:text-stone-300" style={{
                          fontFamily: 'Georgia, "Times New Roman", serif'
                        }}>
                          {type.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t-2 border-stone-200 dark:border-stone-700">
                  <p className="text-sm text-stone-600 dark:text-stone-400 text-center" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic'
                  }}>
                    Zobrazených lokalít: {filteredSites.length} z {mockSites.length}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map SVG */}
          <div 
            ref={mapRef}
            className="h-[600px] bg-stone-200 dark:bg-stone-800 relative overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Slovakia Map Background */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1756478054877-3556f34c8652?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbG92YWtpYSUyMG1hcCUyMHRvcG9ncmFwaGljfGVufDF8fHx8MTc2MjI0NDM0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.4,
                filter: 'sepia(0.3) brightness(1.1)'
              }}
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-900/20 pointer-events-none" />
            
            <svg 
              width={mapSize.width} 
              height={mapSize.height}
              className="absolute inset-0"
              style={{ userSelect: 'none' }}
            >
              {/* Slovakia shape outline (detailed SVG path) */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Simplified Slovakia border */}
                <path
                  d="M 120,280 L 140,260 L 160,250 L 190,240 L 220,235 L 250,230 L 280,228 L 310,227 L 340,228 L 370,230 L 400,235 L 430,242 L 460,250 L 490,260 L 520,272 L 550,285 L 580,300 L 610,318 L 638,335 L 665,352 L 690,368 L 710,380 L 725,388 L 735,392 L 740,395 L 740,400 L 738,410 L 735,420 L 730,430 L 722,440 L 710,450 L 695,458 L 678,465 L 658,470 L 635,473 L 610,475 L 583,475 L 555,473 L 527,470 L 500,465 L 472,458 L 445,450 L 418,440 L 392,428 L 367,415 L 343,400 L 320,385 L 298,370 L 277,355 L 257,340 L 238,325 L 220,310 L 203,295 L 187,282 L 172,270 L 158,260 L 145,252 L 133,246 L 122,242 L 115,240 L 110,240 L 108,245 L 107,252 L 108,260 L 110,268 L 115,275 Z"
                  fill="rgba(217, 119, 6, 0.08)"
                  stroke="rgba(217, 119, 6, 0.4)"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                />

                {/* Sites */}
                {filteredSites.map((site) => {
                  const point = latLngToPoint(site.lat, site.lng, mapSize.width, mapSize.height, 1, 0, 0);
                  const siteType = siteTypes.find(t => t.id === site.type);
                  const isHovered = hoveredSite?.id === site.id;
                  const isSelected = selectedSite?.id === site.id;
                  
                  return (
                    <g key={site.id}>
                      {/* Marker glow */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="20"
                          fill={siteType?.color}
                          opacity="0.2"
                          className="animate-pulse"
                        />
                      )}
                      
                      {/* Marker */}
                      <g
                        onMouseEnter={() => setHoveredSite(site)}
                        onMouseLeave={() => setHoveredSite(null)}
                        onClick={() => handleSiteClick(site)}
                        style={{ cursor: 'pointer' }}
                        className="transition-transform hover:scale-110"
                      >
                        {/* Pin shape */}
                        <path
                          d={`M ${point.x} ${point.y - 30} 
                             C ${point.x - 10} ${point.y - 30} ${point.x - 15} ${point.y - 25} ${point.x - 15} ${point.y - 15}
                             C ${point.x - 15} ${point.y - 5} ${point.x} ${point.y} ${point.x} ${point.y}
                             C ${point.x} ${point.y} ${point.x + 15} ${point.y - 5} ${point.x + 15} ${point.y - 15}
                             C ${point.x + 15} ${point.y - 25} ${point.x + 10} ${point.y - 30} ${point.x} ${point.y - 30} Z`}
                          fill={siteType?.color}
                          stroke="white"
                          strokeWidth="2"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
                        />
                        
                        {/* Inner circle */}
                        <circle
                          cx={point.x}
                          cy={point.y - 15}
                          r="5"
                          fill="white"
                          opacity="0.9"
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredSite && !selectedSite && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-stone-800 rounded-xl p-4 shadow-xl border-2 border-amber-900/20 max-w-xs pointer-events-none z-[999]"
                >
                  <h4 className="text-amber-900 dark:text-amber-100 mb-1" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    letterSpacing: '0.05em'
                  }}>
                    {hoveredSite.name}
                  </h4>
                  <p className="text-sm text-stone-600 dark:text-stone-400" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif'
                  }}>
                    {hoveredSite.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected Site Detail */}
            <AnimatePresence>
              {selectedSite && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-2xl border-4 border-amber-900/30 max-w-md w-full z-[1000]"
                >
                  <button
                    onClick={() => setSelectedSite(null)}
                    className="absolute top-4 right-4 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-start gap-3 mb-4">
                    {(() => {
                      const Icon = siteTypes.find(t => t.id === selectedSite.type)?.icon || MapPin;
                      const color = siteTypes.find(t => t.id === selectedSite.type)?.color;
                      return (
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${color}20`, border: `2px solid ${color}` }}
                        >
                          <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="text-amber-900 dark:text-amber-100 mb-1" style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        letterSpacing: '0.05em'
                      }}>
                        {selectedSite.name}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400" style={{
                        fontFamily: 'Georgia, "Times New Roman", serif'
                      }}>
                        {siteTypes.find(t => t.id === selectedSite.type)?.label}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-stone-600 dark:text-stone-400 mb-4" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif'
                  }}>
                    {selectedSite.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400" style={{
                    fontFamily: 'Georgia, "Times New Roman", serif'
                  }}>
                    <MapPin className="w-4 h-4" />
                    <span>{selectedSite.lat.toFixed(4)}°N, {selectedSite.lng.toFixed(4)}°E</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 border-amber-900/20">
            <h4 className="text-sm text-amber-900 dark:text-amber-100 mb-2 uppercase tracking-wide" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.1em'
            }}>
              Legenda
            </h4>
            <div className="space-y-2">
              {siteTypes.filter(type => selectedTypes.includes(type.id)).map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.id} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: type.color }}
                    />
                    <Icon className="w-4 h-4" style={{ color: type.color }} />
                    <span className="text-xs text-stone-700 dark:text-stone-300" style={{
                      fontFamily: 'Georgia, "Times New Roman", serif'
                    }}>
                      {type.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 dark:bg-stone-800/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg border-2 border-amber-900/20">
            <p className="text-xs text-stone-600 dark:text-stone-400" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic'
            }}>
              Ťahajte mapu • Kliknite na marker pre detail
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
