/** Local product art — public/images/category-discovery (see README there) */
const DISCOVERY_IMG = '/images/category-discovery';

export type CategoryDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  backgroundImage: string;
};

export const CATEGORY_DISCOVERY_HERO = {
  title: "Discover what's new.",
  viewAllHref: '/products',
  viewAllLabel: 'View all',
  /** Cloudinary master — Apple large_2x (2160×752). */
  imageUrl:
    'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781178596/category-discovery/discover-hero.jpg',
  /** Local fallback if CDN is unreachable. */
  fallbackImage: `${DISCOVERY_IMG}/hero.png`,
  imageWidth: 2160,
  imageHeight: 752,
  alt: 'Apple devices showing the Home app',
} as const;

/** Apple-style `<picture>` breakpoints — 1x + 2x density per viewport. */
export const CATEGORY_DISCOVERY_HERO_PICTURE_SOURCES = [
  { media: '(max-width: 734px)', width1x: 288, width2x: 576 },
  { media: '(max-width: 1068px)', width1x: 784, width2x: 1568 },
  { media: '(min-width: 0px)', width1x: 1080, width2x: 2160 },
] as const;

export const CATEGORY_DISCOVERY_CARDS: CategoryDiscoveryCard[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    href: '/products?type=PH&brand_filter=Apple',
    backgroundImage: `${DISCOVERY_IMG}/iphone.jpg`,
  },
  {
    id: 'ipad',
    title: 'iPad',
    href: '/products?type=TB&brand_filter=Apple',
    backgroundImage: `${DISCOVERY_IMG}/ipad.jpg`,
  },
  {
    id: 'watch',
    title: 'Apple Watch',
    href: '/products?type=AC&brand_filter=Apple&search=watch',
    backgroundImage: `${DISCOVERY_IMG}/watch.jpg`,
  },
  {
    id: 'airpods',
    title: 'AirPods',
    href: '/products?type=AC&brand_filter=Apple&search=airpods',
    backgroundImage: `${DISCOVERY_IMG}/airpods.jpg`,
  },
  {
    id: 'mac-laptops',
    title: 'Mac laptops',
    href: '/products?type=LT&brand_filter=Apple',
    backgroundImage: `${DISCOVERY_IMG}/mac-laptops.jpg`,
  },
  {
    id: 'mac-desktops',
    title: 'Mac desktops',
    href: '/products?type=LT&brand_filter=Apple&search=imac',
    backgroundImage: `${DISCOVERY_IMG}/mac-desktops.jpg`,
  },
];
