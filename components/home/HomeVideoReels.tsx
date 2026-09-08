'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { HomeProductVideos } from '@/components/HomeProductVideos';

/** Vertical-reel style wrapper around existing product video feed. */
export function HomeVideoReels() {
  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 lg:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Verified Tech Unboxings
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
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
        <Link href="/videos" className="text-sm font-semibold text-primary underline-offset-2 hover:underline">
          See all product videos
        </Link>
      </div>
    </section>
  );
}
