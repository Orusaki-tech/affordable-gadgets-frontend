'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import {
  type BrandCategoryLink,
  type BrandNavItem,
  MORE_BRAND_NAV,
  brandCategoryHref,
} from '@/lib/config/nav-links';
import { useProducts, navMegaProductsParams } from '@/lib/hooks/useProducts';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { PublicProduct, PublicPromotion } from '@/lib/api/generated';
import { formatPrice, formatPriceRange } from '@/lib/utils/format';
import { getProductHref } from '@/lib/utils/productRoutes';

export const MEGA_MENU_MORE_KEY = '__more__';

type HeaderMegaMenuPanelProps = {
  openMenu: string;
  brand?: BrandNavItem;
  moreBrands?: BrandNavItem[];
  moreHoverBrand: string | null;
  onMoreBrandHover: (brandFilter: string) => void;
  onClose: () => void;
};

function megaProductsHeading(brandLabel: string, category: BrandCategoryLink): string {
  if (category.productType === null) {
    return brandLabel;
  }
  return `${brandLabel} ${category.label}`;
}

function promotionImageForProduct(
  productId: number,
  promotionImagesByProductId: Map<number, string>
): string | null {
  return promotionImagesByProductId.get(productId) ?? null;
}

function buildPromotionImageMap(promotions: PublicPromotion[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const promotion of promotions) {
    const image =
      promotion.banner_image_url ||
      promotion.banner_image ||
      promotion.promo_card?.product_image_url ||
      null;
    if (!image) continue;

    const productIds = new Set<number>();
    if (typeof promotion.promo_card?.product_id === 'number') {
      productIds.add(promotion.promo_card.product_id);
    }
    for (const productId of promotion.products ?? []) {
      if (typeof productId === 'number') productIds.add(productId);
    }

    for (const productId of productIds) {
      if (!map.has(productId)) map.set(productId, image);
    }
  }
  return map;
}

function MegaProductTile({
  product,
  promotionImagesByProductId,
}: {
  product: PublicProduct;
  promotionImagesByProductId: Map<number, string>;
}) {
  const image =
    (typeof product.id === 'number'
      ? promotionImageForProduct(product.id, promotionImagesByProductId)
      : null) ||
    product.primary_image ||
    null;
  const priceText =
    product.min_price != null && product.max_price != null && product.min_price !== product.max_price
      ? formatPriceRange(product.min_price, product.max_price)
      : product.min_price != null
        ? formatPrice(product.min_price)
        : null;

  return (
    <Link href={getProductHref(product)} className="site-header__mega-product">
      <div className="site-header__mega-product-image-wrap">
        {image ? (
          <CloudinaryImage
            src={image}
            alt={product.product_name}
            width={112}
            height={88}
            className="site-header__mega-product-image"
          />
        ) : (
          <div className="site-header__mega-product-image-fallback" aria-hidden />
        )}
      </div>
      <span className="site-header__mega-product-name">{product.product_name}</span>
      {priceText && <span className="site-header__mega-product-price">{priceText}</span>}
    </Link>
  );
}

function MegaProductsColumn({
  brandFilter,
  productType,
  title,
}: {
  brandFilter: string;
  productType: BrandCategoryLink['productType'];
  title: string;
}) {
  const { data, isLoading } = useProducts({
    ...navMegaProductsParams(brandFilter, productType),
    enabled: !!brandFilter,
  });
  const { data: promotionsData } = usePromotions({ page_size: 50 });

  const promotionImagesByProductId = useMemo(
    () => buildPromotionImageMap(promotionsData?.results ?? []),
    [promotionsData?.results]
  );

  const products = data?.results ?? [];

  return (
    <div className="site-header__mega-products">
      <p className="site-header__mega-products-heading">Latest {title}</p>
      {isLoading ? (
        <div className="site-header__mega-products-grid site-header__mega-products-grid--loading">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="site-header__mega-product-skeleton" aria-hidden />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="site-header__mega-products-grid">
          {products.map((product: PublicProduct) => (
            <MegaProductTile
              key={product.id}
              product={product}
              promotionImagesByProductId={promotionImagesByProductId}
            />
          ))}
        </div>
      ) : (
        <p className="site-header__mega-products-empty">No products available right now.</p>
      )}
    </div>
  );
}

