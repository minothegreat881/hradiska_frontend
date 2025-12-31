'use client';

import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Crown, Landmark, Shield, Mountain, Columns, Book, Church, ScrollText, FileText } from 'lucide-react';

interface CategoryCardProps {
  category: {
    value: string;
    label: string;
    description: string;
    detailedDescription: string;
    icon: string;
    image: string;
  };
  index: number;
}

const iconMap: Record<string, any> = {
  crown: Crown,
  landmark: Landmark,
  shield: Shield,
  mountain: Mountain,
  columns: Columns,
  book: Book,
  church: Church,
  scroll: ScrollText,
  'file-text': FileText,
};

export function CategoryCard({ category, index }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Book;

  return (
    <motion.a
      href={`/category/${category.value}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ 
        y: -8, 
        scale: 1.03,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className="block group relative"
    >
      {/* Enhanced glow effect on hover */}
      <motion.div
        className="absolute -inset-2 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle at center, rgba(217, 119, 6, 0.3), rgba(251, 191, 36, 0.15) 50%, transparent 70%)',
          filter: 'blur(25px)',
          zIndex: -1,
        }}
      />

      <article className="relative h-full rounded-[2rem] overflow-hidden border-2 border-amber-200/40 dark:border-amber-800/40 group-hover:border-amber-400/60 dark:group-hover:border-amber-600/60 transition-all duration-500 shadow-xl group-hover:shadow-2xl">


        {/* Enhanced decorative corner ornaments with animation */}
        {[
          { top: -1, left: -1, rotate: 0 },
          { top: -1, right: -1, rotate: 90 },
          { bottom: -1, right: -1, rotate: 180 },
          { bottom: -1, left: -1, rotate: 270 },
        ].map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-16 h-16 pointer-events-none z-20 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
            style={pos}
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          >
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <motion.path
                d="M 0 16 Q 0 0 16 0 M 0 32 Q 0 0 32 0"
                stroke="url(#gradient-corner-card)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
              <defs>
                <linearGradient id="gradient-corner-card" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#d97706" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#92400e" stopOpacity="0.6" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        ))}

        {/* Image section */}
        <div className="relative h-64 overflow-hidden bg-stone-300 dark:bg-stone-700">
          <motion.div
            className="w-full h-full"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            whileHover={{ 
              scale: 1.1,
              transition: { duration: 0.5, ease: 'easeOut' }
            }}
          >
            <ImageWithFallback
              src={category.image}
              alt={category.label}
              className="w-full h-full object-cover"
              style={{ 
                filter: 'contrast(1.1) brightness(0.9) sepia(0.15)',
              }}
            />
          </motion.div>

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/20 mix-blend-multiply pointer-events-none" />

          {/* Enhanced title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 border-t-2 border-amber-400/30 bg-gradient-to-t from-black/70 to-transparent">
            <motion.h3 
              className="text-amber-50 uppercase tracking-wider relative z-10"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.12em',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.4)',
              }}
              animate={{
                x: [0, 2, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              whileHover={{ 
                x: 6,
                letterSpacing: '0.15em',
                transition: { duration: 0.3 }
              }}
            >
              {category.label}
            </motion.h3>
            
            {/* Animated underline */}
            <motion.div
              className="absolute bottom-4 left-5 h-0.5 bg-gradient-to-r from-amber-500 to-transparent"
              initial={{ width: 0 }}
              whileInView={{ width: '40%' }}
              transition={{ duration: 0.6, delay: 0.3 }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              style={{
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)'
              }}
            />
          </div>
        </div>

        {/* Content section */}
        <div className="relative p-6 bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-amber-100/95 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/40">
          {/* Texture overlay */}
          <div 
            className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Short description */}
          <p 
            className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed mb-3 relative z-10"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              textAlign: 'justify',
            }}
          >
            {category.description}
          </p>

          {/* Detailed description - shown on hover */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            whileHover={{ height: 'auto', opacity: 1 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-amber-300/30 dark:border-amber-700/30">
              <p 
                className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed relative z-10"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  textAlign: 'justify',
                }}
              >
                {category.detailedDescription}
              </p>
            </div>
          </motion.div>

          {/* Enhanced call to action */}
          <motion.div 
            className="mt-5 flex items-center justify-between relative z-10"
            animate={{
              x: [0, 2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{ 
              x: 6,
              transition: { duration: 0.3 }
            }}
          >
            <span 
              className="text-sm text-amber-800 dark:text-amber-600 uppercase tracking-wide"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '0.08em',
              }}
            >
              Preskúmať
            </span>
            <motion.div
              animate={{
                x: [0, 6, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <motion.svg 
                className="w-5 h-5 text-amber-700 dark:text-amber-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                whileHover={{
                  scale: 1.2,
                  rotate: -45,
                  transition: { duration: 0.2 }
                }}
              >
                <motion.path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                  animate={{
                    pathLength: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.svg>
            </motion.div>
          </motion.div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-600/50 to-transparent"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </article>
    </motion.a>
  );
}
