/** Brand hero on /products — keys match URL `brand_filter` (case-insensitive). */
const BANNERS_IMG = '/images/banners';
/** Bust CDN/browser cache when banner files change */
const BANNER_ASSET_VERSION = '6';

export type ProductsBrandBannerImages = {
  /** Shown below 768px */
  mobile: string;
  /** Shown at 768px and above */
  tablet: string;
  alt: string;
};

export type ProductsBrandBannerConfig = {
  brandFilter: string;
  /** Nav label and page h1 (e.g. iPhone for Apple) */
  title: string;
  subtitle: string;
  priceLine?: string;
  /** Single master (legacy brands) */
  backgroundImage?: string;
  /** Responsive masters on Cloudinary (mobile + tablet/desktop) */
  backgroundImages?: ProductsBrandBannerImages;
};

const PRODUCTS_BRAND_BANNERS: Record<string, ProductsBrandBannerConfig> = {
  apple: {
    brandFilter: 'Apple',
    title: 'iPhone',
    subtitle: 'Just the right amount of everything.',
    backgroundImages: {
      mobile:
        'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781183705/products-banners/iphone-mobile.jpg',
      tablet:
        'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781183706/products-banners/iphone-tablet.jpg',
      alt: 'Person holding iPhone in cosmic orange and silver finishes',
    },
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
    backgroundImage: `${BANNERS_IMG}/google-pixel10.png?v=${BANNER_ASSET_VERSION}`,
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
