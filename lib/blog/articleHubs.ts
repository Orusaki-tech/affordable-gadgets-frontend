export type ArticleProductTypeCode = 'PH' | 'LT' | 'TB' | 'AC';

export interface ArticleHub {
  code: ArticleProductTypeCode;
  slug: string;
  label: string;
  title: string;
  description: string;
}

export const ARTICLE_HUBS: ArticleHub[] = [
  {
    code: 'PH',
    slug: 'phones',
    label: 'Phones',
    title: 'Phone Buying Guides',
    description: 'Expert iPhone, Samsung, Pixel and smartphone buying guides in Kenya.',
  },
  {
    code: 'LT',
    slug: 'laptops',
    label: 'Laptops',
    title: 'Laptop Buying Guides',
    description: 'MacBook, Windows laptop and notebook buying guides for Kenya shoppers.',
  },
  {
    code: 'TB',
    slug: 'tablets',
    label: 'Tablets',
    title: 'Tablet & iPad Buying Guides',
    description: 'iPad and Android tablet buying guides with tips for Kenya buyers.',
  },
  {
    code: 'AC',
    slug: 'accessories',
    label: 'Accessories',
    title: 'Accessory Buying Guides',
    description: 'AirPods, watches, chargers and tech accessory guides in Kenya.',
  },
];

export const ARTICLE_HUB_BY_SLUG = Object.fromEntries(
  ARTICLE_HUBS.map((hub) => [hub.slug, hub]),
) as Record<string, ArticleHub>;

export const ARTICLE_HUB_BY_CODE = Object.fromEntries(
  ARTICLE_HUBS.map((hub) => [hub.code, hub]),
) as Record<ArticleProductTypeCode, ArticleHub>;

export function isArticleHubSlug(value: string): value is string {
  return value in ARTICLE_HUB_BY_SLUG;
}
