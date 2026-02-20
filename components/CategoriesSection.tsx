'use client';

import Link from 'next/link';

const categories = [
  {
    name: 'Phones',
    href: '/products?type=PH',
    description: 'Latest smartphones',
    image: '/categories/phones.jpg',
  },
  {
    name: 'Laptops',
    href: '/products?type=LT',
    description: 'Powerful laptops',
    image: '/categories/laptops.jpg',
  },
  {
    name: 'Tablets/Ipads',
    href: '/products?type=TB',
    description: 'Portable tablets',
    image: '/categories/tablets.jpg',
  },
  {
    name: 'Accessories',
    href: '/products?type=AC',
    description: 'Essential accessories',
    image: '/categories/accessories.jpg',
  },
];

export function CategoriesSection() {
  const categoryIcons = ['📱', '💻', '📱', '🎧'];
  const categoryGradients = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #a855f7, #6d28d9)',
    'linear-gradient(135deg, #ec4899, #be185d)',
    'linear-gradient(135deg, #22c55e, #15803d)',
  ];

  return (
    <div className="categories-section">
      <div className="categories-section__grid">
        {categories.map((category, index) => (
          <Link
            key={category.name}
            href={category.href}
            className="categories-section__card"
          >
            <div
              className="categories-section__media"
              style={{ backgroundImage: categoryGradients[index] }}
            >
              <div className="categories-section__overlay"></div>
              <span className="categories-section__icon">
                {categoryIcons[index]}
              </span>
            </div>
            <div className="categories-section__content">
              <h3 className="categories-section__title">
                {category.name}
              </h3>
              <div className="categories-section__cta">
                <span>Explore</span>
                <svg className="categories-section__cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}







