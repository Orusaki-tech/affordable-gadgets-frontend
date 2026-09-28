'use client';

import Link from 'next/link';
import { MaterialIcon } from '@/components/MaterialIcon';
import { BlogArticlesCarousel } from '@/components/BlogArticlesCarousel';
import {
  HomeBuyingGuideCard,
  type HomeBuyingGuideCardData,
} from '@/components/home/HomeBuyingGuideCard';
import { StudioBlockChrome } from '@/components/studio/StudioBlockChrome';
import { useStudioEditOptional } from '@/components/studio/StudioEditHost';
import { getArticleCardImageUrl } from '@/lib/blog/articlePage';
import { useFeaturedArticles } from '@/lib/hooks/useFeaturedArticles';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import type { PublicArticleCard } from '@/lib/api/generated';

function formatUpdatedLabel(iso?: string | null) {
  const raw = iso || null;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function estimateReadMinutes(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(10, Math.max(4, Math.round(words / 2) + 4));
}

function guideExcerpt(category: string, productName?: string | null) {
  if (productName) {
    return `Practical tips for ${productName} buyers in Nairobi — what to check, what to skip, and how to buy with confidence.`;
  }
  return `${category} for Kenya shoppers: clear checks, fair pricing cues, and what matters before you pay.`;
}

function toGuideCard(article: PublicArticleCard): HomeBuyingGuideCardData | null {
  const href = getArticleHref(article.product_slug, article.slug);
  if (!href || !article.headline) return null;
  const category = formatArticleCategory(article.category);
  const updated = formatUpdatedLabel(article.updated_at || article.published_at);
  const mins = estimateReadMinutes(article.headline);
  const opening = (article.opening_words || '').trim();
  return {
    key: `${article.product_slug}-${article.slug}`,
    href,
    title: article.headline,
    imageUrl: getArticleCardImageUrl(article),
    category,
    meta: updated ? `Updated ${updated} · ${mins} min read` : `${mins} min read`,
    excerpt: opening || guideExcerpt(category, article.product_name),
    cta: 'Read article',
    articleId: (article as { id?: number }).id ?? null,
    articleSlug: article.slug ?? null,
  };
}

/** Featured-tagged articles in a carousel — same curation model as Featured products. */
export function HomeBuyingGuides() {
  const studioEdit = useStudioEditOptional();
  const canSelect = Boolean(studioEdit?.capabilities.canEditArticles);
  const { data, isLoading, isError } = useFeaturedArticles();
  const guides = (data?.results ?? []).map(toGuideCard).filter(Boolean) as HomeBuyingGuideCardData[];
  const total =
    typeof data?.count === 'number' && data.count >= 0 ? data.count : guides.length;
  const showing = guides.length;

  if (!isLoading && (isError || guides.length === 0) && !canSelect) {
    return null;
  }

  const section = (
    <section className="home-buying-guides ag-section">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-stock-green">Tech Knowledge Hub</p>
            <h2 className="ag-type-h2 mt-1">Tech Buying Guides &amp; Insights</h2>
            {!isLoading && guides.length > 0 ? (
              <p className="ag-type-body mt-1">
                Showing {showing} of {total} featured guides
              </p>
            ) : null}
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

        {isLoading ? (
          <div className="home-buying-guides__carousel home-buying-guides__carousel--loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="home-buying-guides__skeleton" aria-hidden />
            ))}
          </div>
        ) : guides.length > 0 ? (
          <div className="home-buying-guides__carousel">
            <BlogArticlesCarousel
              itemsPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
              autoPlay={guides.length > 3}
            >
              {guides.map((guide) => (
                <div key={guide.key} className="home-buying-guides__slide">
                  <HomeBuyingGuideCard guide={guide} />
                </div>
              ))}
            </BlogArticlesCarousel>
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
