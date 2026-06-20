import { redirect } from 'next/navigation';
import { buildArticlesPath } from '@/lib/blog/articleFilters';
import { ARTICLE_HUB_BY_SLUG } from '@/lib/blog/articleHubs';

interface ArticleHubRedirectProps {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Legacy SEO URLs like /articles/phones → /articles?type=PH */
export default async function ArticleHubRedirectPage({
  params,
  searchParams,
}: ArticleHubRedirectProps) {
  const { type } = await params;
  const sp = await searchParams;
  const hub = ARTICLE_HUB_BY_SLUG[type];

  if (!hub) {
    redirect('/articles');
  }

  redirect(
    buildArticlesPath({
      search: sp.search,
      brand: sp.brand,
      productType: hub.code,
    }),
  );
}
