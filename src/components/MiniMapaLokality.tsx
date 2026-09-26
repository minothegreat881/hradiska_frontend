'use client';

/**
 * MINI-MAPA LOKALITY v bočnom stĺpci článku.
 *
 * Vlastný súbor preto, že si so sebou nesie MapLibre — 274 kB, ktoré sa
 * predtým sťahovali pri KAŽDOM otvorení článku, aj keď mapa ostala pod
 * prehybom (na telefóne je bočný stĺpec až pod celým textom). Teraz sa
 * modul dotiahne až vtedy, keď sa k mape čitateľ priblíži.
 */

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function MiniMap({ coordinates, locationName }: { coordinates: { lat: number; lng: number }; locationName: string }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Create map with satellite style - SAME as main MapLibreMap
    map.current = new maplibregl.Map({
      /* MapLibre pomenúva plátno aj ovládanie po anglicky. Na slovenskej
         stránke to čítačka ohlási v cudzom jazyku. */
      locale: {
        'Map.Title': 'Mapa lokality',
        'NavigationControl.ZoomIn': 'Priblížiť',
        'NavigationControl.ZoomOut': 'Oddialiť',
        'NavigationControl.ResetBearing': 'Otočiť na sever',
        'FullscreenControl.Enter': 'Na celú obrazovku',
        'FullscreenControl.Exit': 'Zavrieť celú obrazovku',
        'Marker.Title': 'Značka lokality',
        'ScaleControl.Meters': 'm',
        'ScaleControl.Kilometers': 'km',
      },
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
          },
          // Transparent overlay: obce, rieky, cesty a ďalšie popisky nad satelitnou
          // snímkou — bez toho je mapa len "suchý" terén bez orientačných bodov.
          'labels': {
            type: 'raster' as const,
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri'
          }
        },
        layers: [
          {
            id: 'satellite',
            type: 'raster' as const,
            source: 'satellite'
          },
          {
            id: 'labels',
            type: 'raster' as const,
            source: 'labels'
          }
        ],
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
      {/* Tlačidlo „Zobraziť na mape" viedlo na /mapa — tá stránka je zrušená,
          takže by to bol odkaz do prázdna. Mapka v paneli ostáva, len už
          nikam neodkazuje. */}
      {/* 3D Badge - same as main map */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-emerald-600/90 text-white text-xs font-semibold rounded shadow">
        3D Mapa
      </div>
    </div>
  );
}

export default MiniMap;
