import Link from 'next/link';
import Image from 'next/image';
import { brandConfig, getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { MaterialIcon } from '@/components/MaterialIcon';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = getBusinessWhatsAppUrl();

  return (
    <footer className="site-footer w-full bg-surface-container-low mt-16 text-on-surface">
      <div className="site-footer__container mx-auto max-w-[1400px] px-4 py-14 lg:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Image
                  src="/affordlogo2.svg"
                  alt=""
                  width={28}
                  height={28}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-sm font-bold tracking-tight text-primary">
                {brandConfig.name}
              </span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-secondary">
              Nairobi&apos;s trusted source for verified brand-new, refurbished, and open-box
              flagships. Every device is multi-point tested, backed by a 6 to 12 month local
              warranty, and dispatched countrywide.
            </p>
            <div className="flex items-start gap-2 text-sm text-secondary">
              <MaterialIcon name="pin_drop" className="mt-0.5 text-[18px] text-stock-green" />
              <span>
                Physical Hub: {brandConfig.business.address.streetAddress},{' '}
                {brandConfig.business.address.addressLocality}, Kenya
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-full bg-stock-green-light px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stock-green">
                M-Pesa Verified
              </span>
              <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Lipa Polepole BNPL
              </span>
              <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                6-12M Warranty
              </span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {(brandConfig.business.sameAs || []).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary transition hover:text-primary"
                  aria-label="Social link"
                >
                  <MaterialIcon name="share" className="text-[18px]" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-primary">Customer Tools</span>
            <Link href="/cart" className="flex items-center gap-1 text-sm text-secondary transition hover:text-primary">
              <MaterialIcon name="lock_reset" className="text-[16px]" />
              Track / view orders
            </Link>
            <Link href="/budget-search" className="flex items-center gap-1 text-sm text-secondary transition hover:text-primary">
              <MaterialIcon name="tune" className="text-[16px]" />
              Shop by budget
            </Link>
            <Link href="/financing" className="flex items-center gap-1 text-sm text-secondary transition hover:text-primary">
              <MaterialIcon name="payments" className="text-[16px]" />
              Financing / BNPL
            </Link>
            <Link href="/wishlist" className="flex items-center gap-1 text-sm text-secondary transition hover:text-primary">
              <MaterialIcon name="favorite" className="text-[16px]" />
              Wishlist
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-primary">Shop</span>
            <Link href="/products" className="text-sm text-secondary transition hover:text-primary">
              All Products
            </Link>
            <Link href="/categories" className="text-sm text-secondary transition hover:text-primary">
              Categories
            </Link>
            <Link href="/promotions" className="text-sm text-secondary transition hover:text-primary">
              Promotions
            </Link>
            <Link href="/videos" className="text-sm text-secondary transition hover:text-primary">
              Product Videos
            </Link>
            <Link href="/articles" className="text-sm text-secondary transition hover:text-primary">
              Buying Guides
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-primary">Support</span>
            <Link href="/contact" className="text-sm text-secondary transition hover:text-primary">
              Contact Us
            </Link>
            <Link href="/faq" className="text-sm text-secondary transition hover:text-primary">
              FAQ
            </Link>
            <Link href="/shipping" className="text-sm text-secondary transition hover:text-primary">
              Shipping Info
            </Link>
            <Link href="/reviews" className="text-sm text-secondary transition hover:text-primary">
              Reviews
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-secondary transition hover:text-primary"
            >
              WhatsApp {brandConfig.business.phone}
            </a>
            <a
              href={`mailto:${brandConfig.business.email}`}
              className="text-sm text-secondary transition hover:text-primary"
            >
              {brandConfig.business.email}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-secondary">
            &copy; {currentYear} {brandConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-secondary transition hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-secondary transition hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
