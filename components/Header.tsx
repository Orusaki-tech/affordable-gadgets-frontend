'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/lib/hooks/useCart';
import { brandConfig } from '@/lib/config/brand';
import { SearchBar } from './SearchBar';
import { clearAuthToken } from '@/lib/api/openapi';
import { AuthChoiceModal } from './AuthChoiceModal';

export function Header() {
  const { itemCount } = useCart();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
  ];

  const productCategories = [
    { name: 'Phones', code: 'PH' },
    { name: 'Laptops', code: 'LT' },
    { name: 'Tablets', code: 'TB' },
    { name: 'Accessories', code: 'AC' },
  ];

  const { data: menuBrands, isLoading: isMenuBrandsLoading } = useQuery({
    queryKey: ['menu-brands'],
    queryFn: async () => {
      const response = await fetch(
        `${brandConfig.apiBaseUrl}/api/v1/public/products/brands/`,
        {
          headers: {
            'X-Brand-Code': brandConfig.code,
          },
        }
      );

      if (!response.ok) {
        return { results: {} as Record<string, string[]> };
      }

      return (await response.json()) as { results: Record<string, string[]> };
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('auth_token'));
    };
    readAuth();
    const handleAuthChange = () => readAuth();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'auth_token') {
        setIsLoggedIn(!!event.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-token-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, []);

  return (
    <header className="site-header">
      <div className="site-header__container">
        <div className="site-header__bar">
          {/* Logo */}
          <Link 
            href="/" 
            className="site-header__logo-link"
          >
            <div className="site-header__logo-wrap">
              <Image 
                src="/affordablelogo.png" 
                alt={`${brandConfig.name} logo`}
                width={80}
                height={80}
                className="site-header__logo"
                priority
              /> 
            </div>
            
            {/* Logo Text - Hidden on mobile/tablet, visible on desktop */}
            <span className="site-header__logo-text">
              {brandConfig.name}
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="site-header__search site-header__search--desktop">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <nav className="site-header__nav">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="site-header__nav-link"
              >
                {link.label}
                <span className="site-header__nav-underline"></span>
              </Link>
            ))}

            <div className="site-header__products">
              <Link
                href="/products"
                className="site-header__nav-link"
              >
                Products
                <span className="site-header__nav-underline"></span>
              </Link>

              <div className="site-header__dropdown">
                <div className="site-header__dropdown-container">
                  <div className="site-header__dropdown-panel">
                  <div className="site-header__dropdown-grid">
                    {productCategories.map((category) => {
                      const brands = menuBrands?.results?.[category.code] ?? [];
                      return (
                        <div key={category.code} className="site-header__dropdown-group">
                          <Link
                            href={`/products?type=${category.code}`}
                            className="site-header__dropdown-title"
                          >
                            {category.name}
                          </Link>
                          <div className="site-header__dropdown-list">
                            {isMenuBrandsLoading ? (
                              <p className="site-header__dropdown-muted">Loading brands...</p>
                            ) : brands.length > 0 ? (
                              brands.map((brand) => (
                                <Link
                                  key={brand}
                                  href={`/products?type=${category.code}&brand=${encodeURIComponent(brand)}`}
                                  className="site-header__dropdown-link"
                                >
                                  {brand}
                                </Link>
                              ))
                            ) : (
                              <Link
                                href={`/products?type=${category.code}`}
                                className="site-header__dropdown-link site-header__dropdown-link--muted"
                              >
                                Browse all {category.name}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="site-header__dropdown-footer">
                    <Link
                      href="/products"
                      className="site-header__dropdown-cta"
                    >
                      View all products →
                    </Link>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="site-header__cart"
          >
            <svg className="site-header__cart-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="site-header__cart-badge">
                {itemCount}
              </span>
            )}
            <span className="site-header__cart-label">Cart</span>
          </Link>

          {/* Account Icon (last icon in the header) */}
          {isLoggedIn ? (
            <div className="site-header__account-menu">
              <button
                type="button"
                className="site-header__account"
                aria-label="Account menu (logged in)"
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              >
                <svg className="site-header__account-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M12 22a10 10 0 100-20 10 10 0 000 20z"
                  />
                </svg>
                <span className="site-header__account-status site-header__account-status--on" />
              </button>
              {isAccountMenuOpen && (
                <div className="site-header__account-dropdown">
                  <Link href="/cart" className="site-header__account-item">
                    My Orders
                  </Link>
                  <button
                    type="button"
                    className="site-header__account-item"
                    onClick={() => {
                      clearAuthToken();
                      setIsLoggedIn(false);
                      setIsAccountMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              className="site-header__account"
              aria-label="Login or create account"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <svg className="site-header__account-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232a3 3 0 11-4.464 4.064 3 3 0 014.464-4.064zM4 19a8 8 0 0116 0"
                />
              </svg>
              <span className="site-header__account-status" />
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="site-header__menu-button"
            aria-label="Toggle menu"
          >
            <svg
              className="site-header__menu-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Search */}
        <div className="site-header__search site-header__search--mobile">
          <SearchBar />
        </div>

        {isAuthModalOpen && (
          <AuthChoiceModal
            onClose={() => setIsAuthModalOpen(false)}
            onGuestProceed={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('guest_checkout', '1');
              }
              setIsAuthModalOpen(false);
              router.push('/cart');
            }}
            onAuthSuccess={() => {
              setIsLoggedIn(true);
              setIsAuthModalOpen(false);
            }}
          />
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="site-header__mobile-menu">
            <div className="site-header__mobile-list">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="site-header__mobile-link"
                >
                  {link.label}
                </Link>
              ))}

              <details className="site-header__mobile-details">
                <summary className="site-header__mobile-summary">
                  Products
                </summary>
                <div className="site-header__mobile-submenu">
                  {productCategories.map((category) => {
                    const brands = menuBrands?.results?.[category.code] ?? [];
                    return (
                      <div key={category.code} className="site-header__mobile-group">
                        <Link
                          href={`/products?type=${category.code}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="site-header__mobile-title"
                        >
                          {category.name}
                        </Link>
                        <div className="site-header__mobile-brands">
                          {isMenuBrandsLoading ? (
                            <p className="site-header__mobile-muted">Loading brands...</p>
                          ) : brands.length > 0 ? (
                            brands.map((brand) => (
                              <Link
                                key={brand}
                                href={`/products?type=${category.code}&brand=${encodeURIComponent(brand)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="site-header__mobile-brand"
                              >
                                {brand}
                              </Link>
                            ))
                          ) : (
                            <p className="site-header__mobile-muted">No brands yet</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

