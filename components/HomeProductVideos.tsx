'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';
import type { PublicProductList } from '@/lib/api/generated';
import { ProductCarousel } from '@/components/ProductCarousel';
import { getProductHref } from '@/lib/utils/productRoutes';
import {
  resolveProductVideoMedia,
  youtubePosterUrlFromLink,
  type ResolvedProductVideo,
} from '@/lib/utils/productVideo';

const HOMEPAGE_VIDEOS_PAGE_SIZE = 24;

async function fetchHomepageVideoProducts(): Promise<PublicProductList[]> {
  const res = await ApiService.apiV1PublicProductsList(
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    HOMEPAGE_VIDEOS_PAGE_SIZE,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    true
  );
  const rows = (res.results ?? []) as PublicProductList[];
  return rows.filter((p) => resolveProductVideoMedia(p) !== null);
}

function buildEmbedAutoplaySrc(resolved: ResolvedProductVideo): string {
  const u = resolved.src;
  try {
    const href = u.startsWith('//') ? `https:${u}` : u;
    const parsed = new URL(href);
    if (parsed.hostname.includes('youtube.com')) {
      parsed.searchParams.set('autoplay', '1');
      parsed.searchParams.set('playsinline', '1');
      parsed.searchParams.set('mute', '1');
      return parsed.toString();
    }
    if (parsed.hostname.includes('vimeo.com')) {
      parsed.searchParams.set('autoplay', '1');
      return parsed.toString();
    }
  } catch {
    /* use fallback below */
  }
  if (u.includes('autoplay=1')) return u;
  return `${u}${u.includes('?') ? '&' : '?'}autoplay=1`;
}

function HomepageVideoSlide({
  product,
  playingKey,
  setPlayingKey,
  registerVideo,
  deckKey,
}: {
  product: PublicProductList;
  playingKey: string | null;
  setPlayingKey: Dispatch<SetStateAction<string | null>>;
  registerVideo: (key: string, el: HTMLVideoElement | null) => void;
  deckKey: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const resolved = resolveProductVideoMedia(product);
  const name = product.product_name ?? 'Product';
  const href = getProductHref(product);
  const slideKey = `${deckKey}-${product.id}`;
  const isPlaying = playingKey === slideKey;
  const embedPosterUrl =
    product.primary_image ||
    (product.product_video_url ? youtubePosterUrlFromLink(product.product_video_url) : null);

  const setRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (resolved?.mode === 'file') registerVideo(slideKey, el);
      else registerVideo(slideKey, null);
    },
    [registerVideo, resolved?.mode, slideKey]
  );

  if (!resolved) return null;

  const toggle = () => {
    if (resolved.mode === 'embed') {
      setPlayingKey((prev) => (prev === slideKey ? null : slideKey));
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      setPlayingKey(slideKey);
      void el.play();
    } else {
      el.pause();
      setPlayingKey(null);
    }
  };

  const showPlay = resolved.mode === 'embed' ? !isPlaying : !isPlaying;

  return (
    <div className="h-full w-full">
      <div className="home-product-videos__slide-inner">
        <button
          type="button"
          className="relative w-full cursor-pointer border-0 bg-transparent p-0 text-left"
          onClick={() => toggle()}
          aria-label={`Play video: ${name}`}
        >
          <div className="home-product-videos__media-wrap">
            <span
              className={`home-product-videos__play ${showPlay ? '' : 'home-product-videos__play--hidden'}`}
              aria-hidden
            >
              <svg className="ml-1 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            {resolved.mode === 'file' && (
              <video
                ref={setRef}
                src={resolved.src}
                poster={product.primary_image ?? undefined}
                preload="none"
                playsInline
                disablePictureInPicture
                controls={isPlaying}
                onClick={(ev) => {
                  if (isPlaying) ev.stopPropagation();
                }}
                onPlay={() => setPlayingKey(slideKey)}
                onPause={() => setPlayingKey((prev) => (prev === slideKey ? null : prev))}
                onEnded={() => setPlayingKey(null)}
              />
            )}

            {resolved.mode === 'embed' && (
              <>
                {!isPlaying && embedPosterUrl ? (
                  <Image
                    src={embedPosterUrl}
                    alt=""
                    fill
                    className="home-product-videos__poster"
                    sizes="200px"
                    unoptimized={
                      embedPosterUrl.includes('ytimg.com') ||
                      embedPosterUrl.includes('localhost') ||
                      embedPosterUrl.includes('placehold.co')
                    }
                  />
                ) : null}
                {!isPlaying && !embedPosterUrl ? (
                  <div className="absolute inset-0 bg-neutral-900" aria-hidden />
                ) : null}
                {isPlaying ? (
                  <iframe
                    title={name}
                    src={buildEmbedAutoplaySrc(resolved)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : null}
              </>
            )}
          </div>
        </button>
        <Link href={href} className="home-product-videos__title">
          {name}
        </Link>
      </div>
    </div>
  );
}

export function HomeProductVideos() {
  const deckKey = 'home-product-videos';
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'homepage_videos'],
    queryFn: fetchHomepageVideoProducts,
    staleTime: 60_000,
  });

  const videoEls = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const registerVideo = useCallback((key: string, el: HTMLVideoElement | null) => {
    if (el) videoEls.current.set(key, el);
    else videoEls.current.delete(key);
  }, []);

  useEffect(() => {
    if (!playingKey) return;
    videoEls.current.forEach((el, key) => {
      if (key !== playingKey && !el.paused) el.pause();
    });
  }, [playingKey]);

  if (isLoading) {
    return (
      <section className="bg-[#F9F9F9] py-8 scroll-mt-20" aria-labelledby="home-product-videos-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-7 w-56 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-4 max-w-xl animate-pulse rounded bg-gray-100" />
          <div className="mt-6 flex gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={`hpv-skel-${i}`}
                className="aspect-[9/16] max-h-[min(52vh,520px)] min-w-[140px] flex-1 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-[#F9F9F9] py-8 scroll-mt-20"
      aria-labelledby="home-product-videos-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="home-product-videos-heading" className="text-lg font-bold text-gray-900 md:text-xl">
          Product videos
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600 md:text-base">
          Find out more about your favourite devices and accessories here
        </p>

        <div className="mt-6">
          <ProductCarousel
            itemsPerView={{ mobile: 2, tablet: 3, desktop: 4 }}
            showNavigation
            showPagination={false}
            autoPlay={false}
            className="home-product-videos__carousel"
          >
            {products.map((product) => (
              <HomepageVideoSlide
                key={product.id}
                product={product}
                playingKey={playingKey}
                setPlayingKey={setPlayingKey}
                registerVideo={registerVideo}
                deckKey={deckKey}
              />
            ))}
          </ProductCarousel>
        </div>
      </div>
    </section>
  );
}
