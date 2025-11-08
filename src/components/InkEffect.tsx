'use client';

import { motion } from 'motion/react';

export function InkEffect() {
  return (
    <svg 
      width="0" 
      height="0" 
      style={{ position: 'absolute' }}
    >
      <defs>
        <filter id="ink-blot">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.01" 
            numOctaves="5" 
            result="turbulence"
          />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="turbulence" 
            scale="10" 
            xChannelSelector="R" 
            yChannelSelector="G"
          />
        </filter>
        
        <filter id="paper-texture">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.8" 
            numOctaves="4" 
            result="noise"
          />
          <feDiffuseLighting 
            in="noise" 
            lightingColor="#c2a476" 
            surfaceScale="1" 
            result="light"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feComposite 
            in="SourceGraphic" 
            in2="light" 
            operator="arithmetic" 
            k1="1" 
            k2="0" 
            k3="0" 
            k4="0"
          />
        </filter>
      </defs>
    </svg>
  );
}

interface InkSplotchProps {
  className?: string;
  size?: number;
}

export function InkSplotch({ className = '', size = 100 }: InkSplotchProps) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.15 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <motion.path
          d="M50,10 Q70,30 80,50 Q70,70 50,90 Q30,70 20,50 Q30,30 50,10"
          fill="currentColor"
          className="text-amber-900"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          style={{ filter: 'url(#ink-blot)' }}
        />
      </svg>
    </motion.div>
  );
}
