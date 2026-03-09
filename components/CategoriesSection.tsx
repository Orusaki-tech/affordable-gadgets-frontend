'use client';

import Link from 'next/link';
import { CATEGORY_CARDS } from '@/lib/config/categories';

export function CategoriesSection() {
  return (
    <div className="categories-section">
      <div className="categories-section__grid">
        {CATEGORY_CARDS.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="categories-section__card"
            prefetch={false}
          >
            <div className="categories-section__media">
              <img
                src={category.image}
                alt={category.name}
                className="categories-section__image"
              />
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







