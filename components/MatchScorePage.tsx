'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import { useProductUnits } from '@/lib/hooks/useProducts';
import { calculateMatchScores, MatchCriteria, ProductForMatching } from '@/lib/utils/matchScore';
import { PublicProduct } from '@/lib/api/generated';
import { formatPrice } from '@/lib/utils/format';
import Link from 'next/link';
import { getProductHref } from '@/lib/utils/productRoutes';

export function MatchScorePage() {
  const [criteria, setCriteria] = useState<MatchCriteria>({
    priceMin: undefined,
    priceMax: undefined,
    storage: [],
    ram: [],
    condition: [],
    mustBeInStock: false,
  });
  const [results, setResults] = useState<any[]>([]);
  const { data: productsData } = useProducts({ page_size: 40 });

  const handleCalculate = () => {
    if (!productsData) return;

    // Fetch units for all products (simplified - in production, you'd batch this)
    const unitsMap: Record<number, any[]> = {};
    // This is a simplified version - in production, you'd need to fetch units for each product
    // For now, we'll use empty arrays as placeholders

    const productsForMatching: ProductForMatching[] = productsData.results
      .filter((p): p is PublicProduct & { id: number } => p.id !== undefined)
      .map((p) => ({
        id: p.id,
        product_name: p.product_name,
        min_price: p.min_price ?? null,
        max_price: p.max_price ?? null,
        available_units_count: p.available_units_count ?? 0,
      }));

    const matchResults = calculateMatchScores(productsForMatching, criteria, unitsMap);

    setResults(matchResults.slice(0, 10)); // Top 10 matches
  };

  return (
    <div className="match-score">
      <h1 className="match-score__title section-label">Find Your Perfect Match</h1>

      {/* Criteria Form */}
      <div className="match-score__panel">
        <h2 className="match-score__panel-title">Your Preferences</h2>
        <div className="match-score__grid">
          {/* Price Range */}
          <div className="match-score__field">
            <label className="match-score__label">Price Range (KES)</label>
            <div className="match-score__row">
              <input
                type="number"
                placeholder="Min"
                value={criteria.priceMin || ''}
                onChange={(e) =>
                  setCriteria({ ...criteria, priceMin: e.target.value ? Number(e.target.value) : undefined })
                }
                className="match-score__input"
              />
              <input
                type="number"
                placeholder="Max"
                value={criteria.priceMax || ''}
                onChange={(e) =>
                  setCriteria({ ...criteria, priceMax: e.target.value ? Number(e.target.value) : undefined })
                }
                className="match-score__input"
              />
            </div>
          </div>

          {/* Storage */}
          <div className="match-score__field">
            <label className="match-score__label">Storage (GB)</label>
            <div className="match-score__chips">
              {[64, 128, 256, 512, 1024].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    const newStorage = criteria.storage?.includes(size)
                      ? criteria.storage.filter((s) => s !== size)
                      : [...(criteria.storage || []), size];
                    setCriteria({ ...criteria, storage: newStorage });
                  }}
                  className={`match-score__chip ${criteria.storage?.includes(size) ? 'match-score__chip--active' : ''}`}
                >
                  {size}GB
                </button>
              ))}
            </div>
          </div>

          {/* RAM */}
          <div className="match-score__field">
            <label className="match-score__label">RAM (GB)</label>
            <div className="match-score__chips">
              {[4, 6, 8, 12, 16].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    const newRam = criteria.ram?.includes(size)
                      ? criteria.ram.filter((r) => r !== size)
                      : [...(criteria.ram || []), size];
                    setCriteria({ ...criteria, ram: newRam });
                  }}
                  className={`match-score__chip ${criteria.ram?.includes(size) ? 'match-score__chip--active' : ''}`}
                >
                  {size}GB
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="match-score__field">
            <label className="match-score__label">Condition</label>
            <div className="match-score__chips">
              {['New', 'Refurbished', 'Used'].map((cond) => (
                <button
                  key={cond}
                  onClick={() => {
                    const newCondition = criteria.condition?.includes(cond)
                      ? criteria.condition.filter((c) => c !== cond)
                      : [...(criteria.condition || []), cond];
                    setCriteria({ ...criteria, condition: newCondition });
                  }}
                  className={`match-score__chip ${criteria.condition?.includes(cond) ? 'match-score__chip--active' : ''}`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Must be in stock */}
          <div className="match-score__checkbox">
            <input
              type="checkbox"
              id="mustBeInStock"
              checked={criteria.mustBeInStock}
              onChange={(e) => setCriteria({ ...criteria, mustBeInStock: e.target.checked })}
              className="match-score__checkbox-input"
            />
            <label htmlFor="mustBeInStock" className="match-score__checkbox-label">
              Must be in stock
            </label>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          className="match-score__submit"
        >
          Find Matches
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="match-score__results">
          <h2 className="match-score__results-title">Top Matches</h2>
          <div className="match-score__results-list">
            {results.map((result) => (
              <div
                key={result.product.id}
                className="match-score__card"
              >
                <div className="match-score__card-header">
                  <div className="match-score__card-main">
                    <Link
                      href={getProductHref(result.product)}
                      className="match-score__card-title"
                    >
                      {result.product.product_name}
                    </Link>
                    <p className="match-score__card-subtitle">
                      {result.product.brand} {result.product.model_series}
                    </p>
                    {result.product.min_price !== null && result.product.max_price !== null && (
                      <p className="match-score__card-price">
                        {formatPrice(result.product.min_price)} - {formatPrice(result.product.max_price)}
                      </p>
                    )}
                  </div>
                  <div className="match-score__score">
                    <div className="match-score__score-value">{result.score}%</div>
                    <div className="match-score__score-label">Match Score</div>
                  </div>
                </div>
                <div className="match-score__breakdown">
                  <div className="match-score__breakdown-item">
                    <div className="match-score__breakdown-label">Price</div>
                    <div className="match-score__breakdown-value">{result.breakdown.price}%</div>
                  </div>
                  <div className="match-score__breakdown-item">
                    <div className="match-score__breakdown-label">Specs</div>
                    <div className="match-score__breakdown-value">{result.breakdown.specs}%</div>
                  </div>
                  <div className="match-score__breakdown-item">
                    <div className="match-score__breakdown-label">Availability</div>
                    <div className="match-score__breakdown-value">{result.breakdown.availability}%</div>
                  </div>
                  <div className="match-score__breakdown-item">
                    <div className="match-score__breakdown-label">Rating</div>
                    <div className="match-score__breakdown-value">{result.breakdown.rating}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}







