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

export const HomeProductVideosClient = dynamic(
  () => import('@/components/HomeProductVideos').then((mod) => mod.HomeProductVideos),
  {
    ssr: false,
    loading: () => (
      <section className="bg-[#F9F9F9] py-8" aria-hidden>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 max-w-lg animate-pulse rounded bg-gray-100" />
          <div className="mt-5 flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={`home-videos-skel-${i}`}
                className="aspect-[9/16] w-[175px] shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-[185px]"
              />
            ))}
          </div>
        </div>
      </section>
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
