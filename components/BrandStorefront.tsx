'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService, type PublicArticleCard, type PublicProduct, type Review } from '@/lib/api/generated';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ProductCard } from '@/components/ProductCard';
import { ProductCarousel } from '@/components/ProductCarousel';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { formatPrice } from '@/lib/utils/format';
import { getProductHref } from '@/lib/utils/productRoutes';
import { studioPath } from '@/lib/studio/paths';
import {
  allBrandNavItems,
  brandCategoryHref,
  type ProductTypeFilter,
} from '@/lib/config/nav-links';
import { useProducts } from '@/lib/hooks/useProducts';
import { articlePath, blogPath } from '@/lib/seo/urls';

type BrandStorefrontProps = {
  brand: string;
  title: string;
  subtitle?: string;
  productType: string;
  products: PublicProduct[];
  showMostWanted: boolean;
  banner?: ReactNode;
};

function articleHref(article: PublicArticleCard): string | null {
  if (!article.slug) return null;
  if (article.product_slug) return articlePath(article.product_slug, article.slug);
  return blogPath(article.slug);
}

function reviewStars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
}

const SPOTLIGHT_LIMIT = 4;

type SpotlightItem = {
  key: string;
  href: string;
  title: string;
  meta: string;
  imageUrl: string | null;
};

function MediaSpotlightCard({ item }: { item: SpotlightItem }) {
  return (
    <Link href={item.href} className="brand-media-card">
      <span className="brand-media-card__copy">
        <span className="brand-media-card__title">{item.title}</span>
        <span className="brand-media-card__meta">{item.meta}</span>
      </span>
      <span className="brand-media-card__media">
        {item.imageUrl ? (
          <CloudinaryImage
            src={item.imageUrl}
            alt=""
            preset="card"
            fill
            fit="cover"
            sizes="120px"
            className="brand-media-card__image"
          />
        ) : (
          <MaterialIcon name="article" className="brand-media-card__fallback" />
        )}
      </span>
    </Link>
  );
}

function StorefrontBlock({
  eyebrow,
  title,
  copy,
  href,
  linkLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="brand-storefront__block home-section-panel">
      <div className="brand-storefront__heading">
        <div className="brand-storefront__heading-copy">
          <p className="ag-type-eyebrow text-stock-green">{eyebrow}</p>
          <h3 className="ag-type-h3">{title}</h3>
          {copy ? <p className="ag-type-body">{copy}</p> : null}
        </div>
        <Link href={href} className="brand-storefront__more">
          {linkLabel}
          <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
        </Link>
      </div>
      {children}
    </section>
  );
}

