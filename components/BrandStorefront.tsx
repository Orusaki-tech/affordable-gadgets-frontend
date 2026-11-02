'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService, type PublicArticleCard, type PublicProduct, type Review } from '@/lib/api/generated';
import { BlogCard } from '@/components/BlogCard';
import { MaterialIcon } from '@/components/MaterialIcon';
import { ProductCard } from '@/components/ProductCard';
import {
  allBrandNavItems,
  brandCategoryHref,
  type ProductTypeFilter,
} from '@/lib/config/nav-links';
import { useProducts } from '@/lib/hooks/useProducts';
import { articlePath, blogPath } from '@/lib/seo/urls';

const TRUST = [
  { icon: 'verified', text: '6-12 Months Warranty' },
  { icon: 'local_shipping', text: 'Affordable Shipping Across Kenya' },
  { icon: 'shield', text: 'Secure Payments' },
  { icon: 'bolt', text: '1-2 Days Delivery' },
] as const;

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
  const guideCards = (guides.data?.results ?? [])
    .map((article) => ({ article, href: articleHref(article) }))
    .filter((item): item is { article: PublicArticleCard; href: string } => {
      if (!item.href) return false;
      const key = (item.article.headline || item.article.slug || item.href).trim().toLowerCase();
      if (seenGuides.has(key)) return false;
      seenGuides.add(key);
      return true;
    })
    .slice(0, 6);
  const catalogNames = new Set(
    [...products, ...companionProducts].map((product) => (product.product_name || '').toLowerCase())
  );
  const brandReviews = ((reviews.data?.results ?? []) as Review[])
    .filter((review) => {
      const name = (review.product_name || '').toLowerCase();
      return name.includes(brand.toLowerCase()) || catalogNames.has(name);
    })
    .slice(0, 4);

  return (
    <section className="brand-storefront" aria-label={`${title} shop`}>
      <div className="brand-storefront__intro">
        <h2 className="brand-storefront__title">{title} in Kenya</h2>
        {subtitle ? <p className="brand-storefront__subtitle">{subtitle}</p> : null}
      </div>

      <ul className="brand-storefront__trust">
        {TRUST.map((item) => (
          <li key={item.text}>
            <MaterialIcon name={item.icon} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <div className="brand-storefront__chips" aria-label={`Shop ${title} by category`}>
        {categories.map((category) => {
          const active = (category.productType || '') === (productType || '');
          return (
            <Link
              key={`${category.label}-${category.productType || 'all'}`}
              href={brandCategoryHref(brand, category.productType)}
              className={active ? 'brand-storefront__chip brand-storefront__chip--active' : 'brand-storefront__chip'}
              aria-current={active ? 'page' : undefined}
            >
              {category.label}
            </Link>
          );
        })}
      </div>

      {mostWanted.length > 0 ? (
        <div className="brand-storefront__block">
          <div className="brand-storefront__heading">
            <h3>Shop our most wanted</h3>
            <Link href="#products-grid">See all {title}</Link>
          </div>
          <div className="brand-storefront__rail">
            {mostWanted.map((product) => (
              <div key={product.id} className="brand-storefront__card">
                <ProductCard product={product} showRatings />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {banner ? <div className="brand-storefront__banner">{banner}</div> : null}

      {showCompanion && companionProducts.length > 0 ? (
        <div className="brand-storefront__block">
          <div className="brand-storefront__heading">
            <h3>
              {companionLabel} for {title}
            </h3>
            <Link href={brandCategoryHref(brand, companionType)}>See all</Link>
          </div>
          <div className="brand-storefront__rail">
            {companionProducts.map((product) => (
              <div key={product.id} className="brand-storefront__card">
                <ProductCard product={product} showRatings />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {guideCards.length > 0 ? (
        <div className="brand-storefront__block">
          <div className="brand-storefront__heading">
            <h3>{title} guides</h3>
            <Link href={`/articles?brand=${encodeURIComponent(brand)}`}>All guides</Link>
          </div>
          <div className="brand-storefront__rail brand-storefront__rail--guides">
            {guideCards.map(({ article, href }) => (
              <div key={article.slug} className="brand-storefront__guide">
                <BlogCard
                  imageUrl={article.thumbnail_image || article.product_primary_image || ''}
                  category={article.category || 'buying_guide'}
                  title={article.headline || article.product_name || title}
                  href={href}
                  articleSlug={article.slug}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {brandReviews.length > 0 ? (
        <div className="brand-storefront__block">
          <div className="brand-storefront__heading">
            <h3>What buyers say</h3>
            <Link href="/reviews">All reviews</Link>
          </div>
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
        </div>
      ) : null}
    </section>
  );
}
