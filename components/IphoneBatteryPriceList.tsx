'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  IPHONE_BATTERY_REPLACEMENT_PRICES,
  formatRepairKes,
  repairBatteryBookingHref,
} from '@/lib/repair/iphoneBatteryPrices';

export function IphoneBatteryPriceList() {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return IPHONE_BATTERY_REPLACEMENT_PRICES;
    return IPHONE_BATTERY_REPLACEMENT_PRICES.filter((row) =>
      row.model.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <section
      id="iphone-battery-prices"
      className="repair-page__prices"
      aria-labelledby="iphone-battery-prices-title"
    >
      <div className="repair-page__prices-header">
        <div>
          <p className="repair-page__prices-eyebrow">Apple · Battery</p>
          <h2 id="iphone-battery-prices-title" className="repair-page__prices-title">
            iPhone battery replacement prices
          </h2>
          <p className="repair-page__prices-sub">
            Listed rates for drop-off at our Nairobi CBD shop. Confirm on WhatsApp before we start
            work — parts and labour may vary after inspection.
          </p>
        </div>
        <label className="repair-page__prices-search">
          <span className="sr-only">Search iPhone model</span>
          <input
            type="search"
            className="checkout-modal__input"
            placeholder="Search model… e.g. 13 Pro"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="repair-page__prices-table-wrap">
        <table className="repair-page__prices-table">
          <thead>
            <tr>
              <th scope="col">Phone</th>
              <th scope="col">Price</th>
              <th scope="col">
                <span className="sr-only">Book</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.model}>
                <th scope="row">{row.model}</th>
                <td>{formatRepairKes(row.priceKes)}</td>
                <td>
                  <Link
                    href={repairBatteryBookingHref(row.model)}
                    className="repair-page__prices-book"
                  >
                    Book
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="repair-page__prices-empty">No models match that search.</p>
        ) : null}
      </div>
    </section>
  );
}
