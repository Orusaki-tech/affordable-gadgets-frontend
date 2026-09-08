'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/MaterialIcon';
import { PreOrderModal } from '@/components/PreOrderModal';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';

const IPHONE_18_PRO_MAX_SLUG = 'apple-iphone-18-pro-max';
const IPHONE_HERO_IMAGE =
  'https://res.cloudinary.com/dhgaqa2gb/image/upload/v1788773195/products-banners/iphone.jpg';

const BUDGET_PILLS = [
  { label: 'Under KSh 20,000', href: '/products?max_price=20000' },
  { label: 'KSh 20,000 – 40,000', href: '/products?min_price=20000&max_price=40000' },
  { label: 'KSh 40,000 – 80,000', href: '/products?min_price=40000&max_price=80000' },
  { label: 'Above KSh 80,000', href: '/products?min_price=80000' },
] as const;

export function HomeHeroSpotlight() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [preOrderOpen, setPreOrderOpen] = useState(false);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <section className="home-redesign__hero mx-auto max-w-[1400px] px-4 pt-6 lg:px-6 lg:pt-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-promo-lime p-5 shadow-sm sm:p-6 lg:col-span-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary/70">Start here</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Search to start shopping
            </h2>
            <p className="mt-2 text-sm text-primary/80">
              Find verified phones, laptops, and accessories — or jump by budget.
            </p>
          </div>

          <form onSubmit={onSearch} className="mt-6 space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-surface-container-lowest p-2.5 shadow-sm">
              <MaterialIcon name="search" className="text-[20px] text-secondary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="iPhone 15, Pixel, MacBook…"
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search catalog"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-promo-lime"
              >
                Go
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {BUDGET_PILLS.map((pill) => (
                <Link
                  key={pill.href}
                  href={pill.href}
                  className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary hover:text-promo-lime"
                >
                  {pill.label}
                </Link>
              ))}
            </div>
          </form>

          <a
            href={getBusinessWhatsAppUrl('Hi — I need help picking a device.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-promo-lime"
          >
            <MaterialIcon name="chat" className="text-[18px]" />
            Ask on WhatsApp
          </a>
        </div>

        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-surface-canvas p-6 shadow-sm sm:p-8 lg:col-span-8 lg:p-10">
          <div className="relative z-10 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <MaterialIcon name="new_releases" className="text-[16px] text-badge-bundle-orange" />
              Out September 9
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-primary sm:text-4xl lg:text-5xl">
              Apple iPhone 18 Pro Max
            </h2>
            <p className="mt-3 text-sm text-secondary sm:text-base">
              Pre-order the next flagship from Affordable Gadgets KE. Walk-in and delivery options
              available across Kenya.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPreOrderOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-promo-lime"
              >
                Pre Order
                <MaterialIcon name="arrow_forward" className="text-[18px]" />
              </button>
              <Link
                href={`/products/${IPHONE_18_PRO_MAX_SLUG}`}
                className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-white px-5 py-3 text-sm font-semibold text-primary"
              >
                View details
              </Link>
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-[55%] bg-contain bg-right bg-no-repeat opacity-90"
            style={{ backgroundImage: `url('${IPHONE_HERO_IMAGE}')` }}
            aria-hidden
          />
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
