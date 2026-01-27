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
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Verify your purchase</h2>
            <p className="text-sm text-gray-500">Use the phone number from your checkout to find eligible reviews.</p>
          </div>
          <button
            type="button"
            onClick={resetState}
            className="self-start rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-800"
          >
            Start over
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {step === 'phone' && (
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Phone number
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 0712345678"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={sendOtp}
              disabled={isSendingOtp}
              className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              OTP code
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Enter the 6-digit code"
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={checkEligibility}
                disabled={isCheckingEligibility}
                className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCheckingEligibility ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => setStep('phone')}
              >
                Change phone
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="mt-5 space-y-6">
            {customer && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Signed in as <span className="font-semibold">{customer.name || 'Customer'}</span> • {customer.phone}
              </div>
            )}

            {eligibleItems.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-600">
                We could not find any paid or delivered purchases for this phone number.
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Purchased product
                  <select
                    value={selectedOrderItemId ?? ''}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedOrderItemId(value ? Number(value) : null);
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
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
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View product details
                  </Link>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">Your rating</p>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700">
                  Your review
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                    placeholder="Share what you liked about the product."
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Add a photo (optional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setReviewImage(event.target.files?.[0] ?? null)}
                    className="mt-2 block w-full text-sm text-gray-600"
                  />
                </label>

                <button
                  type="button"
                  onClick={submitReview}
                  disabled={isSubmittingReview}
                  className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
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
