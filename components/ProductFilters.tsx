'use client';

import { useEffect, useState } from 'react';

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
  const [budgetMin, setBudgetMin] = useState(initialFilters?.minPrice ?? '');
  const [budgetMax, setBudgetMax] = useState(initialFilters?.maxPrice ?? '');
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
    setBudgetMin(initialFilters.minPrice);
    setBudgetMax(initialFilters.maxPrice);
  }, [initialFilters]);

  useEffect(() => {
    if (autoOpen) {
      setIsOpen(true);
    }
  }, [autoOpen]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    onSortChange(value);
  };

  const clearFilters = () => {
    const emptyFilters: FilterState = {
      type: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
    };
    setFilters(emptyFilters);
    setBudgetMin('');
    setBudgetMax('');
    setSort('');
    onFiltersChange(emptyFilters);
    onSortChange('');
  };

  const handleBudgetApply = () => {
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
  };

  const handleBudgetReset = () => {
    const newFilters = {
      ...filters,
      minPrice: '',
      maxPrice: '',
    };
    setBudgetMin('');
    setBudgetMax('');
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div id="product-filters" className="mb-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 shadow-sm flex items-center gap-2 text-gray-700 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-600 text-white text-xs px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </button>

        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {(filters.type || filters.minPrice || filters.maxPrice || filters.brand || sort) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Filter products</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Product Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type.value || 'all'} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <input
                type="text"
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                placeholder="e.g., Apple, Samsung"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Budget Min (KES)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="0"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium mb-2">Budget Max (KES)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="100000"
                min="0"
                step="100"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleBudgetApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Apply Budget
            </button>
            {(filters.minPrice || filters.maxPrice || budgetMin || budgetMax) && (
              <button
                type="button"
                onClick={handleBudgetReset}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Budget
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}







