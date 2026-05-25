/** Local product art — public/images/category-discovery (see README there) */
const DISCOVERY_IMG = '/images/category-discovery';

export type CategoryDiscoveryImage = {
  src: string;
  alt: string;
};

export type CategoryDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  images: CategoryDiscoveryImage[];
};

function discoveryImage(filename: string, alt: string): CategoryDiscoveryImage {
  return { src: `${DISCOVERY_IMG}/${filename}`, alt };
}

const HERO_COLLAGE_IMAGES: CategoryDiscoveryImage[] = [
  discoveryImage('hero-iphone-pro.png', 'iPhone in Cosmic Orange case'),
  discoveryImage('hero-watch.png', 'Apple Watch'),
  discoveryImage('hero-airpods.png', 'AirPods Pro in charging case'),
];

export const CATEGORY_DISCOVERY_HERO = {
  title: "Discover what's new.",
  viewAllHref: '/products',
  viewAllLabel: 'View all',
  collageImages: HERO_COLLAGE_IMAGES,
} as const;

export const CATEGORY_DISCOVERY_CARDS: CategoryDiscoveryCard[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    href: '/products?type=PH&brand_filter=Apple',
    images: [discoveryImage('iphone.png', 'iPhone 17 lineup')],
  },
  {
    id: 'ipad',
    title: 'iPad',
    href: '/products?type=TB&brand_filter=Apple',
    images: [discoveryImage('ipad.jpg', 'iPad Air lineup')],
  },
  {
    id: 'watch',
    title: 'Apple Watch',
    href: '/products?type=AC&brand_filter=Apple&search=watch',
    images: [discoveryImage('watch.jpg', 'Apple Watch Series 11 models')],
  },
  {
    id: 'airpods',
    title: 'AirPods',
    href: '/products?type=AC&brand_filter=Apple&search=airpods',
    images: [
      discoveryImage('airpods-pro.png', 'AirPods Pro'),
      discoveryImage('airpods-max.jpg', 'AirPods Max'),
    ],
  },
  {
    id: 'mac-laptops',
    title: 'Mac laptops',
    href: '/products?type=LT&brand_filter=Apple',
    images: [
      discoveryImage('macbook-air.jpg', 'MacBook Air'),
      discoveryImage('macbook-pro.jpg', 'MacBook Pro'),
    ],
  },
  {
    id: 'mac-desktops',
    title: 'Mac desktops',
    href: '/products?type=LT&brand_filter=Apple&search=imac',
    images: [discoveryImage('mac-desktop.jpg', 'iMac and Studio Display')],
  },
];
