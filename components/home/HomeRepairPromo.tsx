'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';

const DEVICE_TYPES = ['Phone', 'Tablet', 'Laptop', 'Accessory'] as const;

const COMMON_ISSUES = [
  'Cracked / damaged screen',
  'Battery replacement',
  'Charging / power issues',
  'Water damage',
  'Camera issues',
  "Software / won't turn on",
] as const;

export function HomeRepairPromo() {
  const [deviceType, setDeviceType] = useState<(typeof DEVICE_TYPES)[number]>('Phone');
  const [issue, setIssue] = useState<(typeof COMMON_ISSUES)[number]>(COMMON_ISSUES[0]);

  const repairHref = useMemo(() => {
    const params = new URLSearchParams({
      deviceType,
      issue,
    });
    return `/repair?${params.toString()}`;
  }, [deviceType, issue]);

  return (
    <section className="ag-bleed ag-bleed--dark ag-bleed--spaced">
      <div className="ag-bleed__inner grid grid-cols-1 gap-6 text-white lg:grid-cols-2">
        <div>
          <p className="ag-type-eyebrow inline-flex items-center gap-1.5 text-promo-lime">
            <MaterialIcon name="build" className="text-[0.875rem]" />
            Repair services available
          </p>
          <h2 className="ag-type-h2 ag-type-h2--on-dark mt-2">
            Device repair booking
          </h2>
          <p className="ag-type-body mt-3 text-white/75">
            Screens, batteries, charging ports, and more — for phones, tablets, laptops, and
            accessories we sell. iPhone battery replacements have listed prices; other repairs get
            a quote on WhatsApp after diagnosis.
          </p>
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Common repairs
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Screen', 'Battery', 'Charging', 'Water damage'].map((label) => (
                <span key={label} className="ag-tag ag-tag--on-dark">
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/repair" className="ag-btn ag-btn--lime">
              Book a repair
              <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
            </Link>
            <Link href="/repair#iphone-battery-prices" className="ag-btn ag-btn--ghost">
              iPhone battery prices
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60">
            Device type
            <select
              value={deviceType}
              onChange={(e) =>
                setDeviceType(e.target.value as (typeof DEVICE_TYPES)[number])
              }
              className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm text-white outline-none"
            >
              {DEVICE_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[var(--obsidian-dark)] text-white">
                  {type}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
              What needs fixing?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_ISSUES.map((option) => {
                const selected = option === issue;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setIssue(option)}
                    className={`rounded-full border px-3 py-1.5 text-left text-xs font-semibold transition ${
                      selected
                        ? 'border-promo-lime bg-promo-lime text-primary'
                        : 'border-white/15 bg-white/5 text-white/80 hover:border-white/30'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[0.625rem] uppercase tracking-wider text-white/50">Devices</p>
              <p className="mt-1 text-sm font-bold text-promo-lime">Ones we sell</p>
            </div>
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[0.625rem] uppercase tracking-wider text-white/50">Quote</p>
              <p className="mt-1 text-sm font-bold text-promo-lime">On WhatsApp</p>
            </div>
            <div className="rounded-xl bg-black/30 p-3">
              <p className="text-[0.625rem] uppercase tracking-wider text-white/50">Drop-off</p>
              <p className="mt-1 text-sm font-bold text-promo-lime">CBD Nairobi</p>
            </div>
          </div>

          <Link href={repairHref} className="ag-btn ag-btn--lime ag-btn--block mt-5">
            Continue repair request
            <MaterialIcon name="arrow_forward" className="text-[1.125rem]" />
          </Link>
          <p className="mt-3 text-[0.6875rem] text-white/50">
            See listed iPhone battery prices on the repair page — other jobs are quoted after
            diagnosis on WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
