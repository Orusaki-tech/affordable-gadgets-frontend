/**
 * Responsive image presets for CloudinaryImage.
 *
 * - hero: Apple-style <picture> + 734/1068px breakpoints + 1x/2x density
 * - brandBanner: full-width /products brand hero (1280×288 reference, Back Market min-h-72)
 * - card: width-based srcset for tiles, carousels, category cards
 * - productThumb: product grids, cart line items, checkout
 * - logo: small brand marks, single optimized URL
 */
export const IMAGE_PRESETS = {
  hero: {
    type: 'picture',
    sources: [
      { media: '(max-width: 734px)', width1x: 288, width2x: 576 },
      { media: '(max-width: 1068px)', width1x: 784, width2x: 1568 },
      { media: '(min-width: 0px)', width1x: 1080, width2x: 2160 },
    ],
    fallbackWidth: 1080,
  },
  /** Full-viewport /products brand hero — 8000×1800 master, width srcset for retina. */
  brandBanner: {
    type: 'srcset',
    widths: [640, 1024, 1280, 1920, 2560, 3840],
    sizes: '100vw',
    defaultWidth: 2560,
    fit: 'contain' as const,
  },
  card: {
    type: 'srcset',
    widths: [300, 600, 900, 1200],
    sizes: '(max-width: 768px) 90vw, (max-width: 1280px) 45vw, 400px',
    defaultWidth: 600,
    fit: 'contain' as const,
  },
  /** Compact Discover category tiles (~344px slot, Apple shop proportions). */
  categoryCard: {
    type: 'srcset',
    widths: [344, 688, 1032],
    sizes: '(max-width: 767px) 90vw, (max-width: 1067px) 45vw, 344px',
    defaultWidth: 344,
    fit: 'contain' as const,
  },
  productThumb: {
    type: 'srcset',
    widths: [200, 400, 600, 800],
    sizes: '(max-width: 768px) 50vw, 280px',
    defaultWidth: 400,
    fit: 'contain' as const,
  },
  productGallery: {
    type: 'srcset',
    widths: [400, 800, 1200, 1600],
    sizes: '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px',
    defaultWidth: 800,
    fit: 'contain' as const,
  },
  logo: {
    type: 'single',
    width: 240,
    fit: 'contain' as const,
  },
} as const;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;
