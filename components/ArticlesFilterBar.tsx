'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ARTICLE_HUBS, type ArticleHub } from '@/lib/blog/articleHubs';
import { buildArticlesPath } from '@/lib/blog/articleFilters';

interface Props {
  brands: string[];
  activeHub?: ArticleHub;
}

export function ArticlesFilterBar({ brands, activeHub }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';
  const brand = searchParams.get('brand') || '';

  const [searchInput, setSearchInput] = useState(search);

  const applyFilters = useCallback(
    (params: { search?: string; brand?: string }, hub?: ArticleHub) => {
      router.push(
        buildArticlesPath(
          {
            search: params.search,
            brand: params.brand,
            productType: hub?.code,
          },
          hub,
        ),
      );
    },
    [router],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      applyFilters({ search: searchInput, brand }, activeHub);
    },
    [searchInput, brand, activeHub, applyFilters],
  );

  const handleBrandChange = useCallback(
    (value: string) => {
      applyFilters({ search: searchInput, brand: value }, activeHub);
    },
    [searchInput, activeHub, applyFilters],
  );

  const sortedBrands = useMemo(() => [...brands].sort((a, b) => a.localeCompare(b)), [brands]);

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildArticlesPath({ search, brand })}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !activeHub
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
          }`}
        >
          All guides
        </Link>
        {ARTICLE_HUBS.map((hub) => (
          <Link
            key={hub.slug}
            href={buildArticlesPath({ search, brand }, hub)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeHub?.slug === hub.slug
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
            }`}
          >
            {hub.label}
          </Link>
        ))}
      </div>

      {sortedBrands.length > 0 && (
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
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
