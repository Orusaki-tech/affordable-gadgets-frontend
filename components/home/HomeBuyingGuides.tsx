import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { fetchFeaturedArticles, getArticleCardImageUrl } from '@/lib/blog/articlePage';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { getArticleHref } from '@/lib/utils/blogRoutes';

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

export async function HomeBuyingGuides() {
  const articles = await fetchFeaturedArticles();
  if (!articles.length) return null;

  const guides = articles
    .map((article) => {
      const href = getArticleHref(article.product_slug, article.slug);
      if (!href || !article.headline) return null;
      const category = formatArticleCategory(article.category);
      const updated = formatUpdatedLabel(article.updated_at || article.published_at);
      const mins = estimateReadMinutes(article.headline);
      return {
        key: `${article.product_slug}-${article.slug}`,
        href,
        title: article.headline,
        imageUrl: getArticleCardImageUrl(article),
        category,
        meta: updated ? `Updated ${updated} · ${mins} min read` : `${mins} min read`,
        excerpt: guideExcerpt(category, article.product_name),
        cta: (article.opening_words || '').trim() || 'Read Guide',
      };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{
    key: string;
    href: string;
    title: string;
    imageUrl: string | null;
    category: string;
    meta: string;
    excerpt: string;
    cta: string;
  }>;

  if (!guides.length) return null;

  return (
    <section className="home-buying-guides ag-section">
      <div className="home-section-panel">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ag-type-eyebrow text-stock-green">
              Tech Knowledge Hub
            </p>
            <h2 className="ag-type-h2 mt-1">
              Tech Buying Guides &amp; Insights
            </h2>
          </div>
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            Read All Articles
            <MaterialIcon name="chevron_right" className="text-[1.125rem]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {guides.map((guide) => (
            <Link
              key={guide.key}
              href={guide.href}
              className="home-buying-guides__card group flex flex-col overflow-hidden rounded-2xl border border-border-hairline bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="home-buying-guides__media">
                {guide.imageUrl ? (
                  <CloudinaryImage
                    src={guide.imageUrl}
                    alt={guide.title}
                    preset="blogCard"
                    fill
                    fit="cover"
                    className="home-buying-guides__image"
                    sizes="(max-width:768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="home-buying-guides__media-fallback">
                    <MaterialIcon name="article" className="text-[2.5rem] text-white/50" />
                  </div>
                )}
                <span className="home-buying-guides__badge">{guide.category}</span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-xs font-medium text-secondary">{guide.meta}</p>
                <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-primary sm:text-lg">
                  {guide.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-secondary">
                  {guide.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-bold text-primary">
                  <span className="line-clamp-1">{guide.cta}</span>
                  <MaterialIcon name="arrow_forward" className="text-[1rem] shrink-0" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
