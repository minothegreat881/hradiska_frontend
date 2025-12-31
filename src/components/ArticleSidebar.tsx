'use client';

import { useEffect, useRef } from 'react';
import { MapPin, ChevronRight, ExternalLink } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Types
interface TimelineEvent {
  year: string;
  title: string;
  description?: string;
  type?: 'local' | 'global';
}

interface KeyFact {
  number?: number;
  title: string;
  description: string;
}

interface ArticleSidebarProps {
  article: {
    title: string;
    content: string;
    tags?: string[];
    keywords?: string[];
    bibliography?: string[];
    quotes?: Array<{ text: string; author: string }>;
    publishedAt?: string;
    category?: string;
  };
  relatedArticles?: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    coverImage: string;
  }>;
  coordinates?: { lat: number; lng: number };
  locationName?: string;
  timeline?: TimelineEvent[];
  keyFacts?: KeyFact[];
}

// Mini Map Component - Same as main map with 3D relief
function MiniMap({ coordinates, locationName }: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map with satellite style - SAME as main MapLibreMap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8 as const,
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
        }],
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
      },
      center: [coordinates.lng, coordinates.lat],
      zoom: 13,
      pitch: 60, // Same pitch as main map for 3D effect
      bearing: 0,
      antialias: true,
      maxPitch: 85,
      attributionControl: false // Hide attribution text
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl({
      visualizePitch: true
    }), 'top-right');

    // Add fullscreen control
    map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      if (map.current) {
        // Add 3D terrain - SAME as main map
        map.current.addSource('terrainSource', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256
        });

        map.current.setTerrain({
          source: 'terrainSource',
          exaggeration: 1.5
        });

        // Add sky layer - SAME as main map
        map.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15
          }
        });

        // Create marker element - SAME style as main map
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '32px';
        el.style.height = '42px';
        el.style.cursor = 'pointer';
        el.style.transition = 'transform 0.2s';
        el.innerHTML = `
          <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow-mini" x="-50%" y="-50%" width="200%" height="200%">
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
            <g filter="url(#shadow-mini)">
              <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z"
                    fill="#f39c12"
                    stroke="#ffffff"
                    stroke-width="2"/>
              <circle cx="16" cy="16" r="6" fill="white" opacity="0.9"/>
            </g>
          </svg>
        `;

        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.2) translateY(-4px)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
        });

        // Create popup - SAME style as main map
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
          className: 'custom-popup'
        }).setHTML(`
          <div style="font-family: Georgia, serif; min-width: 150px; padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #7d4f1d;">
              ${locationName}
            </h3>
            <p style="margin: 0; font-size: 12px; color: #666;">
              <strong>Typ:</strong> Hradisko
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
              ${coordinates.lat.toFixed(4)}°N, ${coordinates.lng.toFixed(4)}°E
            </p>
          </div>
        `);

        // Add marker
        new maplibregl.Marker({ element: el })
          .setLngLat([coordinates.lng, coordinates.lat])
          .setPopup(popup)
          .addTo(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [coordinates, locationName]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-stone-200 dark:border-stone-600 shadow-md" style={{ height: '220px' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <a
        href="/mapa"
        className="absolute bottom-2 left-2 px-3 py-1.5 bg-stone-900/90 hover:bg-amber-700 text-white text-xs font-medium rounded-full flex items-center gap-1.5 transition-colors shadow-lg"
      >
        <MapPin className="w-3 h-3" />
        Zobraziť na mape
      </a>
      {/* 3D Badge - same as main map */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600/90 text-white text-xs font-semibold rounded shadow">
        3D Mapa
      </div>
    </div>
  );
}

export function ArticleSidebar({
  article,
  relatedArticles = [],
  timeline = [],
  keyFacts,
  coordinates = { lat: 48.5833, lng: 18.0333 }, // Bojná default
  locationName = 'Bojná'
}: ArticleSidebarProps & { coordinates?: { lat: number; lng: number }; locationName?: string }) {
  // Generate key facts from article data if not provided
  const facts: KeyFact[] = keyFacts || [
    { title: 'Obdobie', description: 'Veľkomoravské obdobie (9. storočie)' },
    { title: 'Lokalita', description: 'Západné Slovensko' },
    { title: 'Typ', description: article.category === 'vyskum' ? 'Archeologický výskum' : 'Historická lokalita' },
    { title: 'Význam', description: 'Národná kultúrna pamiatka' }
  ];

  return (
    <div className="space-y-0">
      {/* Location Map */}
      <h3 className="text-xl font-bold mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
        Lokalita
      </h3>
      <div className="mb-8">
        <MiniMap coordinates={coordinates} locationName={locationName} />
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 text-center">
          {locationName} • {coordinates.lat.toFixed(4)}°N, {coordinates.lng.toFixed(4)}°E
        </p>
      </div>

      {/* Key Facts - Clean Card Style */}
      {facts.length > 0 && (
        <>
          <h3 className="text-xl font-bold mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
            Kľúčové fakty
          </h3>
          <div className="space-y-3 mb-8">
            {facts.map((fact, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-stone-700/50 rounded-lg shadow-sm border border-stone-100 dark:border-stone-600">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {fact.number || index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    {fact.title}
                  </div>
                  <div className="text-sm text-stone-700 dark:text-stone-300 mt-0.5">
                    {fact.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Timeline - Clean Design */}
      {timeline.length > 0 && (
        <>
          <h3 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
            Časová os
          </h3>
          <div className="space-y-0 mb-8">
            {timeline.map((item, index) => (
              <div key={index} className="flex gap-4 group">
                {/* Year column */}
                <div className="w-14 flex-shrink-0 text-right">
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-500">
                    {item.year}
                  </span>
                </div>

                {/* Dot and line */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-amber-600" />
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[2rem] bg-stone-200 dark:bg-stone-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-200">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </>
      )}

      {/* Tags - Pill Style */}
      {(article.tags && article.tags.length > 0) && (
        <>
          <h3 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
            Témy
          </h3>
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.slice(0, 8).map((tag, index) => (
              <a
                key={index}
                href={`/?search=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-xs font-medium rounded-full border border-stone-200 dark:border-stone-600 hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all shadow-sm"
              >
                {tag}
              </a>
            ))}
          </div>
        </>
      )}

      {/* Related Articles - Card Style */}
      {relatedArticles.length > 0 && (
        <>
          <h3 className="text-xl font-bold mt-8 mb-4 pb-2 border-b border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100">
            Súvisiace články
          </h3>
          <div className="space-y-2">
            {relatedArticles.slice(0, 3).map((related) => (
              <a
                key={related.id}
                href={`/blog/${related.slug}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all group"
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-600">
                  <img
                    src={related.coverImage}
                    alt={related.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-stone-700 dark:text-stone-200 line-clamp-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {related.title}
                  </h4>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ArticleSidebar;
