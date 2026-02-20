'use client';

import Link from 'next/link';

const categories = [
  { name: 'Phones', href: '/products?type=PH', icon: '📱' },
  { name: 'Laptops', href: '/products?type=LT', icon: '💻' },
  { name: 'Tablets/Ipads', href: '/products?type=TB', icon: '📱' },
  { name: 'Accessories', href: '/products?type=AC', icon: '🎧' },
];

export function QuickAccessBar() {
  return (
    <div className="quick-access">
      <h3 className="quick-access__title">
        Quick Access
      </h3>
      <div className="quick-access__list">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="quick-access__item"
          >
            <div className="quick-access__icon">
              {category.icon}
            </div>
            <span className="quick-access__label">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}