export function BrandStorefront({
  brand,
  title,
  subtitle,
  productType,
  products,
  showMostWanted,
  banner,
}: BrandStorefrontProps) {
  const navItem = allBrandNavItems().find(
    (item) => item.brandFilter.toLowerCase() === brand.toLowerCase()
  );
  const categories = navItem?.categories ?? [
    { label: 'Phones', productType: 'PH' as ProductTypeFilter },
    { label: 'Accessories', productType: 'AC' as ProductTypeFilter },
    { label: `All ${title}`, productType: null },
  ];

  const companionType: ProductTypeFilter = productType === 'AC' ? 'PH' : 'AC';
  const companionLabel = companionType === 'AC' ? 'Accessories' : 'Phones';
  const showCompanion = productType !== companionType;

  const companion = useProducts({
    brand_filter: brand,
    type: companionType,
    page: 1,
    page_size: 8,
    ordering: '-release_date',
    enabled: showCompanion,
  });

  const guides = useQuery({
    queryKey: ['brand-storefront', 'articles', brand],
    queryFn: () => ApiService.apiV1PublicArticlesList(brand, undefined, undefined, 1, 6),
    staleTime: 60_000,
  });

  const reviews = useQuery({
    queryKey: ['brand-storefront', 'reviews'],
    queryFn: () => ApiService.apiV1PublicReviewsList('-date_posted', 1),
    staleTime: 60_000,
  });

  const mostWanted = showMostWanted ? products.slice(0, 8) : [];
  const companionProducts = companion.data?.results ?? [];
  const seenGuides = new Set<string>();
  const guideSpotlight: SpotlightItem[] = [];
  for (const article of guides.data?.results ?? []) {
    const href = articleHref(article);
    const guideTitle = (article.headline || article.product_name || title).trim();
    const key = guideTitle.toLowerCase();
    if (!href || seenGuides.has(key)) continue;
    seenGuides.add(key);
    guideSpotlight.push({
      key: article.slug || href,
      href: studioPath(href),
      title: guideTitle,
      meta: formatArticleCategory(article.category),
      imageUrl: article.thumbnail_image || article.product_primary_image || null,
    });
    if (guideSpotlight.length >= SPOTLIGHT_LIMIT) break;
  }

  const accessoryPool = productType === 'AC' ? products : companionProducts;
  const accessorySpotlight: SpotlightItem[] =
    guideSpotlight.length > 0
      ? []
      : accessoryPool.slice(0, SPOTLIGHT_LIMIT).map((product) => ({
          key: String(product.id ?? product.slug),
          href: getProductHref(product),
          title: product.product_name || title,
          meta: product.min_price != null ? formatPrice(product.min_price) : 'Accessory',
          imageUrl: product.primary_image || null,
        }));
  const spotlightIds = new Set(
    accessorySpotlight.map((item) => item.key).filter((key) => key && key !== 'undefined')
  );
  const mostWantedVisible = mostWanted.filter(
    (product) => !spotlightIds.has(String(product.id ?? product.slug))
  );
  const companionVisible = companionProducts.filter(
    (product) => !spotlightIds.has(String(product.id ?? product.slug))
  );
  const catalogNames = new Set(
    [...products, ...companionProducts].map((product) => (product.product_name || '').toLowerCase())
  );
  const brandReviews = ((reviews.data?.results ?? []) as Review[])
    .filter((review) => {
      const name = (review.product_name || '').toLowerCase();
      return name.includes(brand.toLowerCase()) || catalogNames.has(name);
    })
    .slice(0, 4);

  const companionCopy =
    companionType === 'AC'
      ? `Chargers, audio, and wearables that belong with ${title}.`
      : `${title} phones to pair with these accessories.`;

  return (
    <section className="brand-storefront" aria-label={`${title} shop`}>
      <div
        className={`home-section-panel brand-storefront__lead${
          guideSpotlight.length > 0 || accessorySpotlight.length > 0 ? ' brand-storefront__lead--split' : ''
        }`}
      >
        <div className="brand-storefront__intro">
          <p className="ag-type-eyebrow text-stock-green">Shop {title}</p>
          <h2 className="ag-type-h2">{title} in Kenya</h2>
          {subtitle ? <p className="ag-type-body brand-storefront__subtitle">{subtitle}</p> : null}
        </div>

        {guideSpotlight.length > 0 || accessorySpotlight.length > 0 ? (
          <div className="brand-storefront__spotlight">
            <div className="brand-storefront__spotlight-head">
              <p className="ag-type-eyebrow text-stock-green">
                {guideSpotlight.length > 0 ? 'From the guides' : `Accessories for ${title}`}
              </p>
              <Link
                href={
                  guideSpotlight.length > 0
                    ? `/articles?brand=${encodeURIComponent(brand)}`
                    : brandCategoryHref(brand, 'AC')
                }
                className="brand-storefront__more"
              >
                {guideSpotlight.length > 0 ? 'All guides' : 'See all'}
                <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
              </Link>
            </div>
            <div className="brand-storefront__spotlight-grid">
              {(guideSpotlight.length > 0 ? guideSpotlight : accessorySpotlight).map((item) => (
                <MediaSpotlightCard key={item.key} item={item} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="brand-storefront__chips" aria-label={`Shop ${title} by category`}>
          {categories.map((category) => {
            const active = (category.productType || '') === (productType || '');
            return (
              <Link
                key={`${category.label}-${category.productType || 'all'}`}
                href={brandCategoryHref(brand, category.productType)}
                className={active ? 'ag-chip ag-chip--lime' : 'ag-chip ag-chip--muted'}
                aria-current={active ? 'page' : undefined}
              >
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>

      {mostWantedVisible.length > 0 ? (
        <StorefrontBlock
          eyebrow="Most wanted"
          title="Shop our most wanted"
          copy=""
          href="#products-grid"
          linkLabel={`See all ${title}`}
        >
          <ProductCarousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
            showNavigation
            className="brand-storefront__carousel"
          >
            {mostWantedVisible.map((product) => (
              <ProductCard key={product.id} product={product} showRatings />
            ))}
          </ProductCarousel>
        </StorefrontBlock>
      ) : null}

      {banner ? <div className="brand-storefront__banner">{banner}</div> : null}

      {showCompanion && companionVisible.length > 0 ? (
        <StorefrontBlock
          eyebrow="Goes with it"
          title={`${companionLabel} for ${title}`}
          copy={companionCopy}
          href={brandCategoryHref(brand, companionType)}
          linkLabel="See all"
        >
          <ProductCarousel
            itemsPerView={{ mobile: 1, tablet: 2, desktop: 4 }}
            showNavigation
            className="brand-storefront__carousel"
          >
            {companionVisible.map((product) => (
              <ProductCard key={product.id} product={product} showRatings />
            ))}
          </ProductCarousel>
        </StorefrontBlock>
      ) : null}

      {brandReviews.length > 0 ? (
        <StorefrontBlock
          eyebrow="From buyers"
          title="What buyers say"
          copy={`Notes from people who already bought ${title} from this shop.`}
          href="/reviews"
          linkLabel="All reviews"
        >
          <div className="brand-storefront__reviews">
            {brandReviews.map((review) => (
              <article key={review.id} className="brand-storefront__review">
                <p className="brand-storefront__stars" aria-label={`${review.rating} out of 5`}>
                  {reviewStars(Number(review.rating))}
                </p>
                <p className="brand-storefront__quote">{review.comment}</p>
                <p className="brand-storefront__reviewer">
                  {review.customer_username || 'Buyer'}
                  {review.product_name ? ` · ${review.product_name}` : ''}
                </p>
              </article>
            ))}
          </div>
        </StorefrontBlock>
      ) : null}
    </section>
  );
}
