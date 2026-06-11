'use client';

import Link from 'next/link';
import {
  CATEGORY_DISCOVERY_CARDS,
  CATEGORY_DISCOVERY_HERO,
  CATEGORY_DISCOVERY_HERO_PICTURE_SOURCES,
} from '@/lib/config/category-discovery';
import { getCloudinaryBannerImageUrl, getCloudinaryDensitySrcSet } from '@/lib/utils/cloudinary';

function PillButton({ label }: { label: string }) {
  return <span className="category-discovery__pill">{label}</span>;
}

function CategoryDiscoveryHeroImage() {
  const { imageUrl, fallbackImage, imageWidth, imageHeight, alt } = CATEGORY_DISCOVERY_HERO;
  const sourceUrl = imageUrl || fallbackImage;
  const fallbackSrc = getCloudinaryBannerImageUrl(sourceUrl, 1080, imageWidth, imageHeight, 'contain');

  return (
    <picture className="category-discovery__hero-picture">
      {CATEGORY_DISCOVERY_HERO_PICTURE_SOURCES.map(({ media, width1x, width2x }) => (
        <source
          key={media}
          media={media}
          srcSet={getCloudinaryDensitySrcSet(sourceUrl, width1x, width2x)}
        />
      ))}
      <img
        src={fallbackSrc}
        alt={alt}
        className="category-discovery__hero-image"
        width={imageWidth}
        height={imageHeight}
        fetchPriority="high"
        decoding="async"
      />
    </picture>
  );
}

export function CategoryDiscoverySection() {
  return (
    <div className="category-discovery">
      <div className="category-discovery__hero">
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
        <CategoryDiscoveryHeroImage />
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
