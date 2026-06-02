import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiService } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import type { PublicProduct, PublicProductArticle } from '@/lib/api/generated';
import { StructuredData } from '@/components/StructuredData';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ProductBlogBody } from '@/components/ProductBlogMarkdown';

export const revalidate = 3600;

interface ProductBlogPageProps {
  params: Promise<{ slug: string }>;
}

const fetchProductBySlug = async (slug: string): Promise<PublicProduct | null> => {
  if (!slug) return null;
  try {
    const response = await ApiService.apiV1PublicProductsList(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      1,
      undefined,
      undefined,
      slug,
      undefined
    );
    return response.results?.[0] ?? null;
  } catch {
    return null;
  }
};

const fetchArticle = async (slug: string): Promise<PublicProductArticle | null> => {
  try {
    return await ApiService.apiV1PublicProductsBySlugArticleRetrieve(slug);
  } catch (e: unknown) {
    const status =
      typeof e === 'object' && e !== null && 'status' in e
        ? (e as { status?: number }).status
        : undefined;
    if (status === 404) return null;
    throw e;
  }
};

const resolveImageUrl = (path?: string | null, fallback?: string) => {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  return `${brandConfig.apiBaseUrl}${path}`;
};

const resolveProductImage = (product?: PublicProduct | null) => {
  return resolveImageUrl(product?.primary_image, `${brandConfig.siteUrl}/affordable-social-share.png`) as string;
};

export async function generateMetadata({ params }: ProductBlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, product] = await Promise.all([fetchArticle(slug), fetchProductBySlug(slug)]);

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
  const canonical = `/products/${slug}/blog`;

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

export default async function ProductBlogPage({ params }: ProductBlogPageProps) {
  const { slug } = await params;
  const [article, product] = await Promise.all([fetchArticle(slug), fetchProductBySlug(slug)]);

  if (!article || !product) {
    notFound();
  }

  const site = brandConfig.siteUrl.replace(/\/+$/, '');
  const productUrl = `${site}/products/${slug}`;
  const articleUrl = `${site}/products/${slug}/blog`;
  const productName = product.product_name ?? 'Product';
  const headline = article.headline?.trim() || article.seo_title?.trim() || `${productName} buying guide`;
  const featuredImage = resolveImageUrl(article.thumbnail_image as string | undefined) || resolveProductImage(product);
  const ogImageUrl = resolveProductImage(product);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: site },
          { name: 'Products', url: `${site}/products` },
          { name: productName, url: productUrl },
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
      <main className="flex-1 min-w-0 py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/products" className="hover:text-blue-600 transition-colors">
              Products
            </Link>
            <span className="text-gray-300">/</span>
            <Link href={`/products/${slug}`} className="hover:text-blue-600 transition-colors">
              {productName}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">Guide</span>
          </nav>

          <header className="mb-10">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-blue-600 mb-4">
              <span className="bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
                {article.category?.replace('_', ' ') || 'Buying Guide'}
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
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-[1.1]">
              {headline}
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              {article.seo_description || product.meta_description || `Everything you need to know about the ${productName} series.`}
            </p>

            {featuredImage && (
              <div className="relative aspect-video w-full mb-10 overflow-hidden rounded-2xl shadow-xl border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={featuredImage} 
                  alt={headline}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
          </header>

          <article className="prose prose-blue max-w-none">
            <ProductBlogBody markdown={article.body || '*No content yet.*'} />
          </article>

          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="bg-gray-50 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to upgrade?</h3>
                <p className="text-gray-600">Check out our latest deals on the {productName}.</p>
              </div>
              <Link 
                href={`/products/${slug}`} 
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
