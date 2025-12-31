'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArticleCard } from '../components/ArticleCard';
import { mockArticles } from '../data/mock-data';

const categories = [
  { value: 'all', label: 'Všetko' },
  { value: 'vyskum', label: 'Výskum' },
  { value: 'historia', label: 'História' },
  { value: 'metodika', label: 'Metodika' },
  { value: 'aktuality', label: 'Aktuality' },
];

export function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredArticles =
    selectedCategory === 'all'
      ? mockArticles
      : mockArticles.filter((a) => a.category === selectedCategory);

  return (
    <div id="main-content" className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <h1
              className="mb-4"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#1f1a12' /* WCAG AAA - 13.5:1 */
              }}
            >
              Blog
            </h1>
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#2d2418' /* WCAG AAA - 11.2:1 */
              }}
            >
              Výskumy, objavy, metodika a aktuality zo sveta slovenskej
              archeológie. Odborné články pripravené skúsenými archeológmi.
            </p>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-16 z-40">
        <div className="container">
          <nav className="flex gap-2 overflow-x-auto py-4" aria-label="Kategórie článkov">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-2 rounded-xl whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-amber-700 text-white shadow-md'
                    : 'bg-amber-50 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-stone-700'
                }`}
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  color: selectedCategory === cat.value ? '#ffffff' : '#2d2418'
                }}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Articles grid */}
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <ArticleCard article={article} />
            </motion.div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📰</span>
            </div>
            <h3
              className="mb-2"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#1f1a12' /* WCAG AAA - 13.5:1 */
              }}
            >
              Žiadne články
            </h3>
            <p
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#4a3f2f' /* WCAG AAA - 7.1:1 */
              }}
            >
              V tejto kategórii zatiaľ nie sú publikované žiadne články.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
