import { useState, useEffect, useRef, useCallback } from 'react';
import { getCategories, getBlogPosts } from '../lib/strapi';
import { NavigationItem } from '../data/navigation-structure';

/**
 * Živá navigácia napojená na Strapi: pre každú reálnu kategóriu (blog-categories)
 * jej skutočný počet článkov a — až keď treba — aj zoznam pre rozbaľovaciu ponuku.
 *
 * PREČO V DVOCH KROKOCH: hlavička je na každej stránke a predtým si pre každú
 * kategóriu vypýtala 50 článkov naraz, aby mala čím naplniť ponuku. To bolo
 * 14 požiadaviek a ~190 kB pri KAŽDOM načítaní ktorejkoľvek stránky (namerané),
 * hoci ponuku väčšina návštevníkov nikdy neotvorí.
 *
 * Teraz sa pri štarte ťahajú len počty (`pageSize=1`, odpoveďou je jeden článok
 * a číslo), čo je pár kilobajtov. Zoznam článkov sa dotiahne až pri prvom
 * otvorení ponuky nad danou kategóriou a potom ostáva v pamäti.
 *
 * Kategória bez článkov sa zobrazí ako plochý odkaz s počtom 0 (bez rozbaľovacej
 * ponuky) — ide o čestný stav, nie chybu, kým sa do nej niečo nemigruje.
 */
export function useNavigationData() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  /** Slugy, ktorých zoznam už bol dotiahnutý (alebo sa práve ťahá). */
  const nacitane = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const categories = await getCategories();

        const categoryItems = await Promise.all(
          categories.map(async (cat): Promise<NavigationItem> => {
            try {
              // Len počet. `pageSize=1` vráti jeden článok a `meta.pagination.total`.
              const { pagination } = await getBlogPosts({ categorySlug: cat.slug, pageSize: 1 });
              return {
                label: cat.name,
                slug: `/category/${cat.slug}`,
                count: pagination?.total ?? 0,
                description: cat.description,
              };
            } catch {
              // Jedna kategória zlyhala (napr. výpadok siete) — zobraz ju bez detailov,
              // nech nespadne celé menu.
              return { label: cat.name, slug: `/category/${cat.slug}`, count: 0 };
            }
          })
        );

        if (!cancelled) setItems(categoryItems);
      } catch {
        // Strapi nedostupné — navigácia ostane prázdna. Logo aj odkazy na
        // domovskú, mapu a účet sú v lište natvrdo, takže sa dá odísť ďalej.
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Dotiahne zoznam článkov jednej kategórie. Volá sa pri otvorení ponuky.
   * Druhé a ďalšie volania pre tú istú kategóriu nerobia nič.
   */
  const nacitajClanky = useCallback(async (slug: string) => {
    if (!slug || nacitane.current.has(slug)) return;
    nacitane.current.add(slug);
    try {
      const { posts } = await getBlogPosts({ categorySlug: slug, pageSize: 50 });
      setItems((prev) =>
        prev.map((it) =>
          it.slug === `/category/${slug}`
            ? {
                ...it,
                children: posts
                  .map((p) => ({ label: p.title, slug: `/blog/${p.slug}` }))
                  .sort((a, b) => a.label.localeCompare(b.label, 'sk')),
              }
            : it
        )
      );
    } catch {
      // Nepodarilo sa — nech sa dá skúsiť znova pri ďalšom otvorení.
      nacitane.current.delete(slug);
    }
  }, []);

  return { items, loading, nacitajClanky };
}
