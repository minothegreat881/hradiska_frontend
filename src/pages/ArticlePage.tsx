'use client';

import { ArrowLeft, Calendar, Clock, BookOpen, Tag, Scroll, Feather, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import { mockArticles } from '../data/mock-data';
import { ArticleCard } from '../components/ArticleCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { InkEffect, InkSplotch } from '../components/InkEffect';
import { ScrollReveal } from '../components/ScrollReveal';
import { SocialShare } from '../components/SocialShare';
import { CommentSection } from '../components/CommentSection';

interface ArticlePageProps {
  articleSlug: string;
}

export function ArticlePage({ articleSlug }: ArticlePageProps) {
  const article = mockArticles.find((a) => a.slug === articleSlug);

  if (!article) {
    return (
      <div className="min-h-screen parchment flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-amber-950 dark:text-amber-100 mb-4" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Článok nenájdený
          </h1>
          <a
            href="/blog"
            className="text-amber-700 dark:text-amber-400 hover:underline"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            Späť na blog →
          </a>
        </div>
      </div>
    );
  }

  const relatedArticles = mockArticles
    .filter((a) => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  const categoryLabels: Record<string, string> = {
    vyskum: 'Výskum',
    historia: 'História',
    metodika: 'Metodika',
    aktuality: 'Aktuality',
  };

  // Helper function to render content with images and quotes
  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, idx) => {
      // Check for image placeholder
      if (paragraph.match(/\[IMAGE:(\d+)\]/)) {
        const imageIndex = parseInt(paragraph.match(/\[IMAGE:(\d+)\]/)![1]);
        const image = article.images?.[imageIndex];
        
        if (image) {
          return (
            <motion.figure 
              key={idx}
              className="my-12 -mx-8"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative group">
                {/* Decorative corners */}
                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-amber-600 dark:border-amber-500 opacity-60"></div>
                <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-amber-600 dark:border-amber-500 opacity-60"></div>
                <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-amber-600 dark:border-amber-500 opacity-60"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-amber-600 dark:border-amber-500 opacity-60"></div>
                
                <div className="rounded-lg overflow-hidden border-4 border-amber-800/30 shadow-2xl bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-900 dark:to-amber-950 p-3">
                  <ImageWithFallback
                    src={image.url}
                    alt={image.caption}
                    className="w-full h-auto rounded"
                  />
                </div>
              </div>
              <figcaption 
                className="mt-6 text-center px-8 py-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg border-l-4 border-r-4 border-amber-600/30"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Scroll className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-xs uppercase tracking-widest text-amber-800 dark:text-amber-400">Ilustrácia</span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 italic leading-relaxed">
                  {image.caption}
                </p>
              </figcaption>
            </motion.figure>
          );
        }
      }
      
      // Check for quote placeholder
      if (paragraph.match(/\[QUOTE:(\d+)\]/)) {
        const quoteIndex = parseInt(paragraph.match(/\[QUOTE:(\d+)\]/)![1]);
        const quote = article.quotes?.[quoteIndex];
        
        if (quote) {
          return (
            <motion.div
              key={idx}
              className="my-12 relative"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <blockquote className="relative p-8 bg-gradient-to-br from-amber-50 to-stone-50 dark:from-amber-950/30 dark:to-stone-900/50 border-l-4 border-amber-600 dark:border-amber-500 rounded-r-xl shadow-lg">
                <Quote className="w-6 h-6 text-amber-600 dark:text-amber-500 mb-4" />
                
                <p 
                  className="text-xl text-stone-800 dark:text-stone-200 italic leading-relaxed mb-6"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  {quote.text}
                </p>
                
                <div className="flex items-center gap-3 pt-4 border-t border-amber-600/30">
                  <Feather className="w-5 h-5 text-amber-700 dark:text-amber-500" />
                  <cite 
                    className="text-sm text-amber-900 dark:text-amber-300 not-italic font-semibold"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    {quote.author}
                  </cite>
                </div>
              </blockquote>
            </motion.div>
          );
        }
      }

      // Regular content rendering
      if (paragraph.startsWith('## ')) {
        return (
          <motion.h2 
            key={idx} 
            className="text-amber-900 dark:text-amber-200 mb-6 mt-12 flex items-center gap-3"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-1 h-8 bg-gradient-to-b from-amber-600 to-transparent rounded-full"></div>
            {paragraph.replace('## ', '')}
          </motion.h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3 
            key={idx} 
            className="text-stone-800 dark:text-stone-200 mb-4 mt-8"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {paragraph.replace('### ', '')}
          </h3>
        );
      }
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const items = paragraph.split('\n').filter((line) => line.trim());
        return (
          <ul key={idx} className="space-y-4 my-8 ml-6">
            {items.map((item, i) => (
              <motion.li 
                key={i} 
                className="text-stone-700 dark:text-stone-300 leading-relaxed relative pl-6"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="absolute left-0 top-2 w-2 h-2 bg-amber-600 dark:text-amber-500 rounded-full"></span>
                {item.replace(/^[*-]\s/, '').replace(/^\*\*/, '').replace(/\*\*$/, '')}
              </motion.li>
            ))}
          </ul>
        );
      }
      if (paragraph.trim() === '---') {
        return (
          <div key={idx} className="my-12 flex items-center justify-center">
            <svg width="200" height="24" viewBox="0 0 200 24" className="text-amber-700/40 dark:text-amber-600/40">
              <path d="M0 12 L200 12" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="100" cy="12" r="6" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="60" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="140" cy="12" r="3" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="30" cy="12" r="2" stroke="currentColor" strokeWidth="1" fill="none"/>
              <circle cx="170" cy="12" r="2" stroke="currentColor" strokeWidth="1" fill="none"/>
            </svg>
          </div>
        );
      }
      if (paragraph.trim()) {
        return (
          <p 
            key={idx} 
            className="text-stone-700 dark:text-stone-300 text-lg leading-relaxed mb-6 first-letter:text-5xl first-letter:font-bold first-letter:text-amber-900 dark:first-letter:text-amber-400 first-letter:mr-2 first-letter:float-left"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {paragraph}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen parchment relative overflow-hidden">
      {/* SVG Filters */}
      <InkEffect />
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <InkSplotch className="top-20 right-10" size={200} />
        <InkSplotch className="top-[40%] left-5" size={150} />
        <InkSplotch className="bottom-40 right-20" size={180} />
      </div>
      
      {/* Decorative header border */}
      <div className="w-full h-3 bg-repeat-x relative z-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 0 L50 6 L75 0 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>

      {/* Back button */}
      <div className="container pt-8 relative z-10">
        <motion.a
          href="/blog"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm border-2 border-amber-800/20 rounded-lg text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-800/40 transition-all"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
        >
          <ArrowLeft className="w-4 h-4" />
          Späť na blog
        </motion.a>
      </div>

      {/* Header */}
      <article className="container py-8 md:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Meta */}
          <motion.div 
            className="flex flex-wrap items-center gap-4 text-sm mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span 
              className="px-4 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 text-amber-800 dark:text-amber-300 rounded-full border-2 border-amber-800/20 shadow-sm"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {categoryLabels[article.category!]}
            </span>
            <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <Calendar className="w-4 h-4" />
              {new Date(article.publishedAt).toLocaleDateString('sk-SK', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1 text-stone-600 dark:text-stone-400" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <Clock className="w-4 h-4" />
              {article.readTime} min čítania
            </span>
          </motion.div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="h-1 w-32 bg-gradient-to-r from-amber-600 via-amber-500 to-transparent rounded-full mb-6"
          />

          {/* Title */}
          <motion.h1 
            className="text-amber-950 dark:text-amber-100 mb-8 leading-tight relative"
            style={{ 
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: '0.02em'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {article.title}
            {/* Decorative underline */}
            <div className="absolute -bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent"></div>
          </motion.h1>

          {/* Excerpt */}
          <motion.div
            className="relative p-6 bg-gradient-to-br from-amber-50/50 to-stone-50/50 dark:from-amber-950/20 dark:to-stone-900/30 rounded-xl border-l-4 border-amber-600 dark:border-amber-500 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p 
              className="text-xl text-stone-700 dark:text-stone-300 italic leading-relaxed"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {article.excerpt}
            </p>
          </motion.div>

          {/* Author */}
          <motion.div 
            className="flex items-center gap-4 pb-8 mb-8 border-b-2 border-double border-amber-800/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white border-4 border-white dark:border-stone-900 shadow-xl" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
              <span className="text-xl">{article.author.name.charAt(0)}</span>
            </div>
            <div>
              <div className="text-lg text-stone-900 dark:text-stone-100" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                {article.author.name}
              </div>
              <div className="text-sm text-stone-500 dark:text-stone-400 italic flex items-center gap-2" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                <Feather className="w-3 h-3" />
                Archeológ a vedec
              </div>
            </div>
          </motion.div>
        </div>

        {/* Cover Image */}
        <div className="max-w-6xl mx-auto my-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="relative"
          >
            {/* Decorative frame corners */}
            <div className="absolute -top-6 -left-6 w-16 h-16 border-t-4 border-l-4 border-amber-600 dark:border-amber-500 opacity-40"></div>
            <div className="absolute -top-6 -right-6 w-16 h-16 border-t-4 border-r-4 border-amber-600 dark:border-amber-500 opacity-40"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 border-b-4 border-l-4 border-amber-600 dark:border-amber-500 opacity-40"></div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 border-b-4 border-r-4 border-amber-600 dark:border-amber-500 opacity-40"></div>
            
            <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-stone-200 dark:from-amber-950 dark:to-stone-900 border-8 border-amber-800/20 shadow-2xl p-2">
              <ImageWithFallback
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover rounded-lg brightness-110 contrast-95"
              />
            </div>
          </motion.div>
        </div>

        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto">
          {/* Main Article Content */}
          <div>
            <motion.div 
              className="article-content bg-white/30 dark:bg-stone-900/30 backdrop-blur-sm p-8 rounded-2xl border-2 border-amber-800/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {renderContent(article.content)}
            </motion.div>

            {/* Bibliography */}
            {article.bibliography && article.bibliography.length > 0 && (
              <motion.div 
                className="mt-16 p-8 bg-gradient-to-br from-stone-50 to-amber-50/30 dark:from-stone-900 dark:to-amber-950/20 rounded-2xl border-4 border-amber-800/20 shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-amber-600/30">
                  <div className="p-3 bg-amber-600 dark:bg-amber-700 rounded-lg shadow-md">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h3 
                    className="text-2xl text-amber-900 dark:text-amber-200 uppercase tracking-wide"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em' }}
                  >
                    Bibliografia
                  </h3>
                </div>
                <div className="space-y-4">
                  {article.bibliography.map((ref, idx) => (
                    <motion.div
                      key={idx}
                      className="flex gap-4 p-4 bg-white/50 dark:bg-stone-800/50 rounded-lg border border-amber-800/10 hover:border-amber-800/30 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-600 dark:bg-amber-700 text-white rounded-full text-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                        {idx + 1}
                      </span>
                      <p 
                        className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        {ref}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Decorative bottom ornament */}
            <motion.div 
              className="flex justify-center my-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <svg width="200" height="40" viewBox="0 0 200 40" className="text-amber-700/40 dark:text-amber-600/40">
                <path d="M0 20 L200 20" stroke="currentColor" strokeWidth="1" fill="none"/>
                <circle cx="100" cy="20" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="60" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="140" cy="20" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M85 20 L90 15 L95 20 L90 25 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
                <path d="M105 20 L110 15 L115 20 L110 25 Z" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.3"/>
              </svg>
            </motion.div>

            {/* Social Share */}
            <motion.div 
              className="p-8 bg-gradient-to-br from-amber-50 to-stone-50 dark:from-stone-900 dark:to-amber-950/30 rounded-2xl border-2 border-amber-800/20"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <SocialShare title={article.title} />
            </motion.div>

            {/* Comments - Enhanced Visual */}
            <motion.div
              className="mt-16 p-8 bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-50 dark:from-stone-900 dark:via-amber-950/10 dark:to-stone-900 rounded-2xl border-4 border-double border-amber-800/30 shadow-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Decorative scroll pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
                <svg viewBox="0 0 100 100" className="text-amber-900">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1"/>
                </svg>
              </div>
              
              <CommentSection />
            </motion.div>
          </div>
        </div>
      </article>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gradient-to-b from-stone-100 to-amber-50/30 dark:from-stone-900 dark:to-amber-950/20 py-16 md:py-24 border-t-4 border-double border-amber-800/30 relative overflow-hidden">
          <InkSplotch className="bottom-20 left-10" size={120} />
          <InkSplotch className="top-20 right-20" size={140} />
          
          <div className="container relative z-10">
            <ScrollReveal direction="up">
              <div className="text-center mb-16">
                {/* Decorative header */}
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, type: "spring" }}
                  className="inline-block mb-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-600/20 blur-xl rounded-full"></div>
                    <div className="relative px-8 py-4 bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 dark:from-amber-900/30 dark:via-amber-950/20 dark:to-amber-900/30 border-4 border-double border-amber-600/40 rounded-full">
                      <h2 
                        className="text-3xl text-amber-950 dark:text-amber-100 uppercase tracking-widest"
                        style={{ 
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          letterSpacing: '0.2em'
                        }}
                      >
                        Mohlo by vás zaujímať
                      </h2>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-1 w-64 bg-gradient-to-r from-transparent via-amber-600 to-transparent rounded-full mb-6 mx-auto"
                />
                
                <p 
                  className="text-lg text-stone-600 dark:text-stone-400 italic"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Ďalšie články z kategórie {categoryLabels[article.category!]}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.map((related, idx) => (
                <motion.div
                  key={related.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  <ArticleCard article={related} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Decorative footer border */}
      <div className="w-full h-3 bg-repeat-x" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6 L25 12 L50 6 L75 12 L100 6' stroke='%237d4f1d' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
        opacity: 0.3
      }}></div>
    </div>
  );
}
