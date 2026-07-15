import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { permanentRedirect, redirect } from 'next/navigation';
import { brandConfig } from '@/lib/config/brand';
import { StructuredData } from '@/components/StructuredData';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ProductBlogBody } from '@/components/ProductBlogMarkdown';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import {
  fetchArticleBySlug,
  resolveImageUrl,
  resolveProductImage,
} from '@/lib/blog/articlePage';
import { articlePath, blogPath, blogUrl } from '@/lib/seo/urls';

export const revalidate = 3600;

interface StandaloneBlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StandaloneBlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Buying Guides & Articles',
      alternates: { canonical: '/articles' },
    };
  }

  // Product-linked articles keep their canonical under /products/.../blog/...
  if (article.product_slug) {
    const canonical = articlePath(article.product_slug, article.slug?.trim() || slug);
    return {
      title: article.seo_title?.trim() || article.headline?.trim() || 'Blog',
      description: article.seo_description?.trim() || undefined,
      alternates: { canonical },
    };
  }

  const title = article.seo_title?.trim() || article.headline?.trim() || 'Blog';
  const description = article.seo_description?.trim() || `Read ${title} on Affordable Gadgets.`;
  const imageUrl =
    resolveImageUrl(article.thumbnail_image as string | undefined) ||
    `${brandConfig.siteUrl}/affordable-social-share.png`;
  const canonical = blogPath(article.slug?.trim() || slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function StandaloneBlogPage({ params }: StandaloneBlogPageProps) {
  const { slug } = await params;
  const article = await fetchArticleBySlug(slug);

  if (!article) {
    redirect('/articles');
  }

  const canonicalArticleSlug = article.slug?.trim() || slug;

  // If this article belongs to a product, send users to the product-scoped URL.
  if (article.product_slug) {
    permanentRedirect(articlePath(article.product_slug, canonicalArticleSlug));
  }

  if (article.slug && article.slug !== slug) {
    permanentRedirect(blogPath(article.slug));
  }

  const site = brandConfig.siteUrl.replace(/\/+$/, '');
  const articleUrl = blogUrl(canonicalArticleSlug);
  const headline = article.headline?.trim() || article.seo_title?.trim() || 'Blog';
  const featuredImage =
    resolveImageUrl(article.thumbnail_image as string | undefined) ||
    resolveProductImage(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: site },
          { name: 'Blog', url: `${site}/articles` },
          { name: headline, url: articleUrl },
        ]}
      />
      <StructuredData
        type="BlogPosting"
        blogPosting={{
          headline,
          description: article.seo_description ?? null,
          url: articleUrl,
          image: featuredImage,
          datePublished: article.published_at ?? null,
          dateModified: article.updated_at ?? null,
        }}
      />
      <Suspense
        fallback={
          <div className="site-header-wrapper">
            <HeaderWithAnnouncement />
          </div>
        }
      >
        <HeaderWithAnnouncement />
      </Suspense>
      <main className="flex-1 min-w-0 py-6 lg:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/articles" className="hover:text-blue-600 transition-colors">
              Blog
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Article</span>
          </nav>

          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-blue-600 mb-4">
              <span className="bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                {formatArticleCategory(article.category)}
              </span>
              {article.published_at && (
                <time className="text-gray-500 font-normal" dateTime={article.published_at}>
                  {new Date(article.published_at).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight leading-[1.15]">
              {headline}
            </h1>

            {article.seo_description ? (
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
                {article.seo_description}
              </p>
            ) : null}
          </header>

          <article className="product-blog-article">
            <ProductBlogBody
              markdown={article.body || '*No content yet.*'}
              imageUrl={featuredImage}
              imageAlt={headline}
              headline={headline}
            />
          </article>

          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Browse the shop</h3>
                <p className="text-gray-600">Explore phones, tablets, and accessories in stock.</p>
              </div>
              <Link
                href="/products"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-center whitespace-nowrap"
              >
                View products
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
