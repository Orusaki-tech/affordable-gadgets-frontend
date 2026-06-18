'use client';

import { BlogCard } from '@/components/BlogCard';
import { BlogArticlesCarousel } from '@/components/BlogArticlesCarousel';
import { useProductArticles } from '@/lib/hooks/useProductArticles';
import { getArticleHref } from '@/lib/utils/blogRoutes';
import { getArticleCardImageUrl } from '@/lib/blog/articlePage';

interface ProductBlogTabProps {
  productSlug?: string | null;
  productName?: string | null;
  hasPublishedArticle?: boolean;
}

export function ProductBlogTab({
  productSlug,
  productName,
  hasPublishedArticle,
}: ProductBlogTabProps) {
  const { data: articles, isLoading } = useProductArticles(
    hasPublishedArticle ? productSlug : null
  );

  if (!hasPublishedArticle) {
    return (
      <p className="product-detail__description-text">
        A dedicated blog article for {productName?.trim() || 'this product'} will appear here once
        published from the admin catalog.
      </p>
    );
  }

  if (isLoading) {
    return <p className="product-detail__description-text">Loading articles...</p>;
  }

  if (!articles?.length) {
    return (
      <p className="product-detail__description-text">
        Published guides for {productName?.trim() || 'this product'} will appear here soon.
      </p>
    );
  }

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

  return <BlogArticlesCarousel>{cards}</BlogArticlesCarousel>;
}
