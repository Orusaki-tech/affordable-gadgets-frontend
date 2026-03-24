'use client';

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { HOME_PRODUCT_VIDEOS, type HomeProductVideo } from '@/lib/config/homeProductVideos';

const SLIDE_STEP_PX = 200;

function VideoSlide({
  item,
  playingId,
  setPlayingId,
  registerVideo,
}: {
  item: HomeProductVideo;
  playingId: string | null;
  setPlayingId: Dispatch<SetStateAction<string | null>>;
  registerVideo: (id: string, el: HTMLVideoElement | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isPlaying = playingId === item.id;

  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      registerVideo(item.id, el);
    },
    [item.id, registerVideo]
  );

  const toggle = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      setPlayingId(item.id);
      void el.play();
    } else {
      el.pause();
      setPlayingId(null);
    }
  }, [item.id, setPlayingId]);

  return (
    <div
      className="w-[175px] shrink-0 snap-start scroll-ml-1 first:scroll-ml-0 sm:w-[185px]"
      data-home-product-video-slide
    >
      <button
        type="button"
        className="group relative flex w-full cursor-pointer flex-col outline-none"
        aria-label={`Play video: ${item.title}`}
        onClick={toggle}
      >
        <span
          className={`pointer-events-none absolute top-1/2 left-1/2 z-[1] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-opacity duration-200 sm:h-14 sm:w-14 ${
            isPlaying ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-hidden
        >
          <svg className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <div className="relative aspect-[9/16] w-full max-h-[50vh] overflow-hidden rounded-xl bg-black">
          <video
            ref={setVideoRef}
            className="h-full w-full object-cover"
            poster={item.poster ?? undefined}
            preload="none"
            playsInline
            disablePictureInPicture
            controls={isPlaying}
            onClick={(e) => {
              if (isPlaying) e.stopPropagation();
            }}
            onPlay={() => setPlayingId(item.id)}
            onPause={() => setPlayingId((prev) => (prev === item.id ? null : prev))}
            onEnded={() => setPlayingId(null)}
          >
            <source src={item.src} type="video/mp4" />
          </video>
        </div>
      </button>
    </div>
  );
}

export function HomeProductVideos() {
  const videos = HOME_PRODUCT_VIDEOS;
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const videoEls = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const registerVideo = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) videoEls.current.set(id, el);
    else videoEls.current.delete(id);
  }, []);

  const syncScrollHints = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(max > 8 && el.scrollLeft < max - 8);
  }, []);

  useEffect(() => {
    syncScrollHints();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', syncScrollHints, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncScrollHints) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', syncScrollHints);
      ro?.disconnect();
    };
  }, [syncScrollHints, videos.length]);

  const pauseOthers = useCallback(
    (exceptId: string | null) => {
      videoEls.current.forEach((videoEl, id) => {
        if (id !== exceptId && !videoEl.paused) {
          videoEl.pause();
        }
      });
    },
    []
  );

  useEffect(() => {
    pauseOthers(playingId);
  }, [playingId, pauseOthers]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * SLIDE_STEP_PX, behavior: 'smooth' });
  }, []);

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#F9F9F9] py-8 scroll-mt-20" aria-labelledby="home-product-videos-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="home-product-videos-heading" className="text-lg font-bold text-gray-900 md:text-xl">
          See it in action
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-600 md:text-base">
          Short clips from our community — soon you&apos;ll see product-specific videos here, the same way we&apos;ll
          surface them on each product page.
        </p>

        <div className="relative mt-5">
          <div
            ref={scrollerRef}
            className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {videos.map((item) => (
              <VideoSlide
                key={item.id}
                item={item}
                playingId={playingId}
                setPlayingId={setPlayingId}
                registerVideo={registerVideo}
              />
            ))}
          </div>

          <button
            type="button"
            className={`absolute top-1/2 left-0 z-10 hidden h-11 w-11 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-white text-gray-900 shadow-sm transition hover:scale-105 hover:bg-gray-800 hover:text-white lg:flex ${
              canLeft ? '' : 'pointer-events-none opacity-30'
            }`}
            onClick={() => scrollByDir(-1)}
            aria-label="Scroll videos left"
          >
            <svg className="h-3 w-3" viewBox="0 0 100 100" fill="currentColor" aria-hidden>
              <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" />
            </svg>
          </button>
          <button
            type="button"
            className={`absolute top-1/2 right-0 z-10 hidden h-11 w-11 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-white text-gray-900 shadow-sm transition hover:scale-105 hover:bg-gray-800 hover:text-white lg:flex ${
              canRight ? '' : 'pointer-events-none opacity-30'
            }`}
            onClick={() => scrollByDir(1)}
            aria-label="Scroll videos right"
          >
            <svg className="h-3 w-3" viewBox="0 0 100 100" fill="currentColor" aria-hidden>
              <path d="M 10,50 L 60,100 L 70,90 L 30,50 L 70,10 L 60,0 Z" transform="translate(100, 100) rotate(180)" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
