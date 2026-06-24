'use client';

import { motion } from 'motion/react';
import { ArticleCard } from '../components/ArticleCard';
import { categories, Category } from '../data/mock-data';
import { useBlogPosts, useCategory } from '../hooks/useStrapi';
import { BookOpen, ArrowLeft, Crown, Scroll, Loader2 } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface CategoryPageProps {
  categorySlug: string;
}

export function CategoryPage({ categorySlug }: CategoryPageProps) {
  // Get category info from local data (for UI like image, icon)
  const localCategory = categories.find(c => c.value === categorySlug);

  // Fetch category from Strapi
  const { category: strapiCategory, loading: categoryLoading } = useCategory(categorySlug);

  // Fetch articles for this category from Strapi
  const { posts: strapiArticles, loading: articlesLoading, error } = useBlogPosts({
    categorySlug: categorySlug,
    pageSize: 50,
  });

  const isLoading = categoryLoading || articlesLoading;

  // Use Strapi category name if available, fallback to local
  const categoryName = strapiCategory?.name || localCategory?.label || categorySlug;
  const categoryDescription = strapiCategory?.description || localCategory?.description || '';
  const categoryImage = localCategory?.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200';
  const categoryIcon = localCategory?.icon || '📜';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen parchment flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-amber-700 mx-auto mb-4" />
          </motion.div>
          <p className="text-amber-800 dark:text-amber-200">Načítavam články...</p>
        </div>
      </div>
    );
  }

  // If no category found in Strapi and no local category
  if (!strapiCategory && !localCategory) {
    return (
      <div className="container py-24 text-center">
        <h1 className="text-stone-900 dark:text-stone-50 mb-4">Kategória nebola nájdená</h1>
        <a href="/" className="text-amber-700 dark:text-amber-400 hover:underline">
          Návrat na domovskú stránku
        </a>
      </div>
    );
  }

  // Use Strapi articles, or empty array if error/none
  const categoryArticles = strapiArticles || [];

  return (
    <div className="min-h-screen parchment">
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden">
        <div className="container relative py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back button */}
            <motion.a
              href="/"
              className="inline-flex items-center gap-2 mb-8 group"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: 'var(--color-sepia-link, #8b4513)',
                fontSize: 14,
                fontWeight: 500,
                textDecoration: 'none',
              }}
              whileHover={{ x: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="border-b border-transparent group-hover:border-current transition-colors">
                Späť na domovskú stránku
              </span>
            </motion.a>

            {/* Main header with image */}
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: '#1f1a12',
                boxShadow: '0 10px 28px rgba(20,15,10,0.25), 0 20px 48px rgba(20,15,10,0.18)',
                border: '1px solid rgba(196,165,116,0.28)',
              }}
            >
              {/* Background Image */}
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <ImageWithFallback
                  src={categoryImage}
                  alt={categoryName}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay — darker on left where text sits, image visible on right */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to right, rgba(20,15,10,0.92) 0%, rgba(20,15,10,0.78) 35%, rgba(20,15,10,0.45) 65%, rgba(20,15,10,0.20) 100%)',
                  }}
                />
                {/* Subtle bottom darkening */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(20,15,10,0.55) 0%, rgba(20,15,10,0) 50%)',
                  }}
                />
              </motion.div>

              {/* Animated particles overlay */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative py-16 md:py-24 px-8 md:px-12 lg:px-16">
                <div className="max-w-4xl">
                  {/* Category badge */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mb-6"
                  >
                    <span
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs backdrop-blur-sm"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        fontStyle: 'italic',
                        background: 'rgba(31,26,18,0.55)',
                        color: '#fef9f0',
                        border: '1px solid rgba(255,255,255,0.35)',
                      }}
                    >
                      <Scroll className="w-3 h-3" />
                      Kategória
                    </span>
                  </motion.div>

                  {/* Title with decorative element */}
                  <div className="mb-6">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-1 w-20 bg-gradient-to-r from-amber-500 to-amber-700 rounded-full mb-6"
                    />
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      className="text-amber-50 mb-2 tracking-tight"
                      style={{
                        textShadow: '2px 4px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      {categoryName}
                    </motion.h1>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="h-0.5 w-32 bg-gradient-to-r from-amber-600 to-transparent rounded-full"
                    />
                  </div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-amber-100/90 text-lg md:text-xl max-w-2xl leading-relaxed mb-8"
                    style={{
                      textShadow: '1px 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {categoryDescription}
                  </motion.p>

                  {/* Stats bar */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                    className="flex flex-wrap items-center gap-4"
                  >
                    <div
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        background: 'rgba(31,26,18,0.55)',
                        border: '1px solid rgba(255,255,255,0.35)',
                        color: '#fef9f0',
                      }}
                    >
                      <BookOpen className="w-4 h-4" style={{ color: '#f4c87a' }} />
                      <span style={{ fontSize: 13 }}>
                        <strong>{categoryArticles.length}</strong>{' '}
                        {categoryArticles.length === 1
                          ? 'článok'
                          : categoryArticles.length < 5
                          ? 'články'
                          : 'článkov'}
                      </span>
                    </div>

                    {/* Decorative scroll indicator */}
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="hidden md:flex items-center gap-2 px-4 py-3 text-amber-300/80"
                    >
                      <Scroll className="w-4 h-4" />
                      <span className="text-sm">Posúvajte nadol</span>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Bottom decorative wave */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                <div className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Decorative divider with scroll */}
      <div className="relative py-8">
        <div className="container">
          <div className="flex items-center justify-center gap-4">
            <motion.div
              className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-700/40"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />
            <Scroll className="w-6 h-6 text-amber-700/60 dark:text-amber-500/60" />
            <motion.div
              className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-700/40"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <section className="py-8">
          <div className="container">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
              <p className="text-red-700 dark:text-red-300">
                Nepodarilo sa načítať články. Skúste to prosím neskôr.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Articles Section */}
      {categoryArticles.length > 0 && (
        <section className="py-12 md:py-16 relative">
          {/* Section background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-50/20 to-transparent dark:via-orange-950/10 pointer-events-none" />

          <div className="container relative">
            <ScrollReveal>
              <div className="mb-10">
                {/* Section title with ornaments */}
                <div className="flex items-center gap-4 mb-2">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center shadow-lg relative overflow-hidden"
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {/* Shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, delay: 1 }}
                    />
                    <BookOpen className="w-6 h-6 text-amber-50 relative z-10" />
                  </motion.div>

                  <div>
                    <h2
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        color: 'var(--color-sepia-text, #2d2418)',
                        fontSize: 26,
                        fontWeight: 600,
                        letterSpacing: '0.01em',
                        margin: 0,
                      }}
                    >
                      Články a štúdie
                    </h2>
                    <p
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        color: 'var(--color-sepia-secondary, #4a3f2f)',
                        fontSize: 14,
                        margin: 0,
                        marginTop: 4,
                      }}
                    >
                      Odborné publikácie a výskum
                    </p>
                  </div>
                </div>

                {/* Decorative underline */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="h-0.5 bg-gradient-to-r from-amber-700 via-orange-500 to-transparent origin-left mt-4"
                />
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryArticles.map((article, idx) => (
                <ScrollReveal key={article.id} delay={idx * 0.1}>
                  <ArticleCard article={article} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {categoryArticles.length === 0 && !error && (
        <section className="py-16 md:py-24 relative">
          <div className="container">
            <ScrollReveal>
              <div className="max-w-2xl mx-auto">
                <div className="relative bg-gradient-to-br from-amber-50/80 via-orange-50/70 to-amber-100/80 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40 rounded-3xl border-2 border-amber-700/30 dark:border-amber-600/30 shadow-2xl overflow-hidden p-12 text-center backdrop-blur-sm">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <pattern id="empty-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill="#92400e" />
                      </pattern>
                      <rect width="100" height="100" fill="url(#empty-pattern)" />
                    </svg>
                  </div>

                  {/* Icon seal */}
                  <motion.div
                    className="relative mx-auto mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 flex items-center justify-center shadow-2xl border-4 border-amber-900/30 relative">
                      <div className="absolute inset-2 rounded-full border-2 border-amber-400/30" />
                      <span className="text-6xl relative z-10 drop-shadow-lg">
                        {categoryIcon}
                      </span>
                    </div>
                  </motion.div>

                  <h3 className="text-amber-950 dark:text-amber-50 mb-3">
                    Zatiaľ žiadny obsah
                  </h3>

                  <p className="text-amber-900/70 dark:text-amber-100/60 mb-8 leading-relaxed">
                    V tejto kategórii zatiaľ nemáme pridané žiadne články.
                    Pracujeme na pridávaní nového obsahu.
                  </p>

                  <motion.a
                    href="/"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-700 to-amber-800 text-amber-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-amber-900/20"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Crown className="w-5 h-5" />
                    Preskúmať iné kategórie
                  </motion.a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Bottom decorative element */}
      <div className="relative py-12">
        <div className="container">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="h-1 bg-gradient-to-r from-transparent via-amber-700/50 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
