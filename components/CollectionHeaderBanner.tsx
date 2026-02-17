import Image from 'next/image';

export type CollectionHeaderBannerProps = {
  /** Image path (e.g. /images/banners/featured-banner.jpg). If not set, a placeholder is shown. */
  src?: string;
  alt?: string;
  /** Optional: use a fixed height instead of aspect ratio. Default uses aspect-[3/1]. */
  className?: string;
};

const DEFAULT_ASPECT = 3 / 1; // wide banner

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
          <Image
            src={src}
            alt={alt}
            fill
            className="collection-header-banner__image"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1280px"
            priority
          />
        ) : (
          <div className="collection-header-banner__placeholder" />
        )}
      </div>
    </div>
  );
}
