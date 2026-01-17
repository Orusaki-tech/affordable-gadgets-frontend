'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAllReviews } from '@/lib/hooks/useReviews';
import type { Review } from '@/lib/api/reviews';
import { getPlaceholderProductImage } from '@/lib/utils/placeholders';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
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

export function ReviewsShowcase() {
  const { data, isLoading } = useAllReviews({ page_size: 10 });
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading reviews...</div>;
  }

  const reviews = data?.results ?? [];

  if (reviews.length === 0) {
    return <div className="text-center py-8 text-gray-500">No reviews yet.</div>;
  }

    return (
      <div>
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory">
          {reviews.map((review) => {
            const imageUrl = review.review_image_url || review.review_image || null;

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
                      alt={review.product_name}
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

                <div className="flex items-center gap-3 p-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <Image
                      src={getPlaceholderProductImage(review.product_name)}
                      alt={review.product_name}
                      fill
                      className="object-contain"
                      sizes="44px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 line-clamp-1">{review.product_name}</p>
                    {review.product_condition && (
                      <p className="text-[11px] text-gray-500">{review.product_condition}</p>
                    )}
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
          <div
            className="w-full max-w-5xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className="text-sm font-semibold text-gray-700">{selectedReview.product_name}</p>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => setSelectedReview(null)}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <div className="grid max-h-[calc(80vh-64px)] grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
              <div className="flex items-center justify-center bg-gray-50 p-6">
                <div className="relative w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-sm">
                  <div className="relative aspect-[4/5] bg-gray-100">
                    {selectedReview.review_image_url ? (
                      <img
                        src={selectedReview.review_image_url}
                        alt={selectedReview.product_name}
                        className="h-full w-full object-contain bg-black"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-sm text-gray-600">{selectedReview.product_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5 p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedReview.customer_username || (selectedReview.is_admin_review ? 'Admin' : 'Customer')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reviewed {formatDate(selectedReview.date_posted)}
                    </p>
                    <div className="mt-2 flex gap-1 text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectedReview.is_admin_review && (
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Verified
                    </span>
                  )}
                </div>

                {selectedReview.comment && (
                  <p className="text-sm leading-relaxed text-gray-700">"{selectedReview.comment}"</p>
                )}

                <Link
                  href={`/products/${selectedReview.product}`}
                  className="mt-auto rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src={getPlaceholderProductImage(selectedReview.product_name)}
                        alt={selectedReview.product_name}
                        fill
                        className="object-contain"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                        {selectedReview.product_name}
                      </p>
                      {selectedReview.product_condition && (
                        <p className="text-xs text-gray-500">Condition {selectedReview.product_condition}</p>
                      )}
                      {formatPurchaseDate(selectedReview.purchase_date) && (
                        <p className="text-xs text-gray-500">Purchased {formatPurchaseDate(selectedReview.purchase_date)}</p>
                      )}
                    </div>
                    <div className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500">
                      →
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

