'use client';

import type { ReactNode } from 'react';
import { ProductCarousel } from '@/components/ProductCarousel';

interface BlogArticlesCarouselProps {
  children: ReactNode[];
  itemsPerView?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function BlogArticlesCarousel({
  children,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 4 },
  autoPlay = false,
  autoPlayInterval = 6000,
}: BlogArticlesCarouselProps) {
  return (
    <ProductCarousel
      itemsPerView={itemsPerView}
      showNavigation
      alwaysShowNavigation
      autoPlay={autoPlay}
      autoPlayInterval={autoPlayInterval}
      className="blog-articles-section__carousel-track"
    >
      {children}
    </ProductCarousel>
  );
}
