import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { brandConfig } from '@/lib/config/brand';
import { StructuredData } from '@/components/StructuredData';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ProductBlogBody } from '@/components/ProductBlogMarkdown';
import { BlogFeaturedImage } from '@/components/BlogFeaturedImage';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import {
  fetchArticleBySlugs,
  fetchProductBySlug,
  resolveImageUrl,
  resolveProductImage,
} from '@/lib/blog/articlePage';
import { articlePath, productPath, productUrl as buildProductUrl, resolveCanonicalProductSlug } from '@/lib/seo/urls';
import { permanentRedirectToCanonicalProductSlug } from '@/lib/seo/productSlugRedirect';

export const revalidate = 3600;

interface ProductBlogArticlePageProps {
  params: Promise<{ slug: string; articleSlug: string }>;
}

export async function generateMetadata({ params }: ProductBlogArticlePageProps): Promise<Metadata> {
  const { slug, articleSlug } = await params;
  const [article, product] = await Promise.all([
    fetchArticleBySlugs(slug, articleSlug),
    fetchProductBySlug(slug),
  ]);

  if (!article) {
    return {
      title: 'Article',
      robots: { index: false, follow: false },
    };
  }

  const title = article.seo_title?.trim() || article.headline?.trim() || product?.product_name || 'Buying guide';
  const description =
    article.seo_description?.trim() ||
    product?.meta_description?.trim() ||
    product?.product_description?.trim() ||
    `Read our buying guide for ${product?.product_name ?? 'this product'}.`;
  const imageUrl = resolveProductImage(product);
  const canonicalSlug = resolveCanonicalProductSlug(slug, product?.slug);
  const canonical = articlePath(canonicalSlug, articleSlug);

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

export default async function ProductBlogArticlePage({ params }: ProductBlogArticlePageProps) {
  const { slug, articleSlug } = await params;
  const [article, product] = await Promise.all([
    fetchArticleBySlugs(slug, articleSlug),
    fetchProductBySlug(slug),
  ]);

  if (!article || !product) {
    notFound();
  }

  permanentRedirectToCanonicalProductSlug(slug, product.slug, `/blog/${articleSlug}`);

  const canonicalSlug = resolveCanonicalProductSlug(slug, product.slug);
  const site = brandConfig.siteUrl.replace(/\/+$/, '');
  const canonicalProductUrl = buildProductUrl(canonicalSlug);
  const articleUrl = `${site}${articlePath(canonicalSlug, articleSlug)}`;
  const productName = product.product_name ?? 'Product';
  const headline = article.headline?.trim() || article.seo_title?.trim() || `${productName} buying guide`;
  const featuredImage = resolveImageUrl(article.thumbnail_image as string | undefined) || resolveProductImage(product);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: site },
          { name: 'Products', url: `${site}/products` },
          { name: productName, url: canonicalProductUrl },
          { name: headline, url: articleUrl },
        ]}
      />
      <StructuredData
        type="BlogPosting"
        blogPosting={{
          headline,
          description: article.seo_description ?? product.meta_description ?? product.product_description ?? null,
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
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/products" className="hover:text-blue-600 transition-colors">
              Products
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={productPath(canonicalSlug)} className="hover:text-blue-600 transition-colors">
              {productName}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Guide</span>
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

            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6">
              {article.seo_description ||
                product.meta_description ||
                `Everything you need to know about the ${productName} series.`}
            </p>

            {featuredImage && <BlogFeaturedImage src={featuredImage} alt={headline} />}
          </header>

          <article className="product-blog-article">
            <ProductBlogBody markdown={article.body || '*No content yet.*'} />
          </article>

          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to upgrade?</h3>
                <p className="text-gray-600">Check out our latest deals on the {productName}.</p>
              </div>
              <Link
                href={productPath(canonicalSlug)}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-center whitespace-nowrap"
              >
                View {productName}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
