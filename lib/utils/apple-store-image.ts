/** Apple Store CDN — same host/path as https://www.apple.com/shop */
const APPLE_STORE_IMAGE_BASE =
  'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is';

export type AppleStoreImageOptions = {
  width: number;
  height: number;
  format?: 'png-alpha' | 'jpeg' | 'p-jpg';
  quality?: number;
  /** Cache-buster from Apple HTML (optional; URLs work without it). */
  version?: string;
};

export function appleStoreImage(
  imageName: string,
  { width, height, format = 'png-alpha', quality, version }: AppleStoreImageOptions
): string {
  const parts = [`wid=${width}`, `hei=${height}`, `fmt=${format}`];
  if (quality != null && (format === 'jpeg' || format === 'p-jpg')) {
    parts.push(`qlt=${quality}`);
  }
  // Apple CDN expects a literal `.v=` segment (not URL-encoded).
  if (version) {
    parts.push(`.v=${version}`);
  }
  return `${APPLE_STORE_IMAGE_BASE}/${imageName}?${parts.join('&')}`;
}

/** @2x srcset pair for retina (Apple uses double width/height). */
export function appleStoreImageSrcSet(
  imageName: string,
  width: number,
  height: number,
  opts?: Omit<AppleStoreImageOptions, 'width' | 'height'>
): { src: string; srcSet: string } {
  const src = appleStoreImage(imageName, { width, height, ...opts });
  const srcSet = `${appleStoreImage(imageName, { width: width * 2, height: height * 2, ...opts })} 2x`;
  return { src, srcSet };
}
