'use client';

import Link from 'next/link';
import { COLLECTION_PROMO_CARDS, type CollectionPromoCard } from '@/lib/config/collection-promos';
import { ProductCarousel } from './ProductCarousel';

function CollectionPromoSlide({ promo }: { promo: CollectionPromoCard }) {
  return (
    <Link
      href={promo.href}
      className={`image-carousel__card image-carousel__card--${promo.variant}`}
      prefetch={false}
    >
      <div className="image-carousel__card-copy">
        <h3 className="image-carousel__card-title">{promo.title}</h3>
        {promo.subtitle ? (
          <p
            className={`image-carousel__card-subtitle${
              promo.subtitle === 'Coming Soon' ? ' image-carousel__card-subtitle--link' : ''
            }`}
          >
            {promo.subtitle}
          </p>
        ) : null}
        {promo.body ? <p className="image-carousel__card-body">{promo.body}</p> : null}
      </div>
      <div className="image-carousel__card-media">
        <img
          src={promo.image.src}
          srcSet={promo.image.srcSet}
          alt={promo.image.alt}
          loading="lazy"
          decoding="async"
          className="image-carousel__card-image"
        />
      </div>
    </Link>
  );
}

export function ImageCarousel() {
  return (
    <div className="image-carousel">
      <ProductCarousel
        itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
        showNavigation
        showPagination={false}
        autoPlay
      >
        {COLLECTION_PROMO_CARDS.map((promo) => (
          <CollectionPromoSlide key={promo.id} promo={promo} />
        ))}
      </ProductCarousel>
    </div>
  );
}
