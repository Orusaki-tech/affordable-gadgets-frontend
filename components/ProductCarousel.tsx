'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';

interface ProductCarouselProps {
  children: ReactNode[];
  itemsPerView?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  showNavigation?: boolean;
  showPagination?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

export function ProductCarousel({
  children,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 4 },
  showNavigation = true,
  showPagination = false,
  autoPlay = false,
  autoPlayInterval = 5000,
  className = '',
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [itemsPerSlide, setItemsPerSlide] = useState(itemsPerView.desktop || 4);

  // Calculate items per slide based on viewport
  useEffect(() => {
    const updateItemsPerSlide = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setItemsPerSlide(itemsPerView.mobile || 1);
      } else if (width < 1024) {
        setItemsPerSlide(itemsPerView.tablet || 2);
      } else {
        setItemsPerSlide(itemsPerView.desktop || 4);
      }
    };

    updateItemsPerSlide();
    window.addEventListener('resize', updateItemsPerSlide);
    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, [itemsPerView]);

  // Update scroll buttons state
  const updateScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    return () => container.removeEventListener('scroll', updateScrollButtons);
  }, [children, itemsPerSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || children.length <= itemsPerSlide) return;

    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollAmount = container.clientWidth;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 10) {
          // Reset to start
          container.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentIndex(0);
        } else {
          // Scroll to next
          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
          setCurrentIndex((prev) => Math.min(prev + 1, Math.ceil(children.length / itemsPerSlide) - 1));
        }
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, children.length, itemsPerSlide]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
  };

  const scrollToIndex = (index: number) => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = (container.scrollWidth / children.length) * index * itemsPerSlide;
    container.scrollTo({ left: scrollAmount, behavior: 'smooth' });
    setCurrentIndex(index);
  };

  // Handle scroll to update current index
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollPosition = container.scrollLeft;
    const itemWidth = container.scrollWidth / children.length;
    const newIndex = Math.round(scrollPosition / (itemWidth * itemsPerSlide));
    setCurrentIndex(Math.min(newIndex, Math.ceil(children.length / itemsPerSlide) - 1));
    updateScrollButtons();
  };

  if (!children || children.length === 0) {
    return null;
  }

  const totalSlides = Math.ceil(children.length / itemsPerSlide);

  return (
    <div className={`relative ${className}`}>
      {/* Navigation Buttons */}
      {showNavigation && children.length > itemsPerSlide && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            aria-label="Previous"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 active:scale-95"
            aria-label="Next"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-6 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children.map((child, index) => {
          // Calculate width based on items per slide
          // Gap is 24px (1.5rem = 24px), so we need to account for gaps between items
          const gapPx = 24;
          const gaps = itemsPerSlide > 1 ? (itemsPerSlide - 1) * gapPx : 0;
          const itemWidth = `calc((100% - ${gaps}px) / ${itemsPerSlide})`;
          
          return (
            <div
              key={index}
              className="flex-shrink-0 snap-start"
              style={{
                width: itemWidth,
                minWidth: itemWidth,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      {showPagination && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-blue-600'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
