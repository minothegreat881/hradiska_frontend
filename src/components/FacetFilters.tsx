'use client';

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { periods, regions, siteTypes, Period, Region, SiteType } from '../data/mock-data';

interface FacetFiltersProps {
  selectedPeriods: Period[];
  selectedRegions: Region[];
  selectedTypes: SiteType[];
  onPeriodToggle: (period: Period) => void;
  onRegionToggle: (region: Region) => void;
  onTypeToggle: (type: SiteType) => void;
  onClearAll: () => void;
  resultCount: number;
}

export function FacetFilters({
  selectedPeriods,
  selectedRegions,
  selectedTypes,
  onPeriodToggle,
  onRegionToggle,
  onTypeToggle,
  onClearAll,
  resultCount,
}: FacetFiltersProps) {
  const totalSelected = selectedPeriods.length + selectedRegions.length + selectedTypes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-stone-900 dark:text-stone-100">Filtre</h2>
          <div
            className="text-sm text-stone-500 dark:text-stone-400 mt-1"
            role="status"
            aria-live="polite"
          >
            {resultCount} {resultCount === 1 ? 'výsledok' : resultCount < 5 ? 'výsledky' : 'výsledkov'}
          </div>
        </div>
        {totalSelected > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-sky-600 dark:text-sky-400 hover:underline"
          >
            Zrušiť všetky
          </button>
        )}
      </div>

      {/* Obdobie */}
      <div>
        <h3 className="text-stone-700 dark:text-stone-300 mb-3">Obdobie</h3>
        <div className="flex flex-wrap gap-2">
          {periods.map((period) => {
            const isSelected = selectedPeriods.includes(period.value);
            return (
              <motion.button
                key={period.value}
                onClick={() => onPeriodToggle(period.value)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isSelected
                    ? 'gradient-primary text-white shadow-lg shadow-violet-500/30 scale-105'
                    : 'glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10'
                }`}
                aria-pressed={isSelected}
              >
                {period.label}
                {isSelected && (
                  <span className="ml-2 inline-block">
                    <X className="w-3 h-3 inline" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Región */}
      <div>
        <h3 className="text-stone-700 dark:text-stone-300 mb-3">Región</h3>
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => {
            const isSelected = selectedRegions.includes(region.value);
            return (
              <motion.button
                key={region.value}
                onClick={() => onRegionToggle(region.value)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                    : 'glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10'
                }`}
                aria-pressed={isSelected}
              >
                {region.label}
                {isSelected && (
                  <span className="ml-2 inline-block">
                    <X className="w-3 h-3 inline" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Typ lokality */}
      <div>
        <h3 className="text-stone-700 dark:text-stone-300 mb-3">Typ lokality</h3>
        <div className="flex flex-wrap gap-2">
          {siteTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.value);
            return (
              <motion.button
                key={type.value}
                onClick={() => onTypeToggle(type.value)}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30 scale-105'
                    : 'glass border border-white/20 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10'
                }`}
                aria-pressed={isSelected}
              >
                {type.label}
                {isSelected && (
                  <span className="ml-2 inline-block">
                    <X className="w-3 h-3 inline" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active filters summary - for mobile */}
      {totalSelected > 0 && (
        <div className="lg:hidden pt-4 border-t border-stone-200 dark:border-stone-800">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Aktívne filtre: <strong>{totalSelected}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
