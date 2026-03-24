import { Suspense } from 'react';
import { Metadata } from 'next';
import { ProductDetail } from '@/components/ProductDetail';
import { HeaderWithAnnouncement } from '@/components/HeaderWithAnnouncement';
import { Footer } from '@/components/Footer';
import { ApiService } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import type { PublicProduct } from '@/lib/api/generated';
import { StructuredData } from '@/components/StructuredData';

export const revalidate = 3600;

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
  // Use meta_description for SEO if available, otherwise fall back to other descriptions
  return (
    product?.meta_description ||
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

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const fetchMinMaxPriceFromUnits = async (productId: number) => {
  // Units endpoint supports ordering, so we can cheaply fetch extremes.
  // This avoids emitting invalid Product schema when min/max prices are missing.
  const [minRes, maxRes] = await Promise.all([
    ApiService.apiV1PublicProductsUnitsList(productId, 'selling_price', 1),
    ApiService.apiV1PublicProductsUnitsList(productId, '-selling_price', 1),
  ]);

  const minUnit = minRes.results?.[0];
  const maxUnit = maxRes.results?.[0];

  const minPrice = minUnit?.selling_price ? Number(minUnit.selling_price) : null;
  const maxPrice = maxUnit?.selling_price ? Number(maxUnit.selling_price) : null;

  return {
    lowPrice: isFiniteNumber(minPrice) && minPrice > 0 ? minPrice : null,
    highPrice: isFiniteNumber(maxPrice) && maxPrice > 0 ? maxPrice : null,
  };
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  let product: PublicProduct | null = null;

  try {
    product = await fetchProductBySlug(slug);
  } catch {
    product = null;
  }

  // Use meta_title for SEO if available, otherwise use product_name
  const title = product?.meta_title || (product?.product_name ? `${product.product_name}` : "Product Details");
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
  let product: PublicProduct | null = null;

  try {
    product = await fetchProductBySlug(slug);
  } catch {
    product = null;
  }

  const productUrl = `${brandConfig.siteUrl}/products/${slug}`;
  const productName = product?.product_name ?? 'Product';
  const description = buildProductDescription(product);
  const imageUrl = resolveProductImage(product);
  let lowPrice = isFiniteNumber(product?.min_price) ? product!.min_price : null;
  let highPrice = isFiniteNumber(product?.max_price) ? product!.max_price : null;

  // If product min/max price isn't present, derive it from available units (for valid schema.org offers).
  if (product?.id && (!isFiniteNumber(lowPrice) || !isFiniteNumber(highPrice))) {
    try {
      const derived = await fetchMinMaxPriceFromUnits(product.id);
      lowPrice = isFiniteNumber(lowPrice) ? lowPrice : derived.lowPrice;
      highPrice = isFiniteNumber(highPrice) ? highPrice : derived.highPrice;
    } catch {
      // If units lookup fails, we'll avoid emitting invalid Product structured data below.
    }
  }

  const hasAnyPrice = isFiniteNumber(lowPrice) || isFiniteNumber(highPrice);
  const availability =
    Number(product?.available_units_count ?? 0) > 0 ? 'InStock' : 'OutOfStock';
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ffffff' }}>
      <StructuredData
        type="BreadcrumbList"
        breadcrumbs={[
          { name: 'Home', url: brandConfig.siteUrl },
          { name: 'Products', url: `${brandConfig.siteUrl}/products` },
          { name: productName, url: productUrl },
        ]}
      />
      {product && hasAnyPrice && (
        <StructuredData
          type="Product"
          product={{
            name: productName,
            description,
            url: productUrl,
            image: imageUrl,
            brand: product.brand ?? null,
            sku: slug,
            priceCurrency: 'KES',
            lowPrice,
            highPrice,
            availability,
          }}
        />
      )}
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

