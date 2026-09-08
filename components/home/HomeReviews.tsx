'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';

export function HomeReviews() {
  return (
    <section id="reviews" className="mx-auto mt-14 max-w-[1400px] scroll-mt-28 px-4 lg:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-stock-green">
            Social Proof &amp; Authenticity
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Verified Kenyan Techies Love Us
          </h2>
          <p className="mt-2 flex items-center gap-1 text-sm text-secondary">
            <span className="inline-flex text-amber-400">
              <MaterialIcon name="star" className="text-[16px]" filled />
              <MaterialIcon name="star" className="text-[16px]" filled />
              <MaterialIcon name="star" className="text-[16px]" filled />
              <MaterialIcon name="star" className="text-[16px]" filled />
              <MaterialIcon name="star" className="text-[16px]" filled />
            </span>
            Based on verified purchase ratings across Kenya.
          </p>
        </div>
        <Link href="/reviews" className="text-sm font-semibold text-primary">
          See all reviews
        </Link>
      </div>
      <ReviewsShowcase />
    </section>
  );
}
