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
    <section className="ag-section">
      <div className="home-section-panel">
        <div className="mb-6 max-w-2xl">
          <p className="ag-type-eyebrow text-secondary">
            Dynamic Catalog Finder
          </p>
          <h2 className="ag-type-h2 mt-1">
            Smart Phone Budget Matcher
          </h2>
          <p className="ag-type-body mt-2">
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
                <MaterialIcon name={band.icon} className="text-[1.375rem]" />
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
