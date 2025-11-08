'use client';

import { useState } from 'react';
import { MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Site } from '../data/mock-data';

interface MapViewProps {
  sites: Site[];
  selectedSiteId?: string;
  onSiteSelect?: (siteId: string) => void;
}

export function MapView({ sites, selectedSiteId, onSiteSelect }: MapViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Group nearby sites for clustering (simplified)
  const clusters = groupInClusters(sites);

  return (
    <div
      className={`relative bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50' : 'h-full'
      }`}
    >
      {/* Map placeholder - ilustruje pozície lokalít */}
      <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-clay-200 via-stone-200 to-sky-100 dark:from-clay-900 dark:via-stone-900 dark:to-sky-950">
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Site markers */}
        <div className="absolute inset-0 p-8">
          {clusters.map((cluster, idx) => {
            const isSelected = cluster.sites.some(
              (s) => s.id === selectedSiteId
            );
            const position = calculatePosition(cluster, idx, clusters.length);

            return (
              <motion.div
                key={cluster.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
                className="absolute cursor-pointer"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() =>
                  onSiteSelect && onSiteSelect(cluster.sites[0].id)
                }
              >
                {cluster.count > 1 ? (
                  <ClusterMarker
                    count={cluster.count}
                    isSelected={isSelected}
                  />
                ) : (
                  <SiteMarker
                    site={cluster.sites[0]}
                    isSelected={isSelected}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 rounded-xl shadow-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            aria-label={isExpanded ? 'Zmenšiť mapu' : 'Zväčšiť mapu'}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="text-xs text-stone-600 dark:text-stone-400 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-sky-600" />
              <span>Lokalita</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-sky-600 ring-2 ring-sky-200 dark:ring-sky-800" />
              <span>Vybraná</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center text-white text-xs">
                3
              </div>
              <span>Cluster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ClusterMarkerProps {
  count: number;
  isSelected: boolean;
}

function ClusterMarker({ count, isSelected }: ClusterMarkerProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
        isSelected
          ? 'bg-sky-700 text-white ring-4 ring-sky-200 dark:ring-sky-800'
          : 'bg-sky-600 text-white hover:bg-sky-700'
      }`}
    >
      <span className="font-semibold">{count}</span>
    </motion.div>
  );
}

interface SiteMarkerProps {
  site: Site;
  isSelected: boolean;
}

function SiteMarker({ site, isSelected }: SiteMarkerProps) {
  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`transition-all ${
          isSelected ? 'ring-4 ring-sky-200 dark:ring-sky-800 rounded-full' : ''
        }`}
      >
        <MapPin
          className={`w-8 h-8 transition-colors ${
            isSelected
              ? 'text-sky-700 dark:text-sky-400'
              : 'text-sky-600 hover:text-sky-700'
          }`}
          fill="currentColor"
        />
      </motion.div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 pointer-events-none transition-opacity">
        <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 px-3 py-2 rounded-lg shadow-xl whitespace-nowrap text-sm">
          {site.name}
        </div>
      </div>
    </div>
  );
}

// Helper functions
interface Cluster {
  id: string;
  sites: Site[];
  count: number;
  centerLat: number;
  centerLng: number;
}

function groupInClusters(sites: Site[]): Cluster[] {
  // Simplified clustering - group by proximity (0.1 degree threshold)
  const clusters: Cluster[] = [];
  const processed = new Set<string>();

  sites.forEach((site) => {
    if (processed.has(site.id)) return;

    const nearby = sites.filter((s) => {
      if (processed.has(s.id)) return false;
      const distance = Math.sqrt(
        Math.pow(s.coordinates.lat - site.coordinates.lat, 2) +
          Math.pow(s.coordinates.lng - site.coordinates.lng, 2)
      );
      return distance < 0.1;
    });

    nearby.forEach((s) => processed.add(s.id));

    clusters.push({
      id: site.id,
      sites: nearby,
      count: nearby.length,
      centerLat:
        nearby.reduce((sum, s) => sum + s.coordinates.lat, 0) / nearby.length,
      centerLng:
        nearby.reduce((sum, s) => sum + s.coordinates.lng, 0) / nearby.length,
    });
  });

  return clusters;
}

function calculatePosition(
  cluster: Cluster,
  idx: number,
  total: number
): { x: number; y: number } {
  // Map Slovakia coordinates to percentage
  // Slovakia approx: lat 47.7-49.6, lng 16.8-22.6
  const latRange = [47.7, 49.6];
  const lngRange = [16.8, 22.6];

  const x =
    ((cluster.centerLng - lngRange[0]) / (lngRange[1] - lngRange[0])) * 100;
  const y =
    ((latRange[1] - cluster.centerLat) / (latRange[1] - latRange[0])) * 100;

  return {
    x: Math.max(10, Math.min(90, x)),
    y: Math.max(10, Math.min(90, y)),
  };
}
