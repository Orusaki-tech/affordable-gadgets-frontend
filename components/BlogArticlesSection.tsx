import Link from 'next/link';
import { ApiService } from '@/lib/api/generated';
import type { PublicArticleCard } from '@/lib/api/generated';
import { BlogCard } from '@/components/BlogCard';
import { BlogArticlesCarousel } from '@/components/BlogArticlesCarousel';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import { getArticleCardImageUrl } from '@/lib/blog/articlePage';

interface BlogArticlesSectionProps {
  title?: string;
  pageSize?: number;
}

async function fetchArticles(pageSize: number): Promise<PublicArticleCard[]> {
  try {
    const response = await ApiService.apiV1PublicArticlesList(
      undefined,
      undefined,
      '-published_at',
      1,
      pageSize,
    );
    return response.results ?? [];
  } catch {
    return [];
  }
}

export async function BlogArticlesSection({
  title = 'Latest articles',
  pageSize = 8,
}: BlogArticlesSectionProps) {
  const articles = await fetchArticles(pageSize);
  if (!articles.length) return null;

  const cards = articles
    .map((article) => {
      const href = getArticleHref(article.product_slug, article.slug);
      if (!href || !article.headline) return null;
      return (
        <div key={`${article.product_slug}-${article.slug}`} className="blog-articles-section__slide">
          <BlogCard
            imageUrl={getArticleCardImageUrl(article)}
            category={article.category || 'buying_guide'}
            title={article.headline}
            href={href}
          />
        </div>
      );
    })
    .filter(Boolean);

  if (!cards.length) return null;

  return (
    <section className="blog-articles-section" aria-label={title}>
      <div className="blog-articles-section__inner">
        <div className="blog-articles-section__header">
          <h2 className="blog-articles-section__title">{title}</h2>
        </div>
        <div className="blog-articles-section__carousel">
          <BlogArticlesCarousel>{cards}</BlogArticlesCarousel>
        </div>
        <div className="blog-articles-section__footer">
          <Link href="/articles" className="blog-articles-section__read-more">
            Read more
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
