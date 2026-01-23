'use client';

import Image from 'next/image';
import Link from 'next/link';
import { PublicProduct } from '@/lib/api/generated';
import { formatPrice, formatPriceRange } from '@/lib/utils/format';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import { getProductHref } from '@/lib/utils/productRoutes';

interface ProductCardProps {
  product: PublicProduct;
  showInterestCount?: boolean;
}

export function ProductCard({ product, showInterestCount = true }: ProductCardProps) {
  const availableCount = Number(product.available_units_count ?? 0);
  const interestCount = Number(product.interest_count ?? 0);
  const hasStock = availableCount > 0;
  const hasBundle = Boolean((product as PublicProduct & { has_active_bundle?: boolean }).has_active_bundle);
  const bundlePricePreview = (product as PublicProduct & { bundle_price_preview?: number | null }).bundle_price_preview;
  const interestText = interestCount > 0 
    ? `${interestCount} ${interestCount === 1 ? 'person' : 'people'} interested`
    : null;

  return (
    <Link
      href={getProductHref(product)}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300 animate-fade-in h-full flex flex-col"
    >
      {/* Product Image */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
        <Image
          src={product.primary_image || getPlaceholderProductImage(product.product_name)}
          alt={product.product_name}
          fill
          className="object-contain transition-transform duration-300"
          unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
        />
        
        {hasBundle && (
          <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            {bundlePricePreview ? `Bundle from ${formatPrice(bundlePricePreview)}` : 'Bundle available'}
          </div>
        )}

        {/* Stock Badge */}
        {!hasStock && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Product Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-[15px] leading-[22px] sm:text-[16px] sm:leading-[24px] mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors text-gray-900">
          {product.product_name}
        </h3>
        
        <p className="text-[13px] leading-[18px] sm:text-[14px] sm:leading-[20px] text-gray-500 mb-3 font-medium">
          {product.brand} {product.model_series && `• ${product.model_series}`}
        </p>

        {/* Tags */}
        {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map((tag: string, idx: number) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="mb-3 mt-auto">
        {product.min_price !== null && product.min_price !== undefined &&
        product.max_price !== null && product.max_price !== undefined ? (
            <p className="text-[16px] leading-[22px] sm:text-[18px] sm:leading-[24px] font-bold text-gray-900">
            {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
            </p>
          ) : (
            <p className="text-[15px] leading-[22px] sm:text-[16px] sm:leading-[24px] font-semibold text-gray-700">
              Price on request
            </p>
          )}
        </div>

        {/* Stock & Interest Info */}
        <div className="flex items-center justify-between text-[12px] leading-[18px] sm:text-[13px] sm:leading-[20px] pt-3 border-t border-gray-100">
          <span className={`font-semibold ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
            {hasStock ? (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {product.available_units_count} {product.available_units_count === 1 ? 'unit' : 'units'}
              </span>
            ) : (
              'Out of stock'
            )}
          </span>
          {showInterestCount && interestText && (
            <span className="text-orange-600 font-semibold flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {interestText}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

