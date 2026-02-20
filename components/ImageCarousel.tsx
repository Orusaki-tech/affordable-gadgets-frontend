'use client';

import { ProductCarousel } from './ProductCarousel';

const PLACEHOLDER_COUNT = 12;

export function ImageCarousel() {
  return (
    <div className="image-carousel">
      <ProductCarousel
        itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
        showNavigation={true}
        showPagination={false}
        autoPlay={false}
      >
        {[...Array(PLACEHOLDER_COUNT)].map((_, i) => (
          <div key={i} className="image-carousel__card" aria-hidden>
            <div className="image-carousel__card-media">
              <span className="image-carousel__card-icon">🖼️</span>
            </div>
          </div>
        ))}
      </ProductCarousel>
    </div>
  );
}
