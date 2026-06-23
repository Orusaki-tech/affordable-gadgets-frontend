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
  isMegaOpen?: boolean;
  onMegaOpen?: () => void;
};

export function HeaderBrandMenu({
  brand,
  pathname,
  search,
  variant = 'desktop',
  onNavigate,
  isMegaOpen = false,
  onMegaOpen,
}: HeaderBrandMenuProps) {
  const active = isBrandNavActive(brand.brandFilter, pathname, search);
  const brandHref = brandCategoryHref(brand.brandFilter, null);

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
      className={`site-header__brand-menu${
        active || isMegaOpen ? ' site-header__brand-menu--active' : ''
      }`}
      onMouseEnter={onMegaOpen}
      onFocus={onMegaOpen}
    >
      <Link
        href={brandHref}
        className={`site-header__nav-link${
          active || isMegaOpen ? ' site-header__nav-link--active' : ''
        }`}
        aria-expanded={isMegaOpen}
        aria-haspopup="true"
        onMouseEnter={onMegaOpen}
        onFocus={onMegaOpen}
      >
        {brand.navLabel}
        <span className="site-header__nav-underline" />
      </Link>
    </div>
  );
}

type HeaderMoreBrandsMenuProps = {
  brands: BrandNavItem[];
  variant?: 'desktop' | 'mobile';
  onNavigate?: () => void;
  isMegaOpen?: boolean;
  onMegaOpen?: () => void;
};

export function HeaderMoreBrandsMenu({
  brands,
  variant = 'desktop',
  onNavigate,
  isMegaOpen = false,
  onMegaOpen,
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
    <div
      className={`site-header__brand-menu site-header__brand-menu--more${
        isMegaOpen ? ' site-header__brand-menu--active' : ''
      }`}
      onMouseEnter={onMegaOpen}
      onFocus={onMegaOpen}
    >
      <Link
        href="/products"
        className={`site-header__nav-link${isMegaOpen ? ' site-header__nav-link--active' : ''}`}
        aria-expanded={isMegaOpen}
        aria-haspopup="true"
        onMouseEnter={onMegaOpen}
        onFocus={onMegaOpen}
      >
        More
        <span className="site-header__nav-underline" />
      </Link>
    </div>
  );
}
