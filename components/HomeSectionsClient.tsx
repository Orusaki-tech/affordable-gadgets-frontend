'use client';

import dynamic from 'next/dynamic';

export const SpecialOffersClient = dynamic(
  () => import('@/components/SpecialOffers').then((mod) => mod.SpecialOffers),
  {
    ssr: false,
    loading: () => (
      <div className="home-sections__grid home-sections__grid--offers">
        {[...Array(4)].map((_, i) => (
          <div key={`special-offers-skeleton-${i}`} className="home-sections__skeleton home-sections__skeleton--offer" />
        ))}
      </div>
    ),
  }
);

export const ProductGridClient = dynamic(
  () => import('@/components/ProductGrid').then((mod) => mod.ProductGrid),
  {
    ssr: false,
    loading: () => (
      <div className="home-sections__grid home-sections__grid--products">
        {[...Array(8)].map((_, i) => (
          <div key={`product-grid-skeleton-${i}`} className="home-sections__skeleton home-sections__skeleton--product" />
        ))}
      </div>
    ),
  }
);

export const ReviewsShowcaseClient = dynamic(
  () => import('@/components/ReviewsShowcase').then((mod) => mod.ReviewsShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="home-sections__grid home-sections__grid--reviews">
        {[...Array(3)].map((_, i) => (
          <div key={`reviews-skeleton-${i}`} className="home-sections__skeleton home-sections__skeleton--review" />
        ))}
      </div>
    ),
  }
);

export const CategoriesSectionClient = dynamic(
  () => import('@/components/CategoriesSection').then((mod) => mod.CategoriesSection),
  {
    ssr: false,
    loading: () => (
      <div className="home-sections__grid home-sections__grid--categories">
        {[...Array(4)].map((_, i) => (
          <div key={`categories-skeleton-${i}`} className="home-sections__skeleton home-sections__skeleton--category" />
        ))}
      </div>
    ),
  }
);

export const RecentlyViewedClient = dynamic(
  () => import('@/components/RecentlyViewed').then((mod) => mod.RecentlyViewed),
  {
    ssr: false,
    loading: () => (
      <div className="home-sections__grid home-sections__grid--recent">
        {[...Array(4)].map((_, i) => (
          <div key={`recently-viewed-skeleton-${i}`} className="home-sections__skeleton home-sections__skeleton--recent" />
        ))}
      </div>
    ),
  }
);
