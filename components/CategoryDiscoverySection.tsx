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
        <div className="category-discovery__hero-media">
          <div className="category-discovery__hero-collage" aria-hidden>
            {CATEGORY_DISCOVERY_HERO.collageImages.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt=""
                className="category-discovery__hero-collage-item"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="category-discovery__grid">
        {CATEGORY_DISCOVERY_CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="category-discovery__card"
            prefetch={false}
          >
            <div className="category-discovery__card-header">
              <h3 className="category-discovery__card-title">{card.title}</h3>
              <PillButton label="View all" />
            </div>
            <div
              className={`category-discovery__card-media${
                card.images.length > 1 ? ' category-discovery__card-media--multi' : ''
              }`}
            >
              {card.images.map((image) => (
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
          </Link>
        ))}
      </div>
    </div>
  );
}
