import type { PublicArticleCard } from './PublicArticleCard';
export type PaginatedPublicArticleCardList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<PublicArticleCard>;
};
