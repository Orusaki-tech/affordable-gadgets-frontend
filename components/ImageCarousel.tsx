'use client';

import { ProductCarousel } from './ProductCarousel';

const COLLECTION_CARD_COUNT = 6;
const COLLECTION_CARD_IMAGES = [
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773057672/iphoneban2_t40liv.png',
    alt: 'Innovation phone banner',
  },
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773058512/rhodeban1_ig82ln.png',
    alt: 'Rhode banner',
  },
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773059482/ipad_f1vrto.png',
    alt: 'iPad banner',
  },
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773060032/ipadkeyboard_miugjf.png',
    alt: 'iPad keyboard banner',
  },
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773060758/s26ultra_pspe1g.png',
    alt: 'S26 Ultra banner',
  },
  {
    src: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773061641/pixel10a_zno8vl.png',
    alt: 'Pixel 10a banner',
  },
] as const;

export function ImageCarousel() {
  return (
    <div className="image-carousel">
      <ProductCarousel
        itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
        showNavigation={true}
        showPagination={false}
        autoPlay={false}
      >
        {Array.from({ length: COLLECTION_CARD_COUNT }).map((_, index) => (
          <div key={`collection-card-${index}`} className="image-carousel__card" aria-hidden>
            <div className="image-carousel__card-media">
              {COLLECTION_CARD_IMAGES[index] ? (
                <img
                  src={COLLECTION_CARD_IMAGES[index].src}
                  alt={COLLECTION_CARD_IMAGES[index].alt}
                  loading="lazy"
                  decoding="async"
                  className="image-carousel__card-image"
                />
              ) : null}
            </div>
          </div>
        ))}
      </ProductCarousel>
    </div>
  );
}
