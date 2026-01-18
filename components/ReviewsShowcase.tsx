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

  const reviews = data?.results ?? [];

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

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-skeleton-${index}`}
            className="h-[420px] rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Unable to load reviews right now. Please try again later.
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div
            key={`review-empty-${index}`}
            className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500"
          >
            <div className="text-4xl mb-4">💬</div>
            <p className="font-semibold">Be the first to review</p>
            <p className="text-sm mt-2">Share your experience to help others.</p>
          </div>
        ))}
      </div>
    );
  }

    return (
      <div>
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
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
                className="group relative w-[260px] sm:w-[280px] lg:w-[300px] shrink-0 snap-start rounded-2xl overflow-hidden bg-white shadow-md ring-1 ring-black/5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xl focus:outline-none"
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={review.product_name ?? 'Product review'}
                      className="h-full w-full object-contain bg-gray-50"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-sm text-gray-600">{review.product_name}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-900 shadow-sm">
                    {review.customer_username || (review.is_admin_review ? 'Admin' : 'Customer')}
                  </div>

                  <div className="absolute bottom-14 left-3 right-3 text-white">
                    <div className="flex gap-1 text-yellow-300 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= review.rating ? 'text-yellow-300' : 'text-white/40'}>
                          ★
                        </span>
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm line-clamp-3">"{review.comment}"</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
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
                          <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">
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
        </div>

        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-white to-transparent" />
      </div>

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
                      <img
                        src={selectedReview.review_image_url || selectedReview.review_image || ''}
                        alt={selectedReview.product_name ?? 'Product review'}
                        className="w-full max-h-[52vh] object-contain bg-black"
                      />
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
    </div>
  );
}

