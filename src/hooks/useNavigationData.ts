import { useState, useEffect } from 'react';
import { getCategories, getBlogPosts } from '../lib/strapi';
import { NavigationItem } from '../data/navigation-structure';

const STATIC_UVOD: NavigationItem = {
  label: 'Úvod',
  slug: '/',
  children: [
    { label: 'Domovská stránka', slug: '/' },
    { label: 'O projekte', slug: '/about' },
    { label: 'Mapa hradísk', slug: '/mapa', description: 'Interaktívna 3D mapa všetkých lokalít' },
  ],
};

/**
 * Živá navigácia napojená na Strapi: pre každú reálnu kategóriu (blog-categories)
 * načíta jej skutočné články a skutočný počet. Nahrádza predtým ručne vypísané
 * (a vymyslené) počty a odkazy v data/navigation-structure.ts.
 *
 * Kategória bez článkov sa zobrazí ako plochý odkaz s počtom 0 (bez rozbaľovacej
 * ponuky) — ide o čestný stav, nie chybu, kým sa do nej niečo nemigruje.
 */
export function useNavigationData() {
  const [items, setItems] = useState<NavigationItem[]>([STATIC_UVOD]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const categories = await getCategories();

        const categoryItems = await Promise.all(
          categories.map(async (cat): Promise<NavigationItem> => {
            try {
              const { posts, pagination } = await getBlogPosts({
                categorySlug: cat.slug,
                pageSize: 50,
              });
              return {
                label: cat.name,
                slug: `/category/${cat.slug}`,
                count: pagination?.total ?? posts.length,
                description: cat.description,
                children: posts
                  .map((p) => ({
                    label: p.title,
                    slug: `/blog/${p.slug}`,
                  }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'sk')),
              };
            } catch {
              // Jedna kategória zlyhala (napr. výpadok siete) — zobraz ju bez detailov,
              // nech nespadne celé menu.
              return { label: cat.name, slug: `/category/${cat.slug}`, count: 0 };
            }
          })
        );

        if (!cancelled) {
          setItems([STATIC_UVOD, ...categoryItems]);
        }
      } catch {
        // Strapi nedostupné — nechaj aspoň Úvod, nech je nav funkčná.
        if (!cancelled) setItems([STATIC_UVOD]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}
