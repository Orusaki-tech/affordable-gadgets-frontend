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
  const progressPercent =
    totalSlides > 1 ? ((currentIndex + 1) / totalSlides) * 100 : 100;

  return (
    <div className={`relative ${className}`}>
      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scroll-smooth scrollbar-hide pb-6 snap-x snap-mandatory -mx-3"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children.map((child, index) => {
          // Calculate width based on items per slide
          const itemWidth = `calc(100% / ${itemsPerSlide})`;
          
          return (
            <div
              key={index}
              className="flex-shrink-0 snap-start px-3 samsung-carousel-item"
              style={{
                width: itemWidth,
                minWidth: itemWidth,
                animationDelay: `${Math.min(index + 1, 4) * 0.15}s`,
              }}
            >
              {child}
            </div>
          );
        })}
      </div>

      {/* Progress Bar + Arrows */}
      {totalSlides > 1 && (
        <div className="samsung-progressbar">
          <div className="samsung-progressbar-inner">
            <div className="samsung-progressbar-bar">
              <span
                className="samsung-progressbar-fill"
                style={{
                  transform: `scaleX(${progressPercent / 100})`,
                  transitionDuration: '300ms',
                }}
              />
            </div>
            {showNavigation && children.length > itemsPerSlide && (
              <div className="samsung-progressbar-arrows">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="samsung-progressbar-arrow"
                  aria-label="Previous Slide"
                  aria-disabled={!canScrollLeft}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="samsung-progressbar-icon" focusable="false" aria-hidden="true" viewBox="0 0 40 40">
                    <g transform="translate(40 40) rotate(180)">
                      <path d="M21.47,16.53A.75.75,0,0,1,22.53,15.47l4,4a.75.75,0,0,1,0,1.061l-4,4A.75.75,0,0,1,21.47,23.47l2.72-2.72H14.5a.75.75,0,0,1,0-1.5h9.689Z"></path>
                    </g>
                  </svg>
                </button>
                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="samsung-progressbar-arrow"
                  aria-label="Next Slide"
                  aria-disabled={!canScrollRight}
                >
                  <span className="sr-only">Next</span>
                  <svg className="samsung-progressbar-icon" focusable="false" aria-hidden="true" viewBox="0 0 40 40">
                    <path d="M21.47,16.53A.75.75,0,0,1,22.53,15.47l4,4a.75.75,0,0,1,0,1.061l-4,4A.75.75,0,0,1,21.47,23.47l2.72-2.72H14.5a.75.75,0,0,1,0-1.5h9.689Z"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>
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
