/**
 * React Query hook for Featured-tagged articles (homepage buying guides).
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { OpenAPI, type PublicArticleCard } from '@/lib/api/generated';
import { apiBaseUrl } from '@/lib/api/openapi';
import { FEATURED_ARTICLES_PAGE_SIZE } from '@/lib/blog/articlePage';

export type PaginatedFeaturedArticles = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PublicArticleCard[];
};

/** Client fetch — no-store + cache-bust so Studio tag changes show immediately. */
export async function fetchFeaturedArticlesLive(): Promise<PaginatedFeaturedArticles> {
  OpenAPI.BASE = apiBaseUrl;
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': '1',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const url = `${base}/api/v1/public/articles/?tag=featured&page_size=${FEATURED_ARTICLES_PAGE_SIZE}&page=1&_=${Date.now()}`;
  const res = await fetch(url, {
    credentials: 'omit',
    headers,
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Featured articles request failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    count?: number;
    next?: string | null;
    previous?: string | null;
    results?: PublicArticleCard[];
  };
  const results = data.results ?? [];
  return {
    count: typeof data.count === 'number' ? data.count : results.length,
    next: data.next ?? null,
    previous: data.previous ?? null,
    results,
  };
}

export function useFeaturedArticles() {
  return useQuery<PaginatedFeaturedArticles>({
    queryKey: ['articles', 'featured'],
    queryFn: fetchFeaturedArticlesLive,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
