'use client';

import { useState } from 'react';
import { useAllReviews } from '@/lib/hooks/useReviews';

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
  const [selectedReview, setSelectedReview] = useState<typeof data?.results[number] | null>(null);

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
                className="group relative w-[260px] sm:w-[280px] lg:w-[300px] shrink-0 snap-start rounded-2xl overflow-hidden shadow-lg text-left focus:outline-none"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={review.product_name}
                    className="h-[360px] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-[360px] w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-sm text-gray-600">{review.product_name}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 bg-white/90 text-xs font-semibold px-2 py-1 rounded">
                  {review.customer_username || (review.is_admin_review ? 'Admin' : 'Customer')}
                </div>

                <div className="absolute bottom-16 left-3 right-3 text-white">
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

                <div className="absolute bottom-0 left-0 right-0 bg-white p-3">
                  <p className="text-xs font-medium">{review.product_name}</p>
                  {review.product_condition && (
                    <p className="text-xs text-gray-500">{review.product_condition}</p>
                  )}
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
            className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-black">
                {selectedReview.review_image_url ? (
                  <img
                    src={selectedReview.review_image_url}
                    alt={selectedReview.product_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-sm text-gray-600">{selectedReview.product_name}</span>
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {selectedReview.customer_username || (selectedReview.is_admin_review ? 'Admin' : 'Customer')}
                    </p>
                    <div className="flex gap-1 text-yellow-400 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => setSelectedReview(null)}
                  >
                    ✕
                  </button>
                </div>

                {selectedReview.is_admin_review && (
                  <span className="mt-3 inline-flex text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}

                {selectedReview.comment && (
                  <p className="mt-4 text-gray-700 leading-relaxed">"{selectedReview.comment}"</p>
                )}

                <div className="mt-6 space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-900">Product:</span> {selectedReview.product_name}</p>
                  {selectedReview.product_condition && (
                    <p><span className="font-medium text-gray-900">Condition:</span> {selectedReview.product_condition}</p>
                  )}
                  {formatPurchaseDate(selectedReview.purchase_date) && (
                    <p><span className="font-medium text-gray-900">Purchased:</span> {formatPurchaseDate(selectedReview.purchase_date)}</p>
                  )}
                  <p><span className="font-medium text-gray-900">Reviewed:</span> {formatDate(selectedReview.date_posted)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

