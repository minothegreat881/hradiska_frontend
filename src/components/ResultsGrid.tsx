'use client';

import { motion } from 'motion/react';
import { Site } from '../data/mock-data';
import { SiteCard } from './SiteCard';

interface ResultsGridProps {
  sites: Site[];
  isLoading?: boolean;
}

export function ResultsGrid({ sites, isLoading = false }: ResultsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (sites.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sites.map((site, idx) => (
        <motion.div
          key={site.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <SiteCard site={site} />
        </motion.div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden animate-pulse">
      <div className="aspect-video bg-stone-200 dark:bg-stone-800" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
        <div className="h-4 bg-stone-200 dark:bg-stone-800 rounded w-1/2" />
        <div className="space-y-2">
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded" />
          <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-5/6" />
        </div>
        <div className="h-6 bg-stone-200 dark:bg-stone-800 rounded-full w-24" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-6">
        <span className="text-5xl">🔍</span>
      </div>
      <h3 className="text-stone-900 dark:text-stone-100 mb-2">
        Žiadne výsledky
      </h3>
      <p className="text-stone-600 dark:text-stone-400 max-w-md mb-6">
        Skúste upraviť filtre alebo použite iné kľúčové slová pri vyhľadávaní.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl transition-colors"
      >
        Obnoviť vyhľadávanie
      </button>
    </div>
  );
}
