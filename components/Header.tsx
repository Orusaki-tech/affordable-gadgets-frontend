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
  UTILITY_NAV,
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
  { label: '20–40k', href: '/products?min_price=20000&max_price=40000' },
  { label: '40–80k', href: '/products?min_price=40000&max_price=80000' },
  { label: '80k+', href: '/products?min_price=80000' },
] as const;

function HeaderFallback() {
  return (
    <header className="site-header" aria-hidden>
      <div className="site-header__inner mx-auto flex h-20 max-w-[1400px] items-center px-4 lg:px-6">
        <div className="site-header__brand flex items-center gap-2">
          <span className="site-header__logo-text font-semibold tracking-tight text-primary">
            {brandConfig.name}
          </span>
        </div>
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
      if (megaCloseTimerRef.current) {
        clearTimeout(megaCloseTimerRef.current);
      }
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
    return () => {
      wrapper.classList.remove('site-header-wrapper--mega-open');
    };
  }, [openMegaMenu]);

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

  const utilityLinks = UTILITY_NAV.filter((link) => link.href !== '/');

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

  const onSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      router.push('/products');
      return;
    }
    router.push(`/products?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className={`site-header${openMegaMenu ? ' site-header--mega-open' : ''} bg-surface/90 backdrop-blur-xl`}>
      <div className="site-header__container mx-auto max-w-[1400px] px-4 lg:px-6">
        <div className="site-header__bar flex h-20 items-center justify-between gap-3 lg:gap-6">
          <Link href="/" className="site-header__logo-link flex shrink-0 items-center gap-2">
            <div className="site-header__logo-wrap flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary">
              <Image
                src="/affordlogo1.svg"
                alt=""
                width={36}
                height={36}
                className="site-header__logo h-7 w-7 object-contain"
                priority
              />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="site-header__logo-text text-sm font-bold leading-none tracking-tight text-primary">
                Affordable Gadgets
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Nairobi · Verified Tech
              </span>
            </div>
          </Link>

          <form
            onSubmit={onSearchSubmit}
            className="site-header__search hidden min-w-0 flex-1 flex-col gap-1.5 md:flex"
            role="search"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border-hairline bg-surface-container-lowest px-3 py-2 shadow-sm">
              <MaterialIcon name="search" className="text-[20px] text-secondary" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phones, laptops, tablets…"
                className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-text-muted"
                aria-label="Search products"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-promo-lime transition hover:bg-obsidian-dark"
              >
                Search
              </button>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              {BUDGET_CHIPS.map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-medium text-on-surface-variant transition hover:bg-promo-lime hover:text-primary"
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          </form>

          <div
            className={`site-header__nav-zone hidden xl:block${openMegaMenu ? ' site-header__nav-zone--mega-open' : ''}`}
            onMouseEnter={cancelMegaMenuClose}
            onMouseLeave={scheduleMegaMenuClose}
          >
            <nav
              className={`site-header__nav${openMegaMenu ? ' site-header__nav--mega-open' : ''}`}
              aria-label="Main"
            >
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
                  className={`site-header__nav-link${
                    isShopNavActive(link.href, pathname, currentSearch)
                      ? ' site-header__nav-link--active'
                      : ''
                  }`}
                  onMouseEnter={closeMegaMenu}
                >
                  {link.label}
                  <span className="site-header__nav-underline" />
                </Link>
              ))}

              {utilityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="site-header__nav-link"
                  onMouseEnter={closeMegaMenu}
                >
                  {link.label}
                  <span className="site-header__nav-underline" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="site-header__actions flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-whatsapp-emerald px-3 py-2 text-xs font-semibold text-white transition hover:bg-whatsapp-emerald-hover sm:inline-flex"
              aria-label="Chat on WhatsApp"
            >
              <MaterialIcon name="chat" className="text-[16px]" />
              WhatsApp
            </a>

            <Link
              href="/wishlist"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition hover:bg-surface-container"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}
            >
              <MaterialIcon name="favorite" className="text-[22px]" />
              {wishlistCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-promo-lime px-1 text-[10px] font-bold text-primary">
                  {wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/cart"
              className="site-header__cart relative inline-flex h-10 items-center gap-1 rounded-full px-2 text-primary transition hover:bg-surface-container"
              aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
            >
              <MaterialIcon name="shopping_bag" className="text-[22px]" />
              {itemCount > 0 ? (
                <span className="site-header__cart-badge absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-promo-lime">
                  {itemCount}
                </span>
              ) : null}
            </Link>

            {isLoggedIn ? (
              <div className="site-header__account-menu relative">
                <button
                  type="button"
                  className="site-header__account inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
                  aria-label="Account menu (logged in)"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                >
                  <MaterialIcon name="person" className="text-[22px]" />
                </button>
                {isAccountMenuOpen && (
                  <div className="site-header__account-dropdown absolute right-0 z-50 mt-2 min-w-[160px] rounded-xl border border-border-hairline bg-white p-2 shadow-lg">
                    <Link href="/cart" className="site-header__account-item block rounded-lg px-3 py-2 text-sm hover:bg-surface-muted">
                      My Orders
                    </Link>
                    <button
                      type="button"
                      className="site-header__account-item block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
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
                className="site-header__account inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
                aria-label="Login or create account"
                onClick={() => setIsAuthModalOpen(true)}
              >
                <MaterialIcon name="person" className="text-[22px]" />
              </button>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="site-header__menu-button inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container xl:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <MaterialIcon name={isMobileMenuOpen ? 'close' : 'menu'} className="text-[22px]" />
            </button>
          </div>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className="pb-3 md:hidden"
          role="search"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border-hairline bg-surface-container-lowest px-3 py-2">
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
          <nav className="site-header__mobile-menu border-t border-border-hairline pb-4" aria-label="Mobile">
            <div className="site-header__mobile-list flex flex-col gap-1 pt-3">
              <Link href="/" className="site-header__mobile-link rounded-lg px-2 py-2.5 text-sm font-medium" onClick={closeMobileMenu}>
                Home
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
              <HeaderMoreBrandsMenu
                brands={MORE_BRAND_NAV}
                variant="mobile"
                onNavigate={closeMobileMenu}
              />
              {SHOP_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="site-header__mobile-link rounded-lg px-2 py-2.5 text-sm font-medium"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              {utilityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="site-header__mobile-link rounded-lg px-2 py-2.5 text-sm font-medium"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp-emerald px-3 py-2.5 text-sm font-semibold text-white"
                onClick={closeMobileMenu}
              >
                <MaterialIcon name="chat" className="text-[18px]" />
                WhatsApp us
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
