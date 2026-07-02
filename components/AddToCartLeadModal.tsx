'use client';

import { useEffect, useState } from 'react';

interface AddToCartLeadModalProps {
  productName: string;
  productBrand?: string;
  productModel?: string;
  unitLabel?: string;
  initialPhone?: string;
  onClose: () => void;
  onConfirm: (phone: string) => Promise<void>;
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 9) return 'Please enter a valid phone number';
  return null;
}

export function AddToCartLeadModal({
  productName,
  productBrand,
  productModel,
  unitLabel,
  initialPhone = '',
  onClose,
  onConfirm,
}: AddToCartLeadModalProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialPhone) setPhone(initialPhone);
  }, [initialPhone]);

  const phoneError = validatePhone(phone);
  const isPhoneValid = !phoneError;
  const showPhoneError = touched && phoneError;
  const specParts = [productBrand, productModel, unitLabel].filter(Boolean);

  const handleSubmit = async () => {
    setTouched(true);
    if (!isPhoneValid) {
      setError(phoneError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const normalizedPhone = phone.replace(/\D/g, '');
      if (typeof window !== 'undefined') {
        localStorage.setItem('customer_phone', normalizedPhone);
      }
      await onConfirm(normalizedPhone);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setSubmitting(false);
    }
  };

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
            <div className="whatsapp-lead-modal__icon add-to-cart-lead-modal__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M7 4h-2a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V3a1 1 0 10-2 0v1H9V3a1 1 0 10-2 0v1zm12 6H5v10h14V10zm-7 2a1 1 0 011 1v3h3a1 1 0 11-2 0v-3H9a1 1 0 011-1z" />
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
              <label htmlFor="add-to-cart-lead-phone" className="checkout-modal__label">
                Phone number <span className="checkout-modal__required">*</span>
              </label>
              <input
                id="add-to-cart-lead-phone"
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
                aria-describedby={showPhoneError ? 'add-to-cart-lead-phone-error' : undefined}
              />
              {showPhoneError && (
                <span id="add-to-cart-lead-phone-error" className="checkout-modal__error" role="alert">
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
                {submitting ? 'Adding to cart...' : 'Add to cart'}
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

            <h2 className="checkout-modal__title">Added to cart!</h2>
            <p className="whatsapp-lead-modal__subtitle">
              A salesperson will contact you shortly on <strong>{phone}</strong>.
            </p>

            <div className="whatsapp-lead-modal__actions">
              <button
                type="button"
                className="whatsapp-lead-modal__primary"
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
