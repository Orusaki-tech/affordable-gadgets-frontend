'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiBaseUrl } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';
import { getProductHref } from '@/lib/utils/productRoutes';

interface EligibleReviewItem {
  product_id: number;
  product_name: string;
  product_slug?: string;
  order_id: string;
  order_item_id: number;
  purchase_date?: string | null;
}

interface ReviewCustomerProfile {
  name: string;
  phone: string;
  email: string;
  delivery_address: string;
}

const formatPurchaseDate = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ReviewEligibilityPanel() {
  const [step, setStep] = useState<'phone' | 'otp' | 'form'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [eligibleItems, setEligibleItems] = useState<EligibleReviewItem[]>([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [customer, setCustomer] = useState<ReviewCustomerProfile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const selectedEligibleItem = eligibleItems.find((item) => item.order_item_id === selectedOrderItemId) || null;

  const resetState = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setEligibleItems([]);
    setSelectedOrderItemId(null);
    setRating(5);
    setComment('');
    setReviewImage(null);
    setCustomer(null);
    setMessage(null);
    setError(null);
  };

  const sendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsSendingOtp(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/reviews/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: phone.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send OTP.');
      }
      if (data?.debug_code) {
        setMessage(`OTP sent. Debug code: ${data.debug_code}`);
      } else {
        setMessage('OTP sent to your phone. Please enter it below.');
      }
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const checkEligibility = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsCheckingEligibility(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/reviews/eligibility/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to verify OTP.');
      }
      setCustomer(data?.customer ?? null);
      const items = Array.isArray(data?.eligible_items) ? data.eligible_items : [];
      setEligibleItems(items);
      setSelectedOrderItemId(items[0]?.order_item_id ?? null);
      setStep('form');
      if (items.length === 0) {
        setMessage('No eligible purchases found for this phone number.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to verify OTP.');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const submitReview = async () => {
    if (!selectedEligibleItem) {
      setError('Please select a product to review.');
      return;
    }
    if (!comment.trim()) {
      setError('Please share a short review.');
      return;
    }
    setError(null);
    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone.trim());
      formData.append('otp', otp.trim());
      formData.append('product_id', String(selectedEligibleItem.product_id));
      formData.append('order_item_id', String(selectedEligibleItem.order_item_id));
      formData.append('rating', String(rating));
      formData.append('comment', comment.trim());
      if (reviewImage) {
        formData.append('review_image', reviewImage);
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/public/reviews/submit/`, {
        method: 'POST',
        headers: {
          'X-Brand-Code': brandConfig.code,
        },
        body: formData,
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to submit review.');
      }
      setMessage('Thanks! Your review has been submitted.');
      setComment('');
      setReviewImage(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="review-eligibility">
      <div className="review-eligibility__panel">
        <div className="review-eligibility__header">
          <div>
            <h2 className="review-eligibility__title">Verify your purchase</h2>
            <p className="review-eligibility__subtitle">Use the phone number from your checkout to find eligible reviews.</p>
          </div>
          <button
            type="button"
            onClick={resetState}
            className="review-eligibility__reset"
          >
            Start over
          </button>
        </div>

        {error && (
          <div className="review-eligibility__alert review-eligibility__alert--error">
            {error}
          </div>
        )}
        {message && (
          <div className="review-eligibility__alert review-eligibility__alert--success">
            {message}
          </div>
        )}

        {step === 'phone' && (
          <div className="review-eligibility__section">
            <label className="review-eligibility__label">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 0712345678"
                className="review-eligibility__input"
              />
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={isSendingOtp}
              className="review-eligibility__primary"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="review-eligibility__section">
            <label className="review-eligibility__label">
              OTP code
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter the 6-digit code"
                className="review-eligibility__input"
              />
            </label>
            <div className="review-eligibility__actions">
              <button
                type="button"
                onClick={checkEligibility}
                disabled={isCheckingEligibility}
                className="review-eligibility__primary"
              >
                {isCheckingEligibility ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                className="review-eligibility__secondary"
                onClick={() => setStep('phone')}
              >
                Change phone
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="review-eligibility__section review-eligibility__section--form">
            {customer && (
              <div className="review-eligibility__customer">
                Signed in as <span className="review-eligibility__customer-name">{customer.name || 'Customer'}</span> • {customer.phone}
              </div>
            )}

            {eligibleItems.length === 0 ? (
              <div className="review-eligibility__empty">
                We could not find any paid or delivered purchases for this phone number.
              </div>
            ) : (
              <>
                <label className="review-eligibility__label">
                  Purchased product
                  <select
                    value={selectedOrderItemId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedOrderItemId(value ? Number(value) : null);
                    }}
                    className="review-eligibility__select"
                  >
                    <option value="" disabled>
                      Select a product
                    </option>
                    {eligibleItems.map((item) => (
                      <option key={item.order_item_id} value={item.order_item_id}>
                        {item.product_name}
                        {formatPurchaseDate(item.purchase_date) ? ` • ${formatPurchaseDate(item.purchase_date)}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedEligibleItem && (
                  <Link
                    href={getProductHref(
                      { id: selectedEligibleItem.product_id, slug: selectedEligibleItem.product_slug ?? '' },
                      { fallbackId: selectedEligibleItem.product_id }
                    )}
                    className="review-eligibility__link"
                  >
                    View product details
                  </Link>
                )}

                <div>
                  <p className="review-eligibility__label review-eligibility__label--inline">Your rating</p>
                  <div className="review-eligibility__rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`review-eligibility__star ${star <= rating ? 'review-eligibility__star--active' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <label className="review-eligibility__label">
                  Your review
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    className="review-eligibility__textarea"
                    placeholder="Share what you liked about the product."
                  />
                </label>

                <label className="review-eligibility__label">
                  Add a photo (optional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setReviewImage(event.target.files?.[0] ?? null)}
                    className="review-eligibility__file"
                  />
                </label>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="review-eligibility__primary"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit review'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
