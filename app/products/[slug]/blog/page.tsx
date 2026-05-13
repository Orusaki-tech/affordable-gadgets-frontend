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
import { ProductBlogMarkdown } from '@/components/ProductBlogMarkdown';

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

const resolveProductImage = (product?: PublicProduct | null) => {
  if (!product?.primary_image) {
    return `${brandConfig.siteUrl}/affordable-social-share.png`;
  }
  if (product.primary_image.startsWith('http')) {
    return product.primary_image;
  }
  return `${brandConfig.apiBaseUrl}${product.primary_image}`;
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
  const imageUrl = resolveProductImage(product);

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
          image: imageUrl,
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
      <main className="flex-1 min-w-0 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-gray-900">
              Products
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/products/${slug}`} className="hover:text-gray-900">
              {productName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">Blog</span>
          </nav>

          <p className="text-sm text-gray-500 mb-2">
            {product.brand}
            {product.model_series ? ` · ${product.model_series}` : ''}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{headline}</h1>

          <ProductBlogMarkdown markdown={article.body || '_No content yet._'} />

          <div className="mt-10 pt-6 border-t border-gray-200">
            <Link href={`/products/${slug}`} className="text-blue-600 font-semibold hover:underline">
              ← Back to {productName}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
