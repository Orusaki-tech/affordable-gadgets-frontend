'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import type { Review } from '@/lib/api/generated';

type HubFilter = 'all' | 'phones' | 'pickup' | 'accessories';

type CommunityVerifiedHubProps = {
  reviews: Review[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  onLeaveReview: () => void;
  onOpenReview: (review: Review) => void;
};

function getInitials(name?: string | null): string {
  if (!name?.trim()) return 'AG';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function reviewHaystack(review: Review): string {
  return `${review.product_name ?? ''} ${review.comment ?? ''} ${review.product_condition ?? ''}`.toLowerCase();
}

function matchesFilter(review: Review, filter: HubFilter): boolean {
  const hay = reviewHaystack(review);
  if (filter === 'all') return true;
  if (filter === 'phones') {
    return /iphone|galaxy|pixel|phone|samsung|sony|xperia|redmi|tecno|infinix|oppo|vivo|nokia|huawei|oneplus|motorola|smartphone|handset/.test(
      hay
    );
  }
  if (filter === 'pickup') {
    return /pickup|cbd|nairobi|westlands|kilimani|delivery|boda|fargo|unbox|shop|hub/.test(hay);
  }
  if (filter === 'accessories') {
    return /adapter|buds|airpods|charger|cable|watch|case|earbud|headphone|speaker|power.?bank|accessory|usb/.test(
      hay
    );
  }
  return true;
}

function formatRelative(dateString?: string | null): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const cls = size === 'md' ? 'text-[1.25rem]' : 'text-[0.875rem]';
  return (
    <span className={`inline-flex items-center text-amber-400 ${cls}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <MaterialIcon key={n} name="star" className={cls} filled={n <= filled} />
      ))}
    </span>
  );
}

function reviewImageUrl(review: Review): string | null {
  return review.review_image_url || review.review_image || null;
}

export function CommunityVerifiedHub({
  reviews,
  totalCount,
  isLoading,
  error,
  onLeaveReview,
  onOpenReview,
}: CommunityVerifiedHubProps) {
  const [filter, setFilter] = useState<HubFilter>('all');

  const filtered = useMemo(
    () => reviews.filter((review) => matchesFilter(review, filter)),
    [reviews, filter]
  );

  const ranked = useMemo(() => {
    const withImage = filtered.filter((r) => Boolean(reviewImageUrl(r)));
    const without = filtered.filter((r) => !reviewImageUrl(r));
    return [...withImage, ...without];
  }, [filtered]);

  const hero = ranked[0] ?? null;
  const compact = ranked[1] ?? null;
  const inspection = ranked[2] ?? null;
  const pulseReviews = ranked.slice(0, 3);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 5;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const countLabel = totalCount > 0 ? totalCount : reviews.length;

  const filters: { id: HubFilter; label: string; icon?: string }[] = [
    { id: 'all', label: 'All Verified' },
    { id: 'phones', label: 'Phones & Flagships', icon: 'phone_iphone' },
    { id: 'pickup', label: 'Fast CBD Pickups', icon: 'storefront' },
    { id: 'accessories', label: 'Accessories & Audio', icon: 'headphones' },
  ];

  return (
    <div className="community-hub" data-purpose="community-verified-hub">
      <div className="community-hub__ambient community-hub__ambient--tr" aria-hidden />
      <div className="community-hub__ambient community-hub__ambient--bl" aria-hidden />

      <header className="community-hub__header">
        <div className="community-hub__intro">
          <div className="community-hub__live-badge">
            <span className="community-hub__live-dot" aria-hidden>
              <span className="community-hub__live-ping" />
              <span className="community-hub__live-core" />
            </span>
            <span className="font-bold tracking-tight">
              {countLabel}+ Community Reviews in Kenya
            </span>
            <span className="community-hub__live-sep">•</span>
            <span className="community-hub__live-guarantee">
              <MaterialIcon name="shield" className="text-[0.875rem]" />
              Guaranteed Grade A
            </span>
          </div>

          <h2 className="community-hub__title">
            Real Techies.{' '}
            <span className="community-hub__title-fade">Real Unboxings.</span>
          </h2>

          <div className="community-hub__rating-row">
            <Stars rating={5} size="md" />
            <span className="font-bold text-slate-900">
              {avgRating.toFixed(1)} Out of 5.0
            </span>
            <span className="community-hub__live-sep">•</span>
            <span className="text-slate-600">
              Authentic Nairobi &amp; countrywide delivery stories from verified buyers
            </span>
          </div>
        </div>

        <div className="community-hub__ctas">
          <button
            type="button"
            className="community-hub__cta community-hub__cta--soft"
            onClick={onLeaveReview}
          >
            <span className="community-hub__cta-dot" aria-hidden />
            Share Your Unboxing
            <MaterialIcon name="arrow_forward" className="text-base" />
          </button>
          <button
            type="button"
            className="community-hub__cta community-hub__cta--dark"
            onClick={onLeaveReview}
          >
            <MaterialIcon name="rate_review" className="text-base text-[var(--promo-lime,#9fe855)]" />
            Leave a Review
          </button>
        </div>
      </header>

      <div className="community-hub__filters">
        <div className="community-hub__filter-scroll">
          {filters.map((item) => {
            const active = filter === item.id;
            const pillCount =
              item.id === 'all'
                ? countLabel
                : reviews.filter((r) => matchesFilter(r, item.id)).length;
            return (
              <button
                key={item.id}
                type="button"
                className={`community-hub__filter ${active ? 'is-active' : ''}`}
                onClick={() => setFilter(item.id)}
              >
                {item.icon ? <MaterialIcon name={item.icon} className="text-sm" /> : null}
                <span>{item.label}</span>
                {item.id === 'all' || active ? (
                  <span className="community-hub__filter-count">{pillCount}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        <span className="community-hub__verified-note">
          <MaterialIcon name="verified_user" className="text-sm text-emerald-600" />
          Verified purchase reviews
        </span>
      </div>

      {isLoading ? (
        <div className="community-hub__bento">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`community-hub__skeleton community-hub__skeleton--${i}`} />
          ))}
        </div>
      ) : error ? (
        <p className="community-hub__error">
          Unable to load reviews right now. Please try again later.
        </p>
      ) : ranked.length === 0 ? (
        <div className="community-hub__empty">
          <p className="font-semibold text-slate-900">No reviews in this filter yet.</p>
          <p className="mt-1 text-sm text-slate-600">Be the first to share an unboxing.</p>
          <button type="button" className="community-hub__cta community-hub__cta--dark mt-4" onClick={onLeaveReview}>
            Leave a Review
          </button>
        </div>
      ) : (
        <div className="community-hub__bento">
          {hero ? (
            <article className="community-hub__card community-hub__card--hero">
              <button
                type="button"
                className="community-hub__hero-btn"
                onClick={() => onOpenReview(hero)}
              >
                <div className="community-hub__hero-media">
                  {reviewImageUrl(hero) ? (
                    <CloudinaryImage
                      src={reviewImageUrl(hero)!}
                      alt={hero.product_name ?? 'Customer unboxing'}
                      preset="card"
                      fit="cover"
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="community-hub__hero-img"
                      fill
                    />
                  ) : (
                    <div className="community-hub__media-fallback" />
                  )}
                  <div className="community-hub__hero-scrim" />
                  <span className="community-hub__glass-badge">
                    <MaterialIcon name="verified" className="text-[0.8125rem] text-emerald-600" />
                    Kenya Unboxing
                  </span>
                  <div className="community-hub__hero-shot-meta">
                    <span>
                      <MaterialIcon name="photo_camera" className="text-[0.875rem]" />
                      Live Customer Shot
                    </span>
                    <span>{formatRelative(hero.date_posted)}</span>
                  </div>
                </div>

                <div className="community-hub__hero-body">
                  <div className="community-hub__reviewer">
                    <div className="community-hub__avatar">{getInitials(hero.customer_username)}</div>
                    <div>
                      <div className="community-hub__reviewer-name">
                        {hero.customer_username || (hero.is_admin_review ? 'Admin' : 'Verified Buyer')}
                      </div>
                      <div className="community-hub__reviewer-meta">
                        <MaterialIcon name="check_circle" className="text-[0.875rem] text-emerald-600" />
                        {hero.purchase_date
                          ? 'Verified purchase'
                          : hero.is_admin_review
                            ? 'Store inspection'
                            : 'Community review'}
                      </div>
                    </div>
                    <span className="community-hub__when">{formatRelative(hero.date_posted)}</span>
                  </div>

                  <div className="community-hub__stars-line">
                    <Stars rating={Number(hero.rating)} />
                    <span className="text-xs font-bold text-slate-800">
                      {Number(hero.rating).toFixed(1)} Rating
                    </span>
                  </div>

                  {hero.comment ? (
                    <blockquote className="community-hub__quote">
                      “{hero.comment.length > 160 ? `${hero.comment.slice(0, 157)}…` : hero.comment}”
                    </blockquote>
                  ) : null}

                  <div className="community-hub__tags">
                    {hero.product_condition ? (
                      <span className="community-hub__tag">{hero.product_condition}</span>
                    ) : (
                      <span className="community-hub__tag">Grade A</span>
                    )}
                    {hero.product_name ? (
                      <span className="community-hub__tag community-hub__tag--lime">
                        {hero.product_name}
                      </span>
                    ) : null}
                  </div>

                  <div className="community-hub__product-bar">
                    <div className="community-hub__product-bar-copy">
                      <MaterialIcon name="smartphone" className="text-lg" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {hero.product_name ?? 'Featured product'}
                        </div>
                        <div className="text-[0.6875rem] text-emerald-700 font-semibold">View full story</div>
                      </div>
                    </div>
                    <span className="community-hub__mini-cta">
                      View Story
                      <MaterialIcon name="arrow_forward" className="text-[0.875rem]" />
                    </span>
                  </div>
                </div>
              </button>
            </article>
          ) : null}

          {compact ? (
            <article className="community-hub__card community-hub__card--compact">
              <button type="button" className="community-hub__compact-btn" onClick={() => onOpenReview(compact)}>
                <div className="community-hub__compact-top">
                  <span className="community-hub__glass-badge community-hub__glass-badge--static">
                    <MaterialIcon name="verified" className="text-[0.8125rem] text-emerald-600" />
                    Customer Unbox
                  </span>
                  <span className="community-hub__loc-pill">
                    <MaterialIcon name="location_on" className="text-[0.8125rem]" />
                    Kenya delivery
                  </span>
                </div>

                <div className="community-hub__compact-media">
                  {reviewImageUrl(compact) ? (
                    <CloudinaryImage
                      src={reviewImageUrl(compact)!}
                      alt={compact.product_name ?? 'Unboxing'}
                      preset="card"
                      fit="cover"
                      sizes="(max-width: 1024px) 100vw, 28vw"
                      className="community-hub__compact-img"
                      fill
                    />
                  ) : (
                    <div className="community-hub__media-fallback" />
                  )}
                  <div className="community-hub__compact-scrim" />
                  <div className="community-hub__compact-caption">
                    <span className="text-[var(--promo-lime,#9fe855)] font-bold">
                      {compact.product_name ?? 'Verified buy'}
                    </span>
                    <span className="text-neutral-300 text-[0.6875rem]">{formatRelative(compact.date_posted)}</span>
                  </div>
                </div>

                <div className="community-hub__compact-copy">
                  <div className="flex items-center gap-1">
                    <Stars rating={Number(compact.rating)} />
                    <span className="text-[0.6875rem] text-slate-400">Verified {Number(compact.rating).toFixed(1)}</span>
                  </div>
                  {compact.comment ? (
                    <p className="community-hub__compact-quote">
                      “{compact.comment.length > 110 ? `${compact.comment.slice(0, 107)}…` : compact.comment}”
                    </p>
                  ) : null}
                </div>

                <div className="community-hub__compact-footer">
                  <span className="flex items-center gap-1 text-xs font-bold text-slate-900">
                    <MaterialIcon name="bolt" className="text-base" />
                    {compact.product_name ?? 'Tagged product'}
                  </span>
                </div>
              </button>
            </article>
          ) : null}

          {inspection ? (
            <article className="community-hub__card community-hub__card--inspect">
              <button type="button" className="community-hub__inspect-btn" onClick={() => onOpenReview(inspection)}>
                <div className="community-hub__inspect-top">
                  <span className="community-hub__admin-stamp">
                    <MaterialIcon name="verified" className="text-xs text-[var(--promo-lime,#9fe855)]" />
                    {inspection.is_admin_review ? 'Admin Certified Inspection' : 'Verified Customer Review'}
                  </span>
                  <span className="community-hub__special">
                    {Number(inspection.rating).toFixed(1)}★
                  </span>
                </div>

                <div className="community-hub__inspect-grid">
                  <div className="community-hub__inspect-media">
                    {reviewImageUrl(inspection) ? (
                      <CloudinaryImage
                        src={reviewImageUrl(inspection)!}
                        alt={inspection.product_name ?? 'Inspection'}
                        preset="card"
                        fit="cover"
                        sizes="(max-width: 640px) 100vw, 20vw"
                        className="community-hub__inspect-img"
                        fill
                      />
                    ) : (
                      <div className="community-hub__media-fallback" />
                    )}
                    <div className="community-hub__inspect-scrim" />
                    <div className="community-hub__inspect-caption">
                      <span className="font-bold text-[var(--promo-lime,#9fe855)]">
                        {inspection.product_name ?? 'Unit'}
                      </span>
                      <span className="text-neutral-300">{formatRelative(inspection.date_posted)}</span>
                    </div>
                  </div>

                  <div className="community-hub__checklist">
                    <div className="community-hub__check">
                      <MaterialIcon name="check" className="text-[1rem] text-emerald-600" />
                      <span>Purchase story verified</span>
                    </div>
                    <div className="community-hub__check">
                      <MaterialIcon name="check" className="text-[1rem] text-emerald-600" />
                      <span>{inspection.product_condition || 'Condition documented'}</span>
                    </div>
                    <div className="community-hub__check">
                      <MaterialIcon name="check" className="text-[1rem] text-emerald-600" />
                      <span>
                        {inspection.customer_username
                          ? `Shared by ${inspection.customer_username}`
                          : 'Community-shared photos'}
                      </span>
                    </div>
                    {inspection.comment ? (
                      <p className="community-hub__inspect-quote">
                        “{inspection.comment.length > 90 ? `${inspection.comment.slice(0, 87)}…` : inspection.comment}”
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="community-hub__inspect-footer">
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      {inspection.product_name ?? 'Featured unit'}
                    </span>
                    <span className="text-[0.625rem] text-slate-500">Tap to open full review</span>
                  </div>
                  <span className="community-hub__mini-cta community-hub__mini-cta--solid">View Unit →</span>
                </div>
              </button>
            </article>
          ) : null}

          <article className="community-hub__card community-hub__card--pulse">
            <div className="community-hub__pulse-glow" aria-hidden />
            <div className="community-hub__pulse-header">
              <div className="flex items-center gap-2">
                <span className="community-hub__live-dot" aria-hidden>
                  <span className="community-hub__live-ping community-hub__live-ping--lime" />
                  <span className="community-hub__live-core community-hub__live-core--lime" />
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--promo-lime,#9fe855)]">
                  Live Community Pulse
                </span>
              </div>
              <span className="text-[0.6875rem] text-neutral-400 flex items-center gap-1">
                <MaterialIcon name="rate_review" className="text-[0.8125rem] text-[var(--promo-lime,#9fe855)]" />
                Recent buyer stories
              </span>
            </div>

            <div className="community-hub__pulse-list">
              {(pulseReviews.length > 0 ? pulseReviews : ranked.slice(0, 3)).map((review) => (
                <button
                  key={review.id}
                  type="button"
                  className="community-hub__pulse-row"
                  onClick={() => onOpenReview(review)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="community-hub__pulse-icon">
                      <MaterialIcon name="reviews" className="text-base" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-xs font-bold text-white truncate">
                        {review.customer_username || 'Verified buyer'} · {Number(review.rating).toFixed(1)}★
                      </div>
                      <div className="text-[0.6875rem] text-neutral-400 truncate">
                        {review.product_name ?? 'Product'} ·{' '}
                        {review.comment
                          ? review.comment.length > 48
                            ? `${review.comment.slice(0, 45)}…`
                            : review.comment
                          : 'Shared a review'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[0.6875rem] text-neutral-400 shrink-0 font-medium">
                    {formatRelative(review.date_posted)}
                  </span>
                </button>
              ))}
            </div>

            <div className="community-hub__pulse-footer">
              <div className="text-xs text-neutral-400">
                Showing live buyer feedback ·{' '}
                <span className="font-bold text-[var(--promo-lime,#9fe855)]">{countLabel}+ reviews</span>
              </div>
              <Link href="/reviews" className="community-hub__pulse-link">
                See all
                <MaterialIcon name="arrow_forward" className="text-xs" />
              </Link>
            </div>
          </article>
        </div>
      )}

      <div className="community-hub__footer-link">
        <Link href="/reviews" className="text-sm font-semibold text-slate-900 underline-offset-2 hover:underline">
          Browse the full reviews archive
        </Link>
      </div>
    </div>
  );
}
