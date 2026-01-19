import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductDetail } from '@/components/ProductDetail';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ApiService } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import type { PublicProduct } from '@/lib/api/generated';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const resolveProductImage = (product?: PublicProduct | null) => {
  if (!product?.primary_image) {
    return "/affordablegadgetslogo.png";
  }
  if (product.primary_image.startsWith("http")) {
    return product.primary_image;
  }
  return `${brandConfig.apiBaseUrl}${product.primary_image}`;
};

const buildProductDescription = (product?: PublicProduct | null) => {
  return (
    product?.product_description ||
    product?.long_description ||
    `Explore ${product?.product_name ?? "this product"} at ${brandConfig.name}.`
  );
};

const fetchProductBySlug = async (slug: string) => {
  if (!slug) {
    return null;
  }
  const response = await ApiService.apiV1PublicProductsList(
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
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  let product: PublicProduct | null = null;

  try {
    product = await fetchProductBySlug(slug);
  } catch {
    product = null;
  }

  const title = product?.product_name ? `${product.product_name}` : "Product Details";
  const description = buildProductDescription(product);
  const imageUrl = resolveProductImage(product);
  const canonical = `/products/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <Suspense fallback={
          <div className="container mx-auto px-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-96 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <ProductDetail slug={slug} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

