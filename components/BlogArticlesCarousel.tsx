'use client';

import type { ReactNode } from 'react';
import { ProductCarousel } from '@/components/ProductCarousel';

interface BlogArticlesCarouselProps {
  children: ReactNode[];
}

export function BlogArticlesCarousel({ children }: BlogArticlesCarouselProps) {
  return (
    <ProductCarousel
      itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
      showNavigation
      alwaysShowNavigation
      className="blog-articles-section__carousel-track"
    >
      {children}
    </ProductCarousel>
  );
}
