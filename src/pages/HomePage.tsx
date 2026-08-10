'use client';

import { lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { HeroSearch } from '../components/HeroSearch';
// Verzia 2 nástenky („Zo života združenia", návrh 3a). Pôvodný `AktualityFeed`
// ostáva v repozitári — späť sa prepne zmenou tohto jedného importu.
import AktualityFeed from '../components/AktualityFeedV2';
import { JoinUs } from '../components/JoinUs';
import { CategoryCard } from '../components/CategoryCard';
import { hradiskaCategories } from '../data/categories';
import { InkEffect } from '../components/InkEffect';
import { ScrollReveal } from '../components/ScrollReveal';

// PERF: 3D mapa (Three.js + R3F + custom GLSL shader + SRTM) je najťažší bundle (~500KB) a najťažšia
// scene na GPU. Lazy-load + Suspense ju načítajú až keď sa skutočne potrebuje. Pôvodne bol klasický
// import na vrchu súboru — pre obnovu vráť statický `import Slovakia3DReliefMap from '...'` a odstráň
// lazy/Suspense wrapper.
const Slovakia3DReliefMap = lazy(() => import('../components/Slovakia3DReliefMap'));

export function HomePage() {
  return (
    <div className="min-h-screen parchment relative">
      {/* SVG Filters */}
      <InkEffect />

      {/* Decorative header border */}
      <motion.div 
        className="w-full h-3 bg-repeat-x relative z-10" 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></motion.div>

      {/* Hero Section with Image */}
      <section className="relative" style={{ zIndex: 30 }}>
        <div className="container relative pt-8 md:pt-12 pb-8 md:pb-16">
          {/* Image Container - Full image visible */}
          {/* Hlavička webu. `width`/`height` sú tam kvôli tomu, aby si prehliadač
              vedel miesto rezervovať ešte pred stiahnutím obrázka a stránka pod
              ním neposkočila. `fetchPriority=high` + bez `lazy`: je to najväčší
              prvok nad zlomom, čiže to, čo meria LCP. */}
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-stone-900">
            <picture>
              <source srcSet="/img_header_hradiska_03.webp" type="image/webp" />
              <img
                src="/img_header_hradiska_03.jpg"
                alt="Slovanské hradiská — pohľad na opevnenie a život na hradisku"
                width={1329}
                height={752}
                fetchPriority="high"
                decoding="async"
                className="w-full h-auto object-contain"
                style={{ display: 'block' }}
              />
            </picture>
          </div>

          {/* Search Bar Below Image – vycentrovaný v krémovom páse */}
          <div className="mt-6 md:mt-12 px-4 md:px-2">
            {/* Subtílny ozdobný oddeľovač – ladí s fleur-de-lis motívmi v sekcii mapy */}
            <div className="flex items-center justify-center gap-2 mb-4 opacity-60" aria-hidden="true">
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, #c4a574)' }} />
              <span style={{ color: '#c4a574', fontSize: 12, lineHeight: 1 }}>⚜</span>
              <span className="h-px w-12" style={{ background: 'linear-gradient(90deg, #c4a574, transparent)' }} />
            </div>
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Aktuality feed – kronika brigád, podujatí, obnov.
          v2: logo + pripnutý zápis, pás CELEJ kroniky s časovou osou, fotogaléria. */}
      <AktualityFeed />

      {/* Interactive Map Section - Full Width */}
      <section
        className="relative bg-stone-900"
        style={{
          zIndex: 5, // pod hero (z:30) aby search dropdown bol nad mapou
          // Plynulý prechod z krémovej do tmavej – tenká gold hairline + jemný shadow falloff
          boxShadow: 'inset 0 1px 0 rgba(196, 165, 116, 0.45), inset 0 -1px 0 rgba(196, 165, 116, 0.45), 0 -8px 16px -8px rgba(125, 79, 29, 0.18)',
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                width: '100%',
                height: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c4a574',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: 14,
                letterSpacing: '0.1em',
                background: '#1f1611',
              }}
            >
              ✦ Načítavam mapu...
            </div>
          }
        >
          <Slovakia3DReliefMap />
        </Suspense>
      </section>

      {/* Kategórie */}
      <section className="py-16 md:py-20 border-b-2 border-amber-900/20 relative">
        {/* InkSplotch dekorácie odstránené (vyzerali ako rendering chyba) */}

        <div className="container relative z-10">
          <ScrollReveal direction="fade">
            <div className="text-center mb-10 md:mb-12">
              <motion.h2
                className="uppercase tracking-wide"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.15em',
                  fontSize: 'clamp(24px, 3.4vw, 34px)',
                  color: '#2d1810',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Kategórie hradísk
              </motion.h2>
              {/* Zlatá ozdobná linka pod nadpisom */}
              <motion.div
                className="mx-auto mt-3"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                style={{
                  width: 56,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #a87437, transparent)',
                  transformOrigin: 'center',
                }}
              />
              <motion.p
                className="max-w-2xl mx-auto mt-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  color: '#7a6b56',
                  fontSize: 15,
                }}
              >
                Hradiská triedime podľa toho, čomu slúžili — od kniežacích sídel cez strážne
                body až po písomné pramene, z ktorých o nich vieme
              </motion.p>
            </div>
          </ScrollReveal>

          {/* Fixne 3 stĺpce na desktope, 2 na tablete, 1 na mobile */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
            style={{ gap: '36px 28px' }}
          >
            {hradiskaCategories.map((category, idx) => (
              <CategoryCard
                key={category.slug}
                category={{
                  // CategoryCard očakáva `value` (→ /category/<value>) a plnú URL obrázka.
                  value: category.slug,
                  label: category.label,
                  description: category.description,
                  detailedDescription: category.description,
                  icon: category.icon,
                  image: `${import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337')}${category.image}`,
                }}
                index={idx}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Join Us Section */}
      <JoinUs />

      {/* Decorative footer border */}
      <div className="w-full h-3 bg-repeat-x" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 12 L50 6 L75 12 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>
    </div>
  );
}
