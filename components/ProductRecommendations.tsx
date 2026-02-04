'use client';

import { useProduct } from '@/lib/hooks/useProducts';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';

interface ProductRecommendationsProps {
  productId: number;
}

export function ProductRecommendations({ productId }: ProductRecommendationsProps) {
  const { data: currentProduct } = useProduct(productId);
  const { data: recommendationsData } = useProducts({
    type: currentProduct?.product_type,
    page_size: 4,
  });

  if (!currentProduct || !recommendationsData) {
    return null;
  }

  // Filter out current product and get similar products
  const recommendations = recommendationsData.results
    .filter((p) => p.id !== productId)
    .slice(0, 4);

  if (recommendations.length === 0) {
    return null;
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







