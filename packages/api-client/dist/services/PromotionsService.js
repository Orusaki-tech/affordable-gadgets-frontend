"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsService = void 0;
const OpenAPI_1 = require("../core/OpenAPI");
const request_1 = require("../core/request");
class PromotionsService {
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param page A page number within the paginated result set.
     * @returns PaginatedPromotionList
     * @throws ApiError
     */
    static promotionsList(page) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/promotions/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param formData
     * @returns Promotion
     * @throws ApiError
     */
    static promotionsCreate(formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'POST',
            url: '/promotions/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this promotion.
     * @returns Promotion
     * @throws ApiError
     */
    static promotionsRetrieve(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'GET',
            url: '/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this promotion.
     * @param formData
     * @returns Promotion
     * @throws ApiError
     */
    static promotionsUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PUT',
            url: '/promotions/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this promotion.
     * @param formData
     * @returns Promotion
     * @throws ApiError
     */
    static promotionsPartialUpdate(id, formData) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'PATCH',
            url: '/promotions/{id}/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Promotion management ViewSet (admin and marketing managers).
     * @param id A unique integer value identifying this promotion.
     * @returns void
     * @throws ApiError
     */
    static promotionsDestroy(id) {
        return (0, request_1.request)(OpenAPI_1.OpenAPI, {
            method: 'DELETE',
            url: '/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
}
exports.PromotionsService = PromotionsService;
