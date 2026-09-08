'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/hooks/useCart';
import { useWishlist } from '@/lib/hooks/useWishlist';
import { usePrefetchNavMegaProducts } from '@/lib/hooks/useProducts';
import { brandConfig, getBusinessWhatsAppUrl } from '@/lib/config/brand';
import {
  PRIMARY_BRAND_NAV,
  MORE_BRAND_NAV,
  SHOP_NAV,
  isShopNavActive,
} from '@/lib/config/nav-links';
import { clearAuthToken } from '@/lib/api/openapi';
import { createClient } from '@/lib/supabase/client';
import { AuthChoiceModal } from './AuthChoiceModal';
import { HeaderBrandMenu, HeaderMoreBrandsMenu } from './HeaderBrandMenu';
import { HeaderMegaMenuPanel, MEGA_MENU_MORE_KEY } from './HeaderMegaMenuPanel';
import { MaterialIcon } from './MaterialIcon';

const BUDGET_CHIPS = [
  { label: 'Under 20k', href: '/products?max_price=20000' },
  { label: '20k–50k', href: '/products?min_price=20000&max_price=50000' },
] as const;

function HeaderFallback() {
  return (
    <header className="site-header" aria-hidden>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center px-4 lg:px-6">
        <span className="font-semibold tracking-tight text-primary">{brandConfig.name}</span>
      </div>
    </header>
  );
}

export function Header() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderContent />
    </Suspense>
  );
}

