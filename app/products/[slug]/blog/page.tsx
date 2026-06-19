import { notFound, redirect } from 'next/navigation';
import { fetchPrimaryArticle, fetchProductBySlug } from '@/lib/blog/articlePage';
import { permanentRedirectToCanonicalProductSlug } from '@/lib/seo/productSlugRedirect';
import { articlePath, productPath, resolveCanonicalProductSlug } from '@/lib/seo/urls';

interface ProductBlogRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductBlogRedirectPage({ params }: ProductBlogRedirectPageProps) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  permanentRedirectToCanonicalProductSlug(slug, product?.slug, '/blog');
  const canonicalSlug = resolveCanonicalProductSlug(slug, product?.slug);
  const article = await fetchPrimaryArticle(canonicalSlug);
  if (!article?.slug) {
    notFound();
  }
  redirect(articlePath(canonicalSlug, article.slug));
}
