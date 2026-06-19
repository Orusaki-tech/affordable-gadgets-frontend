'use client';

import Link from 'next/link';
import {
  type BrandNavItem,
  brandCategoryHref,
  isBrandNavActive,
} from '@/lib/config/nav-links';

type HeaderBrandMenuProps = {
  brand: BrandNavItem;
  pathname: string;
  search: string;
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function ChevronIcon() {
  return (
    <svg
      className="site-header__nav-chevron"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function HeaderBrandMenu({
  brand,
  pathname,
  search,
  variant = 'desktop',
  onNavigate,
}: HeaderBrandMenuProps) {
  const active = isBrandNavActive(brand.brandFilter, pathname, search);

  if (variant === 'mobile') {
    return (
      <details className="site-header__mobile-details">
        <summary className="site-header__mobile-summary">{brand.navLabel}</summary>
        <div className="site-header__mobile-submenu site-header__mobile-submenu--brand">
          {brand.categories.map((cat) => (
            <Link
              key={`${brand.brandFilter}-${cat.label}`}
              href={brandCategoryHref(brand.brandFilter, cat.productType)}
              className="site-header__mobile-link site-header__mobile-link--sub"
              onClick={onNavigate}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </details>
    );
  }

  return (
    <div
      className={`site-header__brand-menu${active ? ' site-header__brand-menu--active' : ''}`}
    >
      <span className="site-header__nav-link site-header__nav-link--trigger" tabIndex={0}>
        {brand.navLabel}
        <ChevronIcon />
        <span className="site-header__nav-underline" />
      </span>
      <div className="site-header__brand-dropdown">
        {brand.categories.map((cat) => (
          <Link
            key={`${brand.brandFilter}-${cat.label}`}
            href={brandCategoryHref(brand.brandFilter, cat.productType)}
            className="site-header__brand-dropdown-link"
          >
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

type HeaderMoreBrandsMenuProps = {
  brands: BrandNavItem[];
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

export function HeaderMoreBrandsMenu({
  brands,
  variant = 'desktop',
  onNavigate,
}: HeaderMoreBrandsMenuProps) {
  if (variant === 'mobile') {
    return (
      <details className="site-header__mobile-details">
        <summary className="site-header__mobile-summary">More brands</summary>
        <div className="site-header__mobile-submenu">
          {brands.map((brand) => (
            <div key={brand.brandFilter} className="site-header__mobile-group">
              <span className="site-header__mobile-title">{brand.navLabel}</span>
              {brand.categories.map((cat) => (
                <Link
                  key={`${brand.brandFilter}-${cat.label}`}
                  href={brandCategoryHref(brand.brandFilter, cat.productType)}
                  className="site-header__mobile-link site-header__mobile-link--sub"
                  onClick={onNavigate}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </details>
    );
  }

  return (
    <div className="site-header__brand-menu site-header__brand-menu--more">
      <span className="site-header__nav-link site-header__nav-link--trigger" tabIndex={0}>
        More
        <ChevronIcon />
        <span className="site-header__nav-underline" />
      </span>
      <div className="site-header__brand-dropdown site-header__brand-dropdown--more">
        <div className="site-header__more-grid">
          {brands.map((brand) => (
            <div key={brand.brandFilter} className="site-header__more-column">
              <span className="site-header__more-brand-label">{brand.navLabel}</span>
              {brand.categories.map((cat) => (
                <Link
                  key={`${brand.brandFilter}-${cat.label}`}
                  href={brandCategoryHref(brand.brandFilter, cat.productType)}
                  className="site-header__brand-dropdown-link"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
