'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type SetStateAction,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ApiService } from '@/lib/api/generated';
import type { PublicProductList } from '@/lib/api/generated';
import { brandConfig } from '@/lib/config/brand';
import { getProductHref } from '@/lib/utils/productRoutes';
import {
  resolveProductVideoMedia,
  youtubePosterCandidatesFromLink,
  type ResolvedProductVideo,
} from '@/lib/utils/productVideo';

import 'swiper/css';
import 'swiper/css/navigation';

const HOMEPAGE_VIDEOS_PAGE_SIZE = 24;
const IMAGE_SIZES = '(max-width:640px) 233px, 247px';

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

function isYoutubeEmbedSrc(src: string): boolean {
  try {
    const href = src.startsWith('//') ? `https:${src}` : src;
    return new URL(href).hostname.includes('youtube.com');
  } catch {
    return src.includes('youtube.com');
  }
}

function buildEmbedAutoplaySrc(resolved: ResolvedProductVideo): string {
  const u = resolved.src;
  let siteOrigin = '';
  try {
    siteOrigin = new URL(brandConfig.siteUrl).origin;
  } catch {
    siteOrigin = '';
  }
  try {
    const href = u.startsWith('//') ? `https:${u}` : u;
    const parsed = new URL(href);
    if (parsed.hostname.includes('youtube.com')) {
      parsed.searchParams.set('autoplay', '1');
      parsed.searchParams.set('playsinline', '1');
      parsed.searchParams.set('mute', '1');
      parsed.searchParams.set('modestbranding', '1');
      parsed.searchParams.set('rel', '0');
      parsed.searchParams.set('enablejsapi', '1');
      if (siteOrigin) parsed.searchParams.set('origin', siteOrigin);
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

function sendYoutubeIframeCommand(iframe: HTMLIFrameElement | null, func: string) {
  if (!iframe?.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com'
    );
  } catch {
    /* noop */
  }
}

function PosterImageFallback({
  urls,
  className,
}: {
  urls: string[];
  className: string;
}) {
  const [idx, setIdx] = useState(0);
  if (urls.length === 0) return null;
  const safeIdx = Math.min(idx, urls.length - 1);
  const src = urls[safeIdx];
  const unoptimized =
    src.includes('ytimg.com') ||
    src.includes('localhost') ||
    src.includes('placehold.co') ||
    src.includes('cloudinary') ||
    src.includes('railway.app');
  return (
    <Image
      src={src}
      alt=""
      fill
      className={className}
      sizes={IMAGE_SIZES}
      unoptimized={unoptimized}
      onError={() => {
        if (safeIdx < urls.length - 1) setIdx((i) => i + 1);
      }}
    />
  );
}

function ChevronNavIcon({ flip }: { flip?: boolean }) {
  return (
    <svg className="home-product-videos__chevron-svg" viewBox="0 0 100 100" aria-hidden>
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
  const youtubeIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const resolved = resolveProductVideoMedia(product);
  const name = product.product_name ?? 'Product';
  const href = getProductHref(product);
  const slideKey = `${deckKey}-${product.id}`;
  const isPlaying = playingKey === slideKey;
  const ytCandidates = product.product_video_url ? youtubePosterCandidatesFromLink(product.product_video_url) : [];
  const posterUrls = [
    ...ytCandidates,
    ...(product.primary_image ? [product.primary_image] : []),
  ];
  const embedPosterUrls = posterUrls.length > 0 ? posterUrls : [];
  const isYoutubePlaying = Boolean(
    resolved?.mode === 'embed' && isPlaying && resolved.src && isYoutubeEmbedSrc(resolved.src)
  );

  useEffect(() => {
    if (!isPlaying) {
      setIsMuted(true);
      const el = videoRef.current;
      if (el) el.muted = true;
      if (isYoutubeEmbedSrc(resolved?.src ?? '')) {
        sendYoutubeIframeCommand(youtubeIframeRef.current, 'mute');
      }
    }
  }, [isPlaying]);

  const setRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      if (el) el.muted = true;
      if (resolved?.mode === 'file') registerVideo(slideKey, el);
      else registerVideo(slideKey, null);
    },
    [registerVideo, resolved?.mode, slideKey]
  );

  if (!resolved) return null;
  // Prevent TS control-flow narrowing from treating `resolved` as embed-only
  // inside unrelated JSX branches.
  const resolvedVideo: ResolvedProductVideo = resolved;

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

  const onSoundToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (resolved.mode === 'file') {
      const el = videoRef.current;
      if (!el) return;
      const nextMuted = !el.muted;
      el.muted = nextMuted;
      setIsMuted(nextMuted);
      return;
    }

    if (!isYoutubeEmbedSrc(resolved.src)) return;
    if (isMuted) sendYoutubeIframeCommand(youtubeIframeRef.current, 'unMute');
    else sendYoutubeIframeCommand(youtubeIframeRef.current, 'mute');
    setIsMuted((m) => !m);
  };

  const mediaActivate = () => {
    if (resolved.mode === 'embed' && isPlaying) return;
    toggle();
  };

  const playClassMods = !isPlaying
    ? 'home-product-videos__play--hide-on-hover'
    : 'home-product-videos__play--hidden';

  const onMediaKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      mediaActivate();
    }
  };

  return (
    <div className="home-product-videos__slide-stack">
      <div className="home-product-videos__slide-inner">
        <div
          role="button"
          tabIndex={0}
          className="home-product-videos__media-hit"
          onClick={mediaActivate}
          onKeyDown={onMediaKeyDown}
          aria-label={isPlaying ? `Video playing: ${name}` : `Play video: ${name}`}
        >
          <div className="home-product-videos__media-wrap">
            <span className={`home-product-videos__play ${playClassMods}`} aria-hidden>
              <svg className="home-product-videos__play-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>

            {resolved.mode === 'file' && (
              <video
                ref={setRef}
                className="home-product-videos__video-el"
                src={resolved.src}
                poster={product.primary_image ?? undefined}
                preload="none"
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                muted={isMuted}
                controls={isPlaying}
                onClick={(ev) => {
                  if (isPlaying) ev.stopPropagation();
                }}
                onPlay={() => setPlayingKey(slideKey)}
                onPause={() => setPlayingKey((prev) => (prev === slideKey ? null : prev))}
                onEnded={() => setPlayingKey(null)}
                onVolumeChange={(ev) => {
                  const el = ev.currentTarget;
                  setIsMuted(el.muted);
                }}
              />
            )}

            {resolved.mode === 'embed' && (
              <>
                {!isPlaying && embedPosterUrls.length > 0 ? (
                  <PosterImageFallback urls={embedPosterUrls} className="home-product-videos__poster" />
                ) : null}
                {!isPlaying && embedPosterUrls.length === 0 ? (
                  <div className="home-product-videos__embed-backdrop" aria-hidden />
                ) : null}
                {isPlaying ? (
                  <>
                    <iframe
                      ref={youtubeIframeRef}
                      title={name}
                      className="home-product-videos__embed-frame"
                      src={buildEmbedAutoplaySrc(resolved)}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      onLoad={() => {
                        // keep autoplay compliant; start muted until user explicitly unmutes
                        sendYoutubeIframeCommand(youtubeIframeRef.current, 'mute');
                        setIsMuted(true);
                      }}
                    />
                  </>
                ) : null}
              </>
            )}

            {isPlaying &&
            (resolvedVideo.mode === 'file' ||
              (resolvedVideo.mode === 'embed' && isYoutubeEmbedSrc(resolvedVideo.src))) ? (
              <button
                type="button"
                className="home-product-videos__sound-btn"
                onClick={onSoundToggle}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                }}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? (
                  <svg className="home-product-videos__icon-20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3 10v4h4l5 5V5L7 10H3zm13.59 2L19 14.41 20.41 13 18 10.59 20.41 8.17 19 6.76 16.59 9.17 14.17 6.76 12.76 8.17 15.17 10.59 12.76 13 14.17 14.41 16.59 12z" />
                  </svg>
                ) : (
                  <svg className="home-product-videos__icon-20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <Link href={href} className="home-product-videos__caption-link">
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
      <section className="home-product-videos__skel-section" aria-labelledby="home-product-videos-heading">
        <div className="page-container">
          <div className="home-product-videos__skel-title" />
          <div className="home-product-videos__skel-line" />
          <div className="home-product-videos__skel-row">
            {[...Array(5)].map((_, i) => (
              <div key={`hpv-skel-${i}`} className="home-product-videos__skel-card" />
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
    <section className="home-product-videos__section" aria-labelledby="home-product-videos-heading">
      <div className="page-container">
        <h2 id="home-product-videos-heading" className="home-product-videos__heading">
          Product videos
        </h2>
        <p className="home-product-videos__subheading">
          Find out more about your favourite devices and accessories here
        </p>

        <div className="home-product-videos__swiper-wrap u-relative">
          <button
            type="button"
            id={`hpv-nav-prev-${navUid}`}
            className="home-product-videos__nav home-product-videos__nav--prev"
            aria-label="Previous videos"
          >
            <span className="u-show-lg">
              <ChevronNavIcon />
            </span>
          </button>
          <button
            type="button"
            id={`hpv-nav-next-${navUid}`}
            className="home-product-videos__nav home-product-videos__nav--next"
            aria-label="Next videos"
          >
            <span className="u-show-lg">
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
            className="home-product-videos__swiper home-product-videos__swiper--overflow-visible"
            navigation={{
              prevEl: prevNavSelector,
              nextEl: nextNavSelector,
            }}
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="home-product-videos__swiper-slide--auto">
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
