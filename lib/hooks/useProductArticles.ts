import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';

export function useProductArticles(productSlug?: string | null) {
  return useQuery({
    queryKey: ['product-articles', productSlug],
    queryFn: () => ApiService.apiV1PublicProductsBySlugArticlesList(productSlug!),
    enabled: Boolean(productSlug),
    staleTime: 5 * 60 * 1000,
  });
}
