'use client';

import { useMemo, useState } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import { useCompare } from '@/lib/hooks/useCompare';
import { formatPrice } from '@/lib/utils/format';

export function ComparisonPage() {
  const { compareList, addProduct, removeProduct, clearCompare, count, maxItems } = useCompare();
  const [searchQuery, setSearchQuery] = useState('');
  const trimmedQuery = searchQuery.trim();

  const { data: searchResults, isLoading } = useProducts({
    page_size: 8,
    search: trimmedQuery || undefined,
    enabled: trimmedQuery.length >= 1,
  });

  const { data: allProductsData } = useProducts({
    page_size: 60,
  });

  const allProducts = allProductsData?.results ?? [];
  const suggestions = searchResults?.results ?? [];

  const selectedProducts = useMemo(() => {
    return compareList.map((id) => {
      const product = allProducts.find((p) => p.id === id);
      return {
        id,
        product_name: product?.product_name ?? `Product #${id}`,
        brand: product?.brand ?? null,
        model_series: product?.model_series ?? null,
        min_price: product?.min_price ?? null,
        max_price: product?.max_price ?? null,
        available_units_count: product?.available_units_count ?? null,
        interest_count: product?.interest_count ?? null,
      };
    });
  }, [compareList, allProducts]);

  const comparisonRows = [
    {
      label: 'Product Name',
      render: (p: (typeof selectedProducts)[number]) => p.product_name || 'N/A',
    },
    {
      label: 'Brand',
      render: (p: (typeof selectedProducts)[number]) => p.brand || 'N/A',
    },
    {
      label: 'Model/Series',
      render: (p: (typeof selectedProducts)[number]) => p.model_series || 'N/A',
    },
    {
      label: 'Price Range',
      render: (p: (typeof selectedProducts)[number]) => {
        if (p.min_price === null || p.max_price === null) return 'N/A';
        return p.min_price === p.max_price
          ? formatPrice(p.min_price)
          : `${formatPrice(p.min_price)} - ${formatPrice(p.max_price)}`;
      },
    },
    {
      label: 'Available Units',
      render: (p: (typeof selectedProducts)[number]) =>
        p.available_units_count !== null ? String(p.available_units_count) : 'N/A',
    },
    {
      label: 'Interest Count',
      render: (p: (typeof selectedProducts)[number]) =>
        p.interest_count !== null ? String(p.interest_count) : 'N/A',
    },
  ];

  return (
    <div className="comparison-page">
      <div className="comparison-page__header">
        <h3 className="comparison-page__title">Compare</h3>
        <span className="comparison-page__count">{count} / {maxItems} selected</span>
      </div>
      <p className="comparison-page__hint">Search and add up to {maxItems} products.</p>

      <input
        type="text"
        placeholder="Search products to compare..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="comparison-page__input"
      />

      <div className="comparison-page__suggestions">
        {trimmedQuery.length === 0 ? (
          <p className="comparison-page__empty">Start typing to see suggestions.</p>
        ) : isLoading ? (
          <div className="comparison-page__loading">Searching…</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((product) => {
            const inCompare = product.id !== undefined && compareList.includes(product.id);
            return (
              <div
                key={product.id}
                className="comparison-page__suggestion"
              >
                <span className="comparison-page__suggestion-name">{product.product_name}</span>
                <button
                  onClick={() => {
                    if (product.id === undefined) return;
                    if (inCompare) {
                      removeProduct(product.id);
                    } else if (compareList.length < maxItems) {
                      addProduct(product.id);
                    }
                  }}
                  disabled={product.id === undefined || (!inCompare && compareList.length >= maxItems)}
                  className="comparison-page__suggestion-action"
                >
                  {inCompare ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })
        ) : (
          <p className="comparison-page__empty">No products found.</p>
        )}
      </div>

      {count > 0 && (
        <div className="comparison-page__selected">
          <div className="comparison-page__selected-list">
            {selectedProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => removeProduct(product.id)}
                className="comparison-page__selected-item"
                title="Remove from compare"
              >
                {product.product_name} ×
              </button>
            ))}
          </div>
          <button
            onClick={clearCompare}
            className="comparison-page__clear"
          >
            Clear selection
          </button>
        </div>
      )}

      {count > 0 && (
        <div className="comparison-page__table-wrapper">
          <table className="comparison-page__table">
            <thead>
              <tr className="comparison-page__table-head-row">
                <th className="comparison-page__table-head-cell comparison-page__table-head-cell--sticky">
                  Feature
                </th>
                {selectedProducts.map((product) => (
                  <th key={product.id} className="comparison-page__table-head-cell">
                    <div className="comparison-page__table-head-content">
                      <span className="comparison-page__table-head-title">{product.product_name}</span>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="comparison-page__remove"
                        title="Remove from comparison"
                      >
                        <svg className="comparison-page__remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="comparison-page__table-row">
                  <td className="comparison-page__table-cell comparison-page__table-cell--sticky">
                    {row.label}
                  </td>
                  {selectedProducts.map((product) => (
                    <td key={product.id} className="comparison-page__table-cell">
                      {row.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
