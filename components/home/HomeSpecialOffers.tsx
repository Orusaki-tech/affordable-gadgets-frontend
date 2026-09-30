'use client';

import { SpecialOffers } from '@/components/SpecialOffers';

/** Homepage Special Offers strip — same catalog as /promotions. */
export function HomeSpecialOffers() {
  return (
    <section
      id="special-offers"
      className="home-redesign__special-offers ag-section ag-section--tight scroll-mt-28"
    >
      <div className="home-section-panel">
        <SpecialOffers filter="special_offers" pageSize={24} />
      </div>
    </section>
  );
}
