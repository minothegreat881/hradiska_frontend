'use client';

import { MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Site, periods, siteTypes } from '../data/mock-data';
import { useState } from 'react';

interface SiteCardProps {
  site: Site;
}

export function SiteCard({ site }: SiteCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const periodLabels = site.period
    .map((p) => periods.find((period) => period.value === p)?.label)
    .filter(Boolean)
    .join(', ');

  const typeLabel = siteTypes.find((t) => t.value === site.type)?.label;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.a
      href={`/sites/${site.slug}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.3, type: 'spring', stiffness: 300 }
      }}
      className="block group perspective-1000"
    >
      <article className="h-full bg-amber-50/50 dark:bg-stone-800/50 border-2 border-amber-900/30 dark:border-amber-700/20 hover:border-amber-900/50 transition-all duration-300 relative overflow-hidden"
        style={{
          boxShadow: isHovered 
            ? '8px 8px 20px rgba(0,0,0,0.2), inset 0 0 30px rgba(194,164,118,0.2)' 
            : '2px 2px 8px rgba(0,0,0,0.1), inset 0 0 20px rgba(194,164,118,0.1)',
          transform: 'translateZ(50px)',
        }}
      >
        {/* Decorative corner ornaments with animation */}
        <motion.div 
          className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber-900/40"
          animate={isHovered ? { scale: 1.2, x: -2, y: -2 } : { scale: 1, x: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        <motion.div 
          className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber-900/40"
          animate={isHovered ? { scale: 1.2, x: 2, y: -2 } : { scale: 1, x: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber-900/40"
          animate={isHovered ? { scale: 1.2, x: -2, y: 2 } : { scale: 1, x: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber-900/40"
          animate={isHovered ? { scale: 1.2, x: 2, y: 2 } : { scale: 1, x: 0, y: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.div>
        
        {/* Shine effect on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ transform: 'translateZ(100px)' }}
          />
        )}

        {/* Image placeholder */}
        <motion.div 
          className="aspect-video bg-gradient-to-br from-amber-200 via-stone-200 to-amber-100 dark:from-stone-700 dark:via-stone-800 dark:to-stone-700 relative overflow-hidden border-b-2 border-amber-900/30"
          style={{ transform: 'translateZ(75px)' }}
        >
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-6xl opacity-30 sepia"
            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.5 }}
          >
            🏛️
          </motion.div>
          {/* Vignette effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none"></div>

          {/* Animated overlay on hover */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-amber-900/40 via-transparent to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {site.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1.5 bg-amber-800 text-amber-50 text-xs border border-amber-900 uppercase tracking-wider" style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                Významné
              </span>
            </div>
          )}
          {site.excavated && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100/95 dark:bg-stone-900/95 text-stone-800 dark:text-stone-200 text-xs border border-stone-400 dark:border-stone-600" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                <CheckCircle2 className="w-3 h-3" />
                Skúmané
              </span>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <div className="p-5 space-y-3 relative">
          {/* Title */}
          <h3 className="text-amber-950 dark:text-amber-100 group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            letterSpacing: '0.02em'
          }}>
            {site.name}
          </h3>

          {/* Decorative line */}
          <div className="w-12 h-px bg-amber-900/30"></div>

          {/* Meta */}
          <div className="flex flex-wrap gap-2 text-sm text-stone-700 dark:text-stone-300" style={{
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {site.district}
            </span>
            <span className="text-stone-400 dark:text-stone-600">|</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {periodLabels}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-stone-700 dark:text-stone-300 line-clamp-2 leading-relaxed" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            textAlign: 'justify'
          }}>
            {site.description}
          </p>

          {/* Type badge */}
          <div className="pt-2">
            <span className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 text-xs border border-amber-800/30 dark:border-amber-700/30 uppercase tracking-wide" style={{
              fontFamily: 'Georgia, "Times New Roman", serif'
            }}>
              {typeLabel}
            </span>
          </div>
        </div>
      </article>
    </motion.a>
  );
}
