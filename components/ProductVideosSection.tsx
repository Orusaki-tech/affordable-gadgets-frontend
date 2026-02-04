'use client';

import { useProducts } from '@/lib/hooks/useProducts';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getPlaceholderVideoThumbnail, getPlaceholderVideoUrl, getPlaceholderVideoUrls, convertToYouTubeEmbed } from '@/lib/utils/placeholders';

export function ProductVideosSection() {
  const searchParams = useSearchParams();
  const [selectedVideo, setSelectedVideo] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const { data, isLoading } = useProducts({ page_size: 24, enabled: isVisible });

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Check if there's a video ID in the URL hash or query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check URL hash (e.g., /videos#video-123)
      const hash = window.location.hash;
      if (hash.startsWith('#video-')) {
        const videoId = parseInt(hash.replace('#video-', ''));
        if (videoId) {
          setSelectedVideo(videoId);
          // Scroll to the video section
          setTimeout(() => {
            const element = document.getElementById(`video-card-${videoId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
      
      // Also check query params (e.g., /videos?video=123)
      const videoParam = searchParams.get('video');
      if (videoParam) {
        const videoId = parseInt(videoParam);
        if (videoId) {
          setSelectedVideo(videoId);
          setTimeout(() => {
            const element = document.getElementById(`video-card-${videoId}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    }
  }, [searchParams]);

  // Filter products that have videos, or use all products with dummy videos
  const productsWithVideos = (data?.results || []).filter(
    (product) => product.product_video_url
  );

  // If no products have videos, show products with dummy videos
  const productsToShow = productsWithVideos.length > 0 
    ? productsWithVideos 
    : (data?.results || []).slice(0, 6).map((product) => ({
        ...product,
        product_video_url: getPlaceholderVideoUrl(product.product_name),
      }));

  const productsToShowWithId = productsToShow.filter(
    (product): product is typeof product & { id: number } => typeof product.id === 'number'
  );

  if (isLoading) {
    return (
      <div className="product-videos product-videos__grid product-videos__grid--loading">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="product-videos__skeleton" />
        ))}
      </div>
    );
  }

  if (productsToShowWithId.length === 0) {
    return (
      <div className="product-videos product-videos__empty">
        <p className="product-videos__empty-text">No product videos available at the moment.</p>
        <Link href="/products" className="product-videos__empty-link">
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="product-videos">
      <h2 className="product-videos__title section-label">Product Videos</h2>
      <div className="product-videos__grid">
        {productsToShowWithId.map((product) => (
          <div
            key={product.id}
            id={`video-card-${product.id}`}
            className="product-videos__card"
            onClick={() => setSelectedVideo(selectedVideo === product.id ? null : product.id)}
          >
            {/* Product Image/Thumbnail */}
            <div className="product-videos__media">
              <Image
                src={product.primary_image || getPlaceholderVideoThumbnail(product.product_name)}
                alt={product.product_name}
                fill
                className="product-videos__media-image"
                unoptimized={!product.primary_image || product.primary_image.includes('placehold.co')}
              />
              
              {/* Play Button Overlay */}
              <div className="product-videos__overlay">
                <div className="product-videos__overlay-button">
                  <svg className="product-videos__overlay-icon" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="product-videos__info">
              <h3 className="product-videos__name product-card-name">
                {product.product_name}
              </h3>
              {product.brand && (
                <p className="product-videos__brand product-card-spec">
                  {product.brand}
                </p>
              )}
              {product.min_price && product.max_price && (
                <p className="product-videos__price product-card-price">
                  KES {product.min_price.toLocaleString()} - {product.max_price.toLocaleString()}
                </p>
              )}
            </div>

            {/* Video Player (shown when selected) */}
            {selectedVideo === product.id && (
              <div className="product-videos__player">
                <div className="product-videos__player-frame">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideo(null);
                    }}
                    className="product-videos__player-close"
                  >
                    ×
                  </button>
                  <iframe
                    src={convertToYouTubeEmbed(product.product_video_url || getPlaceholderVideoUrl(product.product_name))}
                    className="product-videos__player-embed"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

