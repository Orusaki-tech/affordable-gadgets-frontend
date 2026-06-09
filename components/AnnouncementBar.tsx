'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'affordable_gadgets_announcement_dismissed';

export type AnnouncementBarProps = {
  id: string;
  /** If provided, bar can be dismissed and id is stored in localStorage. */
  dismissible?: boolean;
};

const defaultId = 'info-bar-v1';
const MOBILE_BREAKPOINT_QUERY = '(max-width: 640px)';
const MOBILE_ROTATION_MS = 2600;

const announcementItems = [
  {
    id: 'warranty',
    text: '6-12 months warranty',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  {
    id: 'shipping',
    text: 'Affordable shipping',
    icon: (
      <>
        <path d="M3 11h13" />
        <path d="M5 7h9v11H5z" />
        <path d="M16 9h2l3 3v6h-2" />
        <circle cx="8" cy="18" r="1.5" />
        <circle cx="18" cy="18" r="1.5" />
      </>
    ),
  },
  {
    id: 'payments',
    text: 'Secure payments',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h3" />
      </>
    ),
  },
  {
    id: 'delivery',
    text: '1-2 days delivery',
    icon: (
      <>
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
];

export function AnnouncementBar(props?: Partial<AnnouncementBarProps>) {
  const { id = defaultId, dismissible = false } = { ...props };
  const [isVisible, setIsVisible] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileItemIndex, setMobileItemIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!dismissible) {
      setIsVisible(true);
      return;
    }
    const dismissedId = localStorage.getItem(STORAGE_KEY);
    setIsVisible(dismissedId !== id);
  }, [id, dismissible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateViewport = () => {
      setIsMobile(mediaQuery.matches);
    };
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const timer = window.setInterval(() => {
      setMobileItemIndex((currentIndex) => (currentIndex + 1) % announcementItems.length);
    }, MOBILE_ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [isMobile]);

  const handleClose = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, id);
    setIsVisible(false);
  };

  // Prevent layout shift: render a height-reserving placeholder until we know visibility.
  if (isVisible === null) {
    return (
      <div
        className="announcement-bar announcement-bar--placeholder"
        aria-hidden="true"
      />
    );
  }

  if (!isVisible) {
    return (
      <div
        className="announcement-bar announcement-bar--placeholder"
        aria-hidden="true"
      />
    );
  }
  const mobileItem = announcementItems[mobileItemIndex];

  return (
    <div className="announcement-bar" role="region" aria-label="Site info">
      <div className="announcement-bar__container">
        <div className="announcement-bar__bar">
          <div className="announcement-bar__items" aria-label="Service highlights">
            {announcementItems.map((item, index) => (
              <span className="announcement-bar__item-group" key={item.id}>
                <span className="announcement-bar__item">
                  <svg
                    className="announcement-bar__item-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    {item.icon}
                  </svg>
                  <span className="announcement-bar__item-text">{item.text}</span>
                </span>
                {index < announcementItems.length - 1 && (
                  <span className="announcement-bar__separator" aria-hidden>
                    |
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="announcement-bar__mobile-item" aria-live={isMobile ? 'polite' : 'off'}>
            <span className="announcement-bar__item" key={mobileItem.id}>
              <svg
                className="announcement-bar__item-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {mobileItem.icon}
              </svg>
              <span className="announcement-bar__item-text">{mobileItem.text}</span>
            </span>
          </div>
          <div className="announcement-bar__right">
            {dismissible && (
              <button
                type="button"
                onClick={handleClose}
                className="announcement-bar__close"
                aria-label="Close announcement"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
