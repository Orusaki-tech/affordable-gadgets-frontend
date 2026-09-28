'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { HomeProductVideos } from '@/components/HomeProductVideos';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';

/** Vertical-reel style wrapper around existing product video feed. */
export function HomeVideoReels() {
  const studioEdit = useStudioEditOptional();
  const canSelect = Boolean(studioEdit?.capabilities.canEditVideoSelection);

  const section = (
    <section className="ag-section">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-secondary">Verified Tech Unboxings</p>
            <h2 className="ag-type-h2 mt-1">Videos about your favourite device</h2>
            {canSelect ? (
              <p className="mt-1 text-xs font-semibold text-primary">
                Controlled by the Video tag · {studioEdit?.capabilities.editableSummary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canSelect ? (
              <button
                type="button"
                className="studio-icon-btn studio-icon-btn--edit"
                onClick={() => studioEdit?.openEditVideoProducts()}
              >
                <span>Choose products</span>
              </button>
            ) : null}
            <a
              href="https://www.tiktok.com/@affordablegadgetske"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Follow @AffordableGadgetsKE
              <MaterialIcon name="arrow_outward" className="text-[1rem]" />
            </a>
          </div>
        </div>
        <HomeProductVideos variant="grid" hideHeader />
        {canSelect ? (
          <p className="mt-3 text-sm text-secondary">
            Tip: products need the Video tag and at least one product video to appear here.
          </p>
        ) : null}
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

  if (!canSelect) return section;

  return (
    <StudioBlockChrome
      label="Verified Tech Unboxings"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditVideoProducts()}
    >
      {section}
    </StudioBlockChrome>
  );
}
