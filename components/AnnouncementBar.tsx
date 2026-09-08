'use client';

import { brandConfig } from '@/lib/config/brand';
import { MaterialIcon } from '@/components/MaterialIcon';

export type AnnouncementBarProps = {
  id: string;
  dismissible?: boolean;
};

const trustItems = [
  { id: 'warranty', icon: 'verified', text: '6-12 Months Warranty' },
  { id: 'shipping', icon: 'local_shipping', text: 'Affordable Shipping Across Kenya' },
  { id: 'payments', icon: 'shield', text: 'Secure Payments' },
  { id: 'delivery', icon: 'bolt', text: '1-2 Days Delivery' },
] as const;

/** Mockup trust strip above the main header. */
export function AnnouncementBar(_props?: Partial<AnnouncementBarProps>) {
  const phoneDisplay = brandConfig.business.phone.replace(/^\+254/, '+254 ').trim();

  return (
    <div
      className="announcement-bar bg-primary-container text-promo-lime"
      role="region"
      aria-label="Site info"
    >
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-[12px] font-medium whitespace-nowrap">
          {trustItems.map((item, index) => (
            <span key={item.id} className="flex items-center gap-2">
              {index > 0 ? <span className="text-[#77767b]">•</span> : null}
              <span className="flex items-center gap-1 text-on-primary">
                <MaterialIcon name={item.icon} className="text-[14px] text-promo-lime" />
                {item.text}
              </span>
            </span>
          ))}
        </div>
        <div className="hidden items-center gap-4 text-[12px] font-medium text-on-primary md:flex">
          <span className="flex items-center gap-1">
            <MaterialIcon name="location_on" className="text-[14px]" />
            CBD, Nairobi Kenya
          </span>
          <a
            className="transition-colors hover:text-promo-lime"
            href={`tel:${brandConfig.business.phone}`}
          >
            {phoneDisplay}
          </a>
        </div>
      </div>
    </div>
  );
}
