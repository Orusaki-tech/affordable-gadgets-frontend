'use client';

import { useProduct, useProductBySlug, useProductUnits } from '@/lib/hooks/useProducts';
import { usePromotion } from '@/lib/hooks/usePromotions';
import { useBundles } from '@/lib/hooks/useBundles';
import { useCart } from '@/lib/hooks/useCart';
import { useProductAccessories } from '@/lib/hooks/useAccessories';
import {
  OpenAPI,
  type PublicBundle,
  type PublicBundleItem,
  type PublicProduct,
  type PublicInventoryUnitPublic,
  type InventoryUnitImage,
  type ConditionEnum,
} from '@/lib/api/generated';
import Image from 'next/image';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { formatPrice } from '@/lib/utils/format';
import { useState, useEffect, useMemo, useRef } from 'react';
import { trackProductView, trackWhatsAppClick } from '@/lib/tracking';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPlaceholderProductImage, getPlaceholderUnitImage, getPlaceholderVideoUrl, convertToYouTubeEmbed } from '@/lib/utils/placeholders';
import { getAndClearProductDetailPlaceholder } from '@/lib/utils/productDetailPlaceholder';
import { PRICING_MODE } from '@/lib/constants/apiEnums';
import { PromotionVideosDrawer } from '@/components/PromotionVideosDrawer';
import { ProductTrustStamp } from '@/components/ProductTrustStamp';
import type { PromotionVideoProduct } from '@/components/ProductVideoReel';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { WhatsAppLeadModal } from '@/components/WhatsAppLeadModal';

interface ProductDetailProps {
  slug: string;
}

type TabType = 'overview' | 'specs' | 'reviews' | 'videos' | 'compare' | 'blog';

/** Matches admin unit condition codes (inventory condition dropdown). */
const CONDITION_CHIP_DEFINITIONS: { code: string; label: string }[] = [
  { code: 'N', label: 'New' },
  { code: 'R', label: 'Refurbished' },
  { code: 'P', label: 'Pre-owned' },
  { code: 'D', label: 'Defective' },
];

function humanizeUnitCondition(code: string | undefined): string {
  if (!code) return '';
  if (code === 'N') return 'New';
  if (code === 'R') return 'Refurbished';
  if (code === 'P') return 'Pre-owned';
  if (code === 'D') return 'Defective';
  return code;
}

/** Pre-filled WhatsApp text when a specific inventory unit is selected. */
function buildWhatsAppUnitInquiryMessage(
  product: PublicProduct,
  unit: PublicInventoryUnitPublic,
  effectivePrice?: number | null
): string {
  const lines: string[] = [];
  lines.push("Hi, I'm interested in this unit:");
  lines.push('');
  lines.push(`Product: ${product.product_name?.trim() || 'Product'}`);
  if (product.brand?.trim()) lines.push(`Brand: ${product.brand.trim()}`);
  if (product.model_series?.trim()) lines.push(`Model: ${product.model_series.trim()}`);
  if (typeof unit.id === 'number') lines.push(`Unit ID: ${unit.id}`);

  const variantBits: string[] = [];
  if (typeof unit.storage_gb === 'number') variantBits.push(`${unit.storage_gb}GB storage`);
  if (typeof unit.ram_gb === 'number') variantBits.push(`${unit.ram_gb}GB RAM`);
  if (unit.color_name?.trim()) variantBits.push(unit.color_name.trim());
  const cond = humanizeUnitCondition(unit.condition as string | undefined);
  if (cond) variantBits.push(cond);
  if (unit.grade && typeof unit.grade === 'string' && unit.grade.trim()) {
    variantBits.push(`Grade ${unit.grade.trim()}`);
  }
  if (variantBits.length) lines.push(`Variant: ${variantBits.join(' · ')}`);

  const price =
    effectivePrice != null && !Number.isNaN(Number(effectivePrice))
      ? Number(effectivePrice)
      : Number(unit.selling_price);
  lines.push(`Listed price: ${formatPrice(price)}`);

  if (typeof unit.battery_mah === 'number') lines.push(`Battery: ${unit.battery_mah}mAh`);

  return lines.join('\n');
}

function buildWhatsAppProductOnlyMessage(product: PublicProduct): string {
  const lines: string[] = [
    `Hi, I'm interested in: ${product.product_name?.trim() || 'a product'}`,
  ];
  if (product.brand?.trim()) lines.push(`Brand: ${product.brand.trim()}`);
  if (product.model_series?.trim()) lines.push(`Model: ${product.model_series.trim()}`);
  return lines.join('\n');
}

function firstTruthyImageUrl(...urls: (string | null | undefined)[]): string {
  for (const raw of urls) {
    const s = typeof raw === 'string' ? raw.trim() : '';
    if (s.length > 0) return s;
  }
  return '';
}

