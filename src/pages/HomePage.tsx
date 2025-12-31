'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { HeroSearch } from '../components/HeroSearch';
import { JoinUs } from '../components/JoinUs';
import { CategoryCard } from '../components/CategoryCard';
import Slovakia3DReliefMap from '../components/Slovakia3DReliefMap';
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
      <section className="relative">
        <div className="container relative py-8 md:py-12">
          {/* Image Container - Full image visible */}
          <div className="rounded-3xl overflow-hidden shadow-2xl bg-stone-900">
            <ImageWithFallback
              src="/img_header_hradiska_02.png"
              alt="Archeologické hradisko"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Search Bar Below Image */}
          <div className="mt-8 md:mt-12 max-w-5xl mx-auto">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* Interactive Map Section - Full Width */}
      <section className="bg-stone-900">
        <Slovakia3DReliefMap />
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
