import { appleStoreImage, appleStoreImageSrcSet } from '@/lib/utils/apple-store-image';

export type CategoryDiscoveryImage = {
  src: string;
  srcSet?: string;
  alt: string;
};

export type CategoryDiscoveryCard = {
  id: string;
  title: string;
  href: string;
  images: CategoryDiscoveryImage[];
};

/** Hero collage — same assets as Apple Store “get ready” row */
const HERO_COLLAGE_IMAGES: CategoryDiscoveryImage[] = [
  {
    ...appleStoreImageSrcSet('iphone-get-ready-iphone-17-pro-hero-202509', 332, 420, {
      format: 'png-alpha',
      version: 'WTRHWFFSY3AwTk1OeS9CNDRPUG1OYVdxRlgwR2dSamhqMnhGamJuMDFDems2VDBPYnNqbUNtUjdMbEQ4RTZtV3hWU0tRbVFUUU5ZWGJBamZjVGl3VDY3LzZ',
    }),
    alt: 'iPhone in Cosmic Orange case',
  },
  {
    ...appleStoreImageSrcSet('store-card-13-watch-nav-202509', 200, 260, {
      format: 'png-alpha',
      version: 'S0tSVzBtSkRkSFFhMm1zS1NmeWtkeUdJZTE2SHMxcG9uUER3YTRFOUZ6ckh5NTJ6cGtEemJOblBHR043ZjFkZzAzOVFHb3N0MkVmS01ZcFh0d1Y4R2k5NGJENldmZ3lMeGxpSDNmeE9hd2s',
    }),
    alt: 'Apple Watch',
  },
  {
    ...appleStoreImageSrcSet('store-card-13-airpods-nav-202509', 200, 260, {
      format: 'png-alpha',
      version: 'Q0Z1bWFqMUpRRnp3T0Y0VWJpdk1yMDhFUStvWHB3SDlDa3VrdUZORWRqeld1aTN5QlRYNG5PRjJxc2d1RklXbVM0TjRWdzF2UjRGVEY0c3dBQVZ6VGZUMjJQZFhhT2thWmkxZjhra3FyZEk',
    }),
    alt: 'AirPods Pro in charging case',
  },
];

export const CATEGORY_DISCOVERY_HERO = {
  title: "Discover what's new.",
  viewAllHref: '/products',
  viewAllLabel: 'View all',
  collageImages: HERO_COLLAGE_IMAGES,
} as const;

/** Category tiles — `store-card-40-*` images from https://www.apple.com/shop */
export const CATEGORY_DISCOVERY_CARDS: CategoryDiscoveryCard[] = [
  {
    id: 'iphone',
    title: 'iPhone',
    href: '/products?type=PH&brand_filter=Apple',
    images: [
      {
        src: appleStoreImage('store-card-40-iphone-17-202509', {
          width: 800,
          height: 1000,
          format: 'png-alpha',
        }),
        srcSet: `${appleStoreImage('store-card-40-iphone-17-202509', { width: 1600, height: 2000, format: 'png-alpha' })} 2x`,
        alt: 'iPhone 17 lineup',
      },
    ],
  },
  {
    id: 'ipad',
    title: 'iPad',
    href: '/products?type=TB&brand_filter=Apple',
    images: [
      {
        src: appleStoreImage('store-card-40-ipad-air-202603', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'UzBXQnlhUWdraTNvNU1Kb3pEQlpXR2xoVkNFSUF6ZStK',
        }),
        srcSet: `${appleStoreImage('store-card-40-ipad-air-202603', { width: 1600, height: 2000, format: 'jpeg', quality: 90, version: 'UzBXQnlhUWdraTNvNU1Kb3pEQlpXR2xoVkNFSUF6ZStK' })} 2x`,
        alt: 'iPad Air lineup',
      },
    ],
  },
  {
    id: 'watch',
    title: 'Apple Watch',
    href: '/products?type=AC&brand_filter=Apple&search=watch',
    images: [
      {
        src: appleStoreImage('store-card-40-watch-s11-202509', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'QWhYaUFuRS9hTUliZ3N5RWVCV09vdjl0SUx3WU51YXRx',
        }),
        srcSet: `${appleStoreImage('store-card-40-watch-s11-202509', { width: 1600, height: 2000, format: 'jpeg', quality: 90, version: 'QWhYaUFuRS9hTUliZ3N5RWVCV09vdjl0SUx3WU51YXRx' })} 2x`,
        alt: 'Apple Watch Series 11 models',
      },
    ],
  },
  {
    id: 'airpods',
    title: 'AirPods',
    href: '/products?type=AC&brand_filter=Apple&search=airpods',
    images: [
      {
        ...appleStoreImageSrcSet('airpods-pro-3-hero-select-202509', 400, 400, {
          format: 'jpeg',
          quality: 90,
          version: 'cmp4MmZ6OWxOeHNNTXh4SzlBNUpEb1RucE9zZTI5eEREa',
        }),
        alt: 'AirPods Pro',
      },
      {
        src: appleStoreImage('store-card-40-airpods-max-202409_GEO_US', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'WlczMnlkejNQakk5eW14MEJjQmdLd0hoakxSaUU2WUtGRGZ1cmhVSERsSFUvdWo0OXUzR2x0Z0haVDFBUVBIV3AwckMxbExydC8yeDhtUjlFVHdKVmx4TFU0OVFoVWdhN0VnWk1QaFFQYVZpZmNYV2ZGcUQ4by8rbTNjSFBvNDE',
        }),
        alt: 'AirPods Max',
      },
    ],
  },
  {
    id: 'mac-laptops',
    title: 'Mac laptops',
    href: '/products?type=LT&brand_filter=Apple',
    images: [
      {
        src: appleStoreImage('store-card-40-macbook-air-202603', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'MjhMcWJ2MGZwbXEwdnBkcUN6ZnhyNW1zWVJKOElDbC9l',
        }),
        srcSet: `${appleStoreImage('store-card-40-macbook-air-202603', { width: 1600, height: 2000, format: 'jpeg', quality: 90, version: 'MjhMcWJ2MGZwbXEwdnBkcUN6ZnhyNW1zWVJKOElDbC9l' })} 2x`,
        alt: 'MacBook Air',
      },
      {
        src: appleStoreImage('store-card-40-macbook-pro-202510', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'MjhMcWJ2MGZwbXEwdnBkcUN6ZnhyMm9DK3hwOFVzTGV2',
        }),
        alt: 'MacBook Pro',
      },
    ],
  },
  {
    id: 'mac-desktops',
    title: 'Mac desktops',
    href: '/products?type=LT&brand_filter=Apple&search=imac',
    images: [
      {
        src: appleStoreImage('store-card-40-pro-display-202603', {
          width: 800,
          height: 1000,
          format: 'jpeg',
          quality: 90,
          version: 'NUZWanRoamZCdURRVnJnb1VsZlUzb0tNR2h2aGJESnJI',
        }),
        srcSet: `${appleStoreImage('store-card-40-pro-display-202603', { width: 1600, height: 2000, format: 'jpeg', quality: 90, version: 'NUZWanRoamZCdURRVnJnb1VsZlUzb0tNR2h2aGJESnJI' })} 2x`,
        alt: 'iMac and Studio Display',
      },
    ],
  },
];
