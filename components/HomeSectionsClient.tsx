'use client';

import dynamic from 'next/dynamic';

export const SpecialOffersClient = dynamic(
  () => import('@/components/SpecialOffers').then((mod) => mod.SpecialOffers),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={`special-offers-skeleton-${i}`} className="bg-lime-100/60 animate-pulse rounded-2xl aspect-square" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={`product-grid-skeleton-${i}`} className="bg-gray-200 animate-pulse rounded-lg h-96" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={`reviews-skeleton-${i}`} className="bg-gray-100 animate-pulse rounded-2xl h-56" />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={`categories-skeleton-${i}`} className="bg-gray-100 animate-pulse rounded-2xl h-40" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={`recently-viewed-skeleton-${i}`} className="bg-gray-100 animate-pulse rounded-lg h-48" />
        ))}
      </div>
    ),
  }
);
