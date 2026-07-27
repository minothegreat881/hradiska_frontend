/**
 * Strapi API Client for Hradiska.sk
 */

const STRAPI_URL = import.meta.env.PROD ? '/strapi' : (import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337');

// Types matching Strapi response structure
export interface StrapiImage {
  id: number;
  url: string;
  alternativeText?: string;
  caption?: string;
  width: number;
  height: number;
  formats?: {
    thumbnail?: { url: string };
    small?: { url: string };
    medium?: { url: string };
    large?: { url: string };
  };
}

export interface StrapiCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
}

export interface StrapiTag {
  id: number;
  documentId: string;
  name: string;
  slug: string;
}

export interface StrapiQuote {
  id: number;
  text: string;
  author?: string;
  source?: string;
}


// Sidebar components
export interface StrapiLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
}

export interface StrapiKeyFact {
  id: number;
  label: string;
  value: string;
  icon?: 'calendar' | 'users' | 'map' | 'building' | 'crown' | 'sword' | 'shield' | 'scroll' | 'book' | 'star' | 'flag' | 'mountain' | 'tree' | 'water' | 'fire' | 'custom';
}

export interface StrapiTimelineEvent {
  id: number;
  year: string;
  title: string;
  description?: string;
  type?: 'founding' | 'battle' | 'construction' | 'destruction' | 'discovery' | 'event' | 'era';
}

export interface StrapiBlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: any; // Strapi blocks content
  coverImage?: StrapiImage;
  gallery?: StrapiImage[];
  category?: StrapiCategory;
  tags?: StrapiTag[];
  authorName?: string;
  featured?: boolean;
  readingTime?: number;
  metaTitle?: string;
  metaDescription?: string;
  quotes?: StrapiQuote[];
  blocks?: any[];
  location?: StrapiLocation;
  keyFacts?: StrapiKeyFact[];
  timeline?: StrapiTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  /** Pôvodný dátum z Blogger migrácie. `publishedAt` je dátum migrácie (u všetkých
   *  aktualít 2026-07-19), takže na chronológiu treba toto. Schéma to tak aj mieni:
   *  „frontend zobrazuje originalPublishedDate || publishedAt". */
  originalPublishedDate?: string;
}

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/**
 * Fetch helper with error handling
 */
