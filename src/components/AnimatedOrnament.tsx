'use client';

import { motion } from 'motion/react';

interface AnimatedOrnamentProps {
  variant?: 'top' | 'bottom' | 'center';
  className?: string;
}

export function AnimatedOrnament({ variant = 'center', className = '' }: AnimatedOrnamentProps) {
  if (variant === 'top') {
    return (
      <motion.div
        className={`flex justify-center ${className}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <svg width="200" height="40" viewBox="0 0 200 40" className="text-amber-800/40">
          <motion.path
            d="M10 20 Q 30 5, 50 20 T 90 20 T 130 20 T 170 20 T 190 20"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="100"
            cy="20"
            r="8"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          />
          <motion.circle
            cx="150"
            cy="20"
            r="4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          />
        </svg>
      </motion.div>
    );
  }

  if (variant === 'bottom') {
    return (
      <motion.div
        className={`flex justify-center ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <svg width="150" height="20" viewBox="0 0 150 20" className="text-amber-800/40">
          <motion.path
            d="M0 10 L150 10"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="75"
            cy="10"
            r="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.line
            x1="60"
            y1="10"
            x2="90"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100" className="text-amber-800/30">
        <motion.circle
          cx="50"
          cy="50"
          r="30"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0, rotate: -90 }}
          animate={{ pathLength: 1, rotate: 0 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="50"
          cy="50"
          r="20"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.path
          d="M50 30 L50 70 M30 50 L70 50"
          stroke="currentColor"
          strokeWidth="1"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1 }}
        />
      </svg>
    </motion.div>
  );
}
