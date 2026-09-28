'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import {
  HomeBuyingGuideCard,
  type HomeBuyingGuideCardData,
} from '@/components/home/HomeBuyingGuideCard';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';

type HomeBuyingGuidesClientProps = {
  guides: HomeBuyingGuideCardData[];
};

/** Client shell so Studio can choose Featured articles the same way as products. */
export function HomeBuyingGuidesClient({ guides }: HomeBuyingGuidesClientProps) {
  const studioEdit = useStudioEditOptional();
  const canSelect = Boolean(studioEdit?.capabilities.canEditArticles);

  if (!guides.length && !canSelect) return null;

  const section = (
    <section className="home-buying-guides ag-section">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-stock-green">Tech Knowledge Hub</p>
            <h2 className="ag-type-h2 mt-1">Tech Buying Guides &amp; Insights</h2>
            {canSelect ? (
              <p className="mt-1 text-xs font-semibold text-primary">
                Controlled by the Featured tag on articles ·{' '}
                {studioEdit?.capabilities.editableSummary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {canSelect ? (
              <button
                type="button"
                className="studio-icon-btn studio-icon-btn--edit"
                onClick={() => studioEdit?.openEditFeaturedArticles()}
              >
                <span>Choose articles</span>
              </button>
            ) : null}
            <Link
              href="/articles"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              Read All Articles
              <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
            </Link>
          </div>
        </div>

        {guides.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {guides.map((guide) => (
              <HomeBuyingGuideCard key={guide.key} guide={guide} />
            ))}
          </div>
        ) : (
          <p className="ag-type-body text-secondary">
            No featured articles yet. Click Choose articles to pick what appears here.
          </p>
        )}
      </div>
    </section>
  );

  if (!canSelect) return section;

  return (
    <StudioBlockChrome
      label="Tech Buying Guides"
      roleHint={studioEdit?.capabilities.roleLabel}
      onEdit={() => studioEdit?.openEditFeaturedArticles()}
    >
      {section}
    </StudioBlockChrome>
  );
}
