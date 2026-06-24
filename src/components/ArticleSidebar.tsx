'use client';

import React, { useEffect, useRef } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
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
        // 3D terrain a sky layer odstránené — MapLibre demotiles nepokrýva Slovensko (404)
        // a 'type: sky' je Mapbox-only feature.

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
              ${coordinates.lat.toFixed(4)}° N · ${coordinates.lng.toFixed(4)}° E
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

// Shared design tokens for sidebar cards
const cardStyle: React.CSSProperties = {
  background: '#fffdf8',
  border: '1px solid rgba(196,165,116,0.4)',
  borderRadius: 12,
  boxShadow: '0 1px 2px rgba(70,40,20,0.06), 0 4px 12px rgba(70,40,20,0.05)',
  padding: 16,
  marginBottom: 20,
};

const cardTitleStyle: React.CSSProperties = {
  fontFamily: 'Georgia, serif',
  fontSize: 13,
  fontWeight: 600,
  color: '#a87437',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 12,
  marginTop: 0,
};

export function ArticleSidebar({
  article,
  relatedArticles = [],
  timeline = [],
  keyFacts,
  coordinates,
  locationName,
}: ArticleSidebarProps) {
  // Key facts — NO default fallback. If empty, card is hidden.
  const facts: KeyFact[] = keyFacts || [];

  // Show location card only if we have both coordinates AND a name
  const hasLocation = !!coordinates && !!locationName && locationName.trim().length > 0;
  const capitalizedName = hasLocation
    ? locationName!.charAt(0).toUpperCase() + locationName!.slice(1).toLowerCase()
    : '';

  return (
    <div>
      {/* Location Card — only shown if coordinates + name are provided */}
      {hasLocation && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Lokalita</h3>
          <MiniMap coordinates={coordinates!} locationName={capitalizedName} />
          <div style={{ marginTop: 10 }}>
            <h4
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                color: '#2d1810',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {capitalizedName}
            </h4>
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                color: '#8b7a5e',
                margin: 0,
                marginTop: 4,
              }}
            >
              {coordinates!.lat.toFixed(4)}° N · {coordinates!.lng.toFixed(4)}° E
            </p>
          </div>
        </div>
      )}

      {/* Key Facts — only if there are real facts */}
      {facts.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Kľúčové fakty</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {facts.map((fact, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #a87437 0%, #7d4f1d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontFamily: 'Georgia, serif',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 1px 2px rgba(70,40,20,0.15)',
                  }}
                >
                  {fact.number || index + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#a87437',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {fact.title}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 14,
                      color: '#2d2418',
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    {fact.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Časová os</h3>
          <div>
            {timeline.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    flexShrink: 0,
                    textAlign: 'right',
                    fontFamily: 'Georgia, serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#7d4f1d',
                    paddingTop: 1,
                  }}
                >
                  {item.year}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#a87437',
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  {index < timeline.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: '2rem',
                        background: 'rgba(196,165,116,0.4)',
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, paddingBottom: 12 }}>
                  <div
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 14,
                      color: '#2d2418',
                      fontWeight: 600,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: 12,
                        color: '#6b5d4d',
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Témy</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {article.tags.slice(0, 8).map((tag, index) => (
              <a
                key={index}
                href={`/?search=${encodeURIComponent(tag)}`}
                style={{
                  display: 'inline-block',
                  padding: '5px 12px',
                  background: 'rgba(196,165,116,0.10)',
                  border: '1px solid rgba(196,165,116,0.45)',
                  color: '#7d4f1d',
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 999,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(196,165,116,0.22)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(196,165,116,0.10)';
                }}
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Súvisiace články</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {relatedArticles.slice(0, 3).map((related) => (
              <a
                key={related.id}
                href={`/blog/${related.slug}`}
                className="group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 8,
                  borderRadius: 10,
                  border: '1px solid rgba(196,165,116,0.25)',
                  textDecoration: 'none',
                  background: '#fffdf8',
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'rgba(196,165,116,0.15)',
                  }}
                >
                  <img
                    src={related.coverImage}
                    alt={related.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    className="group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: 14,
                      color: '#2d2418',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    className="group-hover:text-amber-800"
                  >
                    {related.title}
                  </h4>
                </div>
                <ChevronRight
                  className="group-hover:translate-x-1 transition-all"
                  style={{ width: 16, height: 16, color: '#a87437', flexShrink: 0 }}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleSidebar;
