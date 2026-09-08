'use client';

import { ReviewsShowcase } from '@/components/ReviewsShowcase';

export function HomeReviews() {
  return (
    <section id="reviews" className="ag-section scroll-mt-28">
      <ReviewsShowcase variant="hub" />
    </section>
  );
}
