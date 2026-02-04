'use client';

import { useProductReviews } from '@/lib/hooks/useReviews';
import { getPlaceholderVideoThumbnail, getPlaceholderVideoUrl, convertToYouTubeEmbed } from '@/lib/utils/placeholders';

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

interface ReviewsSectionProps {
  productId: number;
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { data, isLoading, error } = useProductReviews(productId, { page_size: 10 });

  if (isLoading) {
    return (
      <div className="reviews-section">
        <h2 className="reviews-section__title section-label">Customer Reviews</h2>
        <div className="reviews-section__status reviews-section__status--muted">
          Loading reviews...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviews-section">
        <h2 className="reviews-section__title section-label">Customer Reviews</h2>
        <div className="reviews-section__status reviews-section__status--error">
          Error loading reviews
        </div>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="reviews-section">
        <h2 className="reviews-section__title section-label">Customer Reviews</h2>
        <div className="reviews-section__status reviews-section__status--muted">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      </div>
    );
  }

  const averageRating = data.results.reduce((sum, review) => sum + review.rating, 0) / data.results.length;
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: data.results.filter((r) => r.rating === rating).length,
  }));

  return (
    <div className="reviews-section">
      <h2 className="reviews-section__title reviews-section__title--tight section-label">
        Customer Reviews
      </h2>
      
      {/* Rating Summary */}
      <div className="reviews-section__summary">
        <div className="reviews-section__summary-header">
          <div className="reviews-section__average">{averageRating.toFixed(1)}</div>
          <div>
            <div className="reviews-section__stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(averageRating)
                      ? 'reviews-section__star reviews-section__star--filled'
                      : 'reviews-section__star reviews-section__star--empty'
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <p className="reviews-section__meta">
              Based on {data.count} review{data.count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        {/* Rating Breakdown */}
        <div className="reviews-section__breakdown">
          {ratingCounts.map(({ rating, count }) => {
            const percentage = data.count > 0 ? (count / data.count) * 100 : 0;
            return (
              <div key={rating} className="reviews-section__breakdown-row">
                <span className="reviews-section__breakdown-label">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
                <div className="reviews-section__breakdown-bar">
                  <div
                    className="reviews-section__breakdown-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="reviews-section__breakdown-count">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="reviews-section__list">
        {data.results.map((review) => (
          <div key={review.id} className="reviews-section__item">
            <div className="reviews-section__item-header">
              <div>
                <div className="reviews-section__item-title">
                  <div className="reviews-section__item-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={
                          star <= review.rating
                            ? 'reviews-section__star reviews-section__star--filled'
                            : 'reviews-section__star reviews-section__star--empty'
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="reviews-section__reviewer">
                    {review.customer_username || (review.is_admin_review ? 'Admin' : 'Anonymous')}
                  </span>
                  {review.is_admin_review && (
                    <span className="reviews-section__badge">
                      Verified
                    </span>
                  )}
                </div>
                <p className="reviews-section__date">
                  {formatDate(review.date_posted)}
                </p>
              </div>
            </div>
            
            {review.comment && (
              <p className="reviews-section__comment">
                {review.comment}
              </p>
            )}
            
            {/* Review Video */}
            <div className="reviews-section__video">
              {review.video_url ? (
                <div className="reviews-section__video-frame">
                  <iframe
                    src={convertToYouTubeEmbed(review.video_url)}
                    className="reviews-section__video-embed"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : review.video_file_url ? (
                <div className="reviews-section__video-frame">
                  <video
                    src={review.video_file_url}
                    controls
                    className="reviews-section__video-embed"
                  />
                </div>
              ) : (
                // Show placeholder video for reviews without videos
                <div className="reviews-section__video-frame reviews-section__video-frame--placeholder">
                  <iframe
                    src={convertToYouTubeEmbed(getPlaceholderVideoUrl(`Review: ${review.product_name || 'Product'}`))}
                    className="reviews-section__video-embed"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="reviews-section__video-badge">
                    Placeholder
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(data.next || data.previous) && (
        <div className="reviews-section__pagination">
          <button
            disabled={!data.previous}
            className="reviews-section__pagination-button"
          >
            Previous
          </button>
          <button
            disabled={!data.next}
            className="reviews-section__pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

