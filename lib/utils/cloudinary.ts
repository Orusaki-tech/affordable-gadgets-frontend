const DEFAULT_CLOUDINARY_CLOUD_NAME = 'dhgaqa2gb';

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

const TRANSFORM_KEYS = ['w_', 'h_', 'c_', 'g_', 'f_', 'q_', 'ar_', 'dpr_'];

function hasTransformationSegment(segment: string): boolean {
  return TRANSFORM_KEYS.some((key) => segment.includes(key));
}

function buildCloudinaryTransformedUrl(url: string, transformation: string): string {
  if (!url || !url.includes(CLOUDINARY_UPLOAD_SEGMENT)) {
    return url;
  }

  const [prefix, rest] = url.split(CLOUDINARY_UPLOAD_SEGMENT);
  if (!rest) {
    return url;
  }

  const [firstSegment, ...restSegments] = rest.split('/');
  const hasTransform = firstSegment ? hasTransformationSegment(firstSegment) : false;
  const remainingPath = hasTransform ? restSegments.join('/') : rest;
  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/${remainingPath}`;
}

export function getCloudinarySizedImageUrl(
  url: string,
  size: number,
  fit: 'cover' | 'contain' = 'cover'
): string {
  const transformation = fit === 'contain'
    ? `f_auto,q_auto,c_fit,w_${size},h_${size}`
    : `f_auto,q_auto,c_fill,g_auto,w_${size},h_${size}`;
  return buildCloudinaryTransformedUrl(url, transformation);
}

/** Wide banner / hero tiles — width-only scaling, `f_auto` + `q_auto:best` for sharpness. */
export function getCloudinaryBannerImageUrl(
  url: string,
  width: number,
  _aspectWidth?: number,
  _aspectHeight?: number,
  fit: 'cover' | 'contain' = 'contain'
): string {
  if (fit === 'contain') {
    return buildCloudinaryTransformedUrl(url, `f_auto,q_auto:best,c_limit,w_${width}`);
  }
  const aspectWidth = _aspectWidth ?? width;
  const aspectHeight = _aspectHeight ?? width;
  const height = Math.round((width * aspectHeight) / aspectWidth);
  return buildCloudinaryTransformedUrl(
    url,
    `f_auto,q_auto:best,c_fill,g_east,w_${width},h_${height}`
  );
}

/** Apple-style `srcset`: `image.jpg, image_2x.jpg 2x` */
export function getCloudinaryDensitySrcSet(
  url: string,
  width1x: number,
  width2x: number
): string {
  const oneX = getCloudinaryBannerImageUrl(url, width1x, undefined, undefined, 'contain');
  const twoX = getCloudinaryBannerImageUrl(url, width2x, undefined, undefined, 'contain');
  return `${oneX}, ${twoX} 2x`;
}

/**
 * Cloudinary **fetch**: pull a publicly reachable image URL and deliver it with transformations
 * (e.g. WebP resize). Enable for trust stamps via NEXT_PUBLIC_TRUST_STAMP_CLOUDINARY=1.
 *
 * @see https://cloudinary.com/documentation/fetch_remote_images
 */
export function getCloudinaryFetchUrl(
  absoluteRemoteUrl: string,
  opts: { width: number; height?: number; format?: 'webp' | 'auto' }
): string {
  const cloudName =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ||
    DEFAULT_CLOUDINARY_CLOUD_NAME;
  const height = opts.height ?? opts.width;
  const format = opts.format ?? 'webp';
  const transform =
    format === 'auto'
      ? `f_auto,q_auto,c_fit,w_${opts.width},h_${height}`
      : `f_${format},q_auto,c_fit,w_${opts.width},h_${height}`;
  const encoded = encodeURIComponent(absoluteRemoteUrl);
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transform}/${encoded}`;
}
