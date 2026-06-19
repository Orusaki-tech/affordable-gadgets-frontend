import { brandConfig } from '@/lib/config/brand';
import { productUrl } from '@/lib/seo/urls';
import type { PublicProduct, PublicInventoryUnitPublic, Review } from '@/lib/api/generated';

interface ProductSchemaProps {
  product: PublicProduct;
  units?: PublicInventoryUnitPublic[];
  reviews?: Review[];
  selectedUnit?: PublicInventoryUnitPublic | null;
}

/** Derive variant price array from product.variants (for brand-new zero-unit products). */
function variantPrices(product: PublicProduct): number[] {
  const v: any[] = (product as any).variants ?? [];
  return v.map((x: any) => parseFloat(x.selling_price)).filter((p: number) => !isNaN(p) && p > 0);
}

export function ProductSchema({ product, units = [], reviews = [], selectedUnit }: ProductSchemaProps) {
  const canonicalUrl = product.slug ? productUrl(product.slug) : undefined;
  // Calculate aggregate rating from reviews
  const aggregateRating = reviews.length > 0
    ? {
        '@type': 'AggregateRating' as const,
        ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
        reviewCount: reviews.length.toString(),
        bestRating: '5',
        worstRating: '1',
      }
    : undefined;

  // Get price range from units (fallback to variants when no units exist)
  const prices = units.length > 0
    ? units.map((u) => Number(u.selling_price)).filter((price) => !isNaN(price) && price > 0)
    : variantPrices(product);

  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;
  const price = selectedUnit ? Number(selectedUnit.selling_price) : minPrice;

  // Availability: InStock if units or variants exist
  const hasAnyOffer = units.length > 0 || (product as any).variants?.length > 0;
  const availability = hasAnyOffer
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // Build offers array from units (fallback to variants when no units)
  const offers = units.length > 0
    ? units.map((unit) => ({
        '@type': 'Offer' as const,
        url: canonicalUrl || `${brandConfig.siteUrl}/products/${product.slug || product.id}`,
        priceCurrency: 'KES',
        price: Number(unit.selling_price).toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: unit.condition === 'N'
          ? 'https://schema.org/NewCondition'
          : unit.condition === 'R'
          ? 'https://schema.org/RefurbishedCondition'
          : 'https://schema.org/UsedCondition',
        seller: {
          '@type': 'Organization' as const,
          name: brandConfig.business.name,
        },
      }))
    : variantPrices(product).map((p: number) => ({
        '@type': 'Offer' as const,
        url: canonicalUrl || `${brandConfig.siteUrl}/products/${product.slug || product.id}`,
        priceCurrency: 'KES',
        price: p.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: {
          '@type': 'Organization' as const,
          name: brandConfig.business.name,
        },
      }));

  // Build review array for schema
  const reviewSchema = reviews.map((review) => ({
    '@type': 'Review' as const,
    author: {
      '@type': 'Person' as const,
      name: review.customer_username || (review.is_admin_review ? 'Admin' : 'Customer'),
    },
    datePublished: review.date_posted || new Date().toISOString(),
    reviewBody: review.comment || '',
    reviewRating: {
      '@type': 'Rating' as const,
      ratingValue: review.rating.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  }));

  // Build video schema if product has video
  const videoSchema = product.product_video_url
    ? {
        '@type': 'VideoObject' as const,
        name: product.meta_title || `${product.product_name} - Product Video`,
        description: product.meta_description || product.product_description || `Watch ${product.product_name} product video`,
        thumbnailUrl: product.primary_image || `${brandConfig.siteUrl}/affordlogo1.svg`,
        uploadDate: new Date().toISOString(),
        contentUrl: product.product_video_url,
        embedUrl: product.product_video_url.includes('youtube.com') || product.product_video_url.includes('youtu.be')
          ? product.product_video_url.replace(/watch\?v=/, 'embed/').replace('youtu.be/', 'youtube.com/embed/')
          : product.product_video_url,
      }
    : undefined;

  // Build product schema
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.product_name,
    description: product.meta_description || product.product_description || product.long_description || `${product.product_name} - Available at ${brandConfig.business.name}`,
    image: product.primary_image
      ? [product.primary_image]
      : [`${brandConfig.siteUrl}/affordlogo1.svg`],
    sku: product.slug || product.id?.toString(),
    mpn: product.model_series || undefined,
    gtin: undefined, // Add if you have GTIN/EAN codes
    url: canonicalUrl,
    brand: product.brand
      ? {
          '@type': 'Brand' as const,
          name: product.brand,
        }
      : undefined,
    category: product.product_type === 'PH' ? 'Mobile Phones' 
      : product.product_type === 'LT' ? 'Laptops'
      : product.product_type === 'TB' ? 'Tablets/Ipads'
      : product.product_type === 'AC' ? 'Accessories'
      : 'Electronics',
    productID: product.id?.toString(),
    ...(videoSchema && { video: videoSchema }),
    offers: offers.length > 0
      ? offers.length === 1
        ? offers[0]
        : {
            '@type': 'AggregateOffer' as const,
            priceCurrency: 'KES',
            lowPrice: minPrice?.toFixed(2),
            highPrice: maxPrice?.toFixed(2),
            offerCount: offers.length.toString(),
            offers: offers,
          }
      : {
          '@type': 'Offer' as const,
          priceCurrency: 'KES',
          price: price?.toFixed(2) || '0.00',
          availability,
          seller: {
            '@type': 'Organization' as const,
            name: brandConfig.business.name,
          },
        },
    ...(aggregateRating && { aggregateRating }),
    ...(reviewSchema.length > 0 && { review: reviewSchema }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}
