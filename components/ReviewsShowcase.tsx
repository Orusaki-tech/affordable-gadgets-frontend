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
  const reviewsQuery = productId
    ? useProductReviews(productId, { page_size: 10 })
    : useAllReviews({ page_size: 10 });
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
    <div className="relative z-[9999] isolate pointer-events-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Customer reviews</h3>
        <p className="text-sm text-gray-500">
          Purchased with us? Verify your phone to leave a review.
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <button
          type="button"
          onClick={openReviewModal}
          onPointerDown={openReviewModal}
          onTouchStart={openReviewModal}
          aria-haspopup="dialog"
          className="pointer-events-auto relative z-[9999] inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
        >
          Leave a review
        </button>
        <Link
          href="/reviews/eligible"
          className="pointer-events-auto text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Check eligible purchases
        </Link>
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-skeleton-${index}`}
            className="h-[320px] sm:h-[340px] lg:h-[360px] rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <div className="text-center py-8 text-red-500">
        Unable to load reviews right now. Please try again later.
      </div>
    );
  } else if (reviews.length === 0) {
    content = (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-empty-${index}`}
            className="h-[320px] sm:h-[340px] lg:h-[360px] rounded-2xl border border-dashed border-gray-300 bg-white p-4 sm:p-6 text-center text-gray-500"
          >
            <div className="text-4xl mb-4">💬</div>
            <p className="font-semibold">Be the first to review</p>
            <p className="text-sm mt-2">Share your experience to help others.</p>
          </div>
        ))}
      </div>
    );
  } else {
    content = (
      <div className="relative">
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
                className="group relative w-full h-[320px] sm:h-[340px] lg:h-[360px] rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-black/5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none grid grid-rows-[60%_40%] sm:grid-rows-[65%_35%]"
              >
                <div className="relative bg-gray-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={review.product_name ?? 'Product review'}
                      fill
                      sizes="(max-width: 640px) 260px, (max-width: 1024px) 280px, 300px"
                      className="object-contain bg-gray-50"
                      unoptimized={imageUrl.includes('localhost') || imageUrl.includes('placehold.co')}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-sm text-gray-600">{review.product_name}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold text-gray-900 shadow-sm">
                    {review.customer_username || (review.is_admin_review ? 'Admin' : 'Customer')}
                  </div>

                  <div className="absolute bottom-12 sm:bottom-14 left-3 right-3 text-white">
                    <div className="flex gap-1 text-yellow-300 mb-1 text-[12px] sm:text-[13px]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-300' : 'text-white/40'}>
                          ★
                        </span>
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-[12px] sm:text-[13px] leading-[18px] sm:leading-[20px] line-clamp-3">"{review.comment}"</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-white p-3 sm:p-4">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    Tagged products
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {(productsForCard.length > 0 ? productsForCard : [null]).map((product, index) => {
                      const productId = product?.id ?? review.product;
                      const productImage =
                        product?.primary_image || getPlaceholderProductImage(review.product_name ?? 'Product');
                      const productName = product?.product_name || review.product_name || 'Product';

                      return (
                        <div
                          key={`${productId}-${index}`}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-sm"
                        >
                          <div className="relative h-7 w-7 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            <Image
                              src={productImage}
                              alt={productName}
                              fill
                              className="object-contain"
                              sizes="28px"
                            />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-medium text-gray-700 whitespace-nowrap">
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
    <div className="relative z-[60] pointer-events-auto">
      {reviewActionHeader}
      {content}

      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-slate-50 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-center border-b border-gray-200 px-6 py-4">
              <p className="text-sm font-semibold text-gray-700">
                {selectedReview.product_name ?? 'Product'}
              </p>
              <button
                type="button"
                className="absolute right-4 top-3.5 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <div className="grid max-h-[calc(78vh-56px)] grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-0">
              <div className="flex items-center justify-center bg-slate-50 p-5 md:p-6">
                <div className="w-full max-w-[420px] rounded-2xl bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-center rounded-2xl bg-gray-100 p-2">
                    {selectedReview.review_image_url || selectedReview.review_image ? (
                      <div className="relative w-full h-[52vh] max-h-[52vh]">
                        <Image
                          src={selectedReview.review_image_url || selectedReview.review_image || ''}
                          alt={selectedReview.product_name ?? 'Product review'}
                          fill
                          sizes="(max-width: 768px) 90vw, 420px"
                          className="object-contain bg-white"
                          unoptimized={
                            (selectedReview.review_image_url || selectedReview.review_image || '').includes('localhost') ||
                            (selectedReview.review_image_url || selectedReview.review_image || '').includes('placehold.co')
                          }
                        />
                      </div>
                    ) : (
                      <div className="h-[52vh] w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-2xl">
                        <span className="text-sm text-gray-600">{selectedReview.product_name ?? 'Product'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedReview.customer_username || (selectedReview.is_admin_review ? 'Admin' : 'Customer')}
                    </p>
                    <p className="text-xs text-gray-500">Reviewed {formatDate(selectedReview.date_posted)}</p>
                    <div className="mt-2 flex items-center gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-900">
                        {selectedReview.rating}/5
                      </span>
                    </div>
                  </div>
                  {selectedReview.is_admin_review && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Verified
                    </span>
                  )}
                </div>

                {selectedReview.comment && (
                  <p className="mt-4 text-sm leading-relaxed text-gray-700">"{selectedReview.comment}"</p>
                )}

                {(reviewVideoUrl || reviewVideoFileUrl) && (
                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Review video</p>
                    <div className="relative aspect-video w-full max-w-md max-h-64 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      {reviewVideoUrl ? (
                        <iframe
                          src={reviewVideoUrl}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          src={reviewVideoFileUrl || ''}
                          controls
                          className="h-full w-full"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Product</p>
                  <div className="max-h-[200px] space-y-3 overflow-y-auto pr-1">
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
                          className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                          onClick={() => prefillProductCache(productId, product ?? null)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                              <Image
                                src={productImage}
                                alt={productName}
                                fill
                                className="object-contain"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                                {productName}
                              </p>
                              {isPrimary && selectedReview.product_condition && (
                                <p className="text-xs text-gray-500">Condition {selectedReview.product_condition}</p>
                              )}
                              {isPrimary && formatPurchaseDate(selectedReview.purchase_date) && (
                                <p className="text-xs text-gray-500">Purchased {formatPurchaseDate(selectedReview.purchase_date)}</p>
                              )}
                            </div>
                            <span className="ml-auto inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={closeReviewModal}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-lg font-semibold text-gray-900">Leave a review</p>
                <p className="text-sm text-gray-500">Verify your purchase to continue.</p>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                onClick={closeReviewModal}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            {reviewError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {reviewError}
              </div>
            )}
            {reviewMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {reviewMessage}
              </div>
            )}

            {reviewStep === 'phone' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Phone number
                  <input
                    type="tel"
                    value={reviewPhone}
                    onChange={(event) => setReviewPhone(event.target.value)}
                    placeholder="e.g. 0712345678"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={sendReviewOtp}
                  disabled={isSendingOtp}
                  className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            )}

            {reviewStep === 'otp' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  OTP code
                  <input
                    type="text"
                    value={reviewOtp}
                    onChange={(event) => setReviewOtp(event.target.value)}
                    placeholder="Enter the 6-digit code"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={checkReviewEligibility}
                    disabled={isCheckingEligibility}
                    className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isCheckingEligibility ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => setReviewStep('phone')}
                  >
                    Change phone
                  </button>
                </div>
              </div>
            )}

            {reviewStep === 'form' && (
              <div className="space-y-4">
                {reviewCustomer && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    Signed in as <span className="font-semibold">{reviewCustomer.name || 'Customer'}</span> • {reviewCustomer.phone}
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
                            onClick={() => setReviewRating(star)}
                            className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block text-sm font-medium text-gray-700">
                      Your review
                      <textarea
                        value={reviewComment}
                        onChange={(event) => setReviewComment(event.target.value)}
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
      )}
    </div>
  );
}

