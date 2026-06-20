import type { PublicArticleCard } from '@/lib/api/generated';
import {
  ARTICLE_HUBS,
  type ArticleHub,
  type ArticleProductTypeCode,
} from '@/lib/blog/articleHubs';

export interface ArticleListFilters {
  search?: string;
  brand?: string;
  productType?: ArticleProductTypeCode;
}

export function buildArticlesQuery(filters: ArticleListFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.brand?.trim()) params.set('brand', filters.brand.trim());
  if (filters.productType) params.set('product_type', filters.productType);
  return params.toString();
}

export function buildArticlesPath(filters: ArticleListFilters, hub?: ArticleHub): string {
  const qs = buildArticlesQuery(filters);
  const base = hub ? `/articles/${hub.slug}` : '/articles';
  return qs ? `${base}?${qs}` : base;
}

export function extractBrandOptions(articles: PublicArticleCard[]): string[] {
  const brands = new Set<string>();
  for (const article of articles) {
    const brand = article.product_brand?.trim();
    if (brand && brand.toUpperCase() !== 'N/A') {
      brands.add(brand);
    }
  }
  return [...brands].sort((a, b) => a.localeCompare(b));
}

export function groupArticlesByProductType(
  articles: PublicArticleCard[],
): Array<{ hub: ArticleHub; articles: PublicArticleCard[] }> {
  const grouped = new Map<ArticleProductTypeCode, PublicArticleCard[]>();
  for (const hub of ARTICLE_HUBS) {
    grouped.set(hub.code, []);
  }

  for (const article of articles) {
    const code = article.product_type as ArticleProductTypeCode | undefined;
    if (!code || !grouped.has(code)) continue;
    grouped.get(code)!.push(article);
  }

  return ARTICLE_HUBS.map((hub) => ({
    hub,
    articles: grouped.get(hub.code) ?? [],
  })).filter((section) => section.articles.length > 0);
}
