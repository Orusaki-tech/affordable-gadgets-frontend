'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';
import { MaterialIcon } from '@/components/MaterialIcon';

function formatKes(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return null;
  return `KSh ${Math.round(num).toLocaleString('en-KE')}`;
}

export function HomeDeliveryChecker() {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['delivery-rates', 'homepage'],
    queryFn: () => ApiService.apiV1PublicDeliveryRatesList(1),
    staleTime: 5 * 60_000,
  });

  const rates = data?.results ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rates.slice(0, 8);
    return rates
      .filter((rate) => {
        const hay = `${rate.county ?? ''} ${rate.ward ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [query, rates]);

  return (
    <section className="mx-auto mt-14 mb-8 max-w-[1400px] px-4 lg:px-6">
      <div className="rounded-2xl bg-surface-canvas p-6 sm:p-8">
        <div className="mb-5 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Countrywide Logistics
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Check Delivery Rates
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Search your county or ward to estimate shipping before checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-surface-container-lowest p-3 shadow-sm">
          <MaterialIcon name="local_shipping" className="text-[22px] text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Nairobi, Mombasa, Kisumu…"
            className="w-full bg-transparent text-sm outline-none"
            aria-label="Search delivery location"
          />
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-secondary">Loading delivery rates…</p>
        ) : isError ? (
          <p className="mt-4 text-sm text-secondary">
            Delivery rates are available at checkout. Visit the cart to see fees for your location.
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-secondary">
            No matching locations. Try another county or ward, or message us on WhatsApp.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border-hairline overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
            {filtered.map((rate) => (
              <li
                key={rate.id ?? `${rate.county}-${rate.ward}-${rate.price}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="font-medium text-primary">
                  {rate.county}
                  {rate.ward ? (
                    <span className="font-normal text-secondary"> · {rate.ward}</span>
                  ) : null}
                </span>
                <span className="shrink-0 font-bold text-on-surface">
                  {formatKes(rate.price) || 'See checkout'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
