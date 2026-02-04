'use client';

import { useProduct, useProductBySlug, useProductUnits } from '@/lib/hooks/useProducts';
import { usePromotion } from '@/lib/hooks/usePromotions';
import { useBundles } from '@/lib/hooks/useBundles';
import { useCart } from '@/lib/hooks/useCart';
import { useProductAccessories } from '@/lib/hooks/useAccessories';
import { PricingModeEnum, PublicBundle, PublicBundleItem, PublicInventoryUnitPublic, InventoryUnitImage } from '@/lib/api/generated';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/format';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlaceholderProductImage, getPlaceholderUnitImage, getPlaceholderVideoUrl, convertToYouTubeEmbed } from '@/lib/utils/placeholders';

interface ProductDetailProps {
  slug: string;
}

type TabType = 'overview' | 'specs' | 'reviews' | 'videos' | 'compare';

const LazyReviewsShowcase = dynamic(
  () => import('./ReviewsShowcase').then((mod) => mod.ReviewsShowcase),
  {
    ssr: false,
    loading: () => (
      <div className="product-detail__loading-inline">Loading reviews...</div>
    ),
  }
);

const LazyComparisonPage = dynamic(
  () => import('./ComparisonPage').then((mod) => mod.ComparisonPage),
  {
    ssr: false,
    loading: () => (
      <div className="product-detail__loading-inline">Loading comparison...</div>
    ),
  }
);

const LazyProductRecommendations = dynamic(
  () => import('./ProductRecommendations').then((mod) => mod.ProductRecommendations),
  {
    ssr: false,
    loading: () => (
      <div className="product-detail__loading-inline">Loading recommendations...</div>
    ),
  }
);

type BundleItemWithId = PublicBundleItem & { id: number };
type ActiveBundle = PublicBundle & { id: number; items: BundleItemWithId[] };

interface UnitCardProps {
  unit: PublicInventoryUnitPublic;
  isSelected: boolean;
  onSelect: (unitId: number) => void;
  promotionPrice: number | null;
  onColorSelect: (color: string | null) => void;
}

