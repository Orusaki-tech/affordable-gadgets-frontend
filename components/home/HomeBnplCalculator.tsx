'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OpenAPI } from '@/lib/api/generated';
import { MaterialIcon } from '@/components/MaterialIcon';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { studioPath } from '@/lib/studio/paths';
import {
  BUYSIMU_DEPOSIT_MAX,
  BUYSIMU_DEPOSIT_MIN,
  type BuysimuPlanTerm,
  depositForTerm,
  findOffersForDeposit,
  formatKes,
  weeklyForTerm,
} from '@/lib/financing/buysimuCatalog';

const FALLBACK_PARTNERS = ['BuySimu', 'MoPhones'] as const;
const TERM_OPTIONS: BuysimuPlanTerm[] = [12, 24];
const DEFAULT_DEPOSIT = 20_000;
const MATCH_LIMIT = 8;

type PublicFinancingProvider = {
  id: number;
  name: string;
  slug?: string;
  logo_url?: string | null;
};

async function fetchPublicFinancingProviders(): Promise<PublicFinancingProvider[]> {
  const base = OpenAPI.BASE.replace(/\/+$/, '');
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(typeof OpenAPI.HEADERS === 'function'
      ? await OpenAPI.HEADERS({} as never)
      : (OpenAPI.HEADERS ?? {})),
  };
  const res = await fetch(`${base}/api/v1/public/financing/providers/`, {
    credentials: 'omit',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Financing providers request failed: ${res.status}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

function clampDeposit(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DEPOSIT;
  return Math.min(BUYSIMU_DEPOSIT_MAX, Math.max(BUYSIMU_DEPOSIT_MIN, Math.round(value)));
}

export function HomeBnplCalculator() {
  const studioEdit = useStudioEditOptional();
  const canEdit = Boolean(studioEdit?.capabilities.canEditFinancing);
  const [depositBudget, setDepositBudget] = useState(DEFAULT_DEPOSIT);
  const [term, setTerm] = useState<BuysimuPlanTerm>(12);

  const { data: providers = [] } = useQuery({
    queryKey: ['financing-providers', 'public'],
    queryFn: fetchPublicFinancingProviders,
    staleTime: 5 * 60_000,
  });

  const matches = useMemo(
    () => findOffersForDeposit(depositBudget, term),
    [depositBudget, term]
  );
  const visibleMatches = matches.slice(0, MATCH_LIMIT);
  const extraCount = Math.max(0, matches.length - visibleMatches.length);

  return (
    <section className="ag-bleed ag-bleed--dark ag-bleed--spaced">
      <div className="ag-bleed__inner text-white">
        <div className="max-w-3xl">
          <p className="ag-type-eyebrow inline-flex items-center gap-1.5 text-promo-lime">
            <MaterialIcon name="payments" className="text-[0.875rem]" />
            Lipa Mdogo Mdogo Available
          </p>
          <h2 className="ag-type-h2 ag-type-h2--on-dark mt-2">
            Buy Now, Pay Later (BNPL) Calculator
          </h2>
          <p className="ag-type-body mt-3 text-white/75">
            Enter the deposit you can pay today. We&apos;ll show BuySimu iPhones that fit that
            budget, with weekly installments from certified Kenyan financing partners.
          </p>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Financing Partners
            </p>
            {canEdit && (
              <p className="mt-1 text-[0.6875rem] text-white/55">
                {studioEdit?.capabilities.editableSummary}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {providers.length > 0
                ? providers.map((provider) => {
                    const tag = (
                      <span className="ag-tag ag-tag--on-dark">{provider.name}</span>
                    );
                    if (!canEdit || !provider.id) return <span key={provider.id}>{tag}</span>;
                    return (
                      <StudioBlockChrome
                        key={provider.id}
                        label={provider.name}
                        roleHint={studioEdit?.capabilities.roleLabel}
                        onEdit={() => {
                          void studioEdit?.openEditFinancingProvider(provider.id);
                        }}
                      >
                        {tag}
                      </StudioBlockChrome>
                    );
                  })
                : FALLBACK_PARTNERS.map((partner) => (
                    <span key={partner} className="ag-tag ag-tag--on-dark">
                      {partner}
                    </span>
                  ))}
            </div>
          </div>
        </div>

        {/* Top controls row: deposit left, matches + term right */}
        <div className="mt-6 rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.4fr)_auto_auto] lg:items-end">
            <div className="min-w-0">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                Your deposit budget (KSh)
                <input
                  type="number"
                  min={BUYSIMU_DEPOSIT_MIN}
                  max={BUYSIMU_DEPOSIT_MAX}
                  step={500}
                  value={depositBudget}
                  onChange={(e) => setDepositBudget(clampDeposit(Number(e.target.value) || 0))}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
                />
              </label>

              <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/60">
                Deposit {formatKes(depositBudget)}
                <input
                  type="range"
                  min={BUYSIMU_DEPOSIT_MIN}
                  max={BUYSIMU_DEPOSIT_MAX}
                  step={500}
                  value={depositBudget}
                  onChange={(e) => setDepositBudget(clampDeposit(Number(e.target.value)))}
                  className="mt-3 w-full accent-promo-lime"
                />
                <span className="mt-1 flex justify-between text-[0.625rem] font-normal normal-case tracking-normal text-white/40">
                  <span>{formatKes(BUYSIMU_DEPOSIT_MIN)}</span>
                  <span>{formatKes(BUYSIMU_DEPOSIT_MAX)}</span>
                </span>
              </label>
            </div>

            <div className="rounded-xl bg-black/30 px-5 py-4 text-center lg:min-w-[8.5rem]">
              <p className="text-[0.625rem] uppercase tracking-wider text-white/50">Matches</p>
              <p className="mt-1 text-2xl font-bold text-promo-lime">{matches.length}</p>
            </div>

            <div className="rounded-xl bg-black/30 px-5 py-4 text-center lg:min-w-[10rem]">
              <p className="text-[0.625rem] uppercase tracking-wider text-white/50">Term</p>
              <div className="mt-2 flex justify-center gap-2">
                {TERM_OPTIONS.map((weeks) => {
                  const active = term === weeks;
                  return (
                    <button
                      key={weeks}
                      type="button"
                      onClick={() => setTerm(weeks)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-promo-lime text-black'
                          : 'bg-white/10 text-white/75 hover:bg-white/15'
                      }`}
                    >
                      {weeks} wks
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Full-width results */}
        <div className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Phones in your budget
            </p>
            <Link href={studioPath('/financing')} className="ag-btn ag-btn--lime">
              Browse financing devices
              <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
            </Link>
          </div>

          {visibleMatches.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white/5 p-4 text-sm text-white/65">
              No BuySimu plans fit {formatKes(depositBudget)} on a {term}-week term. Try a higher
              deposit or a different term.
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMatches.map((offer) => {
                const requiredDeposit = depositForTerm(offer, term);
                const weekly = weeklyForTerm(offer, term);
                return (
                  <li key={offer.id} className="rounded-xl bg-white/5 px-3 py-3 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{offer.model}</p>
                        <p className="mt-0.5 text-[0.6875rem] text-white/55">{offer.specs}</p>
                      </div>
                      <p className="shrink-0 text-[0.6875rem] text-white/50">
                        Cash {formatKes(offer.cashPrice)}
                      </p>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-black/30 px-2 py-1.5">
                        <p className="text-[0.5625rem] uppercase tracking-wider text-white/45">
                          Deposit
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-promo-lime">
                          {formatKes(requiredDeposit)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/30 px-2 py-1.5">
                        <p className="text-[0.5625rem] uppercase tracking-wider text-white/45">
                          / Week
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-promo-lime">
                          {weekly != null ? formatKes(weekly) : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-black/30 px-2 py-1.5">
                        <p className="text-[0.5625rem] uppercase tracking-wider text-white/45">
                          Term
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-white">{term} wks</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {extraCount > 0 && (
            <p className="mt-3 text-[0.6875rem] text-white/50">
              +{extraCount} more on the{' '}
              <Link
                href={studioPath('/financing')}
                className="text-promo-lime underline-offset-2 hover:underline"
              >
                financing page
              </Link>
              .
            </p>
          )}

          <p className="mt-3 text-[0.6875rem] text-white/50">
            BuySimu list prices — final approval and stock confirmed by financing partners.
          </p>
        </div>
      </div>
    </section>
  );
}
