'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ARTICLE_HUBS, type ArticleProductTypeCode } from '@/lib/blog/articleHubs';
import { buildArticlesPath, resolveHubFromParam } from '@/lib/blog/articleFilters';

interface Props {
  brands: string[];
}

export function ArticlesFilterBar({ brands }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const brand = searchParams.get('brand') || '';
  const activeType = resolveHubFromParam(searchParams.get('type') || undefined)?.code;

  const [searchInput, setSearchInput] = useState(search);

  const applyFilters = useCallback(
    (params: { search?: string; brand?: string; productType?: ArticleProductTypeCode }) => {
      router.push(
        buildArticlesPath({
          search: params.search,
          brand: params.brand,
          productType: params.productType,
        }),
      );
    },
    [router],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyFilters({ search: searchInput, brand, productType: activeType });
    },
    [searchInput, brand, activeType, applyFilters],
  );

  const handleBrandChange = useCallback(
    (value: string) => {
      applyFilters({ search: searchInput, brand: value, productType: activeType });
    },
    [searchInput, activeType, applyFilters],
  );

  const sortedBrands = useMemo(() => [...brands].sort((a, b) => a.localeCompare(b)), [brands]);

  return (
    <div className="mb-8 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Category</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={buildArticlesPath({ search, brand })}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeType
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
            }`}
          >
            All guides
          </Link>
          {ARTICLE_HUBS.map((hub) => (
            <Link
              key={hub.code}
              href={buildArticlesPath({ search, brand, productType: hub.code })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeType === hub.code
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              {hub.label}
            </Link>
          ))}
        </div>
      </div>

      {sortedBrands.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Brand</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBrandChange('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !brand
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
              }`}
            >
              All brands
            </button>
            {sortedBrands.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleBrandChange(item)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  brand === item
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search guides..."
          className="flex-1 min-w-[220px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
