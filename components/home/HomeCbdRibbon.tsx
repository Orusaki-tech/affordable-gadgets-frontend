import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';

export function HomeCbdRibbon() {
  return (
    <section className="mx-auto mt-5 max-w-[1400px] px-4 lg:px-6">
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-obsidian-dark px-5 py-4 text-white sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-promo-lime text-primary">
            <MaterialIcon name="storefront" className="text-[22px]" />
          </div>
          <div>
            <p className="text-sm font-bold text-promo-lime">Get KSh 500 OFF Website Prices</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
              Nairobi CBD Shop
            </p>
            <p className="mt-1 text-sm text-white/85">
              Walk in at Norwich Union House, 3rd Floor, Kimathi St. Cash, M-Pesa, Card accepted on
              spot.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={getBusinessWhatsAppUrl('Hi — I want the CBD shop KSh 500 OFF offer.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-promo-lime px-4 py-2.5 text-sm font-bold text-primary"
          >
            <MaterialIcon name="chat" className="text-[16px]" />
            WhatsApp shop
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Directions
          </Link>
        </div>
      </div>
    </section>
  );
}
