import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArticlesFilterBar } from '@/components/ArticlesFilterBar';
import { ArticlesGrid } from '@/components/ArticlesGrid';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { extractBrandOptions } from '@/lib/blog/articleFilters';
import { ARTICLE_HUB_BY_SLUG } from '@/lib/blog/articleHubs';
import { fetchAllPublishedArticles } from '@/lib/blog/articlePage';
import type { PublicArticleCard } from '@/lib/api/generated';

export const revalidate = 3600;

interface ArticleHubPageProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: ArticleHubPageProps): Promise<Metadata> {
  const { type } = await params;
  const hub = ARTICLE_HUB_BY_SLUG[type];
  if (!hub) {
    return { title: 'Articles' };
  }

  return {
    title: hub.title,
    description: hub.description,
    alternates: {
      canonical: `/articles/${hub.slug}`,
    },
    openGraph: {
      title: hub.title,
      description: hub.description,
      url: `/articles/${hub.slug}`,
    },
  };
}

export default async function ArticleHubPage({ params, searchParams }: ArticleHubPageProps) {
  const { type } = await params;
  const hub = ARTICLE_HUB_BY_SLUG[type];
  if (!hub) {
    notFound();
  }

  const sp = await searchParams;
  const search = sp.search || '';
  const brand = sp.brand || '';

  let hubArticles: PublicArticleCard[] = [];
  try {
    hubArticles = await fetchAllPublishedArticles({
      search: sp.search,
      productType: hub.code,
    });
  } catch {
    hubArticles = [];
  }

  const brandOptions = extractBrandOptions(hubArticles);
  const articles = brand
    ? hubArticles.filter((article) => article.product_brand?.toLowerCase() === brand.toLowerCase())
    : hubArticles;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f8]">
      <Suspense fallback={<div className="site-header-wrapper"><HeaderWithAnnouncement /></div>}>
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-sm text-gray-500 mb-2">
            <Link href="/articles" className="hover:text-blue-600">
              All guides
            </Link>
            <span className="mx-2">/</span>
            <span>{hub.label}</span>
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{hub.title}</h1>
          <p className="text-gray-500 mb-6">{hub.description}</p>
          <Suspense fallback={<div className="h-24" />}>
            <ArticlesFilterBar brands={brandOptions} activeHub={hub} />
          </Suspense>

          {articles.length === 0 ? (
            <p className="text-gray-600">
              No {hub.label.toLowerCase()} guides found{search ? ` for "${search}"` : ''}.
            </p>
          ) : (
            <ArticlesGrid articles={articles} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
