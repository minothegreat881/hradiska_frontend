/**
 * Tvar položky navigácie.
 *
 * Súbor kedysi obsahoval aj ručne vypísanú navigáciu (`mainNavigation`, 392
 * riadkov) a k nej `articleYears`, `categoryStats` a `featuredSites` — všetko
 * s vymyslenými počtami a odkazmi na lokality, ktoré na webe neexistovali.
 * Nahradila ich živá navigácia zo Strapi (`hooks/useNavigationData.ts`), ktorá
 * berie skutočné kategórie, skutočné články a skutočné počty. Tie polia už
 * odvtedy nikto neimportoval, takže sú preč; ostáva len typ, ktorý používa
 * navigácia, mega menu aj pás kategórií.
 */
export interface NavigationItem {
  label: string;
  slug?: string;
  children?: NavigationItem[];
  count?: number;
  description?: string;
}
