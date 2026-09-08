'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';

const PARTNERS = ['Lipa Later', 'Aspira KE', 'Craft Silicon'] as const;

export function HomeBnplCalculator() {
  const [devicePrice, setDevicePrice] = useState(80000);
  const [depositPercent, setDepositPercent] = useState(20);
  const [weeks, setWeeks] = useState(12);

  const { deposit, financed, weekly } = useMemo(() => {
    const price = Math.max(0, devicePrice);
    const depositValue = Math.round((price * depositPercent) / 100);
    const financedValue = Math.max(0, price - depositValue);
    const weeklyValue = weeks > 0 ? Math.ceil(financedValue / weeks) : financedValue;
    return { deposit: depositValue, financed: financedValue, weekly: weeklyValue };
  }, [devicePrice, depositPercent, weeks]);

  return (
    <section className="ag-bleed ag-bleed--dark ag-bleed--spaced">
      <div className="ag-bleed__inner grid grid-cols-1 gap-6 text-white lg:grid-cols-2">
        <div>
          <p className="ag-type-eyebrow inline-flex items-center gap-1.5 text-promo-lime">
            <MaterialIcon name="payments" className="text-[0.875rem]" />
            Lipa Mdogo Mdogo Available
          </p>
          <h2 className="ag-type-h2 ag-type-h2--on-dark mt-2">
            Buy Now, Pay Later (BNPL) Calculator
          </h2>
          <p className="ag-type-body mt-3 text-white/75">
            Get instant device financing through certified Kenyan fintech partners. Pick your
            smartphone price, set your upfront deposit, and estimate weekly installments.
          </p>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Financing Partners
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PARTNERS.map((partner) => (
                <span key={partner} className="ag-tag ag-tag--on-dark">
                  {partner}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/financing"
            className="ag-btn ag-btn--lime mt-6"
          >
            Browse financing devices
            <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
          </Link>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Device price (KSh)
            <input
              type="number"
              min={5000}
              step={1000}
              value={devicePrice}
              onChange={(e) => setDevicePrice(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
            />
          </label>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Deposit {depositPercent}%
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={depositPercent}
              onChange={(e) => setDepositPercent(Number(e.target.value))}
              className="mt-3 w-full accent-promo-lime"
            />
          </label>

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Term {weeks} weeks
            <input
              type="range"
              min={4}
              max={24}
              step={1}
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="mt-3 w-full accent-promo-lime"
            />
          </label>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Deposit</p>
              <p className="mt-1 text-sm font-bold text-promo-lime">
                KSh {deposit.toLocaleString('en-KE')}
              </p>
            </div>
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Financed</p>
              <p className="mt-1 text-sm font-bold">KSh {financed.toLocaleString('en-KE')}</p>
            </div>
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/50">Est. / week</p>
              <p className="mt-1 text-sm font-bold text-promo-lime">
                KSh {weekly.toLocaleString('en-KE')}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-white/50">
            Estimates only — final terms are confirmed by financing partners on the financing page.
          </p>
        </div>
      </div>
    </section>
  );
}
