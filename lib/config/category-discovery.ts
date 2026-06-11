/** Local product art — public/images/category-discovery (see README there) */
const DISCOVERY_IMG = '/images/category-discovery';

/** Cloudinary folder for card masters (see scripts/upload-category-discovery-cards.sh). */
export const CATEGORY_DISCOVERY_CARD_CLOUDINARY_FOLDER = 'category-discovery/cards';

export type CategoryDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  /** Cloudinary master URL — updated after running upload script. */
  backgroundImage: string;
  alt: string;
};

/** Local filename stem → drop matching file in public/images/category-discovery/cards/ */
export const CATEGORY_DISCOVERY_CARD_FILES = [
  'iphone',
  'ipad',
  'watch',
  'airpods',
  'mac-laptops',
  'mac-desktops',
] as const;

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

export const CATEGORY_DISCOVERY_CARDS: CategoryDiscoveryCard[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    href: '/products?type=PH&brand_filter=Apple',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180550/category-discovery/cards/iphone.jpg',
    alt: 'iPhone in cosmic orange finish, partial-screen display and side angle showing Action button, volume button, and side button',
  },
  {
    id: 'ipad',
    title: 'iPad',
    href: '/products?type=TB&brand_filter=Apple',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180551/category-discovery/cards/ipad.jpg',
    alt: 'iPad with colorful display',
  },
  {
    id: 'watch',
    title: 'Apple Watch',
    href: '/products?type=AC&brand_filter=Apple&search=watch',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180552/category-discovery/cards/watch.jpg',
    alt: 'Apple Watch with watch face on display',
  },
  {
    id: 'airpods',
    title: 'AirPods',
    href: '/products?type=AC&brand_filter=Apple&search=airpods',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180554/category-discovery/cards/airpods.jpg',
    alt: 'AirPods with charging case',
  },
  {
    id: 'mac-laptops',
    title: 'Mac laptops',
    href: '/products?type=LT&brand_filter=Apple',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180555/category-discovery/cards/mac-laptops.jpg',
    alt: 'MacBook laptop open at an angle',
  },
  {
    id: 'mac-desktops',
    title: 'Mac desktops',
    href: '/products?type=LT&brand_filter=Apple&search=imac',
    backgroundImage:
      'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1781180556/category-discovery/cards/mac-desktops.jpg',
    alt: 'iMac desktop computer with display and accessories',
  },
];
