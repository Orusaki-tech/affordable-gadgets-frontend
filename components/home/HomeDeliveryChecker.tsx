'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';

function formatKes(value?: number | string | null) {
  if (value == null || value === '') return null;
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return null;
  return `KSh ${Math.round(num).toLocaleString('en-KE')}`;
}

const LIST_LIMIT = 5;

export function HomeDeliveryChecker() {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditDeliveryRates);
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['delivery-rates', 'homepage'],
    queryFn: () => ApiService.apiV1PublicDeliveryRatesList(1),
    staleTime: 5 * 60_000,
  });

  const rates = data?.results ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rates.slice(0, LIST_LIMIT);
    return rates
      .filter((rate) => {
        const hay = `${rate.county ?? ''} ${rate.ward ?? ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, LIST_LIMIT);
  }, [query, rates]);

  return (
    <section className="ag-section ag-section--end">
      <div className="home-section-panel">
        <div className="mb-5 max-w-2xl">
          <p className="ag-type-eyebrow text-secondary">
            Countrywide Logistics
          </p>
          <h2 className="ag-type-h2 mt-1">
            Check Delivery Rates
          </h2>
          <p className="ag-type-body mt-2">
            Search your county or ward to estimate shipping before checkout.
          </p>
          {canEdit && (
            <p className="mt-2 text-xs font-semibold text-primary">
              {studioEdit?.capabilities.editableSummary}{' '}
              <button
                type="button"
                className="studio-btn studio-btn--primary"
                style={{ marginLeft: 8 }}
                onClick={() => studioEdit?.openDeliveryRatesManager()}
              >
                Manage rates
              </button>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-surface-container-lowest p-3 shadow-sm">
          <MaterialIcon name="local_shipping" className="text-[1.375rem] text-secondary" />
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
            {filtered.map((rate) => {
              const label = `${rate.county ?? ''}${rate.ward ? ` · ${rate.ward}` : ''}`;
              const body = (
                <>
                  <span className="font-medium text-primary">
                    {rate.county}
                    {rate.ward ? (
                      <span className="font-normal text-secondary"> · {rate.ward}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-bold text-on-surface">
                    {formatKes(rate.price) || 'See checkout'}
                  </span>
                </>
              );

              if (!canEdit || !rate.id) {
                return (
                  <li
                    key={rate.id ?? `${rate.county}-${rate.ward}-${rate.price}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    {body}
                  </li>
                );
              }

              return (
                <li
                  key={rate.id}
                  className="studio-editable-card relative flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="studio-editable-card__chrome" aria-label="Studio actions">
                    <button
                      type="button"
                      className="studio-icon-btn"
                      title={`Edit ${label} · ${studioEdit?.capabilities.roleLabel || 'Order Manager'}`}
                      aria-label={`Edit delivery rate ${label}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void studioEdit?.openEditDeliveryRate(rate.id!);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                      </svg>
                    </button>
                  </div>
                  {body}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
