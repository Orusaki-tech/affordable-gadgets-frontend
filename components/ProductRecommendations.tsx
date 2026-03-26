'use client';

import { useProduct } from '@/lib/hooks/useProducts';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';

interface ProductRecommendationsProps {
  productId: number;
}

function RecommendationsSkeleton() {
  return (
    <div className="product-recommendations product-recommendations--skeleton" aria-hidden="true">
      <div className="product-recommendations__title-skel" />
      <div className="product-recommendations__grid">
        {[...Array(4)].map((_, idx) => (
          <div key={`rec-skel-${idx}`} className="product-recommendations__card-skel" />
        ))}
      </div>
    </div>
  );
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { data: currentProduct, isLoading: isCurrentLoading } = useProduct(productId);
  const { data: recommendationsData, isLoading: isRecsLoading } = useProducts({
    type: currentProduct?.product_type,
    page_size: 4,
  });

  if (isCurrentLoading || isRecsLoading || !currentProduct || !recommendationsData) return <RecommendationsSkeleton />;

  // Filter out current product and get similar products
  const recommendations = recommendationsData.results
    .filter((p) => p.id !== productId)
    .slice(0, 4);

  if (recommendations.length === 0) {
    // Keep the section mounted to avoid CLS after hydration.
    return (
      <div className="product-recommendations product-recommendations--empty" aria-live="polite">
        <h2 className="product-recommendations__title section-label">You May Also Like</h2>
        <p className="product-recommendations__empty">No similar products to show right now.</p>
      </div>
    );
  }

  return (
    <div className="product-recommendations">
      <h2 className="product-recommendations__title section-label">You May Also Like</h2>
      <div className="product-recommendations__grid">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}







