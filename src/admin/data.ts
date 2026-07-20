/**
 * Mock dáta adminu.
 *
 * Tvary presne kopírujú Strapi schému, aby napojenie bolo len výmenou zdroja:
 *   blog-post + dynamiczone `blocks` + sidebar komponenty.
 * Enumy sú opísané zo `src/components/**` v hradiska-strapi — nevymýšľať vlastné.
 */

// ── Enumy zo Strapi ──────────────────────────────────────────────────────────
export const BLOCK_TYPES = [
  { id: 'content.rich-text', label: 'Rich text', accent: 'var(--ad-blk-rich)' },
  { id: 'content.image-block', label: 'Obrázok', accent: 'var(--ad-blk-image)' },
  { id: 'content.quote-block', label: 'Citát', accent: 'var(--ad-blk-quote)' },
  { id: 'content.sources', label: 'Zdroje', accent: '#6b5a3a' },
  { id: 'content.embed', label: 'Embed', accent: '#3f6b7a' },
  { id: 'content.poem', label: 'Báseň', accent: '#7a5c8a' },
  { id: 'content.image-gallery', label: 'Galéria', accent: '#5c7a52' },
] as const;

export const IMAGE_POSITIONS = ['left', 'right', 'center', 'full', 'breakout'] as const;
export const IMAGE_WIDTHS = ['30', '40', '50', '60', '100'] as const;
export const ASPECT_RATIOS = ['3:2', '16:9', '4:3', '1:1', '2:3', '9:16', '3:4', 'auto'] as const;
export const EMBED_PROVIDERS = ['youtube', 'sketchfab', 'vimeo', 'blogger'] as const;

export const KEY_FACT_ICONS = [
  'calendar', 'users', 'map', 'building', 'crown', 'sword', 'shield', 'scroll',
  'book', 'star', 'flag', 'mountain', 'tree', 'water', 'fire', 'custom',
] as const;

export const TIMELINE_TYPES = [
  'founding', 'battle', 'construction', 'destruction', 'discovery', 'event', 'era',
] as const;

export const TIMELINE_TYPE_LABELS: Record<string, string> = {
  founding: 'Založenie', battle: 'Bitka', construction: 'Stavba',
  destruction: 'Zánik', discovery: 'Objav', event: 'Udalosť', era: 'Obdobie',
};

// 13 reálnych kategórií zo Strapi
export const CATEGORIES = [
  { slug: 'kniezacie-sidla', name: 'Kniežacie sídla', count: 6 },
  { slug: 'mocenske-centra', name: 'Mocenské centrá', count: 29 },
  { slug: 'strazna-funkcia', name: 'Strážna a hospodárska funkcia', count: 41 },
  { slug: 'refugia', name: 'Refúgiá', count: 13 },
  { slug: 'staroveke-sidla', name: 'Staroveké sídla', count: 23 },
  { slug: 'ostatne', name: 'Ostatné', count: 0 },
  { slug: 'vseobecne-o-hradiskach', name: 'Všeobecne o hradiskách', count: 15 },
  { slug: 'svatyne-a-sakralne-objekty', name: 'Svätyne a sakrálne objekty', count: 11 },
  { slug: 'povesti', name: 'Povesti', count: 13 },
  { slug: 'listiny-a-pisomne-zdroje', name: 'Listiny a písomné zdroje', count: 19 },
  { slug: 'odborne-texty', name: 'Odborné texty', count: 21 },
  { slug: '3d-modely', name: '3D modely', count: 45 },
  { slug: 'aktuality', name: 'Aktuality', count: 68 },
];

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categorySlug: string;
  authorName: string;
  originalPublishedDate: string;
  published: boolean;
  commentCount: number;
  hasCover: boolean;
  coverUrl?: string;
  views30d: number;
}

