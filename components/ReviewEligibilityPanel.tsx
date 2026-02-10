'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiBaseUrl, inventoryBaseUrl } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';
import { getProductHref } from '@/lib/utils/productRoutes';
import { ApiService, OpenAPI, OrdersService } from '@/lib/api/generated';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
    if (isLoggedIn) {
      setRating(5);
      setComment('');
      setReviewImage(null);
      setMessage(null);
      setError(null);
      return;
    }
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const readAuth = () => {
      setIsLoggedIn(!!localStorage.getItem('auth_token'));
    };
    readAuth();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'auth_token') {
        setIsLoggedIn(!!event.newValue);
      }
    };
    const handleAuthChange = () => readAuth();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth-token-changed', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth-token-changed', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn) return;
    setStep('phone');
    setEligibleItems([]);
    setSelectedOrderItemId(null);
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchEligibleFromOrders = async () => {
      setError(null);
      setMessage(null);
      setStep('form');
      setIsCheckingEligibility(true);
      try {
        const previousBase = OpenAPI.BASE;
        OpenAPI.BASE = inventoryBaseUrl;
        const ordersResponse = await OrdersService.ordersList();
        OpenAPI.BASE = previousBase;

        const orders = ordersResponse?.results ?? [];
        const directEligible: EligibleReviewItem[] = [];
        const lookupCandidates: Array<{
          order_id: string;
          order_item_id: number;
          product_name: string;
          purchase_date: string | null;
        }> = [];

        orders
          .filter((order) => {
            const status = (order.status || '').toString().toLowerCase();
            return status === 'paid' || status === 'delivered';
          })
          .forEach((order) => {
          (order.order_items || []).forEach((item: any) => {
            const unit = item.inventory_unit;
            if (unit && typeof unit === 'object' && unit.product_id) {
              directEligible.push({
                product_id: unit.product_id,
                product_name: unit.product_name || item.product_template_name || 'Product',
                product_slug: unit.product_slug || '',
                order_id: order.order_id ?? '',
                order_item_id: item.id ?? 0,
                purchase_date: order.created_at ? order.created_at.split('T')[0] : null,
              });
              return;
            }

            if (item.product_template_name) {
              lookupCandidates.push({
                order_id: order.order_id ?? '',
                order_item_id: item.id ?? 0,
                product_name: item.product_template_name,
                purchase_date: order.created_at ?? null,
              });
            }
          });
        });

        const uniqueByName = new Map<string, typeof lookupCandidates[number]>();
        lookupCandidates.forEach((item) => {
          if (!item.product_name) return;
          if (!uniqueByName.has(item.product_name)) {
            uniqueByName.set(item.product_name, item);
          }
        });

        const lookupResults = await Promise.all(
          Array.from(uniqueByName.values()).map(async (item) => {
            const products = await ApiService.apiV1PublicProductsList(
              undefined,
              undefined,
              undefined,
              undefined,
              1,
              1,
              undefined,
              item.product_name
            );
            const first = products?.results?.[0];
            if (!first?.id) return null;
            return {
              product_id: first.id,
              product_name: first.product_name || item.product_name,
              product_slug: first.slug,
              order_id: item.order_id,
              order_item_id: item.order_item_id,
              purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : null,
            } satisfies EligibleReviewItem;
          })
        );

        const merged = [...directEligible, ...(lookupResults.filter(Boolean) as EligibleReviewItem[])];
        const uniqueByProduct = new Map<number, EligibleReviewItem>();
        merged.forEach((item) => {
          if (!uniqueByProduct.has(item.product_id)) {
            uniqueByProduct.set(item.product_id, item);
          }
        });

        const eligible = Array.from(uniqueByProduct.values());
        setEligibleItems(eligible);
        setSelectedOrderItemId(eligible[0]?.order_item_id ?? null);
        setStep('form');
        if (eligible.length === 0) {
          setMessage('No eligible purchases found for your account yet.');
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load eligible purchases.');
      } finally {
        setIsCheckingEligibility(false);
      }
    };

    fetchEligibleFromOrders();
  }, [isLoggedIn]);

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
      if (isLoggedIn) {
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) {
          throw new Error('Please sign in to submit a review.');
        }
        const formData = new FormData();
        formData.append('product', String(selectedEligibleItem.product_id));
        formData.append('rating', String(rating));
        formData.append('comment', comment.trim());
        if (reviewImage) {
          formData.append('review_image', reviewImage);
        }

        const response = await fetch(`${inventoryBaseUrl}/reviews/`, {
          method: 'POST',
          headers: {
            'X-Brand-Code': brandConfig.code,
            Authorization: `Token ${token}`,
          },
          body: formData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'Failed to submit review.');
        }
      } else {
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
            <h2 className="review-eligibility__title">
              {isLoggedIn ? 'Your eligible purchases' : 'Verify your purchase'}
            </h2>
            <p className="review-eligibility__subtitle">
              {isLoggedIn
                ? 'Select an item from your account to leave a review.'
                : 'Use the phone number from your checkout to find eligible reviews.'}
            </p>
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

        {!isLoggedIn && step === 'phone' && (
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

        {!isLoggedIn && step === 'otp' && (
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
            {isLoggedIn && isCheckingEligibility && (
              <p className="review-eligibility__subtitle">Loading your eligible purchases...</p>
            )}
            {customer && (
              <div className="review-eligibility__customer">
                Signed in as <span className="review-eligibility__customer-name">{customer.name || 'Customer'}</span> • {customer.phone}
              </div>
            )}

            {eligibleItems.length === 0 ? (
              <div className="review-eligibility__empty">
                {isLoggedIn
                  ? 'No eligible purchases found for your account yet.'
                  : 'We could not find any paid or delivered purchases for this phone number.'}
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
