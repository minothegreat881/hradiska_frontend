'use client';

import { useState } from 'react';
import { NavigationItem } from '../data/navigation-structure';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface MegaMenuProps {
  item: NavigationItem;
}

export function MegaMenu({ item }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <a
        href={item.slug || '#'}
        className="px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-50/50 dark:hover:bg-stone-900/50 flex items-center gap-1 group"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {item.label}
        {item.count !== undefined && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            ({item.count})
          </span>
        )}
        {hasChildren && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.div>
        )}
      </a>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && hasChildren && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 top-full mt-2 w-[550px] bg-white dark:bg-stone-900 rounded-xl shadow-2xl border border-amber-200 dark:border-amber-900/30 overflow-hidden z-50"
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Scrollable Content - Clean List of Chapter Titles Only */}
            <nav
              className="scrollable-dropdown-content"
              role="navigation"
              aria-label={`${item.label} navigation`}
              style={{
                height: '320px',
                overflowY: 'scroll',
                overflowX: 'hidden',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                document.body.style.overflow = 'hidden';
              }}
              onMouseLeave={(e) => {
                document.body.style.overflow = '';
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .scrollable-dropdown-content {
                    scrollbar-width: thin;
                    scrollbar-color: #f59e0b #fef3c7;
                  }

                  .scrollable-dropdown-content::-webkit-scrollbar {
                    width: 12px;
                  }

                  .scrollable-dropdown-content::-webkit-scrollbar-track {
                    background: #fef3c7;
                    border-radius: 8px;
                    margin: 4px 0;
                  }

                  .scrollable-dropdown-content::-webkit-scrollbar-thumb {
                    background: #f59e0b;
                    border-radius: 8px;
                    border: 2px solid #fef3c7;
                  }

                  .scrollable-dropdown-content::-webkit-scrollbar-thumb:hover {
                    background: #d97706;
                  }

                  .dark .scrollable-dropdown-content::-webkit-scrollbar-track {
                    background: #292524;
                  }

                  .dark .scrollable-dropdown-content::-webkit-scrollbar-thumb {
                    background: #d97706;
                    border-color: #292524;
                  }

                  .dark .scrollable-dropdown-content::-webkit-scrollbar-thumb:hover {
                    background: #f59e0b;
                  }
                `
              }} />

              {/* Chapter Titles List */}
              <ul className="p-3" role="list">
                {item.children.flatMap((child) => {
                  // If child has grandchildren, return them
                  if (child.children && child.children.length > 0) {
                    return child.children.map((grandchild) => (
                      <li key={grandchild.slug || grandchild.label} role="listitem">
                        <motion.a
                          href={grandchild.slug || '#'}
                          whileHover={{ x: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                          className="flex items-center gap-3 px-4 py-2.5 text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 rounded-md transition-all border-l-2 border-transparent hover:border-amber-500"
                          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                        >
                          <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                          <span className="font-medium text-sm leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                            {grandchild.label}
                          </span>
                        </motion.a>
                      </li>
                    ));
                  }
                  // Otherwise return the child itself
                  return (
                    <li key={child.slug || child.label} role="listitem">
                      <motion.a
                        href={child.slug || '#'}
                        whileHover={{ x: 4, backgroundColor: 'rgba(251, 191, 36, 0.1)' }}
                        className="flex items-center gap-3 px-4 py-2.5 text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 rounded-md transition-all border-l-2 border-transparent hover:border-amber-500"
                        style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                      >
                        <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                        <span className="font-medium text-sm leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
                          {child.label}
                        </span>
                      </motion.a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