function HeaderContent() {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [openMegaMenu, setOpenMegaMenu] = useState<string | null>(null);
  const [moreHoverBrand, setMoreHoverBrand] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [megaMenuTop, setMegaMenuTop] = useState(0);
  const megaCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const closeMegaMenu = useCallback(() => {
    if (megaCloseTimerRef.current) {
      clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
    setOpenMegaMenu(null);
    setMoreHoverBrand(null);
  }, []);

  const cancelMegaMenuClose = useCallback(() => {
    if (megaCloseTimerRef.current) {
      clearTimeout(megaCloseTimerRef.current);
      megaCloseTimerRef.current = null;
    }
  }, []);

  const scheduleMegaMenuClose = useCallback(() => {
    cancelMegaMenuClose();
    megaCloseTimerRef.current = setTimeout(() => {
      megaCloseTimerRef.current = null;
      setOpenMegaMenu(null);
      setMoreHoverBrand(null);
    }, 180);
  }, [cancelMegaMenuClose]);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (megaCloseTimerRef.current) clearTimeout(megaCloseTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const wrapper = document.querySelector('.site-header-wrapper');
    if (!wrapper) return;
    if (openMegaMenu) {
      wrapper.classList.add('site-header-wrapper--mega-open');
      setMegaMenuTop(wrapper.getBoundingClientRect().bottom);
    } else {
      wrapper.classList.remove('site-header-wrapper--mega-open');
    }
    return () => wrapper.classList.remove('site-header-wrapper--mega-open');
  }, [openMegaMenu]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readAuth = () => setIsLoggedIn(!!localStorage.getItem('auth_token'));
    readAuth();
    const handleAuthChange = () => readAuth();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'auth_token') setIsLoggedIn(!!event.newValue);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-token-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    closeMegaMenu();
  }, [pathname, currentSearch, closeMegaMenu]);

  useEffect(() => {
    if (!openMegaMenu) return;
    const closeOnScroll = () => closeMegaMenu();
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('wheel', closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('wheel', closeOnScroll);
    };
  }, [openMegaMenu, closeMegaMenu]);

  useEffect(() => {
    if (!openMegaMenu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMegaMenu();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openMegaMenu, closeMegaMenu]);

  const megaMenuPrefetchEntries = useMemo(
    () =>
      [...PRIMARY_BRAND_NAV, ...MORE_BRAND_NAV].flatMap((brand) =>
        brand.categories.map((cat) => ({
          brandFilter: brand.brandFilter,
          productType: cat.productType,
        }))
      ),
    []
  );
  usePrefetchNavMegaProducts(megaMenuPrefetchEntries);

  const activeMegaBrand = useMemo(
    () => PRIMARY_BRAND_NAV.find((brand) => brand.brandFilter === openMegaMenu),
    [openMegaMenu]
  );
  const isAnyMegaOpen = openMegaMenu != null;
  const wishlistCount = wishlistItems.length;
  const whatsappUrl = getBusinessWhatsAppUrl(
    'Hi Affordable Gadgets — I need help finding a device.'
  );
  const isAllDevicesActive = pathname === '/products' && !searchParams.get('brand_filter');

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  return (
    <header
      className={`site-header${openMegaMenu ? ' site-header--mega-open' : ''} border-b border-border-hairline bg-white`}
    >
      <div className="site-header__container mx-auto max-w-[1400px] px-4 lg:px-6">
        {/* Top utility row: logo | search | actions */}
        <div className="site-header__bar flex items-center gap-3 py-3 lg:gap-5">
          <Link href="/" className="site-header__logo-link shrink-0">
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
            <span className="site-header__logo-text">{brandConfig.name}</span>
          </Link>

          <form
            onSubmit={onSearchSubmit}
            className="site-header__search hidden min-w-0 flex-1 items-center gap-2 md:flex"
            role="search"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border-hairline bg-surface-muted px-4 py-2.5">
              <MaterialIcon name="search" className="text-[20px] text-secondary" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search iPhone, Galaxy, Pixel, Sony audio…"
                className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-text-muted"
                aria-label="Search products"
              />
            </div>
            <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
              {BUDGET_CHIPS.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-full border border-border-hairline bg-white px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant transition hover:border-primary hover:text-primary"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </form>

          <div className="site-header__actions ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-promo-lime px-3.5 py-2 text-xs font-bold text-primary transition hover:brightness-95 sm:inline-flex"
            >
              <MaterialIcon name="chat" className="text-[16px]" />
              WhatsApp Inquiry
            </a>

            <Link
              href="/wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-muted"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
            >
              <MaterialIcon name="favorite" className="text-[22px]" />
              {wishlistCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="site-header__cart relative inline-flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-muted"
              aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
            >
              <MaterialIcon name="shopping_bag" className="text-[22px]" />
              {itemCount > 0 ? (
                <span className="site-header__cart-badge absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-promo-lime">
                  {itemCount}
                </span>
              ) : null}
            </Link>

            {isLoggedIn ? (
              <div className="site-header__account-menu relative">
                <button
                  type="button"
                  className="site-header__account inline-flex h-10 items-center gap-1 rounded-full px-2 hover:bg-surface-muted"
                  aria-label="Account menu"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                >
                  <MaterialIcon name="person" className="text-[22px]" />
                  <span className="hidden text-xs font-semibold lg:inline">Account</span>
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 min-w-[160px] rounded-xl border border-border-hairline bg-white p-2 shadow-lg">
                    <Link href="/cart" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-muted">
                      My Orders
                    </Link>
                    <button
                      type="button"
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
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
                className="site-header__account inline-flex h-10 items-center gap-1 rounded-full px-2 hover:bg-surface-muted"
                aria-label="Sign in"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <MaterialIcon name="person" className="text-[22px]" />
                <span className="hidden text-xs font-semibold lg:inline">Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="site-header__menu-button inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-muted lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <MaterialIcon name={isMobileMenuOpen ? 'close' : 'menu'} className="text-[22px]" />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={onSearchSubmit} className="pb-3 md:hidden" role="search">
          <div className="flex items-center gap-2 rounded-full border border-border-hairline bg-surface-muted px-4 py-2.5">
            <MaterialIcon name="search" className="text-[20px] text-secondary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices…"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Search products"
            />
          </div>
        </form>

        {/* Pill category nav — mockup second row */}
        <div
          className={`site-header__nav-zone -mx-4 hidden border-t border-border-hairline bg-surface-muted/80 px-4 lg:-mx-6 lg:block lg:px-6${
            openMegaMenu ? ' site-header__nav-zone--mega-open' : ''
          }`}
          onMouseEnter={cancelMegaMenuClose}
          onMouseLeave={scheduleMegaMenuClose}
        >
          <nav
            className={`site-header__nav site-header__nav--pills flex items-center gap-1.5 overflow-x-auto py-2.5${
              openMegaMenu ? ' site-header__nav--mega-open' : ''
            }`}
            aria-label="Shop categories"
          >
            <Link
              href="/products"
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                isAllDevicesActive
                  ? 'bg-primary text-white'
                  : 'bg-white text-on-surface hover:bg-white/80'
              }`}
              onMouseEnter={closeMegaMenu}
            >
              All Devices
            </Link>

            {PRIMARY_BRAND_NAV.map((brand) => (
              <HeaderBrandMenu
                key={brand.brandFilter}
                brand={brand}
                pathname={pathname}
                search={currentSearch}
                isMegaOpen={openMegaMenu === brand.brandFilter}
                suppressUrlActive={isAnyMegaOpen}
                onMegaOpen={() => {
                  cancelMegaMenuClose();
                  setMoreHoverBrand(null);
                  setOpenMegaMenu(brand.brandFilter);
                }}
                onNavigate={closeMegaMenu}
              />
            ))}

            <HeaderMoreBrandsMenu
              brands={MORE_BRAND_NAV}
              variant="desktop"
              isMegaOpen={openMegaMenu === MEGA_MENU_MORE_KEY}
              onMegaOpen={() => {
                cancelMegaMenuClose();
                setMoreHoverBrand(MORE_BRAND_NAV[0]?.brandFilter ?? null);
                setOpenMegaMenu(MEGA_MENU_MORE_KEY);
              }}
              onNavigate={closeMegaMenu}
            />

            {SHOP_NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`site-header__nav-link shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-on-surface hover:bg-white/80${
                  isShopNavActive(link.href, pathname, currentSearch) ? ' site-header__nav-link--active' : ''
                }`}
                onMouseEnter={closeMegaMenu}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/financing"
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-on-surface hover:bg-white/80"
              onMouseEnter={closeMegaMenu}
            >
              Financing / BNPL
            </Link>
            <Link
              href="/articles"
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-on-surface hover:bg-white/80"
              onMouseEnter={closeMegaMenu}
            >
              Blog
            </Link>
            <Link
              href="/cart"
              className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-on-surface hover:bg-white/80"
              onMouseEnter={closeMegaMenu}
            >
              Track Order
            </Link>
          </nav>
        </div>

        {isMounted &&
          openMegaMenu &&
          createPortal(
            <>
              <button
                type="button"
                className="site-header__mega-backdrop"
                aria-label="Close menu"
                onClick={closeMegaMenu}
              />
              <div
                className="site-header__mega-menu site-header__mega-menu--portal"
                style={{ top: megaMenuTop }}
                onMouseEnter={cancelMegaMenuClose}
                onMouseLeave={scheduleMegaMenuClose}
              >
                <HeaderMegaMenuPanel
                  openMenu={openMegaMenu}
                  brand={activeMegaBrand}
                  moreBrands={MORE_BRAND_NAV}
                  moreHoverBrand={moreHoverBrand}
                  onMoreBrandHover={setMoreHoverBrand}
                  onClose={closeMegaMenu}
                />
              </div>
            </>,
            document.body
          )}

        {isAuthModalOpen && (
          <AuthChoiceModal
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={() => {
              setIsLoggedIn(true);
              setIsAuthModalOpen(false);
            }}
          />
        )}

        {isMobileMenuOpen && (
          <nav className="border-t border-border-hairline pb-4 lg:hidden" aria-label="Mobile">
            <div className="flex flex-col gap-1 pt-3">
              <Link href="/products" className="rounded-lg px-2 py-2.5 text-sm font-medium" onClick={closeMobileMenu}>
                All Devices
              </Link>
              {PRIMARY_BRAND_NAV.map((brand) => (
                <HeaderBrandMenu
                  key={brand.brandFilter}
                  brand={brand}
                  pathname={pathname}
                  search={currentSearch}
                  variant="mobile"
                  onNavigate={closeMobileMenu}
                />
              ))}
              <HeaderMoreBrandsMenu brands={MORE_BRAND_NAV} variant="mobile" onNavigate={closeMobileMenu} />
              {SHOP_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/financing" className="rounded-lg px-2 py-2.5 text-sm font-medium" onClick={closeMobileMenu}>
                Financing / BNPL
              </Link>
              <Link href="/articles" className="rounded-lg px-2 py-2.5 text-sm font-medium" onClick={closeMobileMenu}>
                Blog
              </Link>
              <Link href="/cart" className="rounded-lg px-2 py-2.5 text-sm font-medium" onClick={closeMobileMenu}>
                Track Order
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-promo-lime px-3 py-2.5 text-sm font-bold text-primary"
                onClick={closeMobileMenu}
              >
                <MaterialIcon name="chat" className="text-[18px]" />
                WhatsApp Inquiry
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
