/** Brand hero on /products — keys match URL `brand_filter` (case-insensitive). */
const BANNERS_IMG = '/images/banners';
/** Bust CDN/browser cache when banner files change */
const BANNER_ASSET_VERSION = '2';

export type ProductsBrandBannerConfig = {
  brandFilter: string;
  /** Nav label and page h1 (e.g. iPhone for Apple) */
  title: string;
  subtitle: string;
  priceLine?: string;
  backgroundImage?: string;
};

const PRODUCTS_BRAND_BANNERS: Record<string, ProductsBrandBannerConfig> = {
  apple: {
    brandFilter: 'Apple',
    title: 'iPhone',
    subtitle: 'Just the right amount of everything.',
    priceLine: 'Compare prices on the latest models.',
    backgroundImage: `${BANNERS_IMG}/iphone.jpg?v=${BANNER_ASSET_VERSION}`,
  },
  samsung: {
    brandFilter: 'Samsung',
    title: 'Samsung',
    subtitle: 'Galaxy phones built for every day.',
    priceLine: 'See current deals and trade-in options.',
    backgroundImage: `${BANNERS_IMG}/samsung.jpg?v=${BANNER_ASSET_VERSION}`,
  },
  google: {
    brandFilter: 'Google',
    title: 'Google',
    subtitle: 'Pixel cameras and clean Android.',
    priceLine: 'Sharp photos and smooth performance.',
  },
  sony: {
    brandFilter: 'Sony',
    title: 'Sony',
    subtitle: 'Premium Xperia and audio gear.',
    priceLine: 'Shop Sony phones and accessories.',
  },
};

export function getBrandBannerConfig(
  brandFilter: string
): ProductsBrandBannerConfig | undefined {
  const key = brandFilter.trim().toLowerCase();
  if (!key) return undefined;
  return PRODUCTS_BRAND_BANNERS[key];
}

export function getBrandBannerTitleForMetadata(brandFilter: string): string | undefined {
  return getBrandBannerConfig(brandFilter)?.title;
}
