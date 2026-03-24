import type { PublicProductList } from '@/lib/api/generated';

/** Typical vertical social specs: 1080×1920 (9:16). We display in a 9:16 frame; uploads at that resolution fill the card without extra letterboxing. */
export const PRODUCT_VIDEO_DISPLAY_RATIO = '9 / 16' as const;

export function isDirectVideoFileUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

export function vimeoEmbedUrl(url: string, autoplay = false): string | null {
  const id = extractVimeoId(url);
  if (!id) return null;
  const q = autoplay ? '?autoplay=1' : '';
  return `https://player.vimeo.com/video/${id}${q}`;
}

export function youtubeEmbedUrlFromLink(url: string, autoplay = false): string | null {
  if (!url) return null;
  if (url.includes('youtube.com/embed/')) {
    if (!autoplay) return url.split('&autoplay')[0];
    return url.includes('autoplay=1') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
  }
  let videoId: string | null = null;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) videoId = watchMatch[1];
  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
  }
  if (!videoId) {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
    if (shortsMatch) videoId = shortsMatch[1];
  }
  if (!videoId) {
    const embedMatch = url.match(/embed\/([^?&]+)/);
    if (embedMatch) videoId = embedMatch[1];
  }
  if (!videoId) return null;
  videoId = videoId.split('&')[0].split('?')[0];
  const q = autoplay ? '?autoplay=1' : '';
  return `https://www.youtube.com/embed/${videoId}${q}`;
}

export type ResolvedProductVideo =
  | { mode: 'file'; src: string }
  | { mode: 'embed'; src: string };

export function resolveProductVideoMedia(
  product: Pick<PublicProductList, 'product_video_url' | 'product_video_file_url'>
): ResolvedProductVideo | null {
  const fileUrl = product.product_video_file_url ?? null;
  const linkUrl = product.product_video_url ?? null;

  if (fileUrl && isDirectVideoFileUrl(fileUrl)) {
    return { mode: 'file', src: fileUrl };
  }
  if (linkUrl && isDirectVideoFileUrl(linkUrl)) {
    return { mode: 'file', src: linkUrl };
  }

  if (linkUrl) {
    const y = youtubeEmbedUrlFromLink(linkUrl, false);
    if (y) return { mode: 'embed', src: y };
    const v = vimeoEmbedUrl(linkUrl, false);
    if (v) return { mode: 'embed', src: v };
  }

  if (fileUrl) {
    return { mode: 'file', src: fileUrl };
  }

  return null;
}
