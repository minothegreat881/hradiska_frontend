'use client';

import { motion } from 'motion/react';
import { ArticleCard } from '../components/ArticleCard';
import { hradiskaCategories } from '../data/categories';
import { useBlogPosts, useCategory } from '../hooks/useStrapi';
import { Crown, Scroll, Loader2 } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

interface CategoryPageProps {
  categorySlug: string;
}

export function CategoryPage({ categorySlug }: CategoryPageProps) {
  // Kurátorské dáta ku kategórii (obrázok, popis). Predtým sa brali z `mock-data`,
  // ktoré má neaktuálne slugy — pre `strazna-funkcia`, `3d-modely`, `odborne-texty`
  // a ďalšie sa nenašla zhoda a hlavička padala na generickú Unsplash fotku.
  const localCategory = hradiskaCategories.find(c => c.slug === categorySlug);

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
  // Kurátorský popis má prednosť — je písaný podľa toho, čo v kategórii reálne je.
  const categoryDescription = localCategory?.description || strapiCategory?.description || '';
  // Obrázok je z článku v tej istej kategórii, servírovaný zo Strapi médií.
  const STRAPI_URL = import.meta.env.PROD ? (typeof window !== 'undefined' ? window.location.origin + '/strapi' : '/strapi') : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');
  const categoryImage = localCategory ? `${STRAPI_URL}${localCategory.image}` : null;
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

  /* Skúška zatiaľ len pre jednu kategóriu: karty aj titulná fotografia
     dostanú prekrížené kopije a výraznejšie priblíženie pod kurzorom.
     Keď sa to osvedčí, dá sa znak doplniť ku každej kategórii; dovtedy
     tu stojí jeden slug, nie zoznam. */
  const skusobnyZnak = categorySlug === 'strazna-funkcia';

  return (
    <div className="min-h-screen parchment">
      {/* Hero — varianta 5A „Vľavo, vertikálny scrim" */}
      <section className="relative overflow-hidden">
        <div className="container relative" style={{ paddingTop: 22, paddingBottom: 40 }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Omrvinky (breadcrumbs): Domov › Kategória */}
            <nav aria-label="Omrvinky" style={{ marginBottom: 16 }}>
              <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, listStyle: 'none', margin: 0, padding: 0, fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '0.03em', color: 'var(--hr-clear-text)' }}>
                <li>
                  <a
                    href="/"
                    style={{ color: 'var(--hr-accent)', textDecoration: 'none', transition: 'color 150ms ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--hr-accent-soft)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--hr-accent)'; }}
                  >
                    Domov
                  </a>
                </li>
                <li aria-hidden="true" style={{ color: 'var(--hr-line-quiet)' }}>›</li>
                <li aria-current="page" style={{ color: 'var(--hr-body-2)' }}>{categoryName}</li>
              </ol>
            </nav>

            {/* Hero karta */}
            <div className={skusobnyZnak ? 'cat-hero cat-hero--znak' : 'cat-hero'}>
              {/* 1. Fotka */}
              <div
                className="ch-foto"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: categoryImage
                    ? `url("${categoryImage}") center 42% / cover no-repeat`
                    : 'var(--ch-fallback)',
                  backgroundColor: 'var(--ch-fallback)',
                }}
                role="img"
                aria-label={categoryName}
              />
              {/* Zlatý rám. Scrim ani vignette tu už nie sú — kryli kresbu
                  kvôli textu, ktorý na fotke nestojí. */}
              <div className="ch-frame" aria-hidden="true" />

              {skusobnyZnak && (
                <span className="ch-znak" aria-hidden="true">
                  <picture>
                    <source srcSet="/znak_kopije.webp" type="image/webp" />
                    <img src="/znak_kopije.png" alt="" width={560} height={320} decoding="async" />
                  </picture>
                </span>
              )}
            </div>

            {/* Vyhradený priestor pre text POD fotkou. Predtým ležal nadpis
                aj popis priamo na kresbe a polovicu jej zakrýval tmavý
                závoj; na papieri má text vlastné miesto a kresba ostáva
                celá. */}
            <div className="cat-uvod">
              <span className="cat-uvod-linka" aria-hidden="true" />
              <h1 className="cat-uvod-titul">{categoryName}</h1>
              {categoryDescription && (
                <p className="cat-uvod-popis">{categoryDescription}</p>
              )}
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
              <div>
                {/* Nadpis sekcie — bez ikony, Cinzel */}
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--clanky-title)',
                    fontSize: 38,
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    margin: 0,
                  }}
                >
                  Články a štúdie
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    color: 'var(--clanky-subtitle)',
                    fontSize: 19,
                    margin: '6px 0 0',
                  }}
                >
                  Odborné publikácie a výskum
                </p>

                {/* Zlatý predel — plný segment + doznievajúca linka */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '20px 0 34px',
                  }}
                >
                  <span style={{ width: 52, height: 2, background: 'var(--gold-accent)', flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'linear-gradient(90deg, var(--hr-line-quiet), transparent)',
                    }}
                  />
                </div>
              </div>
            </ScrollReveal>

            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: 26 }}
            >
              {/* Bez ScrollReveal zámerne: karty boli obalené v `<ScrollReveal delay={idx * 0.1}>`,
                  takže sa odkrývali postupne pri scrollovaní a každá ďalšia mala o 100 ms väčšie
                  oneskorenie — 20. dlaždica čakala 2 s, 40. štyri sekundy. Pri kategórii so 45
                  článkami to pôsobilo, že sa stránka donekonečna načítava. Zoznam sa má dať
                  prezerať naraz, nie sa odhaľovať. */}
              {categoryArticles.map((article) => (
                <ArticleCard key={article.id} article={article} stitok={false} znak={skusobnyZnak} />
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
                        <circle cx="10" cy="10" r="1" fill="var(--hr-accent-deep)" />
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
