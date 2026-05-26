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
  backgroundImage: `${DISCOVERY_IMG}/hero.jpg`,
} as const;

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
