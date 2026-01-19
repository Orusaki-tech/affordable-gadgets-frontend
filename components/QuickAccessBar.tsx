'use client';

import Link from 'next/link';

const categories = [
  { name: 'Phones', href: '/products?type=PH', icon: '📱' },
  { name: 'Laptops', href: '/products?type=LT', icon: '💻' },
  { name: 'Tablets', href: '/products?type=TB', icon: '📱' },
  { name: 'Accessories', href: '/products?type=AC', icon: '🎧' },
];

export function QuickAccessBar() {
  return (
    <div className="w-full">
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 text-center">
        Quick Access
      </h3>
      <div className="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="flex flex-col items-center gap-2 min-w-[88px] sm:min-w-[100px] px-3 py-4 sm:px-4 sm:py-5 bg-white rounded-lg border border-gray-200 text-gray-700 transition-colors duration-200 hover:border-gray-300 hover:text-gray-900"
          >
            <div className="text-3xl sm:text-4xl">
              {category.icon}
            </div>
            <span className="text-xs sm:text-sm font-medium">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}







