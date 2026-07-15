import { permanentRedirect, redirect } from 'next/navigation';
import { fetchPrimaryArticle, fetchProductBySlug } from '@/lib/blog/articlePage';
import { permanentRedirectToCanonicalProductSlug } from '@/lib/seo/productSlugRedirect';
import { articlePath, productPath, resolveCanonicalProductSlug } from '@/lib/seo/urls';

interface ProductBlogRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductBlogRedirectPage({ params }: ProductBlogRedirectPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) {
    redirect('/articles');
  }
  permanentRedirectToCanonicalProductSlug(slug, product.slug, '/blog');
  const canonicalSlug = resolveCanonicalProductSlug(slug, product?.slug);
  const article = await fetchPrimaryArticle(canonicalSlug);
  // Prefer a primary article; otherwise send crawlers to the product page
  // instead of a noindex 404 for empty /blog hubs.
  if (!article?.slug) {
    permanentRedirect(productPath(canonicalSlug));
  } else {
    redirect(articlePath(canonicalSlug, article.slug));
  }
}
