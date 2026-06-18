import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ApiService } from '@/lib/api/generated';
import { BlogCard } from '@/components/BlogCard';
import { ArticlesFilterBar } from '@/components/ArticlesFilterBar';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { getArticleHref } from '@/lib/utils/blogRoutes';


export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Buying Guides & Articles',
  description: 'Expert guides, history, and tips on renewed tech in Kenya.',
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

async function fetchArticles(page: number, pageSize: number, search?: string, productSlug?: string) {
  try {
    const response = await ApiService.apiV1PublicArticlesList(
      undefined,
      undefined,
      '-release_date',
      page,
      pageSize,
      undefined,
      productSlug,
      search,
    );
    return response.results ?? [];
  } catch {
    return [];
  }
}

async function fetchAllArticlesForProductList() {
  try {
    const response = await ApiService.apiV1PublicArticlesList(
      undefined,
      undefined,
      '-release_date',
      1,
      200,
    );
    return response.results ?? [];
  } catch {
    return [];
  }
}

export default async function ArticlesIndexPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const search = sp.search || '';
  const productSlug = sp.product_slug || '';

  const [articles, allArticles] = await Promise.all([
    fetchArticles(1, 48, search, productSlug),
    search || productSlug ? fetchAllArticlesForProductList() : Promise.resolve([] as any[]),
  ]);

  const productOptions = (search || productSlug ? allArticles : articles)
    .filter((a: any) => a.product_slug && a.product_name)
    .reduce((acc: any[], a: any) => {
      if (!acc.find((p) => p.slug === a.product_slug)) {
        acc.push({ slug: a.product_slug, name: a.product_name });
      }
      return acc;
    }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      <Suspense fallback={<div className="site-header-wrapper"><HeaderWithAnnouncement /></div>}>
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Buying guides & articles</h1>
          <p className="text-gray-500 mb-6">
            Expert guides, history, and tips on renewed tech in Kenya.
          </p>
          <Suspense fallback={<div className="h-12" />}>
            <ArticlesFilterBar products={productOptions} />
          </Suspense>
          {articles.length === 0 ? (
            <p className="text-gray-600">No articles found{search ? ` for "${search}"` : ''}.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article: any) => {
                const href = getArticleHref(article.product_slug, article.slug);
                if (!href || !article.headline) return null;
                return (
                  <BlogCard
                    key={`${article.product_slug}-${article.slug}`}
                    imageUrl={article.thumbnail_image || ''}
                    category={article.category || 'buying_guide'}
                    title={article.headline}
                    href={href}
                  />
                );
              })}
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
