'use client';

import type { ImgHTMLAttributes, ReactNode } from 'react';
import { IMAGE_PRESETS, type ImagePresetName } from '@/lib/config/image-presets';
import {
  getCloudinaryBannerImageUrl,
  getCloudinaryDensitySrcSet,
  getCloudinarySizedImageUrl,
  getCloudinaryWidthSrcSet,
  isCloudinaryUrl,
} from '@/lib/utils/cloudinary';

type CloudinaryImageProps = {
  src: string;
  alt: string;
  preset?: ImagePresetName;
  width?: number;
  height?: number;
  className?: string;
  pictureClassName?: string;
  wrapperClassName?: string;
  fit?: 'contain' | 'cover';
  priority?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  /** Fill a relative parent (product cards, banners). */
  fill?: boolean;
  onError?: ImgHTMLAttributes<HTMLImageElement>['onError'];
};

function getOptimizedSingleUrl(
  src: string,
  width: number,
  fit: 'contain' | 'cover'
): string {
  if (!isCloudinaryUrl(src)) {
    return src;
  }
  if (fit === 'cover') {
    return getCloudinarySizedImageUrl(src, width, 'cover');
  }
  return getCloudinaryBannerImageUrl(src, width, undefined, undefined, 'contain');
}

function withFillWrapper(
  node: ReactNode,
  fill: boolean | undefined,
  wrapperClassName: string | undefined
) {
  if (!fill) {
    return node;
  }
  return <span className={wrapperClassName ?? 'cloudinary-image__fill'}>{node}</span>;
}

export function CloudinaryImage({
  src,
  alt,
  preset,
  width,
  height,
  className,
  pictureClassName,
  wrapperClassName,
  fit = 'contain',
  priority = false,
  sizes,
  loading,
  decoding = 'async',
  fill = false,
  onError,
}: CloudinaryImageProps) {
  const fetchPriority = priority ? 'high' : 'auto';
  const imgLoading = loading ?? (priority ? 'eager' : 'lazy');
  const fillClassName = fill
    ? `${className ?? ''} cloudinary-image__img--fill cloudinary-image__img--${fit}`.trim()
    : className;

  if (!preset) {
    return withFillWrapper(
      <img
        src={src}
        alt={alt}
        className={fillClassName}
        width={width}
        height={height}
        loading={imgLoading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onError={onError}
      />,
      fill,
      wrapperClassName
    );
  }

  const presetConfig = IMAGE_PRESETS[preset];

  if (presetConfig.type === 'picture') {
    const fallbackSrc = getCloudinaryBannerImageUrl(
      src,
      presetConfig.fallbackWidth,
      width,
      height,
      'contain'
    );

    return withFillWrapper(
      <picture className={pictureClassName}>
        {presetConfig.sources.map(({ media, width1x, width2x }) => (
          <source
            key={media}
            media={media}
            srcSet={getCloudinaryDensitySrcSet(src, width1x, width2x)}
          />
        ))}
        <img
          src={isCloudinaryUrl(src) ? fallbackSrc : src}
          alt={alt}
          className={fillClassName}
          width={width}
          height={height}
          loading={imgLoading}
          fetchPriority={fetchPriority}
          decoding={decoding}
          onError={onError}
        />
      </picture>,
      fill,
      wrapperClassName
    );
  }

  if (presetConfig.type === 'srcset') {
    const presetFit = presetConfig.fit ?? fit;
    const defaultWidth = presetConfig.defaultWidth;
    const imgSrc = getOptimizedSingleUrl(src, defaultWidth, presetFit);
    const srcSet = getCloudinaryWidthSrcSet(src, presetConfig.widths, presetFit);

    return withFillWrapper(
      <img
        src={imgSrc}
        srcSet={isCloudinaryUrl(src) ? srcSet : undefined}
        sizes={sizes ?? presetConfig.sizes}
        alt={alt}
        className={fillClassName}
        width={width}
        height={height}
        loading={imgLoading}
        fetchPriority={fetchPriority}
        decoding={decoding}
        onError={onError}
      />,
      fill,
      wrapperClassName
    );
  }

  const logoWidth = presetConfig.width;
  const logoFit = presetConfig.fit ?? fit;

  return withFillWrapper(
    <img
      src={getOptimizedSingleUrl(src, logoWidth, logoFit)}
      alt={alt}
      className={fillClassName}
      width={width ?? logoWidth}
      height={height}
      loading={imgLoading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      onError={onError}
    />,
    fill,
    wrapperClassName
  );
}
