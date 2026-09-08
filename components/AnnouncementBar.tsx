'use client';

import { useEffect, useState } from 'react';
import { brandConfig } from '@/lib/config/brand';
import { MaterialIcon } from '@/components/MaterialIcon';

export type AnnouncementBarProps = {
  id: string;
  dismissible?: boolean;
};

const MOBILE_BREAKPOINT_QUERY = '(max-width: 640px)';
const MOBILE_ROTATION_MS = 2600;

const trustItems = [
  { id: 'warranty', icon: 'verified', text: '6-12 Months Warranty' },
  { id: 'shipping', icon: 'local_shipping', text: 'Affordable Shipping Across Kenya' },
  { id: 'payments', icon: 'shield', text: 'Secure Payments' },
  { id: 'delivery', icon: 'bolt', text: '1-2 Days Delivery' },
] as const;

/** Mockup trust strip above the main header — rotates highlights on mobile. */
export function AnnouncementBar(_props?: Partial<AnnouncementBarProps>) {
  const phoneDisplay = brandConfig.business.phone.replace(/^\+254/, '+254 ').trim();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileItemIndex, setMobileItemIndex] = useState(0);

  const mobileItems = [
    ...trustItems,
    { id: 'location', icon: 'location_on', text: 'CBD, Nairobi Kenya' },
    { id: 'phone', icon: 'call', text: phoneDisplay },
  ] as const;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const timer = window.setInterval(() => {
      setMobileItemIndex((current) => (current + 1) % mobileItems.length);
    }, MOBILE_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [isMobile, mobileItems.length]);

  const mobileItem = mobileItems[mobileItemIndex] ?? mobileItems[0];

  return (
    <div
      className="announcement-bar bg-primary-container text-promo-lime"
      role="region"
      aria-label="Site info"
    >
      <div className="announcement-bar__container ag-shell flex h-9 items-center justify-between gap-4">
        <div className="announcement-bar__items flex items-center gap-2 overflow-x-auto py-1 text-[12px] font-medium whitespace-nowrap">
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

        <div
          className="announcement-bar__mobile-item text-[12px] font-medium text-on-primary"
          aria-live={isMobile ? 'polite' : 'off'}
        >
          <span className="flex items-center gap-1.5" key={mobileItem.id}>
            <MaterialIcon name={mobileItem.icon} className="text-[14px] text-promo-lime" />
            {mobileItem.id === 'phone' ? (
              <a className="hover:text-promo-lime" href={`tel:${brandConfig.business.phone}`}>
                {mobileItem.text}
              </a>
            ) : (
              <span>{mobileItem.text}</span>
            )}
          </span>
        </div>

        <div className="announcement-bar__right hidden items-center gap-4 text-[12px] font-medium text-on-primary md:flex">
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
