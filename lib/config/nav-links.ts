/** Shop navbar: brand triggers with per-category product filters. */

export type ProductTypeFilter = 'PH' | 'TB' | 'LT' | 'AC';

export type BrandCategoryLink = {
  label: string;
  productType: ProductTypeFilter | null;
};

export type BrandNavItem = {
  navLabel: string;
  brandFilter: string;
  categories: BrandCategoryLink[];
};

export type NavLink = {
  href: string;
  label: string;
};

type CategoryOptions = {
  phones?: boolean;
  tablets?: boolean;
  laptops?: boolean;
  accessories?: boolean;
  all?: boolean;
};

function buildCategories(navLabel: string, opts: CategoryOptions): BrandCategoryLink[] {
  const links: BrandCategoryLink[] = [];
  if (opts.phones) links.push({ label: 'Phones', productType: 'PH' });
  if (opts.tablets) links.push({ label: 'Tablets', productType: 'TB' });
  if (opts.laptops) links.push({ label: 'Laptops', productType: 'LT' });
  if (opts.accessories) links.push({ label: 'Accessories', productType: 'AC' });
  if (opts.all !== false) {
    links.push({ label: `All ${navLabel}`, productType: null });
  }
  return links;
}

function brandItem(
  navLabel: string,
  brandFilter: string,
  opts: CategoryOptions
): BrandNavItem {
  return {
    navLabel,
    brandFilter,
    categories: buildCategories(navLabel, opts),
  };
}

/** Flagship brands — top-level nav with hover category menus. */
export const PRIMARY_BRAND_NAV: BrandNavItem[] = [
  brandItem('Apple', 'Apple', {
    phones: true,
    tablets: true,
    laptops: true,
    accessories: true,
  }),
  brandItem('Samsung', 'Samsung', {
    phones: true,
    tablets: true,
    accessories: true,
  }),
  brandItem('Google', 'Google', { phones: true }),
  brandItem('OnePlus', 'OnePlus', { phones: true }),
];

/** Additional phone brands — grouped under "More" in the nav. */
export const MORE_BRAND_NAV: BrandNavItem[] = [
  brandItem('Xiaomi', 'Xiaomi', { phones: true }),
  brandItem('Nothing', 'Nothing', { phones: true }),
  brandItem('Honor', 'Honor', { phones: true }),
  brandItem('Redmi', 'Redmi', { phones: true }),
  brandItem('Oppo', 'Oppo', { phones: true }),
  brandItem('Vivo', 'Vivo', { phones: true }),
  brandItem('Realme', 'Realme', { phones: true }),
  brandItem('Tecno', 'Tecno', { phones: true }),
  brandItem('Infinix', 'Infinix', { phones: true }),
  brandItem('Itel', 'Itel', { phones: true }),
];

export const UTILITY_NAV: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/articles', label: 'Blog' },
  { href: '/financing', label: 'Financing' },
];

export function brandCategoryHref(
  brandFilter: string,
  productType: ProductTypeFilter | null
): string {
  const params = new URLSearchParams();
  params.set('brand_filter', brandFilter);
  if (productType) {
    params.set('type', productType);
  }
  return `/products?${params.toString()}`;
}

/** Flat list of all brands for filter sidebar selects. */
export function allBrandNavItems(): BrandNavItem[] {
  return [...PRIMARY_BRAND_NAV, ...MORE_BRAND_NAV];
}

export function isBrandNavActive(
  brandFilter: string,
  pathname: string,
  search: string
): boolean {
  if (pathname !== '/products') return false;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const current = (params.get('brand_filter') || params.get('brand') || '').trim();
  return current.toLowerCase() === brandFilter.toLowerCase();
}
