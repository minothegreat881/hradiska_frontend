'use client';

import { useState } from 'react';
import { MapPin, Calendar, Layers, CheckCircle2, ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { mockSites, periods, siteTypes } from '../data/mock-data';
import { MapView } from '../components/MapView';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

type Tab = 'overview' | 'findings' | 'images' | 'bibliography' | 'map';

interface SiteDetailPageProps {
  siteSlug: string;
}

export function SiteDetailPage({ siteSlug }: SiteDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const site = mockSites.find((s) => s.slug === siteSlug);

  if (!site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-stone-900 dark:text-stone-100 mb-4">
            Lokalita nenájdená
          </h1>
          <a
            href="/search"
            className="text-sky-600 dark:text-sky-400 hover:underline"
          >
            Späť na vyhľadávanie →
          </a>
        </div>
      </div>
    );
  }

  const periodLabels = site.period
    .map((p) => periods.find((period) => period.value === p)?.label)
    .filter(Boolean);

  const typeLabel = siteTypes.find((t) => t.value === site.type)?.label;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Prehľad' },
    { id: 'findings', label: 'Nálezy', count: site.findings.length },
    { id: 'images', label: 'Obrázky', count: 3 },
    { id: 'bibliography', label: 'Bibliografia', count: site.bibliography.length },
    { id: 'map', label: 'Mapa' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-cyan-500/20 to-amber-500/20 animate-pulse pointer-events-none"></div>

        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1753368226646-091196f6d706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwY2FzdGxlJTIwcnVpbnN8ZW58MXx8fHwxNzYyMTc5MDU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container relative">
          <div className="py-12 md:py-20">
            {/* Back button */}
            <a
              href="/search"
              className="inline-flex items-center gap-2 mb-6 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Späť na vyhľadávanie
            </a>

            {/* Title & badges */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {site.featured && (
                  <span className="px-3 py-1 bg-sky-600 text-white text-sm rounded-full">
                    Featured
                  </span>
                )}
                {site.excavated && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-white/90 dark:bg-stone-900/90 text-stone-700 dark:text-stone-300 text-sm rounded-full backdrop-blur-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Archeologicky skúmané
                  </span>
                )}
                <span className="px-3 py-1 bg-clay-100 dark:bg-clay-900/50 text-clay-700 dark:text-clay-300 text-sm rounded-full">
                  {typeLabel}
                </span>
              </div>

              <h1 className="text-stone-900 dark:text-stone-50">{site.name}</h1>

              <div className="flex flex-wrap gap-4 text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {site.district}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {periodLabels.join(', ')}
                </span>
                <span className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass border-b border-white/20 dark:border-white/10 sticky top-16 z-40 shadow-lg">
        <div className="container">
          <nav
            className="flex gap-1 overflow-x-auto"
            role="tablist"
            aria-label="Sekcie lokality"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                className={`px-6 py-4 whitespace-nowrap transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600 dark:bg-sky-400"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 md:py-12">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            id="panel-overview"
            role="tabpanel"
            className="max-w-4xl"
          >
            <div className="prose prose-stone dark:prose-invert article-content">
              <p>{site.description}</p>

              <h3>História výskumu</h3>
              <p>
                Lokalita bola predmetom systematického archeologického výskumu
                v priebehu posledných desaťročí. Výskumy priniesli významné
                poznatky o osídlení v jednotlivých obdobiach a prispeli k
                pochopeniu kultúrneho vývoja regiónu.
              </p>

              <h3>Význam lokality</h3>
              <p>
                {site.name} patrí medzi významné archeologické lokality na
                Slovensku. Nálezy z tejto lokality sú vystavené v múzeách a
                sú predmetom odborných štúdií. Lokalita prispieva k poznaniu
                dejín osídlenia a kultúrneho vývoja na našom území.
              </p>
            </div>
          </motion.div>
        )}

        {activeTab === 'findings' && (
          <motion.div
            key="findings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            id="panel-findings"
            role="tabpanel"
            className="max-w-4xl"
          >
            <h2 className="text-stone-900 dark:text-stone-50 mb-6">
              Archeologické nálezy
            </h2>
            <div className="grid gap-4">
              {site.findings.map((finding, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-clay-100 dark:bg-clay-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🏺</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-stone-900 dark:text-stone-100 mb-2">
                        {finding}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        Artefakt objavený počas archeologického výskumu lokality.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'images' && (
          <motion.div
            key="images"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            id="panel-images"
            role="tabpanel"
          >
            <h2 className="text-stone-900 dark:text-stone-50 mb-6">Galéria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'https://images.unsplash.com/photo-1753368226646-091196f6d706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwY2FzdGxlJTIwcnVpbnN8ZW58MXx8fHwxNzYyMTc5MDU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'https://images.unsplash.com/photo-1722837766894-ab72c7ed8507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoYWVvbG9naWNhbCUyMGV4Y2F2YXRpb258ZW58MXx8fHwxNzYyMTA5MTY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
                'https://images.unsplash.com/photo-1644176041496-393d63975fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3JpY2FsJTIwYXJ0aWZhY3QlMjBwb3R0ZXJ5fGVufDF8fHx8MTc2MjE3OTA1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
              ].map((img, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="aspect-video rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800"
                >
                  <ImageWithFallback
                    src={img}
                    alt={`${site.name} - obrázok ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'bibliography' && (
          <motion.div
            key="bibliography"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            id="panel-bibliography"
            role="tabpanel"
            className="max-w-4xl"
          >
            <h2 className="text-stone-900 dark:text-stone-50 mb-6">
              Bibliografia
            </h2>
            <div className="space-y-4">
              {site.bibliography.map((ref, idx) => (
                <div
                  key={idx}
                  className="p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-stone-700 dark:text-stone-300 flex-1">
                      {ref}
                    </p>
                    <button
                      className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors flex-shrink-0"
                      aria-label="Externý odkaz"
                    >
                      <ExternalLink className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            id="panel-map"
            role="tabpanel"
          >
            <h2 className="text-stone-900 dark:text-stone-50 mb-6">
              Poloha lokality
            </h2>
            <div className="h-[600px] rounded-2xl overflow-hidden">
              <MapView sites={[site]} selectedSiteId={site.id} />
            </div>
            <div className="mt-6 p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              <h3 className="text-stone-900 dark:text-stone-100 mb-4">
                GPS súradnice
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-stone-500 dark:text-stone-400 mb-1">
                    Zemepisná šírka
                  </div>
                  <div className="text-stone-900 dark:text-stone-100">
                    {site.coordinates.lat.toFixed(6)}°
                  </div>
                </div>
                <div>
                  <div className="text-stone-500 dark:text-stone-400 mb-1">
                    Zemepisná dĺžka
                  </div>
                  <div className="text-stone-900 dark:text-stone-100">
                    {site.coordinates.lng.toFixed(6)}°
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
