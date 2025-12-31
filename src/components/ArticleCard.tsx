'use client';

import { Calendar, Clock, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Article } from '../data/mock-data';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categoryLabels: Record<string, string> = {
    vyskum: 'Výskum',
    historia: 'História',
    metodika: 'Metodika',
    aktuality: 'Aktuality',
  };

  return (
    <motion.a
      href={`/blog/${article.slug}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, type: 'spring', stiffness: 300 }
      }}
      className="block group"
    >
      <article className="h-full bg-amber-50/50 dark:bg-stone-800/50 border border-amber-900/20 dark:border-amber-700/10 hover:border-amber-900/40 transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl rounded-xl">
        
        {/* Shine effect on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent z-10 pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        )}

        {/* Cover image */}
        <div className="aspect-[2/1] relative overflow-hidden bg-stone-300 dark:bg-stone-700 rounded-t-xl">
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <ImageWithFallback
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover sepia-[0.15] group-hover:sepia-0 transition-all duration-500"
              style={{ filter: 'contrast(1.05) brightness(0.95)' }}
            />
          </motion.div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/60 via-transparent to-transparent pointer-events-none"></div>

          {/* Parchment overlay */}
          <div className="absolute inset-0 mix-blend-multiply bg-amber-100/10 pointer-events-none"></div>
          
          {article.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1.5 bg-amber-800 text-amber-50 text-xs rounded-full uppercase tracking-wider z-20 shadow-lg" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                Odporúčané
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <span className="px-3 py-1.5 bg-stone-100/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 text-xs rounded-full z-20 backdrop-blur-sm shadow-md" style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic'
            }}>
              {categoryLabels[article.category]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 relative">
          {/* Title */}
          <h3 className="text-amber-950 dark:text-amber-100 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors line-clamp-2" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            letterSpacing: '0.02em',
            lineHeight: '1.4'
          }}>
            {article.title}
          </h3>

          {/* Decorative line */}
          <div className="w-16 h-px bg-amber-900/30"></div>

          {/* Excerpt */}
          <p className="text-sm line-clamp-3 leading-relaxed" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            textAlign: 'justify',
            color: '#2d2418' /* WCAG AAA - 11.2:1 */
          }}>
            {article.excerpt}
          </p>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs pt-3" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#4a3f2f' /* WCAG AAA - 7.1:1 */
          }}>
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              {article.author.name}
            </span>
            <span className="text-stone-400 dark:text-stone-600">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {new Date(article.publishedAt).toLocaleDateString('sk-SK', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
            <span className="text-stone-400 dark:text-stone-600">·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {article.readTime} min.
            </span>
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {article.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-xs rounded-full"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </motion.a>
  );
}
