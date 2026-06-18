"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticlesService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class ArticlesService {
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
    static articlesList(category, isPublished, ordering, page, product, search) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/articles/',
            query: {
                'category': category,
                'is_published': isPublished,
                'ordering': ordering,
                'page': page,
                'product': product,
                'search': search,
            },
        });
    }
    /**
     * CRUD for product buying guides / blog articles.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesCreate(formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/articles/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/articles/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/articles/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @param formData
     * @returns ProductArticle
     * @throws ApiError
     */
    static articlesPartialUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/articles/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * CRUD for product buying guides / blog articles.
     * @param id A unique integer value identifying this product article.
     * @returns void
     * @throws ApiError
     */
    static articlesDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/articles/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.ArticlesService = ArticlesService;
