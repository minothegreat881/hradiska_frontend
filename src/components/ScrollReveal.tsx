'use client';

import { motion, useInView } from 'motion/react';
import { useRef, ReactNode } from 'react';
import { useEditMode } from './EditModeContext';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
  className?: string;
}

export function ScrollReveal({ 
  children, 
  delay = 0, 
  direction = 'up',
  className = '' 
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  /* Na plátne editora (vzhľad webu) sa nezjavuje — v iframe by sa pozorovanie
     nespustilo a obsah by ostal priehľadný. Na webe je to vždy `false`. */
  const naPlatne = useEditMode();

  const variants = {
    up: { y: 50, opacity: 0 },
    down: { y: -50, opacity: 0 },
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    fade: { opacity: 0, scale: 0.95 },
  };

  const initial = variants[direction];

  return (
    <motion.div
      ref={ref}
      initial={naPlatne ? false : initial}
      animate={isInView || naPlatne ? { x: 0, y: 0, opacity: 1, scale: 1 } : initial}
      transition={{ 
        duration: 0.6, 
        delay, 
        ease: [0.25, 0.1, 0.25, 1.0]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
