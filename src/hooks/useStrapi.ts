import { useState, useEffect } from 'react';
import {
  getBlogPosts,
  getBlogPostBySlug,
  getCategories,
  getCategoryBySlug,
  getTags,
  convertStrapiPostToArticle,
  type StrapiBlogPost,
  type StrapiCategory,
  type StrapiTag,
} from '../lib/strapi';

/**
 * Hook to fetch blog posts with optional filters
 */
export function useBlogPosts(options?: {
  categorySlug?: string;
  tagSlug?: string;
  featured?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const [posts, setPosts] = useState<ReturnType<typeof convertStrapiPostToArticle>[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPosts() {
      setLoading(true);
      setError(null);

      try {
        const result = await getBlogPosts(options);
        if (!cancelled) {
          setPosts(result.posts.map(convertStrapiPostToArticle));
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch posts'));
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [options?.categorySlug, options?.tagSlug, options?.featured, options?.page, options?.pageSize]);

  return { posts, pagination, loading, error };
}

/**
 * Hook to fetch a single blog post by slug
 */
export function useBlogPost(slug: string) {
  const [post, setPost] = useState<StrapiBlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPost() {
      if (!slug) {
        setPost(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getBlogPostBySlug(slug);
        if (!cancelled) {
          setPost(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch post'));
          setPost(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { post, loading, error };
}

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<StrapiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      setLoading(true);
      setError(null);

      try {
        const result = await getCategories();
        if (!cancelled) {
          setCategories(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}

/**
 * Hook to fetch category by slug
 */
export function useCategory(slug: string) {
  const [category, setCategory] = useState<StrapiCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategory() {
      if (!slug) {
        setCategory(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getCategoryBySlug(slug);
        if (!cancelled) {
          setCategory(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch category'));
          setCategory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { category, loading, error };
}

/**
 * Hook to fetch all tags
 */
export function useTags() {
  const [tags, setTags] = useState<StrapiTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTags() {
      setLoading(true);
      setError(null);

      try {
        const result = await getTags();
        if (!cancelled) {
          setTags(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch tags'));
          setTags([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTags();

    return () => {
      cancelled = true;
    };
  }, []);

  return { tags, loading, error };
}
