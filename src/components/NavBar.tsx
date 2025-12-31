'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { mainNavigation } from '../data/navigation-structure';
import { motion, AnimatePresence } from 'motion/react';
import { MegaMenu } from './MegaMenu';

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Update scrolled state for styling
      setScrolled(currentScrollY > 20);

      // Hide/show based on scroll direction (with small delta threshold)
      const delta = currentScrollY - lastScrollY;
      if (delta > 5 && currentScrollY > 50) {
        // Scrolling down fast enough & past threshold - hide
        setHidden(true);
      } else if (delta < -5) {
        // Scrolling up fast enough - show
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/95 dark:bg-stone-950/95 backdrop-blur-md shadow-lg border-b border-amber-200 dark:border-amber-900/30'
            : 'bg-white/80 dark:bg-stone-950/80 backdrop-blur-sm border-b border-amber-100 dark:border-amber-900/20'
        }`}
      >
        <div className="container">
          <div className="flex items-center justify-between h-28 py-4">
            {/* Logo */}
            <motion.a
              href="/"
              className="flex items-center group"
              aria-label="Slovanské hradiská - domov"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <img
                src="/logo_slovanske_hradiska.jpg"
                alt="Slovanské hradiská"
                className="h-24 w-auto drop-shadow-lg"
              />
            </motion.a>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5">
              {mainNavigation.map((item) => (
                <MegaMenu key={item.label} item={item} />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-full text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-900 transition-all duration-300"
                aria-label={darkMode ? 'Svetlý režim' : 'Tmavý režim'}
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-full text-stone-700 dark:text-stone-300 hover:bg-amber-100 dark:hover:bg-stone-900 transition-all duration-300"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Animated bottom accent line */}
        <motion.div
          className="h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: scrolled ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed inset-0 top-28 bg-white/98 dark:bg-stone-950/98 backdrop-blur-lg z-40 overflow-y-auto"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              transition={{ duration: 0.3 }}
              className="container py-6 space-y-2"
            >
              {mainNavigation.map((item) => (
                <div key={item.label} className="mb-4">
                  {item.slug ? (
                    <a
                      href={item.slug}
                      className="block px-6 py-4 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-900 transition-all duration-200 rounded-2xl"
                      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <>
                      <div className="px-6 py-2 text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wider" style={{
                        fontFamily: 'Georgia, "Times New Roman", serif'
                      }}>
                        {item.label}
                      </div>
                      {item.children && (
                        <div className="space-y-1 mt-2">
                          {item.children.map((child) => (
                            <a
                              key={child.label}
                              href={child.slug || '#'}
                              className="block px-6 py-3 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-900 transition-all duration-200 rounded-xl text-sm"
                              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {child.label}
                              {child.count !== undefined && (
                                <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">({child.count})</span>
                              )}
                            </a>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
