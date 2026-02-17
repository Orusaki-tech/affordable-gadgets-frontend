'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'affordable_gadgets_announcement_dismissed';

export type AnnouncementBarProps = {
  id: string;
  /** If provided, bar can be dismissed and id is stored in localStorage. */
  dismissible?: boolean;
};

const defaultId = 'info-bar-v1';

export function AnnouncementBar(props?: Partial<AnnouncementBarProps>) {
  const { id = defaultId, dismissible = false } = { ...props };
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!dismissible) {
      setIsVisible(true);
      return;
    }
    const dismissedId = localStorage.getItem(STORAGE_KEY);
    setIsVisible(dismissedId !== id);
  }, [id, dismissible]);

  const handleClose = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, id);
    setIsVisible(false);
  };

  if (isVisible === null || !isVisible) return null;

  return (
    <div className="announcement-bar" role="region" aria-label="Site info">
      <div className="announcement-bar__container">
        <div className="announcement-bar__bar">
          {/* Left: Country wide delivery – aligns above logo */}
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
              <path d="M5 18H3c-.6 0-1-.4-1-1V6c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v2" />
              <path d="M14 9h5l3 3v5c0 .6-.4 1-1 1h-2" />
              <path d="M8 18h8" />
            </svg>
            <span className="announcement-bar__item-text">Country wide delivery</span>
          </span>

          {/* Right: Trade in + close – aligns above cart & hamburger */}
          <div className="announcement-bar__right">
            <Link href="/contact" className="announcement-bar__item announcement-bar__item--link">
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
                <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 20" />
                <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 4" />
              </svg>
              <span className="announcement-bar__item-text">Trade in</span>
            </Link>
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
