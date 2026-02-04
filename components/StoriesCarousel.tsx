'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { PublicPromotion, PublicProduct } from '@/lib/api/generated';
import { useRouter } from 'next/navigation';
import { getProductHref } from '@/lib/utils/productRoutes';
import { getCloudinarySizedImageUrl } from '@/lib/utils/cloudinary';
import { ProductCarousel } from './ProductCarousel';

interface VideoModalProps {
  videoUrl: string;
  title: string;
  onClose: () => void;
}

function VideoModal({ videoUrl, title, onClose }: VideoModalProps) {
  // Convert YouTube URL to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    // Handle YouTube URLs
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    // Handle Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return url;
  };

  return (
    <div className="stories-carousel__modal" onClick={onClose}>
      <div className="stories-carousel__modal-panel" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="stories-carousel__modal-close"
          aria-label="Close video"
        >
          <svg className="stories-carousel__modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="stories-carousel__modal-embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
        <div className="stories-carousel__modal-titlebar">
          <h3 className="stories-carousel__modal-title">{title}</h3>
        </div>
      </div>
    </div>
  );
}

interface StoryImageProps {
  src: string;
  alt: string;
  sizes: string;
  fit?: 'contain' | 'cover';
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
}

function StoryImage({
  src,
  alt,
  sizes,
  fit = 'contain',
  loading = 'lazy',
  fetchPriority = 'auto',
  className,
}: StoryImageProps) {
  const sizeCandidates = [150, 300, 600, 1200, 2400];
  const src150 = getCloudinarySizedImageUrl(src, 150, fit);
  const fitClassName = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <img
      src={src150}
      srcSet={sizeCandidates
        .map((size) => `${getCloudinarySizedImageUrl(src, size, fit)} ${size}w`)
        .join(', ')}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={`stories-carousel__media ${fitClassName === 'object-cover' ? 'stories-carousel__media--cover' : 'stories-carousel__media--contain'}${className ? ` ${className}` : ''}`}
    />
  );
}

function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

interface StoryVideoProps {
  src: string;
  poster?: string | null;
  fit?: 'contain' | 'cover';
  onRef?: (el: HTMLVideoElement | null) => void;
}

function StoryVideo({ src, poster, fit = 'contain', onRef }: StoryVideoProps) {
  const fitClassName = fit === 'cover' ? 'object-cover' : 'object-contain';

  return (
    <video
      ref={onRef}
      src={src}
      poster={poster || undefined}
      muted
      loop
      playsInline
      autoPlay
      preload="metadata"
      className={`stories-carousel__media ${fitClassName === 'object-cover' ? 'stories-carousel__media--cover' : 'stories-carousel__media--contain'}`}
    />
  );
}

interface StoriesCarouselProps {
  autoAdvanceDuration?: number;
}

