import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesFilterBar } from '@/components/ArticlesFilterBar';
import { ArticlesGrid } from '@/components/ArticlesGrid';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import {
  buildArticlesPath,
  resolveHubFromParam,
} from '@/lib/blog/articleFilters';
import {
  fetchArticleBrandOptions,
  fetchPublishedArticlesPage,
} from '@/lib/blog/articlePage';

export const revalidate = 3600;

const BASE_TITLE = 'Buying Guides & Articles';
const BASE_DESCRIPTION =
  'Expert phone, laptop, tablet and accessory buying guides for renewed tech in Kenya.';
const ARTICLES_PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function parsePage(value?: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const hub = resolveHubFromParam(sp.type);
  const hasSearch = Boolean(sp.search?.trim());
  const hasBrand = Boolean(sp.brand?.trim());

  // Type-only hubs are indexable marketing landings (listed in sitemap / llms.txt).
  if (hub && !hasSearch && !hasBrand) {
    const canonical = buildArticlesPath({ productType: hub.code });
    return {
      title: `${hub.title} | Affordable Gadgets`,
      description: hub.description,
      alternates: { canonical },
      openGraph: {
        title: hub.title,
        description: hub.description,
        url: canonical,
      },
    };
  }

  // Search/brand filtered article lists stay noindex near-duplicates of the hub.
  if (hub || hasSearch || hasBrand) {
    const canonical = hub
      ? buildArticlesPath({ productType: hub.code })
      : '/articles';
    return {
      title: BASE_TITLE,
      description: BASE_DESCRIPTION,
      alternates: { canonical },
      robots: { index: false, follow: true },
      openGraph: {
        title: BASE_TITLE,
        description: BASE_DESCRIPTION,
        url: canonical,
      },
    };
  }

  return {
    title: BASE_TITLE,
    description: BASE_DESCRIPTION,
    alternates: { canonical: '/articles' },
    openGraph: {
      title: BASE_TITLE,
      description: BASE_DESCRIPTION,
      url: '/articles',
    },
  };
}

export default async function ArticlesIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search || '';
  const brand = sp.brand || '';
  const activeHub = resolveHubFromParam(sp.type);
  const page = parsePage(sp.page);
  const filters = {
    search: sp.search,
    brand: sp.brand,
    productType: activeHub?.code,
  };

  let articles: Awaited<ReturnType<typeof fetchPublishedArticlesPage>>['results'] = [];
  let brandOptions: string[] = [];
  let totalCount = 0;
  let totalPages = 1;
  let currentPage = page;

  try {
    const [fetchedPage, fetchedBrands] = await Promise.all([
      fetchPublishedArticlesPage(filters, page, ARTICLES_PAGE_SIZE),
      fetchArticleBrandOptions(activeHub?.code),
    ]);
    articles = fetchedPage.results;
    totalCount = fetchedPage.count;
    totalPages = fetchedPage.totalPages;
    currentPage = fetchedPage.page;
    brandOptions = fetchedBrands;
  } catch {
    articles = [];
    brandOptions = [];
    totalCount = 0;
    totalPages = 1;
    currentPage = 1;
  }

  const resultLabel = activeHub
    ? `${activeHub.label.toLowerCase()} guides`
    : 'guides';
  const brandLabel = brand ? ` from ${brand}` : '';
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * ARTICLES_PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * ARTICLES_PAGE_SIZE, totalCount);
  const prevHref =
    currentPage > 1
      ? buildArticlesPath({ ...filters, page: currentPage - 1 })
      : null;
  const nextHref =
    currentPage < totalPages
      ? buildArticlesPath({ ...filters, page: currentPage + 1 })
      : null;

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
                Showing {showingFrom}–{showingTo} of {totalCount} {resultLabel}
                {brandLabel}
                {search ? ` matching "${search}"` : ''}
              </p>
              <ArticlesGrid articles={articles} />
              {totalPages > 1 ? (
                <nav
                  className="mt-8 flex flex-wrap items-center justify-between gap-3"
                  aria-label="Articles pagination"
                >
                  {prevHref ? (
                    <Link
                      href={prevHref}
                      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-400"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span />
                  )}
                  <p className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  {nextHref ? (
                    <Link
                      href={nextHref}
                      className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:border-gray-400"
                    >
                      Next
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              ) : null}
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
