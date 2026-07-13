/**
 * Primary nav / mega-menu product listing URLs that should be indexable
 * and self-canonical (eligible for sitelinks). Everything else stays
 * noindex + canonical /products.
 */

import {
  PRODUCT_TYPES,
  SHOP_NAV,
  allBrandNavItems,
  brandCategoryHref,
  type ProductTypeFilter,
} from '@/lib/config/nav-links';

export type ListingSearchParams = Record<string, string | string[] | undefined>;

/** Query params that make a listing a near-duplicate / non-marketing filter. */
const NON_MARKETING_FILTER_PARAMS = new Set([
  'search',
  'min_price',
  'max_price',
  'promotion',
  'focusSearch',
  'openFilters',
  'condition',
  'storage',
  'ram',
  'sort',
  'ordering',
  'brand',
]);

const MARKETING_PARAM_KEYS = new Set(['type', 'brand_filter']);

function asString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim();
  return (value ?? '').trim();
}

function hasNonEmptyParam(value: string | string[] | undefined): boolean {
  if (value === undefined) return false;
  if (Array.isArray(value)) return value.some((v) => Boolean(String(v).trim()));
  return Boolean(String(value).trim());
}

function listingKey(brandFilter: string, productType: string): string {
  return `${brandFilter.trim().toLowerCase()}|${productType.trim().toUpperCase()}`;
}

function buildAllowlist(): Set<string> {
  const keys = new Set<string>();

  for (const type of PRODUCT_TYPES) {
    keys.add(listingKey('', type));
  }

  for (const brand of allBrandNavItems()) {
    for (const category of brand.categories) {
      keys.add(listingKey(brand.brandFilter, category.productType ?? ''));
    }
  }

  for (const link of SHOP_NAV) {
    const query = link.href.includes('?') ? link.href.split('?')[1] : '';
    const params = new URLSearchParams(query);
    keys.add(listingKey(params.get('brand_filter') || '', params.get('type') || ''));
  }

  return keys;
}

const INDEXABLE_LISTING_KEYS = buildAllowlist();

export function buildIndexableListingPath(
  brandFilter: string,
  productType: ProductTypeFilter | null | '',
): string {
  const brand = brandFilter.trim();
  const type = (productType || '').trim().toUpperCase() as ProductTypeFilter | '';

  if (brand && type) {
    return brandCategoryHref(brand, type as ProductTypeFilter);
  }
  if (brand) {
    return brandCategoryHref(brand, null);
  }
  if (type) {
    return `/products?type=${type}`;
  }
  return '/products';
}

/**
 * Returns a self-canonical path when the query matches a primary nav marketing
 * landing; otherwise null (caller should noindex + canonical /products).
 */
export function resolveIndexableProductListing(
  sp: ListingSearchParams,
): { canonicalPath: string; brandFilter: string; productType: string } | null {
  for (const [key, value] of Object.entries(sp)) {
    if (!hasNonEmptyParam(value)) continue;
    if (key === 'page' || MARKETING_PARAM_KEYS.has(key)) continue;
    if (NON_MARKETING_FILTER_PARAMS.has(key)) return null;
    // Ignore tracking / unknown params (utm_*, etc.).
  }

  const brandFilter = asString(sp.brand_filter);
  const productType = asString(sp.type).toUpperCase();

  if (!brandFilter && !productType) {
    return null;
  }

  if (productType && !PRODUCT_TYPES.includes(productType as ProductTypeFilter)) {
    return null;
  }

  if (!INDEXABLE_LISTING_KEYS.has(listingKey(brandFilter, productType))) {
    return null;
  }

  return {
    canonicalPath: buildIndexableListingPath(
      brandFilter,
      (productType || null) as ProductTypeFilter | null,
    ),
    brandFilter,
    productType,
  };
}

/** All indexable marketing listing paths for the sitemap (deduped, stable order). */
export function listIndexableProductListingPaths(): {
  mainNav: string[];
  shopByBrand: string[];
  optionalBrands: string[];
} {
  const seen = new Set<string>();
  const mainNav: string[] = [];
  const shopByBrand: string[] = [];
  const optionalBrands: string[] = [];

  const add = (bucket: string[], path: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    bucket.push(path);
  };

  // Primary brands "all" landings (header mega triggers).
  for (const brand of allBrandNavItems().filter((b) =>
    ['Apple', 'Samsung', 'Google', 'OnePlus'].includes(b.brandFilter),
  )) {
    add(mainNav, brandCategoryHref(brand.brandFilter, null));
  }

  // Sony + Accessories from SHOP_NAV, normalized to canonical query order.
  for (const link of SHOP_NAV) {
    const query = link.href.includes('?') ? link.href.split('?')[1] : '';
    const params = new URLSearchParams(query);
    const typeParam = (params.get('type') || '').toUpperCase();
    const productType = PRODUCT_TYPES.includes(typeParam as ProductTypeFilter)
      ? (typeParam as ProductTypeFilter)
      : null;
    add(
      mainNav,
      buildIndexableListingPath(params.get('brand_filter') || '', productType),
    );
  }

  // Type hubs + primary mega-menu category combos.
  for (const type of PRODUCT_TYPES) {
    add(shopByBrand, `/products?type=${type}`);
  }

  for (const brand of allBrandNavItems().filter((b) =>
    ['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony'].includes(b.brandFilter),
  )) {
    for (const category of brand.categories) {
      if (!category.productType) continue;
      add(shopByBrand, brandCategoryHref(brand.brandFilter, category.productType));
    }
  }

  // More brands (optional / lower priority).
  for (const brand of allBrandNavItems().filter(
    (b) => !['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony'].includes(b.brandFilter),
  )) {
    add(optionalBrands, brandCategoryHref(brand.brandFilter, null));
    for (const category of brand.categories) {
      if (!category.productType) continue;
      add(optionalBrands, brandCategoryHref(brand.brandFilter, category.productType));
    }
  }

  return { mainNav, shopByBrand, optionalBrands };
}

export { PRODUCT_TYPES };
