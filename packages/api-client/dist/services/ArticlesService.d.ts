import type { PaginatedProductArticleList } from '../models/PaginatedProductArticleList';
import type { PatchedProductArticleRequest } from '../models/PatchedProductArticleRequest';
import type { ProductArticle } from '../models/ProductArticle';
import type { ProductArticleRequest } from '../models/ProductArticleRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
export declare class ArticlesService {
    /**
     * CRUD for product buying guides / blog articles.
     * @param category * `buying_guide` - Buying Guide
     * * `history_guide` - History Guide
     * * `informational_guide` - Informational Guide
     * * `tech_tip` - Tech Tip
     * * `news` - News
     * * `general` - General
     * @param isPublished
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param product
     * @param search A search term.
     * @returns PaginatedProductArticleList
     * @throws ApiError
     */
    static articlesList(category?: 'buying_guide' | 'general' | 'history_guide' | 'informational_guide' | 'news' | 'tech_tip', isPublished?: boolean, ordering?: string, page?: number, product?: number, search?: string): CancelablePromise<PaginatedProductArticleList>;
    /**
     * CRUD for product buying guides / blog articles.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesCreate(formData?: ProductArticleRequest): CancelablePromise<ProductArticle>;
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesRetrieve(id: number): CancelablePromise<ProductArticle>;
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesUpdate(id: number, formData?: ProductArticleRequest): CancelablePromise<ProductArticle>;
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesPartialUpdate(id: number, formData?: PatchedProductArticleRequest): CancelablePromise<ProductArticle>;
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @returns void
     * @throws ApiError
     */
    static articlesDestroy(id: number): CancelablePromise<void>;
}
