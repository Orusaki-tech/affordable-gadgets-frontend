/** Brand hero on /products — keys match URL `brand_filter` (case-insensitive). */
const BANNERS_IMG = '/images/banners';
/** Bust CDN/browser cache when banner files change */
const BANNER_ASSET_VERSION = '7';

export type ProductsBrandBannerConfig = {
  brandFilter: string;
  /** Nav label and page h1 (e.g. iPhone for Apple) */
  title: string;
  subtitle: string;
  priceLine?: string;
  backgroundImage?: string;
  /** Banner field color behind contained art (e.g. #d4e157). */
  backgroundColor?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
};

const PRODUCTS_BRAND_BANNERS: Record<string, ProductsBrandBannerConfig> = {
  apple: {
    brandFilter: 'Apple',
    title: 'iPhone',
    subtitle: 'Just the right amount of everything.',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781186774/products-banners/iphone.png',
    backgroundColor: '#d4e157',
    imageAlt: 'Apple devices including MacBook, iPad, iPhone, AirPods, and Apple Watch',
    imageWidth: 2364,
    imageHeight: 630,
  },
  samsung: {
    brandFilter: 'Samsung',
    title: 'Samsung',
    subtitle: 'Galaxy phones built for every day.',
    priceLine: 'See current deals and trade-in options.',
    backgroundImage: `${BANNERS_IMG}/samsung.jpg?v=${BANNER_ASSET_VERSION}`,
    backgroundColor: '#d4e157',
  },
  google: {
    brandFilter: 'Google',
    title: 'Google',
    subtitle: 'Pixel cameras and clean Android.',
    backgroundImage: `${BANNERS_IMG}/google-pixel10.png?v=${BANNER_ASSET_VERSION}`,
    backgroundColor: '#d4e157',
  },
  sony: {
    brandFilter: 'Sony',
    title: 'Sony',
    subtitle: 'Premium Xperia and audio gear.',
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