/** Prefer primary, then first entry with a non-empty URL (primary row is sometimes blank in API data). */
function firstValidUnitImageUrl(images: InventoryUnitImage[] | null | undefined): string {
  if (!images?.length) return '';
  const primary = images.find((img) => img.is_primary);
  const ordered = primary ? [primary, ...images.filter((img) => img !== primary)] : [...images];
  return firstTruthyImageUrl(...ordered.map((img) => img.image_url));
}

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
  const conditionLabel =
    unit.condition === 'N'
      ? 'New'
      : unit.condition === 'R'
        ? 'Refurbished'
        : unit.condition === 'P'
          ? 'Pre-owned'
          : unit.condition;
  const unitTitle = [
    typeof unit.storage_gb === 'number' ? `${unit.storage_gb}GB` : null,
    unit.color_name || null,
  ]
    .filter(Boolean)
    .join(' • ') || `Unit ${unit.id ?? ''}`;
  const unitSubtitle = [
    conditionLabel,
    typeof unit.grade === 'string' && unit.grade ? `Grade ${unit.grade}` : null,
    typeof unit.ram_gb === 'number' ? `${unit.ram_gb}GB RAM` : null,
  ]
    .filter(Boolean)
    .join(' • ');
  
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
      <div className="product-detail__unit-card-top">
        <div className="product-detail__unit-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.75a1.25 1.25 0 0 1 1.25 1.25v1.2a7 7 0 0 1 5.55 5.55H20a1.25 1.25 0 1 1 0 2.5h-1.2a7 7 0 0 1-5.55 5.55V20a1.25 1.25 0 1 1-2.5 0v-1.2a7 7 0 0 1-5.55-5.55H4a1.25 1.25 0 1 1 0-2.5h1.2a7 7 0 0 1 5.55-5.55V4A1.25 1.25 0 0 1 12 2.75m0 5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9" />
          </svg>
        </div>
        <div className="product-detail__unit-copy">
          <p className="product-detail__unit-title">{unitTitle}</p>
          {unitSubtitle && <p className="product-detail__unit-subtitle">{unitSubtitle}</p>}
        </div>
      </div>
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
      {unitImages.length > 0 && (
        <div className="product-detail__unit-thumb-row">
          {unitImages.slice(0, 4).map((img, index) => (
            <button
              key={`${img.id ?? index}-${img.image_url}`}
              type="button"
              className="product-detail__unit-thumb-btn"
              onClick={(event) => {
                event.stopPropagation();
                handleImageClick(index, img);
              }}
              title={img.color_name || 'Unit image'}
            >
              <CloudinaryImage
                src={img.image_url || imageUrl || ''}
                alt={`${unitTitle} image ${index + 1}`}
                preset="productThumb"
                width={28}
                height={28}
                className="product-detail__unit-thumb-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ slug }: ProductDetailProps) {
  const searchParams = useSearchParams();
  const promotionId = searchParams.get('promotion');

  const [placeholderFromList] = useState<PublicProduct | undefined>(() =>
    typeof window !== 'undefined' ? getAndClearProductDetailPlaceholder(slug) : undefined
  );

  const isNumericSlug = /^\d+$/.test(slug);
  const productIdFromSlug = isNumericSlug ? Number(slug) : 0;
  const { data: productBySlug, isLoading: productBySlugLoading, error: productBySlugError, isPlaceholderData: isProductBySlugPlaceholder } = useProductBySlug(
    isNumericSlug ? '' : slug,
    { placeholderFromList }
  );
  const { data: productById, isLoading: productByIdLoading, error: productByIdError, isPlaceholderData: isProductByIdPlaceholder } = useProduct(productIdFromSlug, {
    placeholderFromList,
  });
  const product = isNumericSlug ? productById : productBySlug;
  const productLoading = isNumericSlug ? productByIdLoading : productBySlugLoading;
  const productError = product ? undefined : (isNumericSlug ? productByIdError : productBySlugError);
  const isProductPlaceholder = isNumericSlug ? isProductByIdPlaceholder : isProductBySlugPlaceholder;
  const { data: units, isLoading: unitsLoading } = useProductUnits(product?.id || 0);
  const { data: accessories } = useProductAccessories(product?.id || 0);
  const { data: promotion } = usePromotion(promotionId ? parseInt(promotionId) : 0);
  const { data: bundlesData, isLoading: bundlesLoading } = useBundles({ productId: product?.id });
  const { addToCart, addBundleToCart } = useCart();
  const router = useRouter();

  const [isPromoVideosOpen, setIsPromoVideosOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const productId = product?.id;
  const productBlogHref = useMemo(() => {
    if (!product?.slug || !product.has_published_article) return null;
    return `/products/${product.slug}/blog`;
  }, [product?.slug, product?.has_published_article]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [mainImageLoadFailed, setMainImageLoadFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [bundleAddingId, setBundleAddingId] = useState<number | null>(null);
  const [selectedBundleItems, setSelectedBundleItems] = useState<Record<number, Set<number>>>({});
  const [bundleSuccessMessage, setBundleSuccessMessage] = useState<string | null>(null);
  const [selectedAccessoryVariants, setSelectedAccessoryVariants] = useState<Record<number, number>>({});
  const unitsCarouselRef = useRef<HTMLDivElement | null>(null);
  const [canScrollUnitsLeft, setCanScrollUnitsLeft] = useState(false);
  const [canScrollUnitsRight, setCanScrollUnitsRight] = useState(false);

  const jumpToTab = (tab: TabType) => {
    setActiveTab(tab);
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
      trackProductView(product.id);
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

  /** Units matching current variant filters except condition — used only to decide which condition chips exist. */
  const unitsMatchingExceptCondition = useMemo(() => {
    if (!units) return [];
    return units.filter((unit) => {
      if (selectedStorage !== null && unit.storage_gb !== selectedStorage) return false;
      if (selectedRAM !== null && unit.ram_gb !== selectedRAM) return false;
      if (selectedColor !== null && unit.color_name !== selectedColor) return false;
      if (selectedGrade !== null && unit.grade !== selectedGrade) return false;
      if (selectedBattery !== null && unit.battery_mah !== selectedBattery) return false;
      return true;
    });
  }, [units, selectedStorage, selectedRAM, selectedColor, selectedGrade, selectedBattery]);

  /** Only show condition chips for codes that appear on units still available under the current non-condition filters. */
  const conditionFilterChips = useMemo(() => {
    if (!unitsMatchingExceptCondition.length) return [] as { code: string; label: string }[];
    const present = new Set<string>(
      unitsMatchingExceptCondition
        .map((u) => u.condition)
        .filter((c): c is ConditionEnum => c !== undefined)
    );
    return CONDITION_CHIP_DEFINITIONS.filter(({ code }) => present.has(code));
  }, [unitsMatchingExceptCondition]);

  useEffect(() => {
    if (selectedCondition === null) return;
    const stillValid = unitsMatchingExceptCondition.some((u) => u.condition === selectedCondition);
    if (!stillValid) {
      setSelectedCondition(null);
      setSelectedUnit(null);
    }
  }, [unitsMatchingExceptCondition, selectedCondition]);

  const updateUnitsCarouselButtons = () => {
    const container = unitsCarouselRef.current;
    if (!container) return;
    setCanScrollUnitsLeft(container.scrollLeft > 4);
    setCanScrollUnitsRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 4
    );
  };

  useEffect(() => {
    const container = unitsCarouselRef.current;
    if (!container) return;
    updateUnitsCarouselButtons();
    container.addEventListener('scroll', updateUnitsCarouselButtons, { passive: true });
    return () => container.removeEventListener('scroll', updateUnitsCarouselButtons);
  }, [filteredUnits.length]);

  const scrollUnitsCarousel = (direction: 'left' | 'right') => {
    const container = unitsCarouselRef.current;
    if (!container) return;
    const amount = container.clientWidth;
    container.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

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
  /** Stamp always matches the actively selected inventory unit (same as price / add-to-cart). */
  const galleryStampCondition = selectedUnitData?.condition;
  const processorDetails = (selectedUnitData as { processor_details?: string } | undefined)?.processor_details;

  // Get main display image - show selected unit's image if available, otherwise product image
  const mainDisplayImage = useMemo(() => {
    const placeholder = product ? getPlaceholderProductImage(product.product_name) : '';
    if (selectedUnitData?.images && selectedUnitData.images.length > 0) {
      const fromUnit = firstValidUnitImageUrl(selectedUnitData.images);
      return firstTruthyImageUrl(
        fromUnit,
        productImages[selectedImageIndex],
        product?.primary_image,
        placeholder
      );
    }
    return firstTruthyImageUrl(
      productImages[selectedImageIndex],
      product?.primary_image,
      placeholder
    );
  }, [selectedUnitData, productImages, selectedImageIndex, product?.primary_image, product]);

  useEffect(() => {
    setMainImageLoadFailed(false);
  }, [mainDisplayImage]);

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
    if (bundle.pricing_mode === PRICING_MODE.FX && bundlePrice !== null) {
      return formatPrice(bundlePrice);
    }
    const minTotal = bundle.items_min_total ?? null;
    const maxTotal = bundle.items_max_total ?? null;
    if (minTotal === null || maxTotal === null) {
      return 'Price on request';
    }
    let minPrice = minTotal;
    let maxPrice = maxTotal;
    if (bundle.pricing_mode === PRICING_MODE.PC && bundle.discount_percentage) {
      const factor = 1 - Number(bundle.discount_percentage) / 100;
      minPrice = Math.max(0, minTotal * factor);
      maxPrice = Math.max(0, maxTotal * factor);
    } else if (bundle.pricing_mode === PRICING_MODE.AM && bundle.discount_amount) {
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

  const promoDrawerProducts = useMemo<PromotionVideoProduct[]>(() => {
    // Only show videos associated with THIS product (attached to the offer).
    // If this product has no video, render no promo videos.
    if (!isEligibleForPromotion) return [];
    if (!product) return [];
    const id = product.id;
    if (typeof id !== 'number') return [];
    const row: PromotionVideoProduct = {
      id,
      slug: (product as any).slug,
      product_name: product.product_name,
      primary_image: product.primary_image,
      product_video_url: (product as any).product_video_url,
      product_video_file_url: (product as any).product_video_file_url,
    };
    const hasAnyVideo =
      (typeof row.product_video_file_url === 'string' && row.product_video_file_url.trim().length > 0) ||
      (typeof row.product_video_url === 'string' && row.product_video_url.trim().length > 0);
    return hasAnyVideo ? [row] : [];
  }, [isEligibleForPromotion, product]);

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

  const promoBannerDetails = useMemo(() => {
    if (!promotion) return 'Check out our best offers';

    const details: string[] = [];

    if (promotion.discount_display) {
      details.push(promotion.discount_display);
    }

    if (promotion.description && promotion.description.trim()) {
      details.push(promotion.description.trim());
    }

    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);
    const hasValidDates = !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf());
    if (hasValidDates) {
      const formatDate = (value: Date) =>
        value.toLocaleDateString('en-KE', {
          month: 'short',
          day: 'numeric',
        });
      details.push(`Valid ${formatDate(start)} - ${formatDate(end)}`);
    }

    return details.length > 0 ? details.join(' • ') : 'Check out our best offers';
  }, [promotion]);

  const financingOffers = useMemo(() => {
    const offers = (product as any)?.financing_offers;
    return Array.isArray(offers) ? offers : [];
  }, [product]);

  const financingAvailable = Boolean((product as any)?.financing_available) || financingOffers.length > 0;

  if (!product && productLoading) {
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
            <CloudinaryImage
              src={
                (mainImageLoadFailed ? getPlaceholderProductImage(product.product_name) : mainDisplayImage) ||
                getPlaceholderProductImage(product.product_name)
              }
              alt={product.product_name}
              preset="productGallery"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="product-detail__gallery-image"
              priority
              fill
              onError={() => setMainImageLoadFailed(true)}
            />
            <ProductTrustStamp condition={galleryStampCondition} size="detail" />
          </div>

          {/* Thumbnail Gallery - show when we have at least one image (single image still shows as thumbnail) */}
          {productImages.length > 0 && (
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
                  <CloudinaryImage
                    src={img}
                    alt={`${product.product_name} view ${index + 1}${imageColor ? ` - ${imageColor}` : ''}`}
                    preset="productThumb"
                    sizes="64px"
                    className="product-detail__thumbnail-image"
                    fill
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
          <div className="product-detail__info-header-row">
            {/* Title & Brand */}
            <div className="product-detail__info-header">
              <h1 className="product-detail__title">
                {product.product_name}
                {selectedUnitData && selectedUnitData.storage_gb && (
                  <span className="product-detail__title-storage"> - {selectedUnitData.storage_gb}GB -</span>
                )}
              </h1>
              <p className="product-detail__brand">
                <span className="product-detail__brand-name">{product.brand}</span> {product.model_series && <span className="product-detail__brand-series">• {product.model_series}</span>}
              </p>
            </div>

            {/* Promotion Banner */}
            {isEligibleForPromotion && promotion && (
              <div className="product-detail__promo product-detail__promo--aside">
                <div className="product-detail__promo-notch product-detail__promo-notch--left" aria-hidden />
                <div className="product-detail__promo-row">
                  <span className="product-detail__promo-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.4 2.785a1.25 1.25 0 0 1 .883.366l8.693 8.693a1.25 1.25 0 0 1 0 1.767l-6.365 6.365a1.25 1.25 0 0 1-1.767 0L3.15 11.283A1.25 1.25 0 0 1 2.785 10.4V4.035l.007-.128a1.25 1.25 0 0 1 1.243-1.122H10.4m-2.9 3.2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3" />
                    </svg>
                  </span>
                  <div className="product-detail__promo-body">
                    <h3 className="product-detail__promo-title">{promotion.title || 'Deals available'}</h3>
                    <p className="product-detail__promo-copy">
                      {promoBannerDetails}
                    </p>
                  </div>
                  <div className="product-detail__promo-cta-wrap">
                    <button
                      type="button"
                      className="product-detail__promo-cta"
                      onClick={() => {
                        setIsPromoVideosOpen(true);
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
                <div className="product-detail__promo-notch product-detail__promo-notch--right" aria-hidden />
              </div>
            )}
          </div>

          {financingAvailable && (
            <div className="product-detail__promo" style={{ marginTop: 12 }}>
              <div className="product-detail__promo-row">
                <span className="product-detail__promo-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.75 6A3.25 3.25 0 0 1 6 2.75h12A3.25 3.25 0 0 1 21.25 6v12A3.25 3.25 0 0 1 18 21.25H6A3.25 3.25 0 0 1 2.75 18V6Zm3.25-.75A.75.75 0 0 0 5.25 6v.5h13.5V6a.75.75 0 0 0-.75-.75H6Zm12.75 4H5.25V18c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V9.25Zm-10.5 3a1.25 1.25 0 1 0 0 2.5h3.5a1.25 1.25 0 1 0 0-2.5h-3.5Z" />
                  </svg>
                </span>
                <div className="product-detail__promo-body">
                  <h3 className="product-detail__promo-title">Buy Now, Pay Later</h3>
                  <p className="product-detail__promo-copy">
                    Financing available for this product. View offers and request a call back.
                  </p>
                </div>
                <div className="product-detail__promo-cta-wrap">
                  <button
                    type="button"
                    className="product-detail__promo-cta"
                    onClick={() => setIsFinancingOpen(true)}
                  >
                    View offers
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="product-detail__quick-tabs" role="navigation" aria-label="Jump to product sections">
            {(
              [
                { id: 'overview' as TabType, label: 'Overview' },
                { id: 'reviews' as TabType, label: 'Leave a review' },
                { id: 'videos' as TabType, label: 'Videos' },
                { id: 'compare' as TabType, label: 'Compare' },
                { id: 'blog' as TabType, label: 'Blog' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => jumpToTab(id)}
                className={`product-detail__quick-tab ${activeTab === id ? 'product-detail__quick-tab--active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="product-detail__price-cta-row">
            {/* Price - Single Price Display */}
            <div className="product-detail__info-price-block">
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
            {(() => {
              const hasStock = Number(product.available_units_count ?? 0) > 0;
              const hasUnitOptions = (units?.length ?? 0) > 0;
              const showWhatsAppForVariant = hasUnitOptions && Boolean(selectedUnitData);
              const showWhatsAppFallback = !hasUnitOptions && !hasStock;
              const showWhatsApp = showWhatsAppForVariant || showWhatsAppFallback;

              const getWhatsAppPrefilledMessage = (): string => {
                if (showWhatsAppForVariant && selectedUnitData) {
                  const effectivePrice =
                    isEligibleForPromotion && promotionUnitPrice !== null
                      ? promotionUnitPrice
                      : null;
                  return buildWhatsAppUnitInquiryMessage(
                    product,
                    selectedUnitData,
                    effectivePrice ?? undefined
                  );
                }
                return buildWhatsAppProductOnlyMessage(product);
              };

              const openWhatsApp = () => {
                setIsWhatsAppModalOpen(true);
              };

              const whatsAppButton = showWhatsApp ? (
                <button
                  type="button"
                  className="product-detail__cta-button product-detail__cta-button--whatsapp"
                  onClick={openWhatsApp}
                >
                  <svg
                    className="product-detail__cta-whatsapp-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19.05 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.44 1.32 4.94L2 22l5.27-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zM12.04 20.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.13.82.83-3.05-.2-.31a8.22 8.22 0 0 1-1.27-4.37c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.21 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.49-.41-.42-.56-.43h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
                  </svg>
                  Message on WhatsApp
                </button>
              ) : null;

              if (hasStock) {
                return (
                  <div className="product-detail__cta product-detail__cta--inline">
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
                    {whatsAppButton}
                  </div>
                );
              }

              return (
                <div className="product-detail__cta product-detail__cta--inline product-detail__cta--whatsapp-block">
                  <p className="product-detail__stock-note">
                    {hasUnitOptions
                      ? 'Not in stock online. Message us on WhatsApp to check availability for this unit.'
                      : 'Not in stock online. Message us on WhatsApp to check availability.'}
                  </p>
                  {whatsAppButton}
                </div>
              );
            })()}
          </div>
          {showSuccessMessage && (
            <div className="product-detail__cta-alert">
              <svg className="product-detail__cta-alert-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="product-detail__cta-alert-text">Added to cart successfully!</span>
            </div>
          )}

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
                              <CloudinaryImage
                                src={item.primary_image || getPlaceholderProductImage(itemName)}
                                alt={itemName}
                                preset="productThumb"
                                className="product-detail__bundle-item-image"
                                sizes="64px"
                                fill
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

          {/* View All Available Units */}
          {units && units.length > 0 && (
            <div className="product-detail__units">
              <div className="product-detail__units-toggle">
                <span className="product-detail__units-heading">
                  View All Available Units ({filteredUnits.length})
                </span>
                {conditionFilterChips.length > 0 && (
                  <div
                    className="product-detail__units-condition-chips"
                    role="group"
                    aria-label="Filter units by condition"
                  >
                    {conditionFilterChips.map(({ code, label }) => (
                      <button
                        key={code}
                        type="button"
                        aria-pressed={selectedCondition === code}
                        onClick={() => {
                          setSelectedCondition(selectedCondition === code ? null : code);
                          setSelectedUnit(null);
                        }}
                        className={`product-detail__variant-option product-detail__units-condition-chip ${
                          selectedCondition === code ? 'product-detail__variant-option--active' : ''
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="product-detail__units-carousel-nav">
                  <button
                    type="button"
                    className={`product-detail__units-carousel-btn ${
                      canScrollUnitsLeft
                        ? 'product-detail__units-carousel-btn--active'
                        : 'product-detail__units-carousel-btn--inactive'
                    }`}
                    onClick={() => scrollUnitsCarousel('left')}
                    disabled={!canScrollUnitsLeft}
                    aria-label="Previous units"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className={`product-detail__units-carousel-btn ${
                      canScrollUnitsRight
                        ? 'product-detail__units-carousel-btn--active'
                        : 'product-detail__units-carousel-btn--inactive'
                    }`}
                    onClick={() => scrollUnitsCarousel('right')}
                    disabled={!canScrollUnitsRight}
                    aria-label="Next units"
                  >
                    ›
                  </button>
                </div>
              </div>
              {filteredUnits.length > 0 ? (
                <div ref={unitsCarouselRef} className="product-detail__units-list">
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
              ) : (
                <div className="product-detail__units-empty product-detail__units-empty--inline">
                  <p className="product-detail__units-empty-text">
                    No units match the selected criteria. Please adjust your selection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Comes With Section */}
          <div className="product-detail__includes">
            <p className="product-detail__includes-title">Comes with</p>
            <div className="product-detail__includes-list">
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>6-12 months warranty</span>
              </div>
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Affordable shipping</span>
              </div>
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                </svg>
                <span>1–2 days delivery</span>
              </div>
              <div className="product-detail__includes-item">
                <svg className="product-detail__includes-icon product-detail__includes-icon--primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 0c-2.21 0-4 1.343-4 3v1a1 1 0 001 1h6a1 1 0 001-1v-1c0-1.657-1.79-3-4-3z" />
                </svg>
                <span>Secure payments</span>
              </div>
            </div>
            <div className="product-detail__payments">
              <span className="product-detail__payments-label">Pay with</span>
              <div className="product-detail__payments-icons">
                <span className="product-detail__payments-logo product-detail__payments-logo--visa">
                  <Image src="/payment-logos/visa-cropped.png" alt="Visa" width={60} height={18} className="product-detail__payments-logo-image" />
                </span>
                <span className="product-detail__payments-logo product-detail__payments-logo--mpesa">
                  <Image src="/payment-logos/mpesa-cropped.png" alt="M-Pesa" width={120} height={40} className="product-detail__payments-logo-image" />
                </span>
                <span className="product-detail__payments-logo product-detail__payments-logo--paypal">
                  <Image src="/payment-logos/paypal.png" alt="PayPal" width={62} height={18} className="product-detail__payments-logo-image" />
                </span>
              </div>
            </div>
          </div>

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
                      <CloudinaryImage
                        src={accessory.accessory_primary_image || getPlaceholderProductImage(accessory.accessory_name)}
                        alt={accessory.accessory_name ?? 'Accessory'}
                        preset="productThumb"
                        className="product-detail__accessory-image"
                        sizes="56px"
                        fill
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
              { id: 'blog' as TabType, label: 'Blog' },
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
              {isProductPlaceholder && (
                <div className="product-detail__loading-inline" aria-live="polite">
                  Loading full details…
                </div>
              )}
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
              
              {/* Warranty Policy */}
              <div className="product-detail__section-block">
                <h3 className="product-detail__section-title">Warranty Policy</h3>
                <div className="product-detail__warranty">
                  <p className="product-detail__warranty-heading">6-12 Months Warranty</p>
                  <ul className="product-detail__warranty-list">
                    <li>6-12 months warranty on network, charging issues, earpiece, microphone, and speaker.</li>
                    <li>6-12 months warranty on software malfunction that is not related to 3rd party software i.e apps not on Play Store or App Store.</li>
                    <li>No warranty on screen upon testing at the shop or after delivery.</li>
                    <li>3-months warranty on battery.</li>
                    <li>1 month warranty on chargers and accessories.</li>
                  </ul>
                </div>
              </div>

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

          {activeTab === 'blog' && product && (
            <div className="product-detail__section">
              <div className="product-detail__section-block">
                <h3 className="product-detail__section-title">Blog</h3>
                {productBlogHref ? (
                  <>
                    {product.article_headline ? (
                      <h1 className="product-detail__blog-headline">{product.article_headline}</h1>
                    ) : (
                      <p className="product-detail__description-text">
                        Read our full buying guide for {product.product_name?.trim() || 'this product'}.
                      </p>
                    )}
                    <p className="product-detail__description-text" style={{ marginTop: 12 }}>
                      <Link href={productBlogHref} className="product-detail__accessory-action">
                        Open full article
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="product-detail__description-text">
                    A dedicated blog article for {product.product_name?.trim() || 'this product'} will appear here
                    once published from the admin catalog.
                  </p>
                )}
              </div>
            </div>
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

      <PromotionVideosDrawer
        open={isPromoVideosOpen}
        title={promotion?.title || 'Offer'}
        subtitle={promoBannerDetails}
        products={promoDrawerProducts}
        onClose={() => setIsPromoVideosOpen(false)}
      />

      {isFinancingOpen && (
        <FinancingModal
          product={product}
          offers={financingOffers}
          onClose={() => setIsFinancingOpen(false)}
        />
      )}
      {isWhatsAppModalOpen && product && (
        <WhatsAppLeadModal
          productId={product.id}
          productName={product.product_name}
          productBrand={product.brand}
          productModel={product.model_series}
          unitLabel={selectedUnitData ? (
            [selectedUnitData.storage_gb ? `${selectedUnitData.storage_gb}GB` : '',
             selectedUnitData.color_name || ''].filter(Boolean).join(' ')
          ) : undefined}
          prefilledMessage={getWhatsAppPrefilledMessage()}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}
    </div>
  );
}

function FinancingModal({
  product,
  offers,
  onClose,
}: {
  product: PublicProduct;
  offers: any[];
  onClose: () => void;
}) {
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(
    typeof offers?.[0]?.id === 'number' ? offers[0].id : null
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const o of offers || []) {
      const key = String(o.provider_name || 'Provider');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return Array.from(map.entries()).map(([providerName, list]) => ({
      providerName,
      providerLogoUrl: list?.[0]?.provider_logo_url ?? null,
      offers: list,
    }));
  }, [offers]);

  const selectedOffer = useMemo(
    () => (offers || []).find((o) => typeof o.id === 'number' && o.id === selectedOfferId) ?? null,
    [offers, selectedOfferId]
  );

  const submitInquiry = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      alert('Please fill in name, phone and email.');
      return;
    }

    setSubmitting(true);
    try {
      const base = OpenAPI.BASE.replace(/\/+$/, '');
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(typeof OpenAPI.HEADERS === 'function'
          ? await OpenAPI.HEADERS({} as never)
          : (OpenAPI.HEADERS ?? {})),
      };
      const res = await fetch(`${base}/api/v1/public/financing/inquiry/`, {
        method: 'POST',
        credentials: 'omit',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          product_id: product.id,
          provider_id: selectedOffer?.provider ?? null,
          offer_id: selectedOffer?.id ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && (data.error || data.detail)) ? String(data.error || data.detail) : `Request failed (${res.status})`;
        throw new Error(msg);
      }
      alert('Inquiry received. Our team will reach out shortly.');
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (raw: unknown): string => {
    const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    if (!Number.isFinite(n)) return String(raw ?? '');
    return formatPrice(n);
  };

  type TermUnit = 'day' | 'week' | 'month';

  const pluralize = (n: number, unit: string) => (n === 1 ? unit : `${unit}s`);

  const getOfferPrimary = (
    o: any
  ): { unit: TermUnit; payment: unknown; count: number | null } | null => {
    const unit = (o?.term_unit as TermUnit | null) ?? null;
    const countRaw = o?.term_count;
    const count =
      typeof countRaw === 'number'
        ? countRaw
        : typeof countRaw === 'string' && countRaw.trim()
          ? Number(countRaw)
          : null;
    const safeCount = Number.isFinite(count as number) ? (count as number) : null;

    const pick = (u: TermUnit): unknown => {
      if (u === 'month') return o?.monthly_payment;
      if (u === 'week') return o?.weekly_payment;
      return o?.daily_payment;
    };

    if (unit) {
      const p = pick(unit);
      if (p != null && String(p).trim() !== '') return { unit, payment: p, count: safeCount };
      return { unit, payment: null, count: safeCount };
    }

    // Fallback for older offers without term_unit: prefer monthly > weekly > daily.
    if (o?.monthly_payment != null && String(o.monthly_payment).trim() !== '') return { unit: 'month', payment: o.monthly_payment, count: safeCount };
    if (o?.weekly_payment != null && String(o.weekly_payment).trim() !== '') return { unit: 'week', payment: o.weekly_payment, count: safeCount };
    if (o?.daily_payment != null && String(o.daily_payment).trim() !== '') return { unit: 'day', payment: o.daily_payment, count: safeCount };
    return null;
  };

  return (
    <div className="product-card__modal product-card__modal--financing" onClick={onClose}>
      <div className="product-card__modal-panel product-card__modal-panel--financing" onClick={(e) => e.stopPropagation()}>
        <div className="financing-modal__header">
          <div className="financing-modal__header-copy">
            <h4 className="financing-modal__title">Buy now, pay over time</h4>
            <p className="financing-modal__subtitle">{product.product_name}</p>
          </div>
          <button type="button" onClick={onClose} className="financing-modal__close" aria-label="Close">
            ×
          </button>
        </div>
        <div className="financing-modal__body">
          {grouped.length === 0 ? (
            <div className="product-detail__loading-inline">No active financing offers.</div>
          ) : (
            <>
              <div className="financing-modal__providers">
                {grouped.map((g) => (
                  <div key={g.providerName} className="financing-modal__provider">
                    <div className="financing-modal__provider-head">
                      {g.providerLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.providerLogoUrl}
                          alt={g.providerName}
                          className="financing-modal__provider-logo"
                        />
                      ) : (
                        <span className="financing-modal__provider-logo financing-modal__provider-logo--placeholder" />
                      )}
                      <div className="financing-modal__provider-name">{g.providerName}</div>
                    </div>
                    <div className="financing-modal__offer-list">
                      {g.offers.map((o: any) => (
                        (() => {
                          const primary = getOfferPrimary(o);
                          const isSelected = selectedOfferId === o.id;
                          const termPill =
                            primary?.count && primary.count > 0
                              ? `${primary.count} ${pluralize(primary.count, primary.unit)}`
                              : null;
                          const paymentLabel =
                            primary?.unit === 'month'
                              ? 'every month'
                              : primary?.unit === 'week'
                                ? 'every week'
                                : primary?.unit === 'day'
                                  ? 'every day'
                                  : '';
                          const totalOfPayments =
                            primary?.payment != null &&
                            String(primary.payment).trim() !== '' &&
                            primary?.count &&
                            primary.count > 0
                              ? Number(primary.payment) * primary.count
                              : null;
                          return (
                        <label
                          key={o.id}
                          className={`financing-modal__offer ${isSelected ? 'financing-modal__offer--selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="financing-offer"
                            checked={selectedOfferId === o.id}
                            onChange={() => setSelectedOfferId(o.id)}
                            className="financing-modal__offer-radio"
                          />
                          <div className="financing-modal__offer-main">
                            <div className="financing-modal__offer-top">
                              <div className="financing-modal__offer-amount">
                                {primary?.payment != null && String(primary.payment).trim() !== '' ? (
                                  <>
                                    <span className="financing-modal__offer-amount-value">{formatMoney(primary.payment)}</span>
                                    <span className="financing-modal__offer-amount-suffix">{paymentLabel}</span>
                                  </>
                                ) : (
                                  <span className="financing-modal__offer-amount-value">Custom terms</span>
                                )}
                              </div>

                              {termPill ? (
                                <span className="financing-modal__term-pill" aria-label={`Term: ${termPill}`}>
                                  {termPill}
                                </span>
                              ) : null}
                            </div>

                            <div className="financing-modal__offer-meta">
                              <span>Deposit {formatMoney(o.deposit_amount)}</span>
                              <span aria-hidden>•</span>
                              <span>Retail {formatMoney(o.retail_amount)}</span>
                            </div>

                            {totalOfPayments != null ? (
                              <div className="financing-modal__offer-meta">
                                <span>Total of payments {formatMoney(totalOfPayments)}</span>
                              </div>
                            ) : null}

                            <div className="financing-modal__offer-chips">
                              {o.daily_payment != null && String(o.daily_payment).trim() !== '' ? (
                                <span className="financing-modal__chip">Daily {formatMoney(o.daily_payment)}</span>
                              ) : null}
                              {o.weekly_payment != null && String(o.weekly_payment).trim() !== '' ? (
                                <span className="financing-modal__chip">Weekly {formatMoney(o.weekly_payment)}</span>
                              ) : null}
                              {o.monthly_payment != null && String(o.monthly_payment).trim() !== '' ? (
                                <span className="financing-modal__chip">Monthly {formatMoney(o.monthly_payment)}</span>
                              ) : null}
                              {(o.rom_gb || o.ram_gb) ? (
                                <span className="financing-modal__chip">
                                  {o.rom_gb ? `${o.rom_gb}GB` : ''}
                                  {o.rom_gb && o.ram_gb ? ' / ' : ''}
                                  {o.ram_gb ? `${o.ram_gb}GB RAM` : ''}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </label>
                          );
                        })()
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="financing-modal__inquiry">
                <div className="financing-modal__inquiry-title">Request a callback</div>
                <div className="financing-modal__inquiry-fields">
                  <input
                    className="financing-modal__input"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                  />
                  <input
                    className="financing-modal__input"
                    placeholder="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                  />
                  <input
                    className="financing-modal__input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <button
                  type="button"
                  className="financing-modal__cta"
                  onClick={submitInquiry}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit inquiry'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
