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
    return <span className="product-card__rating-empty">No reviews yet</span>;
  }

  const rounded = Math.round(rating * 10) / 10;
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);

  return (
    <div className="product-card__rating-stars">
      <div className="product-card__rating-icons">
        {stars.map((star) => (
          <svg
            key={star}
            className="product-card__rating-icon"
            viewBox="0 0 20 20"
            fill={rounded >= star ? 'currentColor' : 'none'}
            stroke="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="product-card__rating-value">{rounded}</span>
      <span className="product-card__rating-count">({count})</span>
    </div>
  );
}

export function ProductCard({
  product,
  variant = 'featured',
  showInterestCount = true,
  showQuickActions = true,
  showQuickView = true,
  showRatings = true,
  showSwatches = true,
  showShippingBadges = true,
}: ProductCardProps) {
  const normalizedVariant: 'featured' | 'minimal' =
    variant === 'minimal' ? 'minimal' : 'featured';
  const isMinimal = normalizedVariant === 'minimal';
  const isFeaturedVariant = normalizedVariant === 'featured';
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

  // Group units by storage and find lowest price for each storage option
  const storageOptions = useMemo(() => {
    const storageMap = new Map<number, { storage: number; price: number; unitId: number }>();
    
    units.forEach((unit) => {
      const storage = unit.storage_gb;
      if (storage !== null && storage !== undefined) {
        const price = parseFloat(unit.selling_price || '0');
        const existing = storageMap.get(storage);
        
        if (!existing || price < existing.price) {
          storageMap.set(storage, {
            storage,
            price,
            unitId: unit.id ?? 0,
          });
        }
      }
    });
    
    return Array.from(storageMap.values()).sort((a, b) => a.storage - b.storage);
  }, [units]);

  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);

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

  // Auto-select first storage option on load
  useEffect(() => {
    if (storageOptions.length > 1 && selectedStorage === null) {
      const firstStorage = storageOptions[0];
      setSelectedStorage(firstStorage.storage);
      setSelectedUnitId(firstStorage.unitId);
    } else if (storageOptions.length <= 1 && !selectedUnitId && units.length > 0) {
      // If no storage options or only one, select first available unit
      setSelectedUnitId(units[0]?.id ?? null);
    }
  }, [storageOptions, selectedStorage, selectedUnitId, units]);

  // Update selected unit when storage changes
  useEffect(() => {
    if (selectedStorage !== null && storageOptions.length > 1) {
      const storageOption = storageOptions.find((opt) => opt.storage === selectedStorage);
      if (storageOption) {
        setSelectedUnitId(storageOption.unitId);
      }
    }
  }, [selectedStorage, storageOptions]);

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
        className="product-card product-card--featured"
      >
        <div className="product-card__media product-card__media--square product-card__media--featured">
          <Image
            src={primaryImage}
            alt={product.product_name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="product-card__image product-card__image--primary product-card__image--featured"
            unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
          />
          {/* Always visible product name, storage options, price and cart icon */}
          <div className="product-card__footer product-card__footer--featured">
            <div className="product-card__footer-content">
              <p className="product-card__name product-card__name--featured">
                {product.product_name}
              </p>
              {/* Storage Options */}
              {storageOptions.length > 1 && (
                <div className="product-card__storage-options">
                  {storageOptions.map((option) => (
                    <button
                      key={option.storage}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedStorage(option.storage);
                      }}
                      className={`product-card__storage-option ${
                        selectedStorage === option.storage
                          ? 'product-card__storage-option--active'
                          : ''
                      }`}
                    >
                      {option.storage}GB
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="product-card__footer-right">
              {/* Price - above cart icon */}
              {selectedUnit && selectedUnit.selling_price ? (
                <p className="product-card__price product-card__price--featured">
                  {formatPrice(parseFloat(selectedUnit.selling_price))}
                </p>
              ) : hasPriceRange ? (
                <p className="product-card__price product-card__price--featured">
                  {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
                </p>
              ) : (
                <p className="product-card__price product-card__price--featured">
                  Price on request
                </p>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!selectedUnit?.id) return;
                  handleAddToCart(event, 1);
                }}
                disabled={!canAddToCart || isAddingToCart}
                className="product-card__cart-icon product-card__cart-icon--featured"
                aria-label="Add to cart"
              >
                <svg className="product-card__cart-icon-svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <>
    <Link
      href={getProductHref(product)}
      className={`product-card product-card--default ${isMinimal ? 'product-card--minimal' : 'product-card--standard'}`}
    >
      {/* Product Image */}
      <div className={`product-card__media ${isMinimal ? 'product-card__media--square' : 'product-card__media--wide'}`}>
        <Image
            src={primaryImage}
          alt={product.product_name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`product-card__image product-card__image--primary ${secondaryImage ? 'product-card__image--fade' : ''}`}
          unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
        />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.product_name} alternate`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="product-card__image product-card__image--secondary"
              unoptimized={secondaryImage.includes('localhost') || secondaryImage.includes('127.0.0.1') || secondaryImage.includes('placehold.co')}
            />
          )}

          {/* Badges */}
          <div className="product-card__badges">
        {!isMinimal && hasBundle && (
            <div className="product-card__badge product-card__badge--bundle">
            {bundlePricePreview ? `Bundle from ${formatPrice(bundlePricePreview)}` : 'Bundle available'}
          </div>
        )}
            {isOnSale && (
              <div className="product-card__badge product-card__badge--sale">
                {discountPercent ? `Save ${discountPercent}%` : 'Sale'}
              </div>
            )}
            {!isMinimal && isNew && (
              <div className="product-card__badge product-card__badge--new">
                New
              </div>
            )}
            {!isMinimal && isFeatured && (
              <div className="product-card__badge product-card__badge--trending">
                Trending
              </div>
            )}
            {!isMinimal && lowStock && (
              <div className="product-card__badge product-card__badge--low-stock">
                Low stock
              </div>
            )}
          </div>

        {/* Stock Badge */}
        {!hasStock && (
          <div className="product-card__badge product-card__badge--stock product-card__badge--out">
            Out of Stock
          </div>
        )}

          {/* Quick Actions */}
          {allowQuickActions && (
            <div className="product-card__quick-actions">
              <button
                type="button"
                onClick={handleWishlistToggle}
                className={`product-card__quick-action ${isInWishlist(product.id) ? 'product-card__quick-action--active' : ''}`}
                aria-label="Toggle wishlist"
              >
                <svg className="product-card__quick-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 18.343l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              </button>
              {allowQuickView && (
                <button
                  type="button"
                  onClick={handleQuickViewOpen}
                  className="product-card__quick-action"
                  aria-label="Quick view"
                >
                  <svg className="product-card__quick-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3c-4.5 0-8.268 2.943-9.5 7 1.232 4.057 5 7 9.5 7s8.268-2.943 9.5-7C18.268 5.943 14.5 3 10 3zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={handleQuickAddToggle}
                className="product-card__quick-action"
                aria-label="Quick add"
              >
                <svg className="product-card__quick-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
              </button>
            </div>
          )}
        
        {/* Hover Overlay */}
        {!isMinimal && (
          <div className="product-card__overlay" />
        )}
      </div>

      {/* Product Info */}
      <div className={`product-card__body ${isMinimal ? 'product-card__body--minimal' : 'product-card__body--standard'}`}>
        <h3 className={`product-card__title ${isMinimal ? 'product-card__title--minimal' : 'product-card__title--standard'}`}>
          {product.product_name}
        </h3>
        
        {(brandLine || specLine) && (
          <p className={`product-card__spec ${isMinimal ? 'product-card__spec--minimal' : 'product-card__spec--standard'}`}>
            {brandLine}
            {brandLine && specLine ? ' • ' : ''}
            {specLine}
          </p>
        )}

          {showRatings && (
            <div className={`product-card__rating ${isMinimal ? 'product-card__rating--minimal' : 'product-card__rating--standard'}`}>
              <RatingStars rating={averageRating} count={reviewCount} />
            </div>
          )}

          {shippingTags.length > 0 && !isMinimal && (
            <div className="product-card__chips">
              {shippingTags.map((tag) => (
                <span
                  key={tag}
                  className="product-card__chip product-card__chip--shipping"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

        {/* Tags */}
          {rawTags.length > 0 && !isMinimal && (
          <div className="product-card__chips">
              {rawTags.slice(0, 2).map((tag, idx) => (
              <span
                  key={`${tag}-${idx}`}
                className="product-card__chip product-card__chip--tag"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

          {/* Swatches */}
          {allowSwatches && colorOptions.length > 0 && (
            <div className="product-card__swatches">
              {colorOptions.slice(0, 4).map((color) => (
                <span
                  key={color.name}
                  className="product-card__swatch"
                  title={color.name}
                >
                  {color.name}
                </span>
              ))}
              {colorOptions.length > 4 && (
                <span className="product-card__swatch product-card__swatch--more">
                  +{colorOptions.length - 4}
                </span>
              )}
            </div>
          )}

        {/* Price */}
        <div className={`product-card__price-block ${isMinimal ? 'product-card__price-block--minimal' : 'product-card__price-block--standard'}`}>
            {hasPriceRange ? (
              showComparePrice ? (
                <div className="product-card__price-row">
                  <p className={`product-card__price ${isMinimal ? 'product-card__price--compact' : ''}`}>
                    {formatPrice(product.min_price ?? null)}
                  </p>
                  <p className={`product-card__msrp ${isMinimal ? 'product-card__msrp--compact' : ''}`}>
                    {formatPrice(compareAtDisplay ?? null)}
                  </p>
                  {isMinimal && savings !== null && (
                    <span className="product-card__savings">
                      Save {formatPrice(savings)}
                    </span>
                  )}
                </div>
              ) : (
            <p className={`product-card__price ${isMinimal ? 'product-card__price--compact' : ''}`}>
            {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
            </p>
              )
          ) : (
            <p className={`product-card__price-request ${isMinimal ? 'product-card__price-request--compact' : ''}`}>
              Price on request
            </p>
          )}
        </div>

          {/* Quick Add */}
          {allowQuickActions && isQuickAddOpen && (
            <div
              className="product-card__quick-add"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              {unitsLoading && <div className="product-card__quick-add-message">Loading options...</div>}
              {!unitsLoading && units.length === 0 && (
                <div className="product-card__quick-add-message">No purchase options yet.</div>
              )}
              {!unitsLoading && units.length > 0 && (
                <>
                  <div className="product-card__quick-add-options">
                    {units.slice(0, 4).map((unit) => (
                      <button
                        key={unit.id}
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setSelectedUnitId(unit.id ?? null);
                        }}
                        className={`product-card__quick-add-option ${unit.id === selectedUnitId ? 'product-card__quick-add-option--active' : ''}`}
                      >
                        {unit.color_name || unit.condition || 'Option'}
                      </button>
                    ))}
                    {units.length > 4 && (
                      <span className="product-card__quick-add-more">
                        +{units.length - 4} more
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleAddToCart(event, 1)}
                    disabled={!selectedUnit?.id || isAddingToCart}
                    className="product-card__quick-add-button"
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to cart'}
                  </button>
                  <div className="product-card__quick-add-help">
                    Prefer more options? <span className="product-card__quick-add-link">View details</span>
                  </div>
                </>
              )}
            </div>
          )}

        {/* Stock & Interest Info */}
        {!isMinimal ? (
          <div className="product-card__meta">
            <span className={`product-card__stock ${hasStock ? 'product-card__stock--in' : 'product-card__stock--out'}`}>
              {hasStock ? (
                <span className="product-card__stock-info">
                  <svg className="product-card__stock-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {product.available_units_count} {product.available_units_count === 1 ? 'unit' : 'units'}
                </span>
              ) : (
                'Out of stock'
              )}
            </span>
            {allowInterestCount && interestText && (
              <span className="product-card__interest">
                <svg className="product-card__interest-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {interestText}
              </span>
            )}
          </div>
        ) : (
          <div className="product-card__stock-note">
            <span className={`product-card__stock ${hasStock ? 'product-card__stock--in' : 'product-card__stock--out'}`}>
              {hasStock ? 'In stock' : 'Out of stock'}
            </span>
            {lowStock && hasStock && (
              <span className="product-card__low-stock">Low stock</span>
            )}
          </div>
        )}
      </div>
    </Link>

      {isQuickViewOpen && (
        <div
          className="product-card__modal"
          onClick={() => setIsQuickViewOpen(false)}
        >
          <div
            className="product-card__modal-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="product-card__modal-header">
              <div>
                <h4 className="product-card__modal-title">{product.product_name}</h4>
                <p className="product-card__modal-subtitle">{product.brand}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickViewOpen(false)}
                className="product-card__modal-close"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="product-card__modal-body">
              <div className="product-card__modal-media">
                <Image
                  src={primaryImage}
                  alt={product.product_name}
                  fill
                  className="product-card__modal-image"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  unoptimized={!product.primary_image || product.primary_image.includes('localhost') || product.primary_image.includes('127.0.0.1') || product.primary_image.includes('placehold.co')}
                />
              </div>
              <div className="product-card__modal-details">
                <div>
                  {hasPriceRange ? (
                    showComparePrice ? (
                      <div className="product-card__modal-price">
                        <p className="product-card__modal-price-main">
                          {formatPrice(product.min_price ?? null)}
                        </p>
                        <p className="product-card__modal-price-msrp">
                          {formatPrice(compareAtDisplay ?? null)}
                        </p>
                      </div>
                    ) : (
                      <p className="product-card__modal-price-main">
                        {formatPriceRange(product.min_price ?? null, product.max_price ?? null)}
                      </p>
                    )
                  ) : (
                    <p className="product-card__modal-price-request">Price on request</p>
                  )}
                </div>

                <RatingStars rating={averageRating} count={reviewCount} />

                {showSwatches && colorOptions.length > 0 && (
                  <div className="product-card__modal-section">
                    <p className="product-card__modal-section-title">Available colors</p>
                    <div className="product-card__modal-swatches">
                      {colorOptions.map((color) => (
                        <span
                          key={color.name}
                          className="product-card__modal-swatch"
                        >
                          {color.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {units.length > 0 && (
                  <div className="product-card__modal-section">
                    <p className="product-card__modal-section-title">Choose option</p>
                    <div className="product-card__modal-options">
                      {units.map((unit) => (
                        <button
                          key={unit.id}
                          type="button"
                          onClick={() => setSelectedUnitId(unit.id ?? null)}
                          className={`product-card__modal-option ${unit.id === selectedUnitId ? 'product-card__modal-option--active' : ''}`}
                        >
                          {unit.color_name || unit.condition || 'Option'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-card__modal-actions">
                  <div className="product-card__qty">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="product-card__qty-btn"
                    >
                      -
                    </button>
                    <span className="product-card__qty-value">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="product-card__qty-btn"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => handleAddToCart(event, quantity)}
                    disabled={!selectedUnit?.id || isAddingToCart}
                    className="product-card__modal-add"
                  >
                    {isAddingToCart ? 'Adding...' : 'Add to cart'}
                  </button>
                </div>

                <div className="product-card__modal-links">
                  <button
                    type="button"
                    onClick={handleWishlistToggle}
                    className="product-card__modal-link"
                  >
                    {isInWishlist(product.id) ? 'Saved' : 'Save to wishlist'}
                  </button>
                  <Link
                    href={getProductHref(product)}
                    className="product-card__modal-link product-card__modal-link--primary"
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

