'use client';

import { NavigationItem } from '../data/navigation-structure';

interface MegaMenuProps {
  item: NavigationItem;
}

export function MegaMenu({ item }: MegaMenuProps) {
  return (
    <a
      href={item.slug || '#'}
      className="px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-amber-50/50 dark:hover:bg-stone-900/50"
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {item.label}
    </a>
  );
}
