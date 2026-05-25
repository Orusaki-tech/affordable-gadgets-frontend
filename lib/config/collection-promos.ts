import { appleStoreImage } from '@/lib/utils/apple-store-image';

export type CollectionPromoVariant = 'dark' | 'lavender' | 'peach' | 'light';

export type CollectionPromoCard = {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  href: string;
  image: {
    src: string;
    srcSet?: string;
    alt: string;
  };
  variant: CollectionPromoVariant;
};

/** Browse carousel — Apple CDN for Apple tiles; Cloudinary for Samsung/Pixel promos */
export const COLLECTION_PROMO_CARDS: CollectionPromoCard[] = [
  {
    id: 'ipad-keyboard',
    title: 'Keyboards for iPad',
    subtitle: 'Type it out. Take it with you',
    href: '/products?type=AC&search=keyboard',
    image: {
      src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_800/v1773060032/ipadkeyboard_miugjf.png',
      srcSet:
        'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_1600/v1773060032/ipadkeyboard_miugjf.png 2x',
      alt: 'iPad with Magic Keyboard',
    },
    variant: 'dark',
  },
  {
    id: 'galaxy-s26',
    title: 'Galaxy S26 Ultra',
    subtitle: 'Coming Soon',
    href: '/products?type=PH&brand_filter=Samsung&search=S26',
    image: {
      src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_800/v1773060758/s26ultra_pspe1g.png',
      srcSet:
        'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_1600/v1773060758/s26ultra_pspe1g.png 2x',
      alt: 'Samsung Galaxy S26 Ultra',
    },
    variant: 'lavender',
  },
  {
    id: 'pixel-10a',
    title: 'Google Pixel 10a.',
    subtitle: 'The real deal is here.',
    body: 'Sharp photos, smooth Android, and value that holds up day to day.',
    href: '/products?type=PH&brand_filter=Google&search=Pixel',
    image: {
      src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_800/v1773061641/pixel10a_zno8vl.png',
      srcSet:
        'https://res.cloudinary.com/dhgaqa2gb/image/upload/f_auto,q_auto:best,w_1600/v1773061641/pixel10a_zno8vl.png 2x',
      alt: 'Google Pixel 10a',
    },
    variant: 'peach',
  },
  {
    id: 'iphone-lineup',
    title: 'iPhone',
    subtitle: 'Latest from Apple',
    href: '/products?type=PH&brand_filter=Apple',
    image: {
      src: appleStoreImage('store-card-40-iphone-17-202509', {
        width: 800,
        height: 1000,
        format: 'png-alpha',
      }),
      srcSet: `${appleStoreImage('store-card-40-iphone-17-202509', { width: 1600, height: 2000, format: 'png-alpha' })} 2x`,
      alt: 'iPhone lineup',
    },
    variant: 'light',
  },
  {
    id: 'ipad-lineup',
    title: 'iPad',
    subtitle: 'Work and play anywhere',
    href: '/products?type=TB&brand_filter=Apple',
    image: {
      src: appleStoreImage('store-card-40-ipad-air-202603', {
        width: 800,
        height: 1000,
        format: 'jpeg',
        quality: 90,
        version: 'UzBXQnlhUWdraTNvNU1Kb3pEQlpXR2xoVkNFSUF6ZStK',
      }),
      alt: 'iPad lineup',
    },
    variant: 'light',
  },
  {
    id: 'airpods-max',
    title: 'AirPods Max',
    subtitle: 'Immersive sound',
    href: '/products?type=AC&brand_filter=Apple&search=airpods',
    image: {
      src: appleStoreImage('store-card-40-airpods-max-202409_GEO_US', {
        width: 800,
        height: 1000,
        format: 'jpeg',
        quality: 90,
        version: 'WlczMnlkejNQakk5eW14MEJjQmdLd0hoakxSaUU2WUtGRGZ1cmhVSERsSFUvdWo0OXUzR2x0Z0haVDFBUVBIV3AwckMxbExydC8yeDhtUjlFVHdKVmx4TFU0OVFoVWdhN0VnWk1QaFFQYVZpZmNYV2ZGcUQ4by8rbTNjSFBvNDE',
      }),
      alt: 'AirPods Max',
    },
    variant: 'lavender',
  },
];
