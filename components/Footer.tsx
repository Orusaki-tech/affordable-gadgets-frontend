import Link from 'next/link';
import Image from 'next/image';
import { brandConfig, getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { MaterialIcon } from '@/components/MaterialIcon';

type SocialNetwork = 'facebook' | 'x' | 'tiktok' | 'instagram' | 'other';

function detectSocialNetwork(url: string): SocialNetwork {
  const host = url.toLowerCase();
  if (host.includes('facebook.com') || host.includes('fb.com')) return 'facebook';
  if (host.includes('tiktok.com')) return 'tiktok';
  if (host.includes('instagram.com')) return 'instagram';
  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  return 'other';
}

function socialLabel(network: SocialNetwork): string {
  switch (network) {
    case 'facebook':
      return 'Facebook';
    case 'x':
      return 'X (Twitter)';
    case 'tiktok':
      return 'TikTok';
    case 'instagram':
      return 'Instagram';
    default:
      return 'Social link';
  }
}

function SocialGlyph({ network }: { network: SocialNetwork }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'currentColor' as const,
    'aria-hidden': true as const,
  };

  switch (network) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M14 8h2.5V4.5H14c-2.2 0-4 1.8-4 4V11H7.5v3.5H10V22h3.5v-7.5h2.3L16.5 11H13.5V8.5c0-.3.2-.5.5-.5z" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-5.1-6.7L5.7 22H2.6l7.3-8.3L1 2h6.7l4.6 6.1L18.9 2zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg {...common}>
          <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zm9.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M19.6 7.3a6.8 6.8 0 0 1-3.9-1.2v8.1a5.9 5.9 0 1 1-5.1-5.8v3a2.9 2.9 0 1 0 2.1 2.8V2.5h3c.2 1.6 1.2 3 2.6 3.8a6.7 6.7 0 0 0 3.3.9v3a8.4 8.4 0 0 1-2-.9z" />
        </svg>
      );
    default:
      return <MaterialIcon name="public" className="text-[18px]" />;
  }
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappUrl = getBusinessWhatsAppUrl();
  const socialLinks = (brandConfig.business.sameAs || []).map((url) => {
    const network = detectSocialNetwork(url);
    return { url, network, label: socialLabel(network) };
  });

  return (
    <footer className="site-footer ag-bleed ag-bleed--footer mt-16 text-on-surface">
      <div className="ag-bleed__inner py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link href="/" className="site-footer__logo-link flex items-center gap-3">
              <div className="site-footer__logo-wrap relative h-16 w-16 shrink-0 overflow-hidden">
                <Image
                  src="/affordlogo2.svg"
                  alt={`${brandConfig.name} logo`}
                  width={100}
                  height={100}
                  className="site-footer__logo h-full w-full object-contain"
                />
              </div>
              <span className="site-footer__logo-text text-lg font-bold tracking-tight text-primary">
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
              <span className="ag-tag ag-tag--success">M-Pesa Verified</span>
              <span className="ag-tag">Lipa Polepole BNPL</span>
              <span className="ag-tag">6–12M Warranty</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ url, network, label }) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-hairline text-secondary transition hover:border-primary hover:text-primary"
                  aria-label={label}
                  title={label}
                >
                  <SocialGlyph network={network} />
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
              Financing
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
