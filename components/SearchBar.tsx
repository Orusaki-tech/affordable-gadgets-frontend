'use client';

import { useState, useEffect, useRef } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProductHref } from '@/lib/utils/productRoutes';

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data } = useProducts({
    search: searchQuery,
    page_size: 5,
  });

  const suggestions = data?.results || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="search-bar">
      <form onSubmit={handleSubmit} className="search-bar__form">
        <div className="search-bar__field">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(e.target.value.length > 0);
            }}
            onFocus={() => setIsOpen(searchQuery.length > 0 && suggestions.length > 0)}
            className="search-bar__input"
          />
          <button
            type="submit"
            className="search-bar__submit"
            aria-label="Search"
          >
            <svg className="search-bar__submit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Autocomplete Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="search-bar__suggestions">
          {suggestions.map((product) => (
            <Link
              key={product.id}
              href={getProductHref(product)}
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="search-bar__suggestion"
            >
              <div className="search-bar__suggestion-title">{product.product_name}</div>
              <div className="search-bar__suggestion-subtitle">
                {product.brand} {product.model_series && `• ${product.model_series}`}
              </div>
            </Link>
          ))}
          {searchQuery && (
            <Link
              href={`/products?search=${encodeURIComponent(searchQuery)}`}
              onClick={() => {
                setIsOpen(false);
              }}
              className="search-bar__view-all"
            >
              View all results for "{searchQuery}"
            </Link>
          )}
        </div>
      )}
    </div>
  );
}







