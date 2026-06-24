'use client';

import { motion } from 'motion/react';
import MapboxMap from '../components/MapboxMap';
import { InkEffect } from '../components/InkEffect';
import { ScrollReveal } from '../components/ScrollReveal';

export function MapPage() {
  return (
    <div className="min-h-screen parchment relative">
      {/* SVG Filters */}
      <InkEffect />
      
      {/* Decorative header border */}
      <div className="w-full h-3 bg-repeat-x relative z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>

      {/* Hero Section */}
      <section className="py-16 md:py-20 border-b-2 border-amber-900/20 relative">
        {/* InkSplotch dekorácia odstránená */}

        <div className="container relative z-10">
          <ScrollReveal direction="fade">
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mb-8 mx-auto"
              />

              <motion.h1 
                className="text-amber-950 dark:text-amber-100 mb-6 uppercase tracking-wide relative inline-block" 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.15em',
                  borderBottom: '3px solid',
                  borderColor: 'rgb(120 53 15 / 0.3)',
                  paddingBottom: '1rem',
                }}
              >
                Interaktívna Mapa Hradísk
              </motion.h1>

              <motion.p 
                className="text-lg text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mt-6" 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic'
                }}
              >
                Preskúmajte 50+ hradov, hradísk a zámkov na území Slovenska. 
                Každá lokalita obsahuje GPS súradnice, historický popis, 
                obdobie vzniku a aktuálny stav pamiatky.
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, delay: 0.5 }}
                className="h-0.5 w-48 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded-full mt-8 mx-auto"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Map Section - Full Width */}
      <section className="bg-stone-900">
        <MapboxMap />

        {/* Map Instructions */}
        <div className="container py-12">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="bg-stone-800/50 border border-amber-800/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-amber-100 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Vyhľadávanie
              </h3>
              <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Použite vyhľadávacie pole pre rýchle nájdenie hradiska podľa názvu, okresu alebo kraja
              </p>
            </div>

            <div className="bg-stone-800/50 border border-amber-800/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-amber-100 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Filtrovanie
              </h3>
              <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Filtrujte lokality podľa typu: hrady (červená), hradiská (oranžová), zámky (fialová)
              </p>
            </div>

            <div className="bg-stone-800/50 border border-amber-800/30 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-amber-100 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Interakcia
              </h3>
              <p className="text-sm text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                Kliknite na marker pre detail lokality, použite drag & drop a zoom pre navigáciu
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 border-t-2 border-amber-900/20 relative">
        {/* InkSplotch dekorácia odstránená */}

        <div className="container relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <h2 className="text-amber-950 dark:text-amber-100 mb-4 uppercase tracking-wide" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.15em'
              }}>
                Štatistiky Databázy
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 bg-stone-100 dark:bg-stone-900 border-2 border-amber-800/20 rounded-lg">
                <div className="text-4xl text-amber-700 dark:text-amber-500 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  50+
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400 uppercase tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Lokalít
                </div>
              </div>

              <div className="text-center p-6 bg-stone-100 dark:bg-stone-900 border-2 border-amber-800/20 rounded-lg">
                <div className="text-4xl text-amber-700 dark:text-amber-500 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  8
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400 uppercase tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Krajov
                </div>
              </div>

              <div className="text-center p-6 bg-stone-100 dark:bg-stone-900 border-2 border-amber-800/20 rounded-lg">
                <div className="text-4xl text-amber-700 dark:text-amber-500 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  3
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400 uppercase tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  UNESCO
                </div>
              </div>

              <div className="text-center p-6 bg-stone-100 dark:bg-stone-900 border-2 border-amber-800/20 rounded-lg">
                <div className="text-4xl text-amber-700 dark:text-amber-500 mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  12
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400 uppercase tracking-wide" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Storočí
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Decorative footer border */}
      <div className="w-full h-3 bg-repeat-x" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 12 L50 6 L75 12 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>
    </div>
  );
}
