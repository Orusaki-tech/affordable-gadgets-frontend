'use client';

import Link from 'next/link';
import { CATEGORY_CARDS, type CategoryCard } from '@/lib/config/categories';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';

export function CategoriesPage() {
  return (
    <div className="categories-page">
      <h1 className="categories-page__title section-label">Shop by Category</h1>

      {/* Category Cards */}
      <div className="categories-page__grid">
        {CATEGORY_CARDS.map((category) => (
          <Link key={category.code} href={category.href} className="categories-page__card" prefetch={false}>
            {/* Wrap the image in its own container for the background color */}
            <div className="categories-page__card-image-wrapper">
              <img
                src={category.image}
                alt={category.name}
                className="categories-page__card-icon"
              />
            </div>
            {/* Title sits below the image wrapper */}
            <p className="categories-page__card-title">{category.name}</p>
          </Link>
        ))}
      </div>

      {/* Featured Products by Category */}
      <div className="categories-page__sections">
        {CATEGORY_CARDS.map((category) => (
          <CategoryProducts key={category.code} category={category} />
        ))}
      </div>
    </div>
  );
}

function CategoryProducts({ category }: { category: CategoryCard }) {
  const { data, isLoading } = useProducts({ type: category.code, page_size: 4 });
  const filteredResults = (data?.results ?? []).filter(
    (product) => product.product_type === category.code
  );

  const sectionId = category.name.toLowerCase().replace(/\s*\/\s*/g, '-');

  if (isLoading) {
    return (
      <div id={sectionId} className="categories-page__section">
        <h2 className="categories-page__section-heading">{category.name}</h2>
        <div className="categories-page__products">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="categories-page__skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || filteredResults.length === 0) {
    return null;
  }

  return (
    <div id={sectionId} className="categories-page__section">
      <div className="categories-page__section-header">
        <h2 className="categories-page__section-title section-label">{category.name}</h2>
        <Link
          href={category.href}
          className="categories-page__section-link"
          prefetch={false}
        >
          View All →
        </Link>
      </div>
      <div className="categories-page__products">
        {filteredResults.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}







