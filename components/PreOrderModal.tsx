'use client';

import { useEffect } from 'react';
import { resolveProductVideoMedia } from '@/lib/utils/productVideo';

/** Typeform live embed id for iPhone 18 Pro Max pre-orders */
export const IPHONE_18_PRO_MAX_TYPEFORM_ID = '01M1XNWYDN31B8GVHC6DY7TZ43';

const TYPEFORM_SCRIPT_SRC = 'https://embed.typeform.com/next/embed.js';
const TYPEFORM_SCRIPT_ATTR = 'data-ag-typeform-embed';

type PreOrderVideoSource = {
  product_video_url?: string | null;
  product_video_file_url?: string | null;
};

type PreOrderModalProps = {
  open: boolean;
  title: string;
  subtitle?: string | null;
  videoSource?: PreOrderVideoSource | null;
  typeformId?: string;
  onClose: () => void;
};

function ensureTypeformScript() {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector(`script[${TYPEFORM_SCRIPT_ATTR}]`);
  if (existing) {
    const tf = (window as Window & { tf?: { load?: () => void } }).tf;
    tf?.load?.();
    return;
  }
  const script = document.createElement('script');
  script.src = TYPEFORM_SCRIPT_SRC;
  script.async = true;
  script.setAttribute(TYPEFORM_SCRIPT_ATTR, '1');
  document.body.appendChild(script);
}

export function PreOrderModal({
  open,
  title,
  subtitle,
  videoSource,
  typeformId = IPHONE_18_PRO_MAX_TYPEFORM_ID,
  onClose,
}: PreOrderModalProps) {
  const video = videoSource ? resolveProductVideoMedia(videoSource) : null;

  useEffect(() => {
    if (!open) return;
    ensureTypeformScript();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="preorder-modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="preorder-modal__backdrop" onClick={onClose} aria-label="Close" />
      <div className="preorder-modal__panel">
        <div className="preorder-modal__header">
          <div className="preorder-modal__titles">
            <p className="preorder-modal__kicker">Pre-order</p>
            <h2 className="preorder-modal__title">{title}</h2>
            {subtitle ? <p className="preorder-modal__subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="preorder-modal__close" onClick={onClose} aria-label="Close">
            <svg className="preorder-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="preorder-modal__body">
          {video ? (
            <div className="preorder-modal__video">
              {video.mode === 'file' ? (
                <video
                  className="preorder-modal__video-el"
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <iframe
                  className="preorder-modal__video-el"
                  src={video.src}
                  title={`${title} video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          ) : null}

          <div className="preorder-modal__form">
            <div key={`tf-${typeformId}-${open ? '1' : '0'}`} data-tf-live={typeformId} />
          </div>
        </div>
      </div>
    </div>
  );
}
