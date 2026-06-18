import { useQuery } from '@tanstack/react-query';
import { ApiService } from '@/lib/api/generated';
import type { PublicArticleCard } from '@/lib/api/generated';

export function useProductArticles(productSlug?: string | null) {
  return useQuery<PublicArticleCard[]>({
    queryKey: ['product-articles', productSlug],
    queryFn: async () => {
      const response = await ApiService.apiV1PublicProductsBySlugArticlesList(productSlug!);
      return response.results ?? [];
    },
    enabled: Boolean(productSlug),
    staleTime: 5 * 60 * 1000,
  });
}
