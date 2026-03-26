'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ApiService } from '@/lib/api/generated';
import type { PublicProductList } from '@/lib/api/generated';
import { getProductHref } from '@/lib/utils/productRoutes';
import {
  resolveProductVideoMedia,
  youtubePosterUrlFromLink,
  type ResolvedProductVideo,
} from '@/lib/utils/productVideo';

import 'swiper/css';
import 'swiper/css/navigation';

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
      parsed.searchParams.set('modestbranding', '1');
      parsed.searchParams.set('rel', '0');
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

function ChevronNavIcon({ flip }: { flip?: boolean }) {
  return (
    <svg className="block h-3 w-3 fill-current" viewBox="0 0 100 100" aria-hidden>
      <path
        fill="currentColor"
        d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z"
        transform={flip ? 'translate(100, 100) rotate(180)' : 'translate(0, 0) rotate(0)'}
      />
    </svg>
  );
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

  const showPlay = !isPlaying;
  const playClassMods = showPlay ? 'group-hover:hidden' : 'home-product-videos__play--hidden';

  return (
    <div className="home-product-videos__slide-stack w-[calc(700px/3)] shrink-0 sm:w-[calc(740px/3)]">
      <div className="home-product-videos__slide-inner">
        <button
          type="button"
          className="group relative h-full w-full grow-0 cursor-pointer border-0 bg-transparent p-0 outline-none"
          onClick={() => toggle()}
          aria-label={`Play video: ${name}`}
        >
          <div className="home-product-videos__media-wrap">
            <span
              className={`home-product-videos__play ${playClassMods}`}
              aria-hidden
            >
              <svg className="ml-1 h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            {resolved.mode === 'file' && (
              <video
                ref={setRef}
                className="h-full max-h-[min(calc(200vh/3),calc(2080px/3))] w-full rounded-xl object-cover"
                src={resolved.src}
                poster={product.primary_image ?? undefined}
                preload="none"
                playsInline
                disablePictureInPicture
                disableRemotePlayback
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
                    className="home-product-videos__poster rounded-xl"
                    sizes="(max-width:640px) 233px, 247px"
                    unoptimized={
                      embedPosterUrl.includes('ytimg.com') ||
                      embedPosterUrl.includes('localhost') ||
                      embedPosterUrl.includes('placehold.co')
                    }
                  />
                ) : null}
                {!isPlaying && !embedPosterUrl ? (
                  <div className="absolute inset-0 rounded-xl bg-neutral-900" aria-hidden />
                ) : null}
                {isPlaying ? (
                  <iframe
                    title={name}
                    className="home-product-videos__embed-frame"
                    src={buildEmbedAutoplaySrc(resolved)}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : null}
              </>
            )}
          </div>
        </button>
      </div>
      <Link
        href={href}
        className="home-product-videos__caption mt-2 block text-[11px] font-bold leading-snug text-gray-900 sm:text-xs"
      >
        {name}
      </Link>
    </div>
  );
}

export function HomeProductVideos() {
  const deckKey = 'home-product-videos';
  const navUid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const prevNavSelector = `#hpv-nav-prev-${navUid}`;
  const nextNavSelector = `#hpv-nav-next-${navUid}`;
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
          <div className="mt-5 flex gap-[15px] overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={`hpv-skel-${i}`}
                className="h-[min(calc(200vh/3),calc(2080px/3))] w-[calc(700px/3)] shrink-0 animate-pulse rounded-xl bg-gray-200 sm:w-[calc(740px/3)]"
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

        <div className="relative mt-5 gap-3">
          <button
            type="button"
            id={`hpv-nav-prev-${navUid}`}
            className="home-product-videos__nav home-product-videos__nav--prev"
            aria-label="Previous videos"
          >
            <span className="hidden lg:block">
              <ChevronNavIcon />
            </span>
          </button>
          <button
            type="button"
            id={`hpv-nav-next-${navUid}`}
            className="home-product-videos__nav home-product-videos__nav--next"
            aria-label="Next videos"
          >
            <span className="hidden lg:block">
              <ChevronNavIcon flip />
            </span>
          </button>

          <Swiper
            modules={[Navigation]}
            spaceBetween={15}
            slidesPerView="auto"
            slidesOffsetBefore={0}
            slidesOffsetAfter={0}
            watchOverflow
            className="home-product-videos__swiper !overflow-visible"
            navigation={{
              prevEl: prevNavSelector,
              nextEl: nextNavSelector,
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="!w-auto">
                <HomepageVideoSlide
                  product={product}
                  playingKey={playingKey}
                  setPlayingKey={setPlayingKey}
                  registerVideo={registerVideo}
                  deckKey={deckKey}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
