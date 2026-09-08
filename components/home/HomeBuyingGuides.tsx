import Link from 'next/link';
import { CloudinaryImage } from '@/components/CloudinaryImage';
import { MaterialIcon } from '@/components/MaterialIcon';
import { fetchFeaturedArticles, getArticleCardImageUrl } from '@/lib/blog/articlePage';
import { getArticleHref } from '@/lib/utils/blogRoutes';

export async function HomeBuyingGuides() {
  const articles = await fetchFeaturedArticles();
  if (!articles.length) return null;

  const guides = articles
    .map((article) => {
      const href = getArticleHref(article.product_slug, article.slug);
      if (!href || !article.headline) return null;
      return {
        key: `${article.product_slug}-${article.slug}`,
        href,
        title: article.headline,
        imageUrl: getArticleCardImageUrl(article),
        category: article.category || 'Guide',
      };
    })
    .filter(Boolean)
    .slice(0, 3) as Array<{
    key: string;
    href: string;
    title: string;
    imageUrl: string | null;
    category: string;
  }>;

  if (!guides.length) return null;

  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 lg:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Tech Knowledge Hub
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            Tech Buying Guides &amp; Insights
          </h2>
        </div>
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          Read All Articles
          <MaterialIcon name="chevron_right" className="text-[18px]" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {guides.map((guide) => (
          <Link
            key={guide.key}
            href={guide.href}
            className="group overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-surface-muted">
              {guide.imageUrl ? (
                <CloudinaryImage
                  src={guide.imageUrl}
                  alt={guide.title}
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <MaterialIcon name="article" className="text-[40px] text-text-muted" />
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                {guide.category}
              </p>
              <h3 className="mt-1 line-clamp-2 text-base font-bold text-primary">{guide.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
