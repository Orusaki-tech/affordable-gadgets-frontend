import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesFilterBar } from '@/components/ArticlesFilterBar';
import { ArticlesGrid } from '@/components/ArticlesGrid';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import {
  extractBrandOptions,
  groupArticlesByProductType,
} from '@/lib/blog/articleFilters';
import { fetchAllPublishedArticles } from '@/lib/blog/articlePage';
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
  const hasFilters = Boolean(search || brand);

  let articles: PublicArticleCard[] = [];
  try {
    articles = await fetchAllPublishedArticles({ search: sp.search, brand: sp.brand });
  } catch {
    articles = [];
  }

  const brandOptions = extractBrandOptions(articles);
  const sections = groupArticlesByProductType(articles);

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
            <p className="text-gray-600">No guides found{search ? ` for "${search}"` : ''}.</p>
          ) : hasFilters ? (
            <ArticlesGrid articles={articles} />
          ) : (
            <div className="space-y-10">
              {sections.map(({ hub, articles: sectionArticles }) => (
                <section key={hub.code}>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{hub.label} guides</h2>
                      <p className="text-sm text-gray-500">{sectionArticles.length} guides</p>
                    </div>
                    <Link href={`/articles/${hub.slug}`} className="text-sm text-blue-600 hover:underline">
                      View all {hub.label.toLowerCase()} guides
                    </Link>
                  </div>
                  <ArticlesGrid articles={sectionArticles.slice(0, 8)} />
                </section>
              ))}
            </div>
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
