const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

const TRANSFORM_KEYS = ['w_', 'h_', 'c_', 'g_', 'f_', 'q_', 'ar_', 'dpr_'];

function hasTransformationSegment(segment: string): boolean {
  return TRANSFORM_KEYS.some((key) => segment.includes(key));
}

export function getCloudinarySizedImageUrl(
  url: string,
  size: number,
  fit: 'cover' | 'contain' = 'cover'
): string {
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

  const transformation = fit === 'contain'
    ? `f_auto,q_auto,c_fit,w_${size},h_${size}`
    : `f_auto,q_auto,c_fill,g_auto,w_${size},h_${size}`;
  return `${prefix}${CLOUDINARY_UPLOAD_SEGMENT}${transformation}/${remainingPath}`;
}
