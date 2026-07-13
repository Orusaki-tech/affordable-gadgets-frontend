'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react';
import { PublicProduct, InventoryUnitImage } from '@/lib/api/generated';
import { formatPrice, formatPriceRange } from '@/lib/utils/format';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';
import { getProductHref } from '@/lib/utils/productRoutes';
import { setProductDetailPlaceholder } from '@/lib/utils/productDetailPlaceholder';
import { ProductTrustStamp } from '@/components/ProductTrustStamp';
import { useProductUnits, prefetchProductDetail } from '@/lib/hooks/useProducts';
import { useQueryClient } from '@tanstack/react-query';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { WhatsAppLeadModal } from '@/components/WhatsAppLeadModal';
import { AddToCartLeadModal } from '@/components/AddToCartLeadModal';
import { AuthChoiceModal } from '@/components/AuthChoiceModal';

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('auth_token');
}

/** Same stroke as `.product-card__buy-btn--featured`. Hex matches --primary-dark so it always paints (see DevTools). */
const productCardLinkFrameStyle: CSSProperties = {
  border: '1px solid #121212',
  boxSizing: 'border-box',
};

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
  showQuickView = false,
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
  const financingAvailable = Boolean((product as any)?.financing_available);

  const queryClient = useQueryClient();
  const router = useRouter();
  const shouldLoadUnits = allowSwatches || allowQuickActions || allowQuickView || isFeaturedVariant;
  const { data: units = [], isLoading: unitsLoading } = useProductUnits(product.id ?? 0, {
    enabled: shouldLoadUnits,
  });

  const handlePrefetch = () => prefetchProductDetail(queryClient, product);

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

  // Group units/variants by storage and find lowest price for each storage option
  const storageOptions = useMemo(() => {
    const storageMap = new Map<number, { storage: number; price: number; unitId: number | null }>();
    
    units.forEach((unit) => {
      const storage = unit.storage_gb;
      if (storage !== null && storage !== undefined) {
        const price = parseFloat(unit.selling_price || '0');
        const existing = storageMap.get(storage);
        if (!existing || price < existing.price) {
          storageMap.set(storage, { storage, price, unitId: unit.id ?? 0 });
        }
      }
    });

    // Fallback to variants when no units (brand-new, made-to-order products)
    if (units.length === 0) {
      const variants: any[] = (product as any).variants ?? [];
      variants.forEach((v: any) => {
        const storage = v.storage_gb;
        if (storage !== null && storage !== undefined) {
          const price = parseFloat(String(v.selling_price || '0'));
          const existing = storageMap.get(storage);
          if (!existing || price < existing.price) {
            storageMap.set(storage, { storage, price, unitId: null });
          }
        }
      });
    }

    return Array.from(storageMap.values()).sort((a, b) => a.storage - b.storage);
  }, [units, product]);

  const ramOptions = useMemo(() => {
    const set = new Set<number>();
    units.forEach((unit) => {
      const ram = (unit as { ram_gb?: number | null }).ram_gb;
      if (ram != null) set.add(ram);
    });
    // Fallback to variants when no units
    if (units.length === 0) {
      const variants: any[] = (product as any).variants ?? [];
      variants.forEach((v: any) => {
        if (v.ram_gb != null) set.add(v.ram_gb);
      });
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [units, product]);

  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedRam, setSelectedRam] = useState<number | null>(null);
  const [showSingleStorageOnly, setShowSingleStorageOnly] = useState(false);
  const [showCardHint, setShowCardHint] = useState(true);
  const hasMadeCardSelection = useRef(false);
  const featuredNameRef = useRef<HTMLParagraphElement | null>(null);

  const onCardVariantSelect = () => {
    if (!hasMadeCardSelection.current) {
      hasMadeCardSelection.current = true;
      setShowCardHint(false);
    }
  };

  const secondaryImage = useMemo(() => {
    const primaryImage = product.primary_image;
    const unitImages = units.flatMap((unit) => (unit.images ?? []) as InventoryUnitImage[]);
    const candidate = unitImages.find(
      (img) => img?.image_url && img.image_url !== primaryImage
    );
    return candidate?.image_url || null;
  }, [product.primary_image, units]);

  const { addToCart, updateCartPhone } = useCart();
  const { isInWishlist, toggle } = useWishlist();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [pendingCartQty, setPendingCartQty] = useState<number | null>(null);
  const [needsAuthForCart, setNeedsAuthForCart] = useState(false);
  const [isPeekOpen, setIsPeekOpen] = useState(false);
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const isTouchLikeRef = useRef(false);

  // Touch/coarse devices: first tap peeks (hover UI), second tap navigates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: none)');
    const update = () => {
      isTouchLikeRef.current = mq.matches;
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isPeekOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsPeekOpen(false);
      }
    };
    const onOtherPeek = (event: Event) => {
      const detail = (event as CustomEvent<number | string | undefined>).detail;
      if (detail !== product.id) setIsPeekOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('product-card-peek', onOtherPeek);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('product-card-peek', onOtherPeek);
    };
  }, [isPeekOpen, product.id]);

  const isInteractiveCardTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return Boolean(
      target.closest('button, [role="button"], input, select, textarea, label')
    );
  };

  const handleCardClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Keep add-to-cart / variant / wishlist controls from triggering navigation
    if (isInteractiveCardTarget(event.target)) {
      event.preventDefault();
      return;
    }

    // Touch: never navigate via whitespace — open/keep peek so filters stay usable.
    // Product details is only via the dedicated details button on the peek UI.
    if (isTouchLikeRef.current) {
      event.preventDefault();
      if (!isPeekOpen) {
        setIsPeekOpen(true);
        window.dispatchEvent(
          new CustomEvent('product-card-peek', { detail: product.id })
        );
        handlePrefetch();
      }
      return;
    }

    setProductDetailPlaceholder(product);
  };

  const handleBuyClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setProductDetailPlaceholder(product);
    router.push(getProductHref(product));
  };

  const handlePeekToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPeekOpen) {
      setIsPeekOpen(false);
      return;
    }
    setIsPeekOpen(true);
    window.dispatchEvent(
      new CustomEvent('product-card-peek', { detail: product.id })
    );
    handlePrefetch();
  };

  const mobileActionButtons = (
    <div className="product-card__mobile-actions">
      <button
        type="button"
        className={`product-card__peek-toggle${isPeekOpen ? ' product-card__peek-toggle--open' : ''}`}
        onClick={handlePeekToggle}
        aria-label={isPeekOpen ? 'Hide product options' : 'Show product options'}
        aria-expanded={isPeekOpen}
      >
        {isPeekOpen ? (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className={`product-card__details-btn${
          selectedRam !== null ? ' product-card__details-btn--animate' : ''
        }`}
        onClick={handleBuyClick}
        aria-label="View product details"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );

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

  // When featured card name wraps to multiple lines, show only one storage option
  useLayoutEffect(() => {
    if (!isFeaturedVariant || !featuredNameRef.current) return;
    const el = featuredNameRef.current;
    const check = () => {
      const rects = el.getClientRects();
      setShowSingleStorageOnly(rects.length > 1);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isFeaturedVariant, product.product_name, storageOptions.length]);

  const selectedUnit = units.find((unit) => unit.id === selectedUnitId);

  // When no units exist, derive selected variant from product.variants + current filters.
  // Only active when at least one variant filter (storage/RAM) is selected.
  const hasAnyVariantFilter = selectedColor !== null || selectedStorage !== null || selectedRam !== null;
  const selectedVariant = useMemo(() => {
    if (units.length > 0) return null;
    const variants: any[] = (product as any).variants ?? [];
    if (variants.length === 0 || !hasAnyVariantFilter) return null;
    return variants.find((v) => {
      const storageMatch = selectedStorage === null || v.storage_gb === selectedStorage;
      const ramMatch = selectedRam === null || v.ram_gb === selectedRam;
      return storageMatch && ramMatch;
    }) ?? null;
  }, [product, units, selectedStorage, selectedRam, hasAnyVariantFilter]);

  const variantPrice = selectedVariant ? parseFloat(selectedVariant.selling_price) : null;

  const filteredUnits = useMemo(() => {
    if (units.length === 0) return [];
    return units.filter((unit) => {
      const normalizedColor = unit.color_name?.trim().toLowerCase() || null;
      const colorMatch =
        !selectedColor || normalizedColor === selectedColor.trim().toLowerCase();
      const storageMatch =
        selectedStorage === null || unit.storage_gb === selectedStorage;
      const ram = (unit as { ram_gb?: number | null }).ram_gb;
      const ramMatch = selectedRam === null || ram === selectedRam;
      return colorMatch && storageMatch && ramMatch;
    });
  }, [units, selectedColor, selectedStorage, selectedRam]);

  const activeUnits = useMemo(() => {
    if (filteredUnits.length > 0) return filteredUnits;
    if (!hasAnyVariantFilter) return units;
    return [];
  }, [filteredUnits, units, hasAnyVariantFilter]);

  const effectiveCartUnit = useMemo(() => {
    if (activeUnits.length === 0) return null;
    return activeUnits.reduce((best, u) => {
      const p = parseFloat(String(u.selling_price ?? '0'));
      const bestP = parseFloat(String(best.selling_price ?? '0'));
      return p > bestP ? u : best;
    }, activeUnits[0]);
  }, [activeUnits]);

  const trustStampCondition =
    effectiveCartUnit?.condition ?? selectedUnit?.condition ?? units[0]?.condition;

  useEffect(() => {
    setSelectedUnitId(effectiveCartUnit?.id ?? null);
  }, [effectiveCartUnit]);

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

  const beginAddToCart = (qty: number) => {
    setPendingCartQty(qty);
    if (!hasAuthToken()) {
      setNeedsAuthForCart(true);
    }
  };

  const handleAddToCart = (event: React.MouseEvent, qty?: number) => {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedUnit?.id) return;
    beginAddToCart(qty ?? 1);
  };

  const handleAuthSuccessForCart = () => {
    setNeedsAuthForCart(false);
  };

  const handleAuthCloseForCart = () => {
    setNeedsAuthForCart(false);
    // AuthChoiceModal also calls onClose after success — keep pending add in that case.
    if (!hasAuthToken()) {
      setPendingCartQty(null);
    }
  };

  const handleConfirmCartAdd = async (phone: string) => {
    if (!selectedUnit?.id || pendingCartQty == null) return;
    await updateCartPhone(phone);
    await addToCart(selectedUnit.id, pendingCartQty);
    setPendingCartQty(null);
    setIsPeekOpen(false);
    router.push('/cart');
  };

  const hasPriceRange =
    product.min_price !== null &&
    product.min_price !== undefined &&
    product.max_price !== null &&
    product.max_price !== undefined;
  const hasDefaultPriceOffer = !hasStock && hasPriceRange;
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
    TB: 'Tablets/Ipads',
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

  const activeUnitsMaxPrice = useMemo(() => {
    if (activeUnits.length === 0) return null;
    const prices = activeUnits.map((u) => parseFloat(String(u.selling_price ?? '0')));
    return Math.max(...prices);
  }, [activeUnits]);

  const activeUnitsMinPrice = useMemo(() => {
    if (activeUnits.length === 0) return null;
    const prices = activeUnits.map((u) => parseFloat(String(u.selling_price ?? '0')));
    return Math.min(...prices);
  }, [activeUnits]);

  const showSinglePrice = hasAnyVariantFilter && activeUnits.length > 0;
  const resolvedPriceText = variantPrice !== null
    ? formatPrice(variantPrice)
    : showSinglePrice && activeUnitsMaxPrice !== null
      ? formatPrice(activeUnitsMaxPrice)
      : hasPriceRange
        ? formatPriceRange(product.min_price ?? null, product.max_price ?? null)
        : 'Price on request';

  /** Show add-to-cart button (icon + price) on hover when at least one variant can be added; button shows single/max price */
  const showAddToCartSingleButton = activeUnits.length >= 1 && activeUnitsMaxPrice != null;
  const showPriceCtaButton = showAddToCartSingleButton || hasDefaultPriceOffer || variantPrice !== null;
  const addToCartButtonPriceText =
    variantPrice !== null
      ? formatPrice(variantPrice)
      : activeUnitsMinPrice != null && activeUnitsMaxPrice != null
        ? activeUnitsMinPrice === activeUnitsMaxPrice
          ? formatPrice(activeUnitsMaxPrice)
          : `${formatPrice(activeUnitsMinPrice)} - ${formatPrice(activeUnitsMaxPrice)}`
        : resolvedPriceText;

  const cartIconSvg = (
    <svg className="product-card__cart-icon-svg" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
    </svg>
  );

  const navigateToProductDetail = () => {
    setProductDetailPlaceholder(product);
    router.push(getProductHref(product));
  };

  const handlePriceCtaClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (selectedUnit?.id) {
      beginAddToCart(1);
      return;
    }
    navigateToProductDetail();
  };

  if (isFeaturedVariant) {
    const canAddToCart = Boolean(selectedUnit?.id) && !unitsLoading;
    const addToCartModal =
      pendingCartQty != null && !needsAuthForCart ? (
      <AddToCartLeadModal
        productName={product.product_name}
        productBrand={product.brand}
        productModel={product.model_series}
        initialPhone={
          typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || '' : ''
        }
        onClose={() => setPendingCartQty(null)}
        onConfirm={handleConfirmCartAdd}
      />
    ) : null;
    const authModal = needsAuthForCart ? (
      <AuthChoiceModal
        onClose={handleAuthCloseForCart}
        onAuthSuccess={handleAuthSuccessForCart}
        title="Sign in to add to cart"
        description="Create an account or sign in to save items to your cart."
      />
    ) : null;
    return (
      <>
      {authModal}
      <Link
        ref={cardRef}
        href={getProductHref(product)}
        className={`product-card product-card--featured${isPeekOpen ? ' product-card--peek' : ''}`}
        style={productCardLinkFrameStyle}
        onClick={handleCardClick}
        onMouseEnter={handlePrefetch}
        onFocus={handlePrefetch}
        aria-expanded={isPeekOpen}
      >
        <div className="product-card__media product-card__media--square product-card__media--featured">
          <CloudinaryImage
            src={primaryImage}
            alt={product.product_name}
            preset="productThumb"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="product-card__image product-card__image--primary product-card__image--featured"
            fill
          />
          <ProductTrustStamp condition={trustStampCondition} size="card" />
        </div>
        {mobileActionButtons}
        {/* Footer: default = bar (name + cart icon); hover = full overlay with storage, RAM, price range, reviews, cart icon */}
        <div className="product-card__footer product-card__footer--featured">
          <div className="product-card__footer-bar">
            <p
              ref={featuredNameRef}
              className="product-card__name product-card__name--featured"
            >
              {product.product_name}
            </p>
            <button
              type="button"
              onClick={handleBuyClick}
              className="product-card__buy-btn product-card__buy-btn--featured"
            >
              Buy
            </button>
            {hasStock && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!selectedUnit?.id) return;
                  handleAddToCart(event, 1);
                }}
                disabled={!canAddToCart}
                className="product-card__cart-icon product-card__cart-icon--featured product-card__cart-icon--bar-hover"
                aria-label="Add to cart"
              >
                {cartIconSvg}
              </button>
            )}
          </div>
          <div className="product-card__footer-overlay">
            <div className="product-card__overlay-row">
              <div className="product-card__overlay-header">
                <CloudinaryImage
                  src={primaryImage}
                  alt={product.product_name}
                  preset="productThumb"
                  width={30}
                  height={30}
                  className="product-card__overlay-thumb"
                />
                <p className="product-card__name product-card__name--featured">{product.product_name}</p>
              </div>
            </div>
            {showRatings && (
              <div className="product-card__overlay-row product-card__footer-rating">
                <RatingStars rating={averageRating} count={reviewCount} />
              </div>
            )}
            {colorOptions.length > 0 && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">Color</span>
              <div className="product-card__overlay-swatches">
                {colorOptions.map((color) => {
                  const normalized = color.name.trim().toLowerCase();
                  const isActive =
                    !!selectedColor &&
                    selectedColor.trim().toLowerCase() === normalized;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedColor((prev) =>
                          prev && prev.trim().toLowerCase() === normalized ? null : color.name
                        );
                      }}
                      className={`product-card__overlay-swatch ${
                        isActive ? 'product-card__overlay-swatch--active' : ''
                      }`}
                    >
                      {color.name}
                    </button>
                  );
                })}
              </div>
            </div>
            )}
            {storageOptions.length > 0 && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">Storage</span>
              <div className="product-card__storage-options product-card__storage-options--expanded">
                {storageOptions.map((option, idx) => (
                  <button
                    key={option.storage}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedStorage((prev) =>
                        prev === option.storage ? null : option.storage
                      );
                      onCardVariantSelect();
                    }}
                    className={`product-card__storage-option ${
                      selectedStorage === option.storage
                        ? 'product-card__storage-option--active'
                        : ''
                    }${!selectedStorage && !selectedRam && idx === 0 ? ' product-card__storage-option--suggest' : ''}`}
                  >
                    {option.storage}GB
                  </button>
                ))}
              </div>
            </div>
            )}
            {ramOptions.length > 0 && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">RAM</span>
              <div className="product-card__ram-options">
                {ramOptions.map((ram, idx) => (
                  <button
                    key={ram}
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSelectedRam((prev) => (prev === ram ? null : ram));
                    }}
                    className={`product-card__ram-chip ${
                      selectedRam === ram ? 'product-card__ram-chip--active' : ''
                    }${
                      selectedRam === null && idx === 0
                        ? ' product-card__ram-chip--suggest'
                        : ''
                    }`}
                  >
                    {ram}GB
                  </button>
                ))}
              </div>
            </div>
            )}
            <div className="product-card__overlay-actions">
              {hasStock && showAddToCartSingleButton && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!selectedUnit?.id) return;
                    handleAddToCart(event, 1);
                  }}
                  disabled={!canAddToCart}
                  className="product-card__add-to-cart-btn product-card__add-to-cart-btn--overlay-single"
                  aria-label="Add to cart"
                >
                  Add to cart
                </button>
              )}
              {hasDefaultPriceOffer && (
                <button
                  type="button"
                  onClick={handlePriceCtaClick}
                  className="product-card__add-to-cart-btn product-card__add-to-cart-btn--overlay-single"
                  aria-label="View product details"
                >
                  <span className="product-card__add-to-cart-btn-icon">{cartIconSvg}</span>
                  <span className="product-card__add-to-cart-btn-price">{addToCartButtonPriceText}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
      {addToCartModal}
      </>
    );
  }

  return (
    <>
    <Link
      ref={cardRef}
      href={getProductHref(product)}
      className={`product-card product-card--default ${isMinimal ? 'product-card--minimal' : 'product-card--standard'}${isPeekOpen ? ' product-card--peek' : ''}`}
      style={productCardLinkFrameStyle}
      onClick={handleCardClick}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      aria-expanded={isPeekOpen}
    >
      {/* Product Image */}
      <div className={`product-card__media ${isMinimal ? 'product-card__media--square' : 'product-card__media--wide'}`}>
        <CloudinaryImage
            src={primaryImage}
          alt={product.product_name}
          preset="productThumb"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`product-card__image product-card__image--primary ${secondaryImage ? 'product-card__image--fade' : ''}`}
          fill
        />
          {secondaryImage && (
            <CloudinaryImage
              src={secondaryImage}
              alt={`${product.product_name} alternate`}
              preset="productThumb"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="product-card__image product-card__image--secondary"
              fill
            />
          )}
        {mobileActionButtons}

          <ProductTrustStamp condition={trustStampCondition} size="card" />

          {/* Badges */}
          <div className="product-card__badges">
        {!isMinimal && hasBundle && (
            <div className="product-card__badge product-card__badge--bundle">
            {bundlePricePreview ? `Bundle from ${formatPrice(bundlePricePreview)}` : 'Bundle available'}
          </div>
        )}
            {!isMinimal && financingAvailable && (
              <div className="product-card__badge product-card__badge--financing">
                Financing available
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
                <></>
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

        {/* Hover-only add-to-cart (icon + price) when one variant left — same behaviour as featured */}
        {!isMinimal && showPriceCtaButton && (
          <div className="product-card__hover-add">
            <button
              type="button"
              onClick={handlePriceCtaClick}
              className="product-card__add-to-cart-btn product-card__add-to-cart-btn--overlay-single"
              aria-label={selectedUnit?.id ? 'Add to cart' : 'View product details'}
            >
              {selectedUnit?.id ? 'Add to cart' : addToCartButtonPriceText}
            </button>
          </div>
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

          {/* Color — always reserve space; show swatches or "No colors" */}
          {!isMinimal && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">Color</span>
              <div className="product-card__swatches">
                {allowSwatches && colorOptions.length > 0 ? (
                  <>
                    {colorOptions.slice(0, 4).map((color) => {
                      const normalized = color.name.trim().toLowerCase();
                      const isActive =
                        !!selectedColor &&
                        selectedColor.trim().toLowerCase() === normalized;
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedColor((prev) =>
                              prev && prev.trim().toLowerCase() === normalized ? null : color.name
                            );
                          }}
                          className={`product-card__swatch ${
                            isActive ? 'product-card__swatch--active' : ''
                          }`}
                          title={color.name}
                        >
                          {color.name}
                        </button>
                      );
                    })}
                    {colorOptions.length > 4 && (
                      <span className="product-card__swatch product-card__swatch--more">
                        +{colorOptions.length - 4}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="product-card__overlay-empty">No colors</span>
                )}
              </div>
            </div>
          )}

          {/* Storage — always reserve space for non-minimal cards */}
          {!isMinimal && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">Storage</span>
              <div className={`product-card__hint-banner${showCardHint && storageOptions.length > 0 && !selectedStorage ? '' : ' product-card__hint-banner--hidden'}`}>
                <span>👆 Pick storage & color</span>
              </div>
              <div className="product-card__storage-options">
                {storageOptions.length > 0 ? (
                  storageOptions.map((option, idx) => (
                    <button
                      key={option.storage}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedStorage((prev) =>
                          prev === option.storage ? null : option.storage
                        );
                        onCardVariantSelect();
                      }}
                      className={`product-card__storage-option ${
                        selectedStorage === option.storage
                          ? 'product-card__storage-option--active'
                          : ''
                      }${!selectedStorage && !selectedRam && idx === 0 && storageOptions.length > 1 ? ' product-card__storage-option--suggest' : ''}`}
                    >
                      {option.storage}GB
                    </button>
                  ))
                ) : (
                  <span className="product-card__overlay-empty">No storage</span>
                )}
              </div>
            </div>
          )}

          {/* RAM — always reserve space for non-minimal cards */}
          {!isMinimal && (
            <div className="product-card__overlay-row">
              <span className="product-card__overlay-label">RAM</span>
              <div className="product-card__ram-options">
                {ramOptions.length > 0 ? (
                  ramOptions.map((ram, idx) => (
                    <button
                      key={ram}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setSelectedRam((prev) => (prev === ram ? null : ram));
                      }}
                      className={`product-card__ram-chip ${
                        selectedRam === ram ? 'product-card__ram-chip--active' : ''
                      }${
                        selectedRam === null && idx === 0
                          ? ' product-card__ram-chip--suggest'
                          : ''
                      }`}
                    >
                      {ram}GB
                    </button>
                  ))
                ) : (
                  <span className="product-card__overlay-empty">No RAM</span>
                )}
              </div>
            </div>
          )}

        {/* Price — always reflects current variant filters (color / storage / RAM) */}
        <div className={`product-card__price-block ${isMinimal ? 'product-card__price-block--minimal' : 'product-card__price-block--standard'}`}>
          {variantPrice !== null ? (
            <p className={`product-card__price ${isMinimal ? 'product-card__price--compact' : ''}`}>
              {formatPrice(variantPrice)}
            </p>
          ) : activeUnitsMaxPrice !== null ? (
            <p className={`product-card__price ${isMinimal ? 'product-card__price--compact' : ''}`}>
              {resolvedPriceText}
            </p>
          ) : hasAnyVariantFilter && activeUnits.length === 0 ? (
            <>
              <p className={`product-card__price ${isMinimal ? 'product-card__price--compact' : ''}`}>
                {hasPriceRange
                  ? formatPriceRange(product.min_price ?? null, product.max_price ?? null)
                  : 'Price on request'}
              </p>
              <p className="product-card__price-hint">No variant for this selection</p>
            </>
          ) : hasPriceRange ? (
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
                <div className="product-card__quick-add-message product-card__quick-add-message--stack">
                  <p className="product-card__quick-add-hint">None available online right now.</p>
                  <span className="product-card__quick-add-link">View details</span>
                </div>
              )}
              {!unitsLoading && units.length > 0 && (
                <>
                  <div className="product-card__quick-add-options">
                    {activeUnits.slice(0, 4).map((unit) => (
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
                    disabled={!selectedUnit?.id}
                    className="product-card__quick-add-button"
                  >
                    Add to cart
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
            <span className="product-card__stock product-card__stock--in">
              {hasStock ? (
                <span className="product-card__stock-info">
                  <svg className="product-card__stock-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {product.available_units_count} {product.available_units_count === 1 ? 'unit' : 'units'}
                </span>
              ) : (
                'Available to order'
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
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsWhatsAppModalOpen(true);
              }}
              className="product-card__whatsapp-btn"
              aria-label="Message on WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ marginRight: 4 }}>
                <path d="M19.05 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.44 1.32 4.94L2 22l5.27-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
              </svg>
              WhatsApp
            </button>
          </div>
        ) : (
          <div className="product-card__stock-note">
            <span className="product-card__stock product-card__stock--in">
              {hasStock ? 'In stock' : 'Available to order'}
            </span>
            {lowStock && hasStock && (
              <span className="product-card__low-stock">Low stock</span>
            )}
          </div>
        )}
      </div>
    </Link>

      {pendingCartQty != null && !needsAuthForCart && (
        <AddToCartLeadModal
          productName={product.product_name}
          productBrand={product.brand}
          productModel={product.model_series}
          initialPhone={
            typeof window !== 'undefined' ? localStorage.getItem('customer_phone') || '' : ''
          }
          onClose={() => setPendingCartQty(null)}
          onConfirm={handleConfirmCartAdd}
        />
      )}
      {needsAuthForCart && (
        <AuthChoiceModal
          onClose={handleAuthCloseForCart}
          onAuthSuccess={handleAuthSuccessForCart}
          title="Sign in to add to cart"
          description="Create an account or sign in to save items to your cart."
        />
      )}
      {isWhatsAppModalOpen && product.id != null && (
        <WhatsAppLeadModal
          productId={product.id}
          productName={product.product_name}
          productBrand={product.brand}
          productModel={product.model_series}
          prefilledMessage={`Hi, I'm interested in: ${product.product_name?.trim() || 'a product'}${product.brand?.trim() ? '\nBrand: ' + product.brand.trim() : ''}${product.model_series?.trim() ? '\nModel: ' + product.model_series.trim() : ''}`}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </>
  );
}

