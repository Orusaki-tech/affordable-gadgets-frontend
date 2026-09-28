import { fetchFeaturedArticles, getArticleCardImageUrl } from '@/lib/blog/articlePage';
import { formatArticleCategory } from '@/lib/utils/blogCategories';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import { HomeBuyingGuidesClient } from '@/components/home/HomeBuyingGuidesClient';
import type { HomeBuyingGuideCardData } from '@/components/home/HomeBuyingGuideCard';

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

  const guides = articles
    .map((article) => {
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
      } satisfies HomeBuyingGuideCardData;
    })
    .filter(Boolean)
    .slice(0, 3) as HomeBuyingGuideCardData[];

  return <HomeBuyingGuidesClient guides={guides} />;
}
