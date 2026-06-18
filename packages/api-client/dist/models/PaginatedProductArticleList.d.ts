import type { ProductArticle } from './ProductArticle';
export type PaginatedProductArticleList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<ProductArticle>;
};
