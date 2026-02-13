'use client';

import Link from 'next/link';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductCard } from './ProductCard';
import Image from 'next/image'

const categories = [
  {
    name: 'Phones',
    code: 'PH',
    description: 'Latest smartphones from top brands',
    icon: 'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1770976074/cats_ff5nh0.webp',
    href: '/products?type=PH',
  },
  {
    name: 'Laptops',
    code: 'LT',
    description: 'Powerful laptops for work and play',
    icon: '💻',
    href: '/products?type=LT',
  },
  {
    name: 'Tablets',
    code: 'TB',
    description: 'Portable tablets for productivity',
    icon: '📱',
    href: '/products?type=TB',
  },
  {
    name: 'Accessories',
    code: 'AC',
    description: 'Essential accessories and peripherals',
    icon: '🎧',
    href: '/products?type=AC',
  },
];

export function CategoriesPage() {
  return (
    <div className="categories-page">
      <h1 className="categories-page__title section-label">Shop by Category</h1>

      {/* Category Cards */}
      <div className="categories-page__grid">
        {categories.map((category) => (
          <Link
            key={category.code}
            href={category.href}
            className="categories-page__card"
          >
           <Image src={category.icon} width={500} height={500} alt="Picture of the author"/>
            <h2 className="categories-page__card-title">{category.name}</h2>
            <p className="categories-page__card-description">{category.description}</p>
          </Link>
        ))}
      </div>

     

      {/* Featured Products by Category */}
      <div className="categories-page__sections">
        {categories.map((category) => (
          <CategoryProducts key={category.code} category={category} />
        ))}
      </div>
    </div>
  );
}

type Category = {
  name: string;
  code: string;
  description: string;
  icon: string;
  href: string;
};

function CategoryProducts({ category }: { category: Category }) {
  const { data, isLoading } = useProducts({ type: category.code, page_size: 4 });
  const filteredResults = (data?.results ?? []).filter(
    (product) => product.product_type === category.code
  );

  if (isLoading) {
    return (
      <div className="categories-page__section">
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
    <div className="categories-page__section">
      <div className="categories-page__section-header">
        <h2 className="categories-page__section-title section-label">{category.name}</h2>
        <Link
          href={category.href}
          className="categories-page__section-link"
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