function UnitCard({ unit, isSelected, onSelect, promotionPrice, onColorSelect }: UnitCardProps) {
  const [imageIndex, setImageIndex] = useState(0);
  const unitImages = unit.images || [];
  const primaryImage = unitImages.find((img: InventoryUnitImage) => img.is_primary) || (unitImages.length > 0 ? unitImages[0] : null);
  const displayImage = (unitImages.length > imageIndex ? unitImages[imageIndex] : null) || primaryImage;
  const imageUrl = displayImage?.image_url || null;
  
  const handleImageClick = (index: number, img: InventoryUnitImage) => {
    setImageIndex(index);
    // Auto-select color if image has associated color
    if (img.color_name) {
      onColorSelect(img.color_name);
    }
  };

  return (
    <div
      onClick={() => {
        if (unit.id === undefined) {
          return;
        }
        onSelect(unit.id);
      }}
      className={`product-detail__unit-card ${
        isSelected ? 'product-detail__unit-card--selected' : ''
      }`}
    >
      {/* Unit Info - Compact */}
      <div>
        <div className="product-detail__unit-row">
          {promotionPrice ? (
            <div>
              <p className="product-detail__unit-price product-detail__unit-price--promo">{formatPrice(promotionPrice)}</p>
              <p className="product-detail__unit-price-old">{formatPrice(Number(unit.selling_price))}</p>
            </div>
          ) : (
            <p className="product-detail__unit-price">{formatPrice(Number(unit.selling_price))}</p>
          )}
          {isSelected && (
            <span className="product-detail__unit-selected">
              ✓ Selected
            </span>
          )}
        </div>

        {/* Specs Badges - Only Condition and Grade (differentiating factors) */}
        <div className="product-detail__unit-badges">
          <span className="product-detail__unit-badge">{unit.condition === 'N' ? 'New' : unit.condition === 'R' ? 'Refurbished' : unit.condition === 'P' ? 'Pre-owned' : unit.condition}</span>
          {typeof unit.grade === 'string' && unit.grade && (
            <span className="product-detail__unit-badge">Grade {unit.grade}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const searchParams = useSearchParams();
  const promotionId = searchParams.get('promotion');

  const isNumericSlug = /^\d+$/.test(slug);
  const productIdFromSlug = isNumericSlug ? Number(slug) : 0;
  const { data: productBySlug, isLoading: productBySlugLoading, error: productBySlugError } = useProductBySlug(
    isNumericSlug ? '' : slug
  );
  const { data: productById, isLoading: productByIdLoading, error: productByIdError } = useProduct(productIdFromSlug);
  const product = isNumericSlug ? productById : productBySlug;
  const productLoading = isNumericSlug ? productByIdLoading : productBySlugLoading;
  const productError = product ? undefined : (isNumericSlug ? productByIdError : productBySlugError);
  const { data: units, isLoading: unitsLoading } = useProductUnits(product?.id || 0);
  const { data: accessories } = useProductAccessories(product?.id || 0);
  const { data: promotion } = usePromotion(promotionId ? parseInt(promotionId) : 0);
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles({ productId: product?.id });
  const { addToCart, addBundleToCart } = useCart();
  const router = useRouter();
  
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const productId = product?.id;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [bundleAddingId, setBundleAddingId] = useState<number | null>(null);
  const [selectedBundleItems, setSelectedBundleItems] = useState<Record<number, Set<number>>>({});
  const [bundleSuccessMessage, setBundleSuccessMessage] = useState<string | null>(null);
  const [selectedAccessoryVariants, setSelectedAccessoryVariants] = useState<Record<number, number>>({});

  const jumpToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => {
      const target = document.getElementById('product-reviews');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const activeBundles = useMemo<ActiveBundle[]>(() => {
    const bundles = bundlesData?.results || [];
    return bundles
      .filter(
        (bundle): bundle is PublicBundle & { id: number } =>
          bundle.is_currently_active === true && typeof bundle.id === 'number'
      )
      .map((bundle) => {
        const items: BundleItemWithId[] = (bundle.items ?? []).filter(
          (item): item is BundleItemWithId => typeof item.id === 'number'
        );
        const activeBundle: ActiveBundle = { ...bundle, items };
        return activeBundle;
      })
      .filter((bundle) => bundle.items.length > 0);
  }, [bundlesData?.results]);

  useEffect(() => {
    if (!activeBundles.length) return;
    setSelectedBundleItems((prev) => {
      const next: Record<number, Set<number>> = { ...prev };
      activeBundles.forEach((bundle) => {
        if (bundle.id === undefined) {
          return;
        }
        if (!next[bundle.id]) {
          const itemIds = bundle.items
            .map((item) => item.id)
            .filter((id): id is number => typeof id === 'number');
          next[bundle.id] = new Set(itemIds);
        }
      });
      return next;
    });
  }, [activeBundles]);

  // Product images - include product primary image and all unit images
  const productImages = useMemo(() => {
    const images: string[] = [];
    
    // Add product primary image first (or placeholder)
    if (product?.primary_image) {
      images.push(product.primary_image);
    } else if (product) {
      images.push(getPlaceholderProductImage(product.product_name));
    }
    
    // Add all unique unit images (for color selection)
    if (units && units.length > 0) {
      const unitImageUrls = new Set<string>();
      units.forEach((unit: PublicInventoryUnitPublic) => {
        if (unit.images && unit.images.length > 0) {
          unit.images.forEach((img: InventoryUnitImage) => {
            if (img.image_url && !unitImageUrls.has(img.image_url)) {
              unitImageUrls.add(img.image_url);
              images.push(img.image_url);
            }
          });
        } else if (unit.color_name) {
          // Add placeholder for units without images
          const placeholderUrl = getPlaceholderUnitImage(unit.color_name);
          if (!unitImageUrls.has(placeholderUrl)) {
            unitImageUrls.add(placeholderUrl);
            images.push(placeholderUrl);
          }
        }
      });
    }
    
    // If no images at all, add at least one placeholder
    if (images.length === 0 && product) {
      images.push(getPlaceholderProductImage(product.product_name));
    }
    
    return images;
  }, [product?.primary_image, product, units]);

  // Track recently viewed products
  useEffect(() => {
    if (product?.id) {
      const recentlyViewed = JSON.parse(
        localStorage.getItem('recentlyViewed') || '[]'
      ) as number[];
      const updated = [product.id, ...recentlyViewed.filter((id) => id !== product.id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [product?.id]);

  // isInCompare is now managed by useCompare hook

  // Auto-select unit if only one is available
  useEffect(() => {
    if (units && units.length === 1 && !selectedUnit && units[0]?.id !== undefined) {
      setSelectedUnit(units[0].id);
    }
  }, [units, selectedUnit]);

  // Group units by variants
  const groupedUnits = useMemo(() => {
    if (!units) return null;
    
    const groups: Record<string, typeof units> = {};
    units.forEach(unit => {
      const key = `${unit.storage_gb || 'N/A'}-${unit.ram_gb || 'N/A'}-${unit.color_name || 'N/A'}-${unit.condition}-${unit.grade || 'N/A'}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(unit);
    });
    
    return groups;
  }, [units]);

  // Get unique variants
  const uniqueStorage = useMemo<number[]>(() => {
    if (!units) return [];
    return Array.from(
      new Set(
        units
          .map((u) => u.storage_gb)
          .filter((value): value is number => typeof value === 'number')
      )
    ).sort((a, b) => a - b);
  }, [units]);

  const uniqueRAM = useMemo<number[]>(() => {
    if (!units) return [];
    return Array.from(
      new Set(
        units
          .map((u) => u.ram_gb)
          .filter((value): value is number => typeof value === 'number')
      )
    ).sort((a, b) => a - b);
  }, [units]);

  const uniqueColors = useMemo<string[]>(() => {
    if (!units) return [];
    return Array.from(
      new Set(
        units
          .map((u) => u.color_name)
          .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      )
    );
  }, [units]);

  const uniqueConditions = useMemo(() => {
    if (!units) return [];
    return Array.from(new Set(units.map(u => u.condition)));
  }, [units]);

  const uniqueGrades = useMemo<string[]>(() => {
    if (!units) return [];
    return Array.from(
      new Set(
        units
          .map((u) => u.grade)
          .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
      )
    );
  }, [units]);

  const uniqueBattery = useMemo<number[]>(() => {
    if (!units) return [];
    return Array.from(
      new Set(
        units
          .map((u) => u.battery_mah)
          .filter((value): value is number => typeof value === 'number')
      )
    ).sort((a, b) => a - b);
  }, [units]);

  // Filter units based on selected variants
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);
  const [selectedRAM, setSelectedRAM] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedBattery, setSelectedBattery] = useState<number | null>(null);

  const filteredUnits = useMemo(() => {
    if (!units) return [];
    return units.filter((unit) => {
      if (selectedStorage !== null && unit.storage_gb !== selectedStorage) return false;
      if (selectedRAM !== null && unit.ram_gb !== selectedRAM) return false;
      if (selectedColor !== null && unit.color_name !== selectedColor) return false;
      if (selectedCondition !== null && unit.condition !== selectedCondition) return false;
      if (selectedGrade !== null && unit.grade !== selectedGrade) return false;
      if (selectedBattery !== null && unit.battery_mah !== selectedBattery) return false;
      return true;
    });
  }, [units, selectedStorage, selectedRAM, selectedColor, selectedCondition, selectedGrade, selectedBattery]);

  // Auto-select from filtered units when Storage and Color are selected
  useEffect(() => {
    if (filteredUnits.length === 0) {
      if (selectedUnit) {
        setSelectedUnit(null);
      }
      return;
    }

    const firstUnitId = filteredUnits[0]?.id;
    if (firstUnitId === undefined) {
      return;
    }

    if (!selectedUnit) {
      if (filteredUnits.length === 1 || (selectedStorage && selectedColor)) {
        setSelectedUnit(firstUnitId);
      }
      return;
    }

    const stillAvailable = filteredUnits.some((u) => u.id === selectedUnit);
    if (!stillAvailable) {
      setSelectedUnit(firstUnitId);
    }
  }, [filteredUnits, selectedUnit, selectedStorage, selectedColor]);

  const handleAddToCart = async () => {
    if (!selectedUnit) {
      alert('Please select a variant');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Get promotion info if eligible
      const promoId = isEligibleForPromotion && promotion ? promotion.id : undefined;
      const promoPrice = isEligibleForPromotion && promotionUnitPrice !== null 
        ? promotionUnitPrice 
        : selectedUnitData?.selling_price;
      const normalizedPromoPrice =
        promoPrice !== undefined && promoPrice !== null ? Number(promoPrice) : undefined;
      
      await addToCart(
        selectedUnit, 
        quantity,
        promoId,
        normalizedPromoPrice
      );
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error: any) {
      console.error('Add to cart error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add to cart';
      alert(`Failed to add to cart: ${errorMessage}`);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddBundleToCart = async (bundleId: number) => {
    if (!selectedUnit) {
      alert('Please select a variant first');
      return;
    }
    const selectedIds = Array.from(selectedBundleItems[bundleId] ?? []);
    if (selectedIds.length === 0) {
      alert('Please select at least one bundle item');
      return;
    }
    setBundleAddingId(bundleId);
    try {
      await addBundleToCart(bundleId, selectedUnit, selectedIds);
      setBundleSuccessMessage('Bundle added to cart successfully!');
      setTimeout(() => setBundleSuccessMessage(null), 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add bundle to cart';
      alert(`Failed to add bundle to cart: ${errorMessage}`);
    } finally {
      setBundleAddingId(null);
    }
  };

  const handleAddAccessoryVariantToCart = async (
    accessory: NonNullable<typeof accessories>[0],
    variant: NonNullable<NonNullable<typeof accessories>[0]['accessory_color_variants']>[0]
  ) => {
    if (!variant.units || variant.units.length === 0) {
      alert('No units available for this color variant');
      return;
    }
    
    // Use the first available unit (or could let user select)
    const unit = variant.units[0];
    if (!unit) {
      alert('No unit available');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      await addToCart(
        unit.unit_id,
        accessory.required_quantity,
        undefined, // No promotion for accessories (or could add later)
        unit.price
      );
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error: any) {
      console.error('Add accessory to cart error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add to cart';
      alert(`Failed to add to cart: ${errorMessage}`);
    } finally {
      setIsAddingToCart(false);
    }
  };


  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.product_name,
          text: `Check out ${product?.product_name} on Affordable Gadgets`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const selectedUnitData = units?.find(u => u.id === selectedUnit);
  const processorDetails = (selectedUnitData as { processor_details?: string } | undefined)?.processor_details;

  // Get main display image - show selected unit's image if available, otherwise product image
  const mainDisplayImage = useMemo(() => {
    if (selectedUnitData?.images && selectedUnitData.images.length > 0) {
      const primaryImg = selectedUnitData.images.find((img: InventoryUnitImage) => img.is_primary);
      return primaryImg?.image_url || selectedUnitData.images[0]?.image_url || productImages[selectedImageIndex] || product?.primary_image || (product ? getPlaceholderProductImage(product.product_name) : '');
    }
    return productImages[selectedImageIndex] || product?.primary_image || (product ? getPlaceholderProductImage(product.product_name) : '');
  }, [selectedUnitData, productImages, selectedImageIndex, product?.primary_image, product]);

  // Calculate promotion prices
  const calculatePromotionPrice = useMemo(() => {
    return (originalPrice: number): number => {
      if (!promotion) return originalPrice;
      
      if (promotion.discount_percentage) {
        const discount = (originalPrice * Number(promotion.discount_percentage)) / 100;
        return originalPrice - discount;
      } else if (promotion.discount_amount) {
        return Math.max(0, originalPrice - Number(promotion.discount_amount));
      }
      
      return originalPrice;
    };
  }, [promotion]);

  const getBundleDisplayPrice = (
    bundle: Pick<
      PublicBundle,
      | 'pricing_mode'
      | 'bundle_price'
      | 'discount_percentage'
      | 'discount_amount'
      | 'items_min_total'
      | 'items_max_total'
    >
  ) => {
    const bundlePrice = bundle.bundle_price === null || bundle.bundle_price === undefined
      ? null
      : Number(bundle.bundle_price);
    if (bundle.pricing_mode === PricingModeEnum.FX && bundlePrice !== null) {
      return formatPrice(bundlePrice);
    }
    const minTotal = bundle.items_min_total ?? null;
    const maxTotal = bundle.items_max_total ?? null;
    if (minTotal === null || maxTotal === null) {
      return 'Price on request';
    }
    let minPrice = minTotal;
    let maxPrice = maxTotal;
    if (bundle.pricing_mode === PricingModeEnum.PC && bundle.discount_percentage) {
      const factor = 1 - Number(bundle.discount_percentage) / 100;
      minPrice = Math.max(0, minTotal * factor);
      maxPrice = Math.max(0, maxTotal * factor);
    } else if (bundle.pricing_mode === PricingModeEnum.AM && bundle.discount_amount) {
      minPrice = Math.max(0, minTotal - Number(bundle.discount_amount));
      maxPrice = Math.max(0, maxTotal - Number(bundle.discount_amount));
    }
    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
  };

  // Check if product is eligible for promotion
  const isEligibleForPromotion = useMemo(() => {
    if (!promotion || !product) return false;
    
    // Check if promotion is currently active
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);
    
    if (!promotion.is_currently_active || now < startDate || now > endDate) {
      return false;
    }
    
    // Check if product is in promotion's products list
    if (promotion.products && promotion.products.length > 0) {
      if (product.id === undefined) {
        return false;
      }
      return promotion.products.includes(product.id);
    }
    
    // Check if product type matches
    if (promotion.product_types && product.product_type === promotion.product_types) {
      return true;
    }
    
    return false;
  }, [promotion, product]);

  // Calculate min/max prices with promotion
  const promotionMinPrice = useMemo(() => {
    if (!isEligibleForPromotion || !product?.min_price) return null;
    return calculatePromotionPrice(product.min_price);
  }, [isEligibleForPromotion, product?.min_price, calculatePromotionPrice]);

  const promotionMaxPrice = useMemo(() => {
    if (!isEligibleForPromotion || !product?.max_price) return null;
    return calculatePromotionPrice(product.max_price);
  }, [isEligibleForPromotion, product?.max_price, calculatePromotionPrice]);

  const promotionUnitPrice = useMemo(() => {
    if (!isEligibleForPromotion || !selectedUnitData) return null;
    return calculatePromotionPrice(Number(selectedUnitData.selling_price));
  }, [isEligibleForPromotion, selectedUnitData, calculatePromotionPrice]);

  if (productLoading) {
    return (
      <div className="product-detail__loading">
        <div className="product-detail__spinner"></div>
        <p className="product-detail__loading-text">Loading product details...</p>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="product-detail__error">
        <h2 className="product-detail__error-title">Product Not Found</h2>
        <p className="product-detail__error-copy">
          {productError instanceof Error ? productError.message : 'The product you\'re looking for doesn\'t exist or has been removed.'}
        </p>
        <Link href="/products" className="product-detail__error-link">
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <div className="product-detail">
      {/* Breadcrumb */}
      <nav className="product-detail__breadcrumb">
        <ol className="product-detail__breadcrumb-list">
          <li><Link href="/" className="product-detail__breadcrumb-link">Home</Link></li>
          <li className="product-detail__breadcrumb-separator">/</li>
          <li><Link href="/products" className="product-detail__breadcrumb-link">Products</Link></li>
          <li className="product-detail__breadcrumb-separator">/</li>
          <li className="product-detail__breadcrumb-current">{product.product_name}</li>
        </ol>
      </nav>

      <div className="product-detail__layout">
        {/* Left Column - Images */}
        <div className="product-detail__gallery">
          {/* Main Image */}
          <div className="product-detail__gallery-main">
            <Image
              src={mainDisplayImage || getPlaceholderProductImage(product.product_name)}
              alt={product.product_name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="product-detail__gallery-image"
              priority
              unoptimized={!mainDisplayImage || mainDisplayImage.includes('localhost') || mainDisplayImage.includes('placehold.co')}
            />
          </div>

          {/* Thumbnail Gallery */}
          {productImages.length > 1 && (
            <div className="product-detail__thumbnails">
              {productImages.map((img, index) => {
                // Try to find a unit with this image to get color info
                const unitWithImage = units?.find((u: PublicInventoryUnitPublic) => 
                  u.images?.some((imgObj: InventoryUnitImage) => imgObj.image_url === img)
                );
                const imageColor = unitWithImage?.color_name || null;
                
                return (
                <button
                  key={index}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      // Auto-select color if image is associated with a color
                      if (imageColor) {
                        setSelectedColor(imageColor);
                      }
                    }}
                  className={`product-detail__thumbnail ${
                    selectedImageIndex === index ? 'product-detail__thumbnail--active' : ''
                  }`}
                    title={imageColor ? `Color: ${imageColor}` : undefined}
                >
                  <Image
                    src={img}
                    alt={`${product.product_name} view ${index + 1}${imageColor ? ` - ${imageColor}` : ''}`}
                    fill
                    sizes="64px"
                    className="product-detail__thumbnail-image"
                    unoptimized={img.includes('localhost') || img.includes('placehold.co')}
                  />
                    {imageColor && (
                      <div className="product-detail__thumbnail-label">
                        {imageColor}
                      </div>
                    )}
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="product-detail__info">
          {/* Title & Brand */}
          <div>
            <h1 className="product-detail__title">
              {product.product_name}
              {selectedUnitData && selectedUnitData.storage_gb && (
                <span className="product-detail__title-storage"> - {selectedUnitData.storage_gb}GB -</span>
              )}
            </h1>
            <p className="product-detail__brand">
              <span className="product-detail__brand-name">{product.brand}</span> {product.model_series && <span className="product-detail__brand-series">• {product.model_series}</span>}
            </p>
            <button
              type="button"
              onClick={jumpToReviews}
              className="product-detail__review-link"
            >
              Leave a review
            </button>
          </div>

          {/* Promotion Banner */}
          {isEligibleForPromotion && promotion && (
            <div className="product-detail__promo">
              <div className="product-detail__promo-row">
                <span className="product-detail__promo-icon">🎉</span>
                <div className="product-detail__promo-body">
                  <h3 className="product-detail__promo-title">{promotion.title}</h3>
                  {promotion.discount_display && (
                    <p className="product-detail__promo-discount">{promotion.discount_display}</p>
                  )}
                  {promotion.description && (
                    <p className="product-detail__promo-copy">{promotion.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price - Single Price Display */}
              <div>
            {selectedUnitData ? (
              <div className="product-detail__price">
                {isEligibleForPromotion && promotionUnitPrice !== null ? (
                  <div>
                    <p className="product-detail__price-current product-detail__price-current--promo">
                      {formatPrice(promotionUnitPrice)}
                    </p>
                    <p className="product-detail__price-old">
                      {formatPrice(Number(selectedUnitData.selling_price))}
                    </p>
                  </div>
                ) : (
                  <p className="product-detail__price-current">
                    {formatPrice(Number(selectedUnitData.selling_price))}
                  </p>
                )}
              </div>
            ) : product.min_price !== null && product.max_price !== null ? (
              <div className="product-detail__price">
                {isEligibleForPromotion && promotionMinPrice !== null && promotionMaxPrice !== null ? (
                  <div>
                    <p className="product-detail__price-current product-detail__price-current--promo">
                      {promotionMinPrice === promotionMaxPrice
                        ? formatPrice(promotionMinPrice)
                        : `${formatPrice(promotionMinPrice)} - ${formatPrice(promotionMaxPrice)}`}
                    </p>
                    <p className="product-detail__price-old">
                  {product.min_price === product.max_price
                    ? formatPrice(product.min_price)
                    : `${formatPrice(product.min_price)} - ${formatPrice(product.max_price)}`}
                </p>
              </div>
                ) : (
                  <p className="product-detail__price-current">
                    {product.min_price === product.max_price
                      ? formatPrice(product.min_price)
                      : `${formatPrice(product.min_price)} - ${formatPrice(product.max_price)}`}
                </p>
              )}
            </div>
            ) : null}
          </div>

          {/* Product Condition Badge */}
          {selectedUnitData && (
            <div className="product-detail__badges">
              <div className="product-detail__badge product-detail__badge--success">
                <svg className="product-detail__badge-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
                <span className="product-detail__badge-text">
                  Verified {selectedUnitData.condition === 'N' ? 'New' : 
                           selectedUnitData.condition === 'R' ? 'Refurbished' : 
                           selectedUnitData.condition === 'P' ? 'Pre-owned' : 
                           selectedUnitData.condition === 'D' ? 'Defective' : 
                           selectedUnitData.condition}
              </span>
              </div>
              <span className="product-detail__badge product-detail__badge--info">
                <svg className="product-detail__badge-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Quality assured product
              </span>
            </div>
          )}

          {/* Variant Selectors - Storage and Color Only */}
          {unitsLoading ? (
            <div className="product-detail__variants-loading">
              <div className="product-detail__spinner product-detail__spinner--small"></div>
              <p className="product-detail__variants-loading-text">Loading variants...</p>
            </div>
          ) : units && units.length > 0 ? (
            <div className="product-detail__variants">
              {/* Label above storage and color options */}
              {(uniqueStorage.length > 0 || uniqueColors.length > 0) && (
                <p className="product-detail__variants-note">Select storage and color to see price and checkout</p>
              )}
              {/* Storage Options */}
              {uniqueStorage.length > 0 && (
                <div className="product-detail__variant-group">
                  <label className="product-detail__variant-label">Storage</label>
                  <div className="product-detail__variant-options">
                    {uniqueStorage.map((storage) => (
                      <button
                        key={storage}
                        onClick={() => {
                          setSelectedStorage(selectedStorage === storage ? null : (storage ?? null));
                          setSelectedUnit(null);
                        }}
                        className={`product-detail__variant-option ${
                          selectedStorage === storage ? 'product-detail__variant-option--active' : ''
                        }`}
                      >
                        {storage}GB
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Options */}
              {uniqueColors.length > 0 && (
                <div className="product-detail__variant-group">
                  <label className="product-detail__variant-label">Color</label>
                  <div className="product-detail__variant-options">
                    {uniqueColors.map((color) => {
                      // Check if this color has units available with current storage filter
                      const availableForColor = units?.filter((u: PublicInventoryUnitPublic) => {
                        if (selectedStorage && u.storage_gb !== selectedStorage) return false;
                        return u.color_name === color;
                      }) || [];
                      const hasAvailableUnits = availableForColor.length > 0;
                      return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(selectedColor === color ? null : (color ?? null));
                          setSelectedUnit(null);
                        }}
                          disabled={!hasAvailableUnits}
                          className={`product-detail__variant-option ${
                          selectedColor === color ? 'product-detail__variant-option--active' : ''
                          } ${!hasAvailableUnits ? 'product-detail__variant-option--disabled' : ''}`}
                      >
                        {color}
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
                  </div>
          ) : null}

          {/* Bundle Items - Display FIRST, before other sections */}
          {bundlesLoading ? (
            <div className="product-detail__bundles-loading">
              <p className="product-detail__bundles-loading-text">Loading bundle items...</p>
            </div>
          ) : activeBundles.length > 0 ? (
            <div className="product-detail__bundles">
              <div className="product-detail__bundles-header">
                <p className="product-detail__bundles-title">Bundle Items</p>
                {bundleSuccessMessage && (
                  <span className="product-detail__bundles-status">{bundleSuccessMessage}</span>
                )}
              </div>
              {activeBundles.map((bundle) => {
                const selectedItems = selectedBundleItems[bundle.id] ?? new Set<number>();
                const bundleItems = bundle.items.filter(
                  (item): item is BundleItemWithId => typeof item.id === 'number'
                );
                if (bundleItems.length === 0) return null;
                return (
                  <div key={bundle.id} className="product-detail__bundle-card">
                    <div className="product-detail__bundle-header">
                      <div className="product-detail__bundle-info">
                        <p className="product-detail__bundle-title">{bundle.title}</p>
                        <p className="product-detail__bundle-copy">
                          Buy {product?.product_name} and get these items together.
                        </p>
                      </div>
                      <div className="product-detail__bundle-price">
                        {getBundleDisplayPrice(bundle)}
                      </div>
                    </div>
                    <div className="product-detail__bundle-items">
                      {bundleItems.map((item) => {
                        const itemName = item.product_name ?? 'Bundle item';
                        const itemHref = item.product_slug
                          ? `/products/${item.product_slug}`
                          : item.product_id
                            ? `/products/${item.product_id}`
                            : null;
                        const itemPrice = item.override_price !== null && item.override_price !== undefined
                          ? Number(item.override_price)
                          : (item.min_price !== null && item.min_price !== undefined ? item.min_price : null);
                        const itemContent = (
                          <>
                            <div className="product-detail__bundle-item-media">
                              <Image
                                src={item.primary_image || getPlaceholderProductImage(itemName)}
                                alt={itemName}
                                fill
                                className="product-detail__bundle-item-image"
                                sizes="64px"
                                unoptimized={!item.primary_image || item.primary_image.includes('placehold.co')}
                              />
                            </div>
                            <div className="product-detail__bundle-item-info">
                              <p className="product-detail__bundle-item-name">
                                {itemName}
                              </p>
                              <p className="product-detail__bundle-item-meta">
                                Bundle item
                              </p>
                              {typeof item.quantity === 'number' && item.quantity > 0 && (
                                <p className="product-detail__bundle-item-qty">
                                  Qty: {item.quantity}
                                </p>
                              )}
                              {itemPrice !== null && (
                                <p className="product-detail__bundle-item-price">
                                  {formatPrice(itemPrice)}
                                </p>
                              )}
                            </div>
                          </>
                        );
                        return (
                          <div
                            key={item.id}
                            className="product-detail__bundle-item-card"
                          >
                            {itemHref ? (
                              <Link href={itemHref} className="product-detail__bundle-item-link">
                                {itemContent}
                              </Link>
                            ) : (
                              <div className="product-detail__bundle-item-link">{itemContent}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handleAddBundleToCart(bundle.id)}
                      disabled={!selectedUnit || bundleAddingId === bundle.id}
                      className="product-detail__bundle-cta"
                    >
                      {bundleAddingId === bundle.id ? 'Adding bundle...' : 'Add bundle (all items)'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Comes With Section */}
          <div className="product-detail__includes">
            <p className="product-detail__includes-title">Comes with</p>
            <div className="product-detail__includes-list">
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>6 months warranty</span>
              </div>
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Affordable shipping</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button - Prominent */}
          {Number(product.available_units_count ?? 0) > 0 && (
            <div className="product-detail__cta">
              {showSuccessMessage && (
                <div className="product-detail__cta-alert">
                  <svg className="product-detail__cta-alert-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="product-detail__cta-alert-text">Added to cart successfully!</span>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                disabled={!selectedUnit || isAddingToCart}
                className={`product-detail__cta-button ${
                  !selectedUnit || isAddingToCart ? 'product-detail__cta-button--disabled' : ''
                }`}
              >
                {isAddingToCart ? (
                  <span className="product-detail__cta-loading">
                    <svg className="product-detail__cta-spinner" fill="none" viewBox="0 0 24 24">
                      <circle className="product-detail__cta-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="product-detail__cta-spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : selectedUnit ? (
                  'Add to cart'
                ) : (
                  'Select a Variant First'
                )}
              </button>
            </div>
          )}

          {/* View All Available Units - Collapsible */}
          {filteredUnits.length > 0 && (
            <div className="product-detail__units">
              <details className="product-detail__units-details">
                <summary className="product-detail__units-toggle">
                  <span>View All Available Units ({filteredUnits.length})</span>
                  <svg className="product-detail__units-toggle-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="product-detail__units-list">
                  {filteredUnits.map((unit) => {
                    const unitPromotionPrice = isEligibleForPromotion && promotion && unit.selling_price
                      ? calculatePromotionPrice(Number(unit.selling_price))
                      : null;
                    
                    return <UnitCard
                      key={unit.id}
                      unit={unit}
                      isSelected={selectedUnit === unit.id}
                      onSelect={setSelectedUnit}
                      promotionPrice={unitPromotionPrice}
                      onColorSelect={setSelectedColor}
                    />;
                  })}
        </div>
              </details>
            </div>
          )}

          {filteredUnits.length === 0 && units && units.length > 0 && (
            <div className="product-detail__units-empty">
              <p className="product-detail__units-empty-text">
                No units match the selected criteria. Please adjust your selection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Accessories */}
      {accessories && accessories.length > 0 && (
        <div className="product-detail__accessories">
          <div className="product-detail__accessories-header">
            <h2 className="product-detail__accessories-title">Recommended Accessories</h2>
            <span className="product-detail__accessories-count">{accessories.length} items</span>
          </div>
          <div className="product-detail__accessories-list">
            {accessories.map((accessory, index) => {
              const accessoryKey = accessory.id ?? index;
              const variants = accessory.accessory_color_variants ?? [];
              const selectedVariantIndex = selectedAccessoryVariants[accessoryKey] ?? 0;
              const selectedVariant = variants[selectedVariantIndex] ?? variants[0];
              const canAdd = Boolean(selectedVariant?.units && selectedVariant.units.length > 0);
              return (
                <div
                  key={accessoryKey}
                  className="product-detail__accessory-card"
                >
                  <Link
                    href={`/products/${accessory.accessory_slug}`}
                    className="product-detail__accessory-link"
                  >
                    <div className="product-detail__accessory-media">
                      <Image
                        src={accessory.accessory_primary_image || getPlaceholderProductImage(accessory.accessory_name)}
                        alt={accessory.accessory_name ?? 'Accessory'}
                        fill
                        className="product-detail__accessory-image"
                        sizes="56px"
                        unoptimized={process.env.NODE_ENV === 'development'}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('placehold.co')) {
                            target.src = getPlaceholderProductImage(accessory.accessory_name);
                          }
                        }}
                      />
                    </div>
                    <div className="product-detail__accessory-info">
                      <p className="product-detail__accessory-name">
                        {accessory.accessory_name}
                      </p>
                      <p className="product-detail__accessory-meta">
                        For {accessory.main_product_name}
                      </p>
                      {accessory.accessory_price_range &&
                        accessory.accessory_price_range.min !== null &&
                        accessory.accessory_price_range.max !== null && (
                          <p className="product-detail__accessory-price">
                            {accessory.accessory_price_range.min === accessory.accessory_price_range.max
                              ? formatPrice(accessory.accessory_price_range.min)
                              : `${formatPrice(accessory.accessory_price_range.min)} - ${formatPrice(accessory.accessory_price_range.max)}`
                            }
                          </p>
                        )}
                    </div>
                  </Link>
                  {variants.length > 1 && (
                    <select
                      className="product-detail__accessory-select"
                      value={selectedVariantIndex}
                      onChange={(e) => {
                        const nextIndex = Number(e.target.value);
                        setSelectedAccessoryVariants((prev) => ({
                          ...prev,
                          [accessoryKey]: Number.isFinite(nextIndex) ? nextIndex : 0,
                        }));
                      }}
                    >
                      {variants.map((variant, vIndex) => (
                        <option key={`${variant.color_id ?? 'variant'}-${vIndex}`} value={vIndex}>
                          {variant.color_name || `Variant ${vIndex + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className={`product-detail__accessory-action ${
                      canAdd ? '' : 'product-detail__accessory-action--disabled'
                    }`}
                    onClick={() => {
                      if (selectedVariant && canAdd) {
                        handleAddAccessoryVariantToCart(accessory, selectedVariant);
                      }
                    }}
                    disabled={!canAdd}
                  >
                    Add to cart
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="product-detail__tabs" id="product-reviews">
        {/* Tab Navigation */}
        <div className="product-detail__tabs-nav">
          <nav className="product-detail__tabs-list">
            {[
              { id: 'overview' as TabType, label: 'Overview' },
              { id: 'specs' as TabType, label: 'Specifications' },
              { id: 'reviews' as TabType, label: 'Reviews' },
              { id: 'videos' as TabType, label: 'Videos' },
              { id: 'compare' as TabType, label: 'Compare' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`product-detail__tab ${
                  activeTab === tab.id ? 'product-detail__tab--active' : ''
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="product-detail__tab-content">
          {activeTab === 'overview' && (
            <div className="product-detail__section">
              {/* Product Highlights */}
              {product.product_highlights && Array.isArray(product.product_highlights) && product.product_highlights.length > 0 && (
                <div className="product-detail__section-block">
                  <h3 className="product-detail__section-title">Key Features</h3>
                  <ul className="product-detail__features">
                    {product.product_highlights.map((highlight: string, idx: number) => (
                      <li key={idx} className="product-detail__feature">
                        <svg className="product-detail__feature-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="product-detail__feature-text">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                <div className="product-detail__section-block">
                  <h3 className="product-detail__section-title">Tags</h3>
                  <div className="product-detail__tags">
                    {product.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="product-detail__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Description */}
              {product.product_description && (
                <div className="product-detail__section-block">
                  <h3 className="product-detail__section-title">Description</h3>
                  <p className="product-detail__description-text">{product.product_description}</p>
                </div>
              )}

              {/* Long Description */}
              {product.long_description && (
                <div className="product-detail__section-block">
                  <h3 className="product-detail__section-title">Detailed Description</h3>
                  <p className="product-detail__description-text">{product.long_description}</p>
                </div>
              )}
              
              {selectedUnitData && (
                <div className="product-detail__section-block">
                  <h3 className="product-detail__section-title">Selected Variant Details</h3>
                  <div className="product-detail__variant-details">
                    {selectedUnitData.storage_gb && (
                      <div className="product-detail__variant-card">
                        <p className="product-detail__variant-label">Storage</p>
                        <p className="product-detail__variant-value">{selectedUnitData.storage_gb}GB</p>
                      </div>
                    )}
                    {selectedUnitData.ram_gb && (
                      <div className="product-detail__variant-card">
                        <p className="product-detail__variant-label">RAM</p>
                        <p className="product-detail__variant-value">{selectedUnitData.ram_gb}GB</p>
                      </div>
                    )}
                    {selectedUnitData.battery_mah && (
                      <div className="product-detail__variant-card">
                        <p className="product-detail__variant-label">Battery</p>
                        <p className="product-detail__variant-value">{selectedUnitData.battery_mah}mAh</p>
                      </div>
                    )}
                    {selectedUnitData.color_name && (
                      <div className="product-detail__variant-card">
                        <p className="product-detail__variant-label">Color</p>
                        <p className="product-detail__variant-value">{selectedUnitData.color_name}</p>
                      </div>
                    )}
                    <div className="product-detail__variant-card">
                      <p className="product-detail__variant-label">Condition</p>
                      <p className="product-detail__variant-value">{selectedUnitData.condition}</p>
                    </div>
                    {typeof selectedUnitData.grade === 'string' && selectedUnitData.grade && (
                      <div className="product-detail__variant-card">
                        <p className="product-detail__variant-label">Grade</p>
                        <p className="product-detail__variant-value">{selectedUnitData.grade}</p>
                      </div>
                    )}
                    <div className="product-detail__variant-card">
                      <p className="product-detail__variant-label">Price</p>
                      <p className="product-detail__variant-value">{formatPrice(Number(selectedUnitData.selling_price))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="product-detail__specs">
              <h3 className="product-detail__specs-title">Specifications</h3>
              {selectedUnitData ? (
                <div className="product-detail__specs-card">
                  <table className="product-detail__specs-table">
                    <tbody className="product-detail__specs-body">
                      {selectedUnitData.storage_gb && (
                        <tr className="product-detail__specs-row product-detail__specs-row--alt">
                          <td className="product-detail__specs-label">Storage</td>
                          <td className="product-detail__specs-value">{selectedUnitData.storage_gb}GB</td>
                        </tr>
                      )}
                      {selectedUnitData.ram_gb && (
                        <tr className="product-detail__specs-row">
                          <td className="product-detail__specs-label">RAM</td>
                          <td className="product-detail__specs-value">{selectedUnitData.ram_gb}GB</td>
                        </tr>
                      )}
                      {selectedUnitData.battery_mah && (
                        <tr className="product-detail__specs-row product-detail__specs-row--alt">
                          <td className="product-detail__specs-label">Battery Capacity</td>
                          <td className="product-detail__specs-value">{selectedUnitData.battery_mah}mAh</td>
                        </tr>
                      )}
                      {processorDetails && (
                        <tr className="product-detail__specs-row">
                          <td className="product-detail__specs-label">Processor</td>
                          <td className="product-detail__specs-value">{processorDetails}</td>
                        </tr>
                      )}
                      {selectedUnitData.color_name && (
                        <tr className={`product-detail__specs-row ${processorDetails ? 'product-detail__specs-row--alt' : ''}`}>
                          <td className="product-detail__specs-label">Color</td>
                          <td className="product-detail__specs-value">{selectedUnitData.color_name}</td>
                        </tr>
                      )}
                      <tr className="product-detail__specs-row">
                        <td className="product-detail__specs-label">Condition</td>
                        <td className="product-detail__specs-value">
                          {selectedUnitData.condition === 'N' ? 'New' : 
                           selectedUnitData.condition === 'R' ? 'Refurbished' : 
                           selectedUnitData.condition === 'P' ? 'Pre-owned' : 
                           selectedUnitData.condition}
                        </td>
                      </tr>
                      {typeof selectedUnitData.grade === 'string' && selectedUnitData.grade && (
                        <tr className="product-detail__specs-row product-detail__specs-row--alt">
                          <td className="product-detail__specs-label">Grade</td>
                          <td className="product-detail__specs-value">Grade {selectedUnitData.grade}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="product-detail__specs-empty">
                  <p className="product-detail__specs-empty-text">Please select a variant to view specifications</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && typeof productId === 'number' && (
            <div className="product-detail__reviews">
              <Suspense fallback={<div className="product-detail__loading-inline">Loading reviews...</div>}>
                <LazyReviewsShowcase productId={productId} />
              </Suspense>
            </div>
          )}

          {activeTab === 'videos' && product && (
            <div className="product-detail__videos">
              <h3 className="product-detail__videos-title">Product Videos</h3>
              <div className="product-detail__video-card">
                <div className="product-detail__video-frame">
                    <iframe
                      src={convertToYouTubeEmbed(product.product_video_url || getPlaceholderVideoUrl(product.product_name))}
                    className="product-detail__video-embed"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <div className="product-detail__video-body">
                    <p className="product-detail__video-title">
                      {product.product_name}
                    </p>
                    {product.brand && (
                      <p className="product-detail__video-brand">{product.brand}</p>
                    )}
                    {!product.product_video_url && (
                      <p className="product-detail__video-note">
                        This is a placeholder video. The actual product video will be available soon.
                      </p>
                    )}
                  </div>
                </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <Suspense fallback={<div className="product-detail__loading-inline">Loading comparison...</div>}>
              <LazyComparisonPage />
            </Suspense>
          )}
        </div>
      </div>

      {/* Product Recommendations */}
      {typeof productId === 'number' && (
        <div className="product-detail__recommendations">
          <Suspense fallback={<div className="product-detail__loading-inline">Loading recommendations...</div>}>
            <LazyProductRecommendations productId={productId} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
