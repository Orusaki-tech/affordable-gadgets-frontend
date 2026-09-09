'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PreOrderModal } from '@/components/PreOrderModal';
import { brandConfig } from '@/lib/config/brand';
import { usePromotions } from '@/lib/hooks/usePromotions';
import type { PaginatedPublicPromotionList, PublicPromotion } from '@/lib/api/generated';

const IPHONE_18_PRO_MAX_SLUG = 'apple-iphone-18-pro-max';
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

type HomeHeroSpotlightProps = {
  initialPromotionsData?: PaginatedPublicPromotionList;
};

export function HomeHeroSpotlight({ initialPromotionsData }: HomeHeroSpotlightProps) {
  const router = useRouter();
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
    if (promoIds.length <= 1) return;
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
  }, [promoIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const budgetHref = useMemo(() => {
    if (budget <= 20000) return '/products?max_price=20000';
    if (budget <= 50000) return `/products?min_price=20000&max_price=${budget}`;
    return `/products?min_price=${Math.max(50000, budget - 20000)}&max_price=${budget + 20000}`;
  }, [budget]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <section className="home-redesign__hero ag-bleed ag-bleed--hero">
      {/* Explicit 1fr / 2fr on desktop — budget ~33%, banner ~66% */}
      <div className="ag-bleed__inner">
        <div className="home-redesign__hero-grid">
        <div className="home-redesign__hero-budget">
          <form onSubmit={onSearch}>
            <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm sm:p-3.5">
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
              <p className="ag-type-eyebrow text-primary">
                Instant Budget Match
              </p>
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
            <Link
              href={budgetHref}
              className="ag-btn ag-btn--primary ag-btn--block mt-auto"
            >
              Show devices in budget
              <MaterialIcon name="arrow_forward" className="text-[1rem]" />
            </Link>
          </div>
        </div>

        <div className="home-redesign__hero-banner">
          <div className="home-redesign__hero-banner-media">
            <CloudinaryImage
              src={displayBannerSrc}
              alt={activePromotion?.title ?? 'Featured promotion'}
              preset="homepageHero"
              fit="contain"
              sizes="(max-width: 768px) 100vw, 66vw"
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
              className="ag-btn inline-flex items-center gap-2 rounded-xl bg-[#f5e642] font-bold text-primary shadow-md"
            >
              Pre Order Now
              <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
            </button>
            <Link
              href={`/products/${IPHONE_18_PRO_MAX_SLUG}`}
              className="ag-btn ag-btn--ghost inline-flex items-center border border-border-strong bg-white/95 font-semibold text-primary shadow-sm backdrop-blur-sm"
            >
              View details
            </Link>
          </div>
        </div>
        </div>
      </div>

      <PreOrderModal
        open={preOrderOpen}
        title="Pre-order iPhone 18 Pro Max"
        subtitle="Secure your unit — we will confirm deposit and pickup or delivery options."
        onClose={() => setPreOrderOpen(false)}
      />
    </section>
  );
}
