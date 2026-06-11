'use client';

import Link from 'next/link';
import {
  CATEGORY_DISCOVERY_CARDS,
  CATEGORY_DISCOVERY_HERO,
  CATEGORY_DISCOVERY_HERO_WIDTHS,
} from '@/lib/config/category-discovery';
import { getCloudinaryBannerImageUrl } from '@/lib/utils/cloudinary';

function PillButton({ label }: { label: string }) {
  return <span className="category-discovery__pill">{label}</span>;
}

function CategoryDiscoveryHeroImage() {
  const { imageUrl, fallbackImage, imageWidth, imageHeight } = CATEGORY_DISCOVERY_HERO;
  const sourceUrl = imageUrl || fallbackImage;
  const defaultWidth = 1280;
  const heroSrc = getCloudinaryBannerImageUrl(
    sourceUrl,
    defaultWidth,
    imageWidth,
    imageHeight,
    'contain'
  );
  const srcSet = CATEGORY_DISCOVERY_HERO_WIDTHS.map(
    (width) =>
      `${getCloudinaryBannerImageUrl(sourceUrl, width, imageWidth, imageHeight, 'contain')} ${width}w`
  ).join(', ');

  return (
    <img
      src={heroSrc}
      srcSet={srcSet}
      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 92vw, 1280px"
      alt=""
      className="category-discovery__hero-image"
      width={imageWidth}
      height={imageHeight}
      fetchPriority="high"
      decoding="async"
    />
  );
}

export function CategoryDiscoverySection() {
  return (
    <div className="category-discovery">
      <div className="category-discovery__hero">
        <CategoryDiscoveryHeroImage />
        <div className="category-discovery__hero-content">
          <h3 className="category-discovery__hero-title">{CATEGORY_DISCOVERY_HERO.title}</h3>
          <Link
            href={CATEGORY_DISCOVERY_HERO.viewAllHref}
            className="category-discovery__hero-link"
            prefetch={false}
          >
            <PillButton label={CATEGORY_DISCOVERY_HERO.viewAllLabel} />
          </Link>
        </div>
      </div>

      <div className="category-discovery__grid">
        {CATEGORY_DISCOVERY_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="category-discovery__card category-discovery__card--has-bg"
            style={{ backgroundImage: `url(${card.backgroundImage})` }}
            prefetch={false}
          >
            <div className="category-discovery__card-header">
              <h3 className="category-discovery__card-title">{card.title}</h3>
              <PillButton label="View all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
