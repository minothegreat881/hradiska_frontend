/**
 * Strapi API Client for Hradiska.sk
 */

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

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
    '/blog-categories?sort=name:asc'
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
  const queryParts: string[] = [
    'populate=*',
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
  const query = `filters[slug][$eq]=${encodeURIComponent(slug)}&populate[0]=coverImage&populate[1]=gallery&populate[2]=category&populate[3]=tags&populate[4]=quotes&populate[5]=blocks.image&populate[6]=blocks.images&populate[7]=blocks.secondImage&populate[8]=location&populate[9]=keyFacts&populate[10]=timeline`;

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
    coverImage: getStrapiImageUrl(post.coverImage), // Use original size for best quality
    author: post.authorName || 'Hradiská',
    publishedAt: post.publishedAt,
    readTime: post.readingTime || 5,
    tags: post.tags?.map(t => t.name) || [],
    category: post.category?.slug || 'ostatne',
    hradiskaCategory: post.category ? [post.category.slug] : [],
    featured: post.featured || false,
  };
}
