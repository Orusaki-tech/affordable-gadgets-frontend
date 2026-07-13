import { CloudinaryImage } from '@/components/CloudinaryImage';

export type CollectionHeaderBannerProps = {
  /** Image path (e.g. /images/banners/featured-banner.jpg). If not set, a placeholder is shown. */
  src?: string;
  alt?: string;
  /** Optional: use a fixed height instead of aspect ratio. Default uses aspect-[3/1]. */
  className?: string;
};

export function CollectionHeaderBanner({
  src,
  alt = 'Featured banner',
  className = '',
}: CollectionHeaderBannerProps) {
  return (
    <div
      className={`collection-header-banner ${className}`.trim()}
      role="img"
      aria-label={alt}
    >
      <div className="collection-header-banner__inner">
        {src ? (
          <CloudinaryImage
            src={src}
            alt={alt}
            preset="collectionBanner"
            className="collection-header-banner__image"
            fill
          />
        ) : (
          <div className="collection-header-banner__placeholder" />
        )}
      </div>
    </div>
  );
}
