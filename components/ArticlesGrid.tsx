import { BlogCard } from '@/components/BlogCard';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import { getArticleCardImageUrl } from '@/lib/blog/articlePage';
import type { PublicArticleCard } from '@/lib/api/generated';

interface Props {
  articles: PublicArticleCard[];
}

export function ArticlesGrid({ articles }: Props) {
  if (!articles.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {articles.map((article) => {
        const href = getArticleHref(article.product_slug, article.slug);
        if (!href || !article.headline) return null;
        return (
          <BlogCard
            key={`${article.product_slug}-${article.slug}`}
            imageUrl={getArticleCardImageUrl(article)}
            category={article.category || 'buying_guide'}
            title={article.headline}
            href={href}
          />
        );
      })}
    </div>
  );
}
