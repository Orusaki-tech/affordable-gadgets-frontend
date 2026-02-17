'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ProductFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  onSortChange: (sort: string) => void;
  initialFilters?: FilterState;
  autoOpen?: boolean;
}

export interface FilterState {
  type: string;
  minPrice: string;
  maxPrice: string;
  brand: string;
}

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'product_name', label: 'Name (A-Z)' },
  { value: '-product_name', label: 'Name (Z-A)' },
  { value: 'min_price', label: 'Price (Low to High)' },
  { value: '-min_price', label: 'Price (High to Low)' },
  { value: '-available_units_count', label: 'Most Available' },
];

const PRODUCT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'PH', label: 'Phones' },
  { value: 'LT', label: 'Laptops' },
  { value: 'TB', label: 'Tablets' },
  { value: 'AC', label: 'Accessories' },
];

function FunnelIcon() {
  return (
    <svg className="product-filters__funnel-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="product-filters__search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="product-filters__arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="product-filters__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function ProductFilters({
  onFiltersChange,
  onSortChange,
  initialFilters,
  autoOpen,
}: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters ?? {
      type: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
    }
  );
  const [budgetMin, setBudgetMin] = useState(initialFilters?.minPrice ?? '0');
  const [budgetMax, setBudgetMax] = useState(initialFilters?.maxPrice ?? '100000');
  const [sort, setSort] = useState('');
  const [isOpen, setIsOpen] = useState(Boolean(autoOpen));
  const activeFilterCount = [
    filters.type,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!initialFilters) {
      return;
    }
    setFilters(initialFilters);
    setBudgetMin(initialFilters.minPrice || '0');
    setBudgetMax(initialFilters.maxPrice || '100000');
  }, [initialFilters]);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      type: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
    };
    setFilters(emptyFilters);
    setBudgetMin('0');
    setBudgetMax('100000');
    setSort('');
    onFiltersChange(emptyFilters);
    onSortChange('');
  };

  const applyFilters = () => {
    const minValue = budgetMin.trim();
    const maxValue = budgetMax.trim();
    const min = minValue ? parseFloat(minValue) : null;
    const max = maxValue ? parseFloat(maxValue) : null;

    if (min !== null && Number.isNaN(min)) {
      alert('Please enter a valid minimum price');
      return;
    }

    if (max !== null && Number.isNaN(max)) {
      alert('Please enter a valid maximum price');
      return;
    }

    if ((min ?? 0) < 0 || (max ?? 0) < 0) {
      alert('Prices cannot be negative');
      return;
    }

    if (min !== null && max !== null && max < min) {
      alert('Maximum price must be greater than or equal to minimum price');
      return;
    }

    const newFilters = {
      ...filters,
      minPrice: minValue,
      maxPrice: maxValue,
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
    onSortChange(sort);
    setIsOpen(false);
  };

  const closeModal = () => setIsOpen(false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal();
  };

  return (
    <div id="product-filters" className="product-filters">
      <button
        onClick={() => setIsOpen(true)}
        className="product-filters__toggle"
      >
        <FunnelIcon />
        Filters
        {activeFilterCount > 0 && (
          <span className="product-filters__count">{activeFilterCount}</span>
        )}
      </button>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="product-filters__overlay"
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-filters-title"
          >
            <div className="product-filters__modal" onClick={(e) => e.stopPropagation()}>
              <div className="product-filters__modal-header">
                <h2 id="product-filters-title" className="product-filters__modal-title">
                  <FunnelIcon />
                  Filter Products
                </h2>
                <div className="product-filters__modal-header-actions">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="product-filters__clear-all"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="product-filters__close-btn"
                    aria-label="Close filters"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="product-filters__modal-body">
                <div className="product-filters__row">
                  <div className="product-filters__field">
                    <label className="product-filters__label">Sort by</label>
                    <select
                      value={sort}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="product-filters__input product-filters__select"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="product-filters__field">
                    <label className="product-filters__label">Product Type</label>
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="product-filters__input product-filters__select"
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type.value || 'all'} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="product-filters__field">
                  <label className="product-filters__label">Brand</label>
                  <div className="product-filters__input-wrap product-filters__input-wrap--search">
                    <SearchIcon />
                    <input
                      type="text"
                      value={filters.brand}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      placeholder="Apple, Samsung"
                      className="product-filters__input"
                    />
                  </div>
                </div>

                <div className="product-filters__row product-filters__row--price">
                  <div className="product-filters__field">
                    <label className="product-filters__label">Min</label>
                    <div className="product-filters__input-wrap product-filters__input-wrap--kes">
                      <span className="product-filters__kes-prefix">KES</span>
                      <input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="100"
                        className="product-filters__input product-filters__input--number"
                      />
                    </div>
                  </div>
                  <span className="product-filters__price-sep" aria-hidden>–</span>
                  <div className="product-filters__field">
                    <label className="product-filters__label">Max</label>
                    <div className="product-filters__input-wrap product-filters__input-wrap--kes">
                      <span className="product-filters__kes-prefix">KES</span>
                      <input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        placeholder="100,000"
                        min="0"
                        step="100"
                        className="product-filters__input product-filters__input--number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-filters__modal-footer">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="product-filters__apply-btn"
                >
                  Apply Filters
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