export function StoriesCarousel({ autoAdvanceDuration = 5 }: StoriesCarouselProps) {
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);
  const router = useRouter();
  const bannerContainerRef = useRef<HTMLDivElement | null>(null);
  const gridItemRef = useRef<HTMLDivElement | null>(null);
  const loggedLayoutRef = useRef(false);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Fetch promotions and products with videos
  const { data: promotionsData, isLoading: promotionsLoading } = usePromotions({
    page_size: 12,
    display_location: ['special_offers', 'flash_sales', 'stories_carousel'],
  });
  const shouldFetchProducts = !promotionsLoading && (promotionsData?.results?.length ?? 0) < 5;
  const { data: productsData } = useProducts({ page_size: 8, enabled: shouldFetchProducts });

  const normalizeLocations = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  // Process promotions - combine special_offers and flash_sales
  const allPromotions = useMemo(() => {
    const promotions = (promotionsData?.results || []) as PublicPromotion[];
    return promotions.filter((promo) => {
      const locations = normalizeLocations(promo.display_locations);
      const hasLocations = locations.length > 0;
      if (!hasLocations) {
        return true;
      }
      return (
        locations.includes('special_offers') || 
        locations.includes('flash_sales') ||
        locations.includes('stories_carousel')
      );
    }).sort((a, b) => {
      // Sort by carousel_position if set, otherwise by start_date
      const aPos = a.carousel_position;
      const bPos = b.carousel_position;
      const aHasPos = typeof aPos === 'number';
      const bHasPos = typeof bPos === 'number';
      
      if (aHasPos && bHasPos) {
        return aPos - bPos; // Sort by position number (1-5)
      } else if (aHasPos) {
        return -1; // Promotions with position come first
      } else if (bHasPos) {
        return 1;
      } else {
        // Both have no position, sort by date
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });
  }, [promotionsData]);

  // Process products with videos
  const productsWithVideos = useMemo(() => {
    if (!shouldFetchProducts) return [];
    return (productsData?.results || []).filter((product) => product.product_video_url);
  }, [productsData, shouldFetchProducts]);

  const showSkeleton = promotionsLoading && !promotionsData;

  // Get items for display: use carousel_position if set, otherwise use order
  // Support carousel at position 1 - if multiple items have position 1, show as carousel
  const position1Items = useMemo(() => {
    return allPromotions.filter(p => p.carousel_position === 1);
  }, [allPromotions]);

  const bannerItem = useMemo(() => {
    // If multiple items have position 1, return null (will show as carousel)
    if (position1Items.length > 1) return null;
    // If single item with position 1, return it
    if (position1Items.length === 1) return position1Items[0];
    // Fallback to first promotion if no position 1 is set
    return allPromotions.length > 0 ? allPromotions[0] : null;
  }, [allPromotions, position1Items]);

  const bannerImageSrc = bannerItem?.banner_image_url || bannerItem?.banner_image;

  const gridItems = useMemo(() => {
    const items: Array<{ type: 'promotion' | 'video'; data: PublicPromotion | PublicProduct; uniqueKey: string; position: number }> = [];
    const usedPromotionIds = new Set<number>();
    
    // Add position 1 items to used set (whether single banner or carousel)
    position1Items.forEach(item => {
      if (typeof item.id === 'number') {
        usedPromotionIds.add(item.id);
      }
    });
    
    // Get promotions with positions 2-5
    const positionedPromotions = allPromotions
      .filter((promo) => {
        const pos = promo.carousel_position;
        const promoId = promo.id;
        return (
          typeof promoId === 'number' &&
          typeof pos === 'number' &&
          pos >= 2 &&
          pos <= 5 &&
          !usedPromotionIds.has(promoId)
        );
      })
      .sort((a, b) => (a.carousel_position ?? 0) - (b.carousel_position ?? 0));
    
    // Add positioned promotions to their slots
    positionedPromotions.forEach((promo) => {
      const pos = promo.carousel_position;
      const promoId = promo.id;
      if (typeof pos === 'number' && pos >= 2 && pos <= 5 && typeof promoId === 'number') {
        items.push({ 
          type: 'promotion', 
          data: promo, 
          uniqueKey: `promo-${promoId}`,
          position: pos
        });
        usedPromotionIds.add(promoId);
      }
    });
    
    // Fill remaining slots with promotions without positions
    const unpositionedPromotions = allPromotions.filter((promo) => {
      const promoId = promo.id;
      if (typeof promoId === 'number' && usedPromotionIds.has(promoId)) {
        return false;
      }
      const pos = promo.carousel_position;
      return typeof pos !== 'number' || pos > 5;
    });
    
    // Fill positions 2-5 in order
    for (let pos = 2; pos <= 5 && items.length < 4; pos++) {
      const existingAtPos = items.find(item => item.position === pos);
      if (!existingAtPos) {
        // Try to find an unpositioned promotion
        const nextPromo = unpositionedPromotions.find((p) => {
          const promoId = p.id;
          return typeof promoId !== 'number' || !usedPromotionIds.has(promoId);
        });
        if (nextPromo) {
          const promoId = nextPromo.id;
          const promoKey = typeof promoId === 'number' ? promoId : nextPromo.title;
          items.push({ 
            type: 'promotion', 
            data: nextPromo, 
            uniqueKey: `promo-${promoKey}`,
            position: pos
          });
          if (typeof promoId === 'number') {
            usedPromotionIds.add(promoId);
          }
        } else if (productsWithVideos.length > 0 && items.length < 4) {
          // Add product video if no promotion available
          const featuredVideo = productsWithVideos[0];
          const videoKey = featuredVideo.id ?? featuredVideo.product_name;
          items.push({ 
            type: 'video', 
            data: featuredVideo, 
            uniqueKey: `video-${videoKey}`,
            position: pos
          });
          break; // Only add one video
        }
      }
    }
    
    // Sort by position and return
    return items.sort((a, b) => a.position - b.position).slice(0, 4);
  }, [allPromotions, productsWithVideos, position1Items]);

  useEffect(() => {
    if (loggedLayoutRef.current) return;
    loggedLayoutRef.current = true;
  }, [bannerItem, gridItems]);

  const handlePromotionClick = (promotion: PublicPromotion) => {
    const firstProductId = promotion.products && promotion.products.length > 0 
      ? promotion.products[0] 
      : null;

    if (firstProductId) {
      router.push(`/products/${firstProductId}?promotion=${promotion.id}`);
    } else {
      router.push(`/products?promotion=${promotion.id}`);
    }
  };

  const handleVideoClick = (product: PublicProduct) => {
    if (product.product_video_url) {
      setSelectedVideo({
        url: product.product_video_url,
        title: product.product_name
      });
    } else {
      router.push(getProductHref(product));
    }
  };


  if (showSkeleton) {
    return (
      <div className="stories-carousel__skeleton" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div 
          className="stories-carousel__skeleton-banner" 
          style={{ height: 'min(50vw, calc((100vh - 200px) * 0.9))' }}
        />
        <div className="stories-carousel__skeleton-grid">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="stories-carousel__skeleton-tile"
              style={{ height: 'min(25vw, calc((100vh - 200px) * 0.45))' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedVideo && (
        <VideoModal
          videoUrl={selectedVideo.url}
          title={selectedVideo.title}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <div className="stories-carousel">
        {/* Desktop: Large Banner + 2x2 Grid Layout - Matching Figma Design */}
        <div className="stories-carousel__desktop">
          {/* Large Banner or Carousel - Position 1 (Left Side, 50% width, Square) */}
          {position1Items.length > 1 ? (
            // Show carousel if multiple items have position 1
            <div className="stories-carousel__banner">
              <ProductCarousel
                itemsPerView={{ mobile: 1, tablet: 1, desktop: 1 }}
                showNavigation={true}
                showPagination={true}
                autoPlay={true}
                autoPlayInterval={autoAdvanceDuration * 1000}
                className="stories-carousel__carousel"
              >
                {position1Items.map((promo) => {
                  const promoImageSrc = promo.banner_image_url || promo.banner_image;
                  return (
                    <div
                      key={promo.id ?? promo.title}
                      className="stories-carousel__tile stories-carousel__tile--banner"
                      onClick={() => handlePromotionClick(promo)}
                    >
                      <div className="stories-carousel__media-wrap" ref={bannerContainerRef}>
                        {promoImageSrc && (
                          <StoryImage
                            src={promoImageSrc}
                            alt={promo.title}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            fit="cover"
                            loading="eager"
                            fetchPriority="high"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </ProductCarousel>
            </div>
          ) : bannerItem ? (
            // Show single banner if one item has position 1
            <div className="stories-carousel__banner">
              <div
                className="stories-carousel__tile stories-carousel__tile--banner"
                onClick={() => handlePromotionClick(bannerItem)}
              >
                <div className="stories-carousel__media-wrap" ref={bannerContainerRef}>
                  {bannerImageSrc && (
                    <StoryImage
                      src={bannerImageSrc}
                      alt={bannerItem.title}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      fit="cover"
                      loading="eager"
                      fetchPriority="high"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
          <div
            className="stories-carousel__tile stories-carousel__tile--placeholder"
            style={{ maxWidth: 'calc(100vh - 250px)' }}
          />
          )}

          {/* 2x2 Grid - Next 3 Promotions + 1 Product Video (Right Side, 50% width, Square cards) */}
          <div className="stories-carousel__grid">
            {gridItems.length > 0 ? (
              gridItems.map((item) => {
                if (item.type === 'promotion') {
                  const promotion = item.data as PublicPromotion;
                  const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
              return (
                    <div
                      key={item.uniqueKey}
                      className="stories-carousel__tile"
                      onClick={() => handlePromotionClick(promotion)}
                    >
                    <div className="stories-carousel__media-wrap" ref={gridItemRef}>
                      {promotionImageSrc && (
                      <StoryImage
                        src={promotionImageSrc}
                        alt={promotion.title}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        fit="contain"
                      />
                      )}
                    </div>
                  </div>
                );
                } else {
                  // Product Video
                  const product = item.data as PublicProduct;
                  const videoImageSrc = product.primary_image;
                  const hasInlineVideo = isDirectVideoUrl(product.product_video_url);
                  return (
                    <div
                      key={item.uniqueKey}
                      className="stories-carousel__tile"
                      onClick={() => {
                        if (hasInlineVideo && product.product_video_url) {
                          const video = videoRefs.current.get(item.uniqueKey);
                          if (video) {
                            if (video.paused) {
                              video.play().catch(() => {});
                            } else {
                              video.pause();
                            }
                          }
                          return;
                        }
                        handleVideoClick(product);
                      }}
                    >
                      <div className="stories-carousel__media-wrap">
                        {hasInlineVideo && product.product_video_url ? (
                          <StoryVideo
                            src={product.product_video_url}
                            poster={videoImageSrc}
                            fit="contain"
                            onRef={(el) => {
                              if (el) {
                                videoRefs.current.set(item.uniqueKey, el);
                              } else {
                                videoRefs.current.delete(item.uniqueKey);
                              }
                            }}
                          />
                        ) : (
                          videoImageSrc && (
                            <StoryImage
                              src={videoImageSrc}
                              alt={product.product_name}
                              sizes="(max-width: 1024px) 50vw, 25vw"
                              fit="contain"
                            />
                          )
                        )}
                </div>
              </div>
            );
              }
              })
            ) : (
              // Show placeholder squares if no items
              [...Array(4)].map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="stories-carousel__tile stories-carousel__tile--placeholder"
                />
              ))
            )}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Stack Layout - Matching Figma Design (Banner on top, 2x2 grid below) */}
        <div className="stories-carousel__mobile">
          {/* Large Banner or Carousel - Position 1 (Full width on mobile) */}
          {position1Items.length > 1 ? (
            // Show carousel if multiple items have position 1
            <div className="stories-carousel__mobile-section">
              <ProductCarousel
                itemsPerView={{ mobile: 1, tablet: 1, desktop: 1 }}
                showNavigation={true}
                showPagination={true}
                autoPlay={true}
                autoPlayInterval={autoAdvanceDuration * 1000}
                className="stories-carousel__carousel"
              >
                {position1Items.map((promo) => {
                  const promoImageSrc = promo.banner_image_url || promo.banner_image;
                  return (
                    <div
                      key={promo.id ?? promo.title}
                      className="stories-carousel__tile stories-carousel__tile--banner stories-carousel__tile--mobile"
                      onClick={() => handlePromotionClick(promo)}
                    >
                      <div className="stories-carousel__media-wrap">
                        {promoImageSrc && (
                          <StoryImage
                            src={promoImageSrc}
                            alt={promo.title}
                            sizes="100vw"
                            fit="cover"
                            loading="eager"
                            fetchPriority="high"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </ProductCarousel>
            </div>
          ) : bannerItem && (
            // Show single banner if one item has position 1
            <div
              className="stories-carousel__tile stories-carousel__tile--banner stories-carousel__tile--mobile"
              onClick={() => handlePromotionClick(bannerItem)}
            >
              <div className="stories-carousel__media-wrap">
                {bannerImageSrc && (
                <StoryImage
                  src={bannerImageSrc}
                  alt={bannerItem.title}
                  sizes="100vw"
                  fit="cover"
                  loading="eager"
                  fetchPriority="high"
                />
                )}
              </div>
            </div>
          )}

          {/* 2x2 Grid - Next 3 Promotions + 1 Product Video (Full width on mobile) */}
          <div className="stories-carousel__grid">
            {gridItems.length > 0 ? (
              gridItems.map((item) => {
                if (item.type === 'promotion') {
                  const promotion = item.data as PublicPromotion;
                  const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
                  return (
                    <div
                      key={item.uniqueKey}
                      className="stories-carousel__tile stories-carousel__tile--mobile"
                      onClick={() => handlePromotionClick(promotion)}
                    >
                      <div className="stories-carousel__media-wrap">
                        {promotionImageSrc && (
                        <StoryImage
                          src={promotionImageSrc}
                          alt={promotion.title}
                          sizes="50vw"
                          fit="contain"
                        />
                        )}
                      </div>
                </div>
              );
                } else {
                  // Product Video
                  const product = item.data as PublicProduct;
                  const videoImageSrc = product.primary_image;
                  const hasInlineVideo = isDirectVideoUrl(product.product_video_url);
                  return (
                    <div
                      key={item.uniqueKey}
                      className="stories-carousel__tile stories-carousel__tile--mobile"
                      onClick={() => {
                        if (hasInlineVideo && product.product_video_url) {
                          const video = videoRefs.current.get(item.uniqueKey);
                          if (video) {
                            if (video.paused) {
                              video.play().catch(() => {});
                            } else {
                              video.pause();
                            }
                          }
                          return;
                        }
                        handleVideoClick(product);
                      }}
                    >
                      <div className="stories-carousel__media-wrap">
                        {hasInlineVideo && product.product_video_url ? (
                          <StoryVideo
                            src={product.product_video_url}
                            poster={videoImageSrc}
                            fit="contain"
                            onRef={(el) => {
                              if (el) {
                                videoRefs.current.set(item.uniqueKey, el);
                              } else {
                                videoRefs.current.delete(item.uniqueKey);
                              }
                            }}
                          />
                        ) : (
                          videoImageSrc && (
                            <StoryImage
                              src={videoImageSrc}
                              alt={product.product_name}
                              sizes="50vw"
                              fit="contain"
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              })
            ) : (
              // Show placeholder squares if no items
              [...Array(4)].map((_, i) => (
                <div
                  key={`placeholder-mobile-${i}`}
                  className="stories-carousel__tile stories-carousel__tile--placeholder"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
