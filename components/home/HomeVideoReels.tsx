'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { HomeProductVideos } from '@/components/HomeProductVideos';

/** Vertical-reel style wrapper around existing product video feed. */
export function HomeVideoReels() {
  return (
    <section className="ag-section">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-secondary">
              Verified Tech Unboxings
            </p>
            <h2 className="ag-type-h2 mt-1">
              Real Devices in Nairobi
            </h2>
          </div>
          <a
            href="https://www.tiktok.com/@affordablegadgetske"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Follow @AffordableGadgetsKE
            <MaterialIcon name="arrow_outward" className="text-[16px]" />
          </a>
        </div>
        <HomeProductVideos variant="grid" hideHeader />
        <div className="mt-4">
          <Link
            href="/videos"
            className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            See all product videos
          </Link>
        </div>
      </div>
    </section>
  );
}
