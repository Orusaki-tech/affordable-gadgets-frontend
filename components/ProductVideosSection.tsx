'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useProducts } from '@/lib/hooks/useProducts';
import { ProductVideoReel, type PromotionVideoProduct } from '@/components/ProductVideoReel';
import { resolveProductVideoMedia, getProductVideoLinks } from '@/lib/utils/productVideo';

export function ProductVideosSection() {
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

  const videoProducts = useMemo<PromotionVideoProduct[]>(() => {
    const rows = data?.results ?? [];
    return rows
      .filter((product) => {
        if (typeof product.id !== 'number') return false;
        return (
          getProductVideoLinks(product).length > 0 || resolveProductVideoMedia(product) !== null
        );
      })
      .map((product) => ({
        id: product.id as number,
        slug: product.slug,
        product_name: product.product_name,
        primary_image: product.primary_image,
        product_video_url: product.product_video_url,
        product_video_file_url: product.product_video_file_url,
        videos: (product as { videos?: PromotionVideoProduct['videos'] }).videos ?? null,
      }));
  }, [data?.results]);

  if (isLoading) {
    return (
      <div ref={sectionRef} className="product-videos" aria-busy>
        <h2 className="product-videos__title section-label">Product Videos</h2>
        <div className="mt-5 flex gap-[0.9375rem] overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={`pv-skel-${i}`}
              className="h-[clamp(260px,42vh,440px)] w-[calc(700px/3)] shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-[calc(740px/3)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return <div ref={sectionRef} className="product-videos" aria-hidden />;
  }

  if (videoProducts.length === 0) {
    return (
      <div ref={sectionRef} className="product-videos product-videos__empty">
        <h2 className="product-videos__title section-label">Product Videos</h2>
        <p className="product-videos__empty-text">No product videos available at the moment.</p>
        <Link href="/products" className="product-videos__empty-link">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="product-videos">
      <h2 className="product-videos__title section-label">Product Videos</h2>
      <ProductVideoReel
        products={videoProducts}
        deckKey="videos-page"
        emptyMessage="No product videos available at the moment."
      />
    </div>
  );
}
