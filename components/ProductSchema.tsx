import { brandConfig } from '@/lib/config/brand';
import type { PublicProduct, PublicInventoryUnitPublic, Review } from '@/lib/api/generated';

interface ProductSchemaProps {
  product: PublicProduct;
  units?: PublicInventoryUnitPublic[];
  reviews?: Review[];
  selectedUnit?: PublicInventoryUnitPublic | null;
}

export function ProductSchema({ product, units = [], reviews = [], selectedUnit }: ProductSchemaProps) {
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

  // Get price range from units
  const prices = units
    .map((u) => Number(u.selling_price))
    .filter((price) => !isNaN(price) && price > 0);

  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : undefined;
  const price = selectedUnit ? Number(selectedUnit.selling_price) : minPrice;

  // Get availability - units array already contains only available units
  const availability = units.length > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  // Build offers array - units are already filtered to available ones
  const offers = units.map((unit) => ({
      '@type': 'Offer' as const,
      url: `${brandConfig.siteUrl}/products/${product.slug || product.id}`,
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
        thumbnailUrl: product.primary_image || `${brandConfig.siteUrl}/affordablelogo.png`,
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
      : [`${brandConfig.siteUrl}/affordablelogo.png`],
    sku: product.id?.toString(),
    mpn: product.model_series || undefined,
    gtin: undefined, // Add if you have GTIN/EAN codes
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
