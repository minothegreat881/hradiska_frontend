'use client';

import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { FacetFilters } from './FacetFilters';
import { Period, Region, SiteType } from '../data/mock-data';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPeriods: Period[];
  selectedRegions: Region[];
  selectedTypes: SiteType[];
  onPeriodToggle: (period: Period) => void;
  onRegionToggle: (region: Region) => void;
  onTypeToggle: (type: SiteType) => void;
  onClearAll: () => void;
  resultCount: number;
}

export function FilterDrawer({
  isOpen,
  onClose,
  selectedPeriods,
  selectedRegions,
  selectedTypes,
  onPeriodToggle,
  onRegionToggle,
  onTypeToggle,
  onClearAll,
  resultCount,
}: FilterDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-stone-950 rounded-t-2xl shadow-2xl max-h-[85vh] overflow-hidden"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
          <h2 className="text-stone-900 dark:text-stone-100">Filtre</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
            aria-label="Zavrieť filtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          <FacetFilters
            selectedPeriods={selectedPeriods}
            selectedRegions={selectedRegions}
            selectedTypes={selectedTypes}
            onPeriodToggle={onPeriodToggle}
            onRegionToggle={onRegionToggle}
            onTypeToggle={onTypeToggle}
            onClearAll={onClearAll}
            resultCount={resultCount}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
          <button
            onClick={onClose}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors"
          >
            Zobraziť {resultCount} {resultCount === 1 ? 'výsledok' : resultCount < 5 ? 'výsledky' : 'výsledkov'}
          </button>
        </div>
      </motion.div>
    </>
  );
}
