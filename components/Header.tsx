'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { brandConfig } from '@/lib/config/brand';
import { clearAuthToken } from '@/lib/api/openapi';
import { createClient } from '@/lib/supabase/client';
import { AuthChoiceModal } from './AuthChoiceModal';

export function Header() {
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentSearch, setCurrentSearch] = useState('');

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products?type=PH&brand_filter=Apple', label: 'iPhone' },
    { href: '/products?type=PH&brand_filter=Samsung', label: 'Samsung' },
    { href: '/products?type=PH&brand_filter=Google', label: 'Google' },
    { href: '/products?type=PH&brand_filter=Sony', label: 'Sony' },
    { href: '/products?type=AC', label: 'Accessories' },
    { href: '/financing', label: 'Financing' },
  ];

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCurrentSearch(window.location.search);
  }, [pathname]);

  const openProductsFiltersHref = useMemo(() => {
    const isOnProducts = pathname === '/products';
    if (!isOnProducts) {
      return '/products?openFilters=1';
    }
    const params = new URLSearchParams(currentSearch);
    params.set('openFilters', '1');
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ''}`;
  }, [currentSearch, pathname]);

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
                src="/affordlogo1.svg" 
                alt={`${brandConfig.name} logo`}
                width={60}
                height={60}
                className="site-header__logo"
                priority
              /> 
            </div>
            
            {/* Logo Text - Hidden on mobile/tablet, visible on desktop */}
            <span className="site-header__logo-text">
              {brandConfig.name}
            </span>
          </Link>

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
          </nav>

          {/* Search, Cart, Account – grouped after nav */}
          <div className="site-header__actions">
            <Link
              href={openProductsFiltersHref}
              className="site-header__icon-button site-header__icon-button--search"
              aria-label="Search products"
              title="Search"
            >
              <svg className="site-header__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

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
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
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
          </div>

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

        {isAuthModalOpen && (
          <AuthChoiceModal
            onClose={() => setIsAuthModalOpen(false)}
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
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