function CategoryLink({
  brandFilter,
  category,
  isActive,
  onHover,
  onClose,
}: {
  brandFilter: string;
  category: BrandCategoryLink;
  isActive: boolean;
  onHover: () => void;
  onClose: () => void;
}) {
  return (
    <Link
      href={brandCategoryHref(brandFilter, category.productType)}
      className={`site-header__mega-link${isActive ? ' site-header__mega-link--active' : ''}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onClose}
    >
      {category.label}
    </Link>
  );
}

export function HeaderMegaMenuPanel({
  openMenu,
  brand,
  moreBrands = MORE_BRAND_NAV,
  moreHoverBrand,
  onMoreBrandHover,
  onClose,
}: HeaderMegaMenuPanelProps) {
  const isMore = openMenu === MEGA_MENU_MORE_KEY;
  const activeMoreBrand =
    moreBrands.find((b) => b.brandFilter === moreHoverBrand) ?? moreBrands[0];
  const [hoveredCategory, setHoveredCategory] = useState<BrandCategoryLink | null>(null);
  const [moreHoverCategory, setMoreHoverCategory] = useState<BrandCategoryLink | null>(null);

  useEffect(() => {
    if (isMore) {
      setHoveredCategory(null);
      setMoreHoverCategory(activeMoreBrand?.categories[0] ?? null);
      return;
    }
    setMoreHoverCategory(null);
    setHoveredCategory(brand?.categories[0] ?? null);
  }, [isMore, brand, activeMoreBrand?.brandFilter]);

  const activeCategory = isMore ? moreHoverCategory : hoveredCategory;
  const productBrandFilter = isMore ? activeMoreBrand?.brandFilter : brand?.brandFilter;
  const productBrandLabel = isMore ? activeMoreBrand?.navLabel : brand?.navLabel;
  const productsHeading =
    productBrandLabel && activeCategory
      ? megaProductsHeading(productBrandLabel, activeCategory)
      : productBrandLabel;

  return (
    <div
      className={`site-header__mega-panel${isMore ? ' site-header__mega-panel--more' : ''}`}
      role="region"
      aria-label={isMore ? 'More brands menu' : `${brand?.navLabel} menu`}
    >
      <div className="site-header__mega-categories">
          {isMore ? (
            <div className="site-header__mega-more-layout">
              <ul className="site-header__mega-more-brands" aria-label="More brands">
                {moreBrands.map((item) => (
                  <li key={item.brandFilter}>
                    <button
                      type="button"
                      className={`site-header__mega-more-brand-btn${
                        item.brandFilter === activeMoreBrand?.brandFilter
                          ? ' site-header__mega-more-brand-btn--active'
                          : ''
                      }`}
                      onMouseEnter={() => onMoreBrandHover(item.brandFilter)}
                      onFocus={() => onMoreBrandHover(item.brandFilter)}
                    >
                      {item.navLabel}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="site-header__mega-more-categories">
                {activeMoreBrand?.categories.map((cat) => (
                  <CategoryLink
                    key={`${activeMoreBrand.brandFilter}-${cat.label}`}
                    brandFilter={activeMoreBrand.brandFilter}
                    category={cat}
                    isActive={moreHoverCategory?.label === cat.label}
                    onHover={() => setMoreHoverCategory(cat)}
                    onClose={onClose}
                  />
                ))}
              </div>
            </div>
          ) : (
            brand?.categories.map((cat) => (
              <CategoryLink
                key={`${brand.brandFilter}-${cat.label}`}
                brandFilter={brand.brandFilter}
                category={cat}
                isActive={hoveredCategory?.label === cat.label}
                onHover={() => setHoveredCategory(cat)}
                onClose={onClose}
              />
            ))
          )}
        </div>

        {productBrandFilter && productsHeading && activeCategory && (
          <MegaProductsColumn
            brandFilter={productBrandFilter}
            productType={activeCategory.productType}
            title={productsHeading}
          />
        )}
    </div>
  );
}
