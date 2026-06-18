import { notFound, redirect } from 'next/navigation';
import { fetchPrimaryArticle } from '@/lib/blog/articlePage';

interface ProductBlogRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductBlogRedirectPage({ params }: ProductBlogRedirectPageProps) {
  const { slug } = await params;
  const article = await fetchPrimaryArticle(slug);
  if (!article?.slug) {
    notFound();
  }
  redirect(`/products/${slug}/blog/${article.slug}`);
}
