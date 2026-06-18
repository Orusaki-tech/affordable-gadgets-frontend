import type { CategoryEnum } from '@/lib/api/generated';

export const CATEGORY_LABELS: Record<CategoryEnum | string, string> = {
  buying_guide: 'Buying Guide',
  history_guide: 'History Guide',
  informational_guide: 'Informational Guide',
  tech_tip: 'Tech Tip',
  news: 'News',
  general: 'General',
};

export function formatArticleCategory(category?: string | null): string {
  if (!category) return 'Buying Guide';
  return CATEGORY_LABELS[category] || category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
