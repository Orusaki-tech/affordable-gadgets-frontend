'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAllReviews, useProductReviews } from '@/lib/hooks/useReviews';
import type { Review, PublicProduct } from '@/lib/api/generated';
import { ApiService } from '@/lib/api/generated';
import { getPlaceholderProductImage, convertToYouTubeEmbed } from '@/lib/utils/placeholders';
import { getProductHref } from '@/lib/utils/productRoutes';
import { useQueryClient } from '@tanstack/react-query';
import { ProductCarousel } from './ProductCarousel';
import { apiBaseUrl } from '@/lib/api/openapi';
import { brandConfig } from '@/lib/config/brand';

function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

function formatPurchaseDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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

interface ReviewsShowcaseProps {
  productId?: number;
}

export function ReviewsShowcase({ productId }: ReviewsShowcaseProps) {
  const queryClient = useQueryClient();
  const productReviewsQuery = useProductReviews(productId ?? 0, {
    page_size: 10,
    enabled: Boolean(productId),
  });
  const allReviewsQuery = useAllReviews({ page_size: 10 });
  const reviewsQuery = productId ? productReviewsQuery : allReviewsQuery;
  const { data, isLoading, error } = reviewsQuery;
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [productById, setProductById] = useState<Record<number, PublicProduct | null>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStep, setReviewStep] = useState<'phone' | 'otp' | 'form'>('phone');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewOtp, setReviewOtp] = useState('');
  const [eligibleItems, setEligibleItems] = useState<EligibleReviewItem[]>([]);
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImage, setReviewImage] = useState<File | null>(null);
  const [reviewCustomer, setReviewCustomer] = useState<ReviewCustomerProfile | null>(null);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const reviews = data?.results ?? [];
  const selectedEligibleItem = eligibleItems.find((item) => item.order_item_id === selectedOrderItemId) || null;

  const prefillProductCache = (productIdToCache: number, product: PublicProduct | null) => {
    if (!product) return;
    queryClient.setQueryData(['product', productIdToCache], product);
  };

  useEffect(() => {
    let isActive = true;
    const loadProducts = async () => {
      const productIds = Array.from(
        new Set(
          reviews
            .flatMap((review) => {
              const reviewAny = review as Review & { products?: number[]; tagged_products?: number[] };
              const extraProducts = [
                ...(Array.isArray(reviewAny.products) ? reviewAny.products : []),
                ...(Array.isArray(reviewAny.tagged_products) ? reviewAny.tagged_products : []),
              ];
              return [review.product, ...extraProducts];
            })
            .filter((id): id is number => typeof id === 'number')
        )
      );
      if (productIds.length === 0) return;

      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const product = await ApiService.apiV1PublicProductsRetrieve(productId);
            return [productId, product] as const;
          } catch (error) {
            console.warn(`Failed to load product ${productId}`, error);
            return [productId, null] as const;
          }
        })
      );

      if (!isActive) return;
      const nextMap: Record<number, PublicProduct | null> = {};
      entries.forEach(([productId, product]) => {
        nextMap[productId] = product;
      });
      setProductById(nextMap);
    };

    loadProducts();
    return () => {
      isActive = false;
    };
  }, [reviews]);

  const resetReviewFlow = () => {
    setReviewStep('phone');
    setReviewPhone('');
    setReviewOtp('');
    setEligibleItems([]);
    setSelectedOrderItemId(null);
    setReviewRating(5);
    setReviewComment('');
    setReviewImage(null);
    setReviewCustomer(null);
    setReviewMessage(null);
    setReviewError(null);
  };

  const openReviewModal = () => {
    resetReviewFlow();
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    resetReviewFlow();
  };

  const sendReviewOtp = async () => {
    if (!reviewPhone.trim()) {
      setReviewError('Please enter your phone number.');
      return;
    }
    setReviewError(null);
    setReviewMessage(null);
    setIsSendingOtp(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/reviews/otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: reviewPhone.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send OTP.');
      }
      if (data?.debug_code) {
        setReviewMessage(`OTP sent. Debug code: ${data.debug_code}`);
      } else {
        setReviewMessage('OTP sent to your phone. Please enter it below.');
      }
      setReviewStep('otp');
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const checkReviewEligibility = async () => {
    if (!reviewOtp.trim()) {
      setReviewError('Please enter the OTP.');
      return;
    }
    setReviewError(null);
    setReviewMessage(null);
    setIsCheckingEligibility(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/public/reviews/eligibility/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Brand-Code': brandConfig.code,
        },
        body: JSON.stringify({ phone: reviewPhone.trim(), otp: reviewOtp.trim() }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to verify OTP.');
      }
      setReviewCustomer(data?.customer ?? null);
      const items = Array.isArray(data?.eligible_items) ? data.eligible_items : [];
      setEligibleItems(items);
      setSelectedOrderItemId(items[0]?.order_item_id ?? null);
      setReviewStep('form');
      if (items.length === 0) {
        setReviewMessage('No eligible purchases found for this phone number.');
      }
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to verify OTP.');
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const submitReview = async () => {
    if (!selectedEligibleItem) {
      setReviewError('Please select a product to review.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please share a short review.');
      return;
    }
    setReviewError(null);
    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('phone', reviewPhone.trim());
      formData.append('otp', reviewOtp.trim());
      formData.append('product_id', String(selectedEligibleItem.product_id));
      formData.append('order_item_id', String(selectedEligibleItem.order_item_id));
      formData.append('rating', String(reviewRating));
      formData.append('comment', reviewComment.trim());
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
      setReviewMessage('Thanks! Your review has been submitted.');
      setIsReviewModalOpen(false);
      resetReviewFlow();
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err: any) {
      setReviewError(err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const reviewActionHeader = (
    <div className="reviews-showcase__header">
      <div>
        <h3 className="reviews-showcase__title">Customer reviews</h3>
        <p className="reviews-showcase__subtitle">
          Purchased with us? Verify your phone to leave a review.
        </p>
      </div>
      <div className="reviews-showcase__actions">
        <button
          type="button"
          onClick={openReviewModal}
          onPointerDown={openReviewModal}
          onTouchStart={openReviewModal}
          aria-haspopup="dialog"
          className="reviews-showcase__cta"
        >
          Leave a review
        </button>
        <Link
          href="/reviews/eligible"
          className="reviews-showcase__link"
        >
          Check eligible purchases
        </Link>
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <div className="reviews-showcase__grid">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-skeleton-${index}`}
            className="reviews-showcase__skeleton"
          />
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <div className="reviews-showcase__error">
        Unable to load reviews right now. Please try again later.
      </div>
    );
  } else if (reviews.length === 0) {
    content = (
      <div className="reviews-showcase__grid">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-empty-${index}`}
            className="reviews-showcase__empty"
          >
            <div className="reviews-showcase__empty-icon">💬</div>
            <p className="reviews-showcase__empty-title">Be the first to review</p>
            <p className="reviews-showcase__empty-copy">Share your experience to help others.</p>
          </div>
        ))}
      </div>
    );
  } else {
    content = (
      <div className="reviews-showcase__carousel">
        <ProductCarousel
          itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
          showNavigation={true}
          showPagination={false}
          autoPlay={false}
        >
          {reviews.map((review) => {
            const imageUrl = review.review_image_url || review.review_image || null;
            const productIds = Array.from(
              new Set(
                [review.product].filter((id): id is number => typeof id === 'number')
              )
            );
            const productsForCard = productIds.map((productId) => productById[productId]).filter(Boolean);

            return (
              <button
                key={review.id}
                type="button"
                onClick={() => setSelectedReview(review)}
                className="reviews-showcase__card"
              >
                <div className="reviews-showcase__card-media">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={review.product_name ?? 'Product review'}
                      fill
                      sizes="(max-width: 640px) 260px, (max-width: 1024px) 280px, 300px"
                      className="reviews-showcase__card-image"
                      unoptimized={imageUrl.includes('localhost') || imageUrl.includes('placehold.co')}
                    />
                  ) : (
                    <div className="reviews-showcase__card-image-placeholder" />
                  )}

                  <div className="reviews-showcase__card-overlay" />

                  <div className="reviews-showcase__card-badge">
                    {review.customer_username || (review.is_admin_review ? 'Admin' : 'Customer')}
                  </div>

                  <div className="reviews-showcase__card-meta">
                    {review.comment && (
                      <p className="reviews-showcase__card-comment">
                        "{review.comment}"
                      </p>
                    )}
                    <div className="reviews-showcase__card-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= review.rating
                              ? 'reviews-showcase__card-star reviews-showcase__card-star--active'
                              : 'reviews-showcase__card-star'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="reviews-showcase__card-product">
                      {review.product_name ?? 'Product'}
                    </p>
                  </div>
                </div>

                <div className="reviews-showcase__card-footer">
                  <p className="reviews-showcase__card-footer-title">
                    Tagged products
                  </p>
                  <div className="reviews-showcase__tag-list">
                    {(productsForCard.length > 0 ? productsForCard : [null]).map((product, index) => {
                      const productId = product?.id ?? review.product;
                      const productImage =
                        product?.primary_image || getPlaceholderProductImage(review.product_name ?? 'Product');
                      const productName = product?.product_name || review.product_name || 'Product';

                      return (
                        <div
                          key={`${productId}-${index}`}
                          className="reviews-showcase__tag"
                        >
                          <div className="reviews-showcase__tag-media">
                            <Image
                              src={productImage}
                              alt={productName}
                              fill
                              className="reviews-showcase__tag-image"
                              sizes="28px"
                            />
                          </div>
                          <span className="reviews-showcase__tag-name">
                            {productName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </ProductCarousel>
      </div>
    );
  }

  return (
    <div className="reviews-showcase">
      {reviewActionHeader}
      {content}

      {selectedReview && (
        <div
          className="reviews-showcase__viewer"
          onClick={() => setSelectedReview(null)}
        >
          {(() => {
            const selectedReviewAny = selectedReview as Review & {
              products?: number[];
              tagged_products?: number[];
            };
            const selectedProductIds = Array.from(
              new Set([
                selectedReview.product,
                ...(Array.isArray(selectedReviewAny.products) ? selectedReviewAny.products : []),
                ...(Array.isArray(selectedReviewAny.tagged_products) ? selectedReviewAny.tagged_products : []),
              ].filter((id): id is number => typeof id === 'number'))
            );
            const selectedProductImage =
              productById[selectedReview.product]?.primary_image ||
              getPlaceholderProductImage(selectedReview.product_name ?? 'Product');
            const productsToDisplay = selectedProductIds
              .map((productId) => productById[productId] || null)
              .filter(Boolean);
            const productsForModal = productsToDisplay.length > 0 ? productsToDisplay : [null];
            const reviewVideoUrl = selectedReview.video_url
              ? convertToYouTubeEmbed(selectedReview.video_url)
              : null;
            const reviewVideoFileUrl = selectedReview.video_file_url || null;

            return (
          <div
            className="reviews-showcase__viewer-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reviews-showcase__viewer-header">
              <p className="reviews-showcase__viewer-title">
                {selectedReview.product_name ?? 'Product'}
              </p>
              <button
                type="button"
                className="reviews-showcase__viewer-close"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <div className="reviews-showcase__viewer-content">
              <div className="reviews-showcase__viewer-media">
                <div className="reviews-showcase__viewer-image-frame">
                  <div className="reviews-showcase__viewer-image-wrap">
                    {selectedReview.review_image_url || selectedReview.review_image ? (
                      <div className="reviews-showcase__viewer-image">
                        <Image
                          src={selectedReview.review_image_url || selectedReview.review_image || ''}
                          alt={selectedReview.product_name ?? 'Product review'}
                          fill
                          sizes="(max-width: 768px) 90vw, 420px"
                          className="reviews-showcase__viewer-image-media"
                          unoptimized={
                            (selectedReview.review_image_url || selectedReview.review_image || '').includes('localhost') ||
                            (selectedReview.review_image_url || selectedReview.review_image || '').includes('placehold.co')
                          }
                        />
                      </div>
                    ) : (
                      <div className="reviews-showcase__viewer-image-placeholder">
                        <span className="reviews-showcase__viewer-image-placeholder-text">{selectedReview.product_name ?? 'Product'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="reviews-showcase__viewer-details">
                <div className="reviews-showcase__viewer-summary">
                  <div>
                    <p className="reviews-showcase__viewer-customer">
                      {selectedReview.customer_username || (selectedReview.is_admin_review ? 'Admin' : 'Customer')}
                    </p>
                    <p className="reviews-showcase__viewer-date">Reviewed {formatDate(selectedReview.date_posted)}</p>
                    <div className="reviews-showcase__viewer-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= selectedReview.rating
                              ? 'reviews-showcase__viewer-star reviews-showcase__viewer-star--active'
                              : 'reviews-showcase__viewer-star'
                          }
                        >
                          ★
                        </span>
                      ))}
                      <span className="reviews-showcase__viewer-rating-count">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </div>
                  {selectedReview.is_admin_review && (
                    <span className="reviews-showcase__viewer-badge">
                      Verified
                    </span>
                  )}
                </div>

                {selectedReview.comment && (
                  <p className="reviews-showcase__viewer-comment">"{selectedReview.comment}"</p>
                )}

                {(reviewVideoUrl || reviewVideoFileUrl) && (
                  <div className="reviews-showcase__viewer-video">
                    <p className="reviews-showcase__viewer-video-title">Review video</p>
                    <div className="reviews-showcase__viewer-video-frame">
                      {reviewVideoUrl ? (
                        <iframe
                          src={reviewVideoUrl}
                          className="reviews-showcase__viewer-video-embed"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={reviewVideoFileUrl || ''}
                          controls
                          className="reviews-showcase__viewer-video-embed"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="reviews-showcase__viewer-product">
                  <p className="reviews-showcase__viewer-product-title">Product</p>
                  <div className="reviews-showcase__viewer-product-list">
                    {productsForModal.map((product, index) => {
                      const productId = product?.id ?? selectedReview.product;
                      const isPrimary = productId === selectedReview.product;
                      const productHref = getProductHref(product ?? undefined, { fallbackId: productId });
                      const productImage = product?.primary_image || selectedProductImage;
                      const productName = product?.product_name || selectedReview.product_name || 'Product';

                      return (
                        <Link
                          key={`${productId}-${index}`}
                          href={productHref}
                          className="reviews-showcase__viewer-product-card"
                          onClick={() => prefillProductCache(productId, product ?? null)}
                        >
                          <div className="reviews-showcase__viewer-product-row">
                            <div className="reviews-showcase__viewer-product-media">
                              <Image
                                src={productImage}
                                alt={productName}
                                fill
                                className="reviews-showcase__viewer-product-image"
                                sizes="48px"
                              />
                            </div>
                            <div className="reviews-showcase__viewer-product-info">
                              <p className="reviews-showcase__viewer-product-name">
                                {productName}
                              </p>
                              {isPrimary && selectedReview.product_condition && (
                                <p className="reviews-showcase__viewer-product-meta">Condition {selectedReview.product_condition}</p>
                              )}
                              {isPrimary && formatPurchaseDate(selectedReview.purchase_date) && (
                                <p className="reviews-showcase__viewer-product-meta">Purchased {formatPurchaseDate(selectedReview.purchase_date)}</p>
                              )}
                            </div>
                            <span className="reviews-showcase__viewer-product-action">
                              View
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
            );
          })()}
        </div>
      )}

      {isReviewModalOpen && (
        <div
          className="reviews-showcase__modal"
          onClick={closeReviewModal}
        >
          <div
            className="reviews-showcase__modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reviews-showcase__modal-header">
              <div>
                <p className="reviews-showcase__modal-title">Leave a review</p>
                <p className="reviews-showcase__modal-subtitle">Verify your purchase to continue.</p>
              </div>
              <button
                type="button"
                className="reviews-showcase__modal-close"
                onClick={closeReviewModal}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            {reviewError && (
              <div className="reviews-showcase__banner reviews-showcase__banner--error">
                {reviewError}
              </div>
            )}
            {reviewMessage && (
              <div className="reviews-showcase__banner reviews-showcase__banner--success">
                {reviewMessage}
              </div>
            )}

            {reviewStep === 'phone' && (
              <div className="reviews-showcase__form">
                <label className="reviews-showcase__label">
                  Phone number
                  <input
                    type="tel"
                    value={reviewPhone}
                    onChange={(event) => setReviewPhone(event.target.value)}
                    placeholder="e.g. 0712345678"
                    className="reviews-showcase__input"
                  />
                </label>
                <button
                  type="button"
                  onClick={sendReviewOtp}
                  disabled={isSendingOtp}
                  className="reviews-showcase__button reviews-showcase__button--primary"
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            )}

            {reviewStep === 'otp' && (
              <div className="reviews-showcase__form">
                <label className="reviews-showcase__label">
                  OTP code
                  <input
                    type="text"
                    value={reviewOtp}
                    onChange={(event) => setReviewOtp(event.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="reviews-showcase__input"
                  />
                </label>
                <div className="reviews-showcase__actions">
                  <button
                    type="button"
                    onClick={checkReviewEligibility}
                    disabled={isCheckingEligibility}
                    className="reviews-showcase__button reviews-showcase__button--primary"
                  >
                    {isCheckingEligibility ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    className="reviews-showcase__button reviews-showcase__button--secondary"
                    onClick={() => setReviewStep('phone')}
                  >
                    Change phone
                  </button>
                </div>
              </div>
            )}

            {reviewStep === 'form' && (
              <div className="reviews-showcase__form">
                {reviewCustomer && (
                  <div className="reviews-showcase__notice">
                    Signed in as <span className="font-semibold">{reviewCustomer.name || 'Customer'}</span> • {reviewCustomer.phone}
                  </div>
                )}

                {eligibleItems.length === 0 ? (
                  <div className="reviews-showcase__notice reviews-showcase__notice--empty">
                    We could not find any paid or delivered purchases for this phone number.
                  </div>
                ) : (
                  <>
                    <label className="reviews-showcase__label">
                      Purchased product
                      <select
                        value={selectedOrderItemId ?? ''}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedOrderItemId(value ? Number(value) : null);
                        }}
                        className="reviews-showcase__input"
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
                        className="reviews-showcase__link-inline"
                      >
                        View product details
                      </Link>
                    )}

                    <div>
                      <p className="reviews-showcase__label">Your rating</p>
                      <div className="reviews-showcase__rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={
                              star <= reviewRating
                                ? 'reviews-showcase__rating-star reviews-showcase__rating-star--active'
                                : 'reviews-showcase__rating-star'
                            }
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="reviews-showcase__label">
                      Your review
                      <textarea
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
                        rows={4}
                        className="reviews-showcase__textarea"
                        placeholder="Share what you liked about the product."
                      />
                    </label>

                    <label className="reviews-showcase__label">
                      Add a photo (optional)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setReviewImage(event.target.files?.[0] ?? null)}
                        className="reviews-showcase__file"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={isSubmittingReview}
                      className="reviews-showcase__button reviews-showcase__button--primary"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit review'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

