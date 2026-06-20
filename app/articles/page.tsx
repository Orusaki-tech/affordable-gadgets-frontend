import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesFilterBar } from '@/components/ArticlesFilterBar';
import { ArticlesGrid } from '@/components/ArticlesGrid';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import {
  applyArticleFilters,
  resolveHubFromParam,
} from '@/lib/blog/articleFilters';
import { fetchAllPublishedArticles, fetchArticleBrandOptions } from '@/lib/blog/articlePage';
import type { PublicArticleCard } from '@/lib/api/generated';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buying Guides & Articles',
  description: 'Expert phone, laptop, tablet and accessory buying guides for renewed tech in Kenya.',
  alternates: {
    canonical: '/articles',
  },
  openGraph: {
    title: 'Buying Guides & Articles',
    description: 'Expert phone, laptop, tablet and accessory buying guides for renewed tech in Kenya.',
    url: '/articles',
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ArticlesIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search || '';
  const brand = sp.brand || '';
  const activeHub = resolveHubFromParam(sp.type);

  let articles: PublicArticleCard[] = [];
  let brandOptions: string[] = [];

  try {
    const [fetchedArticles, fetchedBrands] = await Promise.all([
      fetchAllPublishedArticles({
        search: sp.search,
        brand: sp.brand,
        productType: activeHub?.code,
      }),
      fetchArticleBrandOptions(activeHub?.code),
    ]);
    articles = applyArticleFilters(
      fetchedArticles,
      { search: sp.search, brand: sp.brand, productType: activeHub?.code },
      fetchedBrands,
    );
    brandOptions = fetchedBrands;
  } catch {
    articles = [];
    brandOptions = [];
  }

  const resultLabel = activeHub
    ? `${activeHub.label.toLowerCase()} guides`
    : 'guides';
  const brandLabel = brand ? ` from ${brand}` : '';

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      <Suspense fallback={<div className="site-header-wrapper"><HeaderWithAnnouncement /></div>}>
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Buying guides & articles</h1>
          <p className="text-gray-500 mb-6">
            Browse expert guides by device type and brand — phones, laptops, tablets and accessories in Kenya.
          </p>
          <Suspense fallback={<div className="h-24" />}>
            <ArticlesFilterBar brands={brandOptions} />
          </Suspense>

          {articles.length === 0 ? (
            <p className="text-gray-600">
              No {resultLabel} found{brandLabel}
              {search ? ` matching "${search}"` : ''}.
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {articles.length} {resultLabel}
                {brandLabel}
                {search ? ` matching "${search}"` : ''}
              </p>
              <ArticlesGrid articles={articles} />
            </>
          )}

          <div className="mt-10">
            <Link href="/products" className="text-blue-600 hover:underline">
              Browse products
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
