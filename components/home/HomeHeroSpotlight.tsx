'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PreOrderModal } from '@/components/PreOrderModal';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';

const IPHONE_18_PRO_MAX_SLUG = 'apple-iphone-18-pro-max';
const IPHONE_HERO_IMAGE =
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1788773195/products-banners/iphone.jpg';

const BUDGET_PRESETS = [
  { label: 'Under 20k', value: 20000, href: '/products?max_price=20000' },
  { label: '20k–50k', value: 35000, href: '/products?min_price=20000&max_price=50000' },
  { label: 'Flagship', value: 100000, href: '/products?min_price=80000' },
] as const;

export function HomeHeroSpotlight() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState(45000);
  const [preOrderOpen, setPreOrderOpen] = useState(false);

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

  const whatsappWaitlist = getBusinessWhatsAppUrl(
    'Hi — I want to join the iPhone 18 Pro Max waiting list for early discounts.'
  );

  return (
    <section className="home-redesign__hero mx-auto max-w-[1400px] px-4 pt-6 lg:px-6 lg:pt-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Left: search + live preview + budget matcher */}
        <div className="flex flex-col gap-4 rounded-2xl bg-promo-lime p-5 shadow-sm sm:p-6 lg:col-span-4">
          <form onSubmit={onSearch}>
            <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm">
              <MaterialIcon name="search" className="text-[20px] text-secondary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search catalog"
              />
            </div>
          </form>

          <div className="rounded-xl bg-white p-3 shadow-sm">
            <div className="flex gap-3">
              <div
                className="h-20 w-16 shrink-0 rounded-lg bg-surface-muted bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${IPHONE_HERO_IMAGE}')` }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Featured match
                </p>
                <p className="truncate text-sm font-bold text-primary">Apple iPhone 18 Pro Max</p>
                <p className="text-xs text-secondary">Pre-order · Out Sept 9</p>
                <button
                  type="button"
                  onClick={() => setPreOrderOpen(true)}
                  className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-[11px] font-bold text-promo-lime"
                >
                  Pre-order Now
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-primary">Search to start shopping</h2>
            <p className="mt-1 text-sm text-primary/75">
              Type a product name above and we&apos;ll surface matches — or use Instant Budget Match.
            </p>
          </div>

          <div className="rounded-xl bg-white/70 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Instant Budget Match
              </p>
              <p className="text-sm font-bold text-primary">
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
              className="mt-3 w-full accent-primary"
              aria-label="Budget amount"
            />
            <div className="mt-3 flex flex-wrap gap-2">
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
            <Link
              href={budgetHref}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-promo-lime"
            >
              Show devices in budget
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </Link>
          </div>
        </div>

        {/* Right: dominant banner with CTAs pinned bottom-left above the art */}
        <div className="relative min-h-[420px] overflow-hidden rounded-2xl bg-surface-canvas shadow-sm sm:min-h-[480px] lg:col-span-8 lg:min-h-[520px]">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('${IPHONE_HERO_IMAGE}')` }}
            aria-hidden
          />
          {/* Soft left wash so copy/CTAs stay readable without covering the banner */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/55 to-transparent"
            aria-hidden
          />

          <div className="relative z-10 flex h-full min-h-[420px] flex-col p-6 sm:min-h-[480px] sm:p-8 lg:min-h-[520px] lg:p-10">
            <div className="max-w-md">
              <div className="flex flex-wrap gap-2">
                <span className="ag-chip ag-chip--sm ag-chip--dark uppercase tracking-wider">
                  Authorized Stockist Launch
                </span>
                <span className="ag-chip ag-chip--sm ag-chip--ghost uppercase tracking-wider shadow-sm">
                  Global Release Window: September 2026
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-secondary">Out September 9</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                Apple iPhone 18 Pro Max
              </h2>

              <p className="mt-3 max-w-sm text-sm text-secondary">
                Note: WhatsApp us to join our waiting list for early discounts.
              </p>
              <a
                href={whatsappWaitlist}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-whatsapp-emerald"
              >
                <MaterialIcon name="chat" className="text-[16px]" />
                Direct WhatsApp Concierge
              </a>

              <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <MaterialIcon name="verified" className="text-[16px] text-stock-green" />
                  Genuine Apple KE IMEI
                </span>
                <span className="inline-flex items-center gap-1">
                  <MaterialIcon name="swap_horiz" className="text-[16px] text-stock-green" />
                  Trade-in Supported
                </span>
              </div>
            </div>

            {/* CTAs: bottom-left, above banner art */}
            <div className="relative z-20 mt-auto flex flex-wrap items-center gap-3 pt-8">
              <button
                type="button"
                onClick={() => setPreOrderOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#f5e642] px-6 py-3.5 text-sm font-bold text-primary shadow-md"
              >
                Pre Order Now
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </button>
              <Link
                href={`/products/${IPHONE_18_PRO_MAX_SLUG}`}
                className="inline-flex items-center rounded-xl border border-border-strong bg-white/95 px-5 py-3.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm"
              >
                View details
              </Link>
            </div>

            <p className="relative z-20 mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
              Norwich Union House Hub — Nairobi CBD
            </p>
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
