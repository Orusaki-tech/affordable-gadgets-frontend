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
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">Compare</h3>
        <span className="text-xs text-gray-600">{count} / {maxItems} selected</span>
      </div>
      <p className="text-xs text-gray-500 mb-2">Search and add up to {maxItems} products.</p>

          <input
            type="text"
        placeholder="Search products to compare..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-2 space-y-2">
        {trimmedQuery.length === 0 ? (
          <p className="text-[11px] text-gray-500">Start typing to see suggestions.</p>
        ) : isLoading ? (
          <div className="text-xs text-gray-500">Searching…</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((product) => {
            const inCompare = product.id !== undefined && compareList.includes(product.id);
            return (
              <div
                key={product.id}
                className="flex items-center justify-between gap-2 text-xs border border-gray-100 rounded px-2 py-2 bg-white"
              >
                <span className="truncate">{product.product_name}</span>
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
                  className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                >
                  {inCompare ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-[11px] text-gray-500">No products found.</p>
        )}
      </div>

      {count > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => removeProduct(product.id)}
                className="text-[11px] px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                title="Remove from compare"
              >
                {product.product_name} ×
              </button>
            ))}
          </div>
          <button
            onClick={clearCompare}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1"
          >
            Clear selection
          </button>
        </div>
      )}

      {count > 0 && (
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {selectedProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg bg-white p-3 shadow-sm min-w-[220px]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{product.product_name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {[product.brand, product.model_series].filter(Boolean).join(' • ') || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeProduct(product.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                    title="Remove from comparison"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 space-y-2 text-xs text-gray-700">
                  {comparisonRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                      <span className="text-gray-500">{row.label}</span>
                      <span className="text-right">{row.render(product)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
