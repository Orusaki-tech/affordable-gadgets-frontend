'use client';

import { useState } from 'react';
import { brandConfig } from '@/lib/config/brand';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { getSessionKey } from '@/lib/tracking';

const API_BASE = brandConfig.apiBaseUrl.replace(/\/+$/, '');

interface WhatsAppLeadModalProps {
  productId: number;
  productName: string;
  productBrand?: string;
  productModel?: string;
  unitLabel?: string;
  prefilledMessage: string;
  onClose: () => void;
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 9) return 'Please enter a valid phone number';
  return null;
}

export function WhatsAppLeadModal({
  productId,
  productName,
  productBrand,
  productModel,
  unitLabel,
  prefilledMessage,
  onClose,
}: WhatsAppLeadModalProps) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const phoneError = validatePhone(phone);
  const isPhoneValid = !phoneError;
  const showPhoneError = touched && phoneError;

  const handleSubmit = async () => {
    setTouched(true);
    if (!isPhoneValid) {
      setError(phoneError);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const token = getAuthToken();
      const body: Record<string, unknown> = {
        event_type: 'whatsapp_click',
        product_id: productId,
        phone: phone.replace(/\D/g, ''),
        session_key: getSessionKey(),
      };

      const res = await fetch(`${API_BASE}/api/v1/public/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinueToWhatsApp = () => {
    window.open(getBusinessWhatsAppUrl(prefilledMessage), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const specParts = [productBrand, productModel, unitLabel].filter(Boolean);

  return (
    <div className="checkout-modal" onClick={onClose}>
      <div className="checkout-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="checkout-modal__close"
          aria-label="Close"
        >
          <svg className="checkout-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!submitted ? (
          <>
            <div className="whatsapp-lead-modal__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M19.05 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.44 1.32 4.94L2 22l5.27-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
              </svg>
            </div>

            <h2 className="checkout-modal__title">Interested in this item?</h2>
            <p className="whatsapp-lead-modal__subtitle">
              Leave your phone number and a salesperson will contact you shortly.
            </p>

            <div className="whatsapp-lead-modal__product">
              <p className="whatsapp-lead-modal__product-name">{productName}</p>
              {specParts.length > 0 && (
                <p className="whatsapp-lead-modal__product-spec">{specParts.join(' · ')}</p>
              )}
            </div>

            <div className="checkout-modal__field">
              <label htmlFor="whatsapp-lead-phone" className="checkout-modal__label">
                Phone number <span className="checkout-modal__required">*</span>
              </label>
              <input
                id="whatsapp-lead-phone"
                type="tel"
                className="checkout-modal__input"
                placeholder="e.g. 0712 345 678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError(null);
                }}
                onBlur={() => setTouched(true)}
                disabled={submitting}
                autoFocus
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={showPhoneError ? true : undefined}
                aria-describedby={showPhoneError ? 'whatsapp-lead-phone-error' : undefined}
              />
              {showPhoneError && (
                <span id="whatsapp-lead-phone-error" className="checkout-modal__error" role="alert">
                  {phoneError}
                </span>
              )}
            </div>

            {error && !showPhoneError && (
              <div className="checkout-modal__alert" role="alert">{error}</div>
            )}

            <div className="whatsapp-lead-modal__actions">
              <button
                type="button"
                className="whatsapp-lead-modal__primary"
                onClick={handleSubmit}
                disabled={!isPhoneValid || submitting}
              >
                {submitting ? 'Submitting...' : 'Contact me on WhatsApp'}
              </button>

              <button
                type="button"
                className="checkout-modal__secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="whatsapp-lead-modal__icon whatsapp-lead-modal__icon--success" aria-hidden="true">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="28" height="28">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="checkout-modal__title">Thank you!</h2>
            <p className="whatsapp-lead-modal__subtitle">
              A salesperson will contact you shortly on <strong>{phone}</strong>.
            </p>
            <p className="whatsapp-lead-modal__subtitle">
              In the meantime, you can continue to WhatsApp.
            </p>

            <div className="whatsapp-lead-modal__actions">
              <button
                type="button"
                className="whatsapp-lead-modal__primary"
                onClick={handleContinueToWhatsApp}
              >
                Continue to WhatsApp
              </button>

              <button
                type="button"
                className="checkout-modal__secondary"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
