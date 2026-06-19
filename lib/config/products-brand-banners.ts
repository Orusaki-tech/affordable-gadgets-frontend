/** Brand hero on /products — keys match URL `brand_filter` (case-insensitive). */

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
  /** Canva / Cloudinary master width (reference: 1280 at 1×). */
  imageWidth?: number;
  /** Canva / Cloudinary master height (Back Market min-h-72 = 288px at 1280). */
  imageHeight?: number;
};

const PRODUCTS_BRAND_BANNERS: Record<string, ProductsBrandBannerConfig> = {
  apple: {
    brandFilter: 'Apple',
    title: 'Apple',
    subtitle: 'iPhone, iPad, Mac, and accessories.',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781191802/products-banners/iphone.png',
    imageAlt:
      'Latest Apple devices in Kenya — shop genuine new Apple products with trusted local support',
    imageWidth: 8000,
    imageHeight: 1800,
  },
  samsung: {
    brandFilter: 'Samsung',
    title: 'Samsung',
    subtitle: '',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781265362/products-banners/samsung.jpg',
    imageAlt: 'Samsung Galaxy S26 Ultra — shop now',
    imageWidth: 6425,
    imageHeight: 1453,
  },
  google: {
    brandFilter: 'Google',
    title: 'Google',
    subtitle: 'Pixel cameras and clean Android.',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781354997/products-banners/google.png',
    imageAlt: 'Google Pixel 9 and Pixel Buds bundle — shop now',
    imageWidth: 8000,
    imageHeight: 1800,
  },
  oneplus: {
    brandFilter: 'OnePlus',
    title: 'OnePlus',
    subtitle: 'Fast, smooth flagship Android.',
  },
  xiaomi: {
    brandFilter: 'Xiaomi',
    title: 'Xiaomi',
    subtitle: 'Premium Xiaomi smartphones.',
  },
  nothing: {
    brandFilter: 'Nothing',
    title: 'Nothing',
    subtitle: 'Distinctive design, clean software.',
  },
  honor: {
    brandFilter: 'Honor',
    title: 'Honor',
    subtitle: 'Honor smartphones and more.',
  },
  redmi: {
    brandFilter: 'Redmi',
    title: 'Redmi',
    subtitle: 'Value-packed Redmi phones.',
  },
  oppo: {
    brandFilter: 'Oppo',
    title: 'Oppo',
    subtitle: 'Oppo smartphones in Kenya.',
  },
  vivo: {
    brandFilter: 'Vivo',
    title: 'Vivo',
    subtitle: 'Vivo phones for every budget.',
  },
  realme: {
    brandFilter: 'Realme',
    title: 'Realme',
    subtitle: 'Realme performance phones.',
  },
  tecno: {
    brandFilter: 'Tecno',
    title: 'Tecno',
    subtitle: 'Affordable Tecno smartphones.',
  },
  infinix: {
    brandFilter: 'Infinix',
    title: 'Infinix',
    subtitle: 'Infinix phones in Kenya.',
  },
  itel: {
    brandFilter: 'Itel',
    title: 'Itel',
    subtitle: 'Budget-friendly Itel phones.',
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
