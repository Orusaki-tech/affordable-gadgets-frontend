import Link from 'next/link';
import { BlogCard } from '@/components/BlogCard';
import { BlogArticlesCarousel } from '@/components/BlogArticlesCarousel';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import { fetchFeaturedArticles, getArticleCardImageUrl } from '@/lib/blog/articlePage';

interface BlogArticlesSectionProps {
  title?: string;
}

export async function BlogArticlesSection({
  title = "What's New",
}: BlogArticlesSectionProps) {
  const articles = await fetchFeaturedArticles();
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
