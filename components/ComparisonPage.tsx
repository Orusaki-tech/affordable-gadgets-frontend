'use client';

import { useState } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import { useCompare } from '@/lib/hooks/useCompare';

export function ComparisonPage() {
  const { compareList, addProduct, removeProduct, clearCompare, count, maxItems } = useCompare();
  const [searchQuery, setSearchQuery] = useState('');
  const trimmedQuery = searchQuery.trim();

  const { data: productsData, isLoading } = useProducts({
    page_size: 10,
    search: trimmedQuery || undefined,
    enabled: trimmedQuery.length >= 2,
  });

  const suggestions = productsData?.results ?? [];

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-gray-900">Compare</h3>
        <span className="text-xs text-gray-600">{count} / {maxItems} selected</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">Search and add up to {maxItems} products.</p>

      <input
        type="text"
        placeholder="Search products to compare..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-3 space-y-2">
        {trimmedQuery.length < 2 ? (
          <p className="text-[11px] text-gray-500">Type at least 2 characters to search.</p>
        ) : isLoading ? (
          <div className="text-xs text-gray-500">Searching…</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((product) => {
            const inCompare = product.id !== undefined && compareList.includes(product.id);
            return (
              <div key={product.id} className="flex items-center justify-between gap-2 text-xs border border-gray-100 rounded px-2 py-2">
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
        <button
          onClick={clearCompare}
          className="mt-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded px-2 py-1"
        >
          Clear selection
        </button>
      )}
    </div>
  );
}
