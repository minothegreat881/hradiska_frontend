'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { HeroSearch } from '../components/HeroSearch';
import { JoinUs } from '../components/JoinUs';
import { CategoryCard } from '../components/CategoryCard';
import CustomMapSlovakia from '../components/CustomMapSlovakia';
import { categories } from '../data/mock-data';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ParticleEffect } from '../components/ParticleEffect';
import { InkEffect, InkSplotch } from '../components/InkEffect';
import { ScrollReveal } from '../components/ScrollReveal';

export function HomePage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="min-h-screen parchment relative">
      {/* SVG Filters */}
      <InkEffect />
      
      {/* Particle Effect */}
      <ParticleEffect />
      
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
      <section className="relative pb-96">
        <div className="container relative py-8 md:py-12">
          {/* Hero Card with Image Background */}
          <div className="relative rounded-3xl bg-stone-900 shadow-2xl" style={{ overflow: 'visible' }}>
            {/* Background Image with Parallax - has its own overflow */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <motion.div 
                className="absolute inset-0"
                style={{ y: heroY }}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1712186567189-161a80d881a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwaGlsbGZvcnQlMjBhcmNoYWVvbG9neXxlbnwxfHx8fDE3NjIyMDIyOTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Archeologické hradisko"
                  className="w-full h-full object-cover"
                />
                {/* Dramatic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/85 to-stone-950/70" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/95 via-stone-900/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-950/40" />
              </motion.div>
            </div>

            {/* Animated Particles */}
            <div className="absolute inset-0 opacity-40 rounded-3xl overflow-hidden pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -40, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 3,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative py-20 md:py-32 px-8 md:px-12 lg:px-16">
              <div className="max-w-5xl mx-auto text-center">
                {/* Decorative top line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                  className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mb-12 mx-auto"
                />

                {/* Main Title */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <h1 
                    className="mb-8 text-amber-50 tracking-tight"
                    style={{ 
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      letterSpacing: '0.05em',
                      textShadow: '3px 5px 10px rgba(0,0,0,0.7), 0 0 30px rgba(217, 119, 6, 0.3)',
                    }}
                  >
                    ARCHEOLOGICKÉ LOKALITY
                    <br />
                    <span className="text-amber-400 inline-block mt-3" style={{
                      textShadow: '2px 4px 8px rgba(0,0,0,0.8), 0 0 40px rgba(251, 191, 36, 0.4)',
                    }}>
                      Slovenska
                    </span>
                  </h1>
                </motion.div>

                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="max-w-3xl mx-auto mb-12"
                >
                  <p 
                    className="text-lg md:text-xl text-amber-100/90 leading-relaxed"
                    style={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      textShadow: '1px 2px 4px rgba(0,0,0,0.6)',
                    }}
                  >
                    Vedecká databáza hradísk, sídlisk a pohrebísk s detailnými informáciami o archeologických 
                    nálezoch, odbornou bibliografiou a geografickou lokalizáciou významných historických lokalít 
                    na území Slovenska od praveku po stredovek.
                  </p>
                </motion.div>

                {/* Search */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  <HeroSearch />
                </motion.div>

                {/* Decorative bottom line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.2, delay: 1 }}
                  className="h-0.5 w-48 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded-full mt-12 mx-auto"
                />
              </div>
            </div>

            {/* Bottom Wave Accent */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-3xl overflow-hidden"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 1.2 }}
            >
              <div className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 md:py-20 bg-stone-900">
        <div className="container">
          <ScrollReveal direction="fade">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-amber-100 mb-4 uppercase tracking-wide relative inline-block" 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.15em',
                  borderBottom: '2px solid',
                  borderColor: 'rgb(217 119 6 / 0.5)',
                  paddingBottom: '0.5rem',
                }}
              >
                3D Mapa Hradísk Slovenska
              </motion.h2>
              <motion.p 
                className="text-stone-400 max-w-2xl mx-auto mt-4" 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic'
                }}
              >
                Preskúmajte 50+ hradov, hradísk a zámkov s interaktívnou 3D mapou
              </motion.p>
            </div>
          </ScrollReveal>
          
          <CustomMapSlovakia />
        </div>
      </section>

      {/* Kategórie */}
      <section className="py-16 md:py-20 border-b-2 border-amber-900/20 relative">
        <InkSplotch className="top-10 right-10" size={150} />
        <InkSplotch className="bottom-20 left-10" size={120} />
        
        <div className="container relative z-10">
          <ScrollReveal direction="fade">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-amber-950 dark:text-amber-100 mb-4 uppercase tracking-wide relative inline-block" 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  letterSpacing: '0.15em',
                  borderBottom: '2px solid',
                  borderColor: 'rgb(120 53 15 / 0.3)',
                  paddingBottom: '0.5rem',
                }}
              >
                Kategórie Hradísk
              </motion.h2>
              <motion.p 
                className="text-stone-600 dark:text-stone-400 max-w-2xl mx-auto mt-4" 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic'
                }}
              >
                Preskúmajte archeologické lokality podľa ich historickej funkcie a významu
              </motion.p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, idx) => (
              <CategoryCard key={category.value} category={category} index={idx} />
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