export const ARTICLES: AdminArticle[] = [
  { id: '1', title: 'Mikulčice (Kopčany)', slug: 'mikulcice-kopcany', excerpt: 'Jedno z najvýznamnejších opevnených hradištných sídiel Veľkej Moravy — 12 kostolov, znaky mestského usporiadania.', categorySlug: 'kniezacie-sidla', authorName: 'Orgon', originalPublishedDate: '2026-07-15', published: true, commentCount: 4, hasCover: true, views30d: 1284 },
  { id: '2', title: 'Wogastisburg – najvýznamnejšie hradisko Samovej ríše', slug: 'wogastisburg', excerpt: 'Keď potom Austiázijci obkľúčili hrad Wogastisburg, kde sa opevnili veľmi početné oddiely udatných Vinidov.', categorySlug: 'kniezacie-sidla', authorName: 'Orgon', originalPublishedDate: '2026-07-15', published: true, commentCount: 11, hasCover: true, views30d: 2041 },
  { id: '3', title: 'Staré Město – Velehrad', slug: 'stare-mesto-velehrad', excerpt: 'Staré Mesto sa takto nazýva od najstarších čias až dodnes. Vo Fuldských letopisoch nájdeme poznámku z roku 871.', categorySlug: 'kniezacie-sidla', authorName: 'Orgon', originalPublishedDate: '2026-07-15', published: true, commentCount: 2, hasCover: true, views30d: 876 },
  { id: '4', title: 'Detva – Kalamárka 3D', slug: 'detva-kalamarka-3d', excerpt: 'Vizuálna rekonštrukcia hradiska s opevnením a bránou.', categorySlug: '3d-modely', authorName: 'Orgon', originalPublishedDate: '2026-06-28', published: true, commentCount: 0, hasCover: true, views30d: 654 },
  { id: '5', title: 'Perúnov háj pri Úbreži', slug: 'perunov-haj-pri-ubrezi', excerpt: 'Povesť o posvätnom háji a starom kulte, ktorý sa v okolí udržal dlho po christianizácii.', categorySlug: 'povesti', authorName: 'Orgon', originalPublishedDate: '2026-05-12', published: true, commentCount: 7, hasCover: true, views30d: 412 },
  { id: '6', title: 'Oblík – výskum kultovej hory', slug: 'oblik-vyskum-kultovej-hory', excerpt: 'Rozhovor s archeológmi o výskume lokality.', categorySlug: 'aktuality', authorName: 'Orgon', originalPublishedDate: '2026-06-15', published: true, commentCount: 1, hasCover: false, views30d: 233 },
  { id: '7', title: 'Bavorský geograf – prvá písomná zmienka', slug: 'bavorsky-geograf', excerpt: 'Rozbor prameňa a jeho výpovede o počte hradísk u Nitrianskych Slovenov.', categorySlug: 'listiny-a-pisomne-zdroje', authorName: 'Orgon', originalPublishedDate: '2026-04-03', published: true, commentCount: 3, hasCover: true, views30d: 519 },
  { id: '8', title: 'Prosiek – Hrádok', slug: 'prosiek-hradok', excerpt: 'Strážne hradisko nad Liptovskou kotlinou.', categorySlug: 'strazna-funkcia', authorName: 'Orgon', originalPublishedDate: '2026-03-20', published: false, commentCount: 0, hasCover: true, views30d: 0 },
];

export const TOTALS = { all: 305, published: 289, draft: 16, noCover: 80, noCategory: 1 };

// ── Analytika ────────────────────────────────────────────────────────────────
export const STAT_TILES = [
  { label: 'Návštevy dnes', value: '412', trend: +12.4, spark: [18, 22, 19, 27, 24, 31, 29, 34, 30, 38, 41] },
  { label: 'Návštevy 30 dní', value: '9 847', trend: +8.1, spark: [220, 245, 231, 268, 254, 289, 301, 288, 312, 334, 341] },
  { label: 'Unikátni', value: '6 213', trend: +5.6, spark: [140, 152, 148, 166, 159, 178, 184, 176, 192, 201, 207] },
  { label: 'Priem. čas', value: '3:24', trend: +2.2, spark: [180, 186, 191, 188, 196, 199, 194, 201, 204, 199, 204] },
  { label: 'Miera odchodov', value: '48 %', trend: -3.8, spark: [56, 55, 54, 53, 52, 51, 50, 50, 49, 48, 48] },
  { label: 'Zobrazenia / návšteva', value: '2,4', trend: +1.1, spark: [2.1, 2.2, 2.1, 2.3, 2.2, 2.3, 2.4, 2.3, 2.4, 2.4, 2.4] },
];

export const CHART_DAYS = Array.from({ length: 30 }, (_, i) => {
  const base = 260 + Math.round(Math.sin(i / 3.4) * 55 + i * 2.6);
  return { day: i + 1, views: base, visitors: Math.round(base * 0.63) };
});

export const TOP_ARTICLES = ARTICLES
  .filter(a => a.published)
  .sort((a, b) => b.views30d - a.views30d)
  .slice(0, 6);

export const TRAFFIC_SOURCES = [
  { label: 'Google', pct: 54 },
  { label: 'Priama návšteva', pct: 26 },
  { label: 'Facebook', pct: 14 },
  { label: 'Iné weby', pct: 6 },
];
