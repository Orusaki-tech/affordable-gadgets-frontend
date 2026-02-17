import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { StoriesCarousel } from '@/components/StoriesCarousel';
import { ProductGrid } from '@/components/ProductGrid';
import { SpecialOffersServer } from '@/components/SpecialOffersServer';
import { ReviewsShowcase } from '@/components/ReviewsShowcase';

type PromotionsPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PromotionsPage({ searchParams }: PromotionsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const filterParam = resolvedSearchParams?.filter;
  const filter: 'special_offers' | 'flash_sales' | undefined =
    filterParam === 'special_offers' || filterParam === 'flash_sales'
      ? filterParam
      : undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWithAnnouncement />
      <main className="flex-1">
        {/* Stories Carousel */}
        <section className="container mx-auto px-4 py-6">
          <StoriesCarousel autoAdvanceDuration={5} />
        </section>

        {/* Special Offers / Flash Sales (filtered if filter param exists) */}
        <section className="container mx-auto px-4 py-8">
          <SpecialOffersServer filter={filter} pageSize={100} />
        </section>

        {/* Featured Products */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
          <ProductGrid pageSize={8} showPagination={false} />
        </section>

        {/* Reviews Showcase */}
        <section className="container mx-auto px-4 py-8">
          <ReviewsShowcase />
        </section>
      </main>
      <Footer />
    </div>
  );
}







