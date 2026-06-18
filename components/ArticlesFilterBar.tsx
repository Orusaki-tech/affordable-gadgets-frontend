'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

interface ProductOption {
  slug: string;
  name: string;
}

interface Props {
  products: ProductOption[];
}

export function ArticlesFilterBar({ products }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const productSlug = searchParams.get('product_slug') || '';

  const [searchInput, setSearchInput] = useState(search);

  const applyFilters = useCallback(
    (params: { search?: string; product_slug?: string }) => {
      const sp = new URLSearchParams();
      if (params.search) sp.set('search', params.search);
      if (params.product_slug) sp.set('product_slug', params.product_slug);
      const qs = sp.toString();
      router.push(qs ? `/articles?${qs}` : '/articles');
    },
    [router]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyFilters({ search: searchInput, product_slug: productSlug });
    },
    [searchInput, productSlug, applyFilters]
  );

  const handleProductChange = useCallback(
    (value: string) => {
      applyFilters({ search: searchInput, product_slug: value });
    },
    [searchInput, applyFilters]
  );

  const sorted = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  return (
    <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 mb-8">
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search articles..."
        className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <select
        value={productSlug}
        onChange={(e) => handleProductChange(e.target.value)}
        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">All products</option>
        {sorted.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
