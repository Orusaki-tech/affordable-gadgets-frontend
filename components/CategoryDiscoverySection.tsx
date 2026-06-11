'use client';

import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import {
  CATEGORY_DISCOVERY_CARDS,
  CATEGORY_DISCOVERY_HERO,
} from '@/lib/config/category-discovery';

function PillButton({ label }: { label: string }) {
  return <span className="category-discovery__pill">{label}</span>;
}

export function CategoryDiscoverySection() {
  const heroSrc = CATEGORY_DISCOVERY_HERO.imageUrl || CATEGORY_DISCOVERY_HERO.fallbackImage;

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
        <CloudinaryImage
          src={heroSrc}
          alt={CATEGORY_DISCOVERY_HERO.alt}
          preset="hero"
          width={CATEGORY_DISCOVERY_HERO.imageWidth}
          height={CATEGORY_DISCOVERY_HERO.imageHeight}
          pictureClassName="category-discovery__hero-picture"
          className="category-discovery__hero-image"
          priority
        />
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
            <div className="category-discovery__card-media">
              <CloudinaryImage
                src={card.backgroundImage}
                alt={card.title}
                preset="card"
                className="category-discovery__card-image"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
