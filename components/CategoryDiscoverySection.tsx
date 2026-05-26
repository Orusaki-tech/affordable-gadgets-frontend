'use client';

import Link from 'next/link';
import {
  CATEGORY_DISCOVERY_CARDS,
  CATEGORY_DISCOVERY_HERO,
} from '@/lib/config/category-discovery';

function PillButton({ label }: { label: string }) {
  return <span className="category-discovery__pill">{label}</span>;
}

export function CategoryDiscoverySection() {
  return (
    <div className="category-discovery">
      <div
        className="category-discovery__hero"
        style={{ backgroundImage: `url(${CATEGORY_DISCOVERY_HERO.backgroundImage})` }}
      >
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
        {CATEGORY_DISCOVERY_CARDS.map((card) => {
          const images = card.images ?? [];
          return (
          <Link
            key={card.id}
            href={card.href}
            className={`category-discovery__card${
              card.backgroundImage ? ' category-discovery__card--has-bg' : ''
            }`}
            style={
              card.backgroundImage
                ? { backgroundImage: `url(${card.backgroundImage})` }
                : undefined
            }
            prefetch={false}
          >
            <div className="category-discovery__card-header">
              <h3 className="category-discovery__card-title">{card.title}</h3>
              <PillButton label="View all" />
            </div>
            {images.length > 0 ? (
            <div
              className={`category-discovery__card-media${
                images.length > 1 ? ' category-discovery__card-media--multi' : ''
              }`}
            >
              {images.map((image) => (
                <div key={`${card.id}-${image.src}`} className="category-discovery__card-image-wrap">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="category-discovery__card-image"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            ) : null}
          </Link>
          );
        })}
      </div>
    </div>
  );
}
