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
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhone = (value: string): string | null => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 9) return 'Please enter a valid phone number';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        event_type: 'whatsapp_click',
        product_id: productId,
        phone: phone.replace(/\D/g, ''),
        session_key: getSessionKey(),
      };
      if (email.trim()) body.email = email.trim();

      const res = await fetch(`${API_BASE}/api/v1/public/events/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
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
          <div className="auth-choice-modal">
            <div className="auth-choice-modal__icon-wrap">
              <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                <path d="M19.05 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.44 1.32 4.94L2 22l5.27-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
              </svg>
            </div>
            <h2 className="checkout-modal__title">Interested in this item?</h2>
            <p className="checkout-modal__subtitle">
              Leave your phone number and a salesperson will contact you shortly.
            </p>

            <div className="product-detail__info-box" style={{ margin: '0 0 16px' }}>
              <p className="product-detail__info-box-title" style={{ fontWeight: 600, marginBottom: 4 }}>
                {productName}
              </p>
              {specParts.length > 0 && (
                <p className="product-detail__info-box-subtitle" style={{ fontSize: '0.875rem', color: '#666' }}>
                  {specParts.join(' · ')}
                </p>
              )}
            </div>

            <div className="checkout-form__group" style={{ marginBottom: 12 }}>
              <label className="checkout-form__label">Phone number *</label>
              <input
                type="tel"
                className="checkout-form__input"
                placeholder="e.g. 0712 345 678"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(null); }}
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="checkout-form__group" style={{ marginBottom: 16 }}>
              <label className="checkout-form__label">Email (optional)</label>
              <input
                type="email"
                className="checkout-form__input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>

            {error && (
              <p className="checkout-form__error" style={{ marginBottom: 12 }}>{error}</p>
            )}

            <button
              type="button"
              className="checkout-modal__cta-button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', marginBottom: 8 }}
            >
              {submitting ? 'Submitting...' : 'Contact me on WhatsApp'}
            </button>

            <button
              type="button"
              className="checkout-modal__cta-button checkout-modal__cta-button--secondary"
              onClick={onClose}
              disabled={submitting}
              style={{ width: '100%' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="auth-choice-modal">
            <div className="auth-choice-modal__icon-wrap">
              <svg fill="none" stroke="#22c55e" viewBox="0 0 24 24" width="48" height="48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="checkout-modal__title">Thank you!</h2>
            <p className="checkout-modal__subtitle">
              A salesperson will contact you shortly on <strong>{phone}</strong>.
            </p>
            <p className="checkout-modal__subtitle" style={{ marginTop: 8, marginBottom: 20 }}>
              In the meantime, you can continue to WhatsApp.
            </p>

            <button
              type="button"
              className="checkout-modal__cta-button"
              onClick={handleContinueToWhatsApp}
              style={{ width: '100%', marginBottom: 8 }}
            >
              Continue to WhatsApp
            </button>

            <button
              type="button"
              className="checkout-modal__cta-button checkout-modal__cta-button--secondary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
