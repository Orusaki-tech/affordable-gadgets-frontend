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
    <div className="min-h-screen flex flex-col">
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>

      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mx-auto max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Shop by Budget</h1>
          <p className="mt-3 text-base leading-7 text-gray-600 sm:text-lg">
            Start with your price range and explore gadgets that fit your budget. This page helps shoppers
            quickly narrow down products before using detailed filters on the main catalog.
          </p>
        </section>

        <section className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
          {priceRanges.map((range) => (
            <Link
              key={range.label}
              href={range.href}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">{range.label}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{range.description}</p>
            </Link>
          ))}
        </section>

        <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">Browse by category</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Prefer to start with a product type? Jump into a category, then refine the results by price,
            brand, or search terms.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
            {categoryLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
                {link.label}
              </Link>
            ))}
            <Link href="/match-score" className="rounded-full bg-gray-100 px-4 py-2 text-gray-700">
              Try the match score tool
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}







