'use client';

import { useState, useEffect } from 'react';
import { Map, Grid, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { FacetFilters } from '../components/FacetFilters';
import { ResultsGrid } from '../components/ResultsGrid';
import { MapView } from '../components/MapView';
import { FilterDrawer } from '../components/FilterDrawer';
import {
  mockSites,
  filterSites,
  Period,
  Region,
  SiteType,
} from '../data/mock-data';

type ViewMode = 'grid' | 'map' | 'split';

export function SearchPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedPeriods, setSelectedPeriods] = useState<Period[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<SiteType[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState<string>();

  const filteredSites = filterSites(mockSites, {
    period: selectedPeriods,
    region: selectedRegions,
    type: selectedTypes,
  });

  // Parse URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const period = params.get('period');
    const region = params.get('region');
    const type = params.get('type');

    if (period) setSelectedPeriods([period as Period]);
    if (region) setSelectedRegions([region as Region]);
    if (type) setSelectedTypes([type as SiteType]);
  }, []);

  const togglePeriod = (period: Period) => {
    setSelectedPeriods((prev) =>
      prev.includes(period)
        ? prev.filter((p) => p !== period)
        : [...prev, period]
    );
  };

  const toggleRegion = (region: Region) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const toggleType = (type: SiteType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearAllFilters = () => {
    setSelectedPeriods([]);
    setSelectedRegions([]);
    setSelectedTypes([]);
  };

  return (
    <div id="main-content" className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="glass border-b border-white/20 dark:border-white/10">
        <div className="container py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-stone-900 dark:text-stone-50 mb-1">
                Vyhľadávanie lokalít
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-400">
                {filteredSites.length}{' '}
                {filteredSites.length === 1
                  ? 'výsledok'
                  : filteredSites.length < 5
                  ? 'výsledky'
                  : 'výsledkov'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View mode switcher - desktop */}
              <div className="hidden lg:flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                  aria-label="Zobrazenie mriežky"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                  aria-label="Rozdelené zobrazenie"
                  aria-pressed={viewMode === 'split'}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                  }`}
                  aria-label="Zobrazenie mapy"
                  aria-pressed={viewMode === 'map'}
                >
                  <Map className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 gradient-primary hover:shadow-xl hover:shadow-violet-500/30 text-white rounded-xl transition-all duration-300 hover:scale-105"
              >
                <SlidersHorizontal className="w-5 h-5" />
                Filtre
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 glass rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl">
              <FacetFilters
                selectedPeriods={selectedPeriods}
                selectedRegions={selectedRegions}
                selectedTypes={selectedTypes}
                onPeriodToggle={togglePeriod}
                onRegionToggle={toggleRegion}
                onTypeToggle={toggleType}
                onClearAll={clearAllFilters}
                resultCount={filteredSites.length}
              />
            </div>
          </aside>

          {/* Results area */}
          <main className="flex-1 min-w-0">
            {viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ResultsGrid sites={filteredSites} />
              </motion.div>
            )}

            {viewMode === 'map' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="h-[calc(100vh-200px)]"
              >
                <MapView
                  sites={filteredSites}
                  selectedSiteId={selectedSiteId}
                  onSiteSelect={setSelectedSiteId}
                />
              </motion.div>
            )}

            {viewMode === 'split' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-6"
              >
                <div className="xl:h-[calc(100vh-200px)] xl:overflow-y-auto">
                  <ResultsGrid sites={filteredSites} />
                </div>
                <div className="h-[500px] xl:h-[calc(100vh-200px)] xl:sticky xl:top-24">
                  <MapView
                    sites={filteredSites}
                    selectedSiteId={selectedSiteId}
                    onSiteSelect={setSelectedSiteId}
                  />
                </div>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        selectedPeriods={selectedPeriods}
        selectedRegions={selectedRegions}
        selectedTypes={selectedTypes}
        onPeriodToggle={togglePeriod}
        onRegionToggle={toggleRegion}
        onTypeToggle={toggleType}
        onClearAll={clearAllFilters}
        resultCount={filteredSites.length}
      />
    </div>
  );
}
