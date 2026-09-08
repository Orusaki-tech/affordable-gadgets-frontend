import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';

const BANDS = [
  {
    label: 'Under KSh 20,000',
    href: '/products?max_price=20000',
    hint: 'Entry phones & accessories',
    icon: 'savings',
  },
  {
    label: 'KSh 20,000 – 40,000',
    href: '/products?min_price=20000&max_price=40000',
    hint: 'Everyday smartphones',
    icon: 'smartphone',
  },
  {
    label: 'KSh 40,000 – 80,000',
    href: '/products?min_price=40000&max_price=80000',
    hint: 'Flagship-ready midrange',
    icon: 'devices',
  },
  {
    label: 'Above KSh 80,000',
    href: '/products?min_price=80000',
    hint: 'Pro phones & laptops',
    icon: 'workspace_premium',
  },
] as const;

export function HomeBudgetMatcher() {
  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 lg:px-6">
      <div className="rounded-2xl bg-surface-canvas p-6 sm:p-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Dynamic Catalog Finder
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Smart Phone Budget Matcher
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Pick a price band and we&apos;ll show live stock that fits your budget.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BANDS.map((band) => (
            <Link
              key={band.href}
              href={band.href}
              className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm transition hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-promo-lime text-primary">
                <MaterialIcon name={band.icon} className="text-[22px]" />
              </span>
              <span>
                <span className="block text-sm font-bold text-primary">{band.label}</span>
                <span className="block text-xs text-secondary">{band.hint}</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-5">
          <Link href="/budget-search" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
            Open full budget search
          </Link>
        </div>
      </div>
    </section>
  );
}