async function fetchStrapi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // ngrok free-tier shows a browser warning page on first request from a
        // typical browser User-Agent. This header bypasses it so fetch receives
        // JSON instead of HTML. No-op for non-ngrok backends.
        'ngrok-skip-browser-warning': 'true',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Failed to fetch from Strapi: ${url}`, error);
    throw error;
  }
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<StrapiCategory[]> {
  const response = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(
    '/blog-categories?sort=order:asc'
  );
  return response.data;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<StrapiCategory | null> {
  const response = await fetchStrapi<StrapiResponse<StrapiCategory[]>>(
    `/blog-categories?filters[slug][$eq]=${encodeURIComponent(slug)}`
  );
  return response.data[0] || null;
}

/**
 * Get all blog posts with optional filters
 */
export async function getBlogPosts(options?: {
  categorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ posts: StrapiBlogPost[]; pagination: any }> {
  // Build query string manually to avoid encoding issues
  // PERF: `populate=*` ťahalo pre KAŽDÝ článok v zozname aj gallery, blocks, quotes,
  // location, keyFacts a timeline — 25 článkov = ~2,6 s a 0,66 MB. Zoznamy potrebujú
  // len to, čo číta convertStrapiPostToArticle: coverImage, category, tags.
  // Po zúžení: ~135 ms a 0,04 MB. Detail článku si plné dáta doťahuje sám
  // (getBlogPostBySlug má vlastný deep populate), takže tu nič nechýba.
  const queryParts: string[] = [
    'populate[0]=coverImage',
    'populate[1]=category',
    'populate[2]=tags',
    'sort=publishedAt:desc',
  ];

  // Pagination
  if (options?.page) queryParts.push(`pagination[page]=${options.page}`);
  if (options?.pageSize) queryParts.push(`pagination[pageSize]=${options.pageSize}`);

  // Filters
  if (options?.categorySlug) {
    queryParts.push(`filters[category][slug][$eq]=${encodeURIComponent(options.categorySlug)}`);
  }
  if (options?.tagSlug) {
    queryParts.push(`filters[tags][slug][$eq]=${encodeURIComponent(options.tagSlug)}`);
  }
  if (options?.featured !== undefined) {
    queryParts.push(`filters[featured][$eq]=${options.featured}`);
  }

  const response = await fetchStrapi<StrapiResponse<StrapiBlogPost[]>>(
    `/blog-posts?${queryParts.join('&')}`
  );

  return {
    posts: response.data,
    pagination: response.meta?.pagination,
  };
}

/**
 * Get blog post by slug
 */
export async function getBlogPostBySlug(slug: string): Promise<StrapiBlogPost | null> {
  // Deep populate for all fields including dynamic zone components
  const query = `filters[slug][$eq]=${encodeURIComponent(slug)}&populate[0]=coverImage&populate[1]=gallery&populate[2]=category&populate[3]=tags&populate[4]=quotes&populate[5]=blocks.image&populate[6]=blocks.images&populate[7]=blocks.secondImage&populate[8]=location&populate[9]=keyFacts&populate[10]=timeline&populate[11]=blocks.items`;

  const response = await fetchStrapi<StrapiResponse<StrapiBlogPost[]>>(
    `/blog-posts?${query}`
  );

  return response.data[0] || null;
}

/**
 * Get all tags
 */
export async function getTags(): Promise<StrapiTag[]> {
  const response = await fetchStrapi<StrapiResponse<StrapiTag[]>>(
    '/blog-tags?sort=name:asc'
  );
  return response.data;
}

/**
 * Get full image URL from Strapi
 */
export function getStrapiImageUrl(image: StrapiImage | undefined, size?: 'thumbnail' | 'small' | 'medium' | 'large'): string {
  if (!image) return '/placeholder-image.jpg';

  // If size specified and format exists, use it
  if (size && image.formats?.[size]?.url) {
    const formatUrl = image.formats[size].url;
    return formatUrl.startsWith('http') ? formatUrl : `${STRAPI_URL}${formatUrl}`;
  }

  // Otherwise use original
  return image.url.startsWith('http') ? image.url : `${STRAPI_URL}${image.url}`;
}

// ============================================================================
// KRONIKA – aktuality ako blog-posty v kategórii `aktuality`
// ----------------------------------------------------------------------------
// Reálny obsah združenia (68 príspevkov, 2010–2026) žije ako blog-post
// v kategórii `aktuality`, nie v kolekcii `aktualita` (tam je len 8 seed
// záznamov). Nástenka na homepage berie dáta odtiaľto.
// ============================================================================

/** Sploštený tvar pre kartu na nástenke. */
export interface KronikaItem {
  documentId: string;
  slug: string;
  title: string;
  excerpt: string;
  /** ISO dátum — originalPublishedDate, s fallbackom na publishedAt. */
  datum: string;
  author: string;
  readingTime: number;
  coverUrl: string | null;
}

/** Slug článku, ktorý je na nástenke pripnutý ako statický úvod. */
export const KRONIKA_INTRO_SLUG = 'preco-to-vlastne-robim';

function toKronikaItem(p: StrapiBlogPost): KronikaItem {
  return {
    documentId: p.documentId,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || '',
    datum: p.originalPublishedDate || p.publishedAt,
    author: p.authorName || 'Hradiská',
    readingTime: p.readingTime || 1,
    coverUrl: p.coverImage ? getStrapiImageUrl(p.coverImage, 'medium') : null,
  };
}

/**
 * Načítaj kroniku. `sort` riadi smer časovej osi (najnovšie / najstaršie).
 */
export async function getKronika(options?: {
  page?: number;
  pageSize?: number;
  sort?: 'desc' | 'asc';
}): Promise<{ items: KronikaItem[]; pagination: any }> {
  const queryParts: string[] = [
    'filters[category][slug][$eq]=aktuality',
    `sort=originalPublishedDate:${options?.sort === 'asc' ? 'asc' : 'desc'}`,
    'populate[0]=coverImage',
  ];
  if (options?.page) queryParts.push(`pagination[page]=${options.page}`);
  if (options?.pageSize) queryParts.push(`pagination[pageSize]=${options.pageSize}`);

  const response = await fetchStrapi<StrapiResponse<StrapiBlogPost[]>>(
    `/blog-posts?${queryParts.join('&')}`
  );
  return {
    items: response.data.map(toKronikaItem),
    pagination: response.meta?.pagination,
  };
}

/** Úvodný (pripnutý) príspevok. Ťahá sa zvlášť — pri radení podľa dátumu by
 *  inak nemusel padnúť na prvú stránku. */
export async function getKronikaIntro(): Promise<KronikaItem | null> {
  const response = await fetchStrapi<StrapiResponse<StrapiBlogPost[]>>(
    `/blog-posts?filters[slug][$eq]=${KRONIKA_INTRO_SLUG}&populate[0]=coverImage`
  );
  return response.data[0] ? toKronikaItem(response.data[0]) : null;
}

// ============================================================================
// AKTUALITY – krátke príspevky o činnosti združenia
// ============================================================================

export type AktualitaTyp =
  | 'brigada'
  | 'nova_tabula'
  | 'socha_pamatnik'
  | 'podujatie'
  | 'vyskum'
  | 'ine';

export interface StrapiAktualita {
  id: number;
  documentId: string;
  nazov: string;
  obsah?: string;
  fotky?: StrapiImage[];
  typAktivity: AktualitaTyp;
  datum: string; // YYYY-MM-DD
  hradiskoSlug?: string;
  zvyraznene?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/**
 * Načítaj aktuality. Server-side zoradenie: zvýraznené prvé, potom podľa dátumu zostupne.
 */
export async function getAktuality(options?: {
  page?: number;
  pageSize?: number;
}): Promise<{ items: StrapiAktualita[]; pagination: any }> {
  const queryParts: string[] = [
    'populate=fotky',
    'sort[0]=zvyraznene:desc',
    'sort[1]=datum:desc',
  ];
  if (options?.page) queryParts.push(`pagination[page]=${options.page}`);
  if (options?.pageSize) queryParts.push(`pagination[pageSize]=${options.pageSize}`);

  const response = await fetchStrapi<StrapiResponse<StrapiAktualita[]>>(
    `/aktuality?${queryParts.join('&')}`
  );
  return {
    items: response.data,
    pagination: response.meta?.pagination,
  };
}

/**
 * Convert Strapi post to format compatible with existing ArticleCard
 */
export function convertStrapiPostToArticle(post: StrapiBlogPost) {
  return {
    id: post.documentId,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: post.content,
    // Karty v zozname sa vykresľujú v malom — `medium` (~40 KB) namiesto originálu
    // (~351 KB). Variant je v Strapi už vygenerovaný, nič sa negeneruje navyše.
    // Ak `formats.medium` chýba, getStrapiImageUrl spadne späť na originál.
    // Detail článku má vlastnú cestu (getBlogPostBySlug) a originál si berie ďalej.
    coverImage: getStrapiImageUrl(post.coverImage, 'medium'),
    author: post.authorName || 'Hradiská',
    publishedAt: post.publishedAt,
    readTime: post.readingTime || 5,
    tags: post.tags?.map(t => t.name) || [],
    category: post.category?.slug || 'ostatne',
    categoryName: post.category?.name || '',
    hradiskaCategory: post.category ? [post.category.slug] : [],
    featured: post.featured || false,
  };
}
