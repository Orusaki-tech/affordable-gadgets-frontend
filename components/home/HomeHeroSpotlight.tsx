'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PreOrderModal } from '@/components/PreOrderModal';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { brandConfig } from '@/lib/config/brand';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';
import { studioPath } from '@/lib/studio/paths';
import { getPromotionHref } from '@/lib/utils/promotionRoutes';

const HERO_PROMOTION_PLACEHOLDER_IMAGE =
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1773069898/pixel8_cd7p2f.png';
const HERO_AUTOPLAY_INTERVAL_MS = 6000;

const BUDGET_PRESETS = [
  { label: 'Under 20k', value: 20000 },
  { label: '20k–50k', value: 35000 },
  { label: 'Flagship', value: 100000 },
] as const;

function normalizeLocations(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function sortPromotions(promotions: PublicPromotion[]) {
  return [...promotions].sort((a, b) => {
    const aPos = a.carousel_position;
    const bPos = b.carousel_position;
    const aHasPos = typeof aPos === 'number';
    const bHasPos = typeof bPos === 'number';
    if (aHasPos && bHasPos) return aPos - bPos;
    if (aHasPos) return -1;
    if (bHasPos) return 1;
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
  });
}

function selectHomeHeroPromotions(promotions: PublicPromotion[]) {
  const featured = promotions.filter((promo) => {
    const locations = normalizeLocations(
      (promo as { display_locations?: unknown }).display_locations
    );
    return locations.includes('homepage_hero');
  });
  return sortPromotions(featured);
}

function resolveMediaUrl(image?: string | null): string | null {
  if (!image?.trim()) return null;
  if (image.startsWith('http')) return image;
  return `${brandConfig.apiBaseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
}

function getHeroBannerSrc(promotion: PublicPromotion | null): string | null {
  if (!promotion) return null;
  return (
    resolveMediaUrl(promotion.banner_image_url) ||
    resolveMediaUrl(promotion.banner_image) ||
    null
  );
}

function primaryCtaLabel(promotion: PublicPromotion | null): string {
  const title = promotion?.title?.trim() || '';
  if (/pre[-\s]?order/i.test(title)) return 'Pre Order Now';
  if (/early bird|campaign|launch/i.test(title)) return 'Learn more';
  return 'Shop offer';
}

type HomeHeroSpotlightProps = {
  initialPromotionsData?: PaginatedPublicPromotionList;
};

export function HomeHeroSpotlight({ initialPromotionsData }: HomeHeroSpotlightProps) {
  const router = useRouter();
  const studioEdit = useStudioEditOptional();
  const canEditPromos = Boolean(studioEdit?.capabilities.canEditPromotions);
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState(45000);
  const [preOrderOpen, setPreOrderOpen] = useState(false);
  const [bannerImageFailed, setBannerImageFailed] = useState(false);

  const { data: promotionsData } = usePromotions({
    page_size: 50,
    initialData: initialPromotionsData,
  });

  const promotions = useMemo(
    () => selectHomeHeroPromotions(promotionsData?.results ?? []),
    [promotionsData]
  );

  const promoIds = useMemo(
    () => promotions.map((p) => p.id).filter((id): id is number => typeof id === 'number'),
    [promotions]
  );
  const promoIdsKey = useMemo(() => promoIds.join('|'), [promoIds]);

  const [activePromotionId, setActivePromotionId] = useState<number | null>(() => {
    const firstId = selectHomeHeroPromotions(initialPromotionsData?.results ?? [])[0]?.id;
    return typeof firstId === 'number' ? firstId : null;
  });

  useEffect(() => {
    if (activePromotionId !== null) return;
    const firstId = promoIds[0];
    if (typeof firstId === 'number') setActivePromotionId(firstId);
  }, [activePromotionId, promoIds]);

  const rotationIndexRef = useRef(0);
  useEffect(() => {
    // Pause autoplay in Studio so editors control what they see.
    if (canEditPromos || promoIds.length <= 1) return;
    if (activePromotionId === null || !promoIds.includes(activePromotionId)) {
      setActivePromotionId(promoIds[0] ?? null);
      rotationIndexRef.current = 0;
    } else {
      rotationIndexRef.current = Math.max(0, promoIds.indexOf(activePromotionId));
    }
    const interval = window.setInterval(() => {
      rotationIndexRef.current = (rotationIndexRef.current + 1) % promoIds.length;
      setActivePromotionId(promoIds[rotationIndexRef.current] ?? null);
    }, HERO_AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [promoIdsKey, canEditPromos]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePromotion = useMemo(() => {
    if (!promotions.length) return null;
    if (activePromotionId === null) return promotions[0] ?? null;
    return promotions.find((p) => p.id === activePromotionId) ?? promotions[0] ?? null;
  }, [activePromotionId, promotions]);

  const activeBannerSrc = useMemo(() => getHeroBannerSrc(activePromotion), [activePromotion]);
  useEffect(() => {
    setBannerImageFailed(false);
  }, [activePromotionId, activeBannerSrc]);

  const displayBannerSrc =
    activeBannerSrc && !bannerImageFailed ? activeBannerSrc : HERO_PROMOTION_PLACEHOLDER_IMAGE;

  const detailsHref = useMemo(
    () => (activePromotion ? getPromotionHref(activePromotion) : studioPath('/products')),
    [activePromotion]
  );

  const budgetHref = useMemo(() => {
    if (budget <= 20000) return studioPath('/products?max_price=20000');
    if (budget <= 50000) return studioPath(`/products?min_price=20000&max_price=${budget}`);
    return studioPath(
      `/products?min_price=${Math.max(50000, budget - 20000)}&max_price=${budget + 20000}`
    );
  }, [budget]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? studioPath(`/products?search=${encodeURIComponent(q)}`) : studioPath('/products'));
  };

  return (
    <section className="home-redesign__hero ag-bleed ag-bleed--hero">
      <div className="ag-bleed__inner">
        <div className="home-redesign__hero-grid">
          <div className="home-redesign__hero-budget">
            {canEditPromos ? (
              <p className="studio-hero-budget-note" role="note">
                Budget finder is shop UI (not a promotion). Edit the banner on the right — that
                controls homepage hero creatives and placement.
              </p>
            ) : null}
            <form onSubmit={onSearch}>
              <div className="home-redesign__hero-search flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm sm:p-3.5">
                <MaterialIcon name="search" className="text-[1.35rem] text-secondary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="ag-type-body w-full bg-transparent outline-none"
                  aria-label="Search catalog"
                />
              </div>
            </form>

            <div>
              <h2 className="ag-type-h3">Search to start shopping</h2>
              <p className="ag-type-body mt-1 text-primary/75">
                Type a product name above — or set a budget and browse live stock.
              </p>
            </div>

            <div className="flex flex-1 flex-col rounded-xl bg-white/70 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="ag-type-eyebrow text-primary">Instant Budget Match</p>
                <p className="text-base font-bold text-primary">
                  KSh {budget.toLocaleString('en-KE')}
                </p>
              </div>
              <input
                type="range"
                min={10000}
                max={150000}
                step={5000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="mt-5 w-full accent-primary"
                aria-label="Budget amount"
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBudget(preset.value)}
                    className="ag-chip ag-chip--soft"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <p className="ag-type-body mt-5 text-primary/70">
                We’ll show phones and gadgets that fit this budget, in stock for pickup or delivery.
              </p>
              <Link href={budgetHref} className="ag-btn ag-btn--primary ag-btn--block mt-auto">
                Show devices in budget
                <MaterialIcon name="arrow_forward" className="text-[1rem]" />
              </Link>
            </div>
          </div>

          <div className="home-redesign__hero-banner-stack">
            <div className="home-redesign__hero-banner">
              {canEditPromos ? (
                <div className="studio-editable-card__chrome studio-hero-banner__chrome">
                  <button
                    type="button"
                    className="studio-icon-btn studio-icon-btn--edit"
                    title={`Edit homepage hero · ${studioEdit?.capabilities.roleLabel || 'Studio'}`}
                    aria-label={
                      activePromotion?.title
                        ? `Edit hero banner ${activePromotion.title}`
                        : 'Create or edit homepage hero banner'
                    }
                    onClick={() => {
                      if (activePromotion?.id) {
                        studioEdit?.openEditHomepageHero(activePromotion.id);
                      } else {
                        studioEdit?.openEditHomepageHero();
                      }
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                    </svg>
                    <span>{activePromotion?.id ? 'Edit banner' : 'Add banner'}</span>
                  </button>
                </div>
              ) : null}

              <div className="home-redesign__hero-banner-media">
                <CloudinaryImage
                  src={displayBannerSrc}
                  alt={activePromotion?.title ?? 'Featured promotion'}
                  preset="homepageHero"
                  fit="cover"
                  sizes="(max-width: 1023px) 100vw, 66vw"
                  className="home-redesign__hero-banner-img"
                  fill
                  priority
                  onError={() => setBannerImageFailed(true)}
                />
              </div>

              <div className="home-redesign__hero-banner-actions">
                <button
                  type="button"
                  onClick={() => setPreOrderOpen(true)}
                  className="ag-btn ag-btn--primary home-redesign__hero-cta home-redesign__hero-cta--primary"
                >
                  {primaryCtaLabel(activePromotion)}
                  <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
                </button>
                <Link
                  href={detailsHref}
                  className="ag-btn home-redesign__hero-cta home-redesign__hero-cta--secondary"
                >
                  View details
                </Link>
              </div>

              {promotions.length > 1 ? (
                <div className="studio-hero-banner__dots" role="tablist" aria-label="Hero banners">
                  {promotions.map((promo) => {
                    const id = promo.id;
                    if (typeof id !== 'number') return null;
                    const active = id === activePromotion?.id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`studio-hero-banner__dot${active ? ' studio-hero-banner__dot--active' : ''}`}
                        title={promo.title}
                        onClick={() => setActivePromotionId(id)}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>

            {canEditPromos ? (
              <div className="studio-hero-placement" role="region" aria-label="Homepage hero placement">
                <p className="studio-hero-placement__label">
                  Homepage hero carousel — order uses each promotion’s carousel position (1 = first).
                  Use <strong>Edit banner</strong> / <strong>Add banner</strong> to change creatives
                  in place.
                </p>
                {promotions.length === 0 ? (
                  <div className="studio-hero-placement__empty-row">
                    <p className="studio-hero-placement__empty">
                      No live Homepage hero promotions. The Pixel image is only a placeholder.
                      Create a new hero, or open Edit banner to revive an expired promotion (date
                      window must be active for it to appear on the storefront).
                    </p>
                    <button
                      type="button"
                      className="studio-icon-btn studio-icon-btn--edit"
                      onClick={() => studioEdit?.openEditHomepageHero()}
                    >
                      <span>Create homepage hero</span>
                    </button>
                  </div>
                ) : (
                  <ul className="studio-hero-placement__list">
                    {promotions.map((promo, index) => {
                      if (!promo.id) return null;
                      const isActive = promo.id === activePromotion?.id;
                      return (
                        <li key={promo.id}>
                          <button
                            type="button"
                            className={`studio-hero-placement__item${isActive ? ' studio-hero-placement__item--active' : ''}`}
                            onClick={() => {
                              setActivePromotionId(promo.id!);
                              studioEdit?.openEditHomepageHero(promo.id!);
                            }}
                          >
                            <span className="studio-hero-placement__pos">
                              #{promo.carousel_position ?? index + 1}
                            </span>
                            <span className="studio-hero-placement__title">{promo.title}</span>
                            <span className="studio-icon-btn studio-icon-btn--edit">
                              <span>Edit</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <PreOrderModal
        open={preOrderOpen}
        title={
          activePromotion?.title
            ? `${activePromotion.title}`
            : 'Request this offer'
        }
        subtitle="We will confirm deposit, pickup, or delivery options."
        onClose={() => setPreOrderOpen(false)}
      />
    </section>
  );
}
