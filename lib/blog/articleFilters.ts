import type { PublicArticleCard } from '@/lib/api/generated';
import {
  ARTICLE_HUBS,
  ARTICLE_HUB_BY_CODE,
  ARTICLE_HUB_BY_SLUG,
  type ArticleHub,
  type ArticleProductTypeCode,
} from '@/lib/blog/articleHubs';

export interface ArticleListFilters {
  search?: string;
  brand?: string;
  productType?: ArticleProductTypeCode;
}

const LAPTOP_RE = /macbook|laptop|notebook|chromebook/i;
const TABLET_RE = /ipad|tablet|\btab\b/i;
const ACCESSORY_RE =
  /airpods?|apple watch|watch series|charger|adapter|cable|case|buds|earbuds|pencil|keyboard|mouse|band|strap|cover|folio/i;
const PHONE_RE =
  /iphone|galaxy|pixel|phone|redmi|oneplus|oppo|vivo|realme|tecno|infinix|itel|honor|nothing|sony|xiaomi|nokia|huawei|motorola/i;

export function resolveHubFromParam(value?: string): ArticleHub | undefined {
  if (!value?.trim()) return undefined;
  const normalized = value.trim();
  if (normalized in ARTICLE_HUB_BY_SLUG) {
    return ARTICLE_HUB_BY_SLUG[normalized];
  }
  if (normalized in ARTICLE_HUB_BY_CODE) {
    return ARTICLE_HUB_BY_CODE[normalized as ArticleProductTypeCode];
  }
  return undefined;
}

export function resolveArticleProductType(
  article: PublicArticleCard,
): ArticleProductTypeCode | undefined {
  const code = article.product_type as ArticleProductTypeCode | undefined;
  if (code && code in ARTICLE_HUB_BY_CODE) return code;

  const text = `${article.product_name ?? ''} ${article.product_slug ?? ''}`;
  if (LAPTOP_RE.test(text)) return 'LT';
  if (TABLET_RE.test(text)) return 'TB';
  if (ACCESSORY_RE.test(text)) return 'AC';
  if (PHONE_RE.test(text)) return 'PH';
  return undefined;
}

export function resolveArticleBrand(
  article: PublicArticleCard,
  knownBrands: string[] = [],
): string | undefined {
  const fromApi = article.product_brand?.trim();
  if (fromApi && fromApi.toUpperCase() !== 'N/A') return fromApi;

  const name = article.product_name ?? '';
  const slug = article.product_slug ?? '';
  for (const brand of knownBrands) {
    const needle = brand.toLowerCase();
    if (name.toLowerCase().startsWith(needle) || slug.toLowerCase().startsWith(needle)) {
      return brand;
    }
  }
  return undefined;
}

export function buildArticlesQuery(filters: ArticleListFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.brand?.trim()) params.set('brand', filters.brand.trim());
  if (filters.productType) params.set('type', filters.productType);
  return params.toString();
}

export function buildArticlesPath(filters: ArticleListFilters): string {
  const qs = buildArticlesQuery(filters);
  return qs ? `/articles?${qs}` : '/articles';
}

export function filterArticlesByProductType(
  articles: PublicArticleCard[],
  productType: ArticleProductTypeCode,
): PublicArticleCard[] {
  return articles.filter((article) => resolveArticleProductType(article) === productType);
}

export function filterArticlesByBrand(
  articles: PublicArticleCard[],
  brand: string,
  knownBrands: string[] = [],
): PublicArticleCard[] {
  const needle = brand.trim().toLowerCase();
  if (!needle) return articles;
  return articles.filter((article) => resolveArticleBrand(article, knownBrands)?.toLowerCase() === needle);
}

export function extractBrandOptions(
  articles: PublicArticleCard[],
  knownBrands: string[] = [],
): string[] {
  const brands = new Set<string>();
  for (const article of articles) {
    const brand = resolveArticleBrand(article, knownBrands);
    if (brand) brands.add(brand);
  }
  return [...brands].sort((a, b) => a.localeCompare(b));
}

export function applyArticleFilters(
  articles: PublicArticleCard[],
  filters: ArticleListFilters,
  knownBrands: string[] = [],
): PublicArticleCard[] {
  let result = articles;
  if (filters.productType) {
    result = filterArticlesByProductType(result, filters.productType);
  }
  if (filters.brand?.trim()) {
    result = filterArticlesByBrand(result, filters.brand, knownBrands);
  }
  if (filters.search?.trim()) {
    const needle = filters.search.trim().toLowerCase();
    result = result.filter((article) => {
      const headline = article.headline?.toLowerCase() ?? '';
      const productName = article.product_name?.toLowerCase() ?? '';
      return headline.includes(needle) || productName.includes(needle);
    });
  }
  return result;
}

export function groupArticlesByProductType(
  articles: PublicArticleCard[],
): Array<{ hub: ArticleHub; articles: PublicArticleCard[] }> {
  const grouped = new Map<ArticleProductTypeCode, PublicArticleCard[]>();
  for (const hub of ARTICLE_HUBS) {
    grouped.set(hub.code, []);
  }

  for (const article of articles) {
    const code = resolveArticleProductType(article);
    if (!code || !grouped.has(code)) continue;
    grouped.get(code)!.push(article);
  }

  return ARTICLE_HUBS.map((hub) => ({
    hub,
    articles: grouped.get(hub.code) ?? [],
  })).filter((section) => section.articles.length > 0);
}
