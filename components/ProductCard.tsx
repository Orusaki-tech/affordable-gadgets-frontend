'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PublicProduct, InventoryUnitImage } from '@/lib/api/generated';
import { formatPrice, formatPriceRange } from '@/lib/utils/format';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import { getProductHref } from '@/lib/utils/productRoutes';
import { useProductUnits } from '@/lib/hooks/useProducts';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';

interface ProductCardProps {
  product: PublicProduct;
  variant?: 'default' | 'minimal' | 'featured';
  showInterestCount?: boolean;
  showQuickActions?: boolean;
  showQuickView?: boolean;
  showRatings?: boolean;
  showSwatches?: boolean;
  showShippingBadges?: boolean;
}

function RatingStars({ rating, count }: { rating: number | null; count: number }) {
  if (!rating || count === 0) {
    return <span className="text-xs text-gray-500">No reviews yet</span>;
  }

  const rounded = Math.round(rating * 10) / 10;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-1 text-xs text-gray-600">
      <div className="flex items-center gap-0.5 text-yellow-500">
        {stars.map((star) => (
          <svg
            key={star}
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill={rounded >= star ? 'currentColor' : 'none'}
            stroke="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="font-semibold text-gray-700">{rounded}</span>
      <span className="text-gray-500">({count})</span>
    </div>
  );
}

export function ProductCard({
  product,
  variant = 'default',
  showInterestCount = true,
  showQuickActions = true,
  showQuickView = true,
  showRatings = true,
  showSwatches = true,
  showShippingBadges = true,
}: ProductCardProps) {
  const isMinimal = variant === 'minimal';
  const isFeaturedVariant = variant === 'featured';
  const allowQuickActions = showQuickActions && !isMinimal && !isFeaturedVariant;
  const allowQuickView = showQuickView && !isMinimal && !isFeaturedVariant;
  const allowSwatches = showSwatches && !isMinimal && !isFeaturedVariant;
  const allowShippingBadges = showShippingBadges && !isMinimal && !isFeaturedVariant;
  const allowInterestCount = showInterestCount && !isMinimal && !isFeaturedVariant;
  const availableCount = Number(product.available_units_count ?? 0);
  const interestCount = Number(product.interest_count ?? 0);
  const hasStock = availableCount > 0;
  const hasBundle = Boolean((product as PublicProduct & { has_active_bundle?: boolean }).has_active_bundle);
  const bundlePricePreview = (product as PublicProduct & { bundle_price_preview?: number | null }).bundle_price_preview;
  const interestText =
    interestCount > 0
    ? `${interestCount} ${interestCount === 1 ? 'person' : 'people'} interested`
    : null;

  const rawTags = Array.isArray(product.tags) ? product.tags : [];
  const normalizedTags = rawTags.map((tag) => tag.toLowerCase());
  const isNew = normalizedTags.some((tag) => tag.includes('new') || tag.includes('latest'));
  const isFeatured = normalizedTags.some((tag) => tag.includes('featured') || tag.includes('popular') || tag.includes('trending'));
  const tagSale = normalizedTags.some((tag) => tag.includes('sale') || tag.includes('discount') || tag.includes('promo') || tag.includes('deal'));
  const shippingTags = allowShippingBadges
    ? rawTags.filter((tag) => /ship|delivery|shipping/i.test(tag)).slice(0, 1)
    : [];
  const lowStock = hasStock && availableCount > 0 && availableCount <= 3;

  const shouldLoadUnits = allowSwatches || allowQuickActions || allowQuickView || isFeaturedVariant;
  const { data: units = [], isLoading: unitsLoading } = useProductUnits(product.id ?? 0, {
    enabled: shouldLoadUnits,
  });

  const reviewCount = Number(product.review_count ?? 0);
  const averageRating = product.average_rating ?? null;

  const colorOptions = useMemo(() => {
    const colors: { name: string }[] = [];
    const seen = new Set<string>();
    units.forEach((unit) => {
      const name = unit.color_name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        colors.push({ name });
      }
    });
    return colors;
  }, [units]);

  const secondaryImage = useMemo(() => {
    const primaryImage = product.primary_image;
    const unitImages = units.flatMap((unit) => (unit.images ?? []) as InventoryUnitImage[]);
    const candidate = unitImages.find(
      (img) => img?.image_url && img.image_url !== primaryImage
    );
    return candidate?.image_url || null;
  }, [product.primary_image, units]);

  const { addToCart } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!selectedUnitId && units.length > 0) {
      setSelectedUnitId(units[0]?.id ?? null);
    }
  }, [selectedUnitId, units]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);

  const handleQuickAddToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsQuickAddOpen((prev) => !prev);
  };

  const handleWishlistToggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(product.id);
  };

  const handleQuickViewOpen = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const handleAddToCart = async (event: React.MouseEvent, qty?: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedUnit?.id) return;
    try {
      setIsAddingToCart(true);
      await addToCart(selectedUnit.id, qty ?? 1);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const hasPriceRange =
    product.min_price !== null &&
    product.min_price !== undefined &&
    product.max_price !== null &&
    product.max_price !== undefined;
  const compareAtMin = product.compare_at_min_price ?? null;
  const compareAtMax = product.compare_at_max_price ?? null;
  const compareAtDisplay = compareAtMin ?? compareAtMax;
  const discountPercent = typeof product.discount_percent === 'number' ? product.discount_percent : null;
  const hasDiscount =
    (typeof discountPercent === 'number' && discountPercent > 0) ||
    (compareAtMin !== null &&
      typeof product.min_price === 'number' &&
      compareAtMin > product.min_price);
  const isOnSale = tagSale || hasDiscount;
  const showComparePrice =
    hasDiscount &&
    hasPriceRange &&
    typeof product.min_price === 'number' &&
    compareAtDisplay !== null;

  const placeholderImage = getPlaceholderProductImage(product.product_name);
  const primaryImage = product.primary_image || placeholderImage;
  const productTypeLabels: Record<string, string> = {
    PH: 'Phone',
    LT: 'Laptop',
    TB: 'Tablet',
    AC: 'Accessory',
  };
  const productTypeLabel = product.product_type ? productTypeLabels[product.product_type] : null;
  const specLine = [productTypeLabel, product.model_series].filter(Boolean).join(' • ');
  const brandLine = product.brand || null;
  const savings =
    showComparePrice &&
    typeof product.min_price === 'number' &&
    compareAtDisplay !== null &&
    compareAtDisplay > product.min_price
      ? compareAtDisplay - product.min_price
      : null;

  if (isFeaturedVariant) {
    const canAddToCart = Boolean(selectedUnit?.id) && !isAddingToCart && !unitsLoading;
    return (
      <Link
        href={getProductHref(product)}
        className="group block bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 hover:border-gray-300 animate-fade-in h-full flex flex-col items-center text-center p-4 sm:p-5"
      >
        <h3 className="font-semibold text-[19px] leading-[25.5px] text-gray-900 mb-4 line-clamp-2">
          {product.product_name}
        </h3>
        <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
          <Image
            src={primaryImage}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
          />
          <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              onClick={(event) => {
                if (!selectedUnit?.id) return;
                handleAddToCart(event, 1);
              }}
              disabled={!canAddToCart}
              className="rounded-full border border-black bg-black text-white text-[11px] leading-[15px] font-semibold px-5 py-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Buy"
            >
              {isAddingToCart ? 'Adding...' : 'Buy'}
            </button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <>
    <Link
      href={getProductHref(product)}
      className={`group block bg-white overflow-hidden border border-gray-200 animate-fade-in h-full flex flex-col transition-all duration-300 ${
        isMinimal
          ? 'rounded-xl shadow-none hover:shadow-sm hover:border-gray-300'
          : 'rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300'
      }`}
    >
      {/* Product Image */}
      <div className={`relative w-full bg-gray-50 flex items-center justify-center overflow-hidden ${isMinimal ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <Image
            src={primaryImage}
          alt={product.product_name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-contain transition-all duration-300 ${secondaryImage ? 'group-hover:opacity-0' : ''}`}
          unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
        />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.product_name} alternate`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-contain opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              unoptimized={secondaryImage.includes('localhost') || secondaryImage.includes('127.0.0.1') || secondaryImage.includes('placehold.co')}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
        {!isMinimal && hasBundle && (
              <div className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            {bundlePricePreview ? `Bundle from ${formatPrice(bundlePricePreview)}` : 'Bundle available'}
          </div>
        )}
            {isOnSale && (
              <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                {discountPercent ? `Save ${discountPercent}%` : 'Sale'}
              </div>
            )}
            {!isMinimal && isNew && (
              <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                New
              </div>
            )}
            {!isMinimal && isFeatured && (
              <div className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Trending
              </div>
            )}
            {!isMinimal && lowStock && (
              <div className="bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Low stock
              </div>
            )}
          </div>

        {/* Stock Badge */}
        {!hasStock && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
            Out of Stock
          </div>
        )}

          {/* Quick Actions */}
          {allowQuickActions && (
            <div className="absolute right-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`h-9 w-9 rounded-full border shadow-sm flex items-center justify-center bg-white ${
                  isInWishlist(product.id) ? 'text-red-500 border-red-200' : 'text-gray-500 border-gray-200'
                }`}
                aria-label="Toggle wishlist"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>
              {allowQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewOpen}
                  className="h-9 w-9 rounded-full border border-gray-200 shadow-sm flex items-center justify-center bg-white text-gray-500"
                  aria-label="Quick view"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3c-4.5 0-8.268 2.943-9.5 7 1.232 4.057 5 7 9.5 7s8.268-2.943 9.5-7C18.268 5.943 14.5 3 10 3zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={handleQuickAddToggle}
                className="h-9 w-9 rounded-full border border-gray-200 shadow-sm flex items-center justify-center bg-white text-gray-500"
                aria-label="Quick add"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
              </button>
            </div>
          )}
        
        {/* Hover Overlay */}
        {!isMinimal && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        )}
      </div>

      {/* Product Info */}
      <div className={`flex flex-col flex-1 ${isMinimal ? 'p-4' : 'p-4 sm:p-5'}`}>
        <h3 className={`font-semibold line-clamp-2 transition-colors text-gray-900 ${
          isMinimal
            ? 'text-[15px] leading-[22px]'
            : 'text-[15px] leading-[22px] sm:text-[16px] sm:leading-[24px] group-hover:text-blue-600'
        }`}>
          {product.product_name}
        </h3>
        
        {(brandLine || specLine) && (
          <p className={`text-gray-500 font-medium ${isMinimal ? 'text-[12px] leading-[18px] mt-1' : 'text-[13px] leading-[18px] sm:text-[14px] sm:leading-[20px] mb-3'}`}>
            {brandLine}
            {brandLine && specLine ? ' • ' : ''}
            {specLine}
          </p>
        )}

          {showRatings && (
            <div className={isMinimal ? 'mt-2' : 'mb-3'}>
              <RatingStars rating={averageRating} count={reviewCount} />
            </div>
          )}

          {shippingTags.length > 0 && !isMinimal && (
            <div className="flex flex-wrap gap-1 mb-3">
              {shippingTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-full border border-emerald-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

        {/* Tags */}
          {rawTags.length > 0 && !isMinimal && (
          <div className="flex flex-wrap gap-1 mb-3">
              {rawTags.slice(0, 2).map((tag, idx) => (
              <span
                  key={`${tag}-${idx}`}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-full border border-blue-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

          {/* Swatches */}
          {allowSwatches && colorOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {colorOptions.slice(0, 4).map((color) => (
                <span
                  key={color.name}
                  className="px-2 py-0.5 text-[11px] rounded-full border border-gray-200 text-gray-600 bg-gray-50"
                  title={color.name}
                >
                  {color.name}
                </span>
              ))}
              {colorOptions.length > 4 && (
                <span className="px-2 py-0.5 text-[11px] rounded-full border border-gray-200 text-gray-500 bg-gray-50">
                  +{colorOptions.length - 4}
                </span>
              )}
            </div>
          )}

        {/* Price */}
        <div className={`${isMinimal ? 'mt-3' : 'mb-3 mt-auto'}`}>
            {hasPriceRange ? (
              showComparePrice ? (
                <div className="flex items-center gap-2">
                  <p className={`font-bold text-gray-900 ${isMinimal ? 'text-[16px] leading-[22px]' : 'text-[16px] leading-[22px] sm:text-[18px] sm:leading-[24px]'}`}>
                    {formatPrice(product.min_price ?? null)}
                  </p>
                  <p className={`font-semibold text-gray-400 line-through ${isMinimal ? 'text-[12px] leading-[18px]' : 'text-[12px] leading-[18px] sm:text-[13px] sm:leading-[20px]'}`}>
                    {formatPrice(compareAtDisplay ?? null)}
                  </p>
                  {isMinimal && savings !== null && (
                    <span className="text-[11px] leading-[16px] font-semibold text-emerald-600">
                      Save {formatPrice(savings)}
                    </span>
                  )}
                </div>
              ) : (
            <p className={`font-bold text-gray-900 ${isMinimal ? 'text-[16px] leading-[22px]' : 'text-[16px] leading-[22px] sm:text-[18px] sm:leading-[24px]'}`}>
            {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
            </p>
              )
          ) : (
            <p className={`font-semibold text-gray-700 ${isMinimal ? 'text-[14px] leading-[20px]' : 'text-[15px] leading-[22px] sm:text-[16px] sm:leading-[24px]'}`}>
              Price on request
            </p>
          )}
        </div>

          {/* Quick Add */}
          {allowQuickActions && isQuickAddOpen && (
            <div
              className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {unitsLoading && <div className="text-gray-500">Loading options...</div>}
              {!unitsLoading && units.length === 0 && (
                <div className="text-gray-500">No purchase options yet.</div>
              )}
              {!unitsLoading && units.length > 0 && (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {units.slice(0, 4).map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedUnitId(unit.id ?? null);
                        }}
                        className={`px-3 py-1 rounded-full border text-xs ${
                          unit.id === selectedUnitId
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        {unit.color_name || unit.condition || 'Option'}
                      </button>
                    ))}
                    {units.length > 4 && (
                      <span className="px-3 py-1 rounded-full border text-xs border-gray-200 bg-white text-gray-500">
                        +{units.length - 4} more
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleAddToCart(event, 1)}
                    disabled={!selectedUnit?.id || isAddingToCart}
                    className="w-full rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to cart'}
                  </button>
                  <div className="mt-2 text-xs text-gray-500">
                    Prefer more options? <span className="text-blue-600">View details</span>
                  </div>
                </>
              )}
            </div>
          )}

        {/* Stock & Interest Info */}
        {!isMinimal ? (
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
            {allowInterestCount && interestText && (
              <span className="text-orange-600 font-semibold flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {interestText}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3 text-[12px] leading-[18px] text-gray-600">
            <span className={`font-semibold ${hasStock ? 'text-emerald-600' : 'text-red-600'}`}>
              {hasStock ? 'In stock' : 'Out of stock'}
            </span>
            {lowStock && hasStock && (
              <span className="ml-2 text-amber-600 font-semibold">Low stock</span>
            )}
          </div>
        )}
      </div>
    </Link>

      {isQuickViewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsQuickViewOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{product.product_name}</h4>
                <p className="text-sm text-gray-500">{product.brand}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickViewOpen(false)}
                className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
              <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden">
                <Image
                  src={primaryImage}
                  alt={product.product_name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
                />
              </div>
              <div className="space-y-4">
                <div>
                  {hasPriceRange ? (
                    showComparePrice ? (
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-gray-900">
                          {formatPrice(product.min_price ?? null)}
                        </p>
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(compareAtDisplay ?? null)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">
                        {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
                      </p>
                    )
                  ) : (
                    <p className="text-lg font-semibold text-gray-700">Price on request</p>
                  )}
                </div>

                <RatingStars rating={averageRating} count={reviewCount} />

                {showSwatches && colorOptions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Available colors</p>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <span
                          key={color.name}
                          className="px-3 py-1 rounded-full border text-xs border-gray-200 text-gray-600 bg-gray-50"
                        >
                          {color.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {units.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Choose option</p>
                    <div className="flex flex-wrap gap-2">
                      {units.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => setSelectedUnitId(unit.id ?? null)}
                          className={`px-3 py-1 rounded-full border text-xs ${
                            unit.id === selectedUnitId
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600'
                          }`}
                        >
                          {unit.color_name || unit.condition || 'Option'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="px-3 py-2 text-gray-600"
                    >
                      -
                    </button>
                    <span className="px-3 text-sm font-semibold text-gray-800">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="px-3 py-2 text-gray-600"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleAddToCart(event, quantity)}
                    disabled={!selectedUnit?.id || isAddingToCart}
                    className="flex-1 rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to cart'}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="text-gray-600 hover:text-red-500"
                  >
                    {isInWishlist(product.id) ? 'Saved' : 'Save to wishlist'}
                  </button>
                  <Link
                    href={getProductHref(product)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View full details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

