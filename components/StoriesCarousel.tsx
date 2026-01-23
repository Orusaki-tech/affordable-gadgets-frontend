'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { usePromotions } from '@/lib/hooks/usePromotions';
import { useProducts } from '@/lib/hooks/useProducts';
import { PublicPromotion, PublicProduct } from '@/lib/api/generated';
import { useRouter } from 'next/navigation';
import { getProductHref } from '@/lib/utils/productRoutes';
import { getCloudinarySizedImageUrl } from '@/lib/utils/cloudinary';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl mx-4 aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
          aria-label="Close video"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <iframe
          src={getEmbedUrl(videoUrl)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <h3 className="text-white font-semibold">{title}</h3>
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
      className={`block h-full w-full ${fitClassName} transition-transform duration-300${className ? ` ${className}` : ''}`}
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
      className={`block h-full w-full ${fitClassName}`}
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
  const bannerItem = useMemo(() => {
    // Find promotion with position 1, or first promotion if no position set
    const position1Promo = allPromotions.find(p => p.carousel_position === 1);
    if (position1Promo) return position1Promo;
    // Fallback to first promotion if no position 1 is set
    return allPromotions.length > 0 ? allPromotions[0] : null;
  }, [allPromotions]);

  const bannerImageSrc = bannerItem?.banner_image_url || bannerItem?.banner_image;

  const gridItems = useMemo(() => {
    const items: Array<{ type: 'promotion' | 'video'; data: PublicPromotion | PublicProduct; uniqueKey: string; position: number }> = [];
    const usedPromotionIds = new Set<number>();
    
    // Add banner item to used set
    if (bannerItem && typeof bannerItem.id === 'number') {
      usedPromotionIds.add(bannerItem.id);
    }
    
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
  }, [allPromotions, productsWithVideos, bannerItem]);

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div 
          className="lg:col-span-1 bg-gray-100 animate-pulse rounded-2xl" 
          style={{ height: 'min(50vw, calc((100vh - 200px) * 0.9))' }}
        />
        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="bg-gray-100 animate-pulse rounded-2xl"
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

      <div className="relative w-full mb-6">
        {/* Desktop: Large Banner + 2x2 Grid Layout - Matching Figma Design */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Large Banner - First Promotion (Left Side, 50% width, Square) */}
          {bannerItem ? (
            <div className="lg:col-span-1">
              <div
                className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
                style={{
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
                onClick={() => handlePromotionClick(bannerItem)}
              >
                <div className="relative w-full h-full" ref={bannerContainerRef}>
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
              className="lg:col-span-1 aspect-square bg-lime-100/60 rounded-2xl flex items-center justify-center mx-auto"
            style={{
                maxWidth: 'calc(100vh - 250px)'
              }}
            >
            </div>
          )}

          {/* 2x2 Grid - Next 3 Promotions + 1 Product Video (Right Side, 50% width, Square cards) */}
          <div className="lg:col-span-1 grid grid-cols-2 gap-4">
            {gridItems.length > 0 ? (
              gridItems.map((item) => {
                if (item.type === 'promotion') {
                  const promotion = item.data as PublicPromotion;
                  const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
              return (
                    <div
                      key={item.uniqueKey}
                      className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                      onClick={() => handlePromotionClick(promotion)}
                    >
                    <div className="relative w-full h-full" ref={gridItemRef}>
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
                      className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer"
                      style={{
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
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
                      <div className="relative w-full h-full">
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
                  className="w-full aspect-square bg-lime-100/60 rounded-2xl flex items-center justify-center"
                  style={{
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                >
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile/Tablet: Vertical Stack Layout - Matching Figma Design (Banner on top, 2x2 grid below) */}
        <div className="lg:hidden space-y-4 mb-6">
          {/* Large Banner - First Promotion (Full width on mobile) */}
          {bannerItem && (
            <div
              className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer mb-4 mx-auto"
              style={{
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              onClick={() => handlePromotionClick(bannerItem)}
            >
              <div className="relative w-full h-full">
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
          <div className="grid grid-cols-2 gap-4">
            {gridItems.length > 0 ? (
              gridItems.map((item) => {
                if (item.type === 'promotion') {
                  const promotion = item.data as PublicPromotion;
                  const promotionImageSrc = promotion.banner_image_url || promotion.banner_image;
                  return (
                    <div
                      key={item.uniqueKey}
                      className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer mb-4"
                      style={{
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
                      onClick={() => handlePromotionClick(promotion)}
                    >
                      <div className="relative w-full h-full">
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
                      className="group relative w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer mb-4"
                      style={{
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                      }}
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
                      <div className="relative w-full h-full">
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
                  className="w-full aspect-square bg-lime-100/60 rounded-2xl flex items-center justify-center mb-4"
                >
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
