import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Budget Search',
  description: 'Shop gadgets by budget with quick links to affordable phones, laptops, tablets, and accessories.',
  alternates: {
    canonical: '/budget-search',
  },
  robots: {
    index: false,
    follow: true,
  },
};

const priceRanges = [
  {
    label: 'Under KES 20,000',
    href: '/products?max_price=20000',
    description: 'Affordable accessories, entry-level phones, and budget-friendly picks.',
  },
  {
    label: 'KES 20,000 to 50,000',
    href: '/products?min_price=20000&max_price=50000',
    description: 'Popular smartphones, tablets, and practical everyday devices.',
  },
  {
    label: 'KES 50,000 to 100,000',
    href: '/products?min_price=50000&max_price=100000',
    description: 'Mid-range laptops, premium phones, and high-value gadgets.',
  },
  {
    label: 'Above KES 100,000',
    href: '/products?min_price=100000',
    description: 'Flagship devices, professional laptops, and top-tier tech.',
  },
];

const categoryLinks = [
  { label: 'Phones', href: '/products?type=PH' },
  { label: 'Laptops', href: '/products?type=LT' },
  { label: 'Tablets & iPads', href: '/products?type=TB' },
  { label: 'Accessories', href: '/products?type=AC' },
];

export default function BudgetSearch() {
  return (
    <div className="app-page">
      <Suspense
        fallback={
          <HeaderWithAnnouncement />
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="app-page__main page-container u-py-8">
        <section className="page-card-elevated page-card-elevated--5xl page-card-elevated--mb-lg">
          <h1 className="page-heading-3xl">Shop by Budget</h1>
          <p className="page-lead">
            Start with your price range and explore gadgets that fit your budget. This page helps shoppers
            quickly narrow down products before using detailed filters on the main catalog.
          </p>
        </section>

        <section className="budget-search-card-grid" aria-label="Budget ranges">
          {priceRanges.map((range) => (
            <Link key={range.label} href={range.href} className="budget-search-range-card">
              <h2 className="budget-search-range-card__title">{range.label}</h2>
              <p className="budget-search-range-card__copy">{range.description}</p>
            </Link>
          ))}
        </section>

        <section className="budget-search-category-block">
          <h2 className="budget-search-category-block__title">Browse by category</h2>
          <p className="budget-search-category-block__lead">
            Prefer to start with a product type? Jump into a category, then refine the results by price,
            brand, or search terms.
          </p>
          <div className="page-pill-links">
            {categoryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="page-pill-link">
                {link.label}
              </Link>
            ))}
            <Link href="/match-score" className="page-pill-link">
              Try the match score tool
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}







